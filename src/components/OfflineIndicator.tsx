import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, AlertTriangle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-3 rounded-2xl bg-amber-500/95 text-slate-950 px-4 py-3 shadow-xl shadow-amber-500/20 backdrop-blur border border-amber-400 font-medium text-xs sm:text-sm">
      <div className="p-1.5 rounded-full bg-slate-950/20">
        <WifiOff className="w-4 h-4 text-slate-950" />
      </div>
      <div>
        <p className="font-bold">Mode Hors-ligne (Bamako)</p>
        <p className="text-xs text-slate-900/80">Données en cache local. Vos opérations seront synchronisées dès reconnexion.</p>
      </div>
    </div>
  );
};
