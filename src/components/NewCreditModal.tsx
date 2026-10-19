import React, { useState } from 'react';
import { Customer, Credit } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA } from '../lib/utils';
import { createCredit, createCustomer } from '../services/creditService';
import {
  X,
  AlertTriangle,
  Check,
  Search,
  UserPlus
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

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    preselectedCustomer || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [hasAdvance, setHasAdvance] = useState(false);
  const [advanceStr, setAdvanceStr] = useState('');
  const [dueDays, setDueDays] = useState<number | null>(7);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const amount = Math.round(Number(amountStr) || 0);
  const advance = hasAdvance ? Math.round(Number(advanceStr) || 0) : 0;
  const remaining = Math.max(0, amount - advance);

  const matchingCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanPhone = (c.phone || '').replace(/[\s\-\+\(\)]/g, '');
    const cleanQ = q.replace(/[\s\-\+\(\)]/g, '');
    return c.name.toLowerCase().includes(q) || cleanPhone.includes(cleanQ);
  });

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setSearchQuery('');
    setIsCreatingNew(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeBusiness || !currentUser) return;

    let targetCustomerId = selectedCustomer?.id;
    let targetCustomerName = selectedCustomer?.name || '';
    let targetCustomerPhone = selectedCustomer?.phone || '';

    if (isCreatingNew || !selectedCustomer) {
      const cleanName = (isCreatingNew ? newName : searchQuery).trim();
      const cleanPhone = newPhone.trim();

      if (!cleanName) {
        setError('Indiquez le nom du client.');
        return;
      }
      if (!cleanPhone) {
        setError('Indiquez le numéro de téléphone.');
        return;
      }

      setIsSubmitting(true);
      setError('');

      try {
        const created = await createCustomer(
          activeBusiness.id,
          cleanName,
          cleanPhone,
          '',
          'Créé lors du crédit'
        );
        targetCustomerId = created.id;
        targetCustomerName = created.name;
        targetCustomerPhone = created.phone;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur création client');
        setIsSubmitting(false);
        return;
      }
    }

    if (!description.trim()) {
      setError('Précisez l’article ou la marchandise.');
      return;
    }

    if (amount <= 0) {
      setError('Indiquez le montant.');
      return;
    }

    if (hasAdvance && advance > amount) {
      setError('L’avance ne peut pas dépasser le montant total.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let finalDueDate: string | undefined = undefined;
      if (dueDays !== null) {
        const d = new Date();
        d.setDate(d.getDate() + dueDays);
        finalDueDate = d.toISOString().substring(0, 10);
      }

      const res = await createCredit({
        businessId: activeBusiness.id,
        customerId: targetCustomerId!,
        customerName: targetCustomerName,
        customerPhone: targetCustomerPhone,
        amount,
        initialPayment: advance,
        description: description.trim(),
        creditDate: new Date().toISOString().substring(0, 10),
        dueDate: finalDueDate,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Commerçant',
      });

      onSuccess(res.credit);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur enregistrement');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 text-slate-900 max-h-[92vh] overflow-y-auto">
        
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Nouveau Crédit
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          
          {/* CLIENT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client <span className="text-rose-500">*</span>
            </label>

            {selectedCustomer ? (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-900">{selectedCustomer.name}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedCustomer.phone}
                    {selectedCustomer.currentDebt > 0 && (
                      <span className="text-amber-800 ml-1.5 font-semibold">
                        · Dette : {formatFCFA(selectedCustomer.currentDebt)}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer font-medium"
                >
                  Changer
                </button>
              </div>
            ) : isCreatingNew ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Nouveau client</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Client existant
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <input
                  type="tel"
                  required
                  placeholder="Numéro de téléphone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-24 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(true);
                      setNewName(searchQuery);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    Nouveau
                  </button>
                </div>

                {matchingCustomers.length > 0 && (
                  <div className="mt-1.5 max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-xs">
                    {matchingCustomers.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full p-2.5 text-left hover:bg-slate-50 transition cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{c.phone}</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {c.currentDebt > 0 ? formatFCFA(c.currentDebt) : '0 F'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ARTICLE / MARCHANDISE */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Article / Marchandise <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Article pris"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* MONTANT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Montant (FCFA) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="50"
                step="50"
                required
                placeholder="Montant"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setError('');
                }}
                className="w-full pl-3 pr-14 py-2 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-lg font-mono font-bold text-slate-900 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                FCFA
              </span>
            </div>
          </div>

          {/* ÉCHÉANCE & AVANCE */}
          <div className="pt-1 border-t border-slate-100 space-y-2">
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Échéance :</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '7 jours', val: 7 },
                  { label: '14 jours', val: 14 },
                  { label: '1 mois', val: 30 },
                  { label: 'Sans date', val: null },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.label}
                    onClick={() => setDueDays(opt.val)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-center ${
                      dueDays === opt.val
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setHasAdvance(!hasAdvance)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
              >
                {hasAdvance ? 'Supprimer l’avance' : '+ Ajouter une avance versée'}
              </button>

              {hasAdvance && (
                <input
                  type="number"
                  min="0"
                  max={amount || undefined}
                  placeholder="Avance en FCFA"
                  value={advanceStr}
                  onChange={(e) => setAdvanceStr(e.target.value)}
                  className="w-32 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                />
              )}
            </div>

            {hasAdvance && advance > 0 && amount > 0 && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                <span className="text-amber-800">Dette finale :</span>
                <span className="font-mono font-bold text-amber-950">
                  {formatFCFA(remaining)}
                </span>
              </div>
            )}
          </div>

          {/* BOUTONS */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="flex-1 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : amount > 0
                  ? `Valider (${formatFCFA(remaining)})`
                  : 'Valider le Crédit'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
