import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'minimal' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'minimal') {
      return (
        <button
          onClick={install}
          title="Installer l'application"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="sm:hidden">Installer</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition cursor-pointer"
        >
          <span>Installer iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-6 shadow-xl text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Installer sur iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                  <p>Dans Safari, appuyez sur l'icône <strong>Partager</strong> (carré avec flèche vers le haut).</p>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                  <p>Faites défiler vers le bas et appuyez sur <strong>Sur l'écran d'accueil</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                  <p>Touchez <strong>Ajouter</strong> en haut à droite. L'icône sera ajoutée à votre écran d'accueil.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
