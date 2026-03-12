<?php

declare(strict_types=1);

namespace App\Domain\Project;

interface ProjectRepositoryInterface
{
    /**
     * @param int $userId
     * @param int $limit
     * @param int $offset
     * @return Project[]
     */
    public function findByUserIdPaginated(int $userId, int $limit, int $offset): array;

    /**
     * @param int $userId
     * @return int
     */
    public function countByUserId(int $userId): int;

    /**
     * @param Project $project
     * @return Project
     */
    public function save(Project $project): Project;

    /**
     * @param int $id
     * @return Project|null
     */
    public function findById(int $id): ?Project;
}
