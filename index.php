<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pitchdeck Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/viewer.css">
</head>
<body class="viewer-layout">
  <header class="app-topbar panel">
    <div class="brand">
      <span class="brand-dot" aria-hidden="true"></span>
      <div>
        <p class="text-label">Pitchdeck</p>
        <p id="activeSlideTitle" class="brand-title">Viewer</p>
      </div>
    </div>
    <div class="toolbar">
      <span id="slideCounter" class="counter-pill">00 / 00</span>
      <button id="refreshBtn" class="btn btn--ghost btn--sm" type="button">Refresh</button>
      <button id="fullscreenBtn" class="btn btn--ghost btn--sm" type="button">Fullscreen</button>
      <a href="/admin.php" class="btn btn--primary btn--sm">Admin</a>
    </div>
  </header>

  <nav id="slideProgress" class="slide-progress" aria-label="Slide navigation"></nav>
  <main id="deckScroll" class="deck-scroll" aria-label="Pitchdeck slides"></main>

  <script type="module" src="/assets/js/viewer.js"></script>
</body>
</html>

