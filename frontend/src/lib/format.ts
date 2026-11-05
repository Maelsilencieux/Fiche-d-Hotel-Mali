import type { Statut } from "./types";

export const d = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "—");
export const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
export const nuits = (a: string, b: string) => Math.max(0, Math.round((+new Date(b) - +new Date(a)) / 86400000));

export const STATUT: Record<Statut, { label: string; pill: string }> = {
  pending: { label: "En attente", pill: "bg-amber-50 text-amber-700" },
  registered: { label: "Validée", pill: "bg-emerald-50 text-ok" },
  refused: { label: "Refusée", pill: "bg-red-50 text-red-600" },
  transmitted: { label: "Transmise · Scellée", pill: "bg-leaf text-mali" },
};
export const PAIEMENT: Record<string, string> = { cash: "Espèces (FCFA) au comptoir", cheque: "Chèque de voyages", carte: "Carte bancaire", voucher: "Voucher" };

/** Heure au format HH:MM, fuseau du Mali (UTC+0). */
export const hm = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Bamako" }) : "—");
export const nf = (n?: number | null) => (n === undefined || n === null ? "–" : n.toLocaleString("fr-FR"));
