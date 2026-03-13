<?php

declare(strict_types=1);

use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Middleware\JwtAuthMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Interfaces\RouteCollectorProxyInterface as Group;
use \App\Application\Actions\Project\ListProjectsAction;
use \App\Application\Actions\Project\CreateProjectAction;
use \App\Application\Actions\Project\GetProjectEditorDataAction;
use \App\Application\Actions\Slide\SaveNavigationLinkAction;
use \App\Application\Actions\Slide\DeleteNavigationLinkAction;
use \App\Application\Actions\Slide\SavePopupAction;
use \App\Application\Actions\Slide\DeletePopupAction;


return function (App $app) {
    // CORS Pre-Flight OPTIONS Request Handler
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    // ── API Routes (v1) ──────────────────────────────────────────────────────
    $app->group('/api', function (Group $group) {
        $group->group('/v1', function (Group $group) {
            
            // Health check
            $group->get('/health', function (Request $request, Response $response) use ($group) {
                $dbStatus = 'disconnected';
                try {
                    $pdo = $group->getContainer()->get(PDO::class);
                    $pdo->query('SELECT 1');
                    $dbStatus = 'connected';
                } catch (\Exception $e) {
                    $dbStatus = 'error: ' . $e->getMessage();
                }

                $response->getBody()->write(json_encode([
                    'success' => true,
                    'status' => 'ok', 
                    'service' => 'Creador AV Veeva API',
                    'database' => $dbStatus
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            });

            // Public routes
            $group->group('/auth', function (Group $group) {
                $group->post('/login', LoginAction::class);
                $group->get('/me', MeAction::class)->add(JwtAuthMiddleware::class);
            });

            // Projects
            $group->group('/projects', function (Group $group) {
                $group->get('', ListProjectsAction::class);
                $group->post('', CreateProjectAction::class);
                $group->get('/{id}/editor-data', GetProjectEditorDataAction::class);
            })->add(JwtAuthMiddleware::class);

            // Slides & Navigation
            $group->group('/slides', function (Group $group) {
                $group->post('/{id}/navigation', SaveNavigationLinkAction::class);
                $group->post('/{id}/popups', SavePopupAction::class);
            })->add(JwtAuthMiddleware::class);

            $group->group('/navigation-links', function (Group $group) {
                $group->delete('/{id}', DeleteNavigationLinkAction::class);
            })->add(JwtAuthMiddleware::class);

            $group->group('/popups', function (Group $group) {
                $group->delete('/{id}', DeletePopupAction::class);
            })->add(JwtAuthMiddleware::class);
        });
    });
};
