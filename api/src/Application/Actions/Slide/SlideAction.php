<?php

declare(strict_types=1);

namespace App\Application\Actions\Slide;

use App\Application\Actions\Action;
use App\Domain\Project\SlideRepositoryInterface;
use Psr\Log\LoggerInterface;

abstract class SlideAction extends Action
{
    protected SlideRepositoryInterface $slideRepository;

    public function __construct(LoggerInterface $logger, SlideRepositoryInterface $slideRepository)
    {
        parent::__construct($logger);
        $this->slideRepository = $slideRepository;
    }
}
