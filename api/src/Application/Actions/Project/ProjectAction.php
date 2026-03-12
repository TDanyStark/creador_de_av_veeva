<?php

declare(strict_types=1);

namespace App\Application\Actions\Project;

use App\Application\Actions\Action;
use App\Domain\Project\ProjectRepositoryInterface;
use Psr\Log\LoggerInterface;

abstract class ProjectAction extends Action
{
    protected ProjectRepositoryInterface $projectRepository;

    public function __construct(LoggerInterface $logger, ProjectRepositoryInterface $projectRepository)
    {
        parent::__construct($logger);
        $this->projectRepository = $projectRepository;
    }
}
