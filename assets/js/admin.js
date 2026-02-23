import { fetchDeck, getAuthStatus, login, logout, saveDeck } from "./shared/api.js";
import {
  SIZE_CLASS_MAP,
  createDefaultDeck,
  normalizeDeck,
  uid,
  previewText,
  num,
  clamp
} from "./shared/deck-utils.js";

const refs = {
  authScreen: document.getElementById("authScreen"),
  editorScreen: document.getElementById("editorScreen"),
  loginForm: document.getElementById("loginForm"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),
  authError: document.getElementById("authError"),
  saveDeckBtn: document.getElementById("saveDeckBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  addSlideBtn: document.getElementById("addSlideBtn"),
  addBlockBtn: document.getElementById("addBlockBtn"),
  deleteBlockBtn: document.getElementById("deleteBlockBtn"),
  resetDeckBtn: document.getElementById("resetDeckBtn"),
  slideSelect: document.getElementById("slideSelect"),
  slideTitle: document.getElementById("slideTitle"),
  blockList: document.getElementById("blockList"),
  blockForm: document.getElementById("blockForm"),
  blockText: document.getElementById("blockText"),
  blockX: document.getElementById("blockX"),
  blockY: document.getElementById("blockY"),
  blockW: document.getElementById("blockW"),
  blockH: document.getElementById("blockH"),
  blockAlign: document.getElementById("blockAlign"),
  blockSize: document.getElementById("blockSize"),
  adminStatus: document.getElementById("adminStatus"),
  deck: document.getElementById("deckScroll"),
  progress: document.getElementById("slideProgress")
};

const state = {
  deck: createDefaultDeck(),
  selectedSlideId: null,
  selectedBlockId: null,
  activeSlideId: null,
  dirty: false,
  authenticated: false
};

let observer = null;

init();

async function init() {
  bindEvents();
  await bootstrapAuth();
}

function bindEvents() {
  refs.loginForm.addEventListener("submit", onLoginSubmit);
  refs.logoutBtn.addEventListener("click", onLogoutClick);

  refs.saveDeckBtn.addEventListener("click", saveDeckChanges);
  refs.addSlideBtn.addEventListener("click", addSlide);
  refs.addBlockBtn.addEventListener("click", addBlock);
  refs.deleteBlockBtn.addEventListener("click", deleteBlock);
  refs.resetDeckBtn.addEventListener("click", resetDeck);

  refs.slideSelect.addEventListener("change", onSlideSelectChange);
  refs.slideTitle.addEventListener("input", onSlideTitleInput);
  refs.blockList.addEventListener("click", onBlockListClick);
  refs.blockForm.addEventListener("input", onBlockInput);

  refs.progress.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-slide-id]");
    if (!dot) return;
    const slideId = dot.dataset.slideId;
    state.activeSlideId = slideId;
    state.selectedSlideId = slideId;
    const slide = currentSlide();
    state.selectedBlockId = slide?.blocks[0]?.id || null;
    renderAdminControls();
    syncSelection();
    renderProgress();
    scrollToSlide(slideId);
  });

  refs.deck.addEventListener("click", (event) => {
    const block = event.target.closest(".slide-block");
    if (block) {
      state.selectedSlideId = block.dataset.slideId;
      state.selectedBlockId = block.dataset.blockId;
      state.activeSlideId = block.dataset.slideId;
      renderAdminControls();
      syncSelection();
      renderProgress();
      return;
    }

    const slide = event.target.closest(".slide-shell");
    if (!slide) return;
    state.selectedSlideId = slide.dataset.slideId;
    const selectedSlide = currentSlide();
    state.selectedBlockId = selectedSlide?.blocks[0]?.id || null;
    state.activeSlideId = state.selectedSlideId;
    renderAdminControls();
    syncSelection();
    renderProgress();
  });

  document.addEventListener("keydown", (event) => {
    if (!state.authenticated) return;

    const targetTag = event.target.tagName?.toLowerCase();
    const isTyping = ["input", "textarea", "select"].includes(targetTag);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveDeckChanges();
      return;
    }

    if (isTyping) return;

    if (event.key === "PageDown" || event.key === "ArrowDown") {
      event.preventDefault();
      jumpSlide(1);
      return;
    }

    if (event.key === "PageUp" || event.key === "ArrowUp") {
      event.preventDefault();
      jumpSlide(-1);
      return;
    }

    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
  });
}

