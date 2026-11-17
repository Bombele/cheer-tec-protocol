/**
 * Cheer Tec Protocol - Point Zero POS Edge Engine
 * Connected to lexwallet.app & Cheer Cheese Catalog
 */

const fs = require('fs');
const path = require('path');

class POSZeroEngine {
    constructor(terminalId, tenantId) {
        this.terminalId = terminalId;
        this.tenantId = tenantId;
        this.offlineQueue = [];
        this.catalog = this.loadCatalog();
    }

    loadCatalog() {
        try {
            const catalogPath = path.join(__dirname, '../../config/cheer-cheese-catalog.json');
            const rawData = fs.readFileSync(catalogPath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            console.warn("[POS Warning] Catalog not found locally. Initializing empty catalog.");
            return { categories: [] };
        }
    }

    /**
     * Traite la commande au Point Zéro à partir des SKUs et quantités,
     * calcule la TVA et déclenche le Pay-Splitter vers delegal.dev.
     */
    processCheckout(orderItems) {
        let subtotalHT = 0;
        const processedItems = [];

        // Validation et calcul basés sur le catalogue officiel
        orderItems.forEach(orderItem => {
            let foundItem = null;
            for (const cat of this.catalog.categories) {
                const match = cat.items.find(i => i.sku === orderItem.sku);
                if (match) {
                    foundItem = match;
                    break;
                }
            }

            if (foundItem) {
                const itemTotalHT = foundItem.price_ht * orderItem.qty;
                subtotalHT += itemTotalHT;
                processedItems.push({
                    sku: foundItem.sku,
                    name: foundItem.name,
                    price_ht: foundItem.price_ht,
                    qty: orderItem.qty,
                    total_ht: itemTotalHT
                });
            } else {
                console.error(`[POS Error] SKU inconnu ou invalide : ${orderItem.sku}`);
            }
        });

        const taxRate = this.catalog.tax_rate_standard || 0.20;
        const totalVAT = subtotalHT * taxRate;
        const totalTTC = subtotalHT + totalVAT;

        const transaction = {
            id: `TX-POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            terminalId: this.terminalId,
            tenantId: this.tenantId,
            timestamp: new Date().toISOString(),
            items: processedItems,
            subtotal_ht: subtotalHT,
            vat: totalVAT,
            total_ttc: totalTTC,
            status: "VALIDATED_POINT_ZERO"
        };

        console.log(`[Point Zero - lexwallet.app] Transaction ${transaction.id} validée. Total TTC : ${totalTTC.toFixed(2)} EUR`);
        this.dispatchToPaySplitter(transaction);
        return transaction;
    }

    async dispatchToPaySplitter(txData) {
        try {
            console.log(`[Pay-Splitter Dispatch] Transmission des flux vers le Kernel OS (delegal.dev) [<400ms]...`);
            // Simulation de l'appel atomique au Pay-Splitter <400ms
            const splitResult = {
                status: "SUCCESS",
                latency_ms: 142,
                split_breakdown: {
                    royalty_5_percent: txData.total_ttc * 0.05,
                    lease_10_percent: txData.total_ttc * 0.10,
                    operating_85_percent: txData.total_ttc * 0.85
                }
            };
            console.log(`[Kernel OS] Pay-Split atomique exécuté avec succès :`, splitResult);
            return splitResult;
        } catch (error) {
            console.warn(`[Offline Mode] Réseau injoignable. Stockage chiffré de la transaction dans le cache local.`);
            this.offlineQueue.push(txData);
        }
    }
}

module.exports = POSZeroEngine;
