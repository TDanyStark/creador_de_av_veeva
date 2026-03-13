<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Domain\Project\SlideRepositoryInterface;
use App\Domain\Project\ProjectRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Exception;

class ReorderSlidesAction extends ProjectAction
{
    private SlideRepositoryInterface $slideRepository;

    public function __construct(
        LoggerInterface $logger,
        ProjectRepositoryInterface $projectRepository,
        SlideRepositoryInterface $slideRepository
    ) {
        parent::__construct($logger, $projectRepository);
        $this->slideRepository = $slideRepository;
    }

    protected function action(): Response
    {
        $projectId = (int) $this->resolveArg('id');
        $body = $this->request->getParsedBody();
        $newOrderIds = $body['order'] ?? [];

        if (empty($newOrderIds)) {
            return $this->respondWithError('Falta el nuevo orden de slides.', 400);
        }

        try {
            $project = $this->projectRepository->findById($projectId);
            if (!$project) {
                return $this->respondWithError('Proyecto no encontrado.', 404);
            }

            $currentSlides = $this->slideRepository->findByProjectId($projectId);
            $slidesMap = [];
            foreach ($currentSlides as $slide) {
                $slidesMap[$slide->getId()] = $slide;
            }

            $uploadDir = __DIR__ . '/../../../../public/uploads/projects/' . $projectId . '/';

            // 1. Rename to temp names to avoid conflicts during renaming
            foreach ($newOrderIds as $index => $id) {
                if (isset($slidesMap[$id])) {
                    $slide = $slidesMap[$id];
                    $oldPath = __DIR__ . '/../../../../public/' . $slide->getImagePath();
                    $extension = pathinfo($oldPath, PATHINFO_EXTENSION);
                    $tempPath = $uploadDir . 'temp_reorder_' . $index . '.' . $extension;
                    
                    if (file_exists($oldPath)) {
                        rename($oldPath, $tempPath);
                    }
                }
            }

            // 2. Update DB and rename to final names
            foreach ($newOrderIds as $index => $id) {
                if (isset($slidesMap[$id])) {
                    $slide = $slidesMap[$id];
                    $newSlideNumber = $index + 1;
                    $extension = pathinfo($slide->getImagePath(), PATHINFO_EXTENSION);
                    $newFilename = sprintf('slide_%02d.%s', $newSlideNumber, $extension);
                    $newImagePath = 'uploads/projects/' . $projectId . '/' . $newFilename;
                    
                    $tempPath = $uploadDir . 'temp_reorder_' . $index . '.' . $extension;
                    $finalPath = $uploadDir . $newFilename;

                    if (file_exists($tempPath)) {
                        rename($tempPath, $finalPath);
                    }

                    $slide->setSlideNumber($newSlideNumber);
                    $slide->setImagePath($newImagePath);
                    $this->slideRepository->update($slide);
                }
            }

            return $this->respondWithData([
                'success' => true,
                'message' => 'Slides reordenados correctamente.'
            ]);

        } catch (Exception $e) {
            $this->logger->error('Error reordering slides: ' . $e->getMessage());
            return $this->respondWithError('Error al reordenar slides: ' . $e->getMessage(), 500);
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
