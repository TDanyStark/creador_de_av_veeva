<?php

declare(strict_types=1);

namespace App\Domain\Project;

use JsonSerializable;

class NavigationLink implements JsonSerializable
{
    private ?int $id;
    private int $slideId;
    private ?int $targetSlideId;
    private float $topPercent;
    private float $leftPercent;
    private float $widthPercent;
    private float $heightPercent;

    public function __construct(
        ?int $id,
        int $slideId,
        ?int $targetSlideId,
        float $topPercent,
        float $leftPercent,
        float $widthPercent,
        float $heightPercent
    ) {
        $this->id = $id;
        $this->slideId = $slideId;
        $this->targetSlideId = $targetSlideId;
        $this->topPercent = $topPercent;
        $this->leftPercent = $leftPercent;
        $this->widthPercent = $widthPercent;
        $this->heightPercent = $heightPercent;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSlideId(): int
    {
        return $this->slideId;
    }

    public function getTargetSlideId(): ?int
    {
        return $this->targetSlideId;
    }

    public function getTopPercent(): float
    {
        return $this->topPercent;
    }

    public function getLeftPercent(): float
    {
        return $this->leftPercent;
    }

    public function getWidthPercent(): float
    {
        return $this->widthPercent;
    }

    public function getHeightPercent(): float
    {
        return $this->heightPercent;
    }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'slideId' => $this->slideId,
            'targetSlideId' => $this->targetSlideId,
            'topPercent' => $this->topPercent,
            'leftPercent' => $this->leftPercent,
            'widthPercent' => $this->widthPercent,
            'heightPercent' => $this->heightPercent,
        ];
    }
}
