import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDateBamako } from '../lib/utils';
import { UserRole } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    activeBusiness,
    updateBusiness,
    currentUser,
    userRole,
    setUserRole,
    auditLogs,
    pinCode,
    updatePinCode,
    customers,
    credits,
    payments
  } = useAuth();

  const [newPin, setNewPin] = useState(pinCode);
  const [showPinCode, setShowPinCode] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState('');

  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const [bizName, setBizName] = useState(activeBusiness?.name || '');
  const [bizPhone, setBizPhone] = useState(activeBusiness?.phone || '');
  const [bizAddress, setBizAddress] = useState(activeBusiness?.address || '');
  const [bizCity, setBizCity] = useState(activeBusiness?.city || 'Bamako');
  const [bizSlogan, setBizSlogan] = useState(
    activeBusiness?.slogan || 'Vos crédits sous contrôle, votre commerce en confiance.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isOwner = userRole === 'owner';

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setSaveError('Seul le Propriétaire de la boutique est habilité à modifier ces paramètres.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await updateBusiness({
        name: bizName.trim(),
        phone: bizPhone.trim(),
        address: bizAddress.trim(),
        city: bizCity.trim(),
        slogan: bizSlogan.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    if (!activeBusiness) return;
    const backupObj = {
      appName: 'DDS Crédit Confiance',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      business: activeBusiness,
      customers,
      credits,
      payments,
      stats: {
        totalCustomers: customers.length,
        totalCredits: credits.length,
        totalPayments: payments.length,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Sauvegarde_DDS_Confiance_${new Date().toISOString().substring(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreBackupFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeBusiness) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsRestoring(true);
        setRestoreMessage('Analyse du fichier de sauvegarde...');
        const jsonContent = JSON.parse(e.target?.result as string);

        if (!jsonContent.business || !jsonContent.customers) {
          throw new Error('Format de sauvegarde invalide.');
        }

        const bId = activeBusiness.id;
        const custsToRestore = jsonContent.customers || [];
        const credsToRestore = jsonContent.credits || [];
        const paysToRestore = jsonContent.payments || [];

        setRestoreMessage(`Restauration en cours (${custsToRestore.length} clients, ${credsToRestore.length} crédits)...`);

        for (const c of custsToRestore) {
          const cRef = doc(db, 'businesses', bId, 'customers', c.id);
          await setDoc(cRef, { ...c, businessId: bId }, { merge: true });
        }

        for (const cr of credsToRestore) {
          const crRef = doc(db, 'businesses', bId, 'credits', cr.id);
          await setDoc(crRef, { ...cr, businessId: bId }, { merge: true });
        }

        for (const p of paysToRestore) {
          const pRef = doc(db, 'businesses', bId, 'payments', p.id);
          await setDoc(pRef, { ...p, businessId: bId }, { merge: true });
        }

        setRestoreSuccess(true);
        setRestoreMessage('Restauration terminée avec succès.');
        setTimeout(() => {
          setRestoreMessage(null);
          setRestoreSuccess(false);
        }, 5000);
      } catch (err: unknown) {
        setRestoreSuccess(false);
        setRestoreMessage(err instanceof Error ? err.message : 'Erreur lors de la restauration');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Paramètres & Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identité de la boutique, code PIN, gestion des rôles et sauvegardes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Business Info Form */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Coordonnées de la Boutique</h3>
            {!isOwner && (
              <span className="text-[11px] text-slate-500">Lecture seule (Propriétaire requis)</span>
            )}
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Coordonnées mises à jour avec succès.</span>
            </div>
          )}

          {saveError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveBusiness} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom de la Boutique / Commerce
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone boutique (Orange/Moov)
                </label>
                <input
                  type="text"
                  disabled={!isOwner}
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ville / Commune
                </label>
                <input
                  type="text"
                  disabled={!isOwner}
                  value={bizCity}
                  onChange={(e) => setBizCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse précise / Marché / Quartier
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Mention imprimée sur les reçus
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={bizSlogan}
                onChange={(e) => setBizSlogan(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {isOwner && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les coordonnées'}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Security PIN & Roles */}
        <div className="space-y-6">
          
          {/* Rôles et Profils */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Rôle Actif de l'Utilisateur</h3>
              <p className="text-xs text-slate-500">Contrôle des autorisations et actions disponibles</p>
            </div>

            <div className="space-y-2">
              {[
                {
                  role: 'owner' as UserRole,
                  title: 'Propriétaire',
                  desc: 'Contrôle complet : configuration boutique, octroi de crédits, encaissements, exports et code PIN.',
                },
                {
                  role: 'manager' as UserRole,
                  title: 'Gérant',
                  desc: 'Gestion des clients, octroi des crédits, encaissements et relances WhatsApp autorisés.',
                },
                {
                  role: 'cashier' as UserRole,
                  title: 'Caissier',
                  desc: 'Mode caisse prioritaire : enregistrement des encaissements et délivrance des reçus de caisse.',
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className={`p-3 rounded-lg border transition cursor-pointer ${
                    userRole === item.role
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setUserRole(item.role)}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs">{item.title}</span>
                    {userRole === item.role && (
                      <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded font-medium">Actif</span>
                    )}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${userRole === item.role ? 'text-slate-300' : 'text-slate-500'}`}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Code PIN de Sécurité */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Code PIN Commerçant</h3>
              <p className="text-xs text-slate-500">Déverrouillage rapide au comptoir</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Code PIN actuel :</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-white text-slate-900 font-mono font-bold text-sm border border-slate-200 tracking-widest">
                    {showPinCode ? pinCode : '•••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPinCode(!showPinCode)}
                    className="p-1.5 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pinSuccess && (
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  Nouveau code PIN enregistré !
                </div>
              )}

              {pinError && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {pinError}
                </div>
              )}

              {isOwner && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newPin.trim().length >= 4) {
                      updatePinCode(newPin.trim());
                      setPinSuccess(true);
                      setPinError('');
                      setTimeout(() => setPinSuccess(false), 3000);
                    } else {
                      setPinError('Le code PIN doit comporter au moins 4 chiffres.');
                    }
                  }}
                  className="flex items-center gap-2 pt-1 border-t border-slate-200"
                >
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Nouveau PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer"
                  >
                    Modifier le PIN
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sauvegarde & Restauration */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Sauvegarde des Données</h3>
              <p className="text-xs text-slate-500">Exporter ou restaurer l'intégralité du carnet</p>
            </div>

            {restoreMessage && (
              <div className={`p-2.5 rounded-lg text-xs ${restoreSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {restoreMessage}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger la sauvegarde JSON</span>
              </button>

              {isOwner && (
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isRestoring ? 'Restauration...' : 'Restaurer un fichier'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackupFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Journal d'Audit & Sécurité</h3>
          <span className="text-xs text-slate-500">{auditLogs.length} évènements enregistrés</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Date & Heure</th>
                <th className="p-3">Action</th>
                <th className="p-3">Détails</th>
                <th className="p-3">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    Aucune action enregistrée pour le moment.
                  </td>
                </tr>
              ) : (
                auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 font-mono">{formatDateBamako(log.timestamp, true)}</td>
                    <td className="p-3 font-semibold text-slate-900">{log.action}</td>
                    <td className="p-3 text-slate-600">{log.details}</td>
                    <td className="p-3 font-mono text-slate-500">{log.userEmail || 'Commerçant'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
