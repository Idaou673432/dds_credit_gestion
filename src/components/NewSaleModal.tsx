import React, { useState, useRef, useEffect } from 'react';
import { Customer, PaymentMethod, Sale, SalePaymentType } from '../types';
import { useAuth } from '../context/AuthContext';
import { createSale, CreateSaleItemInput } from '../services/saleService';
import { formatFCFA } from '../lib/utils';
import {
  X,
  Plus,
  Trash2,
  Check,
  Printer,
  Search,
  UserPlus,
  AlertTriangle,
  Receipt,
  Banknote,
  Clock,
  ShoppingBag
} from 'lucide-react';

interface NewSaleModalProps {
  onClose: () => void;
  onSuccess: (sale: Sale, autoPrint?: boolean) => void;
}

interface ItemRow {
  id: string;
  description: string;
  quantity: number | '';
  unitPrice: number | '';
}

// 4 suggestions rapides et claires (les plus fréquentes au Mali)
const POPULAR_SHORTCUTS = [
  { name: 'Sac de riz 50kg', price: 22500 },
  { name: 'Bidon d\'huile 5L', price: 6500 },
  { name: 'Sucre 1kg', price: 650 },
  { name: 'Savon Diama', price: 300 },
];

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { customers, activeBusiness, currentUser } = useAuth();

  // Articles de la facture
  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', description: '', quantity: 1, unitPrice: '' },
  ]);

  // Mode de paiement : 'full' (Tout payé), 'partial' (Paiement partiel), 'credit' (À crédit)
  const [paymentType, setPaymentType] = useState<SalePaymentType>('full');
  const [paidAmountStr, setPaidAmountStr] = useState('');

  // Client (requis seulement pour crédit et paiement partiel)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Calcul automatique du total de chaque ligne et de la facture
  const computedItems = items.map((item) => {
    const q = typeof item.quantity === 'number' ? item.quantity : 0;
    const p = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
    return {
      ...item,
      total: Math.max(0, q * p),
    };
  });

  const totalInvoice = computedItems.reduce((sum, item) => sum + item.total, 0);

  let paidAmount = 0;
  let remainingAmount = 0;

  if (paymentType === 'full') {
    paidAmount = totalInvoice;
    remainingAmount = 0;
  } else if (paymentType === 'partial') {
    paidAmount = Math.max(0, Math.round(Number(paidAmountStr) || 0));
    remainingAmount = Math.max(0, totalInvoice - paidAmount);
  } else if (paymentType === 'credit') {
    paidAmount = 0;
    remainingAmount = totalInvoice;
  }

  // Filtrage des clients enregistrés
  const matchingCustomers = customers.filter((c) => {
    if (!customerName.trim()) return false;
    const q = customerName.toLowerCase();
    const cleanPhone = (c.phone || '').replace(/[\s\-\+\(\)]/g, '');
    const cleanQ = q.replace(/[\s\-\+\(\)]/g, '');
    return c.name.toLowerCase().includes(q) || cleanPhone.includes(cleanQ);
  });

  // Ajouter un article rapide en 1 clic
  const handleQuickAdd = (shortcut: { name: string; price: number }) => {
    setError('');
    // Si l'article existe déjà, on augmente simplement la quantité
    const existingIndex = items.findIndex(
      (it) => it.description.trim().toLowerCase() === shortcut.name.toLowerCase()
    );

    if (existingIndex !== -1) {
      const existing = items[existingIndex];
      const curQ = typeof existing.quantity === 'number' ? existing.quantity : 1;
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: curQ + 1, unitPrice: shortcut.price } : it
        )
      );
      return;
    }

    // Si la première ligne est vide, on la remplit
    if (
      items.length === 1 &&
      !items[0].description.trim() &&
      (!items[0].unitPrice || items[0].unitPrice === 0)
    ) {
      setItems([
        {
          id: items[0].id,
          description: shortcut.name,
          quantity: 1,
          unitPrice: shortcut.price,
        },
      ]);
      return;
    }

    // Sinon, on ajoute une nouvelle ligne
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: shortcut.name,
        quantity: 1,
        unitPrice: shortcut.price,
      },
    ]);
  };

  // Ajouter une ligne vierge
  const handleAddLine = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: '',
      },
    ]);
  };

  // Supprimer une ligne
  const handleRemoveLine = (id: string) => {
    if (items.length <= 1) {
      setItems([{ id: Date.now().toString(), description: '', quantity: 1, unitPrice: '' }]);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Mettre à jour un champ
  const handleUpdateLine = (id: string, field: keyof ItemRow, val: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
    setError('');
  };

  // Sélection du mode de paiement
  const handleSelectPayment = (type: SalePaymentType) => {
    setPaymentType(type);
    setError('');
    if (type === 'partial' && !paidAmountStr && totalInvoice > 0) {
      // Propose la moitié par défaut
      setPaidAmountStr(Math.round(totalInvoice / 2).toString());
    }
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent, autoPrint = false) => {
    e.preventDefault();
    if (!activeBusiness || !currentUser) return;

    // Validation des articles
    const validItems: CreateSaleItemInput[] = [];
    for (const item of items) {
      const desc = item.description.trim();
      const q = typeof item.quantity === 'number' ? item.quantity : 0;
      const p = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
      if (desc && q > 0) {
        validItems.push({
          description: desc,
          quantity: q,
          unitPrice: p,
        });
      }
    }

    if (validItems.length === 0) {
      setError('Ajoutez au moins un article avec son nom, sa quantité et son prix.');
      return;
    }

    if (totalInvoice <= 0) {
      setError('Le montant total de la facture doit être supérieur à 0 FCFA.');
      return;
    }

    // Gestion du client
    let targetCustomerId: string | undefined = selectedCustomerId || undefined;
    let targetCustomerName = customerName.trim() || 'Client Comptoir';
    let targetCustomerPhone = customerPhone.trim();

    // Pour crédit ou partiel : le client est obligatoire
    if (paymentType !== 'full') {
      if (!customerName.trim()) {
        setError('Le nom du client est obligatoire pour une vente à crédit ou avec acompte.');
        return;
      }
      if (!customerPhone.trim()) {
        setError('Le numéro de téléphone du client est obligatoire pour suivre la dette.');
        return;
      }

      if (paymentType === 'partial') {
        if (paidAmount <= 0) {
          setError('Veuillez saisir le montant versé pour le paiement partiel.');
          return;
        }
        if (paidAmount >= totalInvoice) {
          setError('Le montant versé couvre la totalité. Cliquez sur « Tout payé ».');
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await createSale({
        businessId: activeBusiness.id,
        customerId: targetCustomerId,
        customerName: targetCustomerName,
        customerPhone: targetCustomerPhone,
        items: validItems,
        paymentType,
        paymentMethod: 'cash',
        paidAmount: paymentType === 'full' ? totalInvoice : paidAmount,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Commerçant',
      });

      onSuccess(res.sale, autoPrint);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement de la facture');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-900 max-h-[92vh] overflow-y-auto">
        
        {/* EN-TÊTE ÉPURÉ */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Nouvelle Vente
              </h3>
              <p className="text-xs text-slate-500">
                Remplissez les articles et choisissez le mode de paiement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="mt-4 space-y-4">

          {/* 1. ARTICLES DE LA FACTURE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Articles vendus
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ajouter une ligne</span>
              </button>
            </div>

            {/* Raccourcis ultra-simples */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[11px] text-slate-400 font-medium">Ajout direct :</span>
              {POPULAR_SHORTCUTS.map((sc) => (
                <button
                  key={sc.name}
                  type="button"
                  onClick={() => handleQuickAdd(sc)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  + {sc.name} ({formatFCFA(sc.price)})
                </button>
              ))}
            </div>

            {/* Liste des lignes */}
            <div className="space-y-2">
              {items.map((item, index) => {
                const rowTotal =
                  (typeof item.quantity === 'number' ? item.quantity : 0) *
                  (typeof item.unitPrice === 'number' ? item.unitPrice : 0);

                return (
                  <div
                    key={item.id}
                    className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                  >
                    <span className="text-xs font-bold text-slate-400 w-5 text-center flex-shrink-0">
                      {index + 1}
                    </span>

                    {/* Désignation */}
                    <div className="flex-1 min-w-[130px]">
                      <input
                        ref={index === 0 ? firstInputRef : undefined}
                        type="text"
                        required
                        placeholder="Nom de l'article"
                        value={item.description}
                        onChange={(e) => handleUpdateLine(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    {/* Quantité avec boutons simples - et + */}
                    <div className="w-24 flex-shrink-0 flex items-center border border-slate-300 bg-white rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = typeof item.quantity === 'number' ? item.quantity : 1;
                          if (cur > 1) handleUpdateLine(item.id, 'quantity', cur - 1);
                        }}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateLine(
                            item.id,
                            'quantity',
                            e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-full text-center text-xs font-mono font-bold text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cur = typeof item.quantity === 'number' ? item.quantity : 1;
                          handleUpdateLine(item.id, 'quantity', cur + 1);
                        }}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Prix unitaire */}
                    <div className="w-28 flex-shrink-0 relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        required
                        placeholder="Prix Unit."
                        value={item.unitPrice}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLine();
                          }
                        }}
                        onChange={(e) =>
                          handleUpdateLine(
                            item.id,
                            'unitPrice',
                            e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                        F
                      </span>
                    </div>

                    {/* Total de ligne */}
                    <div className="w-20 text-right flex-shrink-0 font-mono font-bold text-xs sm:text-sm text-slate-900">
                      {formatFCFA(rowTotal)}
                    </div>

                    {/* Supprimer */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. GRAND TOTAL DE LA FACTURE */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total à régler :
              </span>
              <span className="text-[11px] text-slate-400">
                Calcul automatique en FCFA
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                {formatFCFA(totalInvoice)}
              </span>
            </div>
          </div>

          {/* 3. TROIS MODES DE PAIEMENT SIMPLES ET CLAIRS */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              2. Mode de paiement
            </span>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Option 1: Tout payé */}
              <button
                type="button"
                onClick={() => handleSelectPayment('full')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  paymentType === 'full'
                    ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-600/30 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-bold">Tout payé</span>
                <span className="text-[10px] opacity-80">Comptant direct</span>
              </button>

              {/* Option 2: Paiement partiel */}
              <button
                type="button"
                onClick={() => handleSelectPayment('partial')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  paymentType === 'partial'
                    ? 'bg-amber-600 border-amber-600 text-white ring-2 ring-amber-600/30 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-bold">Paiement partiel</span>
                <span className="text-[10px] opacity-80">Acompte + Reste</span>
              </button>

              {/* Option 3: À crédit */}
              <button
                type="button"
                onClick={() => handleSelectPayment('credit')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  paymentType === 'credit'
                    ? 'bg-rose-600 border-rose-600 text-white ring-2 ring-rose-600/30 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-bold">À crédit</span>
                <span className="text-[10px] opacity-80">100% en dette</span>
              </button>

            </div>
          </div>

          {/* DÉTAILS DU PAIEMENT PARTIEL (affiché seulement si sélectionné) */}
          {paymentType === 'partial' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950">
                  Montant versé maintenant :
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPaidAmountStr(Math.round(totalInvoice * 0.5).toString())}
                    className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-bold cursor-pointer"
                  >
                    50% (Moitié)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmountStr(Math.round(totalInvoice * 0.25).toString())}
                    className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 text-[11px] font-bold cursor-pointer"
                  >
                    25%
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  placeholder="Ex: 5000"
                  value={paidAmountStr}
                  onChange={(e) => setPaidAmountStr(e.target.value)}
                  className="w-full pl-3 pr-14 py-2 bg-white border border-amber-300 rounded-lg text-base font-mono font-bold text-slate-900 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  FCFA
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-amber-950 pt-1">
                <span>Reste à payer (Dette client) :</span>
                <span className="text-base font-mono text-rose-700">
                  {formatFCFA(remainingAmount)}
                </span>
              </div>
            </div>
          )}

          {/* DÉTAILS DE LA VENTE À CRÉDIT (affiché seulement si sélectionné) */}
          {paymentType === 'credit' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-bold text-rose-950">
              <span>Montant total en dette :</span>
              <span className="text-lg font-mono text-rose-700">
                {formatFCFA(totalInvoice)}
              </span>
            </div>
          )}

          {/* 4. CLIENT (DEMANDÉ UNIQUEMENT SI CRÉDIT OU PARTIEL, OU SI LE COMMERÇANT VEUT LE NOMMER) */}
          {paymentType !== 'full' ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                3. Informations du client endetté <span className="text-rose-500">*</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nom du client (ex: Ousmane Koné)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setSelectedCustomerId(null);
                      setShowCustomerList(true);
                    }}
                    onFocus={() => setShowCustomerList(true)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />

                  {/* Suggestions de clients existants */}
                  {showCustomerList && matchingCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-36 overflow-y-auto divide-y divide-slate-100">
                      {matchingCustomers.slice(0, 3).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                            setSelectedCustomerId(c.id);
                            setShowCustomerList(false);
                          }}
                          className="w-full p-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer"
                        >
                          <span className="font-bold text-slate-900">{c.name}</span>
                          <span className="text-slate-500 font-mono">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Téléphone (ex: 76 00 12 34)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* En mode Tout Payé : option discrète si le commerçant veut spécifier un client */
            <div className="pt-1">
              {customerName ? (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-700">Client : <strong>{customerName}</strong> ({customerPhone || 'sans tél'})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName('');
                      setCustomerPhone('');
                      setSelectedCustomerId(null);
                    }}
                    className="text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomerName(' ')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  + Ajouter un nom de client sur le reçu (optionnel)
                </button>
              )}
            </div>
          )}

          {/* 5. DEUX SEULS BOUTONS D'ACTION CLAIRS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting || totalInvoice <= 0}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || totalInvoice <= 0}
              onClick={(e) => handleSubmit(e, true)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
