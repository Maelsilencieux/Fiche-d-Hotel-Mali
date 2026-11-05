"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Download, CalendarDays, FilterX, RotateCcw, Users, BedDouble, FileClock, BadgeCheck, Loader2 } from "lucide-react";
import { d as fd } from "@/lib/format";
import { getUser } from "@/lib/session";
import type { Fiche, Statut } from "@/lib/types";
import FicheDialog from "./FicheDialog";
import { Avatar, Pager, StatutPill } from "./parts";
import { exportCsv, matches } from "./exports";
import { useAllFiches, useStats } from "./useAllFiches";

const PER = 8;
const VALIDATED: Statut[] = ["registered", "transmitted"];
const today = () => new Date().toISOString().slice(0, 10);
const sejour = (f: Fiche) => { const t = today(), a = f.dateEntree.slice(0, 10), b = f.dateSortie.slice(0, 10); return t < a ? "future" : t > b ? "done" : "now"; };

/** Clients = fiches validées par l'hôtel (statuts registered + transmitted). */
export default function ClientsList() {
  const { rows, loading, err, reload } = useAllFiches(VALIDATED);
  const { stats, reload: reloadStats } = useStats();
  const [q, setQ] = useState(""); const [tab, setTab] = useState<"" | Statut>(""); const [day, setDay] = useState(""); const [state, setState] = useState("");
  const [page, setPage] = useState(1); const [open, setOpen] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const hotel = getUser()?.nomHotel ?? "";

  const filtered = useMemo(() => rows.filter((f) => (!tab || f.statut === tab) && matches(f, q)
    && (!day || (f.dateEntree.slice(0, 10) <= day && f.dateSortie.slice(0, 10) >= day)) && (!state || sejour(f) === state)), [rows, tab, q, day, state]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER)); const p = Math.min(page, pages);
  const slice = filtered.slice((p - 1) * PER, p * PER);
  const reset = () => { setQ(""); setTab(""); setDay(""); setState(""); setPage(1); };
  const validated = stats ? stats.registered + stats.transmitted : rows.length;
  const capacity = stats && stats.totalChambres ? Math.round((stats.chambresOccupees / stats.totalChambres) * 100) : null;

  const cards = [
    { t: "Nombre total de clients enregistrés", v: validated, icon: Users, line: "border-t-mali", tint: "bg-leaf/60 text-mali", dot: "bg-mali", note: "Fiches validées par l’établissement", extra: "" },
    { t: "Clients actuellement en séjour", v: stats?.chambresOccupees ?? "–", icon: BedDouble, line: "border-t-ok", tint: "bg-emerald-50 text-ok", dot: "bg-ok", note: "Présence physique en chambre", extra: capacity !== null ? `Capacité : ${capacity}%` : "" },
    { t: "Validées en attente de transmission", v: stats?.registered ?? "–", icon: FileClock, line: "border-t-gold", tint: "bg-leaf/60 text-mali", dot: "bg-mali", note: "À intégrer au prochain lot", extra: "Clôture 23:59" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-mali">Clients <span className="rounded-md bg-gold/25 px-2 py-1 font-mono text-[10px] font-semibold text-amber-800">{validated} clients validés</span></h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">Consultez et retrouvez les clients dont les fiches ont été validées par votre établissement.</p>
          <p className="mt-2 flex items-center gap-2 text-[11px] text-muted"><BadgeCheck size={14} className="text-mali" /> Établissement homologué : <strong className="text-mali">{hotel}</strong></p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-right font-mono text-[10px] text-muted">Date d’opération<span className="block font-bold text-mali">{now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span></p>
          <button onClick={() => exportCsv(filtered, "clients")} className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><Download size={14} /> Exporter la liste (CSV)</button>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-3">
        {cards.map(({ t, v, icon: I, line, tint, dot, note, extra }) => (
          <li key={t} className={`rounded-xl border border-line border-t-4 bg-white/95 p-5 shadow-sm ${line}`}>
            <div className="flex items-start justify-between gap-2"><p className="font-mono text-[10px] uppercase leading-relaxed text-muted">{t}</p><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tint}`}><I size={18} /></span></div>
            <p className="mt-1 text-4xl font-extrabold text-mali">{v}</p>
            <p className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted"><span className="flex items-center gap-1.5"><i className={`h-1.5 w-1.5 rounded-full ${dot}`} />{note}</span><span className="font-mono text-[9px]">{extra}</span></p>
          </li>))}
      </ul>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] flex-[2] items-center gap-2 rounded-lg bg-soft/70 px-3 py-3"><Search size={15} className="text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher par nom, prénom ou référence (SS-2026…)" aria-label="Rechercher un client" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
          <label className="flex flex-1 items-center gap-2 rounded-lg bg-soft/70 px-3 py-3 text-xs text-muted"><CalendarDays size={15} /><input type="date" value={day} onChange={(e) => { setDay(e.target.value); setPage(1); }} aria-label="Période de séjour : présent le" title="Clients présents à cette date" className="w-full bg-transparent outline-none" /></label>
          <select value={state} onChange={(e) => { setState(e.target.value); setPage(1); }} aria-label="État du séjour" className="rounded-lg bg-soft/70 px-3 py-3 text-xs text-ink outline-none">
            <option value="">Toutes les fiches</option><option value="now">En séjour actuellement</option><option value="done">Séjour terminé</option><option value="future">Séjour à venir</option></select>
          <button onClick={reset} aria-label="Effacer les filtres" className="grid h-11 w-11 place-items-center rounded-lg bg-soft text-mali hover:bg-soft/70"><FilterX size={16} /></button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {[{ id: "", label: "Toutes", n: validated }, { id: "registered", label: "Validées", n: stats?.registered ?? 0 }, { id: "transmitted", label: "Transmises à la police", n: stats?.transmitted ?? 0 }].map((c) => (
              <button key={c.label} aria-pressed={tab === c.id} onClick={() => { setTab(c.id as "" | Statut); setPage(1); }} className={`rounded-md px-3 py-2 text-[11px] font-semibold ${tab === c.id ? "bg-mali text-white" : "bg-soft text-muted hover:text-mali"}`}>{c.label} ({c.n})</button>))}
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 font-mono text-[11px] text-mali"><RotateCcw size={13} /> Réinitialiser</button>
        </div>
      </div>

      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-soft font-mono text-[10px] uppercase text-muted"><tr>{["Réf. fiche", "Client", "Nationalité", "Date d’entrée", "Date de sortie", "Chambre", "Statut", "Action"].map((h) => <th key={h} scope="col" className="px-4 py-3.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line text-[11px]">
              {loading && <tr><td colSpan={8} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des clients…</td></tr>}
              {!loading && slice.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted">Aucun client ne correspond à ces critères.</td></tr>}
              {!loading && slice.map((f) => (
                <tr key={f._id} className="hover:bg-soft/40">
                  <td className="px-4 py-3.5"><span className="rounded bg-soft px-2 py-1 font-mono font-bold text-mali">{f.reference}</span></td>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Avatar f={f} tone="bg-mali text-white" /><span><span className="block text-xs font-bold text-mali">{f.prenom} {f.nom.toUpperCase()}</span><span className="block font-mono text-[10px] text-muted">{f.typePiece} {f.numeroPiece}</span></span></div></td>
                  <td className="px-4 py-3.5 text-xs">{f.flagEmoji} {f.nationalite}</td>
                  <td className="px-4 py-3.5 font-mono">{fd(f.dateEntree)}</td><td className="px-4 py-3.5 font-mono">{fd(f.dateSortie)}</td>
                  <td className="px-4 py-3.5"><span className="rounded bg-gold/25 px-2 py-1 font-mono font-bold text-mali">Ch. {f.chambreNumero}</span></td>
                  <td className="px-4 py-3.5"><StatutPill s={f.statut} /></td>
                  <td className="px-4 py-3.5"><button onClick={() => setOpen(f._id)} className="flex items-center gap-1.5 rounded-md bg-soft px-3 py-2 font-semibold text-mali hover:bg-mali hover:text-white"><Eye size={13} /> Consulter</button></td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <Pager page={p} pages={pages} setPage={setPage} from={filtered.length ? (p - 1) * PER + 1 : 0} to={Math.min(p * PER, filtered.length)} total={filtered.length} noun="clients" />
      </div>
      {open && <FicheDialog id={open} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadStats(); }} />}
    </div>
  );
}
