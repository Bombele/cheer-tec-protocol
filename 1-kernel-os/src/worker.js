/**
 * Cheer Tec Protocol - delegal.dev Kernel OS & Ledger Engine
 * Gestion des transactions réelles, P&L dynamique, Rapports Z et Purge Admin Holding
 */

// Simulation d'une base de données mémoire persistante pour le PoC (ou liaison KV / D1 en production)
let TRANSACTION_LEDGER = [];

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://lexwallet.app",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const startTime = Date.now();

    try {
      // ROUTE 1 : PURGE / NETTOYAGE DES TESTS (Code Administrateur Holding)
      if (request.method === "POST" && url.pathname === "/admin/purge") {
        const payload = await request.json();
        const ADMIN_HOLDING_CODE = "CHEEZ-ADMIN-2026"; // Code PIN maître de la holding

        if (payload.admin_code !== ADMIN_HOLDING_CODE) {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid Holding Admin Code" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const previousCount = TRANSACTION_LEDGER.length;
        TRANSACTION_LEDGER = TRANSACTION_LEDGER.filter(tx => !tx.is_test);
        
        return new Response(JSON.stringify({
          status: "SUCCESS",
          message: "Purge administrative effectuée avec succès. Les tests ont été retirés du CA.",
          purged_entries: previousCount - TRANSACTION_LEDGER.length,
          remaining_entries: TRANSACTION_LEDGER.length
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // ROUTE 2 : ENREGISTREMENT D'UNE TRANSACTION POS
      if (request.method === "POST" && (url.pathname === "/" || url.pathname === "/checkout")) {
        const payload = await request.json();

        if (!payload.total_ttc || typeof payload.total_ttc !== 'number' || payload.total_ttc <= 0) {
          return new Response(JSON.stringify({ error: "Invalid transaction payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }

        const txEntry = {
          id: payload.id || `TX-${Date.now()}`,
          timestamp: payload.timestamp || new Date().toISOString(),
          date_key: new Date().toISOString().split('T')[0],
          month_key: new Date().toISOString().slice(0, 7),
          terminal_id: payload.terminalId || "LEX-POS-TERM-01",
          is_test: payload.is_test || false,
          subtotal_ht: payload.subtotal_ht,
          vat: payload.vat,
          total_ttc: payload.total_ttc,
          cogs_total: payload.cogs_total,
          gross_margin: Number((payload.subtotal_ht - payload.cogs_total).toFixed(2)),
          splits: {
            royalty_5_percent: Number((payload.total_ttc * 0.05).toFixed(2)),
            lease_10_percent: Number((payload.total_ttc * 0.10).toFixed(2)),
            operating_85_percent: Number((payload.total_ttc * 0.85).toFixed(2))
          }
        };

        TRANSACTION_LEDGER.push(txEntry);

        return new Response(JSON.stringify({
          status: "SUCCESS",
          kernel: "delegal.dev",
          tx_id: txEntry.id,
          latency_ms: Date.now() - startTime,
          financial_ledger: txEntry
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      // ROUTE 3 : CONSULTATION P&L ET RAPPORT Z FILTRÉ (Par Date / Mois)
      if (request.method === "GET" || (request.method === "POST" && url.pathname === "/z-report")) {
        let filterDate = url.searchParams.get("date");
        let filterMonth = url.searchParams.get("month");

        let activeTxs = TRANSACTION_LEDGER.filter(tx => !tx.is_test);

        if (filterDate) {
          activeTxs = activeTxs.filter(tx => tx.date_key === filterDate);
        } else if (filterMonth) {
          activeTxs = activeTxs.filter(tx => tx.month_key === filterMonth);
        }

        const totalTTC = activeTxs.reduce((acc, tx) => acc + tx.total_ttc, 0);
        const totalHT = activeTxs.reduce((acc, tx) => acc + tx.subtotal_ht, 0);
        const totalVAT = activeTxs.reduce((acc, tx) => acc + tx.vat, 0);
        const totalCOGS = activeTxs.reduce((acc, tx) => acc + tx.cogs_total, 0);
        const totalGrossMargin = activeTxs.reduce((acc, tx) => acc + tx.gross_margin, 0);

        const report = {
          status: "SUCCESS",
          kernel: "delegal.dev",
          filter_applied: filterDate ? `Date: ${filterDate}` : filterMonth ? `Month: ${filterMonth}` : "All Time / Real Ledger",
          fiscal_totals: {
            total_tickets: activeTxs.length,
            grand_total_ttc: Number(totalTTC.toFixed(2)),
            total_ht: Number(totalHT.toFixed(2)),
            total_vat: Number(totalVAT.toFixed(2)),
            total_cogs: Number(totalCOGS.toFixed(2)),
            gross_margin: Number(totalGrossMargin.toFixed(2))
          },
          splits_consolidation: {
            royalty_5_percent: Number((totalTTC * 0.05).toFixed(2)),
            lease_10_percent: Number((totalTTC * 0.10).toFixed(2)),
            operating_85_percent: Number((totalTTC * 0.85).toFixed(2))
          },
          transactions: activeTxs
        };

        return new Response(JSON.stringify(report), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Kernel Error", details: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};
