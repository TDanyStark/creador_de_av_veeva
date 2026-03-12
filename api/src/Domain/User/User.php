<?php

declare(strict_types=1);

namespace App\Domain\User;

use JsonSerializable;

class User implements JsonSerializable
{
    private ?int $id;
    private string $email;
    private string $passwordHash;
    private ?string $createdAt;
    private ?string $updatedAt;

    public function __construct(
        ?int $id,
        string $email,
        string $passwordHash,
        ?string $createdAt = null,
        ?string $updatedAt = null
    ) {
        $this->id           = $id;
        $this->email        = strtolower(trim($email));
        $this->passwordHash = $passwordHash;
        $this->createdAt    = $createdAt;
        $this->updatedAt    = $updatedAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }

    public function getCreatedAt(): ?string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?string
    {
        return $this->updatedAt;
    }

    public function verifyPassword(string $plainPassword): bool
    {
        return password_verify($plainPassword, $this->passwordHash);
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id'         => $this->id,
            'email'      => $this->email,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
