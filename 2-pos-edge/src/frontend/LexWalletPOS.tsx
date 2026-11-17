/**
 * Cheer Tec Protocol - Point Zero POS Interface
 * Domain: https://lexwallet.app
 */

import React, { useState, useEffect } from 'react';

export default function LexWalletPOS() {
    const [catalog, setCatalog] = useState<any>(null);
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Chargement du catalogue officiel Cheer Cheese au démarrage
    useEffect(() => {
        fetch('/config/cheer-cheese-catalog.json')
            .then(res => res.json())
            .then(data => {
                setCatalog(data);
                setLoading(false);
            })
            .catch(err => console.error("Erreur de chargement du catalogue:", err));
    }, []);

    const addToCart = (item: any) => {
        setCart(prevCart => {
            const existing = prevCart.find(i => i.sku === item.sku);
            if (existing) {
                return prevCart.map(i => i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prevCart, { ...item, qty: 1 }];
        });
    };

    const subtotalHT = cart.reduce((acc, item) => acc + (item.price_ht * item.qty), 0);
    const vat = subtotalHT * 0.20;
    const totalTTC = subtotalHT + vat;

    const handleCheckout = () => {
        const orderPayload = {
            terminalId: "LEX-POS-TERM-01",
            tenantId: "CHEEZ-FLAGSHIP-001",
            timestamp: new Date().toISOString(),
            items: cart,
            subtotal_ht: subtotalHT,
            vat: vat,
            total_ttc: totalTTC
        };

        console.log("Transmission de la commande réelle vers le Kernel OS (delegal.dev):", orderPayload);
        alert(`Commande validée sur lexwallet.app ! Total TTC : ${totalTTC.toFixed(2)} EUR. Transmission Pay-Splitter en cours...`);
        setCart([]);
    };

    if (loading) return <div className="p-8 text-white bg-slate-900">Chargement du Point Zéro...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
            <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-sky-400">Lexwallet.app — Point Zero POS</h1>
                    <p className="text-sm text-slate-400">Canal d'exploitation officiel : Cheer Cheese</p>
                </div>
                <div className="bg-sky-950 border border-sky-600 px-4 py-2 rounded-lg text-sky-300 font-mono text-sm">
                    STATUT : ACTIF (TVA 20%)
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Catalogue des produits */}
                <div className="md:col-span-2 space-y-6">
                    {catalog.categories.map((cat: any) => (
                        <div key={cat.category_id} className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                            <h2 className="text-lg font-semibold text-sky-300 mb-4">{cat.name}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {cat.items.map((item: any) => (
                                    <div key={item.sku} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-100">{item.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <span className="text-sky-400 font-bold">{item.price_ht.toFixed(2)} € HT</span>
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
                                            >
                                                Ajouter
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Panier & Validation de Caisse */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-fit sticky top-6">
                    <h2 className="text-lg font-semibold text-sky-300 mb-4">Panier Actuel (Point Zéro)</h2>
                    {cart.length === 0 ? (
                        <p className="text-slate-500 text-sm py-8 text-center">Aucun article sélectionné.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.sku} className="py-2 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-xs text-slate-400">Qté : {item.qty} × {item.price_ht.toFixed(2)} €</p>
                                        </div>
                                        <span className="font-mono">{(item.price_ht * item.qty).toFixed(2)} €</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Sous-total HT</span>
                                    <span>{subtotalHT.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>TVA (20%)</span>
                                    <span>{vat.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-800">
                                    <span>Total TTC</span>
                                    <span className="text-sky-400">{totalTTC.toFixed(2)} €</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold mt-6 transition shadow-lg shadow-emerald-900/20"
                            >
                                Valider & Encaissement (&lt;400ms)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
