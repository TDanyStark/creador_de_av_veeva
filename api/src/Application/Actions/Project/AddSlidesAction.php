<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Domain\Project\Slide;
use App\Domain\Project\SlideRepositoryInterface;
use App\Domain\Project\ProjectRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Psr7\UploadedFile;
use Exception;

class AddSlidesAction extends ProjectAction
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
        $uploadedFiles = $this->request->getUploadedFiles();
        
        $files = $uploadedFiles['slides'] ?? [];
        if (!is_array($files)) {
            $files = [$files];
        }

        if (empty($files)) {
            return $this->respondWithError('No se subieron imágenes.', 400);
        }

        try {
            $project = $this->projectRepository->findById($projectId);
            if (!$project) {
                return $this->respondWithError('Proyecto no encontrado.', 404);
            }

            $currentSlides = $this->slideRepository->findByProjectId($projectId);
            $lastSlideNumber = 0;
            foreach ($currentSlides as $s) {
                if ($s->getSlideNumber() > $lastSlideNumber) {
                    $lastSlideNumber = $s->getSlideNumber();
                }
            }

            $uploadedSlides = [];
            $uploadDir = __DIR__ . '/../../../../public/uploads/projects/' . $projectId . '/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            foreach ($files as $index => $file) {
                if ($file->getError() === UPLOAD_ERR_OK) {
                    $lastSlideNumber++;
                    $extension = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
                    $filename = sprintf('slide_%02d.%s', $lastSlideNumber, $extension);
                    
                    // To avoid overwriting if the file exists
                    while (file_exists($uploadDir . $filename)) {
                        $lastSlideNumber++;
                        $filename = sprintf('slide_%02d.%s', $lastSlideNumber, $extension);
                    }

                    $file->moveTo($uploadDir . $filename);
                    $imagePath = 'uploads/projects/' . $projectId . '/' . $filename;

                    $slide = new Slide(null, $projectId, $lastSlideNumber, $imagePath);
                    $uploadedSlides[] = $this->slideRepository->save($slide);
                }
            }

            return $this->respondWithData([
                'success' => true,
                'message' => 'Slides agregados correctamente.',
                'slides' => $uploadedSlides
            ], 201);

        } catch (Exception $e) {
            $this->logger->error('Error adding slides: ' . $e->getMessage());
            return $this->respondWithError('Error al agregar slides: ' . $e->getMessage(), 500);
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