async function bootstrapAuth() {
  try {
    const status = await getAuthStatus();
    if (!status.configured) {
      openAuth("Admin credentials are not configured in .env.");
      return;
    }
    if (status.authenticated) {
      await openEditor();
      return;
    }
    openAuth();
  } catch (error) {
    openAuth("Unable to reach server API.");
    setStatus(error.message || "Auth check failed.", true);
  }
}

async function onLoginSubmit(event) {
  event.preventDefault();
  setAuthError("");

  const submitButton = refs.loginForm.querySelector('button[type="submit"]');
  const username = refs.usernameInput.value.trim();
  const password = refs.passwordInput.value;

  if (!username || !password) {
    setAuthError("Enter username and password.");
    return;
  }

  try {
    submitButton.disabled = true;
    await login(username, password);
    refs.passwordInput.value = "";
    await openEditor();
  } catch (error) {
    setAuthError(error.message || "Login failed.");
  } finally {
    submitButton.disabled = false;
  }
}

async function onLogoutClick() {
  try {
    await logout();
  } catch {
    // ignore
  }
  openAuth();
}

async function openEditor() {
  state.authenticated = true;
  refs.authScreen.classList.add("hidden");
  refs.editorScreen.classList.remove("hidden");
  refs.saveDeckBtn.classList.remove("hidden");
  refs.logoutBtn.classList.remove("hidden");
  await loadDeck();
}

function openAuth(message = "") {
  state.authenticated = false;
  refs.editorScreen.classList.add("hidden");
  refs.authScreen.classList.remove("hidden");
  refs.saveDeckBtn.classList.add("hidden");
  refs.logoutBtn.classList.add("hidden");
  setAuthError(message);
}

async function loadDeck() {
  try {
    const payload = await fetchDeck();
    state.deck = normalizeDeck(payload);
    state.dirty = false;
    updateSaveButton();
    ensureSelection();
    renderDeck(false);
    renderAdminControls();
    setStatus(`Loaded ${state.deck.slides.length} slides.`);
  } catch (error) {
    setStatus(error.message || "Failed to load deck.", true);
  }
}

async function saveDeckChanges() {
  if (!state.authenticated) return;

  try {
    refs.saveDeckBtn.disabled = true;
    refs.saveDeckBtn.textContent = "Saving...";
    const savedDeck = await saveDeck(state.deck);
    state.deck = normalizeDeck(savedDeck);
    state.dirty = false;
    updateSaveButton();
    renderDeck();
    renderAdminControls();
    setStatus(`Saved at ${new Date().toLocaleTimeString()}.`);
  } catch (error) {
    setStatus(error.message || "Save failed.", true);
  } finally {
    refs.saveDeckBtn.disabled = false;
    updateSaveButton();
  }
}

function renderDeck(preserveScroll = true) {
  const scrollTop = refs.deck.scrollTop;
  refs.deck.innerHTML = "";

  state.deck.slides.forEach((slide, index) => {
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
    slide.blocks.forEach((block, blockIndex) => {
      content.appendChild(buildBlockElement(slide.id, block, blockIndex));
    });

    shell.appendChild(canvas);
    refs.deck.appendChild(shell);
  });

  if (preserveScroll) refs.deck.scrollTop = scrollTop;
  setupObserver();
  syncSelection();
  renderProgress();
}

function buildBlockElement(slideId, block, index) {
  const el = document.createElement("div");
  el.className = `slide-block ${SIZE_CLASS_MAP[block.size] || SIZE_CLASS_MAP.body}`;
  el.dataset.slideId = slideId;
  el.dataset.blockId = block.id;
  el.style.setProperty("--i", String(index));
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
        const id = entry.target.dataset.slideId;
        if (state.activeSlideId === id) return;
        state.activeSlideId = id;
        renderProgress();
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
  state.deck.slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `progress-dot${slide.id === state.activeSlideId ? " is-active" : ""}`;
    dot.dataset.slideId = slide.id;
    dot.title = `Slide ${index + 1}: ${slide.title}`;
    dot.setAttribute("aria-label", `Jump to slide ${index + 1}`);
    refs.progress.appendChild(dot);
  });
}

