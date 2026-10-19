import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-2.5 rounded-lg bg-amber-50 text-amber-900 px-3.5 py-2.5 shadow-md border border-amber-200 text-xs">
      <WifiOff className="w-4 h-4 text-amber-700 flex-shrink-0" />
      <div>
        <p className="font-semibold">Mode hors-ligne</p>
        <p className="text-[11px] text-amber-800">Données enregistrées en local, synchronisation automatique dès retour du réseau.</p>
      </div>
    </div>
  );
};
