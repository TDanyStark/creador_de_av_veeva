<?php

declare(strict_types=1);

namespace App\Application\Actions\Slide;

use App\Domain\Project\SlideRepositoryInterface;
use App\Domain\Project\NavigationLinkRepositoryInterface;
use App\Domain\Project\PopupRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Exception;

class DeleteSlideAction extends SlideAction
{
    private NavigationLinkRepositoryInterface $navigationLinkRepository;
    private PopupRepositoryInterface $popupRepository;

    public function __construct(
        LoggerInterface $logger,
        SlideRepositoryInterface $slideRepository,
        NavigationLinkRepositoryInterface $navigationLinkRepository,
        PopupRepositoryInterface $popupRepository
    ) {
        parent::__construct($logger, $slideRepository);
        $this->navigationLinkRepository = $navigationLinkRepository;
        $this->popupRepository = $popupRepository;
    }

    protected function action(): Response
    {
        $slideId = (int) $this->resolveArg('id');

        try {
            $slide = $this->slideRepository->findById($slideId);
            if (!$slide) {
                return $this->respondWithError('Slide no encontrado.', 404);
            }

            // 1. Delete associated popups (and their images)
            $popups = $this->popupRepository->findBySlideId($slideId);
            foreach ($popups as $popup) {
                if ($popup->getImagePath()) {
                    $popupImagePath = __DIR__ . '/../../../../public/' . $popup->getImagePath();
                    if (file_exists($popupImagePath)) {
                        unlink($popupImagePath);
                    }
                }
                $this->popupRepository->delete($popup->getId());
            }

            // 2. Delete navigation links (origin)
            $this->navigationLinkRepository->deleteBySlideId($slideId);

            // 3. Handle navigation links (destination)
            $this->navigationLinkRepository->deleteByTargetSlideId($slideId);

            // 4. Delete slide file
            $slidePath = __DIR__ . '/../../../../public/' . $slide->getImagePath();
            if (file_exists($slidePath)) {
                unlink($slidePath);
            }

            // 5. Delete slide from DB
            $this->slideRepository->delete($slideId);

            // 6. Re-sequence and rename remaining slides
            $projectId = $slide->getProjectId();
            $remainingSlides = $this->slideRepository->findByProjectId($projectId);
            
            $uploadDir = __DIR__ . '/../../../../public/uploads/projects/' . $projectId . '/';
            
            // First rename all remaining to temp to avoid conflicts
            foreach ($remainingSlides as $index => $s) {
                $oldPath = __DIR__ . '/../../../../public/' . $s->getImagePath();
                if (file_exists($oldPath)) {
                    $extension = pathinfo($oldPath, PATHINFO_EXTENSION);
                    $tempPath = $uploadDir . 'temp_del_seq_' . $index . '.' . $extension;
                    rename($oldPath, $tempPath);
                }
            }
            
            // Now rename to final sequence and update DB
            foreach ($remainingSlides as $index => $s) {
                $newSlideNumber = $index + 1;
                $extension = pathinfo($s->getImagePath(), PATHINFO_EXTENSION);
                $newFilename = sprintf('slide_%02d.%s', $newSlideNumber, $extension);
                $newImagePath = 'uploads/projects/' . $projectId . '/' . $newFilename;
                
                $tempPath = $uploadDir . 'temp_del_seq_' . $index . '.' . $extension;
                $finalPath = $uploadDir . $newFilename;

                if (file_exists($tempPath)) {
                    rename($tempPath, $finalPath);
                }

                $s->setSlideNumber($newSlideNumber);
                $s->setImagePath($newImagePath);
                $this->slideRepository->update($s);
            }

            return $this->respondWithData([
                'success' => true,
                'message' => 'Slide eliminado y proyecto resecuenciado correctamente.'
            ]);


        } catch (Exception $e) {
            $this->logger->error('Error deleting slide: ' . $e->getMessage());
            return $this->respondWithError('Error al eliminar el slide: ' . $e->getMessage(), 500);
        }
    }

    private function respondWithError(string $message, int $statusCode = 400): Response
    {
        return $this->respondWithData([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}
