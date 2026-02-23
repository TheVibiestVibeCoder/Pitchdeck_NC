<?php
declare(strict_types=1);

require_once __DIR__ . DIRECTORY_SEPARATOR . "bootstrap.php";

function load_deck(): array
{
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0775, true);
    }

    if (!is_file(DECK_FILE)) {
        $defaultDeck = create_default_deck();
        save_deck($defaultDeck);
        return $defaultDeck;
    }

    $raw = file_get_contents(DECK_FILE);
    if ($raw === false || trim($raw) === "") {
        $defaultDeck = create_default_deck();
        save_deck($defaultDeck);
        return $defaultDeck;
    }

    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable) {
        $defaultDeck = create_default_deck();
        save_deck($defaultDeck);
        return $defaultDeck;
    }

    return normalize_deck($decoded);
}

function save_deck(array $deck): void
{
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0775, true);
    }

    $normalized = normalize_deck($deck);
    $serialized = json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($serialized === false) {
        throw new RuntimeException("Failed to serialize deck.");
    }

    file_put_contents(DECK_FILE, $serialized . PHP_EOL, LOCK_EX);
}

function normalize_deck($input): array
{
    if (!is_array($input) || !isset($input["slides"]) || !is_array($input["slides"]) || count($input["slides"]) === 0) {
        return create_default_deck();
    }

    $slides = [];
    foreach ($input["slides"] as $index => $slide) {
        $normalized = normalize_slide($slide, (int)$index);
        if ($normalized !== null) {
            $slides[] = $normalized;
        }
    }

    if (count($slides) === 0) {
        return create_default_deck();
    }

    return [
        "updatedAt" => is_string($input["updatedAt"] ?? null) ? $input["updatedAt"] : gmdate("c"),
        "slides" => $slides,
    ];
}

function normalize_slide($slide, int $index): ?array
{
    if (!is_array($slide)) {
        return null;
    }

    $title = trim((string)($slide["title"] ?? ""));
    if ($title === "") {
        $title = "Slide " . ($index + 1);
    }

    $blocks = [];
    if (isset($slide["blocks"]) && is_array($slide["blocks"])) {
        foreach ($slide["blocks"] as $blockIndex => $block) {
            $normalizedBlock = normalize_block($block, (int)$blockIndex);
            if ($normalizedBlock !== null) {
                $blocks[] = $normalizedBlock;
            }
        }
    }

    if (count($blocks) === 0) {
        $blocks[] = [
            "id" => "block-default",
            "text" => "Editable entry",
            "x" => 8,
            "y" => 10,
            "w" => 44,
            "h" => 22,
            "align" => "left",
            "size" => "body",
        ];
    }

    return [
        "id" => normalize_id((string)($slide["id"] ?? ""), "slide-" . ($index + 1)),
        "title" => $title,
        "blocks" => $blocks,
    ];
}

function normalize_block($block, int $index): ?array
{
    if (!is_array($block)) {
        return null;
    }

    $width = clamp_number(to_number($block["w"] ?? null, 40), 4, 100);
    $height = clamp_number(to_number($block["h"] ?? null, 20), 4, 100);
    $x = clamp_number(to_number($block["x"] ?? null, 0), 0, 100 - $width);
    $y = clamp_number(to_number($block["y"] ?? null, 0), 0, 100 - $height);
    $text = (string)($block["text"] ?? "");
    if (trim($text) === "") {
        $text = "Entry " . ($index + 1);
    }

    return [
        "id" => normalize_id((string)($block["id"] ?? ""), "block-" . ($index + 1)),
        "text" => $text,
        "x" => $x,
        "y" => $y,
        "w" => $width,
        "h" => $height,
        "align" => normalize_enum((string)($block["align"] ?? ""), ["left", "center", "right"], "left"),
        "size" => normalize_enum((string)($block["size"] ?? ""), ["caption", "body", "title", "metric", "hero"], "body"),
    ];
}

function create_default_deck(): array
{
    return [
        "updatedAt" => gmdate("c"),
        "slides" => [
            [
                "id" => "slide-cover",
                "title" => "Cover",
                "blocks" => [
                    [
                        "id" => "cover-hero",
                        "text" => "Northern Current\nPitch Deck 2026",
                        "x" => 6,
                        "y" => 14,
                        "w" => 62,
                        "h" => 36,
                        "align" => "left",
                        "size" => "hero",
                    ],
                    [
                        "id" => "cover-sub",
                        "text" => "A web-first pitchdeck template.\nScroll to move between slides.",
                        "x" => 6,
                        "y" => 56,
                        "w" => 54,
                        "h" => 20,
                        "align" => "left",
                        "size" => "body",
                    ],
                ],
            ],
            [
                "id" => "slide-opportunity",
                "title" => "Problem & Opportunity",
                "blocks" => [
                    [
                        "id" => "op-title",
                        "text" => "The market is fragmented.\nDecision cycles are slow.",
                        "x" => 7,
                        "y" => 16,
                        "w" => 50,
                        "h" => 26,
                        "align" => "left",
                        "size" => "title",
                    ],
                    [
                        "id" => "op-body",
                        "text" => "Teams spend days assembling insights from disconnected tools.",
                        "x" => 7,
                        "y" => 48,
                        "w" => 42,
                        "h" => 28,
                        "align" => "left",
                        "size" => "body",
                    ],
                    [
                        "id" => "op-metric",
                        "text" => "Opportunity\n$2.6B TAM",
                        "x" => 62,
                        "y" => 24,
                        "w" => 28,
                        "h" => 32,
                        "align" => "center",
                        "size" => "metric",
                    ],
                ],
            ],
            [
                "id" => "slide-traction",
                "title" => "Traction",
                "blocks" => [
                    [
                        "id" => "tr-title",
                        "text" => "Early traction validates demand.",
                        "x" => 8,
                        "y" => 14,
                        "w" => 54,
                        "h" => 18,
                        "align" => "left",
                        "size" => "title",
                    ],
                    [
                        "id" => "tr-1",
                        "text" => "43%\nMoM growth",
                        "x" => 8,
                        "y" => 42,
                        "w" => 24,
                        "h" => 28,
                        "align" => "left",
                        "size" => "metric",
                    ],
                    [
                        "id" => "tr-2",
                        "text" => "19 pilots\nacross 5 sectors",
                        "x" => 38,
                        "y" => 42,
                        "w" => 24,
                        "h" => 28,
                        "align" => "left",
                        "size" => "metric",
                    ],
                    [
                        "id" => "tr-3",
                        "text" => "91 NPS\nfrom design partners",
                        "x" => 68,
                        "y" => 42,
                        "w" => 24,
                        "h" => 28,
                        "align" => "left",
                        "size" => "metric",
                    ],
                ],
            ],
        ],
    ];
}

function normalize_id(string $value, string $fallback): string
{
    $trimmed = trim($value);
    if ($trimmed === "") {
        return $fallback;
    }

    $normalized = preg_replace("/[^a-zA-Z0-9_-]+/", "-", $trimmed);
    if (!is_string($normalized) || $normalized === "") {
        return $fallback;
    }

    return $normalized;
}

function normalize_enum(string $value, array $allowedValues, string $fallback): string
{
    return in_array($value, $allowedValues, true) ? $value : $fallback;
}

function to_number($value, float $fallback): float
{
    if (is_numeric($value)) {
        return (float)$value;
    }
    return $fallback;
}

function clamp_number(float $value, float $min, float $max): float
{
    if ($value < $min) {
        return $min;
    }
    if ($value > $max) {
        return $max;
    }
    return $value;
}

