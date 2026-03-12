<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Project;

use App\Domain\Project\Project;
use App\Domain\Project\ProjectRepositoryInterface;
use PDO;

class ProjectRepository implements ProjectRepositoryInterface
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function findByUserIdPaginated(int $userId, int $limit, int $offset): array
    {
        $stmt = $this->connection->prepare("
            SELECT * FROM projects 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $projects = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $projects[] = new Project(
                (int)$row['id'],
                (int)$row['user_id'],
                $row['name'],
                $row['created_at'],
                $row['updated_at']
            );
        }

        return $projects;
    }

    public function countByUserId(int $userId): int
    {
        $stmt = $this->connection->prepare("SELECT COUNT(*) FROM projects WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        return (int)$stmt->fetchColumn();
    }

    public function save(Project $project): Project
    {
        if ($project->getId() === null) {
            $stmt = $this->connection->prepare("
                INSERT INTO projects (user_id, name) 
                VALUES (:user_id, :name)
            ");
            $stmt->execute([
                ':user_id' => $project->getUserId(),
                ':name' => $project->getName(),
            ]);
            
            $id = (int)$this->connection->lastInsertId();
            return $this->findById($id);
        } else {
            $stmt = $this->connection->prepare("
                UPDATE projects 
                SET name = :name 
                WHERE id = :id
            ");
            $stmt->execute([
                ':name' => $project->getName(),
                ':id' => $project->getId(),
            ]);
            return $project;
        }
    }

    public function findById(int $id): ?Project
    {
        $stmt = $this->connection->prepare("SELECT * FROM projects WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Project(
            (int)$row['id'],
            (int)$row['user_id'],
            $row['name'],
            $row['created_at'],
            $row['updated_at']
        );
    }
}
