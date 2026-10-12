import React, { useState } from 'react';
import { Customer, Credit, Payment, Business } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA } from '../lib/utils';
import { createCustomer, updateCustomer, deleteCustomer } from '../services/creditService';
import { CustomerDetailModal } from './CustomerDetailModal';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Receipt
} from 'lucide-react';

interface CustomersListProps {
  onOpenNewCredit: (customer: Customer) => void;
  onOpenNewPayment: (credit?: Credit) => void;
  onOpenWhatsApp: (customerName: string, phone: string, amount: number) => void;
}

export const CustomersList: React.FC<CustomersListProps> = ({
  onOpenNewCredit,
  onOpenNewPayment,
  onOpenWhatsApp,
}) => {
  const { customers, credits, payments, activeBusiness, currentUser, userRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modal for new/edit customer
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = userRole === 'owner' || userRole === 'manager';

  // Simple search filter: show active customers matching search
  const filteredCustomers = customers.filter((cust) => {
    if (cust.status === 'archived') return false;
    if (!searchTerm.trim()) return true;
    return (
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm)
    );
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setCreditLimit('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || '');
    setNotes(customer.notes || '');
    setCreditLimit(customer.creditLimit || '');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Le nom du client est obligatoire.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Le numéro de téléphone est obligatoire.');
      return;
    }

    if (!activeBusiness) return;

    setIsSubmitting(true);
    setFormError('');
    try {
      const parsedLimit = creditLimit === '' ? 0 : Math.max(0, Number(creditLimit));
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          notes: notes.trim(),
          creditLimit: parsedLimit,
        });
      } else {
        await createCustomer(activeBusiness.id, name, phone, address, notes, parsedLimit);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete || !activeBusiness || !currentUser) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(
        customerToDelete.id,
        activeBusiness.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'utilisateur'
      );
      setCustomerToDelete(null);
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression du client.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Répertoire des Clients ({customers.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fiches clients, suivi personnalisé des dettes, relevés et rappels de paiement.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Client
          </button>
        )}
      </div>

      {/* Simple Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par nom ou numéro de téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition shadow-sm"
        />
      </div>

      {/* Customer Cards List */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Aucun client trouvé</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Commencez par enregistrer un premier client de votre boutique.'}
          </p>
          {canEdit && !searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition cursor-pointer"
            >
              Créer un premier client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const hasDebt = cust.currentDebt > 0;
            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition shadow-lg cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                        {cust.name[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition">
                          {cust.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-cyan-400" /> {cust.phone}
                        </p>
                      </div>
                    </div>

                    {/* Debt Badge */}
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${
                        hasDebt
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {hasDebt ? 'Dette en cours' : 'Soldé'}
                    </span>
                  </div>

                  {cust.address && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-3 truncate">
                      <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" /> {cust.address}
                    </p>
                  )}

                  {/* Financial Mini Strip */}
                  <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500">Total accordé</p>
                      <p className="font-semibold text-slate-300">{formatFCFA(cust.totalCredit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500">Solde restant</p>
                      <p className={`font-black ${hasDebt ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatFCFA(cust.currentDebt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer: Simple and clean */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                  {hasDebt ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const unpaid = credits.find((c) => c.customerId === cust.id && c.remainingAmount > 0);
                        if (unpaid) {
                          onOpenNewPayment(unpaid);
                        } else {
                          setSelectedCustomer(cust);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Encaisser</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-400/80">
                      À jour (0 FCFA)
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform">
                      <span>Voir fiche</span>
                      <span>→</span>
                    </span>

                    {canEdit && (
                      <button
                        type="button"
                        title="Supprimer ce client"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomerToDelete(cust);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && activeBusiness && (
        <CustomerDetailModal
          customer={selectedCustomer}
          business={activeBusiness}
          credits={credits}
          payments={payments}
          onClose={() => setSelectedCustomer(null)}
          onOpenNewCredit={(cust) => {
            setSelectedCustomer(null);
            onOpenNewCredit(cust);
          }}
          onOpenNewPayment={(credit) => {
            setSelectedCustomer(null);
            onOpenNewPayment(credit);
          }}
          onOpenWhatsApp={onOpenWhatsApp}
        />
      )}

      {/* Customer Create/Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                {editingCustomer ? 'Modifier le Client' : 'Nouveau Client'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom complet du client <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Oumar Traoré, Aminata Diallo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Numéro de téléphone <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex : +223 76 00 12 34 ou 76001234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adresse / Quartier (facultatif)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Bamako Coura, Grand Marché..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Plafond de crédit autorisé (FCFA) (facultatif)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ex : 200 000 FCFA (0 ou vide = sans plafond)"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alerte de sécurité si le cumul des dettes du client dépasse ce montant.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Enregistrement...' : editingCustomer ? 'Mettre à jour' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-white mb-2">
              Supprimer ce client ?
            </h3>

            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-white">{customerToDelete.name}</strong> ?
              Tous ses crédits et ses historiques de paiements seront également effacés.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
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
