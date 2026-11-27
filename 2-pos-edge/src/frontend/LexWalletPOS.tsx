/* Module alimente : vue caisse POS (#/POS/caisse) appuyee sur pos-engine.js et cheer-cheese-catalog.json */
import React, { useMemo, useState } from "react";
import { createPosEngine, DEFAULT_CATALOG } from "../offline-sync/pos-engine";

export interface CatalogItem {
  sku: string;
  name: string;
  desc?: string;
  price_ht: number;
  unit_cogs: number;
  vat_rate: number;
  lot_code?: string;
}

export interface LexWalletPOSProps {
  catalog?: CatalogItem[];
  tenantId?: string;
  adminEmail?: string;
  isActiveTab?: boolean;
}

export const LexWalletPOS: React.FC<LexWalletPOSProps> = ({
  catalog = DEFAULT_CATALOG,
  tenantId = "CHEER-FLAGSHIP-01",
  adminEmail = "cbltec@proton.me",
  isActiveTab = true,
}) => {
  const engine = useMemo(
    () => createPosEngine(catalog, { tenantId, adminEmail }),
    [catalog, tenantId, adminEmail]
  );

  const [selectedSku, setSelectedSku] = useState<string>(
    (catalog[0] && catalog[0].sku) || "BUR-BEF-CHED"
  );
  const [saleType, setSaleType] = useState<"sur_place" | "emporter">("sur_place");
  const [cart, setCart] = useState(() => engine.getCart());
  const [totals, setTotals] = useState(() => engine.getTotals());
  const [lastTicketId, setLastTicketId] = useState<string>("");

  if (!isActiveTab) {
    return null;
  }

  function refreshState() {
    setCart(engine.getCart());
    setTotals(engine.getTotals());
  }

  function handleSelectItem(sku: string) {
    setSelectedSku(sku);
  }

  function handleAdd(sku?: string) {
    const targetSku = sku || selectedSku;
    if (!targetSku) return;
    engine.addItem(targetSku, 1);
    refreshState();
  }

  function handleValidate() {
    const ticket = engine.validateTicket(saleType, false);
    if (ticket) {
      setLastTicketId(ticket.id);
    }
    refreshState();
  }

  return (
    <section data-view="caisse" data-route="#/POS/caisse" className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2>Caisse POS • {tenantId}</h2>
          <p>{adminEmail}</p>
        </div>
        <div>
          <button type="button" onClick={() => setSaleType("sur_place")}>
            Sur Place
          </button>
          <button type="button" onClick={() => setSaleType("emporter")}>
            À Emporter
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {catalog.map((item) => {
          const active = item.sku === selectedSku;
          return (
            <div
              key={item.sku}
              data-sku={item.sku}
              onClick={() => handleSelectItem(item.sku)}
              className={active ? "selected" : ""}
            >
              <div>
                <strong>{item.name}</strong>
                <span>{item.price_ht.toFixed(2)} HT</span>
              </div>
              <button
                type="button"
                data-sku={item.sku}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSku(item.sku);
                  handleAdd(item.sku);
                }}
              >
                Ajouter
              </button>
            </div>
          );
        })}
      </div>

      <aside id="cart-panel-anchor">
        <h3>Panier ({totals.itemCount})</h3>
        <ul>
          {cart.map((line) => (
            <li key={line.sku}>
              {line.name} x{line.qty}
            </li>
          ))}
        </ul>
        <div>Sous-total HT : {totals.subtotalHt.toFixed(2)}</div>
        <div>TVA : {totals.tvaAmount.toFixed(2)}</div>
        <div>Total TTC : {totals.totalTtc.toFixed(2)}</div>
        <button type="button" onClick={handleValidate}>
          Valider Ticket
        </button>
        {lastTicketId ? <div>Dernier ticket : {lastTicketId}</div> : null}
      </aside>
    </section>
  );
};

export default LexWalletPOS;
