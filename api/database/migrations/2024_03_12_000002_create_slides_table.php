<?php

declare(strict_types=1);

/**
 * Migration: create_slides_table
 */
return [
    'up' => function (PDO $pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS slides (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                slide_number INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                INDEX idx_slides_project_id (project_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec("DROP TABLE IF EXISTS slides");
    },
];
