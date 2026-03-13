<?php

declare(strict_types=1);

namespace App\Infrastructure\Services;

use ZipArchive;
use RuntimeException;
use App\Domain\Project\Slide;
use App\Domain\Project\NavigationLink;
use App\Domain\Project\Popup;

class ProjectExporterService
{
    private string $exportsDir;
    private string $publicDir;

    public function __construct(string $exportsDir, string $publicDir)
    {
        $this->exportsDir = $exportsDir;
        $this->publicDir = $publicDir;

        if (!is_dir($this->exportsDir)) {
            mkdir($this->exportsDir, 0755, true);
        }
    }

    public function export(array $projectArr, array $slidesArr, array $linksArr, array $popupsArr): array
    {
        $projectId = $projectArr['id'] ?? 'unknown';
        $projectName = $projectArr['name'] ?? 'project';
        $safeProjectName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $projectName);
        
        $tempDir = $this->exportsDir . '/tmp_project_' . $projectId . '_' . time();
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $masterZipPath = $this->exportsDir . '/' . "{$safeProjectName}_" . time() . '.zip';

        $slideZips = [];

        foreach ($slidesArr as $slide) {
            $slideId = $slide['id'];
            $slideNumber = str_pad((string)$slide['slide_number'], 2, '0', STR_PAD_LEFT);
            $slideName = "slide_{$slideNumber}"; // e.g. slide_01

            // Create slide structure
            $slideDir = $tempDir . '/' . $slideName;
            mkdir($slideDir, 0755, true);
            mkdir($slideDir . '/css', 0755, true);
            mkdir($slideDir . '/js', 0755, true);
            mkdir($slideDir . '/images', 0755, true);

            // Copy base slide image
            $sourceImagePath = $this->publicDir . $slide['image_path'];
            $distImagePath = $slideDir . '/images/bg.jpg';
            if (file_exists($sourceImagePath)) {
                copy($sourceImagePath, $distImagePath);
                $this->createThumbnail($sourceImagePath, $slideDir . '/thumb.png', 200, 150);
            }

            // Filter links and popups for this slide
            $slideLinks = array_filter($linksArr, fn($l) => $l['slideId'] === $slideId);
            $slidePopups = array_filter($popupsArr, fn($p) => $p['slideId'] === $slideId);

            // Fetch target slides to get the slide name for veeva:gotoSlide()
            $linksWithTargetName = [];
            foreach ($slideLinks as $link) {
                $targetSlide = array_filter($slidesArr, fn($s) => $s['id'] === $link['targetSlideId']);
                $targetSlide = reset($targetSlide);
                if ($targetSlide) {
                    $targetSlideNumber = str_pad((string)$targetSlide['slideNumber'], 2, '0', STR_PAD_LEFT);
                    $targetSlideName = "slide_{$targetSlideNumber}";
                    $link['target_slide_name'] = $targetSlideName;
                    $linksWithTargetName[] = $link;
                }
            }

            // Also copy popup images
            foreach ($slidePopups as $popup) {
                $popupImgPath = $this->publicDir . $popup['imagePath'];
                $popupFilename = basename($popupImgPath);
                $distPopupPath = $slideDir . '/images/' . $popupFilename;
                if (file_exists($popupImgPath)) {
                    copy($popupImgPath, $distPopupPath);
                }
            }

            // Generate files
            file_put_contents($slideDir . '/index.html', $this->generateHtml($slideName, $linksWithTargetName, $slidePopups));
            file_put_contents($slideDir . '/css/styles.css', $this->generateCss($slideName, $linksWithTargetName, $slidePopups));
            file_put_contents($slideDir . '/js/main.js', $this->generateJs());

            // Zip the slide
            $slideZipPath = $tempDir . '/' . $slideName . '.zip';
            $this->zipDirectory($slideDir, $slideZipPath, $slideName);
            $slideZips[] = $slideZipPath;
        }

        // Master zip
        $masterZip = new ZipArchive();
        if ($masterZip->open($masterZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            foreach ($slideZips as $zipPath) {
                $masterZip->addFile($zipPath, basename($zipPath));
            }
            $masterZip->close();
        } else {
            throw new RuntimeException("Could not create master project zip.");
        }

        // Cleanup temp dir
        $this->deleteDirectory($tempDir);

        // return array with absolute path and relative url
        $filename = basename($masterZipPath);
        return [
            'path' => $masterZipPath,
            'url' => '/api/public/exports/' . $filename
        ];
    }

    private function generateHtml(string $slideName, array $links, array $popups): string
    {
        $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>' . htmlspecialchars($slideName) . '</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="container">';

        // Links
        foreach ($links as $link) {
            $id = 'link_' . $link['id'];
            $targetUrl = 'veeva:gotoSlide(' . $link['target_slide_name'] . '.zip)';
            $html .= "\n        <a href=\"{$targetUrl}\" id=\"{$id}\" class=\"nav-link\"></a>";
        }

        // Popups
        foreach ($popups as $popup) {
            $triggerId = 'popup_trigger_' . $popup['id'];
            $overlayId = 'popup_overlay_' . $popup['id'];
            $closeId = 'popup_close_' . $popup['id'];
            $imgName = basename($popup['imagePath']);
            
            $exclusiveClass = $popup['exclusiveOpen'] ? ' exclusive' : '';

            $html .= "\n        <button id=\"{$triggerId}\" class=\"popup-trigger{$exclusiveClass}\" data-target=\"{$overlayId}\"></button>";
            $html .= "\n        <div id=\"{$overlayId}\" class=\"popup-overlay\">
            <div class=\"popup-content\">
                <img src=\"images/{$imgName}\" alt=\"Popup\">
                <button id=\"{$closeId}\" class=\"popup-close\" style=\"color: {$popup['closeColor']}\">&times;</button>
            </div>
        </div>";
        }

        $html .= '
    </div>
    <script src="js/main.js"></script>
</body>
</html>';

        return $html;
    }

