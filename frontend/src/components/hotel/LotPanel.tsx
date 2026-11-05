"use client";
import { useCallback, useEffect, useState } from "react";
import { PackageCheck, Send, Lock, Loader2, Clock, Fingerprint } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { hm } from "@/lib/format";
import type { LotJour } from "@/lib/types";

const STATUT = {
  aucun: { label: "Aucune activité", cls: "bg-soft text-muted" },
  en_cours: { label: "Lot en cours", cls: "bg-gold/30 text-amber-900" },
  scelle: { label: "Lot scellé", cls: "bg-leaf text-mali" },
  en_retard: { label: "En retard", cls: "bg-rouge/10 text-rouge" },
} as const;

/** Temps restant avant l'heure de clôture (heure du Mali = UTC). */
function remaining(h: number) {
  const now = new Date(); const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h));
  const m = Math.round((+end - +now) / 60000);
  return m <= 0 ? null : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}

/** Situation de télé-transmission du jour : transmettre les fiches validées, puis sceller le lot. */
export default function LotPanel({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [lot, setLot] = useState<LotJour | null>(null);
  const [busy, setBusy] = useState<"" | "send" | "seal">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [, setTick] = useState(0);

  const load = useCallback(() => { api<LotJour>("/fiches/lots/aujourdhui", undefined, "GET").then(setLot).catch((e: ApiError) => setMsg({ ok: false, text: e.message })); }, []);
  useEffect(load, [load, refreshKey]);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 60000); return () => clearInterval(t); }, []);

  async function run(kind: "send" | "seal") {
    setBusy(kind); setMsg(null);
    try {
      const r = await api<{ message: string }>(kind === "send" ? "/fiches/transmettre-lot" : "/fiches/lots/aujourdhui/sceller", kind === "send" ? {} : undefined, "PATCH");
      setMsg({ ok: true, text: r.message }); load(); onChanged();
    } catch (e) { setMsg({ ok: false, text: (e as ApiError).message }); } finally { setBusy(""); }
  }

  const st = STATUT[lot?.statut ?? "aucun"];
  const open = lot?.lots.some((l) => l.statut === "en_cours");
  const left = lot ? remaining(lot.clotureHeure) : null;

  return (
    <section aria-labelledby="lot-title" className="bg-bogolan-dark relative overflow-hidden rounded-3xl bg-mali-deep p-6 text-white shadow-lg">
      <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="lot-title" className="flex items-center gap-2 font-display text-xl font-bold"><PackageCheck size={20} className="text-gold" /> Lot de télé-transmission du jour</h2>
            <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold ${st.cls}`}>● {st.label}</span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-white/75"><Clock size={13} className="text-gold" />
            {lot ? (lot.clotureAtteinte ? `Clôture de ${lot.clotureHeure} h dépassée` : left ? `Clôture à ${lot.clotureHeure} h · il reste ${left}` : "") : "Chargement…"}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/25 p-4"><dt className="font-mono text-[9px] uppercase tracking-wide text-white/60">Validées à transmettre</dt><dd className="font-display text-3xl font-bold text-gold">{lot?.aTransmettre ?? "–"}</dd></div>
            <div className="rounded-2xl bg-black/25 p-4"><dt className="font-mono text-[9px] uppercase tracking-wide text-white/60">Transmises aujourd’hui</dt><dd className="font-display text-3xl font-bold">{lot?.transmisAujourdhui ?? "–"}</dd></div>
          </dl>
        </div>

        <div className="flex flex-col justify-between gap-4">
          {lot && lot.lots.length > 0 && (
            <ul className="space-y-2">{lot.lots.map((l) => (
              <li key={l._id} className="rounded-xl bg-black/25 p-3 text-[11px]">
                <p className="flex items-center justify-between font-mono"><span className="font-bold">{l.reference}</span><span className={l.statut === "scelle" ? "text-emerald-300" : "text-gold"}>{l.count} fiche{l.count > 1 ? "s" : ""} · {l.statut === "scelle" ? `scellé ${hm(l.scelleAt)}` : "ouvert"}</span></p>
                {l.empreinte && <p className="mt-1 flex items-center gap-1.5 truncate font-mono text-[9px] text-white/55" title={l.empreinte}><Fingerprint size={10} /> SHA-256 {l.empreinte.slice(0, 20)}…</p>}
              </li>))}</ul>)}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => run("send")} disabled={!!busy || !lot?.aTransmettre} className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-mali-deep hover:bg-white disabled:opacity-50">
              {busy === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Transmettre les {lot?.aTransmettre ?? 0} fiche(s) validée(s)</button>
            <button onClick={() => run("seal")} disabled={!!busy || !open} className="flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40">
              {busy === "seal" ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Sceller le lot</button>
          </div>
        </div>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`relative mt-4 rounded-xl px-4 py-2.5 text-xs ${msg.ok ? "bg-emerald-400/20 text-emerald-200" : "bg-rouge/30 text-white"}`}>{msg.text}</p>}
    </section>
  );
}
