"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, ListFilter, RotateCcw, Eye, Download, Send, FileText, Lock, ArchiveRestore, FolderArchive, UserCheck, ShieldCheck, ShieldAlert, FileDown, Loader2, Scale, BadgeCheck } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { d as fd, dt } from "@/lib/format";
import type { Fiche, Statut } from "@/lib/types";
import FicheDialog from "./FicheDialog";
import { Pager, StatutPill } from "./parts";
import { exportCsv, matches, printFiche } from "./exports";
import { buildArchive, downloadPiece } from "./archive";
import { useAllFiches, useStats } from "./useAllFiches";

const PER = 6;
const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (k: string) => { const s = new Date(`${k}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); return s[0].toUpperCase() + s.slice(1) + (k === new Date().toISOString().slice(0, 7) ? " (en cours)" : ""); };

/** Documents = archive de toutes les fiches de l'hôtel et de leurs pièces d'identité PDF. */
export default function DocumentsList() {
  const { rows, loading, err, reload, setErr } = useAllFiches();
  const { stats, reload: reloadStats } = useStats();
  const [q, setQ] = useState(""); const [month, setMonth] = useState("__init"); const [piece, setPiece] = useState("");
  const [statut, setStatut] = useState<"" | Statut>(""); const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(""); const [zip, setZip] = useState<{ i: number; n: number } | null>(null); const [note, setNote] = useState("");

  const months = useMemo(() => Array.from(new Set(rows.map((f) => monthKey(f.createdAt)))).sort().reverse(), [rows]);
  useEffect(() => { if (month === "__init" && !loading) setMonth(months.includes(new Date().toISOString().slice(0, 7)) ? new Date().toISOString().slice(0, 7) : ""); }, [loading, months, month]);
  const m = month === "__init" ? "" : month;

  const filtered = useMemo(() => rows.filter((f) => (!statut || f.statut === statut) && (!m || monthKey(f.createdAt) === m) && (!piece || f.typePiece === piece) && matches(f, q)), [rows, statut, m, piece, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER)); const p = Math.min(page, pages);
  const slice = filtered.slice((p - 1) * PER, p * PER);
  const total = stats?.totalClients ?? rows.length;
  const pct = stats && total ? ((stats.transmitted / total) * 100).toFixed(1) : "–";
  const changed = () => { reload(); reloadStats(); };
  const reset = () => { setQ(""); setMonth(""); setPiece(""); setStatut(""); setPage(1); };

  async function pieceDl(f: Fiche) { setBusy(f._id); setErr(""); try { await downloadPiece(f); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); } }
  async function transmit(f: Fiche) { setBusy(f._id); try { await api(`/fiches/${f._id}/transmettre-police`, undefined, "PATCH"); changed(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); } }
  async function archive() {
    setNote(""); setZip({ i: 0, n: filtered.length });
    try { const miss = await buildArchive(filtered, m || "complete", (i, n) => setZip({ i, n })); setNote(miss ? `Archive générée — ${miss} pièce(s) introuvable(s).` : "Archive générée."); } catch { setErr("Impossible de générer l’archive."); } finally { setZip(null); }
  }

  const cards = [
    { t: "Total fiches archivées", v: total, icon: FolderArchive, line: "border-t-mali", tint: "bg-leaf/60 text-mali", a: "Conservation légale", b: "" },
    { t: "Fiches validées (registered)", v: stats?.registered ?? "–", icon: UserCheck, line: "border-t-ok", tint: "bg-emerald-50 text-ok", a: "Attente télé-transmission aux autorités", b: "Chambres assignées" },
    { t: "Fiches transmises", v: stats?.transmitted ?? "–", icon: ShieldCheck, line: "border-t-mali", tint: "bg-leaf/60 text-mali", a: "Quittances scellées", b: `${pct}% du total` },
    { t: "Fiches refusées (refused)", v: stats?.refused ?? "–", icon: ShieldAlert, line: "border-t-red-600", tint: "bg-red-50 text-red-600", a: "Anomalie ou rejet opératoire", b: "" },
  ];
  const chips: { id: "" | Statut; label: string; n: number | string; dot: string }[] = [
    { id: "", label: "Toutes les fiches", n: total, dot: "" }, { id: "registered", label: "Validées (enregistrées)", n: stats?.registered ?? "…", dot: "bg-ok" },
    { id: "transmitted", label: "Transmises police", n: stats?.transmitted ?? "…", dot: "bg-mali" }, { id: "refused", label: "Refusées", n: stats?.refused ?? "…", dot: "bg-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-white/95 p-5 shadow-sm">
        <div className="max-w-xl">
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-mali">Documents <span className="rounded-md bg-leaf px-2 py-1 font-mono text-[10px] font-semibold text-mali">● {total} documents archivés</span></h1>
          <p className="mt-3 text-xs leading-relaxed text-muted">Retrouvez et consultez les fiches hôtelières enregistrées et les pièces d’identité numérisées, scellées selon la convention de sécurité intérieure.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => exportCsv(filtered, "inventaire")} className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><FileDown size={14} /> Exporter l’inventaire (.csv)</button>
          <button onClick={archive} disabled={!!zip || filtered.length === 0} className="flex items-center justify-center gap-2 rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep disabled:opacity-60">
            {zip ? <><Loader2 size={14} className="animate-spin" /> Préparation {zip.i}/{zip.n}…</> : <><ArchiveRestore size={14} /> Télécharger l’archive{m ? " du mois" : ""} (ZIP)</>}</button>
        </div>
      </div>
      {note && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-ok">{note}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ t, v, icon: I, line, tint, a, b }) => (
          <li key={t} className={`rounded-xl border border-line border-t-4 bg-white/95 p-4 shadow-sm ${line}`}>
            <div className="flex items-start justify-between gap-2"><p className="font-mono text-[9px] uppercase leading-relaxed text-muted">{t}</p><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tint}`}><I size={16} /></span></div>
            <p className={`mt-1 text-4xl font-extrabold ${line.includes("red") ? "text-red-600" : "text-mali"}`}>{v}</p>
            <p className="mt-3 flex items-center justify-between gap-2 rounded bg-soft/70 px-2 py-1.5 font-mono text-[9px] text-muted"><span>{a}</span><strong className="text-mali">{b}</strong></p>
          </li>))}
      </ul>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg bg-soft/70 px-3 py-2.5"><Search size={15} className="text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher par référence (ex: SS-2026-00142) ou nom" aria-label="Rechercher un document" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
          <label className="flex items-center gap-2 rounded-lg bg-soft/70 px-3 py-2.5 text-xs text-ink"><Calendar size={14} className="text-muted" />
            <select value={m} onChange={(e) => { setMonth(e.target.value); setPage(1); }} aria-label="Période" className="bg-transparent outline-none"><option value="">Toutes les périodes</option>{months.map((k) => <option key={k} value={k}>Période : {monthLabel(k)}</option>)}</select></label>
          <label className="flex items-center gap-2 rounded-lg bg-soft/70 px-3 py-2.5 text-xs text-ink"><ListFilter size={14} className="text-muted" />
            <select value={piece} onChange={(e) => { setPiece(e.target.value); setPage(1); }} aria-label="Type de pièce" className="bg-transparent outline-none"><option value="">Toutes les pièces (NINA, CNI, Passeport…)</option><option value="NINA">NINA</option><option value="CNI">CNI</option><option value="Passeport">Passeport</option><option value="Carte consulaire">Carte consulaire</option><option value="Titre de séjour">Titre de séjour</option><option value="Autre">Autre titre</option></select></label>
          <button onClick={reset} className="flex items-center gap-1.5 px-2 font-mono text-[11px] text-muted hover:text-mali"><RotateCcw size={13} /> Réinitialiser</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => <button key={c.label} aria-pressed={statut === c.id} onClick={() => { setStatut(c.id); setPage(1); }} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${statut === c.id ? "bg-mali text-white" : "bg-soft/70 text-muted hover:text-mali"}`}>{c.dot && statut !== c.id && <i className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />}{c.label}<span className="rounded bg-white/30 px-1.5 font-mono text-[9px]">{c.n}</span></button>)}
        </div>
      </div>

      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-mali font-mono text-[10px] uppercase text-white"><tr>{["Réf. fiche", "Client & nationalité", "Documents scellés", "Enregistrement", "Séjour (chambre)", "Statut fiche", "Actions régaliennes"].map((h) => <th key={h} scope="col" className="px-4 py-3.5 font-bold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line text-[11px]">
              {loading && <tr><td colSpan={7} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des archives…</td></tr>}
              {!loading && slice.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-muted">Aucun document ne correspond à ces critères.</td></tr>}
              {!loading && slice.map((f) => (
                <tr key={f._id} className="align-middle hover:bg-soft/40">
                  <td className="px-4 py-3.5"><span className="flex items-center gap-2 font-mono font-bold text-mali"><FileText size={14} className="text-muted" />{f.reference}</span></td>
                  <td className="px-4 py-3.5"><span className="block text-xs font-bold text-mali">{f.nom.toUpperCase()} {f.prenom}</span><span className="block text-[10px] text-muted">{f.flagEmoji} {f.nationalite} · {f.typePiece} {f.numeroPiece}</span></td>
                  <td className="px-4 py-3.5"><div className="flex flex-col gap-1.5">
                    <button onClick={() => printFiche(f)} className="flex items-center gap-1.5 rounded bg-soft px-2 py-1 font-mono text-[10px] font-semibold text-mali hover:bg-soft/70"><FileText size={11} className="text-red-600" /> Fiche PDF</button>
                    <button disabled={busy === f._id} onClick={() => pieceDl(f)} className="flex items-center gap-1.5 rounded bg-soft px-2 py-1 font-mono text-[10px] font-semibold text-mali hover:bg-soft/70 disabled:opacity-60"><Lock size={11} /> {f.typePiece} · PDF</button></div></td>
                  <td className="px-4 py-3.5 font-mono text-[10px] text-muted"><span className="block text-ink">{fd(f.createdAt)}</span>{new Date(f.createdAt).toLocaleTimeString("fr-FR")}</td>
                  <td className="px-4 py-3.5"><span className="block font-mono text-[10px]">{fd(f.dateEntree)} → {fd(f.dateSortie)}</span><span className="text-[10px] text-muted">Chambre {f.chambreNumero}</span></td>
                  <td className="px-4 py-3.5"><StatutPill s={f.statut} /></td>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-1.5">
                    <button onClick={() => setOpen(f._id)} aria-label={`Consulter ${f.reference}`} className="grid h-8 w-8 place-items-center rounded-md text-mali hover:bg-soft"><Eye size={15} /></button>
                    <button disabled={busy === f._id} onClick={() => pieceDl(f)} aria-label={`Télécharger la pièce de ${f.reference}`} className="grid h-8 w-8 place-items-center rounded-md text-mali hover:bg-soft disabled:opacity-50"><Download size={15} /></button>
                    {f.statut === "registered" && <button disabled={busy === f._id} onClick={() => transmit(f)} className="flex items-center gap-1.5 rounded-md bg-mali px-3 py-2 font-semibold text-white hover:bg-mali-deep disabled:opacity-60"><Send size={12} /> Transmettre</button>}
                    {f.statut === "transmitted" && f.transmisReference && <span className="flex items-center gap-1 rounded bg-soft px-2.5 py-2 font-mono text-[9px] font-semibold text-mali" title={f.transmisReference}><BadgeCheck size={11} /> Scellé n°{f.transmisReference.split("-")[1]?.slice(-4)}</span>}
                    {f.statut === "refused" && <span className="max-w-[130px] truncate rounded bg-red-50 px-2.5 py-2 text-[10px] text-red-600" title={f.refusMotif}>{f.refusMotif}</span>}
                  </div></td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <Pager page={p} pages={pages} setPage={setPage} from={filtered.length ? (p - 1) * PER + 1 : 0} to={Math.min(p * PER, filtered.length)} total={filtered.length} noun="documents enregistrés" />
      </div>
      <p className="flex items-center gap-2 font-mono text-[10px] text-muted"><Scale size={13} /> Horodatage serveur certifié · Arrêté N° 2024/ML-78</p>
      {open && <FicheDialog id={open} onClose={() => setOpen(null)} onChanged={changed} />}
    </div>
  );
}
