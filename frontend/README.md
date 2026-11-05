# SafeStay Mali – Frontend (Next.js 15, App Router, Tailwind v4)

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                        # http://localhost:3000
```

## Design « Bogolan & Savane »
- Couleurs du drapeau : vert `#14B53A`/`mali`, or `#FCD116`/`gold`, rouge `#CE1126`/`rouge`, fond crème. Tout est défini dans `src/app/globals.css` (bloc `@theme`).
- Motif bogolan en SVG (aucune image à fournir) : classes `bg-bogolan-light` / `bg-bogolan-dark`. Bandeau tricolore : `.flag-bar`.
- Polices : Fraunces (titres), Plus Jakarta Sans (texte), JetBrains Mono (données) via `next/font/google`.
- `components/shell/AppShell.tsx` : coque commune des espaces Administration et Hôtel.

## Nouveautés par rapport à la version RCA
- Tableau de bord national : cartes du jour, lots de télé-transmission, flux par région/commune, couverture réseau, signalements, rappels réglementaires, rapport consolidé CSV.
- Espace hôtel : panneau « Lot du jour » (transmettre toutes les fiches validées, sceller le lot).
- Inscription hôtel : région + commune/quartier (`src/lib/mali.ts`, miroir de `backend/config/mali.js`).
- Pièces d'identité : NINA, CNI, passeport, carte consulaire, titre de séjour.

## Mise à jour 2 (nouvelles références d'écrans)
- **Connexion** : 3 profils (Voyageur · Établissement · Administration), bandeau de sécurité, « Mémoriser cet appareil », bloc d'assistance. L'onglet Administration n'accepte que le superadmin.
- **Fiche de police** : en-tête centré avec référence de formulaire, étapes « Conforme / Étape actuelle / À suivre » avec barre tricolore, engagement sur l'honneur obligatoire avant l'envoi, barre d'aide.
- **Confirmation** : récépissé numérique provisoire (référence nationale + horodatage Bamako).
- **Gestion des hôtels** : filtre par région, localisation commune/région, barres de progression sur les cartes.

- **Admin → Fiches de police** (`/admin/fiches`) : registre national paginé côté serveur, filtres (statut, région, origine, dates, signalées), export CSV, détail avec signalement, transmission et téléchargement de la pièce.

## ⚠ À remplacer avant mise en ligne
Contenus d'exemple, non officiels : « Arrêté interministériel N° 2024/ML-78 », numéro de support (`src/lib/config.ts`), adresses `@safestay.ml`, textes de la FAQ (`src/components/faq/data.ts`).
