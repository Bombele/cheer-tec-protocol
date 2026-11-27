/* Module alimente : 2-pos-edge/index.html (endpoints API de synchronisation & authentification Cheer Tec / LexWallet) */

const ADMIN_EMAIL = "cbltec@proton.me";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}

function hashSecret(plain) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const s = String(plain || "");
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2, 31) + c + i) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

async function ensureSchema(env) {
  if (!env || !env.DB) return false;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS tenants (tenant_id TEXT PRIMARY KEY, payload_json TEXT NOT NULL, updated_at TEXT NOT NULL)"
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, pass_hash TEXT NOT NULL, role TEXT NOT NULL, tenant_id TEXT NOT NULL, label TEXT NOT NULL)"
  ).run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (email, pass_hash, role, tenant_id, label) VALUES (?1, ?2, ?3, ?4, ?5)"
  ).bind(ADMIN_EMAIL, hashSecret("Holding@2026!"), "holding", "CHEER-FLAGSHIP-01", "Administrateur Holding").run();
  return true;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return jsonResponse({ ok: true }, 204);
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (pathname === "/health") {
      return jsonResponse({ ok: true, service: "cheer-tec-pos-worker", admin: ADMIN_EMAIL });
    }

    const dbReady = await ensureSchema(env);
    if (!dbReady) {
      return jsonResponse({ ok: false, error: "D1 binding DB non disponible" }, 503);
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!email || !password) {
        return jsonResponse({ ok: false, error: "Identifiants requis" }, 400);
      }
      const row = await env.DB.prepare(
        "SELECT email, pass_hash, role, tenant_id, label FROM users WHERE email = ?1"
      ).bind(email).first();
      if (!row || row.pass_hash !== hashSecret(password)) {
        return jsonResponse({ ok: false, error: "Identifiants invalides" }, 401);
      }
      return jsonResponse({
        ok: true,
        user: { email: row.email, role: row.role, tenantId: row.tenant_id, label: row.label }
      });
    }

    if (request.method === "POST" && pathname === "/api/tenants/register") {
      const body = await request.json().catch(() => ({}));
      const tenantId = String(body.tenantId || "").trim().toUpperCase();
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!tenantId || !name || !email || !password) {
        return jsonResponse({ ok: false, error: "Champs obligatoires manquants" }, 400);
      }
      const existing = await env.DB.prepare("SELECT email FROM users WHERE email = ?1").bind(email).first();
      if (existing) {
        return jsonResponse({ ok: false, error: "Email deja utilise" }, 409);
      }
      const nowIso = new Date().toISOString();
      const tenantObj = {
        id: tenantId,
        name,
        accountType: body.accountType || "franchise",
        kyc: {
          legalId: String(body.legalId || "EN-REGISTRE-000"),
          representative: String(body.representative || name),
          kycStatus: "Vérifié",
          updatedAt: nowIso.split("T")[0]
        },
        fiscal: {
          country: String(body.country || "BE"),
          vatPlacePct: 21,
          vatTakeoutPct: 6,
          employerRatePct: 28,
          employeeRatePct: 13.07,
          currency: "€"
        },
        costConfig: { rentPct: 7, royaltiesPct: 4, staffPct: 22, maintPct: 3, otherPct: 4, taxReservePct: 12, capReservePct: 5 },
        transactions: [],
        invoices: [],
        hrShifts: [],
        ingredients: [],
        suppliers: [],
        validatedPOs: [],
        auditEntries: []
      };
      await env.DB.prepare(
        "INSERT INTO tenants (tenant_id, payload_json, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(tenant_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at"
      ).bind(tenantId, JSON.stringify(tenantObj), nowIso).run();
      await env.DB.prepare(
        "INSERT INTO users (email, pass_hash, role, tenant_id, label) VALUES (?1, ?2, ?3, ?4, ?5)"
      ).bind(email, hashSecret(password), "tenant", tenantId, name).run();
      return jsonResponse({ ok: true, tenant: tenantObj });
    }

    const syncMatch = pathname.match(/^\/api\/sync\/([^/]+)$/);
    if (request.method === "POST" && syncMatch) {
      const tenantId = decodeURIComponent(syncMatch[1]).trim();
      const body = await request.json().catch(() => ({}));
      const tenantPayload = body && body.tenant && body.tenant.id ? body.tenant : null;
      if (!tenantPayload) {
        return jsonResponse({ ok: false, error: "Payload tenant invalide" }, 400);
      }
      const nowIso = new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO tenants (tenant_id, payload_json, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(tenant_id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at"
      ).bind(tenantId, JSON.stringify(tenantPayload), nowIso).run();
      return jsonResponse({ ok: true, tenantId, updatedAt: nowIso });
    }

    const stateMatch = pathname.match(/^\/api\/state\/([^/]+)$/);
    if (request.method === "GET" && stateMatch) {
      const tenantId = decodeURIComponent(stateMatch[1]).trim();
      const row = await env.DB.prepare(
        "SELECT tenant_id, payload_json, updated_at FROM tenants WHERE tenant_id = ?1"
      ).bind(tenantId).first();
      if (!row) {
        return jsonResponse({ ok: false, error: "Tenant introuvable" }, 404);
      }
      return jsonResponse({
        ok: true,
        tenantId: row.tenant_id,
        updatedAt: row.updated_at,
        tenant: JSON.parse(row.payload_json)
      });
    }

    return jsonResponse({ ok: false, error: "Route non trouvee" }, 404);
  }
};
