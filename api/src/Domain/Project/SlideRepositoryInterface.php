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
     * @param int $id
     * @return Slide|null
     */
    public function findById(int $id): ?Slide;

    /**
     * @param Slide $slide
     * @return Slide
     */
    public function save(Slide $slide): Slide;

    /**
     * @param Slide $slide
     * @return void
     */
    public function update(Slide $slide): void;

    /**
     * @param int $id
     * @return void
     */
    public function delete(int $id): void;
}

