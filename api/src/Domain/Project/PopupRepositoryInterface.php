<?php

declare(strict_types=1);

namespace App\Domain\Project;

interface PopupRepositoryInterface
{
    public function findById(int $id): ?Popup;
    public function findBySlideId(int $slideId): array;
    public function save(Popup $popup): int;
    public function update(Popup $popup): void;
    public function delete(int $id): void;
}
