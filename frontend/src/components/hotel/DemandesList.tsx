"use client";
import { useMemo, useState } from "react";
import { Search, RotateCcw, Eye, Check, X, Send, Hourglass, ShieldCheck, ShieldAlert, KeyRound, Loader2, FileSpreadsheet, FileDown, Scale } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { d as fd, dt, nuits } from "@/lib/format";
import { getUser } from "@/lib/session";
import type { Fiche, Statut } from "@/lib/types";
import FicheDialog from "./FicheDialog";
import { Avatar, Pager, StatutPill, Tag } from "./parts";
import { exportCsv, matches, printBordereau } from "./exports";
import { useAllFiches, useStats } from "./useAllFiches";

const PER = 6;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const cards = [
  { k: "pending", t: "En attente (pending)", icon: Hourglass, line: "border-t-amber-500", tint: "bg-amber-50 text-amber-600", note: "À réviser avant check-in", tag: "Action requise", tagTone: "bg-amber-50 text-amber-700" },
  { k: "registered", t: "Validées (registered)", icon: KeyRound, line: "border-t-ok", tint: "bg-emerald-50 text-ok", note: "Prêtes pour attribution chambre", tag: "Conformes", tagTone: "bg-emerald-50 text-ok" },
  { k: "refused", t: "Refusées (refused)", icon: ShieldAlert, line: "border-t-red-500", tint: "bg-red-50 text-red-600", note: "Non-conformité signalée", tag: "Bloquées", tagTone: "bg-red-50 text-red-600" },
  { k: "transmitted", t: "Transmises à la police (transmitted)", icon: ShieldCheck, line: "border-t-mali", tint: "bg-leaf/60 text-mali", note: "Quittance certifiée", tag: "Archivées", tagTone: "bg-leaf text-mali" },
] as const;
const chips: { id: "" | Statut; label: string; key: string; dot: string }[] = [
  { id: "", label: "Toutes", key: "totalClients", dot: "" }, { id: "pending", label: "En attente", key: "pending", dot: "bg-amber-500" }, { id: "registered", label: "Validées", key: "registered", dot: "bg-ok" },
  { id: "refused", label: "Refusées", key: "refused", dot: "bg-red-500" }, { id: "transmitted", label: "Transmises à la police", key: "transmitted", dot: "bg-mali" },
];

