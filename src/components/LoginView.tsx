import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  AlertCircle,
  Delete,
  ArrowRight
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { signInWithPin, signInWithGoogle, errorMessage } = useAuth();

  const [pinInput, setPinInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pinInput.length < 5) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setLocalError(null);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
              <img 
                src="/app-icon.png" 
                alt="DDS" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget.style as any).display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                DDS Crédit Confiance
              </h1>
              <p className="text-xs text-slate-500">
                Diaby Digital Solution · Bamako, Mali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton variant="minimal" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-16 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        
        {/* Left Column */}
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Vos crédits sous contrôle, votre commerce en confiance.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Suivi des ventes à crédit et encaissements de dettes pour commerçants au Mali. Fiches clients, calculs automatiques des soldes en FCFA, reçus d'encaissement et relances WhatsApp.
          </p>

          <div className="pt-2 text-xs text-slate-500 space-y-1.5 max-w-xl mx-auto lg:mx-0">
            <p>· Calcul automatique des soldes restants à chaque versement</p>
            <p>· Reçus de caisse au format ticket 58mm ou feuille A4</p>
            <p>· Rappels de paiement directs en Français et Bambara</p>
          </div>
        </div>

        {/* Right Column: PIN Pad Card */}
        <div className="w-full max-w-sm rounded-xl bg-white border border-slate-200 shadow-sm p-6 sm:p-7 flex-shrink-0">
          
          <div className="text-center mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Code PIN d'Accès
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Saisissez votre code PIN commerçant
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex justify-center items-center gap-3 my-4">
            {[0, 1, 2, 3, 4].map((idx) => {
              const isFilled = idx < pinInput.length;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    isFilled
                      ? 'bg-slate-900 ring-2 ring-slate-900/20 scale-105'
                      : 'bg-slate-100 border border-slate-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Hidden/Keyboard text input */}
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
              className="w-full text-center tracking-[0.5em] font-mono text-base py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800"
            />
          </form>

          {/* Error Message */}
          {(localError || errorMessage) && (
            <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 active:bg-slate-900 active:text-white text-slate-900 font-bold text-base flex items-center justify-center transition border border-slate-200 cursor-pointer select-none"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium text-xs flex items-center justify-center transition border border-slate-200 cursor-pointer select-none"
            >
              Effacer
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 active:bg-slate-900 active:text-white text-slate-900 font-bold text-base flex items-center justify-center transition border border-slate-200 cursor-pointer select-none"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-11 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition border border-slate-200 cursor-pointer select-none"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={isSubmitting || pinInput.length === 0}
            onClick={() => attemptLogin(pinInput)}
            className="w-full mt-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Validation...' : 'Valider'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Secondary Google Auth Option */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
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
              <span>Connexion avec Google</span>
            </button>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        DDS Crédit Confiance · Diaby Digital Solution · Bamako, Mali
      </footer>

    </div>
  );
};
