export type Statut = "pending" | "registered" | "refused" | "transmitted";

export type Fiche = {
  _id: string; reference: string; statut: Statut; createdAt: string;
  nom: string; prenom: string; dateNaissance: string; lieuNaissance: string; nationalite: string; flagEmoji?: string;
  profession?: string; adresse: string; ville: string; bp?: string;
  venantDe: string; allantA: string; motif: string;
  typePiece: string; numeroPiece: string; delivreLe: string; delivreA: string;
  dateEntree: string; dateSortie: string; chambreNumero: string; transport: string; plaque?: string; modePaiement: string;
  refusMotif?: string; traiteAt?: string; transmisAt?: string; transmisReference?: string;
  client?: { _id?: string; nom?: string; prenom?: string; email?: string };
  hotel?: { nomHotel: string; ville?: string; adresse?: string; region?: string; commune?: string };
  hotelRegion?: string; hotelCommune?: string; international?: boolean;
  signalement?: { actif: boolean; motif?: string; at?: string };
};

export type Stats = { totalClients: number; pending: number; registered: number; refused: number; transmitted: number; chambresOccupees: number; totalChambres: number };

// ---- Superadmin
export type Overview = {
  hotels: { total: number; actifs: number; pending: number; rejected: number; nouveauxCeMois: number };
  users: { total: number; clients: number; hotels: number; certifiesPct: number };
  fiches: { total: number; pending: number; registered: number; transmitted: number; refused: number; pct: { pending: number; registered: number; transmitted: number; refused: number } };
  messagesNouveaux: number;
};
export type AdminHotel = {
  _id: string; nomHotel: string; email: string; telephone?: string; rccm?: string; adresseHotel?: string; villeHotel?: string; regionHotel?: string; communeHotel?: string;
  hotelStatus: "pending" | "approved" | "rejected"; hotelRejectedReason?: string; createdAt: string;
  profile?: { etoiles?: number; ville?: string; region?: string; commune?: string; adresse?: string } | null;
};
export type ActivityEvent = { type: "fiche_created" | "fiche_transmitted" | "fiche_refused" | "hotel_request" | "user_created"; title: string; detail: string; at: string; alert?: boolean };
export type TrendPoint = { date: string; created: number; transmitted: number };
export type Health = { db: { ok: boolean; latencyMs: number | null }; email: { configured: boolean }; uptimeSeconds: number; env: string; time: string };

export type AdminUser = {
  _id: string; role: "client" | "hotel" | "superadmin"; email: string; nom?: string; prenom?: string; telephone?: string;
  nomHotel?: string; adresseHotel?: string; villeHotel?: string; rccm?: string; hotelStatus?: "pending" | "approved" | "rejected"; hotelRejectedReason?: string;
  isActive: boolean; isVerified: boolean; createdAt: string; approvedAt?: string; lastLoginAt?: string;
};
export type DocItem = { _id: string; reference: string; nom: string; prenom: string; typePiece: string; numeroPiece: string; statut: Statut; createdAt: string; hotel?: { nomHotel: string }; pieceDisponible: boolean; ficheDisponible: boolean };

// ---- Supervision nationale (v3 Mali)
export type Jour = {
  date: string; clotureHeure: number;
  fiches: { aujourdhui: number; hier: number; variationPct: number | null };
  lots: { scelles: number; total: number; enCours: number; enRetard: number; conformitePct: number };
  internationaux: { aujourdhui: number; pctVolume: number };
  signalements: { total: number; actionRequise: number };
};
export type LotStatut = "scelle" | "en_cours" | "en_retard";
export type LotRow = { hotelId: string; etablissement: string; commune: string; region?: string; fiches: number; horodatage: string | null; statut: LotStatut };
export type LotsData = { date: string; clotureHeure: number; totalScelles: number; totalReseau: number; lots: LotRow[] };
export type RegionRow = { region: string; fiches: number; pct: number; communes: { nom: string; fiches: number }[]; hotels: number };
export type RegionsData = { days: number; total: number; regions: RegionRow[]; couverture: { connectes: number; total: number; pct: number; fenetreJours: number } };
export type Anomalie = { type: string; severity: "high" | "medium"; title: string; detail: string; hotel?: string; at?: string };

// ---- Hôtel : situation de télé-transmission du jour
export type LotJour = {
  date: string; statut: "aucun" | "en_cours" | "scelle" | "en_retard";
  clotureHeure: number; clotureAtteinte: boolean; aTransmettre: number; transmisAujourdhui: number;
  lots: { _id: string; reference: string; count: number; statut: "en_cours" | "scelle"; scelleAt?: string; empreinte?: string }[];
};
