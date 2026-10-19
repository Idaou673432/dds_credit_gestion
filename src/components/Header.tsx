import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ShieldCheck,
  Building2,
  RefreshCw,
  LogOut,
  User,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  CheckSquare,
  Search,
  X,
  CreditCard,
  Receipt,
  MessageCircle,
  Phone,
  MapPin,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { UserRole, Customer, Credit } from '../types';
import { formatFCFA } from '../lib/utils';

interface HeaderProps {
  onOpenVerificationSuite: () => void;
  onOpenNewCredit: (customer?: Customer) => void;
  onOpenNewPayment: (credit?: Credit) => void;
  onOpenNewCustomer?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenWhatsApp?: (name: string, phone: string, amount: number) => void;
  onNavigateToCustomers?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVerificationSuite,
  onOpenNewCredit,
  onOpenNewPayment,
  onOpenNewCustomer,
  onSelectCustomer,
  onOpenWhatsApp,
  onNavigateToCustomers,
}) => {
  const {
    currentUser,
    activeBusiness,
    userRole,
    setUserRole,
    syncStatus,
    signOut,
    signInWithGoogle,
    customers,
    credits
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K / Slash '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search results filtering
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const cleanQ = q.replace(/[\s\-\+\(\)]/g, '');

    return customers
      .filter((cust) => {
        const matchName = cust.name.toLowerCase().includes(q);
        const rawPhone = cust.phone || '';
        const cleanPhone = rawPhone.replace(/[\s\-\+\(\)]/g, '');
        const matchPhone = cleanPhone.includes(cleanQ) || rawPhone.toLowerCase().includes(q);
        const matchAddress = (cust.address || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchAddress;
      })
      .slice(0, 8); // Top 8 customers
  }, [customers, searchQuery]);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Propriétaire';
      case 'manager':
        return 'Gestionnaire';
      case 'cashier':
        return 'Caissier';
    }
  };

  const handleSelectCustomerItem = (cust: Customer) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    if (onSelectCustomer) {
      onSelectCustomer(cust);
    }
  };

  const handleNewCreditForCustomer = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSearchFocused(false);
    onOpenNewCredit(cust);
  };

  const handlePaymentForCustomer = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSearchFocused(false);
    // Find active credit with remaining debt if any
    const activeCredit = credits.find(
      (c) => c.customerId === cust.id && c.remainingAmount > 0
    );
    onOpenNewPayment(activeCredit);
  };

  const handleWhatsAppForCustomer = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSearchFocused(false);
    if (onOpenWhatsApp && cust.currentDebt > 0) {
      onOpenWhatsApp(cust.name, cust.phone, cust.currentDebt);
    }
  };

  const isDropdownOpen = isSearchFocused && searchQuery.trim().length > 0;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 lg:gap-6">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20 overflow-hidden">
                <img 
                  src="/app-icon.png" 
                  alt="DDS Crédit Confiance" 
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    (e.currentTarget.style as any).display = 'none';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" title="Système Opérationnel" />
            </div>

            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  DDS Crédit Confiance
                </h1>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  DDS Mali
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden lg:block">
                « Vos crédits sous contrôle, votre commerce en confiance. »
              </p>
            </div>
          </div>

          {/* GLOBAL SEARCH BAR */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md min-w-[130px] sm:min-w-[200px]">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-cyan-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Rechercher client (nom, 76...)"
                className="w-full pl-8.5 pr-10 sm:pr-16 py-2 bg-slate-950/70 hover:bg-slate-950 focus:bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-2xl text-xs sm:text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition shadow-inner"
              />

              <div className="absolute right-2.5 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700 pointer-events-none">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>

            {/* SEARCH RESULTS DROPDOWN */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Header of results */}
                <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Résultats ({filteredCustomers.length}) pour <strong className="text-cyan-400">« {searchQuery} »</strong>
                  </span>
                  <span className="text-[10px] text-slate-500">Échap pour fermer</span>
                </div>

                {/* List or Empty State */}
                <div className="overflow-y-auto divide-y divide-slate-800/60">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((cust) => {
                      const hasDebt = cust.currentDebt > 0;
                      return (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomerItem(cust)}
                          className="p-3 hover:bg-slate-800/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300 flex-shrink-0">
                              {cust.name.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                                {cust.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1 font-mono text-slate-300">
                                  <Phone className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                  {cust.phone}
                                </span>
                                {cust.address && (
                                  <span className="flex items-center gap-1 text-slate-400 truncate max-w-[140px]">
                                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                    {cust.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Debt Badge & Quick Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                                hasDebt
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {hasDebt ? formatFCFA(cust.currentDebt) : 'À jour (0 FCFA)'}
                            </span>

                            {/* Single Primary Action in Search Result */}
                            <div className="flex items-center gap-1.5">
                              {hasDebt ? (
                                <button
                                  type="button"
                                  title="Encaisser un versement"
                                  onClick={(e) => handlePaymentForCustomer(cust, e)}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[11px] font-bold transition flex items-center gap-1"
                                >
                                  <Receipt className="w-3 h-3" />
                                  <span>Encaisser</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="Consulter la fiche client"
                                  onClick={() => handleSelectCustomerItem(cust)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                                >
                                  Voir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-400">
                        Aucun client trouvé pour <span className="text-white font-semibold">« {searchQuery} »</span>
                      </p>
                      {onNavigateToCustomers && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSearchFocused(false);
                            onNavigateToCustomers();
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Aller à la liste des clients</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer shortcut */}
                {filteredCustomers.length > 0 && onNavigateToCustomers && (
                  <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        onNavigateToCustomers();
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Voir tous les clients ({customers.length})</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Active Business & Live Sync Indicator */}
          <div className="hidden xl:flex items-center gap-3 bg-slate-800/50 px-3.5 py-1.5 rounded-2xl border border-slate-700/60 flex-shrink-0">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <div className="text-left text-xs">
              <p className="font-semibold text-slate-200 truncate max-w-[140px]">
                {activeBusiness?.name || 'Boutique'}
              </p>
              <p className="text-[11px] text-slate-400">
                {activeBusiness?.city || 'Bamako'} • {activeBusiness?.currency || 'FCFA'}
              </p>
            </div>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            {/* Sync Status */}
            <div className="flex items-center gap-1.5 text-[11px]">
              {syncStatus === 'synced' && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Bamako
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Sync...
                </span>
              )}
              {syncStatus === 'offline' && (
                <span className="flex items-center gap-1 text-orange-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  Hors ligne
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Attention
                </span>
              )}
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Profile & Role Selector */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center font-bold text-xs text-slate-950">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'D'}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <p className="font-semibold text-slate-200 leading-tight">
                      {currentUser.displayName || 'Commerçant'}
                    </p>
                    <p className="text-[10px] text-cyan-400 font-medium">
                      {getRoleLabel(userRole)}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showRoleMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setShowRoleMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-medium text-slate-400">Connecté en tant que</p>
                      <p className="text-xs font-bold text-white truncate">{currentUser.email || 'Session active'}</p>
                      <p className="text-[11px] text-cyan-400 mt-0.5">Boutique : {activeBusiness?.name}</p>
                    </div>

                    {/* Role switcher */}
                    <div className="p-2 border-b border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Rôle actif :
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {(['owner', 'manager', 'cashier'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setUserRole(r);
                              setShowRoleMenu(false);
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              userRole === r
                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                            }`}
                          >
                            {r === 'owner' ? 'Propriétaire' : r === 'manager' ? 'Gérant' : 'Caissier'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-cyan-400/90 mt-2 px-1 leading-tight font-medium">
                        {userRole === 'owner' && '👑 Propriétaire : Accès total, paramètres boutique, code PIN, octroi de crédits et encaissements.'}
                        {userRole === 'manager' && '👔 Gérant : Gestion clients, octroi des crédits, encaissements et relances WhatsApp.'}
                        {userRole === 'cashier' && '🪙 Caissier : Mode caisse prioritaire (encaissements des versements et délivrance des reçus).'}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        setShowRoleMenu(false);
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <span>Connexion Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
