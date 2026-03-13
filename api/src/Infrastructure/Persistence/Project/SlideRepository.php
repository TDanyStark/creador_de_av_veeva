<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Project;

use App\Domain\Project\Slide;
use App\Domain\Project\SlideRepositoryInterface;
use PDO;

class SlideRepository implements SlideRepositoryInterface
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function findByProjectId(int $projectId): array
    {
        $stmt = $this->connection->prepare("
            SELECT * FROM slides 
            WHERE project_id = :project_id 
            ORDER BY slide_number ASC
        ");
        $stmt->execute([':project_id' => $projectId]);

        $slides = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $slides[] = new Slide(
                (int)$row['id'],
                (int)$row['project_id'],
                (int)$row['slide_number'],
                $row['image_path'],
                $row['created_at']
            );
        }

        return $slides;
    }

    public function findById(int $id): ?Slide
    {
        $stmt = $this->connection->prepare("SELECT * FROM slides WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Slide(
            (int)$row['id'],
            (int)$row['project_id'],
            (int)$row['slide_number'],
            $row['image_path'],
            $row['created_at']
        );
    }

    public function save(Slide $slide): Slide
    {
        $stmt = $this->connection->prepare("
            INSERT INTO slides (project_id, slide_number, image_path) 
            VALUES (:project_id, :slide_number, :image_path)
        ");
        $stmt->execute([
            ':project_id' => $slide->getProjectId(),
            ':slide_number' => $slide->getSlideNumber(),
            ':image_path' => $slide->getImagePath(),
        ]);

        $id = (int)$this->connection->lastInsertId();
        
        $stmt = $this->connection->prepare("SELECT * FROM slides WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return new Slide(
            (int)$row['id'],
            (int)$row['project_id'],
            (int)$row['slide_number'],
            $row['image_path'],
            $row['created_at']
        );
    }

    public function update(Slide $slide): void
    {
        $stmt = $this->connection->prepare("
            UPDATE slides 
            SET slide_number = :slide_number, image_path = :image_path 
            WHERE id = :id
        ");
        $stmt->execute([
            ':slide_number' => $slide->getSlideNumber(),
            ':image_path' => $slide->getImagePath(),
            ':id' => $slide->getId(),
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->connection->prepare("DELETE FROM slides WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }
}

