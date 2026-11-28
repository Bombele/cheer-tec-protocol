/* Module alimente : 2-pos-edge/index.html, 2-pos-edge/modules/stocks-ingredients.js et 2-pos-edge/modules/pnl-tickets.js */
(function () {
  "use strict";

  var CATALOG = [
    { sku: "CC-BURG-01", cat: "Burgers", name: "Burger Boeuf Cheddar (BBQ Smokey)", ttc: 11.50, cogs: 3.40 },
    { sku: "CC-BURG-02", cat: "Burgers", name: "Burger Boeuf Raclette", ttc: 13.00, cogs: 3.90 },
    { sku: "CC-BURG-03", cat: "Burgers", name: "Burger Boeuf Gouda Truffe", ttc: 13.50, cogs: 4.10 },
    { sku: "CC-BURG-04", cat: "Burgers", name: "Burger Poulet Raclette et Truffe", ttc: 12.90, cogs: 3.80 },
    { sku: "CC-BURG-05", cat: "Burgers", name: "Burger Poulet Cheddar Blanc Jalapeno", ttc: 12.00, cogs: 3.50 },
    { sku: "CC-BURG-06", cat: "Burgers", name: "Burger Poulet Mozza Cheddar Cajun", ttc: 12.00, cogs: 3.50 },
    { sku: "CC-BURG-07", cat: "Burgers", name: "Burger Fish Cheese Blend Sweet Chili", ttc: 11.90, cogs: 3.45 },
    { sku: "CC-BURG-08", cat: "Burgers", name: "Burger Fish Cheddar et Tartare", ttc: 11.90, cogs: 3.45 },
    { sku: "CC-DES-01", cat: "Desserts", name: "Cheesecake", ttc: 5.50, cogs: 1.50 },
    { sku: "CC-DES-02", cat: "Desserts", name: "Cafe Gourmet Cheese Cream", ttc: 4.80, cogs: 1.25 },
    { sku: "CC-BOI-01", cat: "Boissons", name: "Cheer Lemonade Craft", ttc: 4.00, cogs: 0.90 },
    { sku: "CC-BOI-02", cat: "Boissons", name: "Cheer Ice Tea", ttc: 4.00, cogs: 0.90 },
    { sku: "CC-VIN-01", cat: "Vins", name: "Vin Rouge Selection", ttc: 6.00, cogs: 1.80 },
    { sku: "CC-VIN-02", cat: "Vins", name: "Vin Blanc Selection", ttc: 6.50, cogs: 1.95 },
    { sku: "CC-VIN-03", cat: "Vins", name: "Vin Rose Selection", ttc: 6.50, cogs: 1.95 },
    { sku: "CC-MELT-01", cat: "Melts", name: "Garlic Melt", ttc: 8.80, cogs: 2.50 },
    { sku: "CC-STR-01", cat: "Street Food", name: "Pepito", ttc: 9.50, cogs: 2.80 },
    { sku: "CC-STR-02", cat: "Street Food", name: "Salchipapa", ttc: 8.90, cogs: 2.60 },
    { sku: "CC-SAU-01", cat: "Sauces", name: "Sauce BBQ Smokey", ttc: 1.20, cogs: 0.25 },
    { sku: "CC-SAU-02", cat: "Sauces", name: "Sauce Truffe et Herbes", ttc: 1.80, cogs: 0.45 },
    { sku: "CC-SAU-03", cat: "Sauces", name: "Sauce Honey-Mustard", ttc: 1.20, cogs: 0.25 },
    { sku: "CC-SAU-04", cat: "Sauces", name: "Sauce Spicy Buffalo Cajun", ttc: 1.50, cogs: 0.35 },
    { sku: "CC-SAU-05", cat: "Sauces", name: "Sauce Sweet Chili et Ail", ttc: 1.20, cogs: 0.25 },
    { sku: "CC-SID-01", cat: "Accompagnements", name: "Frites", ttc: 3.50, cogs: 0.85 },
    { sku: "CC-SID-02", cat: "Accompagnements", name: "Salade", ttc: 3.90, cogs: 1.00 },
    { sku: "CC-SID-03", cat: "Accompagnements", name: "Onion Rings", ttc: 4.20, cogs: 1.10 },
    { sku: "CC-SID-04", cat: "Accompagnements", name: "Chicken Bucket", ttc: 14.50, cogs: 4.30 },
    { sku: "CC-SID-05", cat: "Accompagnements", name: "Cheese Stick", ttc: 4.80, cogs: 1.25 }
  ];

  if (!window.__CHEER_POS_STATE__) {
    window.__CHEER_POS_STATE__ = { items: [] };
  }

  function stateItems() {
    if (!Array.isArray(window.__CHEER_POS_STATE__.items)) {
      window.__CHEER_POS_STATE__.items = [];
    }
    return window.__CHEER_POS_STATE__.items;
  }

  function calcTotals() {
    var qty = 0;
    var ttc = 0;
    stateItems().forEach(function (it) {
      qty += Number(it.qty || 0);
      ttc += Number(it.qty || 0) * Number(it.ttc || 0);
    });
    return { qty: qty, ttc: Number(ttc.toFixed(2)) };
  }

  function drawQr(canvas, payload) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var size = 21;
    var cell = 8;
    canvas.width = size * cell;
    canvas.height = size * cell;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f172a";
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var finder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
        var on = finder
          ? ((r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) ? 1 : 0)
          : (((payload.charCodeAt((r * size + c) % payload.length) + r * 17 + c * 11) % 2) === 0 ? 1 : 0);
        if (on) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }

  function ensureLiveBox() {
    var host = document.getElementById("cheer-menu-v11-host");
    if (!host) return null;
    var oldBox = document.getElementById("cc-v162-live-box");
    if (oldBox) oldBox.remove();

    var box = document.getElementById("cc-v163-live-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "cc-v163-live-box";
      box.style.cssText = "margin:12px 0 18px 0;padding:12px;border-radius:12px;background:#0f172a;border:1px solid rgba(56,189,248,0.45);color:#f8fafc;";
      box.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<strong id="cc-v163-live-title">Commande : 0 art. • 0.00 € TTC</strong>' +
          '<button type="button" id="cc-v163-open-pay" style="padding:7px 11px;border-radius:8px;border:none;background:#16a34a;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">Valider & Payer</button>' +
        '</div>' +
        '<div id="cc-v163-live-lines"></div>';
      host.appendChild(box);

      document.getElementById("cc-v163-open-pay").addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openPayModal();
      });

      document.getElementById("cc-v163-live-lines").addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest("button[data-op]") : null;
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        var idx = Number(btn.getAttribute("data-idx"));
        var op = btn.getAttribute("data-op");
        var arr = stateItems();
        if (!arr[idx]) return;
        if (op === "inc") arr[idx].qty += 1;
        else if (arr[idx].qty > 1) arr[idx].qty -= 1;
        else arr.splice(idx, 1);
        renderOrderState();
      });
    }
    return box;
  }

  function ensurePayModal() {
    var oldM = document.getElementById("cc-v162-modal");
    if (oldM) oldM.remove();

    var m = document.getElementById("cc-v163-modal");
    if (m) return m;
    m = document.createElement("div");
    m.id = "cc-v163-modal";
    m.style.cssText = "position:fixed;inset:0;z-index:99999;display:none;background:rgba(2,6,23,0.88);overflow-y:auto;padding:16px;justify-content:center;align-items:flex-start;";
    m.innerHTML =
      '<div style="width:100%;max-width:540px;background:#0f172a;color:#f8fafc;border:1px solid rgba(148,163,184,0.35);border-radius:14px;padding:16px;margin-top:12px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,0.2);padding-bottom:8px;margin-bottom:10px;">' +
          '<strong>Paiement & Ticket QR • CHEER-FLAGSHIP-01</strong>' +
          '<button type="button" id="cc-v163-m-close" style="padding:6px 10px;border-radius:8px;border:none;background:#334155;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">Fermer</button>' +
        '</div>' +
        '<div id="cc-v163-m-lines"></div>' +
        '<div id="cc-v163-m-total" style="margin-top:10px;font-weight:700;font-size:15px;">Total à payer : 0.00 € TTC</div>' +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
          '<button type="button" id="cc-v163-m-confirm" style="flex:1;padding:9px 12px;border-radius:8px;border:none;background:#16a34a;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">Confirmer Paiement & Ticket QR</button>' +
        '</div>' +
        '<div id="cc-v163-m-qrbox" style="display:none;margin-top:12px;padding:12px;border-radius:10px;background:#fff;color:#0f172a;">' +
          '<div id="cc-v163-m-qrtxt" style="font-size:12px;line-height:1.45;margin-bottom:8px;"></div>' +
          '<canvas id="cc-v163-m-qrcanvas" style="display:block;margin:0 auto;"></canvas>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);

    document.getElementById("cc-v163-m-close").addEventListener("click", function (ev) {
      ev.preventDefault();
      m.style.display = "none";
      m.classList.remove("open");
    });

    document.getElementById("cc-v163-m-confirm").addEventListener("click", function (ev) {
      ev.preventDefault();
      var items = stateItems();
      if (!items.length) return;
      var tot = calcTotals();
      var txId = "TX-" + Date.now();
      var sale = {
        id: txId,
        tenantId: "CHEER-FLAGSHIP-01",
        admin: "cbltec@proton.me",
        timestamp: new Date().toISOString(),
        total_ttc: tot.ttc,
        items: items.map(function (i) { return Object.assign({}, i); })
      };

      window.__CHEER_POS_STATE__.items = [];
      renderOrderState();
      window.dispatchEvent(new CustomEvent("cheer:sale_validated", { detail: sale }));

      var qrBox = document.getElementById("cc-v163-m-qrbox");
      var qrTxt = document.getElementById("cc-v163-m-qrtxt");
      var qrCan = document.getElementById("cc-v163-m-qrcanvas");
      if (qrBox && qrTxt && qrCan) {
        qrTxt.innerHTML = "<strong>TICKET CLIENT VALIDÉ</strong><br>N° : " + txId + "<br>Total payé : " + tot.ttc.toFixed(2) + " € TTC";
        drawQr(qrCan, JSON.stringify({ tx: txId, total: tot.ttc.toFixed(2), pos: "CHEER-FLAGSHIP-01" }));
        qrBox.style.display = "block";
      }
    });

    return m;
  }

  function renderOrderState() {
    ensureLiveBox();
    var tot = calcTotals();
    var badge = "Articles : " + tot.qty + " • " + tot.ttc.toFixed(2) + " € TTC";
    document.querySelectorAll("button, a, div, span").forEach(function (el) {
      if (el.children.length === 0 && el.textContent && el.textContent.indexOf("Articles") === 0 && el.textContent.indexOf("TTC") !== -1) {
        el.textContent = badge;
      }
    });

    var titleEl = document.getElementById("cc-v163-live-title");
    var linesEl = document.getElementById("cc-v163-live-lines");
    var items = stateItems();
    if (titleEl) {
      titleEl.textContent = "Commande : " + tot.qty + " art. • " + tot.ttc.toFixed(2) + " € TTC";
    }
    if (linesEl) {
      linesEl.innerHTML = items.length
        ? items.map(function (it, idx) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(148,163,184,0.14);font-size:12px;">' +
              '<span><strong>' + it.qty + 'x</strong> ' + it.name + ' (' + (it.qty * it.ttc).toFixed(2) + ' €)</span>' +
              '<span style="display:flex;gap:4px;">' +
                '<button type="button" data-op="dec" data-idx="' + idx + '" style="padding:3px 8px;border-radius:6px;border:none;background:#334155;color:#fff;font-weight:700;cursor:pointer;">-</button>' +
                '<button type="button" data-op="inc" data-idx="' + idx + '" style="padding:3px 8px;border-radius:6px;border:none;background:#1e293b;color:#fff;font-weight:700;cursor:pointer;">+</button>' +
              '</span>' +
            '</div>';
          }).join("")
        : '<div style="color:#94a3b8;font-size:12px;">Aucun article ajouté. Cliquez sur + Ajouter.</div>';
    }

    var m = document.getElementById("cc-v163-modal");
    if (m && m.classList.contains("open")) {
      fillModalBody();
    }
  }

  function fillModalBody() {
    var items = stateItems();
    var tot = calcTotals();
    var mLines = document.getElementById("cc-v163-m-lines");
    var mTot = document.getElementById("cc-v163-m-total");
    if (mLines) {
      mLines.innerHTML = items.length
        ? items.map(function (it) {
            return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(148,163,184,0.14);font-size:12px;">' +
              '<span>' + it.qty + 'x ' + it.name + '</span><strong>' + (it.qty * it.ttc).toFixed(2) + ' €</strong></div>';
          }).join("")
        : '<div style="color:#94a3b8;font-size:12px;">Panier vide. Cliquez sur + Ajouter.</div>';
    }
    if (mTot) {
      mTot.textContent = "Total à payer : " + tot.ttc.toFixed(2) + " € TTC";
    }
  }

  function openPayModal() {
    var m = ensurePayModal();
    fillModalBody();
    m.style.display = "flex";
    m.classList.add("open");
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("button, a") : null;
    if (!btn) return;
    var label = (btn.textContent || "").trim();

    if (label === "+ Ajouter" || label === "Ajouter") {
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
      var card = btn.closest(".cc-v154-card") || btn.parentElement;
      var txt = card ? (card.textContent || "") : "";
      var match = txt.match(/CC-[A-Z]+-\d+/);
      if (match && match[0]) {
        var found = CATALOG.find(function (c) { return c.sku === match[0]; });
        if (found) {
          var arr = stateItems();
          var ex = arr.find(function (x) { return x.sku === found.sku; });
          if (ex) ex.qty = Number(ex.qty || 0) + 1;
          else arr.push({ sku: found.sku, name: found.name, ttc: Number(found.ttc), cogs: Number(found.cogs || 0), qty: 1 });
          renderOrderState();
        }
      }
      return;
    }

    if (label === "Panier / Valider" || (label.indexOf("Panier (") === 0 && label.indexOf("€)") !== -1)) {
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation();
      openPayModal();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function () {
    ensurePayModal();
    renderOrderState();
  });
  setTimeout(function () {
    ensurePayModal();
    renderOrderState();
  }, 150);
})();
