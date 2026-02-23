import { fetchDeck } from "./shared/api.js";
import { SIZE_CLASS_MAP, normalizeDeck, num, clamp } from "./shared/deck-utils.js";

const refs = {
  deck: document.getElementById("deckScroll"),
  progress: document.getElementById("slideProgress"),
  counter: document.getElementById("slideCounter"),
  activeTitle: document.getElementById("activeSlideTitle"),
  refreshBtn: document.getElementById("refreshBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn")
};

const state = {
  deck: null,
  activeSlideId: null
};

let observer = null;
let errorTimer = null;

init();

async function init() {
  bindEvents();
  await loadDeck();
}

function bindEvents() {
  refs.refreshBtn.addEventListener("click", loadDeck);
  refs.fullscreenBtn.addEventListener("click", toggleFullscreen);

  refs.progress.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-slide-id]");
    if (!dot) return;
    const slideId = dot.dataset.slideId;
    state.activeSlideId = slideId;
    renderProgress();
    updateHeader();
    scrollToSlide(slideId);
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "f") {
      event.preventDefault();
      toggleFullscreen();
      return;
    }

    if (event.key === "PageDown" || event.key === "ArrowDown") {
      event.preventDefault();
      jumpSlide(1);
      return;
    }

    if (event.key === "PageUp" || event.key === "ArrowUp") {
      event.preventDefault();
      jumpSlide(-1);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    refs.fullscreenBtn.textContent = document.fullscreenElement
      ? "Exit Fullscreen"
      : "Fullscreen";
  });
}

async function loadDeck() {
  try {
    refs.refreshBtn.disabled = true;
    const payload = await fetchDeck();
    state.deck = normalizeDeck(payload);

    const hasActiveSlide = state.deck.slides.some((slide) => slide.id === state.activeSlideId);
    if (!hasActiveSlide) {
      state.activeSlideId = state.deck.slides[0]?.id || null;
    }

    renderDeck();
    clearError();
  } catch (error) {
    showError(error.message || "Failed to load deck.");
  } finally {
    refs.refreshBtn.disabled = false;
  }
}

function renderDeck() {
  refs.deck.innerHTML = "";
  const slides = state.deck?.slides || [];

  slides.forEach((slide, index) => {
    const shell = document.createElement("section");
    shell.className = "slide-shell";
    shell.dataset.slideId = slide.id;

    const canvas = document.createElement("article");
    canvas.className = "slide-canvas";
    canvas.innerHTML = `
      <div class="slide-grid"></div>
      <div class="slide-meta">
        <div>
          <p class="text-label">Slide ${String(index + 1).padStart(2, "0")}</p>
          <p class="slide-title"></p>
        </div>
      </div>
      <div class="slide-content"></div>
    `;
    canvas.querySelector(".slide-title").textContent = slide.title;

    const content = canvas.querySelector(".slide-content");
    slide.blocks.forEach((block) => content.appendChild(buildBlockElement(block)));

    shell.appendChild(canvas);
    refs.deck.appendChild(shell);
  });

  setupObserver();
  renderProgress();
  updateHeader();
}

function buildBlockElement(block) {
  const el = document.createElement("div");
  el.className = `slide-block ${SIZE_CLASS_MAP[block.size] || SIZE_CLASS_MAP.body}`;
  applyBlockStyle(el, block);

  const text = document.createElement("p");
  text.className = "slide-block__text";
  text.textContent = block.text;
  el.appendChild(text);

  return el;
}

function applyBlockStyle(element, block) {
  const width = clamp(num(block.w, 40), 4, 100);
  const height = clamp(num(block.h, 20), 4, 100);
  const x = clamp(num(block.x, 0), 0, 100 - width);
  const y = clamp(num(block.y, 0), 0, 100 - height);

  element.style.left = `${x}%`;
  element.style.top = `${y}%`;
  element.style.width = `${width}%`;
  element.style.height = `${height}%`;
  element.style.textAlign = block.align || "left";
}

function setupObserver() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.58) return;
        const nextActiveId = entry.target.dataset.slideId;
        if (nextActiveId === state.activeSlideId) return;
        state.activeSlideId = nextActiveId;
        renderProgress();
        updateHeader();
      });
    },
    {
      root: refs.deck,
      threshold: [0.42, 0.58, 0.75]
    }
  );

  refs.deck.querySelectorAll(".slide-shell").forEach((node) => observer.observe(node));
}

function renderProgress() {
  refs.progress.innerHTML = "";
  const slides = state.deck?.slides || [];
  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `progress-dot${slide.id === state.activeSlideId ? " is-active" : ""}`;
    dot.dataset.slideId = slide.id;
    dot.title = `Slide ${index + 1}: ${slide.title}`;
    dot.setAttribute("aria-label", `Jump to slide ${index + 1}`);
    refs.progress.appendChild(dot);
  });
}

function updateHeader() {
  const slides = state.deck?.slides || [];
  const activeIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.id === state.activeSlideId)
  );
  const activeSlide = slides[activeIndex];

  refs.counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(
    slides.length
  ).padStart(2, "0")}`;
  refs.activeTitle.textContent = activeSlide?.title || "Viewer";
}

function jumpSlide(delta) {
  const slides = state.deck?.slides || [];
  if (!slides.length) return;
  const currentIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.id === state.activeSlideId)
  );
  const targetIndex = clamp(currentIndex + delta, 0, slides.length - 1);
  const targetSlide = slides[targetIndex];
  if (!targetSlide) return;
  state.activeSlideId = targetSlide.id;
  renderProgress();
  updateHeader();
  scrollToSlide(targetSlide.id);
}

function scrollToSlide(slideId) {
  const target = refs.deck.querySelector(`.slide-shell[data-slide-id="${slideId}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    return;
  }
  document.exitFullscreen().catch(() => {});
}

function showError(message) {
  clearError();
  const banner = document.createElement("div");
  banner.className = "error-banner";
  banner.textContent = message;
  document.body.appendChild(banner);
  errorTimer = setTimeout(() => {
    banner.remove();
  }, 4600);
}

function clearError() {
  if (errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
  document.querySelectorAll(".error-banner").forEach((node) => node.remove());
}

