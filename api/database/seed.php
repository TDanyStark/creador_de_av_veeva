<?php

declare(strict_types=1);

/**
 * Seeder Runner
 * Usage: php seed.php [all|ClassName]
 * - all: Run all seeders
 * - ClassName: Run a specific seeder
 */

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$pdo = new PDO(
    sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        $_ENV['DB_HOST'],
        $_ENV['DB_PORT'],
        $_ENV['DB_NAME']
    ),
    $_ENV['DB_USER'],
    $_ENV['DB_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$command = $argv[1] ?? 'all';
$seedersDir = __DIR__ . '/seeders';

function getSeedersFiles(string $dir): array
{
    $files = glob($dir . '/*.php');
    sort($files);
    return $files ?: [];
}

function runSeeder(PDO $pdo, string $file): void
{
    $seeder = require_once $file;
    if (is_callable($seeder)) {
        $seeder($pdo);
    }
}

if ($command === 'all') {
    $files = getSeedersFiles($seedersDir);
    foreach ($files as $file) {
        echo "Seeding: " . basename($file) . "... ";
        runSeeder($pdo, $file);
        echo "done.\n";
    }
} else {
    $file = $seedersDir . '/' . $command . '.php';
    if (!file_exists($file)) {
        echo "Seeder not found: $command\n";
        exit(1);
    }
    echo "Seeding: $command... ";
    runSeeder($pdo, $file);
    echo "done.\n";
}
