<?php

declare(strict_types=1);

namespace App\Application\Actions\Slide;

use App\Application\Actions\Action;
use App\Domain\Project\NavigationLinkRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class DeleteNavigationLinkAction extends Action
{
    private NavigationLinkRepositoryInterface $navigationLinkRepository;

    public function __construct(
        LoggerInterface $logger,
        NavigationLinkRepositoryInterface $navigationLinkRepository
    ) {
        parent::__construct($logger);
        $this->navigationLinkRepository = $navigationLinkRepository;
    }

    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $id = (int) $this->resolveArg('id');
        $this->navigationLinkRepository->delete($id);

        return $this->respondWithData(['success' => true]);
    }
}
