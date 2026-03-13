<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Domain\Project\ProjectRepositoryInterface;
use App\Domain\Project\SlideRepositoryInterface;
use App\Domain\Project\NavigationLinkRepositoryInterface;
use App\Domain\Project\PopupRepositoryInterface;
use App\Infrastructure\Services\ProjectExporterService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class ExportProjectAction extends ProjectAction
{
    private SlideRepositoryInterface $slideRepository;
    private NavigationLinkRepositoryInterface $linkRepository;
    private PopupRepositoryInterface $popupRepository;
    private ProjectExporterService $exporterService;

    public function __construct(
        LoggerInterface $logger,
        ProjectRepositoryInterface $projectRepository,
        SlideRepositoryInterface $slideRepository,
        NavigationLinkRepositoryInterface $linkRepository,
        PopupRepositoryInterface $popupRepository,
        ProjectExporterService $exporterService
    ) {
        parent::__construct($logger, $projectRepository);
        $this->slideRepository = $slideRepository;
        $this->linkRepository = $linkRepository;
        $this->popupRepository = $popupRepository;
        $this->exporterService = $exporterService;
    }

    protected function action(): Response
    {
        $projectId = (int) $this->resolveArg('id');
        
        $project = $this->projectRepository->findById($projectId);
        if (!$project) {
            return $this->respondWithError('Proyecto no encontrado', 404);
        }

        $slides = $this->slideRepository->findByProjectId($projectId);
        $links = $this->linkRepository->findByProjectId($projectId);
        $popups = $this->popupRepository->findByProjectId($projectId);

        try {
            $exportResult = $this->exporterService->export(
                $project->jsonSerialize(),
                array_map(fn($s) => $s->jsonSerialize(), $slides),
                array_map(fn($l) => $l->jsonSerialize(), $links),
                array_map(fn($p) => $p->jsonSerialize(), $popups)
            );

            return $this->respondWithData([
                'success' => true,
                'url' => $exportResult['url'],
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Export failed: ' . $e->getMessage());
            return $this->respondWithError('Error al exportar el proyecto: ' . $e->getMessage(), 500);
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
