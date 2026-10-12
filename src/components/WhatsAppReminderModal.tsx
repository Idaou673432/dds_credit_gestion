import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, formatDateBamako, generateWhatsAppUrl } from '../lib/utils';
import {
  X,
  MessageCircle,
  ExternalLink,
  Phone,
  Copy,
  Check,
  Languages,
  Sparkles
} from 'lucide-react';

interface WhatsAppReminderModalProps {
  customerName: string;
  phone: string;
  amount: number;
  dueDate?: string;
  onClose: () => void;
}

type LanguageOption = 'fr' | 'bm' | 'mixte';

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  customerName,
  phone,
  amount,
  dueDate,
  onClose,
}) => {
  const { activeBusiness } = useAuth();
  const bizName = activeBusiness?.name || 'notre boutique';
  const bizPhone = activeBusiness?.phone || '';
  const dateStr = dueDate ? ` (échéance convenue : ${formatDateBamako(dueDate)})` : '';
  const dateStrBm = dueDate ? ` (waati min banna : ${formatDateBamako(dueDate)})` : '';

  const getTemplate = (lang: LanguageOption) => {
    switch (lang) {
      case 'fr':
        return `Bonjour ${customerName},\n\nSauf erreur de notre part, votre solde de crédit chez ${bizName} s'élève actuellement à ${formatFCFA(amount)}${dateStr}.\n\nMerci de bien vouloir passer à la boutique pour régulariser votre situation ou d'effectuer le paiement par Orange Money / Moov Money au ${bizPhone}.\n\nCordialement,\n${bizName}`;
      case 'bm':
        return `I ni ce ${customerName},\n\nKa kɛɲɛ ni an ka lase ye, i ka juru tolen bè ${bizName} la : ${formatFCFA(amount)}${dateStrBm}.\n\nAw b'a lase an ma butiki la walima ka dɔ sara Orange Money / Moov Money fɛ barika la : ${bizPhone}.\n\nAn b'aw fo kosɛbɛ,\n${bizName}`;
      case 'mixte':
        return `I ni ce ${customerName},\n\nNous vous prions de bien vouloir passer à la boutique pour régulariser votre solde de crédit chez ${bizName} : ${formatFCFA(amount)}${dateStr}.\n\nPossibilité de régler au comptoir ou par Orange Money / Moov Money au ${bizPhone}.\n\nI ni ce kosɛbɛ,\n${bizName}`;
    }
  };

  const [activeLang, setActiveLang] = useState<LanguageOption>('fr');
  const [message, setMessage] = useState(() => getTemplate('fr'));
  const [copied, setCopied] = useState(false);

  const handleSelectLang = (lang: LanguageOption) => {
    setActiveLang(lang);
    setMessage(getTemplate(lang));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const url = generateWhatsAppUrl(phone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto my-0 sm:my-6 pb-safe">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Rappel WhatsApp Client</h3>
              <p className="text-xs text-slate-400">Modèles en Français, Bambara et Mixte</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Details */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-200">{customerName}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-cyan-400" /> {phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Dette à rappeler</p>
            <p className="text-sm font-black text-rose-400">{formatFCFA(amount)}</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>Choisir la langue du modèle :</span>
            </label>
            <span className="text-[10px] text-cyan-400 font-medium">Bambara / Français</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectLang('fr')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLang === 'fr'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🇫🇷 Français</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLang('bm')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLang === 'bm'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🇲🇱 Bambara</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLang('mixte')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLang === 'mixte'
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>🤝 Mixte</span>
            </button>
          </div>
        </div>

        {/* Text Area for custom message */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Texte du message (modifiable avant envoi) :
          </label>
          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié !' : 'Copier le texte'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
