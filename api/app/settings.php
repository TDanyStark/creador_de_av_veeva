<?php

declare(strict_types=1);

use App\Application\Settings\Settings;
use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Monolog\Logger;

return function (ContainerBuilder $containerBuilder) {

    // Global Settings Object
    $containerBuilder->addDefinitions([
        SettingsInterface::class => function () {
            return new Settings([
                'displayErrorDetails' => ($_ENV['APP_ENV'] ?? 'production') === 'development',
                'logError'            => true,
                'logErrorDetails'     => true,
                'logger' => [
                    'name'  => 'slim-app',
                    'path'  => isset($_ENV['docker']) ? 'php://stdout' : __DIR__ . '/../logs/app.log',
                    'level' => Logger::DEBUG,
                ],
                'db' => [
                    'host'    => $_ENV['DB_HOST'] ?? '127.0.0.1',
                    'port'    => $_ENV['DB_PORT'] ?? '3306',
                    'dbname'  => $_ENV['DB_NAME'] ?? '',
                    'user'    => $_ENV['DB_USER'] ?? '',
                    'pass'    => $_ENV['DB_PASS'] ?? '',
                ],
                'jwt' => [
                    'secret' => $_ENV['JWT_SECRET'] ?? 'default_secret',
                    'expiry' => (int) ($_ENV['JWT_EXPIRY'] ?? 3600),
                ],
            ]);
        }
    ]);
};
