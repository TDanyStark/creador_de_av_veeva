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

    public function __construct(
        ?int $id,
        int $userId,
        string $name,
        string $createdAt = '',
        string $updatedAt = ''
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->name = $name;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
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

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'name' => $this->name,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
