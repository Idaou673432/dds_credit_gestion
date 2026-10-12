import React, { useState, useEffect } from 'react';
import { Customer, Credit, Payment, PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, PAYMENT_METHOD_LABELS } from '../lib/utils';
import { recordPayment } from '../services/creditService';
import confetti from 'canvas-confetti';
import {
  X,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Wallet,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NewPaymentModalProps {
  preselectedCredit?: Credit | null;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  preselectedCredit,
  onClose,
  onSuccess,
}) => {
  const { customers, credits, activeBusiness, currentUser } = useAuth();

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    preselectedCredit?.customerId || ''
  );
  const [customerSearch, setCustomerSearch] = useState(preselectedCredit?.customerName || '');
  const [selectedCreditId, setSelectedCreditId] = useState(
    preselectedCredit?.id || ''
  );
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Active credits for selected customer
  const availableCredits = credits.filter(
    (c) =>
      (!selectedCustomerId || c.customerId === selectedCustomerId) &&
      c.remainingAmount > 0 &&
      c.status !== 'paid'
  );

  // If customer changed, reset credit if not valid
  useEffect(() => {
    if (selectedCreditId) {
      const match = credits.find((c) => c.id === selectedCreditId);
      if (match && selectedCustomerId && match.customerId !== selectedCustomerId) {
        setSelectedCreditId('');
      }
    } else if (availableCredits.length > 0) {
      setSelectedCreditId(availableCredits[0].id);
    }
  }, [selectedCustomerId]);

  const currentCredit = credits.find((c) => c.id === selectedCreditId);
  const currentRemaining = currentCredit?.remainingAmount || 0;

  const paymentAmount = Math.round(Number(amountStr) || 0);
  const newRemainingPreview = Math.max(0, currentRemaining - paymentAmount);
  const isOverpaying = paymentAmount > currentRemaining;

  const handlePayFull = () => {
    setAmountStr(String(currentRemaining));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCredit) {
      setError('Veuillez sélectionner un crédit à rembourser.');
      return;
    }
    if (paymentAmount <= 0) {
      setError('Le montant doit être un nombre strictement positif supérieur à 0 FCFA.');
      return;
    }
    if (paymentAmount > currentRemaining) {
      setError(
        `Le montant (${formatFCFA(paymentAmount)}) dépasse le solde restant dû (${formatFCFA(currentRemaining)}).`
      );
      return;
    }

    if (!activeBusiness || !currentUser) return;

    setIsSubmitting(true);
    setError('');

    try {
      const newPayment = await recordPayment({
        businessId: activeBusiness.id,
        customerId: currentCredit.customerId,
        customerName: currentCredit.customerName,
        creditId: currentCredit.id,
        amount: paymentAmount,
        paymentMethod,
        paymentDate,
        notes: notes.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Caissier',
      });

      // Celebrate full debt payoff!
      if (newRemainingPreview === 0) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore
        }
      }

      onSuccess(newPayment);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’encaissement');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto my-0 sm:my-6 pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Encaisser un Remboursement</h3>
              <p className="text-xs text-slate-400">Paiement partiel ou solde d'un crédit client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Saisie directe du Nom complet du client */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nom complet du client <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Tapez le nom complet du client (ex: Moussa Traoré)..."
                value={customerSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomerSearch(val);
                  const found = customers.find(
                    (c) => c.name.toLowerCase() === val.toLowerCase().trim()
                  );
                  if (found) {
                    setSelectedCustomerId(found.id);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-400 shadow-sm"
              />

              {/* Suggestions légères au fur et à mesure de la saisie */}
              {customerSearch.trim().length > 1 && !selectedCustomerId && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-850 border border-slate-700 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                  {customers
                    .filter(
                      (c) =>
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.phone.includes(customerSearch.trim())
                    )
                    .slice(0, 5)
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCustomerSearch(c.name);
                          setSelectedCustomerId(c.id);
                        }}
                        className="p-2.5 hover:bg-slate-750 transition cursor-pointer flex items-center justify-between text-xs text-slate-200"
                      >
                        <div>
                          <span className="font-bold text-white">{c.name}</span>
                          <span className="text-slate-400 text-[11px] ml-2">{c.phone}</span>
                        </div>
                        <span className={`text-[11px] font-bold ${c.currentDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {c.currentDebt > 0 ? formatFCFA(c.currentDebt) : 'Soldé'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {selectedCustomerId && (
              <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                <span>✓ Client identifié : {customerSearch}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId('');
                    setCustomerSearch('');
                  }}
                  className="text-slate-400 hover:text-white underline ml-2 text-[10px]"
                >
                  Changer
                </button>
              </p>
            )}
          </div>

          {/* Credit Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Crédit / Dette à rembourser <span className="text-rose-400">*</span>
            </label>
            {availableCredits.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-amber-300">
                Aucun crédit en cours trouvé avec un solde restant dû.
              </div>
            ) : (
              <select
                required
                value={selectedCreditId}
                onChange={(e) => setSelectedCreditId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Sélectionner le crédit...</option>
                {availableCredits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} — {c.reference} ({c.description}) — Reste : {formatFCFA(c.remainingAmount)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current Debt Indicator & Quick Pay Full Button */}
          {currentCredit && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Solde restant dû avant ce versement :</p>
                <p className="text-base font-black text-rose-400">{formatFCFA(currentRemaining)}</p>
              </div>

              <button
                type="button"
                onClick={handlePayFull}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition cursor-pointer"
              >
                Payer la totalité
              </button>
            </div>
          )}

          {/* Amount input & Live Balance preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Montant versé (FCFA) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={currentRemaining || undefined}
                step="1"
                required
                placeholder="Ex : 15000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-xs text-white focus:outline-none transition ${
                  isOverpaying
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-700 focus:border-cyan-500'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-bold">
                FCFA
              </span>
            </div>

            {isOverpaying && (
              <p className="text-[11px] text-rose-400 mt-1">
                Le montant ne peut pas dépasser le solde restant dû ({formatFCFA(currentRemaining)}).
              </p>
            )}
          </div>

          {/* Real-time Calculation Result */}
          {paymentAmount > 0 && !isOverpaying && currentCredit && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  Solde après confirmation :
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatFCFA(currentRemaining)} − {formatFCFA(paymentAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-black">
                  {newRemainingPreview === 0 ? '0 FCFA (SOLDÉ !)' : formatFCFA(newRemainingPreview)}
                </p>
                {newRemainingPreview === 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                    <Sparkles className="w-3 h-3" /> Dette complètement effacée
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Moyen de règlement <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="cash">Espèces</option>
                <option value="orange_money">Orange Money</option>
                <option value="moov_money">Moov Money</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="other">Autre moyen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date du versement <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Commentaire / Référence transaction (facultatif)
            </label>
            <input
              type="text"
              placeholder="Ex : Réf transaction Orange Money CI2410... ou remis par son fils"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || paymentAmount <= 0 || isOverpaying || !currentCredit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Enregistrement sécurisé...' : 'Valider & Générer le Reçu'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
