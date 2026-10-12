import React, { useState } from 'react';
import { Credit } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako } from '../lib/utils';
import { deleteCredit } from '../services/creditService';
import { NewCreditModal } from './NewCreditModal';
import {
  CreditCard,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Calendar,
  Trash2
} from 'lucide-react';

interface CreditsListProps {
  onOpenNewPayment: (credit: Credit) => void;
  onOpenWhatsApp: (customerName: string, phone: string, amount: number, dueDate?: string) => void;
  isNewCreditModalOpen: boolean;
  onCloseNewCreditModal: () => void;
  onOpenNewCreditModal: () => void;
}

export const CreditsList: React.FC<CreditsListProps> = ({
  onOpenNewPayment,
  onOpenWhatsApp,
  isNewCreditModalOpen,
  onCloseNewCreditModal,
  onOpenNewCreditModal,
}) => {
  const { credits, activeBusiness, currentUser, userRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [creditToDelete, setCreditToDelete] = useState<Credit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = userRole === 'owner' || userRole === 'manager';

  const handleConfirmDeleteCredit = async () => {
    if (!creditToDelete || !activeBusiness || !currentUser) return;
    setIsDeleting(true);
    try {
      await deleteCredit(
        creditToDelete.id,
        activeBusiness.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'utilisateur'
      );
      setCreditToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression du crédit.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCredits = credits.filter((credit) => {
    if (!searchTerm.trim()) return true;
    return (
      credit.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalFilteredRemaining = filteredCredits.reduce((s, c) => s + c.remainingAmount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Gestion des Crédits Accordés ({credits.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Suivi des ventes à crédit, dates d'échéances et soldes restants calculés automatiquement.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenNewCreditModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nouveau Crédit
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par client, référence (ex: CR-...) ou marchandise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition shadow-sm"
        />
      </div>

      {/* List of Credits */}
      {filteredCredits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Aucun crédit trouvé</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm
              ? 'Aucun crédit ne correspond à votre recherche.'
              : 'Aucun enregistrement dans cette catégorie.'}
          </p>
          {canCreate && !searchTerm && (
            <button
              onClick={onOpenNewCreditModal}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition cursor-pointer"
            >
              Accorder un nouveau crédit
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCredits.map((credit) => {
            const isPaid = credit.status === 'paid' || credit.remainingAmount === 0;
            const isOverdue = credit.status === 'overdue';

            return (
              <div
                key={credit.id}
                className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-800/40">
                      {credit.reference}
                    </span>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isOverdue
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isPaid ? 'Soldé' : isOverdue ? 'En retard' : 'En cours'}
                    </span>

                    <span className="text-xs font-bold text-white">
                      {credit.customerName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {credit.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Date : {formatDateBamako(credit.creditDate)}
                    </span>

                    {credit.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                        <Clock className="w-3 h-3" />
                        Échéance : {formatDateBamako(credit.dueDate)}
                      </span>
                    )}

                    {credit.initialPayment > 0 && (
                      <span className="text-slate-500">
                        (Acompte : {formatFCFA(credit.initialPayment)})
                      </span>
                    )}
                  </div>

                  {credit.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      Remarque : {credit.notes}
                    </p>
                  )}
                </div>

                {/* Right Financial Balances & Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400">
                      Montant : <span className="font-semibold text-slate-200">{formatFCFA(credit.amount)}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Remboursé : <span className="font-semibold text-emerald-400">{formatFCFA(credit.totalPaid)}</span>
                    </p>
                    <p className="text-sm font-black mt-0.5">
                      Reste :{' '}
                      <span className={isPaid ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatFCFA(credit.remainingAmount)}
                      </span>
                    </p>
                  </div>

                  {/* Action: Single clear direct primary button + Delete */}
                  <div className="flex items-center gap-2">
                    {!isPaid ? (
                      <button
                        onClick={() => onOpenNewPayment(credit)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Rembourser</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        Soldé ✓
                      </span>
                    )}

                    <button
                      type="button"
                      title="Supprimer ce crédit"
                      onClick={() => setCreditToDelete(credit)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* New Credit Modal */}
      {isNewCreditModalOpen && (
        <NewCreditModal
          onClose={onCloseNewCreditModal}
          onSuccess={() => onCloseNewCreditModal()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {creditToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-white mb-2">
              Supprimer ce crédit ?
            </h3>

            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le crédit <strong className="text-white">{creditToDelete.reference}</strong> ({creditToDelete.customerName} - {formatFCFA(creditToDelete.amount)}) ?
              Le solde restant dû et le cumul du client seront automatiquement recalculés.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCreditToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCredit}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