function renderAdminControls() {
  ensureSelection();
  renderSlideSelect();
  renderBlockList();
  syncFormFields();
}

function renderSlideSelect() {
  refs.slideSelect.innerHTML = "";
  state.deck.slides.forEach((slide, index) => {
    const option = document.createElement("option");
    option.value = slide.id;
    option.textContent = `Slide ${index + 1} - ${slide.title}`;
    refs.slideSelect.appendChild(option);
  });
  refs.slideSelect.value = state.selectedSlideId || "";
}

function renderBlockList() {
  refs.blockList.innerHTML = "";
  const slide = currentSlide();
  if (!slide || !slide.blocks.length) {
    refs.blockList.innerHTML = '<div class="empty-note">No entries in this slide.</div>';
    return;
  }

  slide.blocks.forEach((block, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `block-item${block.id === state.selectedBlockId ? " is-active" : ""}`;
    item.dataset.blockId = block.id;
    item.textContent = previewText(block.text, index);
    refs.blockList.appendChild(item);
  });
}

function syncFormFields() {
  const slide = currentSlide();
  const block = currentBlock();
  const disabled = !slide || !block;

  refs.slideTitle.value = slide?.title || "";
  refs.deleteBlockBtn.disabled = disabled;

  [
    refs.blockText,
    refs.blockX,
    refs.blockY,
    refs.blockW,
    refs.blockH,
    refs.blockAlign,
    refs.blockSize
  ].forEach((field) => {
    field.disabled = disabled;
  });

  if (disabled) {
    refs.blockText.value = "";
    refs.blockX.value = "";
    refs.blockY.value = "";
    refs.blockW.value = "";
    refs.blockH.value = "";
    refs.blockAlign.value = "left";
    refs.blockSize.value = "body";
    return;
  }

  refs.blockText.value = block.text;
  refs.blockX.value = String(block.x);
  refs.blockY.value = String(block.y);
  refs.blockW.value = String(block.w);
  refs.blockH.value = String(block.h);
  refs.blockAlign.value = block.align;
  refs.blockSize.value = block.size;
}

function syncSelection() {
  refs.deck.querySelectorAll(".slide-block.is-selected").forEach((el) => el.classList.remove("is-selected"));
  const selected = blockElement(state.selectedSlideId, state.selectedBlockId);
  if (selected) selected.classList.add("is-selected");
}

function onSlideSelectChange() {
  state.selectedSlideId = refs.slideSelect.value;
  state.activeSlideId = state.selectedSlideId;
  const slide = currentSlide();
  state.selectedBlockId = slide?.blocks[0]?.id || null;
  renderAdminControls();
  syncSelection();
  renderProgress();
  scrollToSlide(state.selectedSlideId);
}

function onSlideTitleInput() {
  const slide = currentSlide();
  if (!slide) return;
  slide.title = refs.slideTitle.value || "Untitled";
  const titleEl = refs.deck.querySelector(
    `.slide-shell[data-slide-id="${slide.id}"] .slide-title`
  );
  if (titleEl) titleEl.textContent = slide.title;
  renderSlideSelect();
  renderProgress();
  markDirty();
}

function onBlockListClick(event) {
  const item = event.target.closest("[data-block-id]");
  if (!item) return;
  state.selectedBlockId = item.dataset.blockId;
  renderBlockList();
  syncFormFields();
  syncSelection();
}

function onBlockInput() {
  const block = currentBlock();
  if (!block) return;

  block.text = refs.blockText.value;
  block.w = clamp(num(refs.blockW.value, block.w), 4, 100);
  block.h = clamp(num(refs.blockH.value, block.h), 4, 100);
  block.x = clamp(num(refs.blockX.value, block.x), 0, 100 - block.w);
  block.y = clamp(num(refs.blockY.value, block.y), 0, 100 - block.h);
  block.align = refs.blockAlign.value;
  block.size = refs.blockSize.value;

  refs.blockX.value = String(block.x);
  refs.blockY.value = String(block.y);
  refs.blockW.value = String(block.w);
  refs.blockH.value = String(block.h);

  const previewEl = blockElement(state.selectedSlideId, state.selectedBlockId);
  if (previewEl) {
    previewEl.className = `slide-block ${SIZE_CLASS_MAP[block.size] || SIZE_CLASS_MAP.body} is-selected`;
    applyBlockStyle(previewEl, block);
    const textNode = previewEl.querySelector(".slide-block__text");
    if (textNode) textNode.textContent = block.text;
  }

  const listEl = refs.blockList.querySelector(`[data-block-id="${state.selectedBlockId}"]`);
  const slide = currentSlide();
  if (listEl && slide) {
    const index = slide.blocks.findIndex((entry) => entry.id === block.id);
    listEl.textContent = previewText(block.text, index);
  }

  markDirty();
}

