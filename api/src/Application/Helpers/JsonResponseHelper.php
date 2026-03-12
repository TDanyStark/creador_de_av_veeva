<?php

declare(strict_types=1);

namespace App\Application\Helpers;

use Psr\Http\Message\ResponseInterface as Response;

/**
 * JsonResponseHelper
 *
 * Centraliza las respuestas JSON estandarizadas del API.
 * Formato: { "success": bool, "message": string, "data": mixed, "errors": object }
 */
class JsonResponseHelper
{
    /**
     * Respuesta exitosa.
     *
     * @param Response $response
     * @param mixed    $data
     * @param string   $message
     * @param int      $statusCode
     */
    public static function success(
        Response $response,
        $data = null,
        string $message = 'OK',
        int $statusCode = 200
    ): Response {
        return self::write($response, [
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'errors'  => (object) [],
        ], $statusCode);
    }

    /**
     * Respuesta de error.
     *
     * @param Response             $response
     * @param string               $message
     * @param array<string, mixed> $errors
     * @param int                  $statusCode
     */
    public static function error(
        Response $response,
        string $message = 'Error',
        array $errors = [],
        int $statusCode = 400
    ): Response {
        return self::write($response, [
            'success' => false,
            'message' => $message,
            'data'    => null,
            'errors'  => $errors ?: (object) [],
        ], $statusCode);
    }

    /**
     * Respuesta de validación fallida (422).
     *
     * @param Response             $response
     * @param array<string, mixed> $errors
     * @param string               $message
     */
    public static function validationError(
        Response $response,
        array $errors,
        string $message = 'Validation failed'
    ): Response {
        return self::error($response, $message, $errors, 422);
    }

    /**
     * Respuesta de no autorizado (401).
     *
     * @param Response $response
     * @param string   $message
     */
    public static function unauthorized(
        Response $response,
        string $message = 'Unauthorized'
    ): Response {
        return self::error($response, $message, [], 401);
    }

    /**
     * Respuesta de no encontrado (404).
     *
     * @param Response $response
     * @param string   $message
     */
    public static function notFound(
        Response $response,
        string $message = 'Not found'
    ): Response {
        return self::error($response, $message, [], 404);
    }

    /**
     * Escribe el JSON en el response.
     *
     * @param Response             $response
     * @param array<string, mixed> $payload
     * @param int                  $statusCode
     */
    private static function write(Response $response, array $payload, int $statusCode): Response
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $response->getBody()->write($json);

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }
}
