<?php

declare(strict_types=1);

/**
 * Migration: create_navigation_links_table
 */
return [
    'up' => function (PDO $pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS navigation_links (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slide_id INT NOT NULL,
                target_slide_id INT DEFAULT NULL,
                top_percent DECIMAL(5, 2) NOT NULL,
                left_percent DECIMAL(5, 2) NOT NULL,
                width_percent DECIMAL(5, 2) NOT NULL,
                height_percent DECIMAL(5, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE,
                FOREIGN KEY (target_slide_id) REFERENCES slides(id) ON DELETE SET NULL,
                INDEX idx_navigation_links_slide_id (slide_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec("DROP TABLE IF EXISTS navigation_links");
    },
];
