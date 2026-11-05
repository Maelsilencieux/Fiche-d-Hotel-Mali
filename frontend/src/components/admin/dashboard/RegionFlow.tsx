"use client";
import { MapPinned } from "lucide-react";
import { nf } from "@/lib/format";
import type { RegionsData } from "@/lib/types";

const PERIODS = [{ d: 1, l: "Jour" }, { d: 7, l: "7 j" }, { d: 30, l: "30 j" }];
const BAR = ["bg-[#14B53A]", "bg-gold", "bg-rouge", "bg-mali", "bg-mali-deep"];

export default function RegionFlow({ data, days, setDays }: { data: RegionsData | null; days: number; setDays: (n: number) => void }) {
  const pct = data?.couverture.pct ?? 0;
  const R = 26, C = 2 * Math.PI * R;
  return (
    <section aria-labelledby="flux-reg" className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 id="flux-reg" className="flex items-center gap-2 font-display text-lg font-bold leading-tight text-mali-deep"><MapPinned size={18} className="text-mali" /> Flux par région &amp; commune</h2>
        <div className="text-right"><p className="font-mono text-[9px] uppercase text-muted">Total national</p><p className="font-display text-lg font-bold text-mali-deep">{nf(data?.total)}</p></div>
      </div>
      <div role="group" aria-label="Période" className="mt-3 inline-flex rounded-full bg-soft p-1">
        {PERIODS.map((p) => <button key={p.d} onClick={() => setDays(p.d)} aria-pressed={days === p.d} className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold ${days === p.d ? "bg-mali text-white" : "text-muted"}`}>{p.l}</button>)}
      </div>

      <ul className="mt-4 space-y-4">
        {data && data.regions.length === 0 && <li className="text-xs text-muted">Aucune fiche sur la période.</li>}
        {data?.regions.slice(0, 5).map((r, i) => (
          <li key={r.region}>
            <p className="flex items-center justify-between text-xs"><span className="font-bold text-mali-deep">{r.region}</span><span className="font-mono text-[11px] font-semibold text-mali">{r.pct} % <span className="text-muted">({nf(r.fiches)} fiches)</span></span></p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft"><i className={`block h-full rounded-full ${BAR[i % BAR.length]}`} style={{ width: `${Math.max(r.pct, r.fiches ? 3 : 0)}%` }} /></div>
            {r.communes.length > 0 && <p className="mt-1 text-[11px] text-muted">{r.communes.map((c) => c.nom).join(", ")}</p>}
          </li>))}
      </ul>

      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-leaf p-4">
        <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`Couverture du réseau : ${pct} %`} className="shrink-0 -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-white" />
          <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(pct / 100) * C} ${C}`} className="stroke-mali" />
        </svg>
        <div><p className="font-mono text-[9px] uppercase tracking-wide text-muted">Taux de couverture réseau</p>
          <p className="font-display text-2xl font-bold text-mali-deep">{pct} %</p>
          <p className="text-[11px] leading-snug text-muted">{data ? `${data.couverture.connectes} / ${data.couverture.total} établissements actifs sur ${data.couverture.fenetreJours} j` : "…"}</p></div>
      </div>
    </section>
  );
}
