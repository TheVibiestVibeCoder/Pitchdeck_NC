<?php
declare(strict_types=1);

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . "includes" . DIRECTORY_SEPARATOR . "bootstrap.php";

$config = app_bootstrap();
$action = strtolower(trim((string)($_GET["action"] ?? "status")));
$method = strtoupper((string)($_SERVER["REQUEST_METHOD"] ?? "GET"));

if ($action === "status") {
    if ($method !== "GET") {
        method_not_allowed(["GET"]);
    }

    json_response([
        "authenticated" => is_admin_authenticated(),
        "username" => $config["admin_username"] !== "" ? $config["admin_username"] : null,
        "configured" => admin_is_configured(),
    ]);
}

if ($action === "login") {
    if ($method !== "POST") {
        method_not_allowed(["POST"]);
    }

    if (!admin_is_configured()) {
        json_response(["error" => "Admin credentials are not configured in .env."], 503);
    }

    try {
        $payload = read_json_body();
    } catch (RuntimeException $exception) {
        json_response(["error" => $exception->getMessage()], 400);
    }

    $username = trim((string)($payload["username"] ?? ""));
    $password = (string)($payload["password"] ?? "");

    if (!verify_admin_credentials($username, $password)) {
        json_response(["error" => "Invalid credentials."], 401);
    }

    session_regenerate_id(true);
    $_SESSION["admin_authenticated"] = true;
    $_SESSION["admin_username"] = $config["admin_username"];

    json_response([
        "authenticated" => true,
        "username" => $config["admin_username"],
        "configured" => true,
    ]);
}

if ($action === "logout") {
    if ($method !== "POST") {
        method_not_allowed(["POST"]);
    }

    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
        session_destroy();
    }

    if ((bool)ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            "",
            time() - 42000,
            $params["path"] ?? "/",
            $params["domain"] ?? "",
            (bool)($params["secure"] ?? false),
            (bool)($params["httponly"] ?? true)
        );
    }

    json_response(["authenticated" => false, "configured" => admin_is_configured()]);
}

json_response(["error" => "Not found."], 404);
