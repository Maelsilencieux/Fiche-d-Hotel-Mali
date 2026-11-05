import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { hm } from "@/lib/format";
import type { LotRow, LotsData, LotStatut } from "@/lib/types";

const STATUT: Record<LotStatut, { label: (h: number) => string; cls: string; row: string }> = {
  scelle: { label: () => "Transmis & scellé", cls: "bg-leaf text-mali", row: "" },
  en_cours: { label: () => "Brouillon en cours", cls: "bg-gold/30 text-amber-900", row: "bg-gold/10" },
  en_retard: { label: (h) => `En retard (clôture ${h} h)`, cls: "bg-rouge/10 text-rouge", row: "bg-rouge/5" },
};

export default function LotsTable({ data, loading }: { data: LotsData | null; loading: boolean }) {
  const rows: LotRow[] = data?.lots ?? [];
  const h = data?.clotureHeure ?? 23;
  return (
    <section aria-labelledby="lots" className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
        <div><h2 id="lots" className="flex items-center gap-2 font-display text-xl font-bold text-mali-deep"><Radio size={18} className="text-mali" /> Activité récente des télé-transmissions</h2>
          <p className="mt-1 text-xs text-muted">Journal temps réel des lots journaliers envoyés par les établissements.</p></div>
        <span className="rounded-full bg-soft px-3 py-1 font-mono text-[10px] text-muted">Clôture {h} h · heure du Mali</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-mali-deep font-mono text-[10px] uppercase tracking-wide text-white">
            <tr>{["Établissement", "Commune / ville", "Fiches", "Horodatage", "Statut du lot"].map((t) => <th key={t} scope="col" className="px-5 py-3.5 font-semibold">{t}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line text-xs">
            {loading && <tr><td colSpan={5} className="p-8 text-center text-muted">Chargement…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">Aucune transmission enregistrée aujourd’hui.</td></tr>}
            {rows.map((r) => { const st = STATUT[r.statut]; return (
              <tr key={r.hotelId} className={st.row}>
                <td className="px-5 py-3.5 font-bold text-mali-deep">{r.etablissement}</td>
                <td className="px-5 py-3.5 text-muted">{r.commune || "—"}</td>
                <td className="px-5 py-3.5 font-mono font-semibold">{r.fiches}</td>
                <td className="px-5 py-3.5 font-mono text-[11px]">{r.statut === "en_cours" ? <span className="font-semibold text-amber-800">En cours</span> : r.statut === "en_retard" ? <span className="font-semibold text-rouge">En attente</span> : hm(r.horodatage)}</td>
                <td className="px-5 py-3.5"><span className={`inline-block whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold ${st.cls}`}>● {st.label(h)}</span></td>
              </tr>); })}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap items-center justify-between gap-3 bg-soft/70 px-6 py-3.5 font-mono text-[10px] text-muted">
        <span>Affichage des {rows.length} dernières transmissions · {data?.totalScelles ?? 0} lots scellés sur {data?.totalReseau ?? 0} établissements du réseau</span>
        <Link href="/admin/hotels" className="flex items-center gap-2 text-xs font-bold text-mali">Accéder au registre des établissements <ArrowRight size={14} /></Link>
      </p>
    </section>
  );
}
