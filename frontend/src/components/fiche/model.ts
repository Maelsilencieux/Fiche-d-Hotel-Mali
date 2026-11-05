export const MOTIFS = ["Affaires", "Tourisme", "Conférence", "Formation", "Reportage", "Médical", "Famille", "Transit", "Autre"] as const;
export const NATIONALITES = ["Malienne", "Burkinabè", "Sénégalaise", "Guinéenne", "Ivoirienne", "Mauritanienne", "Nigérienne", "Algérienne", "Marocaine", "Togolaise", "Béninoise", "Ghanéenne", "Nigériane", "Française", "Autre"];
export const TRANSPORTS = ["Véhicule particulier / Taxi agréé", "Avion", "Bus / Transport en commun", "Moto-taxi", "Autre"];
export const PAIEMENTS = [{ id: "cash", label: "Espèces", d: "Franc CFA (XOF) réglé au comptoir d’accueil." }, { id: "cheque", label: "Chèque de voyages", d: "Chèque bancaire certifié ou traveler check." }, { id: "carte", label: "Carte de crédit", d: "Visa, Mastercard ou terminal TPE international." }, { id: "voucher", label: "Voucher", d: "Prise en charge entreprise, agence ou ONG." }] as const;
export const PIECES = [{ id: "NINA", label: "Carte NINA", d: "Identité nationale du Mali" }, { id: "CNI", label: "CNI", d: "Carte d’identité" }, { id: "Passeport", label: "Passeport", d: "International" }, { id: "Carte consulaire", label: "Carte consulaire", d: "Ressortissants à l’étranger" }, { id: "Titre de séjour", label: "Titre de séjour", d: "Résidents étrangers" }, { id: "Autre", label: "Autre", d: "Autre titre officiel" }] as const;

export type Key = "nom" | "prenom" | "dateNaissance" | "lieuNaissance" | "nationalite" | "profession" | "adresse" | "ville" | "bp"
  | "venantDe" | "allantA" | "motif" | "hotelId" | "chambreNumero" | "dateEntree" | "dateSortie" | "transport" | "plaque"
  | "typePiece" | "numeroPiece" | "delivreLe" | "delivreA" | "modePaiement";
export type Draft = Record<Key, string> & { id: string };

export const emptyDraft = (): Draft => ({
  id: `SS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", nationalite: "Malienne", profession: "", adresse: "", ville: "", bp: "",
  venantDe: "", allantA: "", motif: "", hotelId: "", chambreNumero: "", dateEntree: "", dateSortie: "", transport: "", plaque: "",
  typePiece: "NINA", numeroPiece: "", delivreLe: "", delivreA: "", modePaiement: "cash",
});

export const STEPS = [
  { label: "Identité", title: "Identité civile", next: "Étape 2 Voyage" },
  { label: "Voyage", title: "Voyage & Motif", next: "Étape 3 Séjour et hôtel" },
  { label: "Séjour & hôtel", title: "Séjour & Hôtel", next: "Étape 4 Validation" },
  { label: "Validation", title: "Pièces & Contrôle", next: "" },
];

const REQUIRED: Key[][] = [
  ["nom", "prenom", "dateNaissance", "lieuNaissance", "nationalite", "profession", "adresse", "ville"],
  ["venantDe", "allantA", "motif"],
  ["hotelId", "dateEntree", "dateSortie", "chambreNumero", "transport"],
  ["typePiece", "numeroPiece", "delivreLe", "delivreA"],
];
const today = () => new Date().toISOString().slice(0, 10);
export const nights = (a: string, b: string) => (a && b ? Math.round((+new Date(b) - +new Date(a)) / 86400000) : 0);
export const fmt = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—");

export function validate(step: number, d: Draft): Partial<Record<Key, string>> {
  const e: Partial<Record<Key, string>> = {};
  REQUIRED[step].forEach((k) => { if (!d[k].trim()) e[k] = "Champ obligatoire."; });
  if (step === 0 && d.dateNaissance > today()) e.dateNaissance = "Date de naissance invalide.";
  if (step === 2 && d.dateEntree && d.dateSortie && d.dateSortie <= d.dateEntree) e.dateSortie = "La sortie doit être postérieure à l’arrivée.";
  if (step === 3 && d.delivreLe > today()) e.delivreLe = "Date de délivrance invalide.";
  return e;
}
