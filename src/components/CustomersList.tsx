import React, { useState } from 'react';
import { Customer, Credit, Payment, Business } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatFCFA } from '../lib/utils';
import { createCustomer, updateCustomer } from '../services/creditService';
import { CustomerDetailModal } from './CustomerDetailModal';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  FileText,
  Edit2,
  Archive,
  RotateCcw,
  X
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
  const { customers, credits, payments, activeBusiness, userRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebt, setFilterDebt] = useState<'all' | 'debtors' | 'cleared' | 'archived'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modal for new/edit customer
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = userRole === 'owner' || userRole === 'manager';

  // Filter logic
  const filteredCustomers = customers.filter((cust) => {
    const matchSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm);

    if (!matchSearch) return false;

    if (filterDebt === 'debtors') {
      return cust.status === 'active' && cust.currentDebt > 0;
    }
    if (filterDebt === 'cleared') {
      return cust.status === 'active' && cust.currentDebt === 0;
    }
    if (filterDebt === 'archived') {
      return cust.status === 'archived';
    }
    return cust.status === 'active';
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

  const handleToggleArchive = async (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = customer.status === 'active' ? 'archived' : 'active';
    try {
      await updateCustomer(customer.id, { status: newStatus });
    } catch (err) {
      console.error(err);
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

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom ou numéro de téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'debtors', label: 'Débiteurs' },
            { id: 'cleared', label: 'Soldés' },
            { id: 'archived', label: 'Archivés' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterDebt(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filterDebt === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                  <span className="text-[11px] text-cyan-400 font-medium group-hover:underline">
                    Voir la fiche complète →
                  </span>

                  <div className="flex items-center gap-1">
                    {hasDebt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWhatsApp(cust.name, cust.phone, cust.currentDebt);
                        }}
                        title="Rappel WhatsApp"
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canEdit && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(cust, e)}
                          title="Modifier les coordonnées"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleToggleArchive(cust, e)}
                          title={cust.status === 'active' ? 'Archiver' : 'Désarchiver'}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        >
                          {cust.status === 'active' ? (
                            <Archive className="w-3.5 h-3.5" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
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

    </div>
  );
};
