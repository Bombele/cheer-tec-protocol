(function () {
  "use strict";

  var MAX_RENDER_CARDS = 120;
  var MAX_TICKS = 30;
  var STORAGE_KEY_TX = "CHEER_POS_TICKETS_PERSISTENT_V1";
  var STORAGE_KEY_STOCK = "CHEER_POS_STOCK_LOTS_V1";
  var STORAGE_KEY_AUDIT = "CHEER_POS_AUDIT_CHAIN_V1";
  var STORAGE_KEY_STATE = "CHEER_POS_ACTIVE_STATE_V1";

  var isProcessingTx = false;
  var activeCategory = "ALL";
  var searchTerm = "";
  var saleMode = "SUR_PLACE";
  var discountPct = 0;
  var couponCode = "";

  var CATALOG_28 = [
    { id: "BUR-BEF-CHED", name: "Burger Boeuf Cheddar (BBQ Smokey)", category: "Hamburgers", priceTtc: 11.50, cogs: 3.20, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "CHEDDAR-MATURE", qty: 0.12 }, { sku: "SAUCE-BBQ-SMOKEY", qty: 0.04 }] },
    { id: "BUR-BEF-RACL", name: "Burger Boeuf Raclette", category: "Hamburgers", priceTtc: 13.00, cogs: 3.75, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "RACLETTE-FERMIERE", qty: 0.14 }, { sku: "CHEDDAR-MATURE", qty: 0.06 }] },
    { id: "BUR-BEF-GOUDA", name: "Burger Boeuf Gouda Truffe", category: "Hamburgers", priceTtc: 13.50, cogs: 3.90, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "GOUDA-TRUFFE", qty: 0.14 }, { sku: "SAUCE-TRUFFE-HERBES", qty: 0.04 }] },
    { id: "BUR-POU-RACL", name: "Burger Poulet Raclette et Truffe", category: "Hamburgers", priceTtc: 12.50, cogs: 3.50, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "FILET-POULET-CRISPY", qty: 1 }, { sku: "RACLETTE-FERMIERE", qty: 0.12 }, { sku: "SAUCE-TRUFFE-HERBES", qty: 0.04 }] },
    { id: "BUR-POU-JALAP", name: "Burger Poulet Cheddar Blanc Jalapeno", category: "Hamburgers", priceTtc: 12.00, cogs: 3.35, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "FILET-POULET-CRISPY", qty: 1 }, { sku: "CHEDDAR-BLANC", qty: 0.12 }, { sku: "JALAPENO-PICKLES", qty: 0.04 }] },
    { id: "BUR-POU-CAJUN", name: "Burger Poulet Mozza-Cheddar Cajun", category: "Hamburgers", priceTtc: 12.00, cogs: 3.40, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "FILET-POULET-CRISPY", qty: 1 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.12 }, { sku: "SAUCE-BUFFALO-CAJUN", qty: 0.04 }] },
    { id: "BUR-FSH-BLEND", name: "Burger Fish Cheese Blend Sweet Chili", category: "Hamburgers", priceTtc: 12.00, cogs: 3.45, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "PAVE-POISSON-PANE", qty: 1 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.10 }, { sku: "SAUCE-SWEET-CHILI", qty: 0.04 }] },
    { id: "BUR-FSH-CHED", name: "Burger Fish Cheddar et Tartare", category: "Hamburgers", priceTtc: 11.80, cogs: 3.35, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BRIOCHE", qty: 1 }, { sku: "PAVE-POISSON-PANE", qty: 1 }, { sku: "CHEDDAR-MATURE", qty: 0.10 }, { sku: "SAUCE-HONEY-MUSTARD", qty: 0.04 }] },
    { id: "DES-CHEESECAKE", name: "Cheesecake", category: "Cheesecake et Cafe", priceTtc: 5.50, cogs: 1.50, vatPlace: 0.06, vatTakeout: 0.06, bom: [{ sku: "BASE-CHEESECAKE", qty: 1 }, { sku: "CREAM-CHEESE-PATISSIER", qty: 0.12 }] },
    { id: "CAF-CHEESE-CREAM", name: "Cafe Gourmet Cheese Cream", category: "Cheesecake et Cafe", priceTtc: 4.80, cogs: 1.15, vatPlace: 0.06, vatTakeout: 0.06, bom: [{ sku: "GRAINS-CAFE-ESPRESSO", qty: 0.02 }, { sku: "CREAM-CHEESE-PATISSIER", qty: 0.06 }, { sku: "LAIT-ENTIER-UHT", qty: 0.12 }] },
    { id: "BOI-LIMONADE-CRAFT", name: "Cheer Limonade Craft", category: "Boissons", priceTtc: 4.00, cogs: 0.95, vatPlace: 0.21, vatTakeout: 0.06, bom: [{ sku: "CONCENTRE-CITRON-CRAFT", qty: 0.08 }, { sku: "EAU-GAZEIFIEE-33CL", qty: 1 }] },
    { id: "BOI-ICE-TEA", name: "Cheer Ice Tea", category: "Boissons", priceTtc: 4.00, cogs: 0.90, vatPlace: 0.21, vatTakeout: 0.06, bom: [{ sku: "INFUSION-THE-NOIR", qty: 0.25 }, { sku: "SIROP-PECHE-CITRON", qty: 0.05 }] },
    { id: "VIN-ROUGE", name: "Vin Rouge Selection", category: "Vins", priceTtc: 6.50, cogs: 1.50, vatPlace: 0.21, vatTakeout: 0.21, bom: [{ sku: "BOUTEILLE-VIN-ROUGE", qty: 0.15 }, { sku: "VERRE-JETABLE-OU-SERVICE", qty: 1 }] },
    { id: "VIN-BLANC", name: "Vin Blanc Selection", category: "Vins", priceTtc: 6.50, cogs: 1.50, vatPlace: 0.21, vatTakeout: 0.21, bom: [{ sku: "BOUTEILLE-VIN-BLANC", qty: 0.15 }, { sku: "VERRE-JETABLE-OU-SERVICE", qty: 1 }] },
    { id: "VIN-ROSE", name: "Vin Rose Selection", category: "Vins", priceTtc: 6.50, cogs: 1.50, vatPlace: 0.21, vatTakeout: 0.21, bom: [{ sku: "BOUTEILLE-VIN-ROSE", qty: 0.15 }, { sku: "VERRE-JETABLE-OU-SERVICE", qty: 1 }] },
    { id: "MELT-GARLIC", name: "Garlic Melt", category: "Melts et Street", priceTtc: 8.50, cogs: 2.20, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-MIE-GRILLE", qty: 2 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.15 }, { sku: "BEURRE-AIL-PERSIL", qty: 0.03 }] },
    { id: "STR-PEPITO", name: "Pepito", category: "Melts et Street", priceTtc: 9.50, cogs: 2.65, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "PAIN-BAGUETTE-CRUSTY", qty: 1 }, { sku: "BOEUF-HACHE-150G", qty: 1 }, { sku: "CHEDDAR-MATURE", qty: 0.10 }, { sku: "SAUCE-BBQ-SMOKEY", qty: 0.03 }] },
    { id: "STR-SALCHIPAPA", name: "Salchipapa", category: "Melts et Street", priceTtc: 8.50, cogs: 2.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "POMMES-DE-TERRE-FRITES", qty: 0.25 }, { sku: "SAUCISSE-GRILLEE-STREET", qty: 1 }, { sku: "MOZZA-CHEDDAR-BLEND", qty: 0.08 }, { sku: "SAUCE-SWEET-CHILI", qty: 0.03 }] },
    { id: "SAU-BBQ", name: "Sauce BBQ Smokey", category: "Sauces", priceTtc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-BBQ-SMOKEY", qty: 0.05 }, { sku: "POT-SAUCE-OPERCULE", qty: 1 }] },
    { id: "SAU-TRUFFE", name: "Sauce Truffe et Herbes", category: "Sauces", priceTtc: 1.50, cogs: 0.35, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-TRUFFE-HERBES", qty: 0.05 }, { sku: "POT-SAUCE-OPERCULE", qty: 1 }] },
    { id: "SAU-HONEY", name: "Sauce Honey-Mustard", category: "Sauces", priceTtc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-HONEY-MUSTARD", qty: 0.05 }, { sku: "POT-SAUCE-OPERCULE", qty: 1 }] },
    { id: "SAU-BUFFALO", name: "Sauce Spicy Buffalo Cajun", category: "Sauces", priceTtc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-BUFFALO-CAJUN", qty: 0.05 }, { sku: "POT-SAUCE-OPERCULE", qty: 1 }] },
    { id: "SAU-CHILI", name: "Sauce Sweet Chili et Ail", category: "Sauces", priceTtc: 1.20, cogs: 0.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "SAUCE-SWEET-CHILI", qty: 0.05 }, { sku: "POT-SAUCE-OPERCULE", qty: 1 }] },
    { id: "ACC-FRITES", name: "Frites", category: "Accompagnements", priceTtc: 3.50, cogs: 0.85, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "POMMES-DE-TERRE-FRITES", qty: 0.22 }, { sku: "EMBALLAGE-FRITES", qty: 1 }] },
    { id: "ACC-SALADE", name: "Salade", category: "Accompagnements", priceTtc: 3.80, cogs: 0.95, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "LAITUE-CROUSTILLANTE", qty: 0.12 }, { sku: "VINAIGRETTE-MAISON", qty: 0.03 }, { sku: "BOL-SALADE-CRAFT", qty: 1 }] },
    { id: "ACC-ONION-RINGS", name: "Onion Rings", category: "Accompagnements", priceTtc: 4.20, cogs: 1.05, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "ONION-RINGS-PANES", qty: 0.18 }, { sku: "EMBALLAGE-FRITES", qty: 1 }] },
    { id: "ACC-CHICKEN-BUCKET", name: "Chicken Bucket", category: "Accompagnements", priceTtc: 14.50, cogs: 4.10, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "FILET-POULET-CRISPY", qty: 3 }, { sku: "POMMES-DE-TERRE-FRITES", qty: 0.25 }, { sku: "BUCKET-CHICKEN-L", qty: 1 }] },
    { id: "ACC-CHEESE-STICK", name: "Cheese Stick", category: "Accompagnements", priceTtc: 4.80, cogs: 1.25, vatPlace: 0.12, vatTakeout: 0.06, bom: [{ sku: "MOZZARELLA-STICKS", qty: 5 }, { sku: "EMBALLAGE-FRITES", qty: 1 }] }
  ];

  var DEFAULT_STOCK_LOTS = {
    "PAIN-BRIOCHE": [{ lot: "LOT-PB-2611", qty: 180, unitCost: 0.55 }],
    "BOEUF-HACHE-150G": [{ lot: "LOT-BF-2611A", qty: 140, unitCost: 1.65 }],
    "FILET-POULET-CRISPY": [{ lot: "LOT-PK-2611A", qty: 160, unitCost: 1.10 }],
    "PAVE-POISSON-PANE": [{ lot: "LOT-FS-2611A", qty: 90, unitCost: 1.35 }],
    "CHEDDAR-MATURE": [{ lot: "LOT-CH-2611A", qty: 35.0, unitCost: 8.50 }],
    "CHEDDAR-BLANC": [{ lot: "LOT-CW-2611A", qty: 25.0, unitCost: 8.80 }],
    "RACLETTE-FERMIERE": [{ lot: "LOT-RC-2611A", qty: 25.0, unitCost: 9.60 }],
    "GOUDA-TRUFFE": [{ lot: "LOT-GT-2611A", qty: 20.0, unitCost: 10.40 }],
    "MOZZA-CHEDDAR-BLEND": [{ lot: "LOT-MC-2611A", qty: 30.0, unitCost: 8.20 }],
    "JALAPENO-PICKLES": [{ lot: "LOT-JP-2611A", qty: 15.0, unitCost: 5.40 }],
    "SAUCE-BBQ-SMOKEY": [{ lot: "LOT-SB-2611A", qty: 20.0, unitCost: 4.80 }],
    "SAUCE-TRUFFE-HERBES": [{ lot: "LOT-ST-2611A", qty: 15.0, unitCost: 6.90 }],
    "SAUCE-HONEY-MUSTARD": [{ lot: "LOT-SH-2611A", qty: 15.0, unitCost: 4.60 }],
    "SAUCE-BUFFALO-CAJUN": [{ lot: "LOT-SC-2611A", qty: 15.0, unitCost: 4.70 }],
    "SAUCE-SWEET-CHILI": [{ lot: "LOT-SS-2611A", qty: 15.0, unitCost: 4.60 }],
    "POT-SAUCE-OPERCULE": [{ lot: "LOT-PO-2611", qty: 400, unitCost: 0.06 }],
    "BASE-CHEESECAKE": [{ lot: "LOT-DC-2611", qty: 80, unitCost: 1.15 }],
    "CREAM-CHEESE-PATISSIER": [{ lot: "LOT-CC-2611A", qty: 20.0, unitCost: 7.50 }],
    "GRAINS-CAFE-ESPRESSO": [{ lot: "LOT-CF-2611A", qty: 10.0, unitCost: 14.00 }],
    "LAIT-ENTIER-UHT": [{ lot: "LOT-LT-2611A", qty: 40.0, unitCost: 1.15 }],
    "CONCENTRE-CITRON-CRAFT": [{ lot: "LOT-LC-2611A", qty: 18.0, unitCost: 5.20 }],
    "EAU-GAZEIFIEE-33CL": [{ lot: "LOT-EG-2611", qty: 240, unitCost: 0.45 }],
    "INFUSION-THE-NOIR": [{ lot: "LOT-IT-2611A", qty: 30.0, unitCost: 1.80 }],
    "SIROP-PECHE-CITRON": [{ lot: "LOT-SP-2611A", qty: 15.0, unitCost: 4.40 }],
    "BOUTEILLE-VIN-ROUGE": [{ lot: "LOT-VR-2611A", qty: 24.0, unitCost: 6.80 }],
    "BOUTEILLE-VIN-BLANC": [{ lot: "LOT-VB-2611A", qty: 24.0, unitCost: 6.80 }],
    "BOUTEILLE-VIN-ROSE": [{ lot: "LOT-VP-2611A", qty: 24.0, unitCost: 6.80 }],
    "VERRE-JETABLE-OU-SERVICE": [{ lot: "LOT-VJ-2611", qty: 250, unitCost: 0.12 }],
    "PAIN-MIE-GRILLE": [{ lot: "LOT-PM-2611", qty: 220, unitCost: 0.25 }],
    "BEURRE-AIL-PERSIL": [{ lot: "LOT-BA-2611A", qty: 12.0, unitCost: 7.20 }],
    "PAIN-BAGUETTE-CRUSTY": [{ lot: "LOT-BG-2611", qty: 150, unitCost: 0.50 }],
    "POMMES-DE-TERRE-FRITES": [{ lot: "LOT-PF-2611A", qty: 80.0, unitCost: 2.10 }],
    "SAUCISSE-GRILLEE-STREET": [{ lot: "LOT-SG-2611", qty: 120, unitCost: 0.75 }],
    "EMBALLAGE-FRITES": [{ lot: "LOT-EF-2611", qty: 450, unitCost: 0.14 }],
    "LAITUE-CROUSTILLANTE": [{ lot: "LOT-SL-2611A", qty: 25.0, unitCost: 3.40 }],
    "VINAIGRETTE-MAISON": [{ lot: "LOT-VM-2611A", qty: 12.0, unitCost: 4.50 }],
    "BOL-SALADE-CRAFT": [{ lot: "LOT-BS-2611", qty: 200, unitCost: 0.22 }],
    "ONION-RINGS-PANES": [{ lot: "LOT-OR-2611A", qty: 30.0, unitCost: 4.30 }],
    "BUCKET-CHICKEN-L": [{ lot: "LOT-BC-2611", qty: 120, unitCost: 0.45 }],
    "MOZZARELLA-STICKS": [{ lot: "LOT-MS-2611", qty: 250, unitCost: 0.22 }]
  };

  function safeParse(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSave(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function computeIntegrityHash(inputStr) {
    var str = String(inputStr || "");
    var h1 = 0x811c9dc5;
    var h2 = 0x01000193;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 ^= ch;
      h1 = Math.imul(h1, 0x01000193);
      h2 = (Math.imul(h2, 31) + ch + i) >>> 0;
    }
    return "LW-" + ((h1 >>> 0).toString(16).padStart(8, "0")) + "-" + (h2.toString(16).padStart(8, "0"));
  }

  function getTenantId() {
    if (typeof currentTenantId === "function") {
      try { return String(currentTenantId() || "CHEER-FLAGSHIP-01"); } catch (_) {}
    }
    return "CHEER-FLAGSHIP-01";
  }

  var stockLotsState = safeParse(STORAGE_KEY_STOCK, null);
  if (!stockLotsState || typeof stockLotsState !== "object") {
    stockLotsState = JSON.parse(JSON.stringify(DEFAULT_STOCK_LOTS));
    safeSave(STORAGE_KEY_STOCK, stockLotsState);
  }

  var ticketsHistory = safeParse(STORAGE_KEY_TX, []);
  if (!Array.isArray(ticketsHistory)) ticketsHistory = [];

  var auditChain = safeParse(STORAGE_KEY_AUDIT, []);
  if (!Array.isArray(auditChain)) auditChain = [];

  var activeCart = [];

  function appendAuditEntry(eventType, payloadObj) {
    var prevHash = auditChain.length > 0 ? auditChain[auditChain.length - 1].hash : "GENESIS-CHEER-POS";
    var isoTs = new Date().toISOString();
    var tenant = getTenantId();
    var bodyStr = JSON.stringify(payloadObj || {});
    var hash = computeIntegrityHash(prevHash + "|" + isoTs + "|" + tenant + "|" + eventType + "|" + bodyStr);
    var entry = {
      seq: auditChain.length + 1,
      ts: isoTs,
      tenantId: tenant,
      eventType: eventType,
      prevHash: prevHash,
      hash: hash,
      payload: payloadObj || {}
    };
    auditChain.push(entry);
    safeSave(STORAGE_KEY_AUDIT, auditChain);
    return entry;
  }

  function findCatalogItem(id) {
    for (var i = 0; i < CATALOG_28.length; i++) {
      if (CATALOG_28[i].id === id) return CATALOG_28[i];
    }
    return null;
  }

  function getVatRateForItem(item) {
    if (!item) return 0.12;
    return saleMode === "A_EMPORTER" ? Number(item.vatTakeout || 0.06) : Number(item.vatPlace || 0.12);
  }

  function computeCartTotals() {
    var rawTtc = 0;
    var rawCogs = 0;
    var vatWeightedAcc = 0;
    var totalQty = 0;

    for (var i = 0; i < activeCart.length; i++) {
      var line = activeCart[i];
      var qty = Math.max(0, Number(line.qty || 0));
      var unitTtc = Number(line.priceTtc || 0);
      var unitCogs = Number(line.cogs || 0);
      var rate = getVatRateForItem(line);
      var lineTtc = unitTtc * qty;

      rawTtc += lineTtc;
      rawCogs += unitCogs * qty;
      vatWeightedAcc += lineTtc * rate;
      totalQty += qty;
    }

    var discountFactor = Math.max(0, Math.min(0.9, Number(discountPct || 0) / 100));
    var netTtc = Number((rawTtc * (1 - discountFactor)).toFixed(2));
    var avgRate = rawTtc > 0 ? (vatWeightedAcc / rawTtc) : (saleMode === "A_EMPORTER" ? 0.06 : 0.12);
    var netHt = Number((netTtc / (1 + avgRate)).toFixed(2));
    var netVat = Number((netTtc - netHt).toFixed(2));
    var totalCogs = Number(rawCogs.toFixed(2));
    var grossMargin = Number((netHt - totalCogs).toFixed(2));

    return {
      totalQty: totalQty,
      rawTtc: Number(rawTtc.toFixed(2)),
      discountPct: discountPct,
      netTtc: netTtc,
      netHt: netHt,
      netVat: netVat,
      totalCogs: totalCogs,
      grossMargin: grossMargin
    };
  }

  function consumeStockFifo(sku, requiredQty) {
    var lots = stockLotsState[sku];
    if (!Array.isArray(lots)) lots = [];
    var remaining = Number(requiredQty || 0);
    var consumedLots = [];

    for (var i = 0; i < lots.length && remaining > 1e-9; i++) {
      var lotObj = lots[i];
      var avail = Number(lotObj.qty || 0);
      if (avail <= 0) continue;
      var take = Math.min(avail, remaining);
      lotObj.qty = Number((avail - take).toFixed(4));
      remaining = Number((remaining - take).toFixed(4));
      consumedLots.push({
        sku: sku,
        lot: lotObj.lot,
        qty: Number(take.toFixed(4)),
        unitCost: Number(lotObj.unitCost || 0)
      });
    }

    if (remaining > 1e-9) {
      consumedLots.push({
        sku: sku,
        lot: "LOT-BACKORDER-AUTO",
        qty: Number(remaining.toFixed(4)),
        unitCost: 0.50,
        backorder: true
      });
    }

    stockLotsState[sku] = lots;
    return consumedLots;
  }

  function validateCurrentTicket(isTestSale) {
    if (isProcessingTx) return;
    if (!Array.isArray(activeCart) || activeCart.length === 0) return;

    isProcessingTx = true;
    try {
      var totals = computeCartTotals();
      var ticketId = "TCK-" + Date.now().toString(36).toUpperCase();
      var createdAt = new Date().toISOString();
      var tenantId = getTenantId();
      var lotAllocations = [];

      for (var i = 0; i < activeCart.length; i++) {
        var cartItem = activeCart[i];
        var itemQty = Math.max(1, Number(cartItem.qty || 1));
        var bom = Array.isArray(cartItem.bom) ? cartItem.bom : [];
        for (var b = 0; b < bom.length; b++) {
          var bomLine = bom[b];
          var needQty = Number(bomLine.qty || 0) * itemQty;
          var usedLots = consumeStockFifo(bomLine.sku, needQty);
          for (var u = 0; u < usedLots.length; u++) {
            lotAllocations.push({
              itemId: cartItem.id,
              itemName: cartItem.name,
              sku: usedLots[u].sku,
              lot: usedLots[u].lot,
              qty: usedLots[u].qty,
              unitCost: usedLots[u].unitCost
            });
          }
        }
      }

      var qrPayloadObj = {
        tid: ticketId,
        tenant: tenantId,
        ts: createdAt,
        mode: saleMode,
        ttc: totals.netTtc,
        ht: totals.netHt,
        tva: totals.netVat,
        lots: lotAllocations.map(function (l) { return l.sku + ":" + l.lot + ":" + l.qty; })
      };
      var qrPayloadStr = JSON.stringify(qrPayloadObj);
      var ticketHash = computeIntegrityHash(ticketId + "|" + createdAt + "|" + totals.netTtc + "|" + qrPayloadStr);

      var ticketRecord = {
        id: ticketId,
        created_at: createdAt,
        tenantId: tenantId,
        sale_type: saleMode,
        discount_pct: discountPct,
        coupon_code: couponCode || "",
        is_test: Boolean(isTestSale),
        cancelled: false,
        items: activeCart.map(function (it) {
          return {
            id: it.id,
            name: it.name,
            qty: Number(it.qty || 1),
            priceTtc: Number(it.priceTtc || 0),
            cogs: Number(it.cogs || 0)
          };
        }),
        subtotal_ht: totals.netHt,
        tva_amount: totals.netVat,
        total_ttc: totals.netTtc,
        cogs_total: totals.totalCogs,
        gross_margin: totals.grossMargin,
        lot_allocations: lotAllocations,
        qr_payload: qrPayloadStr,
        integrity_hash: ticketHash
      };

      ticketsHistory.unshift(ticketRecord);
      safeSave(STORAGE_KEY_TX, ticketsHistory);
      safeSave(STORAGE_KEY_STOCK, stockLotsState);

      appendAuditEntry("TICKET_VALIDATED", {
        ticketId: ticketId,
        totalTtc: totals.netTtc,
        subtotalHt: totals.netHt,
        tvaAmount: totals.netVat,
        cogsTotal: totals.totalCogs,
        lotsCount: lotAllocations.length,
        hash: ticketHash
      });

      appendAuditEntry("STOCK_DECREMENTED", {
        ticketId: ticketId,
        allocations: lotAllocations
      });

      activeCart = [];
      discountPct = 0;
      couponCode = "";
      safeSave(STORAGE_KEY_STATE, { saleMode: saleMode, lastTicketId: ticketId });

      window.CHEER_POS_TICKETS = ticketsHistory.slice();
      window.CHEER_POS_STOCK_LOTS = stockLotsState;
      window.CHEER_POS_AUDIT_CHAIN = auditChain.slice();
      window.CHEER_LAST_TICKET = ticketRecord;

      renderAllViews();
    } finally {
      isProcessingTx = false;
    }
  }

  function addProductById(productId) {
    var prod = findCatalogItem(productId);
    if (!prod) return;

    var found = false;
    for (var i = 0; i < activeCart.length; i++) {
      if (activeCart[i].id === prod.id) {
        activeCart[i].qty = Number(activeCart[i].qty || 0) + 1;
        found = true;
        break;
      }
    }
    if (!found) {
      activeCart.push({
        id: prod.id,
        name: prod.name,
        category: prod.category,
        priceTtc: Number(prod.priceTtc),
        cogs: Number(prod.cogs),
        vatPlace: Number(prod.vatPlace),
        vatTakeout: Number(prod.vatTakeout),
        bom: prod.bom.slice(),
        qty: 1
      });
    }

    appendAuditEntry("CART_ITEM_ADDED", { itemId: prod.id, name: prod.name });
    renderAllViews();
  }

  function computePnlSummary() {
    var revenueHt = 0;
    var vatTotal = 0;
    var revenueTtc = 0;
    var cogsTotal = 0;
    var validTickets = 0;

    for (var i = 0; i < ticketsHistory.length; i++) {
      var tx = ticketsHistory[i];
      if (!tx || tx.cancelled || tx.is_test) continue;
      validTickets++;
      revenueHt += Number(tx.subtotal_ht || 0);
      vatTotal += Number(tx.tva_amount || 0);
      revenueTtc += Number(tx.total_ttc || 0);
      cogsTotal += Number(tx.cogs_total || 0);
    }

    var grossProfit = revenueHt - cogsTotal;
    return {
      validTickets: validTickets,
      revenueHt: Number(revenueHt.toFixed(2)),
      vatTotal: Number(vatTotal.toFixed(2)),
      revenueTtc: Number(revenueTtc.toFixed(2)),
      cogsTotal: Number(cogsTotal.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2))
    };
  }

  function buildQrSvgDataUrl(text) {
    var hash = computeIntegrityHash(text);
    var size = 21;
    var cells = [];
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var isFinder =
          (r < 7 && c < 7) ||
          (r < 7 && c >= size - 7) ||
          (r >= size - 7 && c < 7);
        var dark = false;
        if (isFinder) {
          var lr = r < 7 ? r : r - (size - 7);
          var lc = c < 7 ? c : c - (size - 7);
          dark = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
        } else {
          var idx = (r * size + c) % hash.length;
          dark = ((hash.charCodeAt(idx) + r * 3 + c * 7) % 2) === 0;
        }
        if (dark) {
          cells.push("<rect x=\"" + c + "\" y=\"" + r + "\" width=\"1\" height=\"1\" fill=\"#0b0e11\"/>");
        }
      }
    }
    var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + size + " " + size + "\" width=\"92\" height=\"92\" style=\"background:#ffffff;padding:4px;border-radius:6px;\">" + cells.join("") + "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function ensureWorkspaceRoot() {
    var root = document.getElementById("cheer-unified-pos-workspace");
    if (root) return root;

    var host = document.createElement("section");
    host.id = "cheer-unified-pos-workspace";
    host.style.cssText = "margin:12px 0;padding:12px;background:#12161c;border:1px solid #262d37;border-radius:8px;color:#eaecef;font-family:system-ui,-apple-system,sans-serif;";
    document.body.insertBefore(host, document.body.firstChild);
    return host;
  }

  function renderAllViews() {
    var root = ensureWorkspaceRoot();
    var totals = computeCartTotals();
    var pnl = computePnlSummary();
    var lastTicket = ticketsHistory.length > 0 ? ticketsHistory[0] : null;

    var filtered = [];
    for (var i = 0; i < CATALOG_28.length && filtered.length < MAX_RENDER_CARDS; i++) {
      var item = CATALOG_28[i];
      if (activeCategory !== "ALL" && item.category !== activeCategory) continue;
      if (searchTerm && (item.name + " " + item.category).toLowerCase().indexOf(searchTerm) === -1) continue;
      filtered.push(item);
    }

    var cats = [
      { k: "ALL", l: "Tout (" + CATALOG_28.length + ")" },
      { k: "Hamburgers", l: "Burgers" },
      { k: "Melts et Street", l: "Melt/Pepito/Salchi" },
      { k: "Accompagnements", l: "Accompagnements" },
      { k: "Sauces", l: "Sauces" },
      { k: "Boissons", l: "Limonade et Ice Tea" },
      { k: "Vins", l: "Vins" },
      { k: "Cheesecake et Cafe", l: "Cake et Cafe" }
    ];

    var html = "";
    html += "<div style=\"display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;\">";
    html += "  <div style=\"background:#f7a600;color:#0b0e11;padding:4px 10px;border-radius:6px;font-weight:700;font-size:12px;\">CAISSE & LOTS • " + getTenantId() + "</div>";
    html += "  <div style=\"display:flex;gap:6px;\">";
    html += "    <button type=\"button\" id=\"btn-mode-place\" style=\"padding:5px 10px;border-radius:6px;border:1px solid #262d37;font-size:11px;font-weight:700;cursor:pointer;background:" + (saleMode === "SUR_PLACE" ? "#f7a600" : "#181d24") + ";color:" + (saleMode === "SUR_PLACE" ? "#0b0e11" : "#eaecef") + ";\">Sur Place</button>";
    html += "    <button type=\"button\" id=\"btn-mode-takeout\" style=\"padding:5px 10px;border-radius:6px;border:1px solid #262d37;font-size:11px;font-weight:700;cursor:pointer;background:" + (saleMode === "A_EMPORTER" ? "#f7a600" : "#181d24") + ";color:" + (saleMode === "A_EMPORTER" ? "#0b0e11" : "#eaecef") + ";\">À Emporter</button>";
    html += "  </div>";
    html += "</div>";

    html += "<div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;\">";
    for (var c = 0; c < cats.length; c++) {
      var isAct = activeCategory === cats[c].k;
      html += "<button type=\"button\" data-cat=\"" + cats[c].k + "\" class=\"cheer-cat-btn\" style=\"padding:5px 9px;border-radius:6px;border:1px solid #262d37;font-size:11px;font-weight:700;cursor:pointer;background:" + (isAct ? "#f7a600" : "#181d24") + ";color:" + (isAct ? "#0b0e11" : "#eaecef") + ";\">" + cats[c].l + "</button>";
    }
    html += "</div>";

    html += "<input id=\"cheer-pos-search\" type=\"text\" value=\"" + searchTerm.replace(/"/g, "&quot;") + "\" placeholder=\"Rechercher un burger, fromage, vin, sauce, side...\" style=\"width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:10px;background:#181d24;border:1px solid #262d37;border-radius:6px;color:#eaecef;font-size:12px;\"/>";

    html += "<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-bottom:12px;\">";
    for (var k = 0; k < filtered.length; k++) {
      var p = filtered[k];
      html += "<div style=\"background:#181d24;border:1px solid #262d37;border-radius:8px;padding:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;\">";
      html += "  <div style=\"min-width:0;\">";
      html += "    <div style=\"font-weight:700;font-size:12px;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;\">" + p.name + "</div>";
      html += "    <div style=\"font-size:11px;color:#848e9c;margin-top:2px;\">" + p.priceTtc.toFixed(2) + " EUR TTC • " + p.category + " (" + p.bom.length + " produits)</div>";
      html += "  </div>";
      html += "  <button type=\"button\" data-add-id=\"" + p.id + "\" class=\"cheer-add-btn\" style=\"flex-shrink:0;padding:6px 10px;border-radius:6px;border:none;background:#f7a600;color:#0b0e11;font-weight:700;font-size:11px;cursor:pointer;\">+ Ajouter</button>";
      html += "</div>";
    }
    html += "</div>";

    html += "<div style=\"background:#181d24;border:1px solid #262d37;border-radius:8px;padding:10px;margin-bottom:12px;\">";
    html += "  <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;\">";
    html += "    <strong style=\"font-size:12px;color:#f7a600;\">Ticket en cours (" + totals.totalQty + " article(s))</strong>";
    html += "    <span style=\"font-size:12px;font-weight:700;\">" + totals.netTtc.toFixed(2) + " € TTC</span>";
    html += "  </div>";
    if (activeCart.length === 0) {
      html += "  <div style=\"font-size:11px;color:#848e9c;margin-bottom:8px;\">Panier vide — cliquez sur + Ajouter pour composer le ticket.</div>";
    } else {
      for (var m = 0; m < activeCart.length; m++) {
        var ci = activeCart[m];
        html += "  <div style=\"display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #262d37;\">";
        html += "    <span>" + ci.qty + "x " + ci.name + "</span>";
        html += "    <span>" + (ci.qty * ci.priceTtc).toFixed(2) + " €</span>";
        html += "  </div>";
      }
    }
    html += "  <div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center;justify-content:space-between;\">";
    html += "    <div style=\"font-size:11px;color:#848e9c;\">HT: " + totals.netHt.toFixed(2) + " € • TVA: " + totals.netVat.toFixed(2) + " € • COGS: " + totals.totalCogs.toFixed(2) + " €</div>";
    html += "    <div style=\"display:flex;gap:6px;\">";
    html += "      <button type=\"button\" id=\"cheer-clear-cart\" style=\"padding:6px 10px;border-radius:6px;border:1px solid #262d37;background:#12161c;color:#eaecef;font-size:11px;font-weight:600;cursor:pointer;\">Vider</button>";
    html += "      <button type=\"button\" id=\"cheer-validate-ticket\" style=\"padding:6px 12px;border-radius:6px;border:none;background:#f7a600;color:#0b0e11;font-size:11px;font-weight:700;cursor:pointer;\">Valider Ticket & QR</button>";
    html += "    </div>";
    html += "  </div>";
    html += "</div>";

    html += "<div style=\"background:#181d24;border:1px solid #262d37;border-radius:8px;padding:10px;margin-bottom:12px;\">";
    html += "  <div style=\"font-size:12px;font-weight:700;color:#f7a600;margin-bottom:6px;\">P&L Temps Réel (" + pnl.validTickets + " ticket(s) validé(s))</div>";
    html += "  <div style=\"display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;font-size:11px;\">";
    html += "    <div style=\"background:#12161c;padding:6px;border-radius:6px;\"><span style=\"color:#848e9c;\">CA TTC</span><br/><strong>" + pnl.revenueTtc.toFixed(2) + " €</strong></div>";
    html += "    <div style=\"background:#12161c;padding:6px;border-radius:6px;\"><span style=\"color:#848e9c;\">CA HT</span><br/><strong>" + pnl.revenueHt.toFixed(2) + " €</strong></div>";
    html += "    <div style=\"background:#12161c;padding:6px;border-radius:6px;\"><span style=\"color:#848e9c;\">COGS Lots</span><br/><strong>" + pnl.cogsTotal.toFixed(2) + " €</strong></div>";
    html += "    <div style=\"background:#12161c;padding:6px;border-radius:6px;\"><span style=\"color:#848e9c;\">Marge Brute</span><br/><strong>" + pnl.grossProfit.toFixed(2) + " €</strong></div>";
    html += "  </div>";
    html += "</div>";

    html += "<div style=\"background:#181d24;border:1px solid #262d37;border-radius:8px;padding:10px;\">";
    html += "  <div style=\"font-size:12px;font-weight:700;color:#f7a600;margin-bottom:6px;\">Ticket QR, Lots & Historique Persistant (" + ticketsHistory.length + ") • Audit (" + auditChain.length + ")</div>";
    if (lastTicket) {
      var lotSummary = (lastTicket.lot_allocations || []).map(function (la) {
        return la.sku + " [" + la.lot + ": -" + la.qty + "]";
      }).join(", ");
      html += "  <div style=\"display:flex;gap:10px;align-items:center;background:#12161c;padding:8px;border-radius:6px;margin-bottom:8px;\">";
      html += "    <img src=\"" + buildQrSvgDataUrl(lastTicket.qr_payload) + "\" alt=\"QR Ticket\" style=\"width:84px;height:84px;flex-shrink:0;\"/>";
      html += "    <div style=\"font-size:11px;min-width:0;\">";
      html += "      <div><strong>" + lastTicket.id + "</strong> • " + Number(lastTicket.total_ttc).toFixed(2) + " € TTC</div>";
      html += "      <div style=\"color:#848e9c;margin-top:2px;\">Hash: " + lastTicket.integrity_hash + "</div>";
      html += "      <div style=\"color:#eaecef;margin-top:3px;word-break:break-word;\">Lots: " + (lotSummary || "Aucun") + "</div>";
      html += "    </div>";
    }
    html += "  </div>";
    var histLimit = Math.min(ticketsHistory.length, 6);
    for (var h = 0; h < histLimit; h++) {
      var txRow = ticketsHistory[h];
      html += "  <div style=\"font-size:11px;padding:4px 0;border-top:1px solid #262d37;display:flex;justify-content:space-between;\">";
      html += "    <span>" + txRow.id + " (" + txRow.sale_type + ")</span>";
      html += "    <span>" + Number(txRow.total_ttc).toFixed(2) + " € • " + txRow.integrity_hash + "</span>";
      html += "  </div>";
    }
    html += "</div>";

    root.innerHTML = html;

    var catBtns = root.querySelectorAll(".cheer-cat-btn");
    for (var b1 = 0; b1 < catBtns.length; b1++) {
      catBtns[b1].addEventListener("click", function () {
        activeCategory = this.getAttribute("data-cat") || "ALL";
        renderAllViews();
      });
    }

    var searchEl = document.getElementById("cheer-pos-search");
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        searchTerm = String(this.value || "").trim().toLowerCase();
      });
      searchEl.addEventListener("change", function () {
        searchTerm = String(this.value || "").trim().toLowerCase();
        renderAllViews();
      });
    }

    var addBtns = root.querySelectorAll(".cheer-add-btn");
    for (var b2 = 0; b2 < addBtns.length; b2++) {
      addBtns[b2].addEventListener("click", function () {
        var pid = this.getAttribute("data-add-id");
        if (pid) addProductById(pid);
      });
    }

    var modePlace = document.getElementById("btn-mode-place");
    if (modePlace) {
      modePlace.addEventListener("click", function () {
        saleMode = "SUR_PLACE";
        renderAllViews();
      });
    }

    var modeTakeout = document.getElementById("btn-mode-takeout");
    if (modeTakeout) {
      modeTakeout.addEventListener("click", function () {
        saleMode = "A_EMPORTER";
        renderAllViews();
      });
    }

    var clearBtn = document.getElementById("cheer-clear-cart");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        activeCart = [];
        renderAllViews();
      });
    }

    var valBtn = document.getElementById("cheer-validate-ticket");
    if (valBtn) {
      valBtn.addEventListener("click", function () {
        validateCurrentTicket(false);
      });
    }
  }

  window.CheerPosEngine = {
    catalog: CATALOG_28,
    addItem: addProductById,
    validateTicket: validateCurrentTicket,
    getTickets: function () { return ticketsHistory.slice(); },
    getStockLots: function () { return stockLotsState; },
    getPnl: computePnlSummary,
    getAuditChain: function () { return auditChain.slice(); },
    refresh: renderAllViews
  };

  var ticks = 0;
  var bootTimer = setInterval(function () {
    ticks++;
    renderAllViews();
    if (ticks >= MAX_TICKS) {
      clearInterval(bootTimer);
    }
  }, 250);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAllViews);
  } else {
    renderAllViews();
  }
})();

