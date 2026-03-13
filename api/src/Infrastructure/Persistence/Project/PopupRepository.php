<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Project;

use App\Domain\Project\Popup;
use App\Domain\Project\PopupRepositoryInterface;
use PDO;

class PopupRepository implements PopupRepositoryInterface
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function findById(int $id): ?Popup
    {
        $stmt = $this->connection->prepare("SELECT * FROM popups WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) return null;

        return $this->mapToEntity($row);
    }

    public function findBySlideId(int $slideId): array
    {
        $stmt = $this->connection->prepare("SELECT * FROM popups WHERE slide_id = :slide_id");
        $stmt->execute([':slide_id' => $slideId]);

        $popups = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $popups[] = $this->mapToEntity($row);
        }

        return $popups;
    }

    public function findByProjectId(int $projectId): array
    {
        $stmt = $this->connection->prepare("
            SELECT p.* FROM popups p
            JOIN slides s ON p.slide_id = s.id
            WHERE s.project_id = :project_id
        ");
        $stmt->execute([':project_id' => $projectId]);

        $popups = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $popups[] = $this->mapToEntity($row);
        }

        return $popups;
    }

    public function save(Popup $popup): int
    {
        $stmt = $this->connection->prepare("
            INSERT INTO popups (
                slide_id, image_path, button_top, button_left, button_width, button_height, 
                popup_top, popup_left, popup_width_percent, popup_height_percent, 
                close_color, close_x_position, overlay_type, exclusive_open
            ) VALUES (
                :slide_id, :image_path, :button_top, :button_left, :button_width, :button_height, 
                :popup_top, :popup_left, :popup_width_percent, :popup_height_percent, 
                :close_color, :close_x_position, :overlay_type, :exclusive_open
            )
        ");
        $stmt->execute([
            ':slide_id' => $popup->getSlideId(),
            ':image_path' => $popup->getImagePath(),
            ':button_top' => $popup->getButtonTop(),
            ':button_left' => $popup->getButtonLeft(),
            ':button_width' => $popup->getButtonWidth(),
            ':button_height' => $popup->getButtonHeight(),
            ':popup_top' => $popup->getPopupTop(),
            ':popup_left' => $popup->getPopupLeft(),
            ':popup_width_percent' => $popup->getPopupWidthPercent(),
            ':popup_height_percent' => $popup->getPopupHeightPercent(),
            ':close_color' => $popup->getCloseColor(),
            ':close_x_position' => $popup->getCloseXPosition(),
            ':overlay_type' => $popup->getOverlayType(),
            ':exclusive_open' => $popup->isExclusiveOpen() ? 1 : 0,
        ]);

        return (int)$this->connection->lastInsertId();
    }

    public function update(Popup $popup): void
    {
        $stmt = $this->connection->prepare("
            UPDATE popups SET 
                image_path = :image_path,
                button_top = :button_top, 
                button_left = :button_left, 
                button_width = :button_width, 
                button_height = :button_height, 
                popup_top = :popup_top, 
                popup_left = :popup_left, 
                popup_width_percent = :popup_width_percent, 
                popup_height_percent = :popup_height_percent, 
                close_color = :close_color, 
                close_x_position = :close_x_position, 
                overlay_type = :overlay_type, 
                exclusive_open = :exclusive_open
            WHERE id = :id
        ");
        $stmt->execute([
            ':image_path' => $popup->getImagePath(),
            ':button_top' => $popup->getButtonTop(),
            ':button_left' => $popup->getButtonLeft(),
            ':button_width' => $popup->getButtonWidth(),
            ':button_height' => $popup->getButtonHeight(),
            ':popup_top' => $popup->getPopupTop(),
            ':popup_left' => $popup->getPopupLeft(),
            ':popup_width_percent' => $popup->getPopupWidthPercent(),
            ':popup_height_percent' => $popup->getPopupHeightPercent(),
            ':close_color' => $popup->getCloseColor(),
            ':close_x_position' => $popup->getCloseXPosition(),
            ':overlay_type' => $popup->getOverlayType(),
            ':exclusive_open' => $popup->isExclusiveOpen() ? 1 : 0,
            ':id' => $popup->getId(),
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->connection->prepare("DELETE FROM popups WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }

    private function mapToEntity(array $row): Popup
    {
        return new Popup(
            (int)$row['id'],
            (int)$row['slide_id'],
            $row['image_path'],
            (float)$row['button_top'],
            (float)$row['button_left'],
            (float)$row['button_width'],
            (float)$row['button_height'],
            (float)$row['popup_top'],
            (float)$row['popup_left'],
            (float)$row['popup_width_percent'],
            (float)$row['popup_height_percent'],
            $row['close_color'],
            $row['close_x_position'],
            $row['overlay_type'],
            (bool)$row['exclusive_open']
        );
    }
}
