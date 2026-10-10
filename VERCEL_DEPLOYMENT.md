# GUIDE DE DÉPLOIEMENT SUR VERCEL — DDS CRÉDIT CONFIANCE
**Diaby Digital Solution (DDS) • Bamako, Mali**

L'application **DDS Crédit Confiance** est entièrement configurée pour un déploiement instantané et automatique sur **Vercel** grâce au fichier `vercel.json` créé à la racine.

---

## MÉTHODE 1 : Déploiement via GitHub (Recommandé)

1. **Publiez le code sur votre GitHub** (dépôt public ou privé).
2. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous.
3. Cliquez sur **« Add New... »** > **« Project »**.
4. Sélectionnez votre dépôt GitHub `dds-credit-confiance` et cliquez sur **« Import »**.
5. Vercel détecte automatiquement la configuration :
   - **Framework Preset** : `Vite`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
6. Cliquez sur **« Deploy »**.
7. En moins de 60 secondes, votre application est en ligne avec une URL sécurisée en HTTPS (ex: `https://dds-credit-confiance.vercel.app`).

---

## MÉTHODE 2 : Déploiement direct via Vercel CLI (Sans GitHub)

Si vous avez Node.js installé sur votre ordinateur :

```bash
# 1. Installer la CLI Vercel si besoin
npm install -g vercel

# 2. Se placer à la racine du projet
cd dds-credit-confiance

# 3. Lancer le déploiement
vercel --prod
```

Suivez les instructions à l'écran : confirmez les paramètres par défaut (Framework: Vite, Build: `npm run build`, Output: `dist`).

---

## ÉTAPE CRUCIALE POUR GOOGLE AUTH SUR VERCEL :

Pour que la connexion Google fonctionne sur votre domaine Vercel :
1. Allez sur la [Console Firebase](https://console.firebase.google.com).
2. Sélectionnez le projet `crucial-spider-zhh41`.
3. Allez dans **Authentication** > onglet **Paramètres (Settings)** > **Domaines autorisés (Authorized domains)**.
4. Cliquez sur **« Ajouter un domaine »**.
5. Entrez votre domaine Vercel (ex : `dds-credit-confiance.vercel.app` ou votre domaine personnalisé).
6. Cliquez sur **Enregistrer**.

---

## Variables d'environnement sur Vercel (Optionnel)

Le fichier `firebase-applet-config.json` étant déjà inclus dans le projet, l'application fonctionne sans configuration supplémentaire.

Si vous souhaitez toutefois redéfinir les clés dans l'interface de Vercel (*Project Settings* > *Environment Variables*), vous pouvez copier les valeurs depuis `.env.example` :
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`

---

## Fichiers de configuration inclus :
- `vercel.json` : Règles de réécriture d'URL pour le routing SPA React, en-têtes de cache pour les assets et mise à jour immédiate du Service Worker PWA.
- `.vercelignore` : Exclusion des fichiers inutiles (`node_modules`, logs, tests) pour accélérer le build.
