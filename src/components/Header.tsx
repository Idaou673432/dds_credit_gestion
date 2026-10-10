import React, { useState } from 'react';
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
  CheckSquare
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenVerificationSuite: () => void;
  onOpenNewCredit: () => void;
  onOpenNewPayment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVerificationSuite,
  onOpenNewCredit,
  onOpenNewPayment,
}) => {
  const {
    currentUser,
    activeBusiness,
    userRole,
    setUserRole,
    syncStatus,
    signOut,
    signInWithGoogle
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);

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

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <span className="font-extrabold text-sm sm:text-base tracking-tighter bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                    DDS
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" title="Système Opérationnel" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  DDS Crédit Confiance
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  DDS Mali
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                « Vos crédits sous contrôle, votre commerce en confiance. »
              </p>
            </div>
          </div>

          {/* Active Business & Live Sync Indicator */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-800/50 px-3.5 py-1.5 rounded-2xl border border-slate-700/60">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <div className="text-left text-xs">
              <p className="font-semibold text-slate-200 truncate max-w-[170px]">
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
                  En direct (Bamako)
                </span>
              )}
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Synchronisation...
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
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Audit / Test Suite Button (Required for Cahier des charges verification) */}
            <button
              onClick={onOpenVerificationSuite}
              title="Centre de vérification des 10 règles financières obligatoires"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold transition cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tests 10/10</span>
              <span className="sm:hidden">Tests</span>
            </button>

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

                    {/* Role switcher to easily demonstrate all 3 security roles */}
                    <div className="p-2 border-b border-slate-800">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Changer de rôle (Simulation des accès) :
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {(['owner', 'manager', 'cashier'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              setUserRole(r);
                              setShowRoleMenu(false);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              userRole === r
                                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {r === 'owner' ? 'Proprio' : r === 'manager' ? 'Gestion' : 'Caissier'}
                          </button>
                        ))}
                      </div>
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
