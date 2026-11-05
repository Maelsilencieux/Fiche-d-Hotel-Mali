import { TriangleAlert, ShieldCheck } from "lucide-react";
import type { Anomalie } from "@/lib/types";

export default function Anomalies({ items }: { items: Anomalie[] }) {
  return (
    <section aria-labelledby="anom" className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 id="anom" className="flex items-center gap-2 font-display text-lg font-bold text-mali-deep"><TriangleAlert size={17} className="text-rouge" /> Signalements</h2>
      {items.length === 0
        ? <p className="mt-3 flex items-center gap-2 rounded-xl bg-leaf p-3 text-xs text-mali"><ShieldCheck size={15} /> Aucune anomalie détectée.</p>
        : <ul className="mt-3 space-y-2.5">{items.map((a, i) => (
            <li key={i} className={`rounded-xl border-l-4 p-3 ${a.severity === "high" ? "border-rouge bg-rouge/5" : "border-gold bg-gold/10"}`}>
              <p className={`text-xs font-bold ${a.severity === "high" ? "text-rouge" : "text-amber-900"}`}>{a.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{a.detail}</p>
            </li>))}</ul>}
    </section>
  );
}