/* CHEER_POS_CORE_BRIDGE_HOOKED
 * Alimente : pnl-stocks-bridge.js via cheer:sale_validated et cheer:z_report_closed
 */
(() => {
  "use strict";

  const MAX_EMITS_PER_SESSION = 500;
  let emitCount = 0;
  let isEmittingSale = false;
  let isEmittingZ = false;

  function emitSaleValidated(payload) {
    if (isEmittingSale || emitCount >= MAX_EMITS_PER_SESSION) return false;
    isEmittingSale = true;
    emitCount += 1;
    try {
      const detail = payload && typeof payload === "object" ? payload : {};
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("cheer:sale_validated", { detail }));
        return true;
      }
      if (window && window.CheerPosBridgeState && typeof window.CheerPosBridgeState.recordSale === "function") {
        return Boolean(window.CheerPosBridgeState.recordSale(detail));
      }
      return false;
    } finally {
      isEmittingSale = false;
    }
  }

  function emitZReportClosed(payload) {
    if (isEmittingZ || emitCount >= MAX_EMITS_PER_SESSION) return false;
    isEmittingZ = true;
    emitCount += 1;
    try {
      const detail = payload && typeof payload === "object" ? payload : { closedAt: new Date().toISOString() };
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("cheer:z_report_closed", { detail }));
        return true;
      }
      if (window && window.CheerPosBridgeState && typeof window.CheerPosBridgeState.closeZReport === "function") {
        window.CheerPosBridgeState.closeZReport();
        return true;
      }
      return false;
    } finally {
      isEmittingZ = false;
    }
  }

  if (typeof window !== "undefined") {
    const existing = window.CheerPosCoreEvents && typeof window.CheerPosCoreEvents === "object"
      ? window.CheerPosCoreEvents
      : {};
    window.CheerPosCoreEvents = Object.freeze({
      ...existing,
      emitSaleValidated,
      emitZReportClosed,
      getStats: () => ({ emitCount, maxEmits: MAX_EMITS_PER_SESSION })
    });
  }
})();
