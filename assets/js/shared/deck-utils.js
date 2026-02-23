export const SIZE_CLASS_MAP = Object.freeze({
  caption: "slide-block--caption",
  body: "slide-block--body",
  title: "slide-block--title",
  metric: "slide-block--metric",
  hero: "slide-block--hero"
});

const allowedAlign = new Set(["left", "center", "right"]);
const allowedSize = new Set(["caption", "body", "title", "metric", "hero"]);

const defaultDeckTemplate = {
  updatedAt: "2026-02-23T00:00:00.000Z",
  slides: [
    {
      id: "slide-cover",
      title: "Cover",
      blocks: [
        {
          id: "cover-hero",
          text: "Northern Current\nPitch Deck 2026",
          x: 6,
          y: 14,
          w: 62,
          h: 36,
          align: "left",
          size: "hero"
        },
        {
          id: "cover-sub",
          text: "A web-first pitchdeck template.\nScroll to move between slides.",
          x: 6,
          y: 56,
          w: 54,
          h: 20,
          align: "left",
          size: "body"
        }
      ]
    },
    {
      id: "slide-opportunity",
      title: "Problem & Opportunity",
      blocks: [
        {
          id: "op-title",
          text: "The market is fragmented.\nDecision cycles are slow.",
          x: 7,
          y: 16,
          w: 50,
          h: 26,
          align: "left",
          size: "title"
        },
        {
          id: "op-body",
          text: "Teams spend days assembling insights from disconnected tools.",
          x: 7,
          y: 48,
          w: 42,
          h: 28,
          align: "left",
          size: "body"
        },
        {
          id: "op-metric",
          text: "Opportunity\n$2.6B TAM",
          x: 62,
          y: 24,
          w: 28,
          h: 32,
          align: "center",
          size: "metric"
        }
      ]
    },
    {
      id: "slide-traction",
      title: "Traction",
      blocks: [
        {
          id: "tr-title",
          text: "Early traction validates demand.",
          x: 8,
          y: 14,
          w: 54,
          h: 18,
          align: "left",
          size: "title"
        },
        {
          id: "tr-1",
          text: "43%\nMoM growth",
          x: 8,
          y: 42,
          w: 24,
          h: 28,
          align: "left",
          size: "metric"
        },
        {
          id: "tr-2",
          text: "19 pilots\nacross 5 sectors",
          x: 38,
          y: 42,
          w: 24,
          h: 28,
          align: "left",
          size: "metric"
        },
        {
          id: "tr-3",
          text: "91 NPS\nfrom design partners",
          x: 68,
          y: 42,
          w: 24,
          h: 28,
          align: "left",
          size: "metric"
        }
      ]
    }
  ]
};

export function createDefaultDeck() {
  return JSON.parse(JSON.stringify(defaultDeckTemplate));
}

export function normalizeDeck(input) {
  if (!input || !Array.isArray(input.slides) || input.slides.length === 0) {
    return createDefaultDeck();
  }

  const slides = input.slides
    .map((slide, index) => normalizeSlide(slide, index))
    .filter(Boolean);

  if (!slides.length) return createDefaultDeck();

  return {
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    slides
  };
}

export function normalizeSlide(slide, index = 0) {
  if (!slide || typeof slide !== "object") return null;

  const blocks = Array.isArray(slide.blocks)
    ? slide.blocks.map((block, blockIndex) => normalizeBlock(block, blockIndex)).filter(Boolean)
    : [];

  return {
    id: normalizeId(slide.id, `slide-${index + 1}`),
    title:
      typeof slide.title === "string" && slide.title.trim()
        ? slide.title.trim()
        : `Slide ${index + 1}`,
    blocks: blocks.length
      ? blocks
      : [
          {
            id: uid("block"),
            text: "Editable entry",
            x: 8,
            y: 10,
            w: 44,
            h: 22,
            align: "left",
            size: "body"
          }
        ]
  };
}

export function normalizeBlock(block, index = 0) {
  if (!block || typeof block !== "object") return null;

  const w = clamp(num(block.w, 40), 4, 100);
  const h = clamp(num(block.h, 20), 4, 100);
  return {
    id: normalizeId(block.id, `block-${index + 1}`),
    text:
      typeof block.text === "string" && block.text.trim()
        ? block.text
        : `Entry ${index + 1}`,
    x: clamp(num(block.x, 0), 0, 100 - w),
    y: clamp(num(block.y, 0), 0, 100 - h),
    w,
    h,
    align: allowedAlign.has(block.align) ? block.align : "left",
    size: allowedSize.has(block.size) ? block.size : "body"
  };
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function previewText(text, index = 0) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return `Entry ${index + 1}`;
  return compact.length > 38 ? `${compact.slice(0, 35)}...` : compact;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeId(value, fallback) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
  return normalized || fallback;
}

