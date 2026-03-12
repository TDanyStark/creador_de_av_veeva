<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Domain\Project\ProjectRepositoryInterface;
use App\Domain\Project\SlideRepositoryInterface;
use App\Domain\Project\NavigationLinkRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class GetProjectEditorDataAction extends ProjectAction
{
    private SlideRepositoryInterface $slideRepository;
    private NavigationLinkRepositoryInterface $navigationLinkRepository;

    public function __construct(
        LoggerInterface $logger,
        ProjectRepositoryInterface $projectRepository,
        SlideRepositoryInterface $slideRepository,
        NavigationLinkRepositoryInterface $navigationLinkRepository
    ) {
        parent::__construct($logger, $projectRepository);
        $this->slideRepository = $slideRepository;
        $this->navigationLinkRepository = $navigationLinkRepository;
    }

    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $projectId = (int) $this->resolveArg('id');
        
        // In a real app, we should check if the project belongs to the user
        // $userId = (int) $this->request->getAttribute('user_id');
        // $project = $this->projectRepository->findById($projectId);
        // if ($project->getUserId() !== $userId) { throw new ForbiddenException(); }

        $project = $this->projectRepository->findById($projectId);
        if (!$project) {
            return $this->respondWithError('Proyecto no encontrado', 404);
        }

        $slides = $this->slideRepository->findByProjectId($projectId);
        $links = $this->navigationLinkRepository->findByProjectId($projectId);

        return $this->respondWithData([
            'project' => $project,
            'slides' => $slides,
            'navigationLinks' => $links
        ]);
    }

    private function respondWithError(string $message, int $statusCode = 400): Response
    {
        return $this->respondWithData([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}
