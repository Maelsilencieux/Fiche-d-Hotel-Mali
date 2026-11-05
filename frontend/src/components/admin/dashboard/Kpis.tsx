import { IdCard, PackageCheck, Globe2, TriangleAlert, TrendingUp, TrendingDown } from "lucide-react";
import { nf } from "@/lib/format";
import type { Jour } from "@/lib/types";

/** Quatre indicateurs du jour — chaque carte porte une des couleurs du drapeau. */
export default function Kpis({ jour }: { jour: Jour | null }) {
  const v = jour?.fiches.variationPct;
  const cards = [
    { label: "Fiches enregistrées aujourd’hui", value: nf(jour?.fiches.aujourdhui), icon: IdCard, stripe: "bg-[#14B53A]", tint: "bg-[#14B53A]/15 text-mali",
      foot: v == null ? <span className="text-muted">Pas de référence hier</span> : <span className={`inline-flex items-center gap-1 font-semibold ${v >= 0 ? "text-ok" : "text-rouge"}`}>{v >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{v > 0 ? "+" : ""}{v} % vs hier</span>, sub: jour ? `${nf(jour.fiches.hier)} hier` : "" },
    { label: "Lots scellés", value: jour ? <>{nf(jour.lots.scelles)}<span className="ml-1 text-xl font-medium text-muted">/ {nf(jour.lots.total)}</span></> : "–", icon: PackageCheck, stripe: "bg-gold", tint: "bg-gold/30 text-amber-900",
      foot: <span className="inline-flex rounded-full bg-gold/30 px-2 py-0.5 font-semibold text-amber-900">{jour?.lots.conformitePct ?? 0} % de conformité</span>, sub: jour ? `${jour.lots.enCours} en cours` : "" },
    { label: "Voyageurs internationaux", value: nf(jour?.internationaux.aujourdhui), icon: Globe2, stripe: "bg-mali-deep", tint: "bg-mali-deep text-white",
      foot: <span className="inline-flex rounded-full bg-leaf px-2 py-0.5 font-semibold text-mali">{jour?.internationaux.pctVolume ?? 0} % du volume</span>, sub: "nationalité ≠ malienne" },
    { label: "Signalements & anomalies", value: nf(jour?.signalements.total), icon: TriangleAlert, stripe: "bg-rouge", tint: "bg-rouge/10 text-rouge", danger: true,
      foot: (jour?.signalements.actionRequise ?? 0) > 0 ? <span className="inline-flex rounded-full bg-rouge/10 px-2 py-0.5 font-semibold text-rouge">{jour!.signalements.actionRequise} action(s) requise(s)</span> : <span className="text-ok">Rien à signaler</span>, sub: "" },
  ];
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: I, stripe, tint, foot, sub, danger }) => (
        <li key={label} className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 pt-6 shadow-sm">
          <i className={`absolute inset-x-0 top-0 h-1.5 ${stripe}`} />
          <div className="flex items-start justify-between gap-2">
            <p className={`font-mono text-[10px] uppercase leading-relaxed tracking-wide ${danger ? "text-rouge" : "text-muted"}`}>{label}</p>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}><I size={18} /></span>
          </div>
          <p className="mt-2 font-display text-[2.6rem] font-bold leading-none text-mali-deep">{value}</p>
          <p className="mt-4 flex items-center justify-between gap-2 text-[11px]">{foot}<span className="font-mono text-[10px] text-muted">{sub}</span></p>
        </li>))}
    </ul>
  );
}
