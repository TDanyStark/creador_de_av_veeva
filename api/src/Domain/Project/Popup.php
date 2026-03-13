<?php

declare(strict_types=1);

namespace App\Domain\Project;

use JsonSerializable;

class Popup implements JsonSerializable
{
    private ?int $id;
    private int $slideId;
    private ?string $imagePath;
    private float $buttonTop;
    private float $buttonLeft;
    private float $buttonWidth;
    private float $buttonHeight;
    private float $popupTop;
    private float $popupLeft;
    private float $popupWidthPercent;
    private float $popupHeightPercent;
    private string $closeColor;
    private string $closeXPosition;
    private string $overlayType;
    private bool $exclusiveOpen;

    public function __construct(
        ?int $id,
        int $slideId,
        ?string $imagePath,
        float $buttonTop,
        float $buttonLeft,
        float $buttonWidth,
        float $buttonHeight,
        float $popupTop = 0,
        float $popupLeft = 0,
        float $popupWidthPercent = 100,
        float $popupHeightPercent = 56.25,
        string $closeColor = '#000000',
        string $closeXPosition = 'inside',
        string $overlayType = 'dark',
        bool $exclusiveOpen = true
    ) {
        $this->id = $id;
        $this->slideId = $slideId;
        $this->imagePath = $imagePath;
        $this->buttonTop = $buttonTop;
        $this->buttonLeft = $buttonLeft;
        $this->buttonWidth = $buttonWidth;
        $this->buttonHeight = $buttonHeight;
        $this->popupTop = $popupTop;
        $this->popupLeft = $popupLeft;
        $this->popupWidthPercent = $popupWidthPercent;
        $this->popupHeightPercent = $popupHeightPercent;
        $this->closeColor = $closeColor;
        $this->closeXPosition = $closeXPosition;
        $this->overlayType = $overlayType;
        $this->exclusiveOpen = $exclusiveOpen;
    }

    public function getId(): ?int { return $this->id; }
    public function getSlideId(): int { return $this->slideId; }
    public function getImagePath(): ?string { return $this->imagePath; }
    public function getButtonTop(): float { return $this->buttonTop; }
    public function getButtonLeft(): float { return $this->buttonLeft; }
    public function getButtonWidth(): float { return $this->buttonWidth; }
    public function getButtonHeight(): float { return $this->buttonHeight; }
    public function getPopupTop(): float { return $this->popupTop; }
    public function getPopupLeft(): float { return $this->popupLeft; }
    public function getPopupWidthPercent(): float { return $this->popupWidthPercent; }
    public function getPopupHeightPercent(): float { return $this->popupHeightPercent; }
    public function getCloseColor(): string { return $this->closeColor; }
    public function getCloseXPosition(): string { return $this->closeXPosition; }
    public function getOverlayType(): string { return $this->overlayType; }
    public function isExclusiveOpen(): bool { return $this->exclusiveOpen; }

    #[\ReturnTypeWillChange]
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'slideId' => $this->slideId,
            'imagePath' => $this->imagePath,
            'buttonTop' => $this->buttonTop,
            'buttonLeft' => $this->buttonLeft,
            'buttonWidth' => $this->buttonWidth,
            'buttonHeight' => $this->buttonHeight,
            'popupTop' => $this->popupTop,
            'popupLeft' => $this->popupLeft,
            'popupWidthPercent' => $this->popupWidthPercent,
            'popupHeightPercent' => $this->popupHeightPercent,
            'closeColor' => $this->closeColor,
            'closeXPosition' => $this->closeXPosition,
            'overlayType' => $this->overlayType,
            'exclusiveOpen' => $this->exclusiveOpen,
        ];
    }
}
