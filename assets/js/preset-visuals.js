const BLOCK_LAYOUT_OVERRIDES = Object.freeze({
  "slide-structural-shift": {
    "shift-title": { w: 62 },
    "shift-body": { w: 62 }
  },
  "slide-innovation": {
    "innovation-title": { w: 60 },
    "innovation-body": { w: 62 }
  },
  "slide-market-opportunity": {
    "market-title": { w: 60 },
    "market-body": { w: 62 }
  },
  "slide-business-model": {
    "business-title": { w: 56 },
    "business-body": { w: 62 }
  },
  "slide-traction-validation": {
    "traction-body": { w: 62 }
  },
  "slide-roadmap": {
    "roadmap-body": { w: 62 }
  }
});

const VISUAL_FACTORIES = Object.freeze({
  "slide-structural-shift": createStructuralShiftVisual,
  "slide-innovation": createInnovationVisual,
  "slide-market-opportunity": createMarketVisual,
  "slide-business-model": createBusinessModelVisual,
  "slide-traction-validation": createTractionVisual,
  "slide-roadmap": createRoadmapVisual
});

const COUNTUP_DONE = new WeakSet();

export function applyPresetLayout(slideId, block) {
  if (!isPresetVisualViewport()) return block;
  const patch = BLOCK_LAYOUT_OVERRIDES[slideId]?.[block.id];
  return patch ? { ...block, ...patch } : block;
}

export function appendPresetVisual(canvas, slideId) {
  if (!isPresetVisualViewport()) return;
  const factory = VISUAL_FACTORIES[slideId];
  if (!factory) return;

  const layer = factory();
  if (!layer) return;

  layer.classList.add("slide-visual-layer");
  canvas.appendChild(layer);
}

export function syncActiveSlideVisuals(deckElement, activeSlideId) {
  const slideShells = deckElement.querySelectorAll(".slide-shell");
  slideShells.forEach((shell) => {
    const isActive = shell.dataset.slideId === activeSlideId;
    shell.classList.toggle("is-active", isActive);
    if (isActive) triggerCountups(shell);
  });
}

function triggerCountups(scope) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  scope.querySelectorAll(".countup").forEach((node, index) => {
    if (COUNTUP_DONE.has(node)) return;
    COUNTUP_DONE.add(node);

    const target = Number(node.dataset.target);
    if (!Number.isFinite(target)) return;

    const from = Number.isFinite(Number(node.dataset.from)) ? Number(node.dataset.from) : 0;
    const decimals = Number.isFinite(Number(node.dataset.decimals))
      ? Math.max(0, Number(node.dataset.decimals))
      : inferDecimals(target);
    const duration = Number.isFinite(Number(node.dataset.duration))
      ? Math.max(250, Number(node.dataset.duration))
      : 1200;
    const delay = Number.isFinite(Number(node.dataset.delay))
      ? Math.max(0, Number(node.dataset.delay))
      : index * 90;

    const prefix = node.dataset.prefix || "";
    const suffix = node.dataset.suffix || "";
    const startAt = performance.now() + delay;

    const renderValue = (value) => {
      const formatted = value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      node.textContent = `${prefix}${formatted}${suffix}`;
    };

    if (reduceMotion) {
      renderValue(target);
      return;
    }

    const step = (timestamp) => {
      if (timestamp < startAt) {
        requestAnimationFrame(step);
        return;
      }

      const elapsed = timestamp - startAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = from + (target - from) * eased;
      renderValue(progress >= 1 ? target : current);

      if (progress < 1) requestAnimationFrame(step);
    };

    renderValue(from);
    requestAnimationFrame(step);
  });
}

