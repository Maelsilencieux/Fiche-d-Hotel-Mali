"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Building2, Eye, ArrowRight, ClipboardCheck, Activity, UserRoundPlus, Send, Star, TriangleAlert, Loader2, Server, ShieldCheck, IdCard, CalendarDays } from "lucide-react";
import { api, apiBlob, type ApiError } from "@/lib/api";
import { dt, nf } from "@/lib/format";
import type { ActivityEvent, AdminHotel, Anomalie, Health, Jour, LotsData, Overview, RegionsData, TrendPoint } from "@/lib/types";
import HotelReviewDialog from "./HotelReviewDialog";
import TrendChart from "./TrendChart";
import Kpis from "./dashboard/Kpis";
import LotsTable from "./dashboard/LotsTable";
import RegionFlow from "./dashboard/RegionFlow";
import Anomalies from "./dashboard/Anomalies";
import Reminder from "./dashboard/Reminder";

const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000)); return m < 1 ? "À l’instant" : m < 60 ? `Il y a ${m} min` : m < 1440 ? `Il y a ${Math.floor(m / 60)} h` : `Il y a ${Math.floor(m / 1440)} j`; };
const uptime = (s: number) => (s < 3600 ? `${Math.floor(s / 60)} min` : s < 86400 ? `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min` : `${Math.floor(s / 86400)} j ${Math.floor((s % 86400) / 3600)} h`);
const evIcon = { fiche_created: IdCard, fiche_transmitted: Send, fiche_refused: TriangleAlert, hotel_request: Star, user_created: UserRoundPlus } as const;

