/* Module alimente : 2-pos-edge/index.html et evenement cheer:sale_validated (total exact et suppression doublon) */
(function () {
  "use strict";

  function cleanupDuplicateBoxes() {
    ["cc-v162-live-box", "cc-v163-live-box", "cc-v162-modal", "cc-v163-modal"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  function parseAmountFromText(txt) {
    var m = String(txt || "").match(/(\d+(?:[.,]\d+)?)\s*€/);
    if (!m) return 0;
    return Number(m[1].replace(",", "."));
  }

  function syncExactTicketTotal() {
    var modal = Array.from(document.querySelectorAll("div")).find(function (d) {
      return d.textContent && d.textContent.indexOf("Paiement & Ticket QR") !== -1 && d.textContent.indexOf("Total à payer :") !== -1;
    });
    if (!modal) return;
    var totMatch = modal.textContent.match(/Total à payer\s*:\s*(\d+(?:[.,]\d+)?)\s*€\s*TTC/i);
    if (!totMatch) return;
    var exactVal = Number(totMatch[1].replace(",", ".")).toFixed(2);
    modal.querySelectorAll("div, p, span").forEach(function (node) {
      if (node.children.length === 0 && node.textContent && node.textContent.indexOf("Total payé :") !== -1) {
        node.textContent = "Total payé : " + exactVal + " € TTC";
      }
    });
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
    if (!btn) return;
    var txt = (btn.textContent || "").trim();
    if (txt.indexOf("Confirmer Paiement") !== -1 || txt.indexOf("Valider Vente") !== -1) {
      setTimeout(function () {
        syncExactTicketTotal();
        var amt = 0;
        document.querySelectorAll("button, a, div, span").forEach(function (el) {
          if (el.children.length === 0 && el.textContent && el.textContent.indexOf("Articles") === 0 && el.textContent.indexOf("TTC") !== -1) {
            amt = parseAmountFromText(el.textContent);
          }
        });
        var sale = {
          id: "TX-" + Date.now(),
          tenantId: "CHEER-FLAGSHIP-01",
          admin: "cbltec@proton.me",
          timestamp: new Date().toISOString(),
          total_ttc: amt,
          items: [{ sku: "CC-BURG-01", name: "Commande Caisse Cheer Cheese", ttc: amt, cogs: Number((amt * 0.3).toFixed(2)), qty: 1 }]
        };
        window.dispatchEvent(new CustomEvent("cheer:sale_validated", { detail: sale }));
      }, 60);
    }
  }, true);

  document.addEventListener("DOMContentLoaded", cleanupDuplicateBoxes);
  setTimeout(cleanupDuplicateBoxes, 120);
})();
