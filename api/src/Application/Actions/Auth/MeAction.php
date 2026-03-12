<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Helpers\JsonResponseHelper;
use App\Domain\User\UserNotFoundException;
use App\Domain\User\UserRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class MeAction
{
    private LoggerInterface $logger;
    private UserRepositoryInterface $userRepository;

    public function __construct(LoggerInterface $logger, UserRepositoryInterface $userRepository)
    {
        $this->logger         = $logger;
        $this->userRepository = $userRepository;
    }

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        // The JWT payload is injected by JwtAuthMiddleware into request attributes.
        $jwtPayload = $request->getAttribute('jwt_payload');

        if (!$jwtPayload || !isset($jwtPayload->sub)) {
            return JsonResponseHelper::unauthorized($response, 'Token inválido.');
        }

        $userId = (int) $jwtPayload->sub;

        try {
            $user = $this->userRepository->findById($userId);
        } catch (UserNotFoundException $e) {
            return JsonResponseHelper::notFound($response, 'Usuario no encontrado.');
        }

        return JsonResponseHelper::success($response, ['user' => $user]);
    }
}
