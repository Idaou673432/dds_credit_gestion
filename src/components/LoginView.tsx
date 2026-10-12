import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ShieldCheck,
  CreditCard,
  Receipt,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Delete,
  Lock,
  ArrowRight
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithPin, signInWithGoogle, errorMessage, syncStatus } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus physical input for desktop users
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle digit press from keypad or keyboard
  const handleDigitPress = (digit: string) => {
    if (pinInput.length < 5) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setLocalError(null);

      // Auto-submit when 5 digits are entered
      if (nextPin.length === 5) {
        attemptLogin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setLocalError(null);
  };

  const handleClear = () => {
    setPinInput('');
    setLocalError(null);
  };

  const attemptLogin = async (pinToVerify: string) => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      const res = await signInWithPin(pinToVerify);
      if (!res.success) {
        setLocalError(res.message || 'Code PIN incorrect');
        setPinInput('');
      }
    } catch {
      setLocalError('Erreur de validation du code PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length >= 4) {
      attemptLogin(pinInput);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      
      {/* Top Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-lg shadow-cyan-500/20 overflow-hidden">
              <img 
                src="/app-icon.png" 
                alt="DDS Crédit Confiance" 
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  (e.currentTarget.style as any).display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                DDS Crédit Confiance
              </h1>
              <p className="text-[11px] text-cyan-400 font-medium">
                Diaby Digital Solution • Bamako, Mali
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        
        {/* Left Column: Presentation & Value Props */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Gestion des créances pour commerçants maliens
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Vos crédits sous contrôle,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
              votre commerce en confiance.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Fini les cahiers de dettes perdus ou raturés. Suivez chaque crédit client en FCFA, encaissez les remboursements avec des reçus officiels, et relancez en un clic sur WhatsApp.
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
                <h4 className="text-xs font-bold text-white">Reçus officiels A4/A5</h4>
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
                <p className="text-[11px] text-slate-400 mt-0.5">Données synchronisées en temps réel (Bamako).</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tactile PIN Pad Card */}
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 flex-shrink-0">
          
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Code PIN d'Accès
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Entrez le code secret commerçant pour déverrouiller l'application.
            </p>
          </div>

          {/* Display PIN Dots */}
          <div className="flex justify-center items-center gap-3 my-5">
            {[0, 1, 2, 3, 4].map((idx) => {
              const isFilled = idx < pinInput.length;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-cyan-400 ring-4 ring-cyan-400/20 scale-110 shadow-lg shadow-cyan-400/50'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Hidden/Keyboard text input for desktop accessibility */}
          <form onSubmit={handleFormSubmit} className="mb-2">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={5}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                setPinInput(val);
                setLocalError(null);
                if (val.length === 5) {
                  attemptLogin(val);
                }
              }}
              placeholder="•••••"
              className="w-full text-center tracking-[0.5em] font-mono text-lg py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-cyan-400 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </form>

          {/* Error Message */}
          {(localError || errorMessage) && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          {/* Tactile Numeric Keypad (0-9) */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-cyan-500 active:text-slate-950 text-white font-bold text-lg flex items-center justify-center transition border border-slate-700/60 shadow-sm cursor-pointer select-none"
              >
                {digit}
              </button>
            ))}

            {/* Clear / C */}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-800 active:bg-slate-700 text-slate-400 font-bold text-sm flex items-center justify-center transition border border-slate-700/50 cursor-pointer select-none"
            >
              Effacer
            </button>

            {/* Digit 0 */}
            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-cyan-500 active:text-slate-950 text-white font-bold text-lg flex items-center justify-center transition border border-slate-700/60 shadow-sm cursor-pointer select-none"
            >
              0
            </button>

            {/* Backspace / Delete */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-800 active:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700/50 cursor-pointer select-none"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={isSubmitting || pinInput.length === 0}
            onClick={() => attemptLogin(pinInput)}
            className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Validation...' : 'Valider le code'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Google Auth Option */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Ou se connecter avec Google</span>
            </button>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 text-center space-y-0.5">
            <p>🇲🇱 Spécialement adapté aux commerces de Bamako</p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        DDS Crédit Confiance • Diaby Digital Solution (DDS) • Bamako, Mali
      </footer>

    </div>
  );
};
