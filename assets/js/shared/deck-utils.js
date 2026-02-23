export const SIZE_CLASS_MAP = Object.freeze({
  caption: "slide-block--caption",
  body: "slide-block--body",
  title: "slide-block--title",
  metric: "slide-block--metric",
  hero: "slide-block--hero"
});

export const THEME_CLASS_MAP = Object.freeze({
  obsidian: "slide-canvas--obsidian",
  cobalt: "slide-canvas--cobalt",
  ember: "slide-canvas--ember",
  emerald: "slide-canvas--emerald"
});

export const BLOCK_STYLE_CLASS_MAP = Object.freeze({
  glass: "slide-block--style-glass",
  solid: "slide-block--style-solid",
  outline: "slide-block--style-outline",
  accent: "slide-block--style-accent",
  plain: "slide-block--style-plain"
});

export const BLOCK_TONE_CLASS_MAP = Object.freeze({
  default: "slide-block--tone-default",
  muted: "slide-block--tone-muted",
  accent: "slide-block--tone-accent",
  warning: "slide-block--tone-warning",
  success: "slide-block--tone-success"
});

const allowedAlign = new Set(["left", "center", "right"]);
const allowedSize = new Set(["caption", "body", "title", "metric", "hero"]);
const allowedTheme = new Set(Object.keys(THEME_CLASS_MAP));
const allowedStyle = new Set(Object.keys(BLOCK_STYLE_CLASS_MAP));
const allowedTone = new Set(Object.keys(BLOCK_TONE_CLASS_MAP));

