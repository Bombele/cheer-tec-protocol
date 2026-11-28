#!/usr/bin/env bash
set -euo pipefail

# Point de rupture evite :
# 1) Absence du fichier ou droits d'execution manquants -> creation directe + chmod +x
# 2) Fichier index.html corrompu ou tronque en cas d'interruption -> ecriture atomique via .tmp + mv
# 3) Blocage E/S ou boucle infinie -> timeout strict de 10s par operation
# Module alimente : alimente index.html (hub menu) qui charge ./modules/caisse.js (Point Zero) et les modules aval

TARGET_FILE="${1:-index.html}"
BACKUP_FILE="${TARGET_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
TMP_FILE="${TARGET_FILE}.tmp.$$"

cleanup_tmp() {
  rm -f "${TMP_FILE}" 2>/dev/null || true
}
trap cleanup_tmp EXIT INT TERM

if [ -f "${TARGET_FILE}" ]; then
  timeout 10s cp -f "${TARGET_FILE}" "${BACKUP_FILE}"
  echo "Sauvegarde creee : ${BACKUP_FILE}"
fi

timeout 10s cat <<'EOF_INDEX_HTML' > "${TMP_FILE}"
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LexWallet / Cheer Tec — Hub &amp; Menu Modules</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
  <header class="sticky top-0 z-30 bg-blue-950/95 border-b border-blue-800/70 backdrop-blur">
    <div class="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-bold text-sm">LW</span>
        <div>
          <div class="text-white font-semibold tracking-tight text-sm sm:text-base">LEXWALLET / CHEER TEC</div>
          <div class="text-blue-200 text-xs" id="shell-status-text">Point d'entrée modules • Holding &amp; POS</div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <label for="tenant-select" class="sr-only">Établissement actif</label>
        <select id="tenant-select" class="bg-slate-900 border border-blue-700/70 text-slate-100 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-amber-400">
          <option value="CHEER-FLAGSHIP-01">CHEER-FLAGSHIP-01 (BE)</option>
          <option value="CHEER-FR-LYON-02">CHEER-FR-LYON-02 (FR)</option>
          <option value="CHEER-ES-BCN-03">CHEER-ES-BCN-03 (ES)</option>
          <option value="CHEER-VE-CCS-04">CHEER-VE-CCS-04 (VE)</option>
        </select>

        <span id="session-badge" class="px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-700 text-slate-300">Non connecté</span>
        <button id="btn-auth-toggle" type="button" class="px-3 py-1.5 rounded-md bg-amber-400 text-slate-950 font-semibold hover:bg-amber-300 transition">Connexion Holding</button>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
    <section class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-lg sm:text-xl font-semibold text-white">Menu de navigation des modules</h1>
        <p class="text-slate-400 text-xs sm:text-sm mt-1">
          Sélectionnez un module. La <strong class="text-amber-300">Caisse (Point Zéro)</strong> produit les événements de vente consommés par les modules en aval.
        </p>
      </div>
      <div class="text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
        <div>Route active : <span id="active-route-label" class="text-amber-300 font-mono">#/</span></div>
        <div>Module monté : <span id="active-module-label" class="text-emerald-400 font-mono">menu</span></div>
      </div>
    </section>

    <section aria-label="Modules applicatifs">
      <div id="module-menu-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </section>

    <section id="module-stage-section" class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 min-h-[260px]">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h2 id="stage-title" class="text-base font-semibold text-white">Accueil / Menu général</h2>
          <p id="stage-subtitle" class="text-xs text-slate-400">Aucun module métier chargé en mémoire.</p>
        </div>
        <button id="btn-back-menu" type="button" class="hidden px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition">
          Retour menu
        </button>
      </div>
      <div id="module-mount-root" class="text-sm text-slate-300"></div>
    </section>
  </main>

  <div id="auth-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/80 p-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Authentification Holding / Opérateur</h2>
        <button id="btn-close-auth" type="button" class="text-slate-400 hover:text-white text-sm">Fermer</button>
      </div>
      <form id="auth-form" class="space-y-3">
        <div>
          <label for="auth-email" class="block text-xs text-slate-400 mb-1">Identifiant / E-mail</label>
          <input id="auth-email" type="email" required value="cbltec@proton.me" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400" />
        </div>
        <div>
          <label for="auth-role" class="block text-xs text-slate-400 mb-1">Profil d'accès</label>
          <select id="auth-role" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400">
            <option value="holding">Administrateur Holding</option>
            <option value="manager">Gérant Établissement</option>
            <option value="cashier">Opérateur Caisse</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" id="btn-cancel-auth" class="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs">Annuler</button>
          <button type="submit" class="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-semibold text-xs hover:bg-amber-300">Valider la session</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    (() => {
      "use strict";

      const STORAGE_KEYS = Object.freeze({
        SESSION: "lexwallet_session_v4",
        TENANT: "lexwallet_active_tenant_v4",
        BUS_LOG: "lexwallet_zero_bus_log_v4"
      });

      const HOLDING_ADMIN_EMAIL = "cbltec@proton.me";
      const MAX_BUS_LOG_ENTRIES = 200;
      const MODULE_LOAD_TIMEOUT_MS = 6000;

      const TENANTS = Object.freeze({
        "CHEER-FLAGSHIP-01": { id: "CHEER-FLAGSHIP-01", name: "Cheer Flagship Bruxelles", country: "BE", currency: "EUR" },
        "CHEER-FR-LYON-02": { id: "CHEER-FR-LYON-02", name: "Cheer Lyon Confluence", country: "FR", currency: "EUR" },
        "CHEER-ES-BCN-03": { id: "CHEER-ES-BCN-03", name: "Cheer Barcelone Gracia", country: "ES", currency: "EUR" },
        "CHEER-VE-CCS-04": { id: "CHEER-VE-CCS-04", name: "Cheer Caracas / La Guaira", country: "VE", currency: "USD" }
      });

      const MODULES = Object.freeze([
        {
          id: "caisse",
          route: "#/POS/caisse",
          label: "Caisse (Point Zéro)",
          badge: "POINT ZÉRO",
          accent: "border-amber-400/70 hover:border-amber-300",
          badgeClass: "bg-amber-400/15 text-amber-300 border-amber-400/40",
          description: "Encaissement, panier, tickets, QR et émission des événements métier vers les modules aval.",
          scriptSrc: "./modules/caisse.js"
        },
        {
          id: "holding-kyc",
          route: "#/POS/holding-kyc",
          label: "Holding & KYC",
          badge: "GOUVERNANCE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          description: "Paramètres holding, multi-établissements, conformité et droits d'accès.",
          scriptSrc: "./modules/holding-kyc.js"
        },
        {
          id: "rapport-pnl-z",
          route: "#/POS/rapport-pnl-z",
          label: "Rapport P&L & Clôture Z",
          badge: "AVAL CAISSE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Synthèse des ventes, TVA, marges et clôture journalière alimentée par la caisse.",
          scriptSrc: "./modules/rapport-pnl-z.js"
        },
        {
          id: "couts-tresorerie",
          route: "#/POS/couts-tresorerie",
          label: "Coûts & Trésorerie",
          badge: "AVAL CAISSE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Charges fixes (loyer plafonné à 7%), flux de trésorerie et suivi des encaissements.",
          scriptSrc: "./modules/couts-tresorerie.js"
        },
        {
          id: "factures-precompta",
          route: "#/POS/factures-precompta",
          label: "Factures & Pré-compta",
          badge: "COMPTABILITÉ",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Pièces justificatives, écritures pré-comptables et exports structurés.",
          scriptSrc: "./modules/factures-precompta.js"
        },
        {
          id: "rh-paie",
          route: "#/POS/rh-paie",
          label: "RH, Badges & Paie",
          badge: "ÉQUIPE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Affectation personnel, badges opérateurs et suivi des heures / commissions.",
          scriptSrc: "./modules/rh-paie.js"
        },
        {
          id: "stocks-iot-scanners",
          route: "#/POS/stocks-iot-scanners",
          label: "Stocks, IoT & Scanners",
          badge: "AVAL CAISSE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Débit automatique des matières premières sur validation ticket, alertes et scanners.",
          scriptSrc: "./modules/stocks-iot-scanners.js"
        },
        {
          id: "fournisseurs-recettes",
          route: "#/POS/fournisseurs-recettes",
          label: "Fournisseurs & Recettes",
          badge: "MERCURIALE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Nomenclatures produits, coûts matières et référentiel fournisseurs.",
          scriptSrc: "./modules/fournisseurs-recettes.js"
        },
        {
          id: "historique-qr",
          route: "#/POS/historique-qr",
          label: "Historique & Traçabilité QR",
          badge: "AUDIT",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Journal des tickets émis, vérifications QR et historique des opérations.",
          scriptSrc: "./modules/historique-qr.js"
        },
        {
          id: "parametres-fiscaux",
          route: "#/POS/parametres-fiscaux",
          label: "Paramètres Fiscaux",
          badge: "RÉGLEMENTAIRE",
          accent: "border-slate-700 hover:border-blue-400",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          description: "Taux de TVA, règles pays (BE, FR, ES, VE) et devises actives.",
          scriptSrc: "./modules/parametres-fiscaux.js"
        }
      ]);

      const dom = {
        tenantSelect: document.getElementById("tenant-select"),
        sessionBadge: document.getElementById("session-badge"),
        btnAuthToggle: document.getElementById("btn-auth-toggle"),
        authModal: document.getElementById("auth-modal"),
        authForm: document.getElementById("auth-form"),
        authEmail: document.getElementById("auth-email"),
        authRole: document.getElementById("auth-role"),
        btnCloseAuth: document.getElementById("btn-close-auth"),
        btnCancelAuth: document.getElementById("btn-cancel-auth"),
        menuGrid: document.getElementById("module-menu-grid"),
        stageTitle: document.getElementById("stage-title"),
        stageSubtitle: document.getElementById("stage-subtitle"),
        mountRoot: document.getElementById("module-mount-root"),
        btnBackMenu: document.getElementById("btn-back-menu"),
        activeRouteLabel: document.getElementById("active-route-label"),
        activeModuleLabel: document.getElementById("active-module-label")
      };

      const runtime = {
        activeModuleId: null,
        mountedInstance: null,
        loadedScripts: new Set(),
        subscribers: new Set(),
        timers: new Set(),
        listeners: []
      };

      function safeParseJson(raw, fallback) {
        if (!raw) return fallback;
        try {
          return JSON.parse(raw);
        } catch (_err) {
          return fallback;
        }
      }

      function readStorage(key, fallback) {
        try {
          return safeParseJson(window.localStorage.getItem(key), fallback);
        } catch (_err) {
          return fallback;
        }
      }

      function writeStorage(key, value) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (_err) {
          return false;
        }
      }

      function registerManagedTimer(timerId) {
        runtime.timers.add(timerId);
        return timerId;
      }

      function clearAllManagedTimers() {
        runtime.timers.forEach((id) => {
          window.clearTimeout(id);
          window.clearInterval(id);
        });
        runtime.timers.clear();
      }

      function addManagedListener(target, eventName, handler, options) {
        target.addEventListener(eventName, handler, options);
        runtime.listeners.push({ target, eventName, handler, options });
      }

      function removeAllManagedListeners() {
        while (runtime.listeners.length > 0) {
          const entry = runtime.listeners.pop();
          entry.target.removeEventListener(entry.eventName, entry.handler, entry.options);
        }
      }

      function getActiveTenant() {
        const savedId = readStorage(STORAGE_KEYS.TENANT, "CHEER-FLAGSHIP-01");
        return TENANTS[savedId] || TENANTS["CHEER-FLAGSHIP-01"];
      }

      function setActiveTenant(tenantId) {
        const nextTenant = TENANTS[tenantId] || TENANTS["CHEER-FLAGSHIP-01"];
        writeStorage(STORAGE_KEYS.TENANT, nextTenant.id);
        dom.tenantSelect.value = nextTenant.id;
        emitEvent("shell:tenant_changed", { tenant: nextTenant });
        renderMenuCards();
      }

      function getSession() {
        const session = readStorage(STORAGE_KEYS.SESSION, null);
        if (!session || typeof session !== "object" || !session.email) {
          return null;
        }
        return session;
      }

      function setSession(sessionData) {
        if (!sessionData) {
          try {
            window.localStorage.removeItem(STORAGE_KEYS.SESSION);
          } catch (_err) {}
          renderSessionUi(null);
          emitEvent("shell:session_changed", { session: null });
          return;
        }
        const normalizedEmail = String(sessionData.email || "").trim().toLowerCase();
        const isHoldingAdmin = normalizedEmail === HOLDING_ADMIN_EMAIL;
        const normalized = {
          email: normalizedEmail,
          role: isHoldingAdmin ? "holding" : (sessionData.role || "cashier"),
          isHoldingAdmin,
          authenticatedAt: new Date().toISOString()
        };
        writeStorage(STORAGE_KEYS.SESSION, normalized);
        renderSessionUi(normalized);
        emitEvent("shell:session_changed", { session: normalized });
      }

      function renderSessionUi(session) {
        if (!session) {
          dom.sessionBadge.textContent = "Session locale (invité)";
          dom.sessionBadge.className = "px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300";
          dom.btnAuthToggle.textContent = "Connexion";
          return;
        }
        const roleLabel = session.isHoldingAdmin ? "HOLDING ADMIN" : String(session.role).toUpperCase();
        dom.sessionBadge.textContent = `${session.email} • ${roleLabel}`;
        dom.sessionBadge.className = "px-2.5 py-1.5 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300";
        dom.btnAuthToggle.textContent = "Déconnexion";
      }

      function emitEvent(type, payload = {}) {
        const envelope = {
          type,
          timestamp: new Date().toISOString(),
          tenantId: getActiveTenant().id,
          session: getSession(),
          payload
        };

        const log = readStorage(STORAGE_KEYS.BUS_LOG, []);
        log.push(envelope);
        if (log.length > MAX_BUS_LOG_ENTRIES) {
          log.splice(0, log.length - MAX_BUS_LOG_ENTRIES);
        }
        writeStorage(STORAGE_KEYS.BUS_LOG, log);

        runtime.subscribers.forEach((fn) => {
          try {
            fn(envelope);
          } catch (_err) {}
        });

        try {
          window.dispatchEvent(new CustomEvent("lexwallet:bus", { detail: envelope }));
        } catch (_err) {}

        return envelope;
      }

      function subscribeBus(handler) {
        if (typeof handler !== "function") return () => {};
        runtime.subscribers.add(handler);
        return () => runtime.subscribers.delete(handler);
      }

      function loadModuleScript(scriptSrc) {
        return new Promise((resolve, reject) => {
          if (runtime.loadedScripts.has(scriptSrc)) {
            resolve();
            return;
          }

          const existing = document.querySelector(`script[data-lex-module="${scriptSrc}"]`);
          if (existing) {
            runtime.loadedScripts.add(scriptSrc);
            resolve();
            return;
          }

          const script = document.createElement("script");
          script.src = scriptSrc;
          script.async = true;
          script.dataset.lexModule = scriptSrc;

          let settled = false;
          const timeoutId = window.setTimeout(() => {
            if (settled) return;
            settled = true;
            script.remove();
            reject(new Error(`Timeout chargement module (${scriptSrc})`));
          }, MODULE_LOAD_TIMEOUT_MS);

          script.onload = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            runtime.loadedScripts.add(scriptSrc);
            resolve();
          };

          script.onerror = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            script.remove();
            reject(new Error(`Fichier module introuvable ou invalide (${scriptSrc})`));
          };

          document.body.appendChild(script);
        });
      }

      async function unmountCurrentModule() {
        if (runtime.mountedInstance && typeof runtime.mountedInstance.unmount === "function") {
          try {
            await runtime.mountedInstance.unmount();
          } catch (_err) {}
        }
        runtime.mountedInstance = null;
        runtime.activeModuleId = null;
        dom.mountRoot.innerHTML = "";
      }

      function renderMenuCards() {
        dom.menuGrid.innerHTML = "";
        MODULES.forEach((mod) => {
          const isCurrent = runtime.activeModuleId === mod.id;
          const card = document.createElement("button");
          card.type = "button";
          card.className = `text-left bg-slate-900/90 border ${isCurrent ? "border-amber-400 ring-1 ring-amber-400/40" : mod.accent} rounded-xl p-4 transition flex flex-col justify-between gap-3`;
          card.innerHTML = `
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded border ${mod.badgeClass}">${mod.badge}</span>
                <span class="text-[11px] font-mono text-slate-500">${mod.route}</span>
              </div>
              <div class="text-base font-semibold text-white">${mod.label}</div>
              <p class="text-xs text-slate-400 leading-relaxed">${mod.description}</p>
            </div>
            <div class="text-xs font-medium text-amber-300">Ouvrir le module →</div>
          `;
          card.addEventListener("click", () => {
            window.location.hash = mod.route;
          });
          dom.menuGrid.appendChild(card);
        });
      }

      function renderMenuHome() {
        dom.stageTitle.textContent = "Accueil / Menu général";
        dom.stageSubtitle.textContent = "Sélectionnez un module ci-dessus pour lancer son espace dédié.";
        dom.btnBackMenu.classList.add("hidden");
        dom.activeModuleLabel.textContent = "menu";

        const tenant = getActiveTenant();
        const recentEvents = readStorage(STORAGE_KEYS.BUS_LOG, []).slice(-5).reverse();

        dom.mountRoot.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-1.5">
              <div class="text-xs uppercase tracking-wider text-slate-400">Contexte actif</div>
              <div class="text-sm text-white font-medium">${tenant.name} (${tenant.id})</div>
              <div class="text-xs text-slate-400">Pays : ${tenant.country} • Devise : ${tenant.currency}</div>
            </div>
            <div class="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-1.5">
              <div class="text-xs uppercase tracking-wider text-slate-400">Derniers événements bus (Point Zéro → Aval)</div>
              ${
                recentEvents.length === 0
                  ? '<div class="text-xs text-slate-500">Aucun événement enregistré pour le moment.</div>'
                  : `<ul class="space-y-1 text-xs font-mono text-slate-300">${recentEvents
                      .map((ev) => `<li>• ${ev.type} <span class="text-slate-500">(${ev.timestamp.slice(11, 19)})</span></li>`)
                      .join("")}</ul>`
              }
            </div>
          </div>
        `;
      }

      function resolveModuleFromHash(hashStr) {
        const clean = (hashStr || "#/").trim();
        if (clean === "" || clean === "#" || clean === "#/") {
          return null;
        }
        return MODULES.find((m) => m.route.toLowerCase() === clean.toLowerCase()) || null;
      }

      async function handleRouteChange() {
        const currentHash = window.location.hash || "#/";
        dom.activeRouteLabel.textContent = currentHash;

        await unmountCurrentModule();

        const targetModule = resolveModuleFromHash(currentHash);
        renderMenuCards();

        if (!targetModule) {
          renderMenuHome();
          return;
        }

        runtime.activeModuleId = targetModule.id;
        dom.activeModuleLabel.textContent = targetModule.id;
        dom.stageTitle.textContent = targetModule.label;
        dom.stageSubtitle.textContent = targetModule.description;
        dom.btnBackMenu.classList.remove("hidden");
        renderMenuCards();

        dom.mountRoot.innerHTML = `<div class="text-xs text-slate-400">Chargement du module <span class="font-mono text-amber-300">${targetModule.id}</span>...</div>`;

        try {
          await loadModuleScript(targetModule.scriptSrc);
          const registry = window.LexWalletModules || {};
          const factory = registry[targetModule.id];

          if (!factory || typeof factory.mount !== "function") {
            dom.mountRoot.innerHTML = `
              <div class="bg-slate-950 border border-amber-500/40 rounded-lg p-4 space-y-2">
                <div class="text-sm font-semibold text-amber-300">Module "${targetModule.label}" en attente d'implémentation</div>
                <p class="text-xs text-slate-400">
                  Le point d'entrée <code class="text-slate-200">${targetModule.scriptSrc}</code> n'est pas encore enregistré dans <code class="text-slate-200">window.LexWalletModules["${targetModule.id}"]</code>.
                </p>
              </div>
            `;
            return;
          }

          const ctx = {
            moduleId: targetModule.id,
            tenant: getActiveTenant(),
            session: getSession(),
            holdingAdminEmail: HOLDING_ADMIN_EMAIL,
            bus: {
              emit: emitEvent,
              subscribe: subscribeBus,
              getHistory: () => readStorage(STORAGE_KEYS.BUS_LOG, [])
            },
            storage: {
              read: readStorage,
              write: writeStorage
            },
            timers: {
              register: registerManagedTimer,
              clearAll: clearAllManagedTimers
            }
          };

          const instance = await factory.mount(dom.mountRoot, ctx);
          runtime.mountedInstance = instance || null;
          emitEvent("shell:module_mounted", { moduleId: targetModule.id });
        } catch (err) {
          dom.mountRoot.innerHTML = `
            <div class="bg-rose-950/40 border border-rose-700/60 rounded-lg p-4 space-y-1.5">
              <div class="text-sm font-semibold text-rose-300">Erreur de chargement du module</div>
              <div class="text-xs text-rose-200/80 font-mono">${err && err.message ? err.message : "Erreur inconnue"}</div>
            </div>
          `;
        }
      }

      function openAuthModal() {
        const current = getSession();
        dom.authEmail.value = (current && current.email) || HOLDING_ADMIN_EMAIL;
        dom.authRole.value = (current && current.role) || "holding";
        dom.authModal.classList.remove("hidden");
        dom.authModal.classList.add("flex");
      }

      function closeAuthModal() {
        dom.authModal.classList.add("hidden");
        dom.authModal.classList.remove("flex");
      }

      function initShell() {
        window.LexWalletShell = Object.freeze({
          version: "4.0.0-hub",
          modules: MODULES,
          getActiveTenant,
          setActiveTenant,
          getSession,
          setSession,
          emitEvent,
          subscribeBus
        });

        const initialTenant = getActiveTenant();
        dom.tenantSelect.value = initialTenant.id;
        renderSessionUi(getSession());
        renderMenuCards();

        addManagedListener(dom.tenantSelect, "change", (e) => {
          setActiveTenant(e.target.value);
        });

        addManagedListener(dom.btnAuthToggle, "click", () => {
          if (getSession()) {
            setSession(null);
          } else {
            openAuthModal();
          }
        });

        addManagedListener(dom.btnCloseAuth, "click", closeAuthModal);
        addManagedListener(dom.btnCancelAuth, "click", closeAuthModal);

        addManagedListener(dom.authForm, "submit", (e) => {
          e.preventDefault();
          setSession({
            email: dom.authEmail.value,
            role: dom.authRole.value
          });
          closeAuthModal();
        });

        addManagedListener(dom.btnBackMenu, "click", () => {
          window.location.hash = "#/";
        });

        addManagedListener(window, "hashchange", () => {
          handleRouteChange();
        });

        addManagedListener(window, "beforeunload", () => {
          unmountCurrentModule();
          clearAllManagedTimers();
          removeAllManagedListeners();
        });

        handleRouteChange();
      }

      initShell();
    })();
  </script>
</body>
</html>
EOF_INDEX_HTML

timeout 10s mv -f "${TMP_FILE}" "${TARGET_FILE}"

if [ ! -s "${TARGET_FILE}" ]; then
  echo "Erreur : ${TARGET_FILE} est vide apres refonte." >&2
  exit 1
fi

echo "Refonte terminee : ${TARGET_FILE} ($(wc -c < "${TARGET_FILE}") octets)"
