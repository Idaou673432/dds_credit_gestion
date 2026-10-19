import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  FileBarChart,
  Settings,
  Plus,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab = 'dashboard' | 'customers' | 'credits' | 'payments' | 'reports' | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewCredit: () => void;
  onOpenNewPayment: () => void;
  onOpenNewCustomer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewCredit,
  onOpenNewPayment,
  onOpenNewCustomer,
}) => {
  const { customers, credits, userRole, activeBusiness } = useAuth();

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
      badge: debtorCount > 0 ? `${debtorCount}` : null,
    },
    {
      id: 'credits' as NavigationTab,
      label: 'Crédits',
      icon: CreditCard,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
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
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-200 p-4 space-y-4 flex-shrink-0 min-h-[calc(100vh-4rem)]">
        
        {/* Quick Action Buttons */}
        <div className="space-y-1.5">
          {canCreateCredit && (
            <button
              onClick={onOpenNewCredit}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Vendre à Crédit
            </button>
          )}

          <button
            onClick={onOpenNewPayment}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Encaisser
          </button>

          {canCreateCredit && onOpenNewCustomer && (
            <button
              onClick={onOpenNewCustomer}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 px-3.5 py-2 text-xs font-bold transition cursor-pointer bg-white"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-600" />
              + Nouveau Client
            </button>
          )}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quiet Footer */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <p className="font-medium text-slate-700 truncate">{activeBusiness?.name || 'Boutique'}</p>
          <p className="text-[10px] text-slate-400">DDS Crédit Confiance · Mali</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pt-1 pb-safe shadow-md">
        <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer relative ${
                  isActive
                    ? 'text-slate-900 font-bold bg-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span className="truncate max-w-[50px] leading-tight">
                  {item.id === 'dashboard'
                    ? 'Accueil'
                    : item.id === 'customers'
                    ? 'Clients'
                    : item.id === 'credits'
                    ? 'Crédits'
                    : item.id === 'payments'
                    ? 'Caisse'
                    : item.id === 'reports'
                    ? 'Rapports'
                    : 'Param.'}
                </span>
                {item.badge && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-amber-600" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