    private function generateCss(string $slideName, array $links, array $popups): string
    {
        $css = "body, html { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background-color: #fff; }
#container { position: relative; width: 100vw; height: 100vh; background-image: url('../images/bg.jpg'); background-size: contain; background-repeat: no-repeat; background-position: center; }
.nav-link { position: absolute; display: block; z-index: 10; -webkit-tap-highlight-color: transparent; }
.popup-trigger { position: absolute; display: block; z-index: 20; background: transparent; border: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.popup-overlay { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 50; display: none; align-items: center; justify-content: center; }
.popup-content { position: relative; width: 80%; max-width: 1024px; }
.popup-content img { width: 100%; height: auto; display: block; }
.popup-close { position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 2rem; cursor: pointer; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
";

        foreach ($links as $link) {
            $id = '#link_' . $link['id'];
            $css .= "{$id} { top: {$link['topPercent']}%; left: {$link['leftPercent']}%; width: {$link['widthPercent']}%; height: {$link['heightPercent']}%; }\n";
        }

        foreach ($popups as $popup) {
            $triggerId = '#popup_trigger_' . $popup['id'];
            $css .= "{$triggerId} { top: {$popup['buttonTop']}%; left: {$popup['buttonLeft']}%; width: {$popup['buttonWidth']}%; height: {$popup['buttonHeight']}%; }\n";
            
            // Adjust popup position directly based on percentage
            $overlayId = '#popup_overlay_' . $popup['id'];
            $css .= "{$overlayId} .popup-content { width: {$popup['popupWidthPercent']}%; position: absolute; top: {$popup['popupTop']}%; left: {$popup['popupLeft']}%; transform: none; }\n";
        }

        return $css;
    }

    private function generateJs(): string
    {
        return "document.addEventListener('DOMContentLoaded', () => {
    const popups = document.querySelectorAll('.popup-overlay');
    const triggers = document.querySelectorAll('.popup-trigger');
    const closes = document.querySelectorAll('.popup-close');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-target');
            const target = document.getElementById(targetId);
            
            if (trigger.classList.contains('exclusive')) {
                popups.forEach(p => p.style.display = 'none');
            }
            
            if (target) {
                target.style.display = 'flex';
            }
        });
    });

    closes.forEach(close => {
        close.addEventListener('click', (e) => {
            e.target.closest('.popup-overlay').style.display = 'none';
        });
    });

    // Optional: click outside popup content to close
    popups.forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.style.display = 'none';
            }
        });
    });
});
";
    }

    private function createThumbnail(string $sourcePath, string $destPath, int $width, int $height): void
    {
        if (!extension_loaded('imagick') && !function_exists('imagecreatefromjpeg')) {
            // Fallback: just copy original if no imaging lib
            copy($sourcePath, $destPath);
            return;
        }

        if (extension_loaded('imagick')) {
            try {
                $image = new \Imagick($sourcePath);
                $image->thumbnailImage($width, $height, true, true);
                $image->writeImage($destPath);
                return;
            } catch (\Exception $e) {
                // Ignore fallback
            }
        }

        // GD fallback (simplified for JPEG)
        list($origW, $origH, $type) = getimagesize($sourcePath);
        $sourceImage = null;

        switch ($type) {
            case IMAGETYPE_JPEG:
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
        }

        if ($sourceImage) {
            $thumbnail = imagecreatetruecolor($width, $height);
            // White background 
            $white = imagecolorallocate($thumbnail, 255, 255, 255);
            imagefill($thumbnail, 0, 0, $white);
            
            // Calculate ratio
            $ratio = min($width / $origW, $height / $origH);
            $newW = (int)($origW * $ratio);
            $newH = (int)($origH * $ratio);
            $dstX = (int)(($width - $newW) / 2);
            $dstY = (int)(($height - $newH) / 2);

            imagecopyresampled($thumbnail, $sourceImage, $dstX, $dstY, 0, 0, $newW, $newH, $origW, $origH);
            imagepng($thumbnail, $destPath);
            imagedestroy($sourceImage);
            imagedestroy($thumbnail);
        } else {
            copy($sourcePath, $destPath);
        }
    }

    private function zipDirectory(string $sourceDir, string $outZipPath, string $baseFolder): void
    {
        $zip = new ZipArchive();
        if ($zip->open($outZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($sourceDir),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $name => $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = $baseFolder . '/' . substr($filePath, strlen($sourceDir) + 1);
                    $relativePath = str_replace('\\', '/', $relativePath); // windows compat
                    $zip->addFile($filePath, $relativePath);
                }
            }
            $zip->close();
        } else {
            throw new RuntimeException("Could not create zip $outZipPath.");
        }
    }

    private function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = "$dir/$file";
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
