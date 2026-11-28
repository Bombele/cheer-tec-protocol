/* Module alimente : onglet Caisse & #/POS/caisse (Point Zero), catalogue complet (28 articles) et evenement cheer:sale_validated */
(function () {
  "use strict";

  var TENANT_ID = "CHEER-FLAGSHIP-01";
  var ADMIN_EMAIL = "cbltec@proton.me";
  var MAX_LEDGER_ITEMS = 250;
  var MAX_AUDIT_ITEMS = 200;
  var CLICK_DEBOUNCE_MS = 110;
  var WATCHDOG_MAX_MS = 12000;
  var WATCHDOG_INTERVAL_MS = 350;

  var STORAGE_KEYS = {
    cart: "lexwallet_caisse_pz_cart_v1",
    ledger: "cheer_pos_ledger_v159",
    audit: "lexwallet_caisse_pz_audit_v1",
    forcedRoute: "lexwallet_caisse_pz_forced_route_v1"
  };

  /* Catalogue complet (28 articles : Burgers, Melts, Street Food, Accompagnements, Sauces, Desserts, Boissons, Vins) */
  var CATALOG_ITEMS = Object.freeze([
    { sku: "CC-BURG-01", cat: "Burgers", name: "Burger Boeuf Cheddar (BBQ Smokey)", ttc: 11.50, cogs: 3.40, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "CHEDDAR-MATURE", qty: 0.12 }, { sku: "SAUCE-BBQ-SMOKEY", qty: 0.04 }] },
    { sku: "CC-BURG-02", cat: "Burgers", name: "Burger Boeuf Raclette", ttc: 13.00, cogs: 3.90, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "RACLETTE-FERMIERE", qty: 0.14 }] },
    { sku: "CC-BURG-03", cat: "Burgers", name: "Burger Boeuf Gouda Truffe", ttc: 13.50, cogs: 4.10, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "GOUDA-TRUFFE", qty: 0.14 }] },
    { sku: "CC-BURG-04", cat: "Burgers", name: "Burger Poulet Raclette et Truffe", ttc: 12.90, cogs: 3.80, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "FILET-POULET-CRISPY", qty: 1 }, { sku: "RACLETTE-FERMIERE", qty: 0.12 }] },
    { sku: "CC-BURG-05", cat: "Burgers", name: "Burger Poulet Cheddar Blanc Jalapeno", ttc: 12.00, cogs: 3.50, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "FILET-POULET-CRISPY", qty: 1 }, { sku: "CHEDDAR-BLANC", qty: 0.12 }] },
    { sku: "CC-BURG-06", cat: "Burgers", name: "Burger Poulet Mozza Cheddar Cajun", ttc: 12.00, cogs: 3.50, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "FILET-POULET-CRISPY", qty: 1 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.12 }] },
    { sku: "CC-BURG-07", cat: "Burgers", name: "Burger Fish Cheese Blend Sweet Chili", ttc: 11.90, cogs: 3.45, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "PAVE-POISSON-PANE", qty: 1 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.10 }] },
    { sku: "CC-BURG-08", cat: "Burgers", name: "Burger Fish Cheddar et Tartare", ttc: 11.90, cogs: 3.45, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "PAVE-POISSON-PANE", qty: 1 }, { sku: "CHEDDAR-MATURE", qty: 0.10 }] },
    { sku: "CC-MELT-01", cat: "Melts", name: "Garlic Melt", ttc: 8.80, cogs: 2.50, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-MIE-GRILLE", qty: 2 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.15 }] },
    { sku: "CC-STR-01", cat: "Street Food", name: "Pepito", ttc: 9.50, cogs: 2.80, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BAGUETTE-CRUSTY", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }] },
    { sku: "CC-STR-02", cat: "Street Food", name: "Salchipapa", ttc: 8.90, cogs: 2.60, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "POMMES-DE-TERRE-FRITES", qty: 0.25 }, { sku: "SAUCISSE-GRILLEE-STREET", qty: 1 }] },
    { sku: "CC-SID-01", cat: "Accompagnements", name: "Frites", ttc: 3.50, cogs: 0.85, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "POMMES-DE-TERRE-FRITES", qty: 0.22 }] },
    { sku: "CC-SID-02", cat: "Accompagnements", name: "Salade", ttc: 3.90, cogs: 1.00, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "LAITUE-CROUSTILLANTE", qty: 0.12 }] },
    { sku: "CC-SID-03", cat: "Accompagnements", name: "Onion Rings", ttc: 4.20, cogs: 1.10, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "ONION-RINGS-PANES", qty: 0.18 }] },
    { sku: "CC-SID-04", cat: "Accompagnements", name: "Chicken Bucket", ttc: 14.50, cogs: 4.30, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "FILET-POULET-CRISPY", qty: 3 }] },
    { sku: "CC-SID-05", cat: "Accompagnements", name: "Cheese Stick", ttc: 4.80, cogs: 1.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "MOZZARELLA-STICKS", qty: 5 }] },
    { sku: "CC-SAU-01", cat: "Sauces", name: "Sauce BBQ Smokey", ttc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-BBQ-SMOKEY", qty: 0.05 }] },
    { sku: "CC-SAU-02", cat: "Sauces", name: "Sauce Truffe et Herbes", ttc: 1.80, cogs: 0.45, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-TRUFFE-HERBES", qty: 0.05 }] },
    { sku: "CC-SAU-03", cat: "Sauces", name: "Sauce Honey-Mustard", ttc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-HONEY-MUSTARD", qty: 0.05 }] },
    { sku: "CC-SAU-04", cat: "Sauces", name: "Sauce Spicy Buffalo Cajun", ttc: 1.50, cogs: 0.35, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-BUFFALO-CAJUN", qty: 0.05 }] },
    { sku: "CC-SAU-05", cat: "Sauces", name: "Sauce Sweet Chili et Ail", ttc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-SWEET-CHILI", qty: 0.05 }] },
    { sku: "CC-DES-01", cat: "Desserts", name: "Cheesecake", ttc: 5.50, cogs: 1.50, vatPlace: 0.06, vatTakeout: 0.06, bom: [{ sku: "BASE-CHEESECAKE", qty: 1 }, { sku: "CREAM-CHEESE-PATISSIER", qty: 0.12 }] },
    { sku: "CC-DES-02", cat: "Desserts", name: "Cafe Gourmet Cheese Cream", ttc: 4.80, cogs: 1.25, vatPlace: 0.06, vatTakeout: 0.06, bom: [{ sku: "GRAINS-CAFE-ESPRESSO", qty: 0.02 }, { sku: "CREAM-CHEESE-PATISSIER", qty: 0.06 }] },
    { sku: "CC-BOI-01", cat: "Boissons", name: "Cheer Lemonade Craft", ttc: 4.00, cogs: 0.90, vatPlace: 0.21, vatTakeout: 0.06, bom: [{ sku: "EAU-GAZEIFIEE-33CL", qty: 1 }] },
    { sku: "CC-BOI-02", cat: "Boissons", name: "Cheer Ice Tea", ttc: 4.00, cogs: 0.90, vatPlace: 0.21, vatTakeout: 0.06, bom: [{ sku: "INFUSION-THE-NOIR", qty: 0.25 }] },
    { sku: "CC-VIN-01", cat: "Vins", name: "Vin Rouge Selection", ttc: 6.00, cogs: 1.80, vatPlace: 0.21, vatTakeout: 0.21, bom: [{ sku: "BOUTEILLE-VIN-ROUGE", qty: 0.15 }] },
    { sku: "CC-VIN-02", cat: "Vins", name: "Vin Blanc Selection", ttc: 6.50, cogs: 1.95, vatPlace: 0.21, vatTakeout: 0.21, bom: [{ sku: "BOUTEILLE-VIN-BLANC", qty: 0.15 }] },
    { sku: "CC-VIN-03", cat: "Vins", name: "Vin Rose Selection", ttc: 6.50, cogs: 1.95, vatPlace: 0.21, vatTakeout: 0.21, bom: [{ sku: "BOUTEILLE-VIN-ROSE", qty: 0.15 }] }
  ]);

  var VOUCHERS = Object.freeze({
    CHEEZVIP: { type: "pct", value: 10, label: "CHEEZVIP (-10%)" },
    STAFF: { type: "pct", value: 20, label: "STAFF (-20%)" },
    BONUS5: { type: "ht", value: 5.0, label: "BONUS5 (-5.00 HT)" }
  });

  var SKU_ALIASES = Object.freeze({
    "CHEER-BURGER-01": "CC-BURG-01",
    "BUR-BEF-CHED": "CC-BURG-01",
    "CHEER-BURGER-02": "CC-BURG-02",
    "CHEER-BUCKET-01": "CC-SID-04",
    "CHEER-CHEESE-01": "CC-DES-01",
    "CHEER-BEV-01": "CC-BOI-01"
  });

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeReadJson(key, fallback) {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(key) : null;
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeWriteJson(key, val) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (_) {}
  }

  function fnv1aHash(str) {
    var h1 = 0x811c9dc5;
    var h2 = 0x01000193;
    var s = String(str || "");
    for (var i = 0; i < s.length; i += 1) {
      var c = s.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = (Math.imul(h2, 31) + c + i) >>> 0;
    }
    return "PZ-" + h1.toString(16).padStart(8, "0") + "-" + h2.toString(16).padStart(8, "0");
  }

  function canonicalSku(rawSku) {
    var k = String(rawSku || "").trim().toUpperCase();
    return SKU_ALIASES[k] || k;
  }

  function findProduct(rawSku) {
    var sku = canonicalSku(rawSku);
    for (var i = 0; i < CATALOG_ITEMS.length; i += 1) {
      if (CATALOG_ITEMS[i].sku === sku) return CATALOG_ITEMS[i];
    }
    return null;
  }

  function resolveHashRoute() {
    var raw = String(window.location.hash || "").replace(/^#/, "");
    if (!raw) {
      var forced = safeReadJson(STORAGE_KEYS.forcedRoute, "");
      if (forced) return forced;
      return "/POS";
    }
    if (raw === "/") return "/POS";
    return raw.charAt(0) === "/" ? raw : "/" + raw;
  }

  function isCaisseRoute(route) {
    var r = String(route || resolveHashRoute()).toLowerCase();
    return r === "/pos/caisse" || r.indexOf("/pos/caisse/") === 0;
  }

  function activateRoute(path) {
    var target = path && path.charAt(0) === "/" ? path : "/" + String(path || "POS");
    safeWriteJson(STORAGE_KEYS.forcedRoute, target);

    try {
      if (window.location.hash !== "#" + target) {
        window.location.hash = "#" + target;
      }
    } catch (_) {}

    try {
      if (window.history && typeof window.history.replaceState === "function") {
        window.history.replaceState(window.history.state, "", "#" + target);
      }
    } catch (_) {}

    if (typeof window.renderRoute === "function") {
      try { window.renderRoute(target); } catch (_) {}
    }

    try {
      window.dispatchEvent(new CustomEvent("cheer:pos:route-changed", { detail: { route: target } }));
    } catch (_) {}

    renderCaissePointZero();
  }

  var state = {
    saleMode: "sur_place",
    categoryFilter: "ALL",
    discountPct: 0,
    voucher: null,
    lastTapMs: 0,
    busy: false,
    lastTicket: null,
    cart: Array.isArray(safeReadJson(STORAGE_KEYS.cart, [])) ? safeReadJson(STORAGE_KEYS.cart, []) : [],
    ledger: safeReadJson(STORAGE_KEYS.ledger, { sales: [], stock_movements: [], pnl_entries: [] }),
    audit: Array.isArray(safeReadJson(STORAGE_KEYS.audit, [])) ? safeReadJson(STORAGE_KEYS.audit, []) : []
  };

  if (!state.ledger || typeof state.ledger !== "object") {
    state.ledger = { sales: [], stock_movements: [], pnl_entries: [] };
  }
  state.ledger.sales = Array.isArray(state.ledger.sales) ? state.ledger.sales : [];
  state.ledger.stock_movements = Array.isArray(state.ledger.stock_movements) ? state.ledger.stock_movements : [];
  state.ledger.pnl_entries = Array.isArray(state.ledger.pnl_entries) ? state.ledger.pnl_entries : [];

  function appendAuditLog(eventName, detail) {
    var prev = state.audit.length > 0 ? state.audit[state.audit.length - 1].hash : "GENESIS-POINT-ZERO";
    var ts = new Date().toISOString();
    var payload = detail || {};
    var hash = fnv1aHash(prev + "|" + ts + "|" + TENANT_ID + "|" + eventName + "|" + JSON.stringify(payload));
    state.audit.push({
      seq: state.audit.length + 1,
      ts: ts,
      tenantId: TENANT_ID,
      admin: ADMIN_EMAIL,
      event: eventName,
      prevHash: prev,
      hash: hash,
      detail: payload
    });
    if (state.audit.length > MAX_AUDIT_ITEMS) {
      state.audit = state.audit.slice(-MAX_AUDIT_ITEMS);
    }
    safeWriteJson(STORAGE_KEYS.audit, state.audit);
    return hash;
  }

  function computeTotals() {
    var rawTtc = 0;
    var cogsTotal = 0;
    var itemCount = 0;
    var weightedVatAcc = 0;

    for (var i = 0; i < state.cart.length; i += 1) {
      var line = state.cart[i];
      var qty = Math.max(0, Number(line.qty || 0));
      var unitTtc = Math.max(0, Number(line.ttc || 0));
      var unitCogs = Math.max(0, Number(line.cogs || 0));
      var rate = state.saleMode === "emporter"
        ? Number(line.vatTakeout !== undefined ? line.vatTakeout : 0.06)
        : Number(line.vatPlace !== undefined ? line.vatPlace : 0.12);
      var lineTtc = round2(unitTtc * qty);

      rawTtc = round2(rawTtc + lineTtc);
      cogsTotal = round2(cogsTotal + unitCogs * qty);
      itemCount += qty;
      weightedVatAcc += lineTtc * rate;
    }

    var avgRate = rawTtc > 0 ? (weightedVatAcc / rawTtc) : (state.saleMode === "emporter" ? 0.06 : 0.12);
    var rawHt = round2(rawTtc / (1 + avgRate));
    var pctDiscountHt = round2(rawHt * (Math.min(100, Math.max(0, Number(state.discountPct || 0))) / 100));
    var voucherHt = 0;
    if (state.voucher) {
      if (state.voucher.type === "pct") {
        voucherHt = round2((rawHt - pctDiscountHt) * (Number(state.voucher.value || 0) / 100));
      } else if (state.voucher.type === "ht") {
        voucherHt = Math.min(round2(rawHt - pctDiscountHt), round2(state.voucher.value || 0));
      }
    }

    var discountHt = Math.min(rawHt, round2(pctDiscountHt + voucherHt));
    var netHt = Math.max(0, round2(rawHt - discountHt));
    var vatAmount = round2(netHt * avgRate);
    var totalTtc = round2(netHt + vatAmount);
    var grossMargin = round2(netHt - cogsTotal);

    return {
      itemCount: itemCount,
      rawTtc: rawTtc,
      rawHt: rawHt,
      discountHt: discountHt,
      netHt: netHt,
      vatAmount: vatAmount,
      totalTtc: totalTtc,
      cogsTotal: cogsTotal,
      grossMargin: grossMargin,
      saleMode: state.saleMode
    };
  }

  function syncGlobalsAndEmit(eventName, extraDetail) {
    var totals = computeTotals();
    window.cart = state.cart;
    window.__CHEER_POS_STATE__ = {
      tenantId: TENANT_ID,
      admin: ADMIN_EMAIL,
      saleMode: state.saleMode,
      items: state.cart.slice(),
      totals: totals,
      lastTicket: state.lastTicket
    };
    window.CHEER_LAST_TICKET = state.lastTicket;
    safeWriteJson(STORAGE_KEYS.cart, state.cart);

    try {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: Object.assign({
          tenantId: TENANT_ID,
          admin: ADMIN_EMAIL,
          totals: totals,
          cart: state.cart.slice(),
          lastTicket: state.lastTicket
        }, extraDetail || {})
      }));
    } catch (_) {}
  }

  function addSku(rawSku, delta) {
    if (state.busy) return;
    var now = Date.now();
    if (now - state.lastTapMs < CLICK_DEBOUNCE_MS) return;
    state.lastTapMs = now;

    var prod = findProduct(rawSku);
    if (!prod) return;

    var step = Number(delta);
    if (!isFinite(step) || step === 0) step = 1;

    var idx = -1;
    for (var i = 0; i < state.cart.length; i += 1) {
      if (state.cart[i].sku === prod.sku) {
        idx = i;
        break;
      }
    }

    if (idx !== -1) {
      var nextQty = Number(state.cart[idx].qty || 0) + step;
      if (nextQty <= 0) state.cart.splice(idx, 1);
      else state.cart[idx].qty = nextQty;
    } else if (step > 0) {
      state.cart.push({
        sku: prod.sku,
        cat: prod.cat,
        name: prod.name,
        ttc: prod.ttc,
        cogs: prod.cogs,
        vatPlace: prod.vatPlace,
        vatTakeout: prod.vatTakeout,
        bom: prod.bom.slice(),
        qty: step
      });
    }

    appendAuditLog("CART_MUTATION", { sku: prod.sku, delta: step, items: state.cart.length });
    syncGlobalsAndEmit("cheer:pos:cart-updated", { sku: prod.sku, delta: step });
    renderCaissePointZero();
  }

  function clearCartState() {
    state.cart = [];
    state.discountPct = 0;
    state.voucher = null;
    appendAuditLog("CART_CLEARED", { tenantId: TENANT_ID });
    syncGlobalsAndEmit("cheer:pos:cart-updated", { cleared: true });
    renderCaissePointZero();
  }

  function drawQrOnCanvas(canvas, payloadStr) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var size = 21;
    var cell = 7;
    canvas.width = size * cell;
    canvas.height = size * cell;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f172a";

    function drawFinder(r0, c0) {
      for (var r = 0; r < 7; r += 1) {
        for (var c = 0; c < 7; c += 1) {
          var edge = r === 0 || r === 6 || c === 0 || c === 6;
          var core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (edge || core) {
            ctx.fillRect((c0 + c) * cell, (r0 + r) * cell, cell, cell);
          }
        }
      }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    var h = 2166136261 >>> 0;
    for (var i = 0; i < payloadStr.length; i += 1) {
      h ^= payloadStr.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    for (var r = 0; r < size; r += 1) {
      for (var c = 0; c < size; c += 1) {
        var finderZone = (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
        if (finderZone) continue;
        var bit = ((h ^ (r * 73 + c * 19)) >>> ((r + c) % 24)) & 1;
        if (bit === 1) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }

  function propagateSaleDownstream(saleRecord, totals) {
    state.ledger.sales.unshift(saleRecord);
    state.ledger.sales = state.ledger.sales.slice(0, MAX_LEDGER_ITEMS);

    for (var i = 0; i < saleRecord.items.length; i += 1) {
      var line = saleRecord.items[i];
      var bom = Array.isArray(line.bom) ? line.bom : [];
      for (var b = 0; b < bom.length; b += 1) {
        var consQty = round2(Number(bom[b].qty || 0) * Number(line.qty || 1));
        state.ledger.stock_movements.unshift({
          txId: saleRecord.id,
          sku: bom[b].sku,
          sourceItemSku: line.sku,
          name: line.name,
          delta_qty: -consQty,
          unit_cogs: Number(line.cogs || 0),
          ts: saleRecord.timestamp
        });
      }
    }
    state.ledger.stock_movements = state.ledger.stock_movements.slice(0, MAX_LEDGER_ITEMS);

    state.ledger.pnl_entries.unshift({
      txId: saleRecord.id,
      revenue_ttc: totals.totalTtc,
      revenue_ht: totals.netHt,
      vat_amount: totals.vatAmount,
      discount_ht: totals.discountHt,
      cogs: totals.cogsTotal,
      gross_margin: totals.grossMargin,
      sale_type: state.saleMode,
      ts: saleRecord.timestamp
    });
    state.ledger.pnl_entries = state.ledger.pnl_entries.slice(0, MAX_LEDGER_ITEMS);

    safeWriteJson(STORAGE_KEYS.ledger, state.ledger);

    appendAuditLog("SALE_VALIDATED_POINT_ZERO", {
      ticketId: saleRecord.id,
      totalTtc: totals.totalTtc,
      netHt: totals.netHt,
      vatAmount: totals.vatAmount,
      cogsTotal: totals.cogsTotal
    });

    window.dispatchEvent(new CustomEvent("cheer:sale_validated", {
      detail: saleRecord
    }));
  }

  function validateTicketNow() {
    if (state.busy || state.cart.length === 0) return;
    state.busy = true;
    try {
      var totals = computeTotals();
      var ticketId = "TX-" + Date.now();
      var ts = new Date().toISOString();
      var qrPayload = JSON.stringify({
        ticketId: ticketId,
        tenantId: TENANT_ID,
        admin: ADMIN_EMAIL,
        ts: ts,
        saleMode: state.saleMode,
        totalTtc: totals.totalTtc,
        netHt: totals.netHt,
        vatAmount: totals.vatAmount
      });

      var saleRecord = {
        id: ticketId,
        tenantId: TENANT_ID,
        admin: ADMIN_EMAIL,
        timestamp: ts,
        saleMode: state.saleMode,
        discountPct: state.discountPct,
        voucher: state.voucher ? state.voucher.code : null,
        subtotal_ht: totals.netHt,
        vat_amount: totals.vatAmount,
        total_ttc: totals.totalTtc,
        cogs_total: totals.cogsTotal,
        gross_margin: totals.grossMargin,
        qr_payload: qrPayload,
        integrity_hash: fnv1aHash(ticketId + "|" + ts + "|" + totals.totalTtc),
        items: state.cart.map(function (it) {
          return Object.assign({}, it);
        })
      };

      state.lastTicket = saleRecord;
      propagateSaleDownstream(saleRecord, totals);
      state.cart = [];
      state.discountPct = 0;
      state.voucher = null;
      syncGlobalsAndEmit("cheer:pos:ticket-validated", { ticket: saleRecord });
      renderCaissePointZero();
    } finally {
      state.busy = false;
    }
  }

  function ensureCaisseMountTarget() {
    var viewCaisse = document.getElementById("view-caisse");
    var mainEl = document.querySelector("main") || document.body;
    if (!viewCaisse && mainEl) {
      viewCaisse = document.createElement("section");
      viewCaisse.id = "view-caisse";
      viewCaisse.className = "space-y-4";
      mainEl.appendChild(viewCaisse);
    }
    if (!viewCaisse) return null;

    var oldCat = document.getElementById("catalog-container");
    if (oldCat) oldCat.style.display = "none";

    var anchor = document.getElementById("caisse-point-zero-root");
    if (!anchor) {
      anchor = document.createElement("div");
      anchor.id = "caisse-point-zero-root";
      anchor.className = "space-y-4 font-mono text-xs";
      viewCaisse.insertBefore(anchor, viewCaisse.firstChild);
    }
    return anchor;
  }

  function getCategories() {
    var cats = ["ALL"];
    for (var i = 0; i < CATALOG_ITEMS.length; i += 1) {
      var c = CATALOG_ITEMS[i].cat;
      if (cats.indexOf(c) === -1) cats.push(c);
    }
    return cats;
  }

  function renderCaissePointZero() {
    var route = resolveHashRoute();
    var active = isCaisseRoute(route);
    var viewCaisse = document.getElementById("view-caisse");
    var hubEl = document.getElementById("pos-hub-panel");

    if (!active) {
      if (viewCaisse) viewCaisse.classList.add("hidden");
      var existingRoot = document.getElementById("caisse-point-zero-root");
      if (existingRoot) existingRoot.classList.add("hidden");
      if (hubEl) hubEl.classList.remove("hidden");
      return;
    }

    if (hubEl) hubEl.classList.add("hidden");
    var root = ensureCaisseMountTarget();
    if (!root) return;

    if (viewCaisse) {
      viewCaisse.classList.remove("hidden");
      viewCaisse.style.display = "block";
    }
    root.classList.remove("hidden");
    root.style.display = "block";

    var categories = getCategories();
    var filtered = CATALOG_ITEMS.filter(function (it) {
      return state.categoryFilter === "ALL" || it.cat === state.categoryFilter;
    });

    var totals = computeTotals();
    var linesHtml = state.cart.length === 0
      ? '<div class="text-slate-500 py-4 text-center">Panier vide — cliquez sur + Ajouter.</div>'
      : state.cart.map(function (line, idx) {
          var lineTtc = round2(Number(line.qty || 0) * Number(line.ttc || 0));
          return '<div class="flex items-center justify-between gap-2 py-2 border-b border-slate-800">' +
            '<div class="min-w-0">' +
              '<div class="text-slate-100 font-semibold truncate">' + escapeHtml(line.name) + '</div>' +
              '<div class="text-[11px] text-slate-400">' + Number(line.qty) + ' × ' + Number(line.ttc).toFixed(2) + ' € TTC</div>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 shrink-0">' +
              '<button type="button" data-pz-dec="' + idx + '" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">-</button>' +
              '<span class="text-amber-300 font-bold w-5 text-center">' + Number(line.qty) + '</span>' +
              '<button type="button" data-pz-inc="' + idx + '" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">+</button>' +
              '<span class="text-sky-300 font-bold ml-1">' + lineTtc.toFixed(2) + ' €</span>' +
            '</div>' +
          '</div>';
        }).join("");

    var ticketHtml = "";
    if (state.lastTicket) {
      ticketHtml = '<div class="mt-3 p-3 rounded-xl bg-slate-950 border border-emerald-700/60 flex flex-col sm:flex-row items-center gap-3">' +
        '<canvas id="pz-qr-canvas" class="rounded bg-white p-1 shrink-0"></canvas>' +
        '<div class="space-y-1 text-[11px] text-slate-300 min-w-0">' +
          '<div class="text-emerald-400 font-bold">Ticket validé : ' + escapeHtml(state.lastTicket.id) + '</div>' +
          '<div>Total TTC : <strong class="text-amber-300">' + Number(state.lastTicket.total_ttc).toFixed(2) + ' €</strong> • HT : ' + Number(state.lastTicket.subtotal_ht).toFixed(2) + ' € • TVA : ' + Number(state.lastTicket.vat_amount).toFixed(2) + ' €</div>' +
          '<div class="text-[10px] text-slate-400 truncate">Hash : ' + escapeHtml(state.lastTicket.integrity_hash) + '</div>' +
        '</div>' +
      '</div>';
    }

    root.innerHTML = [
      '<div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">',
        '<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">',
          '<div>',
            '<span class="text-emerald-400 font-bold">POINT ZÉRO CAISSE • #/POS/caisse</span>',
            '<span class="text-slate-400 ml-2">' + escapeHtml(TENANT_ID) + ' • ' + filtered.length + '/' + CATALOG_ITEMS.length + ' articles</span>',
          '</div>',
          '<div class="flex flex-wrap items-center gap-2">',
            '<button type="button" id="pz-go-pos" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold">← /POS</button>',
            '<button type="button" data-pz-mode="sur_place" class="px-2.5 py-1 rounded font-bold ' + (state.saleMode === "sur_place" ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300") + '">Sur Place</button>',
            '<button type="button" data-pz-mode="emporter" class="px-2.5 py-1 rounded font-bold ' + (state.saleMode === "emporter" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300") + '">À Emporter</button>',
          '</div>',
        '</div>',
        '<div class="flex flex-wrap gap-1.5">',
          categories.map(function (cat) {
            var activeCat = state.categoryFilter === cat;
            var label = cat === "ALL" ? "Tous (" + CATALOG_ITEMS.length + ")" : cat;
            return '<button type="button" data-pz-cat="' + escapeHtml(cat) + '" class="px-2.5 py-1 rounded text-[11px] font-bold ' + (activeCat ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800") + '">' + escapeHtml(label) + '</button>';
          }).join(""),
        '</div>',
        '<div class="grid grid-cols-1 lg:grid-cols-12 gap-4">',
          '<div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[560px] overflow-y-auto pr-1">',
            filtered.map(function (item) {
              return '<div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2">' +
                '<div>' +
                  '<div class="text-[10px] text-slate-400">' + escapeHtml(item.cat) + ' • ' + escapeHtml(item.sku) + '</div>' +
                  '<div class="text-xs font-bold text-slate-100 mt-0.5">' + escapeHtml(item.name) + '</div>' +
                '</div>' +
                '<div class="flex items-center justify-between pt-2 border-t border-slate-900">' +
                  '<span class="text-xs font-bold text-amber-300">' + Number(item.ttc).toFixed(2) + ' € TTC</span>' +
                  '<button type="button" data-pz-add="' + escapeHtml(item.sku) + '" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">+ Ajouter</button>' +
                '</div>' +
              '</div>';
            }).join(""),
          '</div>',
          '<div class="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">',
            '<div class="space-y-2.5">',
              '<div class="flex items-center justify-between border-b border-slate-800 pb-2">',
                '<span class="font-bold text-sky-300">Panier (' + totals.itemCount + ')</span>',
                '<button type="button" id="pz-clear-btn" class="text-rose-400 hover:text-rose-300 text-[11px]">Vider</button>',
              '</div>',
              '<div class="max-h-52 overflow-y-auto pr-1">' + linesHtml + '</div>',
              '<div class="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">',
                '<button type="button" data-pz-disc="0" class="py-1 rounded font-bold ' + (state.discountPct === 0 ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-300") + '">0%</button>',
                '<button type="button" data-pz-disc="5" class="py-1 rounded font-bold ' + (state.discountPct === 5 ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-300") + '">-5%</button>',
                '<button type="button" data-pz-disc="10" class="py-1 rounded font-bold ' + (state.discountPct === 10 ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-300") + '">-10%</button>',
              '</div>',
              '<div class="flex gap-1.5">',
                '<input type="text" id="pz-voucher-input" placeholder="CHEEZVIP / STAFF / BONUS5" class="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white flex-1 uppercase"/>',
                '<button type="button" id="pz-voucher-apply" class="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold">OK</button>',
              '</div>',
              '<div class="space-y-1 pt-2 border-t border-slate-800 text-[11px]">',
                '<div class="flex justify-between text-slate-400"><span>Net HT :</span><span>' + totals.netHt.toFixed(2) + ' €</span></div>',
                '<div class="flex justify-between text-emerald-400"><span>Remise HT :</span><span>-' + totals.discountHt.toFixed(2) + ' €</span></div>',
                '<div class="flex justify-between text-slate-400"><span>TVA :</span><span>' + totals.vatAmount.toFixed(2) + ' €</span></div>',
                '<div class="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800"><span>Total TTC :</span><span class="text-amber-300">' + totals.totalTtc.toFixed(2) + ' €</span></div>',
              '</div>',
            '</div>',
            '<button type="button" id="pz-validate-btn" ' + (state.cart.length === 0 ? "disabled" : "") + ' class="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold uppercase">Encaisser & Émettre Ticket + QR</button>',
            ticketHtml,
          '</div>',
        '</div>',
      '</div>'
    ].join("");

    bindRootControls(root);

    if (state.lastTicket) {
      var canvas = document.getElementById("pz-qr-canvas");
      drawQrOnCanvas(canvas, state.lastTicket.qr_payload);
    }
  }

  function bindRootControls(root) {
    var goPos = root.querySelector("#pz-go-pos");
    if (goPos) {
      goPos.addEventListener("click", function () {
        activateRoute("/POS");
      });
    }

    root.querySelectorAll("[data-pz-cat]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.categoryFilter = btn.getAttribute("data-pz-cat") || "ALL";
        renderCaissePointZero();
      });
    });

    root.querySelectorAll("[data-pz-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addSku(btn.getAttribute("data-pz-add"), 1);
      });
    });

    root.querySelectorAll("[data-pz-inc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-pz-inc"));
        if (state.cart[idx]) addSku(state.cart[idx].sku, 1);
      });
    });

    root.querySelectorAll("[data-pz-dec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-pz-dec"));
        if (state.cart[idx]) addSku(state.cart[idx].sku, -1);
      });
    });

    root.querySelectorAll("[data-pz-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.saleMode = btn.getAttribute("data-pz-mode") === "emporter" ? "emporter" : "sur_place";
        syncGlobalsAndEmit("cheer:pos:mode-changed", { saleMode: state.saleMode });
        renderCaissePointZero();
      });
    });

    root.querySelectorAll("[data-pz-disc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.discountPct = Number(btn.getAttribute("data-pz-disc")) || 0;
        renderCaissePointZero();
      });
    });

    var vBtn = root.querySelector("#pz-voucher-apply");
    if (vBtn) {
      vBtn.addEventListener("click", function () {
        var inp = root.querySelector("#pz-voucher-input");
        var code = inp ? String(inp.value || "").trim().toUpperCase() : "";
        state.voucher = VOUCHERS[code] ? Object.assign({ code: code }, VOUCHERS[code]) : null;
        renderCaissePointZero();
      });
    }

    var clrBtn = root.querySelector("#pz-clear-btn");
    if (clrBtn) {
      clrBtn.addEventListener("click", clearCartState);
    }

    var valBtn = root.querySelector("#pz-validate-btn");
    if (valBtn) {
      valBtn.addEventListener("click", validateTicketNow);
    }
  }

  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("a, button, [role='tab']") : null;
    if (!el) return;
    if (el.closest && el.closest("#caisse-point-zero-root")) return;

    var href = String(el.getAttribute("href") || "");
    var dataRoute = String(el.getAttribute("data-nav-route") || el.getAttribute("data-route") || "");
    var txt = String(el.textContent || "").trim().toLowerCase();

    var isCaisseTab =
      href.toLowerCase().indexOf("/pos/caisse") !== -1 ||
      dataRoute.toLowerCase().indexOf("/pos/caisse") !== -1 ||
      txt === "caisse" ||
      txt.indexOf("caisse (#/pos/caisse)") !== -1;

    if (isCaisseTab) {
      ev.preventDefault();
      activateRoute("/POS/caisse");
    } else if (href.toLowerCase().indexOf("/pos/holding-kyc") !== -1 || txt.indexOf("holding") !== -1) {
      safeWriteJson(STORAGE_KEYS.forcedRoute, "/POS/holding-kyc");
      setTimeout(renderCaissePointZero, 20);
    } else if (href.toLowerCase().indexOf("#/pos") === 0 || txt === "← /pos" || txt === "menu pos") {
      safeWriteJson(STORAGE_KEYS.forcedRoute, "/POS");
      setTimeout(renderCaissePointZero, 20);
    }
  }, true);

  window.addEventListener("hashchange", renderCaissePointZero);
  window.addEventListener("popstate", renderCaissePointZero);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      renderCaissePointZero();
      syncGlobalsAndEmit("cheer:pos:point-zero-ready");
    });
  } else {
    renderCaissePointZero();
    syncGlobalsAndEmit("cheer:pos:point-zero-ready");
  }

  var startedAt = Date.now();
  var watchdog = setInterval(function () {
    renderCaissePointZero();
    if (Date.now() - startedAt >= WATCHDOG_MAX_MS) {
      clearInterval(watchdog);
    }
  }, WATCHDOG_INTERVAL_MS);

  window.LexWalletModules = window.LexWalletModules || {};
  window.LexWalletModules.caisse = Object.freeze({
    id: "caisse",
    role: "point-zero",
    tenantId: TENANT_ID,
    admin: ADMIN_EMAIL,
    routes: Object.freeze(["#/POS", "#/POS/caisse"]),
    catalogCount: CATALOG_ITEMS.length,
    openCaisse: function () { activateRoute("/POS/caisse"); },
    addSku: addSku,
    clearCart: clearCartState,
    validateTicket: validateTicketNow,
    getTotals: computeTotals,
    mount: function (_root, ctx) {
      if (ctx && ctx.bus && typeof ctx.bus.emit === "function") {
        ctx.bus.emit("pos:point_zero_mounted", { tenantId: TENANT_ID, totals: computeTotals() });
      }
      renderCaissePointZero();
      return {
        unmount: function () {
          clearInterval(watchdog);
          var el = document.getElementById("caisse-point-zero-root");
          if (el) el.remove();
        }
      };
    }
  });
})();
