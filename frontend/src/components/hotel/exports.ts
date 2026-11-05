import { d as fd, dt, STATUT } from "@/lib/format";
import type { Fiche } from "@/lib/types";

export const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const matches = (f: Fiche, q: string) => !q || norm(`${f.nom} ${f.prenom} ${f.reference} ${f.numeroPiece}`).includes(norm(q));

/** Export CSV (séparateur « ; », UTF-8 avec BOM : s'ouvre directement dans Excel). */
export function exportCsv(rows: Fiche[], name: string) {
  const head = ["Référence", "Nom", "Prénom", "Nationalité", "Pièce", "N° pièce", "Entrée", "Sortie", "Chambre", "Statut", "Soumise le"];
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((f) => [f.reference, f.nom, f.prenom, f.nationalite, f.typePiece, f.numeroPiece, fd(f.dateEntree), fd(f.dateSortie), f.chambreNumero, STATUT[f.statut].label, dt(f.createdAt)].map(esc).join(";"));
  const blob = new Blob(["\uFEFF" + [head.map(esc).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

const h = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Bordereau journalier : page imprimable (Imprimer → Enregistrer en PDF). */
export function printBordereau(rows: Fiche[], hotel: string) {
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer le bordereau."); return; }
  const tr = rows.map((f, i) => `<tr><td>${i + 1}</td><td>${h(f.reference)}</td><td>${h(f.nom.toUpperCase())} ${h(f.prenom)}</td><td>${h(f.nationalite)}</td><td>${h(f.typePiece)} ${h(f.numeroPiece)}</td><td>${fd(f.dateEntree)} → ${fd(f.dateSortie)}</td><td>${h(f.chambreNumero)}</td></tr>`).join("");
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bordereau journalier</title><style>body{font:12px system-ui,sans-serif;margin:32px;color:#1C1B16}h1{font-size:18px;margin:0}p{margin:4px 0 16px;color:#6B685B}table{width:100%;border-collapse:collapse}th{background:#0A6B3B;color:#fff;text-align:left;padding:8px;font-size:11px}td{padding:7px 8px;border-bottom:1px solid #E6DFC9}</style></head><body>
<h1>SafeStay Mali — Bordereau journalier de télé-transmission aux autorités</h1><p>${h(hotel)} · Édité le ${new Date().toLocaleString("fr-FR")} · ${rows.length} fiche(s) validée(s) à transmettre · Arrêté N° 2024/ML-78</p>
<table><thead><tr><th>#</th><th>Réf.</th><th>Client</th><th>Nationalité</th><th>Pièce</th><th>Séjour</th><th>Ch.</th></tr></thead><tbody>${tr || '<tr><td colspan="7">Aucune fiche validée en attente de transmission.</td></tr>'}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export function csvText(rows: Fiche[]) {
  const head = ["Référence", "Nom", "Prénom", "Nationalité", "Pièce", "N° pièce", "Entrée", "Sortie", "Chambre", "Statut", "Soumise le"];
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "\uFEFF" + [head.map(esc).join(";"), ...rows.map((f) => [f.reference, f.nom, f.prenom, f.nationalite, f.typePiece, f.numeroPiece, fd(f.dateEntree), fd(f.dateSortie), f.chambreNumero, STATUT[f.statut].label, dt(f.createdAt)].map(esc).join(";"))].join("\r\n");
}

/** Fiche individuelle imprimable (Imprimer → Enregistrer en PDF). */
export function printFiche(f: Fiche) {
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer la fiche."); return; }
  const row = (k: string, v?: string) => `<tr><th>${h(k)}</th><td>${h(v || "—")}</td></tr>`;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${h(f.reference)}</title><style>body{font:13px system-ui,sans-serif;margin:36px;color:#1C1B16}h1{font-size:19px;margin:0}h2{font-size:13px;margin:22px 0 6px;color:#0A6B3B;border-bottom:2px solid #0A6B3B;padding-bottom:4px}p{color:#6B685B;margin:4px 0}table{width:100%;border-collapse:collapse}th{width:34%;text-align:left;color:#6B685B;font-weight:600;padding:6px 8px;border-bottom:1px solid #E6DFC9}td{padding:6px 8px;border-bottom:1px solid #E6DFC9}</style></head><body>
<h1>Fiche hôtelière de police — ${h(f.reference)}</h1><p>République du Mali · Arrêté N° 2024/ML-78 · Statut : ${h(STATUT[f.statut].label)} · Soumise le ${dt(f.createdAt)}</p>
<h2>Identité</h2><table>${row("Nom & prénom", `${f.nom.toUpperCase()} ${f.prenom}`)}${row("Naissance", `${fd(f.dateNaissance)} à ${f.lieuNaissance}`)}${row("Nationalité", f.nationalite)}${row("Profession", f.profession)}${row("Domicile", `${f.adresse}, ${f.ville}`)}${row("Boîte postale", f.bp)}</table>
<h2>Voyage & pièce</h2><table>${row("Provenance", f.venantDe)}${row("Destination", f.allantA)}${row("Motif", f.motif)}${row("Pièce", `${f.typePiece} ${f.numeroPiece}`)}${row("Délivrée", `${fd(f.delivreLe)} — ${f.delivreA}`)}</table>
<h2>Séjour</h2><table>${row("Établissement", f.hotel?.nomHotel)}${row("Période", `${fd(f.dateEntree)} → ${fd(f.dateSortie)}`)}${row("Chambre", f.chambreNumero)}${row("Transport", `${f.transport}${f.plaque ? " · " + f.plaque : ""}`)}${f.transmisReference ? row("Référence police", f.transmisReference) : ""}${f.refusMotif ? row("Motif du refus", f.refusMotif) : ""}</table>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
