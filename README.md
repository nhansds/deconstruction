# deconstruction

**deconstruction** est une application **une seule page** (SPA React) : tableau **public** des points sans connexion, et **espace admin** (Firebase Auth) pour gérer les hommes, les actions à points (coefficient positif ou négatif), enregistrer les événements et consulter graphiques + classement.

Les données sont stockées dans **Cloud Firestore** (gratuit dans les quotas modestes). GitHub Pages ne fournit pas de backend : Firebase assure la persistance partagée entre vous et les visiteurs.

## Fonctionnalités

- **Public** : `/` — tableau des points : graphique d’évolution, histogramme, classement.
- **Thèmes** : **Rose** (défaut), **Clair**, **Sombre** — sélecteur dans l’en-tête, choix mémorisé (`localStorage`).
- **Admin** : `/admin` — prénom, nom, photo, couleur ; actions et événements ; graphiques ; **paramètres d’accès** (`config/site`, inscriptions oui/non) ; **annuaire administrateurs** (`admins/{uid}`, synchronisé à la connexion).

## Prérequis

1. Projet [Firebase](https://console.firebase.google.com/) : ajoutez une app Web, copiez la config.
2. **Authentication** → méthode **E-mail / Mot de passe** activée.
3. **Firestore** → créez la base (mode prod), puis **Règles** : collez le contenu de `firestore.rules` (collections `hommes`, `actions`, `evenements`, `config`, `admins` — voir fichier pour le détail des lectures / écritures).
4. Fichier `.env` à la racine (voir `.env.example`).

## Développement local

```bash
npm install
cp .env.example .env
# Éditez .env avec vos clés ; VITE_BASE=/ pour le dev local
npm run dev
```

Créez un compte via **S’inscrire** sur `/admin`, puis utilisez les onglets.

## Publication sur GitHub Pages

1. **Nom du dépôt** : pour une URL du type `https://<user>.github.io/<repo>/`, le chemin de base doit être `/<repo>/`.

   - En **local** pour tester comme en prod : `VITE_BASE=/mon-repo/` puis `npm run build:pages` et `npm run preview`.

2. **Workflow** : le fichier `.github/workflows/pages.yml` construit le site et le déploie avec [GitHub Actions](https://docs.github.com/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

   Dans les **secrets** du dépôt (`Settings → Secrets and variables → Actions`), ajoutez :

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET` (peut être vide si non utilisé)
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. **Pages** : `Settings → Pages` → Source : **GitHub Actions**.

4. Le script `copy-404.mjs` duplique `index.html` en `404.html` pour que le **rechargement** sur `/admin` fonctionne avec le routeur côté client.

### Site utilisateur `username.github.io` (racine `/`)

Adaptez le workflow : mettez `VITE_BASE=/` dans l’étape Build (ou un secret) au lieu de `/${{ github.event.repository.name }}/`.

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Recharts, Firebase (Auth + Firestore).
