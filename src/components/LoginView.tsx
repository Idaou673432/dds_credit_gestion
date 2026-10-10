import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ShieldCheck,
  CreditCard,
  Receipt,
  MessageCircle,
  FileCheck,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, errorMessage, syncStatus } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      
      {/* Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-sm text-cyan-400">
                DDS
              </div>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                DDS Crédit Confiance
              </h1>
              <p className="text-[11px] text-cyan-400 font-medium">
                Diaby Digital Solution • Mali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton variant="minimal" />
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Plateforme active (Bamako)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-16 flex flex-col lg:flex-row items-center justify-center gap-10">
        
        {/* Left Column: Presentation & Value Props */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Logiciel de gestion des créances pour commerçants
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Vos crédits sous contrôle,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
              votre commerce en confiance.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Fini les cahiers de dettes perdus ou raturés. Suivez chaque crédit client en FCFA, encaissez les remboursements partiels avec des reçus officiels, et relancez poliment par WhatsApp en un clic.
          </p>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left max-w-xl mx-auto lg:mx-0">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Calculs automatiques</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Solde restant garanti en FCFA à chaque versement.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Reçus officiels A5</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Téléchargeables en PDF et imprimables instantanément.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Rappels WhatsApp</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Message prérempli et personnalisable en un clic.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sécurité Cloud</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Données chiffrées et isolées par boutique.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Google Auth Card */}
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-center flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xl mx-auto mb-4">
            DDS
          </div>

          <h3 className="text-lg font-bold text-white">
            Espace Commerçant
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Connectez-vous pour accéder à vos clients et vos créances.
          </p>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Action: Google Login */}
          <div className="mt-6 space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl transition cursor-pointer active:scale-98"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p>🔒 Authentification sécurisée Firebase Auth</p>
            <p>🇲🇱 Conçu spécialement pour le commerce au Mali</p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        DDS Crédit Confiance • Diaby Digital Solution (DDS) • Bamako, Mali
      </footer>

    </div>
  );
};
