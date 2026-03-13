<?php

declare(strict_types=1);

namespace App\Application\Actions\Slide;

use App\Domain\Project\Popup;
use App\Domain\Project\PopupRepositoryInterface;
use App\Domain\Project\SlideRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;
use Slim\Psr7\UploadedFile;

class SavePopupAction extends SlideAction
{
    private PopupRepositoryInterface $popupRepository;

    public function __construct(
        LoggerInterface $logger,
        SlideRepositoryInterface $slideRepository,
        PopupRepositoryInterface $popupRepository
    ) {
        parent::__construct($logger, $slideRepository);
        $this->popupRepository = $popupRepository;
    }

    protected function action(): Response
    {
        $slideId = (int) $this->resolveArg('id');
        $data = $this->request->getParsedBody();
        $uploadedFiles = $this->request->getUploadedFiles();
        
        $popupId = isset($data['id']) ? (int) $data['id'] : null;
        $imagePath = isset($data['imagePath']) ? $data['imagePath'] : null;

        // Handle File Upload
        $imageFile = $uploadedFiles['image'] ?? null;
        if ($imageFile && $imageFile->getError() === UPLOAD_ERR_OK) {
            $imagePath = $this->movePopupImage($imageFile);
        }

        $popup = new Popup(
            $popupId,
            $slideId,
            $imagePath,
            (float) $data['buttonTop'],
            (float) $data['buttonLeft'],
            (float) $data['buttonWidth'],
            (float) $data['buttonHeight'],
            (float) ($data['popupTop'] ?? 0),
            (float) ($data['popupLeft'] ?? 0),
            (float) ($data['popupWidthPercent'] ?? 100),
            (float) ($data['popupHeightPercent'] ?? 56.25),
            $data['closeColor'] ?? '#000000',
            $data['closeXPosition'] ?? 'inside',
            $data['overlayType'] ?? 'dark',
            (bool) ($data['exclusiveOpen'] ?? true)
        );

        if ($popupId) {
            $this->popupRepository->update($popup);
            $savedPopup = $this->popupRepository->findById($popupId);
        } else {
            $newId = $this->popupRepository->save($popup);
            $savedPopup = $this->popupRepository->findById($newId);
        }

        return $this->respondWithData($savedPopup);
    }

    private function movePopupImage(UploadedFile $uploadedFile): string
    {
        $directory = __DIR__ . '/../../../../public/uploads/popups';
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $basename = bin2hex(random_bytes(8));
        $filename = sprintf('%s.%s', $basename, $extension);

        $uploadedFile->moveTo($directory . DIRECTORY_SEPARATOR . $filename);

        return 'uploads/popups/' . $filename;
    }
}