export default function AdminDashboard() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [jour, setJour] = useState<Jour | null>(null);
  const [lots, setLots] = useState<LotsData | null>(null);
  const [regions, setRegions] = useState<RegionsData | null>(null); const [days, setDays] = useState(30);
  const [anomalies, setAnomalies] = useState<Anomalie[]>([]);
  const [hotels, setHotels] = useState<AdminHotel[]>([]); const [hotelsTotal, setHotelsTotal] = useState(0);
  const [events, setEvents] = useState<ActivityEvent[]>([]); const [evLimit, setEvLimit] = useState(5);
  const [trend, setTrend] = useState<{ series: TrendPoint[]; conformite: { rate: number | null; windowDays: number } } | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState(""); const [review, setReview] = useState<AdminHotel | null>(null); const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadAll = useCallback(() => {
    Promise.all([
      api<Overview>("/admin/overview", undefined, "GET").then(setOv),
      api<Jour>("/admin/jour", undefined, "GET").then(setJour),
      api<LotsData>("/admin/lots?limit=6", undefined, "GET").then(setLots),
      api<{ anomalies: Anomalie[] }>("/admin/anomalies?limit=5", undefined, "GET").then((r) => setAnomalies(r.anomalies)),
      api<{ hotels: AdminHotel[]; total: number }>("/admin/hotels?statut=pending&limit=5", undefined, "GET").then((r) => { setHotels(r.hotels); setHotelsTotal(r.total); }),
      api<typeof trend & object>("/admin/trend?days=14", undefined, "GET").then((r) => setTrend(r as any)),
      api<Health>("/admin/health", undefined, "GET").then(setHealth),
    ]).then(() => setErr("")).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { loadAll(); const t = setInterval(loadAll, 60000); return () => clearInterval(t); }, [loadAll]);
  useEffect(() => { api<{ events: ActivityEvent[] }>(`/admin/activity?limit=${evLimit}`, undefined, "GET").then((r) => setEvents(r.events)).catch(() => {}); }, [evLimit]);
  useEffect(() => { api<RegionsData>(`/admin/regions?days=${days}`, undefined, "GET").then(setRegions).catch(() => {}); }, [days]);

  /** Rapport consolidé : CSV généré côté serveur (une ligne par établissement + total national). */
  async function exportReport() {
    setExporting(true);
    try {
      const blob = await apiBlob("/admin/rapport-consolide");
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rapport-consolide-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) { setErr((e as ApiError).message); } finally { setExporting(false); }
  }

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const status = ov ? [
    { t: "En attente", v: ov.fiches.pending, p: ov.fiches.pct.pending, dot: "bg-gold", tone: "bg-gold/30 text-amber-900" },
    { t: "Validées par l’hôtel", v: ov.fiches.registered, p: ov.fiches.pct.registered, dot: "bg-ok", tone: "bg-leaf text-mali" },
    { t: "Transmises", v: ov.fiches.transmitted, p: ov.fiches.pct.transmitted, dot: "bg-mali-deep", tone: "bg-mali-deep text-white" },
    { t: "Refusées / signalées", v: ov.fiches.refused, p: ov.fiches.pct.refused, dot: "bg-rouge", tone: "bg-rouge/10 text-rouge" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-mali-deep px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white"><i className="h-1.5 w-1.5 rounded-full bg-gold" /> Supervision nationale · Ministère de la Sécurité et de la Protection civile</p>
          <h1 className="mt-3 text-4xl font-bold text-mali-deep md:text-[2.8rem]">Tableau de bord de supervision</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Suivi en temps réel des enregistrements hôteliers, des lots de télé-transmission et de la conformité réglementaire au Mali.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold capitalize text-mali-deep"><CalendarDays size={14} /> {today}</span>
          <button onClick={exportReport} disabled={exporting} className="flex items-center gap-2 rounded-xl bg-mali px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-mali-deep disabled:opacity-60">{exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Rapport consolidé</button>
        </div>
      </div>
      {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-rouge">{err}</p>}

      <Kpis jour={jour} />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {status.map(({ t, v, p, dot, tone }) => (
          <li key={t} className="flex items-center justify-between rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
            <div><p className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted"><i className={`h-2 w-2 rounded-full ${dot}`} />{t}</p><p className="mt-1 font-display text-2xl font-bold text-mali-deep">{nf(v)}</p></div>
            <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${tone}`}>{p} %</span>
          </li>))}
      </ul>

      <div className="grid items-start gap-6 xl:grid-cols-[1.75fr_1fr]">
        <div className="space-y-6">
          <LotsTable data={lots} loading={loading} />

          <section aria-labelledby="appr" className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="appr" className="flex items-center gap-2 font-display text-xl font-bold text-mali-deep"><ClipboardCheck size={18} className="text-mali" /> Demandes d’approbation des hôtels</h2>
              <p className="mt-1 max-w-md text-xs text-muted">Examinez les dossiers de raccordement avant homologation dans le réseau SafeStay Mali.</p></div>
              <span className="rounded-full bg-soft px-3 py-1 font-mono text-[10px] text-muted">{hotelsTotal} dossier{hotelsTotal > 1 ? "s" : ""} en attente</span></div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line"><table className="w-full min-w-[640px] text-left">
              <thead className="bg-soft font-mono text-[10px] uppercase text-muted"><tr>{["Établissement", "Contact", "Dépôt", "Statut", "Action"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line text-[11px]">
                {loading && <tr><td colSpan={5} className="p-8 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement…</td></tr>}
                {!loading && hotels.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">Aucun dossier en attente d’approbation.</td></tr>}
                {hotels.map((h) => (
                  <tr key={h._id}>
                    <td className="px-4 py-3"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf text-mali"><Building2 size={15} /></span><span><span className="block text-xs font-bold text-mali-deep">{h.nomHotel}</span><span className="block font-mono text-[10px] text-muted">{h.profile?.etoiles ? `${h.profile.etoiles} étoiles · ` : ""}{[h.profile?.commune, h.villeHotel ?? h.profile?.ville].filter(Boolean).join(", ")}</span></span></span></td>
                    <td className="px-4 py-3"><span className="block text-xs font-semibold text-mali-deep">{h.email}</span><span className="block font-mono text-[10px] text-muted">{h.telephone}</span></td>
                    <td className="px-4 py-3 font-mono text-[10px]">{dt(h.createdAt)}</td>
                    <td className="px-4 py-3"><span className="inline-block rounded-full bg-gold/30 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-900">● En attente</span></td>
                    <td className="px-4 py-3"><button onClick={() => setReview(h)} className="flex items-center gap-1.5 rounded-lg bg-leaf px-3 py-2 font-semibold text-mali hover:bg-mali hover:text-white"><Eye size={13} /> Consulter</button></td>
                  </tr>))}
              </tbody></table></div>
            <p className="mt-4 flex justify-end"><Link href="/admin/hotels" className="flex items-center gap-2 text-xs font-bold text-mali">Voir toutes les demandes ({hotelsTotal}) <ArrowRight size={14} /></Link></p>
          </section>

          <section aria-labelledby="flux" className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="max-w-md"><p className="font-mono text-[10px] uppercase text-muted">Contrôle des flux territoriaux</p><h2 id="flux" className="mt-1 font-display text-lg font-bold text-mali-deep">Taux de transmission sous 24 h</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">{trend?.conformite.rate != null ? <><strong className="text-mali">{trend.conformite.rate} %</strong> des fiches validées de ces {trend.conformite.windowDays} derniers jours ont été transmises dans les 24 h suivant leur dépôt.</> : "Pas encore assez de fiches validées pour calculer le taux de transmission sous 24 h."}</p>
              <p className="mt-3 flex gap-4 font-mono text-[10px] text-muted"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-mali" />Transmissions</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gold" />Nouvelles fiches</span></p></div>
            {trend && <TrendChart data={trend.series} />}
          </section>
        </div>

        <div className="space-y-6">
          <RegionFlow data={regions} days={days} setDays={setDays} />
          <Anomalies items={anomalies} />
          <Reminder heure={jour?.clotureHeure ?? 23} />

          <section id="activite" aria-labelledby="act" className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><h2 id="act" className="flex items-center gap-2 font-display text-lg font-bold text-mali-deep"><Activity size={17} className="text-mali" /> Journal d’audit</h2><span className="flex items-center gap-1.5 font-mono text-[10px] text-muted"><i className="h-1.5 w-1.5 rounded-full bg-ok" />Direct</span></div>
            <ul className="mt-4 space-y-4">
              {events.length === 0 && <li className="text-xs text-muted">Aucune activité enregistrée.</li>}
              {events.map((e, i) => { const I = evIcon[e.type]; return (
                <li key={i} className="flex gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${e.alert ? "bg-rouge/10 text-rouge" : e.type === "fiche_transmitted" ? "bg-mali text-white" : "bg-soft text-mali"}`}><I size={15} /></span>
                  <div><p className={`text-sm font-bold ${e.alert ? "text-rouge" : "text-mali-deep"}`}>{e.title}</p><p className="text-[11px] leading-snug text-muted">{e.detail}</p><p className="mt-0.5 font-mono text-[10px] text-muted/80">{ago(e.at)}</p></div></li>); })}
            </ul>
            <button onClick={() => setEvLimit(evLimit === 5 ? 20 : 5)} className="mt-4 w-full rounded-xl bg-soft py-2.5 font-mono text-[10px] text-mali hover:bg-leaf">{evLimit === 5 ? "Consulter le journal complet" : "Réduire le journal"}</button>
          </section>

          <section aria-labelledby="infra" className="bg-bogolan-dark rounded-3xl bg-mali-deep p-6 text-white shadow-lg">
            <div className="flex items-start justify-between"><p className="font-mono text-[10px] uppercase text-white/60">Infrastructure réseau</p>{health && <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono text-[10px] text-emerald-300">En ligne depuis {uptime(health.uptimeSeconds)}</span>}</div>
            <h2 id="infra" className="mt-2 font-display text-xl font-bold leading-snug">État des services</h2>
            <ul className="mt-4 space-y-2.5 font-mono text-[11px]">
              <li className="flex items-center justify-between"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${health?.db.ok ? "bg-emerald-400" : "bg-rouge"}`} />Base de données</span><span>{health ? (health.db.ok ? "Connectée" : "Indisponible") : "…"}</span></li>
              <li className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-gold" />Latence</span><span>{health?.db.latencyMs != null ? `${health.db.latencyMs} ms` : "–"}</span></li>
              <li className="flex items-center justify-between"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${health?.email.configured ? "bg-emerald-400" : "bg-gold"}`} />Service e-mail</span><span>{health ? (health.email.configured ? "Configuré" : "Non configuré") : "…"}</span></li>
            </ul>
            <p className="mt-5 flex items-center justify-between font-mono text-[10px] text-white/60"><span className="flex items-center gap-1.5"><Server size={11} />Environnement : {health?.env ?? "…"}</span><ShieldCheck size={14} /></p>
          </section>
        </div>
      </div>
      {review && <HotelReviewDialog hotel={review} onClose={() => setReview(null)} onDone={loadAll} />}
    </div>
  );
}
