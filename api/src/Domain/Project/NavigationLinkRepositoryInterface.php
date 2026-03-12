<?php

declare(strict_types=1);

namespace App\Domain\Project;

interface NavigationLinkRepositoryInterface
{
    /**
     * @param int $slideId
     * @return NavigationLink[]
     */
    public function findBySlideId(int $slideId): array;

    /**
     * @param int $projectId
     * @return NavigationLink[]
     */
    public function findByProjectId(int $projectId): array;

    public function save(NavigationLink $navigationLink): NavigationLink;

    public function delete(int $id): void;
    
    public function findById(int $id): ?NavigationLink;
}
