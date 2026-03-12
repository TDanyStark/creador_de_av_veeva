<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Application\Helpers\JsonResponseHelper;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class JwtAuthMiddleware implements MiddlewareInterface
{
    private ResponseFactoryInterface $responseFactory;

    public function __construct(ResponseFactoryInterface $responseFactory)
    {
        $this->responseFactory = $responseFactory;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            $response = $this->responseFactory->createResponse();
            return JsonResponseHelper::unauthorized($response, 'Token de autorización requerido.');
        }

        $token = substr($authHeader, 7);

        try {
            $jwtSecret = $_ENV['JWT_SECRET'] ?? 'default_secret';
            $decoded   = JWT::decode($token, new Key($jwtSecret, 'HS256'));

            // Inject payload and user_id into request attributes for downstream actions
            $request = $request->withAttribute('jwt_payload', $decoded);
            $request = $request->withAttribute('user_id', $decoded->sub);

            return $handler->handle($request);
        } catch (\Exception $e) {
            $response = $this->responseFactory->createResponse();
            return JsonResponseHelper::unauthorized($response, 'Token inválido o expirado.');
        }
    }
}
