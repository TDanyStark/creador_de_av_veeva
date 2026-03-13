<?php

declare(strict_types=1);

/**
 * Migration: create_popups_table
 */
return [
    'up' => function (PDO $pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS popups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slide_id INT NOT NULL,
                image_path VARCHAR(255) DEFAULT NULL,
                button_top DECIMAL(5, 2) NOT NULL,
                button_left DECIMAL(5, 2) NOT NULL,
                button_width DECIMAL(5, 2) NOT NULL,
                button_height DECIMAL(5, 2) NOT NULL,
                popup_top DECIMAL(5, 2) DEFAULT 0,
                popup_left DECIMAL(5, 2) DEFAULT 0,
                popup_width_percent DECIMAL(5, 2) DEFAULT 100,
                popup_height_percent DECIMAL(5, 2) DEFAULT 56.25,
                close_color VARCHAR(50) DEFAULT '#000000',
                close_x_position VARCHAR(20) DEFAULT 'inside',
                overlay_type VARCHAR(50) DEFAULT 'dark',
                exclusive_open BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE,
                INDEX idx_popups_slide_id (slide_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec("DROP TABLE IF EXISTS popups");
    },
];
