<?php

declare(strict_types=1);

namespace App\Application\Actions\Slide;

use App\Application\Actions\Action;
use App\Domain\Project\PopupRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Log\LoggerInterface;

class DeletePopupAction extends Action
{
    private PopupRepositoryInterface $popupRepository;

    public function __construct(
        LoggerInterface $logger,
        PopupRepositoryInterface $popupRepository
    ) {
        parent::__construct($logger);
        $this->popupRepository = $popupRepository;
    }

    protected function action(): Response
    {
        $id = (int) $this->resolveArg('id');
        $this->popupRepository->delete($id);

        return $this->respondWithData(['success' => true]);
    }
}
