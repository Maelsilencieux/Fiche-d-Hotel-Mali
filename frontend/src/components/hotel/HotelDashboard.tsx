"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Hourglass, CheckCircle2, ShieldAlert, ShieldCheck, RefreshCw, CalendarDays, Info } from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/session";
import type { Stats } from "@/lib/types";
import FichesTable from "./FichesTable";
import LotPanel from "./LotPanel";

const cards = [
  { key: "pending", label: "Statut pending", title: "Fiches en attente", note: "À réviser avant check-in", icon: Hourglass, line: "border-t-amber-500", tint: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  { key: "registered", label: "Statut registered", title: "Clients validés", note: "En chambre / prêts pour lot", icon: CheckCircle2, line: "border-t-ok", tint: "bg-emerald-50 text-ok", dot: "bg-ok" },
  { key: "refused", label: "Statut refused", title: "Fiches refusées", note: "Non-conformité signalée", icon: ShieldAlert, line: "border-t-red-500", tint: "bg-red-50 text-red-600", dot: "bg-red-500" },
  { key: "transmitted", label: "Statut transmitted", title: "Transmises aux autorités", note: "Quittance de transmission délivrée", icon: ShieldCheck, line: "border-t-mali", tint: "bg-leaf/60 text-mali", dot: "bg-mali" },
] as const;

/** Tableau de bord (limit = 6) et page « Demandes » (limit = 20) partagent ce composant. */
export default function HotelDashboard({ mode }: { mode: "dashboard" | "demandes" }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tick, setTick] = useState(0);
  const [lotTick, setLotTick] = useState(0);
  const [hotel, setHotel] = useState({ nom: "", rccm: "" });
  const loadStats = useCallback(() => { api<{ stats: Stats }>("/fiches/hotel/stats", undefined, "GET").then((r) => setStats(r.stats)).catch(() => {}); }, []);
  useEffect(() => { loadStats(); }, [loadStats, tick]);
  /** Une fiche a changé de statut → recharger stats + panneau du lot. */
  const changed = useCallback(() => { loadStats(); setLotTick((n) => n + 1); }, [loadStats]);
  useEffect(() => { const u = getUser(); setHotel({ nom: u?.nomHotel ?? "", rccm: u?.rccm ?? "" }); }, []);
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const dash = mode === "dashboard";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-4xl font-bold text-mali-deep">{dash ? "Tableau de bord" : "Demandes de fiches"}
            <span className="rounded-md bg-gold/25 px-2 py-1 font-mono text-[9px] font-semibold text-amber-800">Liaison active · Synchronisation 24h</span></h1>
          <p className="mt-2 text-xs text-muted">{dash ? "Bienvenue dans votre espace hôtel" : "Traitement réglementaire et contrôle d’identité préalable à la transmission aux autorités"}{hotel.nom && <> — <strong className="text-mali">{hotel.nom}</strong>{hotel.rccm && ` (RCCM ${hotel.rccm})`}</>}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-mali ring-1 ring-line"><CalendarDays size={13} /> {today} <span className="font-normal text-muted">(journée courante)</span></span>
          <button onClick={() => setTick((t) => t + 1)} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-mali ring-1 ring-line hover:bg-soft"><RefreshCw size={13} /> Actualiser les données</button>
        </div>
      </div>

      {dash && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ key, label, title, note, icon: I, line, tint, dot }) => (
            <li key={key} className={`rounded-xl border border-line border-t-4 bg-white/95 p-4 shadow-sm ${line}`}>
              <div className="flex items-start justify-between"><div><p className="font-mono text-[9px] text-muted">{label}</p><p className="mt-1 text-sm font-bold text-mali">{title}</p></div><span className={`grid h-9 w-9 place-items-center rounded-lg ${tint}`}><I size={17} /></span></div>
              <p className="mt-3 text-4xl font-extrabold text-mali">{stats ? stats[key] : "–"}</p>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted"><i className={`h-1.5 w-1.5 rounded-full ${dot}`} />{note}</p>
            </li>))}
        </ul>
      )}

      {dash && <LotPanel refreshKey={tick + lotTick} onChanged={() => setTick((t) => t + 1)} />}

      <section aria-labelledby="demandes-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="demandes-title" className="flex items-center gap-2 text-lg font-bold text-mali">{dash ? "Demandes de fiches récentes" : "Toutes les demandes"} {stats && <span className="rounded bg-soft px-2 py-0.5 font-mono text-[9px] font-semibold text-muted">{stats.totalClients} fiches au total</span>}</h2>
            <p className="text-xs text-muted">Traitement réglementaire et contrôle d’identité préalable à la transmission aux autorités</p></div>
          {dash && <Link href="/hotel/demandes" className="rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep">Voir toutes les demandes</Link>}
        </div>
        <FichesTable limit={dash ? 6 : 20} stats={stats} refreshKey={tick} onChanged={changed} />
      </section>

      <p className="flex items-start gap-3 rounded-xl bg-soft/90 p-4 text-[11px] leading-relaxed text-muted"><Info size={15} className="mt-0.5 shrink-0 text-mali" />
        <span><strong className="text-mali">Conformité stricte :</strong> seules les fiches au statut <strong>Validée</strong> peuvent être intégrées au lot de télé-transmission journalier, à sceller avant l’heure de clôture. Toute irrégularité documentaire doit être signalée aux autorités compétentes sans délai. <Link href="/#cadre-legal" className="ml-1 font-semibold text-mali underline">Consulter l’arrêté</Link></span></p>
    </div>
  );
}
