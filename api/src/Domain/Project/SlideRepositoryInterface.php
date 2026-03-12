<?php

declare(strict_types=1);

namespace App\Domain\Project;

interface SlideRepositoryInterface
{
    /**
     * @param int $projectId
     * @return Slide[]
     */
    public function findByProjectId(int $projectId): array;

    /**
     * @param Slide $slide
     * @return Slide
     */
    public function save(Slide $slide): Slide;
}
