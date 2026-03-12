<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Domain\Project\Project;
use App\Domain\Project\ProjectRepositoryInterface;
use App\Domain\Project\Slide;
use App\Domain\Project\SlideRepositoryInterface;
use App\Infrastructure\Services\PdfToImageService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Psr7\UploadedFile;
use Exception;

class CreateProjectAction extends ProjectAction
{
    private SlideRepositoryInterface $slideRepository;
    private PdfToImageService $pdfService;

    public function __construct(
        LoggerInterface $logger,
        ProjectRepositoryInterface $projectRepository,
        SlideRepositoryInterface $slideRepository,
        PdfToImageService $pdfService
    ) {
        parent::__construct($logger, $projectRepository);
        $this->slideRepository = $slideRepository;
        $this->pdfService = $pdfService;
    }

    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $userId = (int) $this->request->getAttribute('user_id');
        $uploadedFiles = $this->request->getUploadedFiles();
        $body = $this->request->getParsedBody();

        $projectName = $body['name'] ?? 'Proyecto sin nombre';
        $pdfFile = $uploadedFiles['pdf'] ?? null;

        if (!$pdfFile || $pdfFile->getError() !== UPLOAD_ERR_OK) {
            return $this->respondWithError('Error al subir el archivo PDF.', 400);
        }

        try {
            // 1. Create Project
            $project = new Project(null, $userId, $projectName);
            $project = $this->projectRepository->save($project);

            // 2. Process PDF
            $tempPath = $this->moveUploadedFile($pdfFile);
            $imagePaths = $this->pdfService->convert($tempPath, $project->getId());
            
            // Clean up temp file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            // 3. Save Slides
            foreach ($imagePaths as $index => $path) {
                $slide = new Slide(null, $project->getId(), $index + 1, $path);
                $this->slideRepository->save($slide);
            }

            return $this->respondWithData([
                'project' => $project,
                'slides_count' => count($imagePaths)
            ], 201);

        } catch (Exception $e) {
            $this->logger->error('Error creating project: ' . $e->getMessage());
            return $this->respondWithError('Error al procesar el proyecto: ' . $e->getMessage(), 500);
        }
    }

    private function moveUploadedFile(UploadedFile $uploadedFile): string
    {
        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $basename = bin2hex(random_bytes(8));
        $filename = sprintf('%s.%0.8s', $basename, $extension);

        $directory = sys_get_temp_dir();
        $path = $directory . DIRECTORY_SEPARATOR . $filename;

        $uploadedFile->moveTo($path);

        return $path;
    }

    private function respondWithError(string $message, int $statusCode = 400): Response
    {
        return $this->respondWithData([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}
