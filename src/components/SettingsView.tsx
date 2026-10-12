import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatDateBamako } from '../lib/utils';
import { UserRole } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Settings,
  Building2,
  ShieldCheck,
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Phone,
  MapPin,
  Sparkles,
  HelpCircle,
  Key,
  HardDrive,
  Download,
  Upload,
  Database,
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
  const [showNewPinInput, setShowNewPinInput] = useState(false);
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

  // Export full backup
  const handleExportBackup = () => {
    if (!activeBusiness) return;
    const backupObj = {
      app: 'DDS Crédit Confiance',
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      business: activeBusiness,
      customers,
      credits,
      payments,
      auditLogs,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_DDS_Confiance_${activeBusiness.city || 'Bamako'}_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import / Restore backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreMessage(null);
    setRestoreSuccess(false);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.customers || !parsed.credits || !parsed.payments) {
        throw new Error('Fichier de sauvegarde invalide (éléments manquants).');
      }

      // Restore customers
      for (const cust of parsed.customers) {
        if (cust.id) {
          await setDoc(doc(db, 'customers', cust.id), cust);
        }
      }

      // Restore credits
      for (const cred of parsed.credits) {
        if (cred.id) {
          await setDoc(doc(db, 'credits', cred.id), cred);
        }
      }

      // Restore payments
      for (const pay of parsed.payments) {
        if (pay.id) {
          await setDoc(doc(db, 'payments', pay.id), pay);
        }
      }

      if (parsed.business && parsed.business.id) {
        await setDoc(doc(db, 'businesses', parsed.business.id), parsed.business);
      }

      setRestoreSuccess(true);
      setRestoreMessage(
        `Restauration réussie : ${parsed.customers.length} clients, ${parsed.credits.length} crédits et ${parsed.payments.length} paiements restaurés avec succès.`
      );
      setTimeout(() => setRestoreMessage(null), 8000);
    } catch (err: unknown) {
      setRestoreSuccess(false);
      setRestoreMessage(`Erreur de restauration : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Paramètres & Gestion de la Boutique
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Coordonnées de l'établissement, rôles d'accès des employés et journal d'audit de sécurité.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Boutique Profile & Audit */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Boutique Profile Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Fiche de la Boutique</h3>
                  <p className="text-xs text-slate-400">Informations imprimées sur les reçus de paiement</p>
                </div>
              </div>

              {!isOwner && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  Lecture seule (Rôle {userRole})
                </span>
              )}
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Les informations de la boutique ont été enregistrées avec succès.</span>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom commercial de la boutique
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Téléphone officiel (Orange / Moov)
                  </label>
                  <input
                    type="tel"
                    disabled={!isOwner}
                    required
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ville (Mali)
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    required
                    value={bizCity}
                    onChange={(e) => setBizCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Adresse / Emplacement (ex: Grand Marché)
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={bizAddress}
                    onChange={(e) => setBizAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slogan ou devise de l'entreprise
                </label>
                <input
                  type="text"
                  disabled={!isOwner}
                  value={bizSlogan}
                  onChange={(e) => setBizSlogan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-500">Devise du système : <strong>FCFA</strong></span>
                {isOwner && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Audit Logs (Journal d'audit obligatoire) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Journal d'Audit & Traçabilité ({auditLogs.length})</h3>
              </div>
              <span className="text-[10px] text-slate-400">Opérations non destructives et horodatées</span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Aucune entrée d'audit pour le moment.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {auditLogs.slice(0, 15).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-850 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{log.action}</span>
                        <span className="text-[10px] text-slate-500">• {log.userEmail}</span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {formatDateBamako(log.timestamp, true)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sauvegarde & Restauration Complète (JSON) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sauvegarde & Restauration de Secours</h3>
                  <p className="text-xs text-slate-400">Archivage complet hors-ligne et restauration Cloud en 1 clic</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                Format JSON
              </span>
            </div>

            {restoreMessage && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                  restoreSuccess
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {restoreSuccess ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{restoreMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Button */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-cyan-400" />
                    Télécharger la Sauvegarde
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Génère un fichier de secours contenant vos {customers.length} clients, {credits.length} créances et {payments.length} reçus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter les données (.json)</span>
                </button>
              </div>

              {/* Import / Restore Button */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Restaurer une Sauvegarde
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Injecte vos données de secours directement dans Firestore (Bamako).
                  </p>
                </div>
                <label className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                  isRestoring
                    ? 'bg-slate-800 text-slate-500 border-slate-700 pointer-events-none'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isRestoring ? 'Restauration en cours...' : 'Importer un fichier (.json)'}</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                    disabled={isRestoring || !isOwner}
                  />
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: RBAC Roles Matrix & DDS Solution branding */}
        <div className="space-y-6">
          
          {/* RBAC Role Matrix */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Contrôle des Accès (RBAC)</h3>
                <p className="text-xs text-slate-400">Permissions par rôle d'employé</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  role: 'owner' as UserRole,
                  title: 'Propriétaire',
                  desc: 'Accès complet : configuration boutique, gestion totale, suppression sécurisée et exports.',
                  badge: 'Accès Maître',
                },
                {
                  role: 'manager' as UserRole,
                  title: 'Gestionnaire',
                  desc: 'Gestion des clients, octroi des crédits et encaissement des remboursements autorisés.',
                  badge: 'Exploitation',
                },
                {
                  role: 'cashier' as UserRole,
                  title: 'Caissier',
                  desc: 'Enregistrement des remboursements, consultation des soldes et impression des reçus.',
                  badge: 'Caisse uniquement',
                },
              ].map((item) => (
                <div
                  key={item.role}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    userRole === item.role
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/70'
                  }`}
                  onClick={() => setUserRole(item.role)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{item.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-800">
              Astuce : Cliquez sur un rôle ci-dessus pour simuler en temps réel l'interface vue par votre caissier ou gestionnaire.
            </p>
          </div>

          {/* Code PIN de Sécurité */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Key className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Code PIN d'Accès Commerçant</h3>
                <p className="text-xs text-slate-400">Accès rapide au comptoir (Caisse & Gestion)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Code PIN Actuel :</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-bold text-sm border border-cyan-500/30 tracking-widest">
                    {showPinCode ? pinCode : '•••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPinCode(!showPinCode)}
                    title={showPinCode ? 'Masquer le code PIN' : 'Afficher le code PIN'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
                  >
                    {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Nouveau code PIN enregistré !</span>
                </div>
              )}

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{pinError}</span>
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
                  className="space-y-2 pt-2 border-t border-slate-700/60"
                >
                  <label className="block text-[11px] font-semibold text-slate-400">
                    Définir un nouveau code PIN
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showNewPinInput ? 'text' : 'password'}
                        maxLength={8}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••••"
                        className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPinInput(!showNewPinInput)}
                        title={showNewPinInput ? 'Masquer' : 'Afficher'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPinInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Enregistrer
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updatePinCode('00223');
                      setNewPin('00223');
                      setPinSuccess(true);
                      setPinError('');
                      setTimeout(() => setPinSuccess(false), 3000);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Réinitialiser au code par défaut (Mali)
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Diaby Digital Solution Branding */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm">
                DDS
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Diaby Digital Solution (DDS)
                </h4>
                <p className="text-[11px] text-cyan-400">Éditeur de logiciels • Mali</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>DDS Crédit Confiance</strong> est une solution logicielle conçue spécialement pour moderniser le commerce de proximité au Mali et sécuriser le crédit client.
            </p>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1 text-slate-400">
              <p>📍 Siège : Bamako, Mali</p>
              <p>🛡️ Sécurité : Cloud Firestore & ABAC Rules</p>
              <p>📱 PWA : Installable sur Android, iOS & PC</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
