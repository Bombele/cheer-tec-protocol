/* Module alimente : 2-pos-edge/index.html (vues P&L / Z et Tickets & QR) */
(function () {
  "use strict";

  window.cheerRenderPnlAndTickets = function () {
    var ledger = { sales: [] };
    try {
      ledger = JSON.parse(localStorage.getItem("cheer_pos_ledger_v163") || '{"sales":[]}');
    } catch (e) {}

    var sales = ledger.sales || [];
    var totalTtc = 0;
    var totalCogs = 0;
    sales.forEach(function (s) {
      totalTtc += Number(s.total_ttc || 0);
      (s.items || []).forEach(function (i) {
        totalCogs += Number(i.qty || 0) * Number(i.cogs || 0);
      });
    });
    var totalHt = Number((totalTtc / 1.21).toFixed(2));
    var margin = Number((totalHt - totalCogs).toFixed(2));

    var pnlView = document.getElementById("view-pnl") || document.getElementById("view-z") || document.getElementById("view-costs");
    if (pnlView) {
      var pBox = document.getElementById("cc-v163-pnl-box");
      if (!pBox) {
        pBox = document.createElement("div");
        pBox.id = "cc-v163-pnl-box";
        pBox.style.cssText = "margin:12px 0;padding:12px;border-radius:12px;background:#0f172a;border:1px solid rgba(148,163,184,0.3);color:#f8fafc;font-size:12px;";
        pnlView.appendChild(pBox);
      }
      pBox.innerHTML = "<strong>P&L / Clôture Z</strong> • Ventes : " + sales.length +
        " • CA TTC : " + totalTtc.toFixed(2) + " € • CA HT : " + totalHt.toFixed(2) +
        " € • COGS : " + totalCogs.toFixed(2) + " € • Marge Brute : " + margin.toFixed(2) + " €";
    }

    var tView = document.getElementById("view-tickets") || document.getElementById("view-qr");
    if (tView) {
      var tBox = document.getElementById("cc-v163-tickets-box");
      if (!tBox) {
        tBox = document.createElement("div");
        tBox.id = "cc-v163-tickets-box";
        tBox.style.cssText = "margin:12px 0;padding:12px;border-radius:12px;background:#0f172a;border:1px solid rgba(148,163,184,0.3);color:#f8fafc;font-size:12px;";
        tView.appendChild(tBox);
      }
      tBox.innerHTML = "<div style='margin-bottom:8px;'><strong>Tickets & QR (" + sales.length + ")</strong></div>" +
        (sales.length
          ? sales.slice(0, 15).map(function (s) {
              return "<div style='display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(148,163,184,0.14);'>" +
                "<span><strong>" + s.id + "</strong> • " + Number(s.total_ttc || 0).toFixed(2) + " €</span>" +
                "<span style='color:#94a3b8;'>" + ((s.items || []).length) + " article(s)</span></div>";
            }).join("")
          : "<div style='color:#94a3b8;'>Aucun ticket émis.</div>");
    }
  };

  window.addEventListener("cheer:sale_validated", window.cheerRenderPnlAndTickets);
  document.addEventListener("DOMContentLoaded", window.cheerRenderPnlAndTickets);
})();