export default function DemandesList() {
  const { rows, loading, err, reload, setErr } = useAllFiches();
  const { stats, reload: reloadStats } = useStats();
  const [statut, setStatut] = useState<"" | Statut>("");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<"" | "today" | "7d" | "custom">("");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ id: string; refuse: boolean } | null>(null);
  const [busy, setBusy] = useState("");
  const hotel = getUser()?.nomHotel ?? "Établissement";

  const filtered = useMemo(() => {
    const today = iso(new Date()), week = iso(new Date(Date.now() - 6 * 86400000));
    return rows.filter((f) => {
      const day = f.createdAt.slice(0, 10);
      if (statut && f.statut !== statut) return false;
      if (!matches(f, q)) return false;
      if (period === "today" && day !== today) return false;
      if (period === "7d" && day < week) return false;
      if (period === "custom" && ((from && day < from) || (to && day > to))) return false;
      return true;
    });
  }, [rows, statut, q, period, from, to]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER)); const p = Math.min(page, pages);
  const slice = filtered.slice((p - 1) * PER, p * PER);
  const changed = () => { reload(); reloadStats(); };
  const reset = () => { setStatut(""); setQ(""); setPeriod(""); setFrom(""); setTo(""); setPage(1); };

  async function quick(id: string, action: string) {
    setBusy(id); setErr("");
    try { await api(`/fiches/${id}/${action}`, undefined, "PATCH"); changed(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); }
  }
  const lead = (s: Statut) => ({ pending: <Hourglass size={14} className="text-amber-600" />, registered: <Check size={14} className="text-ok" />, refused: <X size={14} className="text-red-600" />, transmitted: <ShieldCheck size={14} className="text-mali" /> }[s]);
  const periods = [{ id: "today", label: "Aujourd’hui" }, { id: "7d", label: "7 derniers jours" }, { id: "custom", label: "Période personnalisée" }] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-mali">Demandes de fiches {stats && <span className="rounded-md bg-gold/25 px-2 py-1 font-mono text-[10px] font-semibold text-amber-800">● {stats.totalClients} demandes au total</span>}</h1>
          <p className="mt-2 inline-block rounded bg-soft px-2 py-0.5 font-mono text-[10px] text-muted">Aujourd’hui : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">Consultez les demandes, vérifiez les informations et les pièces d’identité, puis gérez les fiches soumises à votre établissement.</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 font-mono text-[10px] text-mali"><span>{hotel}</span><span className="text-ok">● Flux Police Direct ML Actif</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportCsv(filtered, "demandes")} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><FileSpreadsheet size={14} /> Exporter (.csv)</button>
          <button onClick={() => printBordereau(rows.filter((f) => f.statut === "registered"), hotel)} className="flex items-center gap-2 rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep"><FileDown size={14} /> Télécharger bordereau journalier (PDF)</button>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ k, t, icon: I, line, tint, note, tag, tagTone }) => (
          <li key={k} className={`rounded-xl border border-line border-t-4 bg-white/95 p-4 shadow-sm ${line}`}>
            <div className="flex items-start justify-between gap-2"><p className="font-mono text-[9px] uppercase text-muted">{t}</p><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tint}`}><I size={16} /></span></div>
            <p className="mt-1 text-4xl font-extrabold text-mali">{stats ? stats[k] : "–"}</p>
            <p className="mt-3 flex items-center justify-between gap-2 text-[10px] text-muted">{note}<Tag tone={tagTone}>{tag}</Tag></p>
          </li>))}
      </ul>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg bg-soft/70 px-3 py-2.5"><Search size={15} className="text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher par nom, prénom ou référence (ex: SS-2026-00142)" aria-label="Rechercher une demande" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
          <div className="flex rounded-lg bg-soft p-1" role="group" aria-label="Période">
            {periods.map((x) => <button key={x.id} aria-pressed={period === x.id} onClick={() => { setPeriod(period === x.id ? "" : x.id); setPage(1); }} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${period === x.id ? "bg-white text-mali shadow-sm" : "text-muted hover:text-mali"}`}>{x.label}</button>)}
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 px-2 font-mono text-[11px] text-muted hover:text-mali"><RotateCcw size={13} /> Réinitialiser</button>
        </div>
        {period === "custom" && <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">Du <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="Date de début" className="rounded-md border border-line bg-soft/60 px-2 py-1.5" /> au <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="Date de fin" className="rounded-md border border-line bg-soft/60 px-2 py-1.5" /></div>}
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => <button key={c.label} aria-pressed={statut === c.id} onClick={() => { setStatut(c.id); setPage(1); }} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] font-semibold ${statut === c.id ? "bg-mali text-white" : "bg-soft/70 text-muted hover:text-mali"}`}>{c.dot && statut !== c.id && <i className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />}{c.label} ({stats ? (stats as any)[c.key] : "…"})</button>)}
        </div>
      </div>

      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-mali font-mono text-[10px] uppercase text-white"><tr>{["Réf. fiche", "Client & nationalité", "Dates de séjour", "Soumission", "Statut", "Actions de gestion"].map((h, i) => <th key={h} scope="col" className={`px-4 py-3.5 font-bold ${i === 5 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line text-[11px]">
              {loading && <tr><td colSpan={6} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des demandes…</td></tr>}
              {!loading && slice.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted">Aucune demande ne correspond à ces critères.</td></tr>}
              {!loading && slice.map((f: Fiche) => (
                <tr key={f._id} className="hover:bg-soft/40">
                  <td className="px-4 py-3.5"><span className="flex items-center gap-2 font-mono font-bold text-mali">{lead(f.statut)}{f.reference}</span></td>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Avatar f={f} tone={f.statut === "refused" ? "bg-red-50 text-red-600" : "bg-soft text-mali"} />
                    <span><span className="block text-xs font-bold text-mali">{f.nom.toUpperCase()} {f.prenom}</span><span className="block text-[10px] text-muted">{f.flagEmoji} {f.nationalite} · {f.typePiece} {f.numeroPiece}</span></span></div></td>
                  <td className="px-4 py-3.5 font-mono text-[10px] leading-relaxed"><span className="block">{fd(f.dateEntree)} → {fd(f.dateSortie)}</span><span className="text-muted">{nuits(f.dateEntree, f.dateSortie)} nuitées · Ch. {f.chambreNumero}</span></td>
                  <td className="px-4 py-3.5 font-mono text-[10px]">{dt(f.createdAt)}</td>
                  <td className="px-4 py-3.5"><StatutPill s={f.statut} /></td>
                  <td className="px-4 py-3.5"><div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setOpen({ id: f._id, refuse: false })} className="flex items-center gap-1.5 rounded-md bg-soft px-3 py-2 font-semibold text-mali hover:bg-soft/70"><Eye size={13} /> Consulter</button>
                    {f.statut === "pending" && (<>
                      <button disabled={busy === f._id} onClick={() => quick(f._id, "valider")} aria-label={`Valider ${f.reference}`} className="grid h-8 w-8 place-items-center rounded-md bg-emerald-50 text-ok hover:bg-emerald-100 disabled:opacity-50"><Check size={14} /></button>
                      <button onClick={() => setOpen({ id: f._id, refuse: true })} aria-label={`Refuser ${f.reference}`} className="grid h-8 w-8 place-items-center rounded-md bg-red-50 text-red-600 hover:bg-red-100"><X size={14} /></button></>)}
                    {f.statut === "registered" && <button disabled={busy === f._id} onClick={() => quick(f._id, "transmettre-police")} className="flex items-center gap-1.5 rounded-md bg-mali px-3 py-2 font-semibold text-white hover:bg-mali-deep disabled:opacity-60"><Send size={13} /> Transmettre</button>}
                    {f.statut === "transmitted" && f.transmisReference && <span className="rounded bg-leaf px-2.5 py-2 font-mono text-[10px] font-bold text-mali" title={f.transmisReference}>Quittance #Q-{f.transmisReference.split("-")[1]?.slice(-4)}</span>}
                    {f.statut === "refused" && <span className="max-w-[140px] truncate rounded bg-red-50 px-2.5 py-2 text-right font-mono text-[10px] text-red-600" title={f.refusMotif}>{f.refusMotif}</span>}
                  </div></td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <Pager page={p} pages={pages} setPage={setPage} from={filtered.length ? (p - 1) * PER + 1 : 0} to={Math.min(p * PER, filtered.length)} total={filtered.length} noun="demandes" />
      </div>

      <p className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted"><span className="flex items-center gap-2"><Scale size={13} /> Conformité légal’Arrêté N° 2024/ML-78 régissant l’enregistrement et la transmission sécurisée des manifestes hôteliers.</span><span>Horodatage serveur certifié : {new Date().toLocaleString("fr-FR")}</span></p>
      {open && <FicheDialog id={open.id} startRefusing={open.refuse} onClose={() => setOpen(null)} onChanged={changed} />}
    </div>
  );
}
