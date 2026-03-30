# ELIKIA-SCHOOL v2.0 - Gestion Scolaire

Application professionnelle de gestion scolaire pour Windows (Electron) et mobile (PWA).

## Fonctionnalites

| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs, graphiques revenus/depenses, repartition par genre |
| **Eleves** | CRUD complet, recherche, filtrage par classe |
| **Professeurs** | Gestion des enseignants, matieres, salaires |
| **Personnel** | Staff administratif (secretaires, gardiens...) |
| **Classes** | Prescolaire, Primaire, College, Lycee - avec frais de scolarite |
| **Finances** | Frais de scolarite (grille mensuelle), depenses, salaires |
| **Recus** | Generation et impression de recus de paiement |
| **Emploi du temps** | Vue grille par classe/professeur |
| **Utilisateurs** | Gestion des comptes et roles (Admin/Utilisateur) |
| **Parametres** | Config ecole, logos, import/export, reinitialisation |

## Architecture

```
elikia-school/
├── index.html                        # Entree HTML
├── package.json                      # Dependencies et scripts
├── tailwind.config.js                # Couleurs brand
├── tsconfig.json                     # TypeScript
├── public/
│   ├── manifest.json                 # PWA manifest
│   └── sw.js                         # Service Worker (offline)
├── assets/                           # Icones, images
├── dist/                             # Build (bundle.js, styles.css)
├── release/                          # Installateurs (.exe, .AppImage)
└── src/
    ├── main/                         # Electron Main Process
    │   ├── main.ts                   # Fenetre + init DB + IPC
    │   ├── preload.ts                # Bridge securise renderer <-> main
    │   ├── database.ts               # SQLite (better-sqlite3)
    │   ├── ipc-handlers.ts           # Tous les handlers IPC
    │   └── auth.ts                   # Hash mots de passe (scrypt)
    └── renderer/                     # Application React
        ├── index.tsx                 # Point d'entree React
        ├── App.tsx                   # Shell (sidebar + routing)
        ├── types.ts                  # Interfaces TypeScript
        ├── data.ts                   # Donnees initiales (fallback)
        ├── styles.css                # Entree Tailwind
        ├── electron.d.ts             # Types pour window.electronAPI
        ├── hooks/
        │   ├── useAppState.ts        # State + persistance localStorage
        │   └── useDatabase.ts        # Detection Electron vs navigateur
        ├── components/
        │   ├── icons.tsx             # 25 icones SVG
        │   ├── Sidebar.tsx           # Navigation laterale
        │   ├── CrudManagerPage.tsx   # Composant CRUD generique
        │   └── ui/                   # 9 composants reutilisables
        │       ├── Button.tsx        # Bouton avec variants + sizes
        │       ├── Card.tsx          # Carte avec gradient
        │       ├── FormRow.tsx       # Ligne de formulaire 2 colonnes
        │       ├── Input.tsx         # Champ de saisie
        │       ├── KpiCard.tsx       # Carte KPI (dashboard)
        │       ├── Modal.tsx         # Modale responsive
        │       ├── Select.tsx        # Menu deroulant
        │       ├── Spinner.tsx       # Indicateur de chargement
        │       ├── Textarea.tsx      # Zone de texte
        │       └── index.ts          # Barrel export
        ├── pages/                    # 10 pages
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── StudentsPage.tsx
        │   ├── TeachersPage.tsx
        │   ├── StaffPage.tsx
        │   ├── ClassesPage.tsx
        │   ├── FinancesPage.tsx
        │   ├── TimetablePage.tsx
        │   ├── UsersPage.tsx
        │   └── SettingsPage.tsx
        └── utils/                    # 3 modules utilitaires
            ├── formatters.ts         # Monnaie, date, mois
            ├── schoolYear.ts         # Annee scolaire, statuts
            └── numberToWords.ts      # Montant en lettres (francais)
```

## Stack technique

| Composant | Technologie | Role |
|-----------|-------------|------|
| Frontend | React 19 + TypeScript | Interface utilisateur |
| Styling | Tailwind CSS 3 (local) | Design system |
| Charts | Recharts | Graphiques dashboard |
| Desktop | Electron 31 | Application Windows |
| Database | better-sqlite3 (SQLite) | Persistance serveur |
| Fallback | localStorage | Persistance navigateur |
| Bundler | esbuild | Build ultra-rapide |
| Build | electron-builder | Installateurs .exe |
| Mobile | PWA (Service Worker) | Android/iOS via navigateur |
| Auth | Node.js crypto (scrypt) | Hash mots de passe |

## Pre-requis

- **Node.js** >= 18 (https://nodejs.org)
- **npm** (inclus avec Node.js)
- **Outils de build C++** (pour better-sqlite3) :
  - Windows : `npm install -g windows-build-tools`
  - Ou installer Visual Studio Build Tools

## Installation

```bash
cd elikia-school

# Installer les dependances
npm install

# Creer le dossier dist
mkdir dist
```

## Developpement

```bash
# Terminal 1 : Watch CSS + JS
npm run dev

# Terminal 2 : Lancer Electron
npm start
```

Ou en une seule commande :
```bash
npm start
```

## Build Windows (.exe)

```bash
# Generer l'installateur NSIS pour Windows
npm run dist:win
```

Le fichier `.exe` sera genere dans le dossier `release/`.

## Deploiement PWA (Mobile Android/iOS)

Pour utiliser l'app sur mobile sans installer d'APK :

1. Deployez les fichiers sur un serveur web avec HTTPS :
   - `index.html`
   - `dist/` (bundle.js + styles.css)
   - `public/` (manifest.json + sw.js)
   - `assets/` (icones)

2. Depuis Chrome Android, ouvrez l'URL puis "Ajouter a l'ecran d'accueil"

3. L'app fonctionne en mode standalone (plein ecran) et offline.

> **Note** : En mode PWA (navigateur), l'app utilise localStorage au lieu de SQLite.
> Les donnees restent sur l'appareil. Utilisez l'export JSON pour les sauvegarder.

## Connexion par defaut

- **Utilisateur** : `admin`
- **Mot de passe** : `admin`

> Le mot de passe est automatiquement migre vers un hash securise (scrypt) apres la premiere connexion via Electron.

## Securite

| Aspect | Implementation |
|--------|---------------|
| Mots de passe | Hash scrypt (Node.js crypto) avec salt aleatoire |
| Migration | Les mots de passe legacy sont auto-migres au login |
| IPC | contextIsolation + contextBridge (pas de nodeIntegration) |
| DevTools | Desactives en production (seulement en dev) |
| Database | Stockee dans le dossier userData de l'app |

## Comparaison v1 vs v2

| Aspect | v1 (original) | v2 (refactorise) |
|--------|---------------|-------------------|
| Fichiers | 1 fichier de 1763 lignes | 45+ fichiers organises |
| Tailwind | CDN (pas offline) | Installe en local |
| Database | localStorage uniquement | SQLite + localStorage fallback |
| Mots de passe | En clair | Hash scrypt |
| Login | Verifie contre initialData | Verifie contre la DB/state |
| Button | Pas de prop `size` | `size="sm" \| "md"` |
| DevTools | Toujours ouvert | Conditionnel dev/prod |
| Mobile | Non supporte | PWA (offline + installable) |
| Build | Basique | electron-builder + NSIS |
| Architecture | Monolithique | MVC avec separation claire |
