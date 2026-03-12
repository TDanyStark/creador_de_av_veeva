<?php

declare(strict_types=1);

use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Middleware\JwtAuthMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    // CORS Pre-Flight OPTIONS Request Handler
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    // Health check
    $app->get('/', function (Request $request, Response $response) {
        $response->getBody()->write(json_encode(['status' => 'ok', 'service' => 'Creador AV Veeva API']));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // ── Auth routes (public) ──────────────────────────────────────────────────
    $app->group('/api/auth', function (Group $group) {
        $group->post('/login', LoginAction::class);
    });

    // ── Protected routes (JWT required) ──────────────────────────────────────
    $app->group('/api', function (Group $group) {
        $group->get('/auth/me', MeAction::class);
    })->add(JwtAuthMiddleware::class);
};
