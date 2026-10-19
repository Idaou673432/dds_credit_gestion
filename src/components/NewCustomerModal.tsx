import React, { useState } from 'react';
import { Customer } from '../types';
import { useAuth } from '../context/AuthContext';
import { createCustomer } from '../services/creditService';
import {
  X,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

interface NewCustomerModalProps {
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { activeBusiness, customers } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Vérifier doublon éventuel
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const existingSamePhone = phoneDigits.length >= 8 
    ? customers.find(c => c.phone.replace(/[^0-9]/g, '') === phoneDigits)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError('Indiquez le nom du client.');
      return;
    }
    if (!cleanPhone) {
      setError('Indiquez le numéro de téléphone.');
      return;
    }
    if (!activeBusiness) return;

    setIsSubmitting(true);
    setError('');

    try {
      const created = await createCustomer(
        activeBusiness.id,
        cleanName,
        cleanPhone,
        address.trim(),
        undefined,
        0
      );

      onSuccess(created);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur enregistrement');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 text-slate-900 max-h-[92vh] overflow-y-auto">
        
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Nouveau Client
          </h3>
          <button
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

        {existingSamePhone && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            Ce numéro appartient déjà à <strong>{existingSamePhone.name}</strong>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          
          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom complet <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Nom complet"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-sm text-slate-900 focus:outline-none"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numéro de téléphone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Numéro de téléphone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-sm font-mono text-slate-900 focus:outline-none"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse ou Quartier
            </label>
            <input
              type="text"
              placeholder="Adresse ou quartier"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-slate-900 rounded-xl text-sm text-slate-900 focus:outline-none"
            />
          </div>

          {/* Boutons */}
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
              disabled={isSubmitting || !name.trim() || !phone.trim()}
              className="flex-1 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Client'}
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
