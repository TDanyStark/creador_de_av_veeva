<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\User;

use App\Domain\User\User;
use App\Domain\User\UserNotFoundException;
use App\Domain\User\UserRepositoryInterface;
use PDO;

class UserRepository implements UserRepositoryInterface
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByEmail(string $email): User
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = :email LIMIT 1"
        );
        $stmt->execute([':email' => strtolower(trim($email))]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new UserNotFoundException("User with email '{$email}' not found.");
        }

        return $this->hydrateUser($row);
    }

    public function findById(int $id): User
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new UserNotFoundException("User with ID '{$id}' not found.");
        }

        return $this->hydrateUser($row);
    }

    /**
     * @param array<string, mixed> $row
     */
    private function hydrateUser(array $row): User
    {
        return new User(
            (int) $row['id'],
            (string) $row['email'],
            (string) $row['password_hash'],
            (string) $row['created_at'],
            (string) $row['updated_at']
        );
    }
}
