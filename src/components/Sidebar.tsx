import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  FileBarChart,
  Settings,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab = 'dashboard' | 'customers' | 'credits' | 'payments' | 'reports' | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewCredit: () => void;
  onOpenNewPayment: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewCredit,
  onOpenNewPayment,
}) => {
  const { customers, credits, userRole } = useAuth();

  const debtorCount = customers.filter((c) => c.currentDebt > 0).length;
  const overdueCount = credits.filter((c) => c.status === 'overdue' && c.remainingAmount > 0).length;

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'customers' as NavigationTab,
      label: 'Clients',
      icon: Users,
      badge: debtorCount > 0 ? `${debtorCount} débiteurs` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    {
      id: 'credits' as NavigationTab,
      label: 'Crédits',
      icon: CreditCard,
      badge: overdueCount > 0 ? `${overdueCount} retards` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'payments' as NavigationTab,
      label: 'Remboursements',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Rapports & Exports',
      icon: FileBarChart,
      badge: null,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Paramètres',
      icon: Settings,
      badge: null,
    },
  ];

  const canCreateCredit = userRole === 'owner' || userRole === 'manager';

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-6 flex-shrink-0 min-h-[calc(100vh-5rem)]">
        
        {/* Quick Action Buttons */}
        <div className="space-y-2">
          {canCreateCredit && (
            <button
              onClick={onOpenNewCredit}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-400 transition cursor-pointer active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              Nouveau Crédit
            </button>
          )}

          <button
            onClick={onOpenNewPayment}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-750 px-4 py-2.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 transition cursor-pointer active:scale-98"
          >
            <Receipt className="w-4 h-4" />
            Encaisser un Remboursement
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mali / DDS Brand Tag in Sidebar */}
        <div className="pt-4 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
            <p className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>🇲🇱</span> Conçu pour le Mali
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Diaby Digital Solution (DDS)
            </p>
            <p className="text-[10px] text-cyan-400 font-medium mt-0.5">
              Devise : FCFA • Fuseau : Bamako
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Optimized for all smartphones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 pt-1.5 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate max-w-[54px] mt-1 leading-tight text-[10px]">
                  {item.id === 'dashboard'
                    ? 'Accueil'
                    : item.id === 'customers'
                    ? 'Clients'
                    : item.id === 'credits'
                    ? 'Crédits'
                    : item.id === 'payments'
                    ? 'Paiements'
                    : item.id === 'reports'
                    ? 'Rapports'
                    : 'Param.'}
                </span>
                {item.badge && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
