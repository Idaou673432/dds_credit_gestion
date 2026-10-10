# GUIDE D'INSTALLATION ET DE DÉPLOIEMENT — DDS CRÉDIT CONFIANCE
**Développé par Diaby Digital Solution (DDS) • Bamako, Mali**

---

## 1. Vue d'ensemble
**DDS Crédit Confiance** est une application web progressive (PWA) conçue pour les commerçants maliens (boutiques, demi-grossistes, commerces de détail) permettant de gérer avec rigueur et simplicité les crédits clients, les remboursements partiels/totaux, la relance WhatsApp et l'émission de reçus officiels en FCFA.

---

## 2. Architecture Technique
- **Frontend** : React 19 + TypeScript + Vite + Tailwind CSS.
- **PWA** : Service Worker (`vite-plugin-pwa`), Web App Manifest complet, icônes conformes (192px, 512px, maskable, apple-touch-icon).
- **Backend & Données** : Google Cloud Firestore avec transactions atomiques (`runTransaction`) assurant l'intégrité des calculs financiers.
- **Authentification & RBAC** : Firebase Authentication (Google Auth & profils sécurisés), rôles d'accès : *Propriétaire*, *Gestionnaire*, *Caissier*.
- **Règles de Sécurité** : `firestore.rules` protégeant les 7 collections (`users`, `businesses`, `memberships`, `customers`, `credits`, `payments`, `auditLogs`).
- **Génération de documents** : PDF vectoriels (`jspdf`) au format A5 (reçus de caisse) et A4 (relevés de compte client), et exports CSV Excel (avec BOM UTF-8 et séparateur point-virgule).

---

## 3. Installation Locale

### Prérequis
- Node.js version 18 ou supérieure.
- Gestionnaire de paquets `npm` ou `bun`.

### Commandes
```bash
# 1. Cloner ou ouvrir le projet
cd dds-credit-confiance

# 2. Installer les dépendances
npm install

# 3. Lancer en mode développement (Port 3000)
npm run dev

# 4. Compiler pour la production
npm run build
```

---

## 4. Configuration Firebase

Le fichier `firebase-applet-config.json` à la racine contient la configuration du projet Firebase provisionné :
- `projectId`
- `apiKey`
- `authDomain`
- `firestoreDatabaseId`

### Déploiement des règles de sécurité Firestore
Les règles sont définies dans `firestore.rules` et ont été vérifiées et déployées. En cas de mise à jour manuelle via Firebase CLI :
```bash
firebase deploy --only firestore:rules
```

---

## 5. Fonctionnalités Clés et Règles Métier

1. **Calcul Automatique des Soldes** :
   $$\text{Solde restant} = \text{Montant total du crédit} - \text{Total des remboursements validés}$$
   Un crédit dont le solde atteint 0 FCFA passe instantanément au statut « Soldé » et ne peut plus faire l'objet de surpaiements.

2. **Remboursements Partiels et Totaux** :
   - Refus strict des montants négatifs ou nuls.
   - Refus automatique si montant versé > solde restant.
   - Protection contre les doubles soumissions (verrou d'exécution et clé de transaction).
   - Reçu A5 imprimable et téléchargeable en PDF instantanément.

3. **Rappels WhatsApp Automatisés mais Maîtrisés** :
   - Message prérempli poli et professionnel adapté aux réalités du commerce malien.
   - Le commerçant vérifie et expédie lui-même le message via WhatsApp Web ou l'application mobile.

4. **Centre de Vérification 10/10 Intégré** :
   - Cliquez sur le bouton « Tests 10/10 » dans l'en-tête de l'application pour tester et valider en direct l'ensemble des 10 règles du cahier des charges.
