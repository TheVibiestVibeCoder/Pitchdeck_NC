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

    $theme = normalize_enum((string)($slide["theme"] ?? ""), ["obsidian", "cobalt", "ember", "emerald"], "obsidian");

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
            "style" => "glass",
            "tone" => "default",
        ];
    }

    return [
        "id" => normalize_id((string)($slide["id"] ?? ""), "slide-" . ($index + 1)),
        "title" => $title,
        "theme" => $theme,
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
        "style" => normalize_enum((string)($block["style"] ?? ""), ["glass", "solid", "outline", "accent", "plain"], "glass"),
        "tone" => normalize_enum((string)($block["tone"] ?? ""), ["default", "muted", "accent", "warning", "success"], "default"),
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
                "theme" => "obsidian",
                "blocks" => [
                    [
                        "id" => "cover-hero",
                        "text" => "Narrative Capture\nEurope’s Narrative Risk Intelligence Infrastructure",
                        "x" => 6,
                        "y" => 18,
                        "w" => 84,
                        "h" => 30,
                        "align" => "left",
                        "size" => "hero",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "cover-sub",
                        "text" => "We model how narratives converge into institutional risk.",
                        "x" => 6,
                        "y" => 56,
                        "w" => 72,
                        "h" => 14,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "muted",
                    ],
                ],
            ],
            [
                "id" => "slide-problem",
                "title" => "The Problem",
                "theme" => "ember",
                "blocks" => [
                    [
                        "id" => "problem-title",
                        "text" => "Narrative attacks no longer start as “fake news.”\nThey start as fragmented stories — and converge.",
                        "x" => 6,
                        "y" => 14,
                        "w" => 84,
                        "h" => 24,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "problem-body",
                        "text" => "By the time volume spikes:\n• Liquidity pressure may already begin\n• Regulators may already react\n• Governance escalation may already be underway\n\nInstitutions cannot currently measure narrative convergence risk.",
                        "x" => 6,
                        "y" => 42,
                        "w" => 84,
                        "h" => 46,
                        "align" => "left",
                        "size" => "body",
                        "style" => "glass",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-structural-shift",
                "title" => "Structural Shift (Why Now)",
                "theme" => "cobalt",
                "blocks" => [
                    [
                        "id" => "shift-title",
                        "text" => "Three irreversible shifts:",
                        "x" => 6,
                        "y" => 14,
                        "w" => 70,
                        "h" => 16,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "shift-body",
                        "text" => "1. AI has democratized influence operations\n2. Regulatory accountability is tightening (DORA, NIS2, CSRD, AI Act)\n3. Reaction time has compressed from weeks to hours\n\nNarrative convergence has become a governance risk — not a PR issue.",
                        "x" => 6,
                        "y" => 34,
                        "w" => 86,
                        "h" => 52,
                        "align" => "left",
                        "size" => "body",
                        "style" => "solid",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-gap",
                "title" => "The Gap",
                "theme" => "obsidian",
                "blocks" => [
                    [
                        "id" => "gap-title",
                        "text" => "Existing tools:",
                        "x" => 6,
                        "y" => 14,
                        "w" => 52,
                        "h" => 14,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "gap-body",
                        "text" => "• Monitor mentions\n• Detect disinformation\n• Analyze internal data\n\nNone model:\n• Actor alignment\n• Narrative convergence velocity\n• Institutional proximity\n• Escalation thresholds\n\nThere is no EU-native governance-grade narrative risk layer.",
                        "x" => 6,
                        "y" => 30,
                        "w" => 86,
                        "h" => 56,
                        "align" => "left",
                        "size" => "body",
                        "style" => "glass",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-solution",
                "title" => "The Solution",
                "theme" => "emerald",
                "blocks" => [
                    [
                        "id" => "solution-title",
                        "text" => "Narrative Capture",
                        "x" => 6,
                        "y" => 14,
                        "w" => 60,
                        "h" => 16,
                        "align" => "left",
                        "size" => "hero",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "solution-body",
                        "text" => "A sovereign SaaS platform that:\n• Clusters discourse into evolving narratives\n• Detects accelerating convergence\n• Maps actor ecosystems\n• Quantifies institutional exposure\n\nWe transform narrative volatility into measurable risk.",
                        "x" => 6,
                        "y" => 34,
                        "w" => 86,
                        "h" => 54,
                        "align" => "left",
                        "size" => "body",
                        "style" => "accent",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-innovation",
                "title" => "The Innovation: Narrative Risk Index (NRI)",
                "theme" => "cobalt",
                "blocks" => [
                    [
                        "id" => "innovation-title",
                        "text" => "A governance-grade composite risk signal.",
                        "x" => 6,
                        "y" => 14,
                        "w" => 80,
                        "h" => 16,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "innovation-body",
                        "text" => "NRI integrates:\n• Convergence Velocity\n• Institutional Proximity\n• Sentiment Acceleration\n• Network Expansion\n\nOutput:\nEscalation triggers, audit-ready reporting, board dashboards.\n\nNot visibility.\nRisk quantification.",
                        "x" => 6,
                        "y" => 32,
                        "w" => 86,
                        "h" => 56,
                        "align" => "left",
                        "size" => "body",
                        "style" => "solid",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-market-opportunity",
                "title" => "Market Opportunity",
                "theme" => "ember",
                "blocks" => [
                    [
                        "id" => "market-title",
                        "text" => "Primary Anchor: European GRC & RegTech",
                        "x" => 6,
                        "y" => 14,
                        "w" => 84,
                        "h" => 16,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "market-body",
                        "text" => "• €5–15B market\n• 11–14% CAGR\n• Enforcement cycle accelerating\n\nServiceable Market (regulated EU institutions):\n€132M–€630M\n\nInitial DACH SOM:\n€18M–€45M\n\nWe start with financial institutions under DORA.",
                        "x" => 6,
                        "y" => 32,
                        "w" => 86,
                        "h" => 56,
                        "align" => "left",
                        "size" => "body",
                        "style" => "glass",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-business-model",
                "title" => "Business Model",
                "theme" => "emerald",
                "blocks" => [
                    [
                        "id" => "business-title",
                        "text" => "Enterprise SaaS",
                        "x" => 6,
                        "y" => 14,
                        "w" => 60,
                        "h" => 16,
                        "align" => "left",
                        "size" => "hero",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "business-body",
                        "text" => "ACV: €60K–€180K\nAnnual contracts\nRisk & compliance budget (not marketing)\n\nTiered expansion:\nSector → Institution → Adaptive modeling\n\nLand-and-expand built into architecture.",
                        "x" => 6,
                        "y" => 32,
                        "w" => 86,
                        "h" => 54,
                        "align" => "left",
                        "size" => "body",
                        "style" => "accent",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-competitive-positioning",
                "title" => "Competitive Positioning",
                "theme" => "obsidian",
                "blocks" => [
                    [
                        "id" => "competition-title",
                        "text" => "Three adjacent categories:",
                        "x" => 6,
                        "y" => 14,
                        "w" => 72,
                        "h" => 16,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "competition-body",
                        "text" => "1. Monitoring tools → visibility only\n2. US narrative risk platforms → not EU-embedded\n3. EU OSINT firms → service-heavy, not SaaS-native\n\nWe build the first EU-native narrative risk infrastructure integrated into GRC workflows.\n\nMoats:\n• Regulatory embedding\n• Sovereignty alignment\n• Ecosystem learning\n• Switching costs via risk register integration",
                        "x" => 6,
                        "y" => 31,
                        "w" => 86,
                        "h" => 58,
                        "align" => "left",
                        "size" => "body",
                        "style" => "glass",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-traction-validation",
                "title" => "Traction & Validation",
                "theme" => "cobalt",
                "blocks" => [
                    [
                        "id" => "traction-body",
                        "text" => "• Operational consulting arm already serving institutions\n• Institutional contracts incl. EU-level engagement\n• Direct access to regulated buyers\n• MVP live in DACH ecosystem\n\nGoal by Month 6:\n2–3 SaaS customers\n€120K–450K ARR\n\nProof > scale.",
                        "x" => 6,
                        "y" => 16,
                        "w" => 86,
                        "h" => 70,
                        "align" => "left",
                        "size" => "body",
                        "style" => "solid",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-roadmap",
                "title" => "Roadmap",
                "theme" => "emerald",
                "blocks" => [
                    [
                        "id" => "roadmap-body",
                        "text" => "0–6 months:\n• Compliance-ready MVP\n• NRI v1\n• First recurring revenue\n\n7–18 months:\n• NRI v2\n• 8–15 customers\n• €480K–2.2M ARR\n\n18–24 months:\n• €1–3M ARR\n• Series A positioning\n\nDisciplined, milestone-driven build.",
                        "x" => 6,
                        "y" => 16,
                        "w" => 86,
                        "h" => 70,
                        "align" => "left",
                        "size" => "body",
                        "style" => "accent",
                        "tone" => "default",
                    ],
                ],
            ],
            [
                "id" => "slide-team-ask",
                "title" => "The Team & The Ask",
                "theme" => "obsidian",
                "blocks" => [
                    [
                        "id" => "team-title",
                        "text" => "Founder-market fit:",
                        "x" => 6,
                        "y" => 14,
                        "w" => 64,
                        "h" => 16,
                        "align" => "left",
                        "size" => "title",
                        "style" => "plain",
                        "tone" => "default",
                    ],
                    [
                        "id" => "team-body",
                        "text" => "• Government FIMI insider\n• AI & software architecture\n• EU regulatory law\n• Enterprise GTM\n\nPlus regulatory & defense advisory network.\n\nWe are raising to:\n• Finalize production infrastructure\n• Expand engineering\n• Accelerate DACH penetration\n• Embed NRI in enterprise risk workflows\n\nNarrative Capture becomes the narrative risk layer inside European governance infrastructure.",
                        "x" => 6,
                        "y" => 32,
                        "w" => 86,
                        "h" => 58,
                        "align" => "left",
                        "size" => "body",
                        "style" => "glass",
                        "tone" => "default",
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
