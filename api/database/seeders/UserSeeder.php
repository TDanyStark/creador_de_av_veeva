<?php

declare(strict_types=1);

/**
 * Seeder: UserSeeder
 * Inserta un usuario administrador de prueba.
 * Credenciales: admin@veeva.test / password123
 */
return function (PDO $pdo): void {
    $email = 'admin@veeva.test';
    $passwordHash = password_hash('password123', PASSWORD_BCRYPT);

    // Upsert: si ya existe no falla, solo actualiza el hash
    $stmt = $pdo->prepare("
        INSERT INTO users (email, password_hash)
        VALUES (:email, :password_hash)
        ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
    ");

    $stmt->execute([
        ':email'         => $email,
        ':password_hash' => $passwordHash,
    ]);

    echo "Admin user inserted/updated: $email\n";
};
