async function request(path, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: options.headers || {},
    credentials: "same-origin"
  };

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
    config.headers = {
      ...config.headers,
      "Content-Type": "application/json"
    };
  }

  const response = await fetch(path, config);
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchDeck() {
  const payload = await request("/api/deck");
  return payload.deck;
}

export async function saveDeck(deck) {
  const payload = await request("/api/deck", {
    method: "PUT",
    body: { deck }
  });
  return payload.deck;
}

export async function getAuthStatus() {
  return request("/api/auth/status");
}

export async function login(username, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: { username, password }
  });
}

export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

