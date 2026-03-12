<?php

declare(strict_types=1);

/**
 * Migration Runner
 * Usage: php migrate.php [up|down|fresh]
 * - up: Run all pending migrations
 * - down: Rollback last migration
 * - fresh: Drop all tables and re-run all migrations
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

// Create migrations tracking table
$pdo->exec("
    CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

$command = $argv[1] ?? 'up';
$migrationsDir = __DIR__ . '/migrations';

function getMigrationFiles(string $dir): array
{
    $files = glob($dir . '/*.php');
    sort($files);
    return $files ?: [];
}

function getExecutedMigrations(PDO $pdo): array
{
    $stmt = $pdo->query("SELECT migration FROM migrations ORDER BY id ASC");
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function runUp(PDO $pdo, string $migrationsDir): void
{
    $files = getMigrationFiles($migrationsDir);
    $executed = getExecutedMigrations($pdo);

    $pending = array_filter($files, fn($f) => !in_array(basename($f), $executed));

    if (empty($pending)) {
        echo "Nothing to migrate.\n";
        return;
    }

    foreach ($pending as $file) {
        $migration = require $file;
        echo "Running: " . basename($file) . "... ";
        $migration['up']($pdo);
        $pdo->prepare("INSERT INTO migrations (migration) VALUES (?)")->execute([basename($file)]);
        echo "done.\n";
    }
}

function runDown(PDO $pdo, string $migrationsDir): void
{
    $executed = getExecutedMigrations($pdo);
    if (empty($executed)) {
        echo "Nothing to rollback.\n";
        return;
    }

    $last = end($executed);
    $file = $migrationsDir . '/' . $last;
    $migration = require $file;
    echo "Rolling back: $last... ";
    $migration['down']($pdo);
    $pdo->prepare("DELETE FROM migrations WHERE migration = ?")->execute([$last]);
    echo "done.\n";
}

function runFresh(PDO $pdo, string $migrationsDir): void
{
    echo "Dropping all tables...\n";
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `$table`");
        echo "Dropped: $table\n";
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "Re-creating migrations table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    runUp($pdo, $migrationsDir);
}

switch ($command) {
    case 'up':
        runUp($pdo, $migrationsDir);
        break;
    case 'down':
        runDown($pdo, $migrationsDir);
        break;
    case 'fresh':
        runFresh($pdo, $migrationsDir);
        break;
    default:
        echo "Unknown command. Use: up, down, fresh\n";
}
