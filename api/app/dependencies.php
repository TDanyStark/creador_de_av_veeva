<?php

declare(strict_types=1);

use App\Application\Settings\SettingsInterface;
use DI\ContainerBuilder;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseFactoryInterface;
use Slim\Factory\AppFactory;
use \App\Infrastructure\Services\PdfToImageService;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        LoggerInterface::class => function (ContainerInterface $c) {
            $settings       = $c->get(SettingsInterface::class);
            $loggerSettings = $settings->get('logger');
            $logger         = new Logger($loggerSettings['name']);

            $processor = new UidProcessor();
            $logger->pushProcessor($processor);

            $handler = new StreamHandler($loggerSettings['path'], $loggerSettings['level']);
            $logger->pushHandler($handler);

            return $logger;
        },

        ResponseFactoryInterface::class => function (ContainerInterface $c) {
            return AppFactory::determineResponseFactory();
        },

        PDO::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);
            $db       = $settings->get('db');

            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                $db['host'],
                $db['port'],
                $db['dbname']
            );

            return new PDO($dsn, $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        },

        PdfToImageService::class => function (ContainerInterface $c) {
            // Path to public/uploads/projects
            $uploadDir = __DIR__ . '/../public/uploads/projects';
            return new PdfToImageService($uploadDir);
        },

        \App\Infrastructure\Services\ProjectExporterService::class => function (ContainerInterface $c) {
            $exportsDir = __DIR__ . '/../public/exports';
            $publicDir = __DIR__ . '/../public';
            return new \App\Infrastructure\Services\ProjectExporterService($exportsDir, $publicDir);
        },
    ]);
};
