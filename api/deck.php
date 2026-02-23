<?php
declare(strict_types=1);

require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . "includes" . DIRECTORY_SEPARATOR . "deck.php";

app_bootstrap();
$method = strtoupper((string)($_SERVER["REQUEST_METHOD"] ?? "GET"));
$action = strtolower(trim((string)($_GET["action"] ?? "")));

if ($method === "GET") {
    $deck = load_deck();
    json_response(["deck" => $deck]);
}

if ($method === "PUT" || ($method === "POST" && ($action === "" || $action === "save"))) {
    require_admin_auth();

    try {
        $payload = read_json_body();
    } catch (RuntimeException $exception) {
        json_response(["error" => $exception->getMessage()], 400);
    }

    $inputDeck = $payload["deck"] ?? $payload;
    $deck = normalize_deck(is_array($inputDeck) ? $inputDeck : []);
    $deck["updatedAt"] = gmdate("c");
    save_deck($deck);
    json_response(["deck" => $deck, "message" => "Deck saved."]);
}

method_not_allowed(["GET", "POST", "PUT"]);
