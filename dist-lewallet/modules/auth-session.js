(function (global) {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    CREDENTIALS: "lexwallet_auth_credentials_v2",
    SESSION: "lexwallet_session_v3"
  });

  const ADMIN_EMAIL = "cbltec@proton.me";
  const EXECUTION_TIMEOUT_MS = 1500;
  const MAX_ROUTE_ATTEMPTS = 8;

  const MEMORY_STATE = {
    credentials: null,
    session: null,
    routeAttempts: 0
  };

  function isTimedOut(startTimeMs) {
    return (Date.now() - startTimeMs) > EXECUTION_TIMEOUT_MS;
  }

  function safeReadStorage(key) {
    try {
      const raw = global.localStorage ? global.localStorage.getItem(key) : null;
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  function safeWriteStorage(key, value) {
    try {
      if (!global.localStorage) {
        return false;
      }
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function hashSecret(secret) {
    const startTimeMs = Date.now();
    const input = String(secret || "");
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;

    for (let i = 0; i < input.length; i += 1) {
      if (isTimedOut(startTimeMs)) {
        break;
      }
      const code = input.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= (code + i);
      h2 = Math.imul(h2, 0x85ebca6b);
    }

    const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
    const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
    return `${part1}${part2}`;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function ensureAdminCredential(credentialsList) {
    const normalizedAdmin = normalizeEmail(ADMIN_EMAIL);
    const list = Array.isArray(credentialsList) ? credentialsList.slice() : [];
    const existingIndex = list.findIndex(
      (entry) => entry && normalizeEmail(entry.email) === normalizedAdmin
    );

    if (existingIndex === -1) {
      list.unshift({
        id: "admin-cbltec-holding",
        email: ADMIN_EMAIL,
        role: "ADMIN_HOLDING",
        passHash: hashSecret("CBLTEC_HOLDING_2026!"),
        active: true
      });
    } else if (!list[existingIndex].passHash) {
      list[existingIndex] = Object.assign({}, list[existingIndex], {
        email: ADMIN_EMAIL,
        passHash: hashSecret(list[existingIndex].password || "CBLTEC_HOLDING_2026!"),
        active: list[existingIndex].active !== false
      });
    }

    return list;
  }

  function loadCredentials(forceReload) {
    if (!forceReload && Array.isArray(MEMORY_STATE.credentials)) {
      return MEMORY_STATE.credentials;
    }

    const stored = safeReadStorage(STORAGE_KEYS.CREDENTIALS);
    const baseList = Array.isArray(stored) ? stored : [];
    const normalizedList = ensureAdminCredential(baseList);

    MEMORY_STATE.credentials = normalizedList;
    safeWriteStorage(STORAGE_KEYS.CREDENTIALS, normalizedList);
    return normalizedList;
  }

  function verifyCredentials(email, plainPassword) {
    const startTimeMs = Date.now();
    const targetEmail = normalizeEmail(email);
    const computedHash = hashSecret(plainPassword);
    const creds = loadCredentials(false);

    for (let i = 0; i < creds.length; i += 1) {
      if (isTimedOut(startTimeMs)) {
        return { ok: false, reason: "TIMEOUT" };
      }
      const item = creds[i];
      if (!item || item.active === false) {
        continue;
      }
      if (normalizeEmail(item.email) === targetEmail && item.passHash === computedHash) {
        return {
          ok: true,
          user: {
            id: item.id || `usr_${i}`,
            email: item.email,
            role: item.role || "OPERATOR"
          }
        };
      }
    }

    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  function setActiveSession(userPayload) {
    const sessionRecord = userPayload
      ? {
          authenticated: true,
          userId: userPayload.id,
          email: normalizeEmail(userPayload.email),
          role: userPayload.role || "OPERATOR",
          issuedAt: Date.now()
        }
      : {
          authenticated: false,
          userId: null,
          email: null,
          role: null,
          issuedAt: Date.now()
        };

    MEMORY_STATE.session = sessionRecord;
    global.__LEXWALLET_ACTIVE_SESSION__ = sessionRecord;
    safeWriteStorage(STORAGE_KEYS.SESSION, sessionRecord);
    renderSessionHeader(sessionRecord);
    return sessionRecord;
  }

  function getActiveSession() {
    if (MEMORY_STATE.session) {
      return MEMORY_STATE.session;
    }
    const stored = safeReadStorage(STORAGE_KEYS.SESSION);
    if (stored && typeof stored.authenticated === "boolean") {
      MEMORY_STATE.session = stored;
      global.__LEXWALLET_ACTIVE_SESSION__ = stored;
      return stored;
    }
    return setActiveSession(null);
  }

  function clearSession() {
    return setActiveSession(null);
  }

  function renderSessionHeader(sessionRecord) {
    const active = sessionRecord || getActiveSession();
    const doc = global.document;
    if (!doc) {
      return;
    }

    const statusEl = doc.querySelector("[data-session-status]");
    const logoutBtn = doc.querySelector("[data-session-logout]");
    const loginView = doc.querySelector("[data-auth-view]");
    const appShell = doc.querySelector("[data-app-shell]");

    if (statusEl) {
      statusEl.textContent = active.authenticated
        ? `${active.email} (${active.role})`
        : "Déconnecté";
    }
    if (logoutBtn) {
      logoutBtn.style.display = active.authenticated ? "" : "none";
    }
    if (loginView) {
      loginView.style.display = active.authenticated ? "none" : "";
    }
    if (appShell) {
      appShell.style.display = active.authenticated ? "" : "none";
    }
  }

  function resolveInitialRoute() {
    MEMORY_STATE.routeAttempts += 1;
    if (MEMORY_STATE.routeAttempts > MAX_ROUTE_ATTEMPTS) {
      MEMORY_STATE.routeAttempts = 0;
      return "/login";
    }

    const active = getActiveSession();
    if (!active.authenticated) {
      return "/login";
    }
    if (active.role === "ADMIN_HOLDING") {
      return "/holding";
    }
    return "/pos";
  }

  function navigateRoute(targetRoute) {
    const startTimeMs = Date.now();
    if (isTimedOut(startTimeMs)) {
      return false;
    }
    const route = targetRoute || resolveInitialRoute();

    if (global.Router && typeof global.Router.navigate === "function") {
      global.Router.navigate(route);
    } else if (global.location && global.location.hash !== `#${route}`) {
      global.location.hash = `#${route}`;
    }

    MEMORY_STATE.routeAttempts = 0;
    return true;
  }

  function handleLoginSubmit(email, password) {
    const result = verifyCredentials(email, password);
    if (!result.ok) {
      return { ok: false, error: result.reason };
    }
    const session = setActiveSession(result.user);
    const nextRoute = resolveInitialRoute();
    navigateRoute(nextRoute);
    return { ok: true, session: session, route: nextRoute };
  }

  const AuthSession = Object.freeze({
    STORAGE_KEYS,
    ADMIN_EMAIL,
    hashSecret,
    loadCredentials,
    verifyCredentials,
    setActiveSession,
    getActiveSession,
    clearSession,
    renderSessionHeader,
    resolveInitialRoute,
    navigateRoute,
    handleLoginSubmit
  });

  global.AuthSession = AuthSession;
  global.hashSecret = hashSecret;
  global.loadCredentials = loadCredentials;
  global.setActiveSession = setActiveSession;
  global.renderSessionHeader = renderSessionHeader;
  global.resolveInitialRoute = resolveInitialRoute;
  global.navigateRoute = navigateRoute;
  global.handleLoginSubmit = handleLoginSubmit;
})(typeof window !== "undefined" ? window : globalThis);
