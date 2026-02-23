const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DECK_FILE = path.join(DATA_DIR, "deck.json");

loadEnvFile(path.join(ROOT_DIR, ".env"));

const PORT = toInteger(process.env.PORT, 3000);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_COOKIE = "pitchdeck_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "SAMEORIGIN"
};

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn("Warning: ADMIN_USERNAME or ADMIN_PASSWORD is missing. Configure credentials in .env.");
}

if (!process.env.SESSION_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("Warning: SESSION_SECRET is missing. Using a random secret for this process only.");
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", error);
    sendJson(res, 500, { error: "Internal server error." });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Pitchdeck server running on http://localhost:${PORT}`);
});

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith("/api/")) {
    await handleApi(req, res, pathname);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (pathname === "/" || pathname === "/viewer") {
    await serveFile(req, res, path.join(PUBLIC_DIR, "viewer.html"));
    return;
  }

  if (pathname === "/admin") {
    await serveFile(req, res, path.join(PUBLIC_DIR, "admin.html"));
    return;
  }

  await serveStatic(req, res, pathname);
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/deck") {
    if (req.method === "GET") {
      const deck = await loadDeck();
      sendJson(res, 200, { deck });
      return;
    }

    if (req.method === "PUT") {
      if (!isAuthenticated(req)) {
        sendJson(res, 401, { error: "Unauthorized." });
        return;
      }

      let body;
      try {
        body = await readJson(req);
      } catch (error) {
        sendJson(res, 400, { error: error.message || "Invalid JSON payload." });
        return;
      }
      const rawDeck = body && typeof body === "object" && body.deck ? body.deck : body;
      const deck = normalizeDeck(rawDeck);
      deck.updatedAt = new Date().toISOString();
      await saveDeck(deck);
      sendJson(res, 200, { deck, message: "Deck saved." });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (pathname === "/api/auth/status" && req.method === "GET") {
    sendJson(res, 200, {
      authenticated: isAuthenticated(req),
      username: ADMIN_USERNAME || null,
      configured: Boolean(ADMIN_USERNAME && ADMIN_PASSWORD)
    });
    return;
  }

  if (pathname === "/api/auth/login") {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Invalid JSON payload." });
      return;
    }
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!validateCredentials(username, password)) {
      sendJson(res, 401, { error: "Invalid credentials." });
      return;
    }

    const token = createSessionToken(username);
    setCookie(res, SESSION_COOKIE, token, SESSION_TTL_SECONDS);
    sendJson(res, 200, { authenticated: true, username: ADMIN_USERNAME });
    return;
  }

  if (pathname === "/api/auth/logout") {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed." });
      return;
    }

    clearCookie(res, SESSION_COOKIE);
    sendJson(res, 200, { authenticated: false });
    return;
  }

  sendJson(res, 404, { error: "Not found." });
}

async function serveStatic(req, res, pathname) {
  const relativePath = pathname.replace(/^\/+/, "");
  const absolutePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden." });
    return;
  }

  await serveFile(req, res, absolutePath);
}

async function serveFile(req, res, filePath) {
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) {
      sendJson(res, 404, { error: "Not found." });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      ...SECURITY_HEADERS,
      "Content-Type": contentTypeFor(ext),
      "Content-Length": String(stat.size),
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    };

    res.writeHead(200, headers);
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      if (!res.headersSent) {
        sendJson(res, 500, { error: "Failed to read file." });
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendJson(res, 404, { error: "Not found." });
      return;
    }
    throw error;
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": String(Buffer.byteLength(body))
  };
  if (!res.headersSent) {
    res.writeHead(statusCode, headers);
  }
  res.end(body);
}

function readJson(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("Payload too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const text = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });

    req.on("error", reject);
  });
}

async function loadDeck() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fsp.readFile(DECK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeDeck(parsed);
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      // eslint-disable-next-line no-console
      console.warn("Failed to parse deck file. Falling back to defaults.");
    }
    const fallback = createDefaultDeck();
    await saveDeck(fallback);
    return fallback;
  }
}

async function saveDeck(deck) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  const serialized = JSON.stringify(normalizeDeck(deck), null, 2) + "\n";
  await fsp.writeFile(DECK_FILE, serialized, "utf8");
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

function validateCredentials(username, password) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return false;
  return safeCompare(username, ADMIN_USERNAME) && safeCompare(password, ADMIN_PASSWORD);
}

function createSessionToken(username) {
  const payload = {
    user: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encoded);
  return `${encoded}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== "string") return false;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expectedSignature = signValue(encoded);
  if (!safeCompare(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object") return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    if (typeof payload.user !== "string") return false;
    return safeCompare(payload.user, ADMIN_USERNAME);
  } catch {
    return false;
  }
}

function signValue(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function parseCookies(cookieHeader) {
  const result = {};
  if (!cookieHeader) return result;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = decodeURIComponent(value);
  }
  return result;
}

function setCookie(res, name, value, maxAgeSeconds) {
  const serialized = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];

  if (process.env.NODE_ENV === "production") {
    serialized.push("Secure");
  }

  res.setHeader("Set-Cookie", serialized.join("; "));
}

function clearCookie(res, name) {
  const serialized = [`${name}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") {
    serialized.push("Secure");
  }
  res.setHeader("Set-Cookie", serialized.join("; "));
}

function safeCompare(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function contentTypeFor(extension) {
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function normalizeDeck(input) {
  if (!input || !Array.isArray(input.slides) || input.slides.length === 0) {
    return createDefaultDeck();
  }

  const slides = input.slides
    .map((slide, index) => normalizeSlide(slide, index))
    .filter(Boolean);

  if (!slides.length) {
    return createDefaultDeck();
  }

  return {
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    slides
  };
}

function normalizeSlide(slide, index) {
  if (!slide || typeof slide !== "object") return null;

  const title =
    typeof slide.title === "string" && slide.title.trim()
      ? slide.title.trim()
      : `Slide ${index + 1}`;

  const blocks = Array.isArray(slide.blocks)
    ? slide.blocks
        .map((block, blockIndex) => normalizeBlock(block, blockIndex))
        .filter(Boolean)
    : [];

  return {
    id: normalizeId(slide.id, `slide-${index + 1}`),
    title,
    blocks: blocks.length ? blocks : [createDefaultBlock()]
  };
}

function normalizeBlock(block, index) {
  if (!block || typeof block !== "object") return null;

  const width = clamp(toNumber(block.w, 40), 4, 100);
  const height = clamp(toNumber(block.h, 20), 4, 100);
  const x = clamp(toNumber(block.x, 0), 0, 100 - width);
  const y = clamp(toNumber(block.y, 0), 0, 100 - height);
  const align = normalizeEnum(block.align, ["left", "center", "right"], "left");
  const size = normalizeEnum(block.size, ["caption", "body", "title", "metric", "hero"], "body");
  const text =
    typeof block.text === "string" && block.text.trim() ? block.text : `Entry ${index + 1}`;

  return {
    id: normalizeId(block.id, `block-${index + 1}`),
    text,
    x,
    y,
    w: width,
    h: height,
    align,
    size
  };
}

function createDefaultDeck() {
  return {
    updatedAt: new Date().toISOString(),
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
}

function createDefaultBlock() {
  return {
    id: "block-default",
    text: "Editable entry",
    x: 8,
    y: 10,
    w: 44,
    h: 22,
    align: "left",
    size: "body"
  };
}

function normalizeId(value, fallback) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-");
  return normalized || fallback;
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/g);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
