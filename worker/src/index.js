/* Module alimente : deploiement edge lexwallet.app, endpoints d'etat POS et liaison avec 2-pos-edge/index.html */
const DEFAULT_MAX_BYTES = 131072;
const DEFAULT_TIMEOUT_MS = 4000;

function toPositiveInt(val, fallback) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function jsonResponse(bodyObj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(bodyObj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

async function readBoundedJson(request, maxBytes) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, error: "PAYLOAD_TOO_LARGE", maxBytes };
  }
  const raw = await request.text();
  const byteSize = new TextEncoder().encode(raw).length;
  if (byteSize > maxBytes) {
    return { ok: false, error: "PAYLOAD_TOO_LARGE", maxBytes };
  }
  if (!raw.trim()) {
    return { ok: true, data: {} };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (_) {
    return { ok: false, error: "INVALID_JSON" };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const maxBytes = toPositiveInt(env && env.MAX_PAYLOAD_BYTES, DEFAULT_MAX_BYTES);
    const timeoutMs = toPositiveInt(env && env.REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
    const primaryDomain = (env && env.PRIMARY_DOMAIN) || "lexwallet.app";
    const tenantId = (env && env.TENANT_ID) || "CHEER-FLAGSHIP-01";
    const adminEmail = (env && env.ADMIN_EMAIL) || "cbltec@proton.me";
    const appEnv = (env && env.APP_ENV) || "production";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
        },
      });
    }

    if (url.pathname === "/health") {
      return jsonResponse({
        status: "ok",
        service: "cheer-tec-pos-worker",
        env: appEnv,
        primaryDomain,
        tenantId,
        adminEmail,
        timeoutMs,
        maxBytes,
        ts: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/pos/meta") {
      return jsonResponse({
        primaryDomain,
        tenantId,
        adminEmail,
        posRoute: "#/POS/caisse",
        engineVersion: "V14.0",
        maxBytes,
        timeoutMs,
      });
    }

    if (url.pathname === "/api/pos/sync") {
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
      }
      const parsed = await readBoundedJson(request, maxBytes);
      if (!parsed.ok) {
        const code = parsed.error === "PAYLOAD_TOO_LARGE" ? 413 : 400;
        return jsonResponse({ ok: false, error: parsed.error, maxBytes }, code);
      }
      const payload = parsed.data && typeof parsed.data === "object" ? parsed.data : {};
      return jsonResponse({
        ok: true,
        accepted: true,
        primaryDomain,
        tenantId,
        adminEmail,
        receivedKeys: Object.keys(payload),
        ts: new Date().toISOString(),
      });
    }

    return jsonResponse(
      {
        ok: false,
        error: "NOT_FOUND",
        path: url.pathname,
        primaryDomain,
        tenantId,
        adminEmail,
        availableRoutes: ["/health", "/api/pos/meta", "/api/pos/sync"],
      },
      404
    );
  },
};
