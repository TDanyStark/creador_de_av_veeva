<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Application\Helpers\JsonResponseHelper;
use App\Domain\User\UserNotFoundException;
use App\Domain\User\UserRepositoryInterface;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class LoginAction
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
        $body = (array) $request->getParsedBody();

        $email    = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        // --- Validation ---
        $errors = [];
        if (empty($email)) {
            $errors['email'] = 'El email es requerido.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El email no tiene un formato válido.';
        }
        if (empty($password)) {
            $errors['password'] = 'La contraseña es requerida.';
        }

        if (!empty($errors)) {
            return JsonResponseHelper::validationError($response, $errors);
        }

        // --- Auth ---
        try {
            $user = $this->userRepository->findByEmail($email);
        } catch (UserNotFoundException $e) {
            $this->logger->warning("Login failed for email: {$email}");
            return JsonResponseHelper::error($response, 'Credenciales inválidas.', [], 401);
        }

        if (!$user->verifyPassword($password)) {
            $this->logger->warning("Invalid password for email: {$email}");
            return JsonResponseHelper::error($response, 'Credenciales inválidas.', [], 401);
        }

        // --- JWT Generation ---
        $jwtSecret = $_ENV['JWT_SECRET'] ?? 'default_secret';
        $jwtExpiry = (int) ($_ENV['JWT_EXPIRY'] ?? 3600);
        $issuedAt  = time();

        $payload = [
            'iss' => 'creador-av-veeva',
            'iat' => $issuedAt,
            'exp' => $issuedAt + $jwtExpiry,
            'sub' => (string) $user->getId(),
            'email' => $user->getEmail(),
        ];

        $token = JWT::encode($payload, $jwtSecret, 'HS256');

        $this->logger->info("User {$email} logged in successfully.");

        return JsonResponseHelper::success($response, [
            'token' => $token,
            'user'  => $user,
        ], 'Login exitoso.');
    }
}
