<?php

declare(strict_types=1);

namespace App\Domain\Project;

use JsonSerializable;

class Slide implements JsonSerializable
{
    private ?int $id;
    private int $projectId;
    private int $slideNumber;
    private string $imagePath;
    private string $createdAt;

    public function __construct(
        ?int $id,
        int $projectId,
        int $slideNumber,
        string $imagePath,
        string $createdAt = ''
    ) {
        $this->id = $id;
        $this->projectId = $projectId;
        $this->slideNumber = $slideNumber;
        $this->imagePath = $imagePath;
        $this->createdAt = $createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getProjectId(): int
    {
        return $this->projectId;
    }

    public function getSlideNumber(): int
    {
        return $this->slideNumber;
    }

    public function getImagePath(): string
    {
        return $this->imagePath;
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->projectId,
            'slide_number' => $this->slideNumber,
            'image_path' => $this->imagePath,
            'created_at' => $this->createdAt,
        ];
    }
}
