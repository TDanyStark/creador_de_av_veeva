<?php

declare(strict_types=1);

namespace App\Infrastructure\Services;

use Imagick;
use Exception;

class PdfToImageService
{
    private string $uploadDir;

    public function __construct(string $uploadDir)
    {
        $this->uploadDir = $uploadDir;
    }

    /**
     * @param string $pdfPath
     * @param int $projectId
     * @return string[] Array of image paths
     * @throws Exception
     */
    public function convert(string $pdfPath, int $projectId): array
    {
        if (!class_exists('Imagick')) {
            throw new Exception('Imagick extension is not installed.');
        }

        $projectDir = $this->uploadDir . DIRECTORY_SEPARATOR . $projectId;
        if (!is_dir($projectDir)) {
            mkdir($projectDir, 0777, true);
        }

        $imagick = new Imagick();
        // Set resolution for better quality
        $imagick->setResolution(150, 150);
        $imagick->readImage($pdfPath);

        $imagePaths = [];
        foreach ($imagick as $i => $page) {
            $page->setImageFormat('jpg');
            $page->setImageCompressionQuality(90);
            
            $filename = 'slide_' . str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) . '.jpg';
            $fullPath = $projectDir . DIRECTORY_SEPARATOR . $filename;
            
            $page->writeImage($fullPath);
            
            // Return relative path for storage in DB
            $imagePaths[] = 'uploads/projects/' . $projectId . '/' . $filename;
        }

        $imagick->clear();
        $imagick->destroy();

        return $imagePaths;
    }
}
