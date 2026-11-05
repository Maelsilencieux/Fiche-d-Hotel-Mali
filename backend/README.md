# SafeStay Mali — Backend API (v3)

API REST Node.js + Express + MongoDB. Reprise de `safestay-backend-v2` (RCA) adaptée au Mali.
Les routes existantes sont conservées : le frontend v2 reste compatible.

```bash
npm install
cp .env.example .env     # renseigner MONGO_URI, JWT_SECRET (16+ caractères), SMTP…
npm run dev              # http://localhost:5000
```

## Ce qui a changé par rapport à la v2

| Domaine | Modification |
|---|---|
| Référentiel | `config/mali.js` : régions, communes, pièces d'identité, drapeaux par nationalité (accents/genre tolérés), heure de clôture |
| Hôtel | `region`, `commune` ; défauts Bamako / Mali (`User.regionHotel`, `communeHotel` aussi) |
| Fiche | Pièces : `NINA` (défaut), `CNI`, `Passeport`, `Carte consulaire`, `Titre de séjour`, `Autre` · champs `hotelRegion`, `hotelCommune`, `international`, `lot` · référence `SSM-AAAA-00001` via compteur atomique (`models/Counter.js`) |
| Validation | date de naissance non future, type de pièce contrôlé |
| Lots | `models/Lot.js` : chaque transmission rejoint le lot ouvert du jour ; l'hôtel le **scelle** (empreinte SHA-256) |
| Hôtel (routes) | `GET /api/fiches/lots/aujourdhui` · `PATCH /api/fiches/transmettre-lot` · `PATCH /api/fiches/lots/aujourdhui/sceller` · `GET /api/fiches/:id/piece` (alias `/cnib` conservé) |
| Admin (routes) | `GET /api/admin/jour` · `/lots` · `/regions?days=` · `/anomalies` · `/rapport-consolide?from&to` (CSV Excel) |
| Sécurité | démarrage refusé si `JWT_SECRET` absent/court ; avertissement si mot de passe superadmin par défaut en production |
| Divers | liens de notification corrigés (`/client`, `/hotel/demandes`) · e-mails aux couleurs du Mali |

## Gestionnaire des fiches (superadmin)
`GET /api/admin/fiches` (filtres : `statut, region, hotel, q, from, to, international, signalees, page, limit` + statistiques) · `GET /api/admin/fiches/export` (CSV, n° de pièce masqué) · `PATCH /api/admin/fiches/:id/signaler` (motif obligatoire) · `PATCH /api/admin/fiches/:id/lever-signalement`. Les fiches signalées remontent dans les anomalies du tableau de bord. Un superadmin peut aussi transmettre une fiche validée (`PATCH /api/fiches/:id/transmettre-police`).

## Règles de calcul (à valider avec l'autorité)
- **Heure de clôture** : `TRANSMISSION_DEADLINE_HOUR` (défaut 23), heure du Mali (UTC+0).
- **Statut d'un hôtel au jour J** : `scelle` (lot scellé, rien en attente) · `en_cours` (lot ouvert ou fiches validées non transmises) · `en_retard` (idem après la clôture).
- **Conformité** = hôtels du réseau avec lot scellé ÷ hôtels approuvés et actifs.
- **Couverture réseau** = hôtels actifs (connexion ou fiche) sur 7 jours ÷ hôtels approuvés et actifs.
- **Voyageur international** = nationalité différente de « Malien(ne) ».
- **Anomalies** : lot en retard · fiches en attente > 24 h · même pièce dans deux établissements sur des séjours qui se chevauchent.

## Migration depuis la v2
Aucune obligation : les anciens documents restent lisibles. Les fiches existantes n'ont pas `hotelRegion`/`international` (elles apparaîtront « Non renseignée » dans le flux par région). Le type de pièce `CNIB` n'existe plus dans l'enum : à convertir si vous reprenez des données.

## ⚠ Limites connues
- Le découpage administratif du Mali a évolué (réforme de 2023) : ajustez `REGIONS` dans `config/mali.js` **et** `frontend/src/lib/mali.ts`.
- Vérifié : syntaxe, chargement des modèles et routes, compilation du frontend. **Non testé contre une base MongoDB réelle** (aucune instance disponible dans mon environnement) : faites un test de bout en bout (inscription hôtel → approbation → fiche → validation → transmission → scellage → tableau de bord admin).