function inferDecimals(target) {
  const asString = String(target);
  if (!asString.includes(".")) return 0;
  return Math.min(2, asString.split(".")[1].length);
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function isPresetVisualViewport() {
  return window.matchMedia("(min-width: 1100px)").matches;
}

function createStructuralShiftVisual() {
  return createLayer(
    "slide-visual-layer--structural",
    `
      <section class="visual-card visual-card--line">
        <p class="visual-kicker">Risk Tempo</p>
        <h3 class="visual-heading">Reaction Window Compression</h3>
        <svg class="line-chart" viewBox="0 0 240 120" preserveAspectRatio="none" aria-hidden="true">
          <line x1="18" y1="92" x2="224" y2="92" class="line-chart__grid"></line>
          <line x1="18" y1="64" x2="224" y2="64" class="line-chart__grid"></line>
          <line x1="18" y1="36" x2="224" y2="36" class="line-chart__grid"></line>
          <polyline class="line-chart__area" points="18,92 18,26 50,34 82,44 114,56 146,66 178,76 210,84 210,92"></polyline>
          <polyline class="line-chart__path" pathLength="100" points="18,26 50,34 82,44 114,56 146,66 178,76 210,84"></polyline>
          <circle class="line-chart__dot" style="--order:0" cx="18" cy="26" r="3"></circle>
          <circle class="line-chart__dot" style="--order:1" cx="50" cy="34" r="3"></circle>
          <circle class="line-chart__dot" style="--order:2" cx="82" cy="44" r="3"></circle>
          <circle class="line-chart__dot" style="--order:3" cx="114" cy="56" r="3"></circle>
          <circle class="line-chart__dot" style="--order:4" cx="146" cy="66" r="3"></circle>
          <circle class="line-chart__dot" style="--order:5" cx="178" cy="76" r="3"></circle>
          <circle class="line-chart__dot" style="--order:6" cx="210" cy="84" r="3"></circle>
        </svg>
        <div class="line-chart__labels">
          <span>2019</span>
          <span>2026</span>
        </div>
      </section>

      <section class="visual-card visual-card--stats-grid">
        <article class="mini-stat">
          <p class="mini-stat__value"><span class="countup" data-target="240" data-prefix="+" data-suffix="%">0</span></p>
          <p class="mini-stat__label">AI-assisted campaign volume</p>
        </article>
        <article class="mini-stat">
          <p class="mini-stat__value"><span class="countup" data-target="6" data-suffix="x">0</span></p>
          <p class="mini-stat__label">Faster escalation cycles</p>
        </article>
      </section>
    `
  );
}

function createInnovationVisual() {
  return createLayer(
    "slide-visual-layer--innovation",
    `
      <section class="visual-card visual-card--ring">
        <p class="visual-kicker">Composite Signal</p>
        <div class="ring-chart">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="ring-track" cx="60" cy="60" r="46" pathLength="100"></circle>
            <circle class="ring-progress" style="--v:82" cx="60" cy="60" r="46" pathLength="100"></circle>
          </svg>
          <div class="ring-chart__center">
            <span class="countup" data-target="82" data-suffix="">0</span>
            <small>NRI score</small>
          </div>
        </div>
      </section>

      <section class="visual-card visual-card--hbars">
        <p class="visual-kicker">Signal Components</p>
        <div class="hbar-list">
          <div class="hbar-row">
            <span class="hbar-row__label">Convergence Velocity</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.86; --order:0"></span></div>
          </div>
          <div class="hbar-row">
            <span class="hbar-row__label">Institutional Proximity</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.78; --order:1"></span></div>
          </div>
          <div class="hbar-row">
            <span class="hbar-row__label">Sentiment Acceleration</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.74; --order:2"></span></div>
          </div>
          <div class="hbar-row">
            <span class="hbar-row__label">Network Expansion</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.81; --order:3"></span></div>
          </div>
        </div>
      </section>
    `
  );
}

function createMarketVisual() {
  return createLayer(
    "slide-visual-layer--market",
    `
      <section class="visual-card visual-card--vbars">
        <p class="visual-kicker">Addressable Value</p>
        <div class="vbar-chart">
          <div class="vbar" style="--order:0; --h:0.94">
            <span class="vbar__value">EUR 15B</span>
            <span class="vbar__label">TAM</span>
            <span class="vbar__fill"></span>
          </div>
          <div class="vbar" style="--order:1; --h:0.58">
            <span class="vbar__value">EUR 630M</span>
            <span class="vbar__label">SAM</span>
            <span class="vbar__fill"></span>
          </div>
          <div class="vbar" style="--order:2; --h:0.32">
            <span class="vbar__value">EUR 45M</span>
            <span class="vbar__label">SOM</span>
            <span class="vbar__fill"></span>
          </div>
        </div>
      </section>

      <section class="visual-card visual-card--badge">
        <p class="badge-title">Category CAGR</p>
        <p class="badge-value"><span class="countup" data-target="14" data-suffix="%">0</span></p>
        <p class="badge-sub">Driven by DORA and governance enforcement cycles</p>
      </section>
    `
  );
}

function createBusinessModelVisual() {
  return createLayer(
    "slide-visual-layer--business",
    `
      <section class="visual-card visual-card--hbars">
        <p class="visual-kicker">ACV Expansion</p>
        <div class="hbar-list">
          <div class="hbar-row">
            <span class="hbar-row__label">Entry</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.38; --order:0"></span></div>
            <span class="hbar-row__value">EUR 60K</span>
          </div>
          <div class="hbar-row">
            <span class="hbar-row__label">Growth</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.67; --order:1"></span></div>
            <span class="hbar-row__value">EUR 120K</span>
          </div>
          <div class="hbar-row">
            <span class="hbar-row__label">Enterprise</span>
            <div class="hbar-track"><span class="hbar-fill" style="--v:0.95; --order:2"></span></div>
            <span class="hbar-row__value">EUR 180K</span>
          </div>
        </div>
      </section>

      <section class="visual-card visual-card--stats-grid">
        <article class="mini-stat">
          <p class="mini-stat__value"><span class="countup" data-target="92" data-suffix="%">0</span></p>
          <p class="mini-stat__label">Expected renewal intent</p>
        </article>
        <article class="mini-stat">
          <p class="mini-stat__value"><span class="countup" data-target="5.4" data-suffix="x">0</span></p>
          <p class="mini-stat__label">Indicative LTV/CAC path</p>
        </article>
      </section>
    `
  );
}

function createTractionVisual() {
  return createLayer(
    "slide-visual-layer--traction",
    `
      <section class="visual-card visual-card--kpis">
        <div class="kpi-grid">
          <article class="kpi-tile">
            <p class="kpi-tile__value"><span class="countup" data-target="12">0</span></p>
            <p class="kpi-tile__label">Institutional engagements</p>
          </article>
          <article class="kpi-tile">
            <p class="kpi-tile__value"><span class="countup" data-target="3">0</span></p>
            <p class="kpi-tile__label">Live pilots in motion</p>
          </article>
          <article class="kpi-tile">
            <p class="kpi-tile__value"><span class="countup" data-target="450" data-prefix="EUR " data-suffix="K">0</span></p>
            <p class="kpi-tile__label">ARR horizon (month 6)</p>
          </article>
        </div>
      </section>

      <section class="visual-card visual-card--sparkline">
        <p class="visual-kicker">Pipeline Momentum</p>
        <svg class="sparkline" viewBox="0 0 240 80" preserveAspectRatio="none" aria-hidden="true">
          <polyline class="sparkline__area" points="0,74 0,66 36,64 72,58 108,52 144,40 180,30 216,18 240,10 240,74"></polyline>
          <polyline class="sparkline__path" pathLength="100" points="0,66 36,64 72,58 108,52 144,40 180,30 216,18 240,10"></polyline>
        </svg>
      </section>
    `
  );
}

function createRoadmapVisual() {
  return createLayer(
    "slide-visual-layer--roadmap",
    `
      <section class="visual-card visual-card--timeline">
        <p class="visual-kicker">Milestone Cadence</p>
        <div class="timeline-list">
          <article class="timeline-row" style="--order:0">
            <div class="timeline-row__meta">
              <span>0-6m</span>
              <span>MVP, NRI v1, first revenue</span>
            </div>
            <div class="timeline-track"><span class="timeline-fill" style="--v:0.84; --order:0"></span></div>
          </article>
          <article class="timeline-row" style="--order:1">
            <div class="timeline-row__meta">
              <span>7-18m</span>
              <span>8-15 customers, NRI v2</span>
            </div>
            <div class="timeline-track"><span class="timeline-fill" style="--v:0.68; --order:1"></span></div>
          </article>
          <article class="timeline-row" style="--order:2">
            <div class="timeline-row__meta">
              <span>18-24m</span>
              <span>Series A positioning</span>
            </div>
            <div class="timeline-track"><span class="timeline-fill" style="--v:0.52; --order:2"></span></div>
          </article>
        </div>
      </section>

      <section class="visual-card visual-card--badge">
        <p class="badge-title">ARR target band</p>
        <p class="badge-value"><span class="countup" data-target="3" data-prefix="EUR " data-suffix="M">0</span></p>
        <p class="badge-sub">Upper path by month 24 with disciplined execution</p>
      </section>
    `
  );
}

function createLayer(className, markup) {
  const layer = document.createElement("aside");
  layer.className = className;
  layer.innerHTML = markup;
  return layer;
}
