import React, { useState } from 'react';
import { Customer, Credit } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA } from '../lib/utils';
import { createCredit, createCustomer } from '../services/creditService';
import {
  X,
  CreditCard,
  Calendar,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface NewCreditModalProps {
  preselectedCustomer?: Customer | null;
  onClose: () => void;
  onSuccess: (credit: Credit) => void;
}

export const NewCreditModal: React.FC<NewCreditModalProps> = ({
  preselectedCustomer,
  onClose,
  onSuccess,
}) => {
  const { customers, activeBusiness, currentUser } = useAuth();

  // Saisie directe du nom et du téléphone
  const [customerName, setCustomerName] = useState(preselectedCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(preselectedCustomer?.phone || '');
  const [customerId, setCustomerId] = useState(preselectedCustomer?.id || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [initialPaymentStr, setInitialPaymentStr] = useState('');
  const [creditDate, setCreditDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const amount = Math.round(Number(amountStr) || 0);
  const initialPayment = Math.round(Number(initialPaymentStr) || 0);
  const remainingPreview = Math.max(0, amount - initialPayment);

  // Suggestions de clients existants au fur et à mesure de la frappe
  const matchingCustomers = customers.filter(
    (c) =>
      c.status === 'active' &&
      customerName.trim().length > 0 &&
      (c.name.toLowerCase().includes(customerName.toLowerCase()) ||
        c.phone.includes(customerName.trim()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = customerName.trim();
    const finalPhone = customerPhone.trim();

    if (!finalName) {
      setError('Veuillez saisir le nom complet du client.');
      return;
    }
    if (!finalPhone) {
      setError('Veuillez renseigner le numéro de téléphone du client (ex: 76 00 12 34).');
      return;
    }
    if (!description.trim()) {
      setError('Veuillez spécifier la marchandise ou la nature de la dette.');
      return;
    }
    if (amount <= 0) {
      setError('Le montant doit être un nombre strictement supérieur à 0 FCFA.');
      return;
    }
    if (initialPayment < 0) {
      setError('Le paiement initial ne peut pas être négatif.');
      return;
    }
    if (initialPayment > amount) {
      setError('Le paiement initial ne peut pas dépasser le montant total du crédit.');
      return;
    }

    if (!activeBusiness || !currentUser) return;

    setIsSubmitting(true);
    setError('');

    try {
      let resolvedCustomerId = customerId;

      // Si le client n'a pas été sélectionné via suggestion, vérifier si un client identique existe déjà
      if (!resolvedCustomerId) {
        const existing = customers.find(
          (c) =>
            c.name.toLowerCase() === finalName.toLowerCase() ||
            (finalPhone && c.phone.replace(/\s+/g, '') === finalPhone.replace(/\s+/g, ''))
        );

        if (existing) {
          resolvedCustomerId = existing.id;
        } else {
          // Création automatique du nouveau client
          const newCustomer = await createCustomer(
            activeBusiness.id,
            finalName,
            finalPhone
          );
          resolvedCustomerId = newCustomer.id;
        }
      }

      const res = await createCredit({
        businessId: activeBusiness.id,
        customerId: resolvedCustomerId,
        customerName: finalName,
        customerPhone: finalPhone,
        description: description.trim(),
        amount,
        initialPayment,
        creditDate,
        dueDate: dueDate || undefined,
        notes: notes.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Commerçant',
      });

      onSuccess(res.credit);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du crédit');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nouveau Crédit Client</h3>
              <p className="text-xs text-slate-400">Saisie directe du nom du client et de la dette</p>
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
          
          {/* Nom complet du client (À SAISIR DIRECTEMENT) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nom complet du client <span className="text-rose-400">* (À saisir)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Tapez le nom complet (ex: Oumar Traoré, Aminata Diallo)..."
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setCustomerId(''); // Réinitialise l'ID si le nom change
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-3.5 pr-9 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-medium placeholder-slate-400"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Suggestions en temps réel si correspondance trouvée */}
            {showSuggestions && matchingCustomers.length > 0 && (
              <div className="absolute left-0 right-0 z-30 mt-1 p-2 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl space-y-1 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Client(s) existant(s) trouvé(s)</span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Fermer
                  </button>
                </div>
                {matchingCustomers.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setCustomerName(c.name);
                      setCustomerPhone(c.phone);
                      setCustomerId(c.id);
                      setShowSuggestions(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-left transition cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{c.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({c.phone})</span>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Dette : {formatFCFA(c.currentDebt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Numéro de téléphone du client */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Numéro de téléphone du client <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="Ex : +223 76 00 12 34 ou 76001234"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-3.5 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Utilisé pour l'historique et les rappels WhatsApp de paiement.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description de la marchandise ou produit <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex : 2 sacs de riz 50kg + 1 bidon d'huile Dinor"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Montant Total FCFA & Paiement Initial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Montant total (FCFA) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="Ex : 50000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-bold">
                  FCFA
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Paiement initial / Acompte (facultatif)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={amount || undefined}
                  step="1"
                  placeholder="Ex : 10000 (ou 0)"
                  value={initialPaymentStr}
                  onChange={(e) => setInitialPaymentStr(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 font-bold">
                  FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Balance Calculation Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-400">Solde restant calculé :</p>
              <p className="text-[10px] text-slate-500">
                {amount > 0 ? `${formatFCFA(amount)} − ${formatFCFA(initialPayment)}` : '0 FCFA'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-rose-400">
                {formatFCFA(remainingPreview)}
              </p>
              <p className="text-[10px] text-slate-400">
                {remainingPreview === 0 && amount > 0
                  ? 'Crédit immédiatement soldé'
                  : 'Reste à recouvrer'}
              </p>
            </div>
          </div>

          {/* Dates: Date du crédit & Échéance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date de l'opération <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={creditDate}
                onChange={(e) => setCreditDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date d'échéance (facultative)
              </label>
              <input
                type="date"
                min={creditDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Commentaire facultatif */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Commentaire / Modalités (facultatif)
            </label>
            <textarea
              rows={2}
              placeholder="Ex : Promesse de paiement après la récolte ou fin du mois..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer actions */}
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
              disabled={isSubmitting || amount <= 0 || !customerName.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Validation...' : 'Valider le Crédit'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