function addSlide() {
  const slideId = uid("slide");
  const blockId = uid("block");
  state.deck.slides.push({
    id: slideId,
    title: `New Slide ${state.deck.slides.length + 1}`,
    blocks: [
      {
        id: blockId,
        text: "New entry",
        x: 8,
        y: 12,
        w: 44,
        h: 20,
        align: "left",
        size: "title"
      }
    ]
  });

  state.selectedSlideId = slideId;
  state.selectedBlockId = blockId;
  state.activeSlideId = slideId;
  renderDeck(false);
  renderAdminControls();
  scrollToSlide(slideId);
  markDirty();
}

function addBlock() {
  const slide = currentSlide();
  if (!slide) return;
  const block = {
    id: uid("block"),
    text: "Editable entry",
    x: 10,
    y: 16,
    w: 34,
    h: 18,
    align: "left",
    size: "body"
  };
  slide.blocks.push(block);
  state.selectedBlockId = block.id;
  renderDeck();
  renderAdminControls();
  markDirty();
}

function deleteBlock() {
  const slide = currentSlide();
  if (!slide || !state.selectedBlockId) return;
  slide.blocks = slide.blocks.filter((entry) => entry.id !== state.selectedBlockId);
  state.selectedBlockId = slide.blocks[0]?.id || null;
  renderDeck();
  renderAdminControls();
  markDirty();
}

function resetDeck() {
  state.deck = createDefaultDeck();
  ensureSelection();
  renderDeck(false);
  renderAdminControls();
  markDirty();
  setStatus("Reset to demo deck. Save to publish.");
}

function jumpSlide(delta) {
  const slides = state.deck.slides;
  const index = Math.max(0, slides.findIndex((slide) => slide.id === state.activeSlideId));
  const nextIndex = clamp(index + delta, 0, slides.length - 1);
  const next = slides[nextIndex];
  if (!next) return;
  state.activeSlideId = next.id;
  state.selectedSlideId = next.id;
  state.selectedBlockId = next.blocks[0]?.id || null;
  renderAdminControls();
  syncSelection();
  renderProgress();
  scrollToSlide(next.id);
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

function ensureSelection() {
  if (!Array.isArray(state.deck.slides) || !state.deck.slides.length) {
    state.deck = createDefaultDeck();
  }

  if (!slideById(state.selectedSlideId)) {
    state.selectedSlideId = state.deck.slides[0]?.id || null;
  }
  if (!slideById(state.activeSlideId)) {
    state.activeSlideId = state.selectedSlideId;
  }

  const slide = currentSlide();
  if (!slide || !slide.blocks.length) {
    state.selectedBlockId = null;
    return;
  }
  if (!slide.blocks.some((entry) => entry.id === state.selectedBlockId)) {
    state.selectedBlockId = slide.blocks[0].id;
  }
}

function currentSlide() {
  return slideById(state.selectedSlideId);
}

function currentBlock() {
  const slide = currentSlide();
  if (!slide) return null;
  return slide.blocks.find((entry) => entry.id === state.selectedBlockId) || null;
}

function slideById(id) {
  return state.deck.slides.find((slide) => slide.id === id) || null;
}

function blockElement(slideId, blockId) {
  if (!slideId || !blockId) return null;
  return refs.deck.querySelector(
    `.slide-block[data-slide-id="${slideId}"][data-block-id="${blockId}"]`
  );
}

function markDirty() {
  state.dirty = true;
  updateSaveButton();
}

function updateSaveButton() {
  refs.saveDeckBtn.textContent = state.dirty ? "Save Deck *" : "Save Deck";
}

function setStatus(message, isError = false) {
  refs.adminStatus.textContent = message || "";
  refs.adminStatus.style.color = isError ? "#fca5a5" : "";
}

function setAuthError(message) {
  refs.authError.textContent = message || "";
}
