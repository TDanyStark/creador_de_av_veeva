<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Project;

use App\Domain\Project\NavigationLink;
use App\Domain\Project\NavigationLinkRepositoryInterface;
use PDO;

class NavigationLinkRepository implements NavigationLinkRepositoryInterface
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function findBySlideId(int $slideId): array
    {
        $stmt = $this->connection->prepare("
            SELECT * FROM navigation_links 
            WHERE slide_id = :slide_id
        ");
        $stmt->execute([':slide_id' => $slideId]);

        $links = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $links[] = $this->mapToEntity($row);
        }

        return $links;
    }

    public function findByProjectId(int $projectId): array
    {
        $stmt = $this->connection->prepare("
            SELECT nl.* FROM navigation_links nl
            JOIN slides s ON nl.slide_id = s.id
            WHERE s.project_id = :project_id
        ");
        $stmt->execute([':project_id' => $projectId]);

        $links = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $links[] = $this->mapToEntity($row);
        }

        return $links;
    }

    public function save(NavigationLink $link): NavigationLink
    {
        if ($link->getId() === null) {
            $stmt = $this->connection->prepare("
                INSERT INTO navigation_links (slide_id, target_slide_id, top_percent, left_percent, width_percent, height_percent) 
                VALUES (:slide_id, :target_slide_id, :top_percent, :left_percent, :width_percent, :height_percent)
            ");
            $stmt->execute([
                ':slide_id' => $link->getSlideId(),
                ':target_slide_id' => $link->getTargetSlideId(),
                ':top_percent' => $link->getTopPercent(),
                ':left_percent' => $link->getLeftPercent(),
                ':width_percent' => $link->getWidthPercent(),
                ':height_percent' => $link->getHeightPercent(),
            ]);
            $id = (int)$this->connection->lastInsertId();
        } else {
            $stmt = $this->connection->prepare("
                UPDATE navigation_links 
                SET target_slide_id = :target_slide_id, 
                    top_percent = :top_percent, 
                    left_percent = :left_percent, 
                    width_percent = :width_percent, 
                    height_percent = :height_percent
                WHERE id = :id
            ");
            $stmt->execute([
                ':target_slide_id' => $link->getTargetSlideId(),
                ':top_percent' => $link->getTopPercent(),
                ':left_percent' => $link->getLeftPercent(),
                ':width_percent' => $link->getWidthPercent(),
                ':height_percent' => $link->getHeightPercent(),
                ':id' => $link->getId(),
            ]);
            $id = $link->getId();
        }

        $stmt = $this->connection->prepare("SELECT * FROM navigation_links WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $this->mapToEntity($row);
    }

    public function delete(int $id): void
    {
        $stmt = $this->connection->prepare("DELETE FROM navigation_links WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }

    public function findById(int $id): ?NavigationLink
    {
        $stmt = $this->connection->prepare("SELECT * FROM navigation_links WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return $this->mapToEntity($row);
    }

    public function deleteBySlideId(int $slideId): void
    {
        $stmt = $this->connection->prepare("DELETE FROM navigation_links WHERE slide_id = :slide_id");
        $stmt->execute([':slide_id' => $slideId]);
    }

    public function deleteByTargetSlideId(int $targetSlideId): void
    {
        $stmt = $this->connection->prepare("DELETE FROM navigation_links WHERE target_slide_id = :target_slide_id");
        $stmt->execute([':target_slide_id' => $targetSlideId]);
    }


    private function mapToEntity(array $row): NavigationLink
    {
        return new NavigationLink(
            (int)$row['id'],
            (int)$row['slide_id'],
            $row['target_slide_id'] !== null ? (int)$row['target_slide_id'] : null,
            (float)$row['top_percent'],
            (float)$row['left_percent'],
            (float)$row['width_percent'],
            (float)$row['height_percent']
        );
    }
}
