import type { TrendPoint } from "@/lib/types";

/** Courbe SVG : fiches transmises (vert + aire) et nouvelles fiches (or, pointillés). */
export default function TrendChart({ data }: { data: TrendPoint[] }) {
  const W = 320, H = 110, P = 6;
  const max = Math.max(1, ...data.flatMap((d) => [d.created, d.transmitted]));
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = (k: "created" | "transmitted") => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  const total = data.reduce((s, d) => s + d.transmitted, 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Évolution sur ${data.length} jours : ${total} fiches transmises`} className="h-28 w-full max-w-xs">
      <path d={`${line("transmitted")} L${x(data.length - 1)},${H - P} L${x(0)},${H - P} Z`} className="fill-leaf" />
      <path d={line("created")} fill="none" strokeDasharray="3 3" strokeWidth="1.8" className="stroke-gold" />
      <path d={line("transmitted")} fill="none" strokeWidth="2.4" strokeLinejoin="round" className="stroke-mali" />
    </svg>
  );
}
