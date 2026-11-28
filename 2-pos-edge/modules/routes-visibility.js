(() => {
  "use strict";

  // Bornes strictes anti-surcharge RAM / anti-boucle
  const MAX_DOM_NODES = 600;
  const MAX_MUTATION_CYCLES = 20;
  const DEBOUNCE_MS = 120;

  const ROUTES = Object.freeze([
    { id: "caisse", label: "Caisse", aliases: ["caisse", "pos", "register", "cart"] },
    { id: "pnl-z", label: "P&L / Z", aliases: ["pnl", "z", "pnl-z", "cloture", "report"] },
    { id: "couts", label: "Coûts", aliases: ["couts", "costs", "food-cost", "charges-fixes"] },
    { id: "factures", label: "Factures", aliases: ["factures", "invoices", "bills"] },
    { id: "paie-charges", label: "Paie & Charges", aliases: ["paie", "charges", "paie-charges", "payroll"] },
    { id: "stocks-iot", label: "Stocks / IoT", aliases: ["stocks", "iot", "stocks-iot", "inventory"] },
    { id: "fournisseurs", label: "Fournisseurs", aliases: ["fournisseurs", "suppliers", "vendors"] },
    { id: "tickets-qr", label: "Tickets & QR", aliases: ["tickets", "qr", "tickets-qr", "receipts"] },
    { id: "fiscalite-api", label: "Fiscalité & API", aliases: ["fiscalite", "api", "fiscalite-api", "tax"] },
    { id: "holding-kyc", label: "Holding & KYC", aliases: ["holding", "kyc", "holding-kyc", "governance"] }
  ]);

  const state = {
    activeRoute: "caisse",
    hiddenRoutes: new Set(),
    mutationCycles: 0,
    isApplying: false,
    debounceTimer: null
  };

  function normalizeKey(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function matchRouteId(raw) {
    const k = normalizeKey(raw);
    if (!k) return null;
    for (let i = 0; i < ROUTES.length; i += 1) {
      const r = ROUTES[i];
      if (r.id === k || r.aliases.includes(k)) {
        return r.id;
      }
    }
    return null;
  }

  function collectRouteElements() {
    const map = new Map();
    for (let i = 0; i < ROUTES.length; i += 1) {
      map.set(ROUTES[i].id, []);
    }
    if (typeof document === "undefined" || !document.querySelectorAll) {
      return map;
    }

    const candidates = document.querySelectorAll(
      "[data-route], [data-view], [data-tab], [data-section], section, article, nav a, nav button, [role='tab']"
    );
    const limit = Math.min(candidates.length, MAX_DOM_NODES);

    for (let i = 0; i < limit; i += 1) {
      const el = candidates[i];
      const rawHint =
        el.getAttribute("data-route") ||
        el.getAttribute("data-view") ||
        el.getAttribute("data-tab") ||
        el.getAttribute("data-section") ||
        el.id ||
        el.textContent ||
        "";
      const matched = matchRouteId(rawHint);
      if (matched) {
        const list = map.get(matched);
        if (list.length < 40) {
          list.push(el);
        }
      }
    }
    return map;
  }

  function applyVisibility() {
    if (state.isApplying) return;
    state.isApplying = true;

    try {
      const grouped = collectRouteElements();

      ROUTES.forEach((route) => {
        const isHidden = state.hiddenRoutes.has(route.id);
        const isActive = !isHidden && state.activeRoute === route.id;
        const els = grouped.get(route.id) || [];

        for (let i = 0; i < els.length; i += 1) {
          const el = els[i];
          if (isHidden) {
            el.setAttribute("data-route-hidden", "true");
            el.setAttribute("aria-hidden", "true");
            if (el.tagName !== "A" && el.tagName !== "BUTTON") {
              el.style.display = "none";
            } else {
              el.style.opacity = "0.35";
            }
          } else {
            el.removeAttribute("data-route-hidden");
            el.setAttribute("aria-hidden", isActive ? "false" : "true");
            if (el.tagName !== "A" && el.tagName !== "BUTTON") {
              el.style.display = isActive ? "" : "none";
            } else {
              el.style.opacity = "";
            }
          }
          el.classList.toggle("is-route-active", isActive);
          el.classList.toggle("is-route-hidden", isHidden);
        }
      });

      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("cheer:routes_updated", {
            detail: {
              activeRoute: state.activeRoute,
              hiddenRoutes: Array.from(state.hiddenRoutes),
              routes: ROUTES.map((r) => ({
                id: r.id,
                label: r.label,
                visible: !state.hiddenRoutes.has(r.id),
                active: !state.hiddenRoutes.has(r.id) && state.activeRoute === r.id
              }))
            }
          })
        );
      }
    } finally {
      setTimeout(() => {
        state.isApplying = false;
      }, 0);
    }
  }

  function scheduleApply() {
    if (state.mutationCycles >= MAX_MUTATION_CYCLES) {
      return;
    }
    state.mutationCycles += 1;
    if (state.debounceTimer !== null) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      applyVisibility();
    }, DEBOUNCE_MS);
  }

  window.CheerRoutesVisibility = Object.freeze({
    getRoutes: () =>
      ROUTES.map((r) => ({
        id: r.id,
        label: r.label,
        visible: !state.hiddenRoutes.has(r.id),
        active: !state.hiddenRoutes.has(r.id) && state.activeRoute === r.id
      })),
    setActiveRoute: (routeOrAlias) => {
      const id = matchRouteId(routeOrAlias);
      if (!id || state.hiddenRoutes.has(id)) return false;
      state.activeRoute = id;
      state.mutationCycles = 0;
      applyVisibility();
      return true;
    },
    setRouteVisibility: (routeOrAlias, visible) => {
      const id = matchRouteId(routeOrAlias);
      if (!id) return false;
      if (visible) {
        state.hiddenRoutes.delete(id);
      } else {
        state.hiddenRoutes.add(id);
        if (state.activeRoute === id) {
          const fallback = ROUTES.find((r) => !state.hiddenRoutes.has(r.id));
          state.activeRoute = fallback ? fallback.id : "caisse";
        }
      }
      state.mutationCycles = 0;
      applyVisibility();
      return true;
    },
    resetCycles: () => {
      state.mutationCycles = 0;
      applyVisibility();
    }
  });

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyVisibility, { once: true });
    } else {
      applyVisibility();
    }

    if (typeof MutationObserver === "function" && document.body) {
      const observer = new MutationObserver(() => {
        if (!state.isApplying) {
          scheduleApply();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 60000);
    }
  }
})();
