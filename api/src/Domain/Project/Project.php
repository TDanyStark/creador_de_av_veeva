<?php

declare(strict_types=1);

namespace App\Domain\Project;

use JsonSerializable;

class Project implements JsonSerializable
{
    private ?int $id;
    private int $userId;
    private string $name;
    private string $createdAt;
    private string $updatedAt;
    private int $slidesCount;

    public function __construct(
        ?int $id,
        int $userId,
        string $name,
        string $createdAt = '',
        string $updatedAt = '',
        int $slidesCount = 0
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->name = $name;
        $this->createdAt = $createdAt ?? '';
        $this->updatedAt = $updatedAt ?? '';
        $this->slidesCount = $slidesCount;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function getSlidesCount(): int
    {
        return $this->slidesCount;
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'user_id' => $this->userId,
            'name' => $this->name,
            'createdAt' => $this->createdAt,
            'created_at' => $this->createdAt,
            'updatedAt' => $this->updatedAt,
            'updated_at' => $this->updatedAt,
            'slidesCount' => $this->slidesCount,
            'slides_count' => $this->slidesCount,
        ];
    }
}