const defaultDeckTemplate = {
  updatedAt: "2026-02-23T00:00:00.000Z",
  slides: [
    {
      id: "slide-cover",
      title: "Cover",
      theme: "obsidian",
      blocks: [
        {
          id: "cover-hero",
          text: "Narrative Capture\nEurope’s Narrative Risk Intelligence Infrastructure",
          x: 6,
          y: 18,
          w: 84,
          h: 30,
          align: "left",
          size: "hero",
          style: "plain",
          tone: "default"
        },
        {
          id: "cover-sub",
          text: "We model how narratives converge into institutional risk.",
          x: 6,
          y: 56,
          w: 72,
          h: 14,
          align: "left",
          size: "title",
          style: "plain",
          tone: "muted"
        }
      ]
    },
    {
      id: "slide-problem",
      title: "The Problem",
      theme: "ember",
      blocks: [
        {
          id: "problem-title",
          text: "Narrative attacks no longer start as “fake news.”\nThey start as fragmented stories — and converge.",
          x: 6,
          y: 14,
          w: 84,
          h: 24,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "problem-body",
          text: "By the time volume spikes:\n• Liquidity pressure may already begin\n• Regulators may already react\n• Governance escalation may already be underway\n\nInstitutions cannot currently measure narrative convergence risk.",
          x: 6,
          y: 42,
          w: 84,
          h: 46,
          align: "left",
          size: "body",
          style: "glass",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-structural-shift",
      title: "Structural Shift (Why Now)",
      theme: "cobalt",
      blocks: [
        {
          id: "shift-title",
          text: "Three irreversible shifts:",
          x: 6,
          y: 14,
          w: 70,
          h: 16,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "shift-body",
          text: "1. AI has democratized influence operations\n2. Regulatory accountability is tightening (DORA, NIS2, CSRD, AI Act)\n3. Reaction time has compressed from weeks to hours\n\nNarrative convergence has become a governance risk — not a PR issue.",
          x: 6,
          y: 34,
          w: 86,
          h: 52,
          align: "left",
          size: "body",
          style: "solid",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-gap",
      title: "The Gap",
      theme: "obsidian",
      blocks: [
        {
          id: "gap-title",
          text: "Existing tools:",
          x: 6,
          y: 14,
          w: 52,
          h: 14,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "gap-body",
          text: "• Monitor mentions\n• Detect disinformation\n• Analyze internal data\n\nNone model:\n• Actor alignment\n• Narrative convergence velocity\n• Institutional proximity\n• Escalation thresholds\n\nThere is no EU-native governance-grade narrative risk layer.",
          x: 6,
          y: 30,
          w: 86,
          h: 56,
          align: "left",
          size: "body",
          style: "glass",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-solution",
      title: "The Solution",
      theme: "emerald",
      blocks: [
        {
          id: "solution-title",
          text: "Narrative Capture",
          x: 6,
          y: 14,
          w: 60,
          h: 16,
          align: "left",
          size: "hero",
          style: "plain",
          tone: "default"
        },
        {
          id: "solution-body",
          text: "A sovereign SaaS platform that:\n• Clusters discourse into evolving narratives\n• Detects accelerating convergence\n• Maps actor ecosystems\n• Quantifies institutional exposure\n\nWe transform narrative volatility into measurable risk.",
          x: 6,
          y: 34,
          w: 86,
          h: 54,
          align: "left",
          size: "body",
          style: "accent",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-innovation",
      title: "The Innovation: Narrative Risk Index (NRI)",
      theme: "cobalt",
      blocks: [
        {
          id: "innovation-title",
          text: "A governance-grade composite risk signal.",
          x: 6,
          y: 14,
          w: 80,
          h: 16,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "innovation-body",
          text: "NRI integrates:\n• Convergence Velocity\n• Institutional Proximity\n• Sentiment Acceleration\n• Network Expansion\n\nOutput:\nEscalation triggers, audit-ready reporting, board dashboards.\n\nNot visibility.\nRisk quantification.",
          x: 6,
          y: 32,
          w: 86,
          h: 56,
          align: "left",
          size: "body",
          style: "solid",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-market-opportunity",
      title: "Market Opportunity",
      theme: "ember",
      blocks: [
        {
          id: "market-title",
          text: "Primary Anchor: European GRC & RegTech",
          x: 6,
          y: 14,
          w: 84,
          h: 16,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "market-body",
          text: "• €5–15B market\n• 11–14% CAGR\n• Enforcement cycle accelerating\n\nServiceable Market (regulated EU institutions):\n€132M–€630M\n\nInitial DACH SOM:\n€18M–€45M\n\nWe start with financial institutions under DORA.",
          x: 6,
          y: 32,
          w: 86,
          h: 56,
          align: "left",
          size: "body",
          style: "glass",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-business-model",
      title: "Business Model",
      theme: "emerald",
      blocks: [
        {
          id: "business-title",
          text: "Enterprise SaaS",
          x: 6,
          y: 14,
          w: 60,
          h: 16,
          align: "left",
          size: "hero",
          style: "plain",
          tone: "default"
        },
        {
          id: "business-body",
          text: "ACV: €60K–€180K\nAnnual contracts\nRisk & compliance budget (not marketing)\n\nTiered expansion:\nSector → Institution → Adaptive modeling\n\nLand-and-expand built into architecture.",
          x: 6,
          y: 32,
          w: 86,
          h: 54,
          align: "left",
          size: "body",
          style: "accent",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-competitive-positioning",
      title: "Competitive Positioning",
      theme: "obsidian",
      blocks: [
        {
          id: "competition-title",
          text: "Three adjacent categories:",
          x: 6,
          y: 14,
          w: 72,
          h: 16,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "competition-body",
          text: "1. Monitoring tools → visibility only\n2. US narrative risk platforms → not EU-embedded\n3. EU OSINT firms → service-heavy, not SaaS-native\n\nWe build the first EU-native narrative risk infrastructure integrated into GRC workflows.\n\nMoats:\n• Regulatory embedding\n• Sovereignty alignment\n• Ecosystem learning\n• Switching costs via risk register integration",
          x: 6,
          y: 31,
          w: 86,
          h: 58,
          align: "left",
          size: "body",
          style: "glass",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-traction-validation",
      title: "Traction & Validation",
      theme: "cobalt",
      blocks: [
        {
          id: "traction-body",
          text: "• Operational consulting arm already serving institutions\n• Institutional contracts incl. EU-level engagement\n• Direct access to regulated buyers\n• MVP live in DACH ecosystem\n\nGoal by Month 6:\n2–3 SaaS customers\n€120K–450K ARR\n\nProof > scale.",
          x: 6,
          y: 16,
          w: 86,
          h: 70,
          align: "left",
          size: "body",
          style: "solid",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-roadmap",
      title: "Roadmap",
      theme: "emerald",
      blocks: [
        {
          id: "roadmap-body",
          text: "0–6 months:\n• Compliance-ready MVP\n• NRI v1\n• First recurring revenue\n\n7–18 months:\n• NRI v2\n• 8–15 customers\n• €480K–2.2M ARR\n\n18–24 months:\n• €1–3M ARR\n• Series A positioning\n\nDisciplined, milestone-driven build.",
          x: 6,
          y: 16,
          w: 86,
          h: 70,
          align: "left",
          size: "body",
          style: "accent",
          tone: "default"
        }
      ]
    },
    {
      id: "slide-team-ask",
      title: "The Team & The Ask",
      theme: "obsidian",
      blocks: [
        {
          id: "team-title",
          text: "Founder-market fit:",
          x: 6,
          y: 14,
          w: 64,
          h: 16,
          align: "left",
          size: "title",
          style: "plain",
          tone: "default"
        },
        {
          id: "team-body",
          text: "• Government FIMI insider\n• AI & software architecture\n• EU regulatory law\n• Enterprise GTM\n\nPlus regulatory & defense advisory network.\n\nWe are raising to:\n• Finalize production infrastructure\n• Expand engineering\n• Accelerate DACH penetration\n• Embed NRI in enterprise risk workflows\n\nNarrative Capture becomes the narrative risk layer inside European governance infrastructure.",
          x: 6,
          y: 32,
          w: 86,
          h: 58,
          align: "left",
          size: "body",
          style: "glass",
          tone: "default"
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
    theme: allowedTheme.has(slide.theme) ? slide.theme : "obsidian",
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
            size: "body",
            style: "glass",
            tone: "default"
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
    size: allowedSize.has(block.size) ? block.size : "body",
    style: allowedStyle.has(block.style) ? block.style : "glass",
    tone: allowedTone.has(block.tone) ? block.tone : "default"
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
