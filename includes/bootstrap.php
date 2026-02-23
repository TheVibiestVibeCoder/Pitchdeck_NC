<?php
declare(strict_types=1);

if (!defined("APP_ROOT")) {
    define("APP_ROOT", dirname(__DIR__));
}
if (!defined("DATA_DIR")) {
    define("DATA_DIR", APP_ROOT . DIRECTORY_SEPARATOR . "data");
}
if (!defined("DECK_FILE")) {
    define("DECK_FILE", DATA_DIR . DIRECTORY_SEPARATOR . "deck.json");
}

function app_bootstrap(): array
{
    static $config = null;
    if (is_array($config)) {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            start_app_session($config);
        }
        return $config;
    }

    $env = load_env_file(APP_ROOT . DIRECTORY_SEPARATOR . ".env");

    $config = [
        "admin_username" => trim((string)($env["ADMIN_USERNAME"] ?? "")),
        "admin_password" => (string)($env["ADMIN_PASSWORD"] ?? ""),
        "session_secret" => (string)($env["SESSION_SECRET"] ?? "pitchdeck-default-session-secret"),
    ];

    start_app_session($config);
    return $config;
}

function load_env_file(string $filePath): array
{
    if (!is_file($filePath) || !is_readable($filePath)) {
        return [];
    }

    $env = [];
    $lines = file($filePath, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return [];
    }

    foreach ($lines as $line) {
        $trimmed = trim((string)$line);
        if ($trimmed === "" || string_starts_with($trimmed, "#")) {
            continue;
        }

        $separator = strpos($trimmed, "=");
        if ($separator === false || $separator < 1) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $separator));
        $value = trim(substr($trimmed, $separator + 1));

        if (($value[0] ?? "") === "\"" && string_ends_with($value, "\"")) {
            $value = substr($value, 1, -1);
        } elseif (($value[0] ?? "") === "'" && string_ends_with($value, "'")) {
            $value = substr($value, 1, -1);
        }

        if ($key !== "") {
            $env[$key] = $value;
        }
    }

    return $env;
}

function start_app_session(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionName = "pitchdeck_" . substr(hash("sha256", (string)$config["session_secret"]), 0, 12);
    session_name($sessionName);

    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => is_https_request(),
        "httponly" => true,
        "samesite" => "Lax",
    ]);

    session_start();
}

function is_https_request(): bool
{
    if (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") {
        return true;
    }

    $forwardedProto = $_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "";
    return strtolower((string)$forwardedProto) === "https";
}

function admin_is_configured(): bool
{
    $config = app_bootstrap();
    return $config["admin_username"] !== "" && $config["admin_password"] !== "";
}

function is_admin_authenticated(): bool
{
    app_bootstrap();
    return !empty($_SESSION["admin_authenticated"]) && $_SESSION["admin_authenticated"] === true;
}

function verify_admin_credentials(string $username, string $password): bool
{
    $config = app_bootstrap();
    if ($config["admin_username"] === "" || $config["admin_password"] === "") {
        return false;
    }

    return hash_equals($config["admin_username"], $username)
        && hash_equals($config["admin_password"], $password);
}

function require_admin_auth(): void
{
    if (!is_admin_authenticated()) {
        json_response(["error" => "Unauthorized."], 401);
    }
}

function read_json_body(): array
{
    $raw = file_get_contents("php://input");
    if ($raw === false || trim($raw) === "") {
        return [];
    }

    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable) {
        throw new RuntimeException("Invalid JSON payload.");
    }

    if (!is_array($decoded)) {
        throw new RuntimeException("Invalid JSON payload.");
    }

    return $decoded;
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header("Content-Type: application/json; charset=utf-8");
    header("X-Content-Type-Options: nosniff");
    header("Referrer-Policy: same-origin");
    header("X-Frame-Options: SAMEORIGIN");
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function method_not_allowed(array $allowedMethods): void
{
    header("Allow: " . implode(", ", $allowedMethods));
    json_response(["error" => "Method not allowed."], 405);
}

function string_starts_with(string $subject, string $prefix): bool
{
    if ($prefix === "") {
        return true;
    }
    return substr($subject, 0, strlen($prefix)) === $prefix;
}

function string_ends_with(string $subject, string $suffix): bool
{
    if ($suffix === "") {
        return true;
    }
    if (strlen($suffix) > strlen($subject)) {
        return false;
    }
    return substr($subject, -strlen($suffix)) === $suffix;
}
