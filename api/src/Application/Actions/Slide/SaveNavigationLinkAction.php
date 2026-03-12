<?php

declare(strict_types=1);

namespace App\Application\Actions\Slide;

use App\Domain\Project\NavigationLink;
use App\Domain\Project\NavigationLinkRepositoryInterface;
use App\Domain\Project\SlideRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class SaveNavigationLinkAction extends SlideAction
{
    private NavigationLinkRepositoryInterface $navigationLinkRepository;

    public function __construct(
        LoggerInterface $logger,
        SlideRepositoryInterface $slideRepository,
        NavigationLinkRepositoryInterface $navigationLinkRepository
    ) {
        parent::__construct($logger, $slideRepository);
        $this->navigationLinkRepository = $navigationLinkRepository;
    }

    /**
     * {@inheritdoc}
     */
    protected function action(): Response
    {
        $slideId = (int) $this->resolveArg('id');
        $data = $this->getFormData();

        $linkId = isset($data['id']) ? (int) $data['id'] : null;
        $targetSlideId = isset($data['targetSlideId']) ? (int) $data['targetSlideId'] : null;
        
        $link = new NavigationLink(
            $linkId,
            $slideId,
            $targetSlideId,
            (float) $data['topPercent'],
            (float) $data['leftPercent'],
            (float) $data['widthPercent'],
            (float) $data['heightPercent']
        );

        $savedLink = $this->navigationLinkRepository->save($link);

        return $this->respondWithData($savedLink);
    }
}
