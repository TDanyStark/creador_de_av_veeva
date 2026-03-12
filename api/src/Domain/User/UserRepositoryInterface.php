<?php

declare(strict_types=1);

namespace App\Domain\User;

interface UserRepositoryInterface
{
    /**
     * Find a user by their email address.
     *
     * @throws UserNotFoundException
     */
    public function findByEmail(string $email): User;

    /**
     * Find a user by their ID.
     *
     * @throws UserNotFoundException
     */
    public function findById(int $id): User;
}
