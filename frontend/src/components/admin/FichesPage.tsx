"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, RotateCcw, Download, ClipboardList, Hourglass, BadgeCheck, Flag, Loader2, Eye, Globe2, ShieldCheck } from "lucide-react";
import { api, apiBlob, type ApiError } from "@/lib/api";
import { d as fd, dt, STATUT, nf } from "@/lib/format";
import { REGIONS } from "@/lib/mali";
import type { Fiche } from "@/lib/types";
import { AdminPager, Crumb, StatCard, Th, selectCls } from "./ui";
import FicheAdminDialog from "./FicheAdminDialog";

type Stats = { total: number; pending: number; registered: number; transmitted: number; refused: number; internationaux: number; signalees: number };
type Resp = { fiches: Fiche[]; total: number; pages: number; stats: Stats };
const empty = { q: "", statut: "", region: "", international: "", signalees: "", from: "", to: "" };

/** Gestionnaire national des fiches de police (superadmin) : filtres, pagination serveur, export, signalement. */
export default function FichesPage() {
  const [f, setF] = useState(empty);
  const [page, setPage] = useState(1); const [size, setSize] = useState(10);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true); const [err, setErr] = useState("");
  const [open, setOpen] = useState<Fiche | null>(null); const [exporting, setExporting] = useState(false);

  const qs = useCallback((extra = "") => { const u = new URLSearchParams(); Object.entries(f).forEach(([k, v]) => v && u.set(k, v)); return u.toString() + extra; }, [f]);
  const load = useCallback(() => {
    setLoading(true);
    api<Resp>(`/admin/fiches?${qs(`&page=${page}&limit=${size}`)}`, undefined, "GET").then((r) => { setData(r); setErr(""); }).catch((e: ApiError) => setErr(e.message)).finally(() => setLoading(false));
  }, [qs, page, size]);
  // Recherche texte : petit délai pour ne pas interroger le serveur à chaque frappe
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const upd = (k: keyof typeof empty, v: string) => { setF((p) => ({ ...p, [k]: v })); setPage(1); };
  const st = data?.stats;
  const pct = (n?: number) => (st?.total ? Math.round(((n ?? 0) / st.total) * 100) : 0);

  async function exportCsv() {
    setExporting(true);
    try { const b = await apiBlob(`/admin/fiches/export?${qs()}`); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `fiches-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    catch (e) { setErr((e as ApiError).message); } finally { setExporting(false); }
  }

  const rows = data?.fiches ?? []; const total = data?.total ?? 0;
  return (
    <div className="space-y-6">
      <Crumb items={[{ label: "Supervision nationale", href: "/admin" }, { label: "Fiches de police" }, { label: "Gestionnaire des fiches" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-mali-deep px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white"><i className="h-1.5 w-1.5 rounded-full bg-gold" /> Registre national des fiches</p>
          <h1 className="mt-3 text-4xl font-bold text-mali-deep">Gestion des fiches de police</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">Consultez toutes les fiches du réseau, suivez leur statut de la saisie à la transmission, signalez les anomalies et exportez le registre.</p>
        </div>
        <button onClick={exportCsv} disabled={exporting} className="flex items-center gap-2 rounded-xl bg-mali px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-mali-deep disabled:opacity-60">{exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Exporter la sélection (CSV)</button>
      </div>
      {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-rouge">{err}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Fiches (sélection)" value={nf(st?.total)} icon={ClipboardList} line="border-t-mali text-mali" progress={100} tint="bg-leaf text-mali" foot={<span className="flex items-center gap-1.5"><Globe2 size={12} />{nf(st?.internationaux)} voyageur(s) international(aux)</span>} />
        <StatCard title="En attente de l’hôtel" value={nf(st?.pending)} icon={Hourglass} line="border-t-gold text-gold-deep" progress={pct(st?.pending)} tint="bg-gold/30 text-amber-900" foot="À valider par l’établissement" />
        <StatCard title="Validées · Transmises" value={<>{nf(st?.registered)}<span className="text-xl text-muted"> · {nf(st?.transmitted)}</span></>} icon={BadgeCheck} line="border-t-ok text-ok" progress={pct((st?.registered ?? 0) + (st?.transmitted ?? 0))} tint="bg-leaf text-ok" foot="Prêtes · envoyées aux autorités" />
        <StatCard title="Signalées · Refusées" value={<>{nf(st?.signalees)}<span className="text-xl text-muted"> · {nf(st?.refused)}</span></>} icon={Flag} line="border-t-rouge text-rouge" progress={pct((st?.signalees ?? 0) + (st?.refused ?? 0))} tint="bg-rouge/10 text-rouge" foot="Contrôle requis" />
      </ul>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] flex-[2] items-center gap-2 rounded-lg bg-soft/70 px-3 py-3"><Search size={15} className="text-muted" /><input value={f.q} onChange={(e) => upd("q", e.target.value)} placeholder="Référence, nom, prénom, n° de pièce…" aria-label="Rechercher une fiche" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
          <select value={f.statut} onChange={(e) => upd("statut", e.target.value)} aria-label="Statut" className={selectCls}><option value="">Tous les statuts</option>{Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <select value={f.region} onChange={(e) => upd("region", e.target.value)} aria-label="Région" className={selectCls}><option value="">Toutes les régions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}<option>Non renseignée</option></select>
          <select value={f.international} onChange={(e) => upd("international", e.target.value)} aria-label="Origine" className={selectCls}><option value="">Maliens et étrangers</option><option value="1">Internationaux</option><option value="0">Maliens</option></select>
          <label className="flex items-center gap-2 rounded-lg bg-soft/70 px-3 py-3 text-xs font-semibold text-rouge"><input type="checkbox" checked={f.signalees === "1"} onChange={(e) => upd("signalees", e.target.checked ? "1" : "")} className="accent-[#CE1126]" /> Signalées</label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted">
          <label className="flex items-center gap-2">Du <input type="date" value={f.from} onChange={(e) => upd("from", e.target.value)} className="rounded-lg bg-soft/70 px-2 py-2 text-xs text-ink" /></label>
          <label className="flex items-center gap-2">au <input type="date" value={f.to} onChange={(e) => upd("to", e.target.value)} className="rounded-lg bg-soft/70 px-2 py-2 text-xs text-ink" /></label>
          <button onClick={() => { setF(empty); setPage(1); }} className="flex items-center gap-2 rounded-lg bg-soft px-4 py-2.5 text-xs font-semibold text-mali hover:bg-leaf"><RotateCcw size={13} /> Réinitialiser</button>
          <span className="ml-auto">{nf(total)} fiche{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left">
          <thead className="bg-mali-deep font-mono text-[10px] uppercase text-white"><tr><Th>Référence</Th><Th>Voyageur</Th><Th>Établissement</Th><Th>Séjour</Th><Th>Statut</Th><Th>Action</Th></tr></thead>
          <tbody className="divide-y divide-line text-[11px]">
            {loading && !data && <tr><td colSpan={6} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des fiches…</td></tr>}
            {data && rows.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted">Aucune fiche ne correspond à ces critères.</td></tr>}
            {rows.map((r) => (
              <tr key={r._id} onClick={() => setOpen(r)} className={`cursor-pointer hover:bg-soft/50 ${r.signalement?.actif ? "bg-rouge/5" : ""}`}>
                <td className="px-4 py-3.5 font-mono"><span className="font-bold text-mali-deep">{r.reference}</span><span className="block text-[10px] text-muted">{dt(r.createdAt)}</span></td>
                <td className="px-4 py-3.5"><span className="block text-xs font-bold text-mali-deep">{r.flagEmoji} {r.prenom} {r.nom.toUpperCase()}</span><span className="block font-mono text-[10px] text-muted">{r.nationalite}{r.international ? " · international" : ""}</span></td>
                <td className="px-4 py-3.5"><span className="block text-xs font-semibold text-mali-deep">{r.hotel?.nomHotel ?? "—"}</span><span className="block font-mono text-[10px] text-muted">{[r.hotelCommune || r.hotel?.ville, r.hotelRegion].filter(Boolean).join(" · ")}</span></td>
                <td className="px-4 py-3.5 font-mono text-[10px]">{fd(r.dateEntree)} → {fd(r.dateSortie)}</td>
                <td className="px-4 py-3.5"><span className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold ${STATUT[r.statut].pill}`}>● {STATUT[r.statut].label}</span>{r.signalement?.actif && <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-rouge/10 px-2 py-1 font-mono text-[10px] font-semibold text-rouge"><Flag size={10} /> Signalée</span>}</td>
                <td className="px-4 py-3.5"><button onClick={(e) => { e.stopPropagation(); setOpen(r); }} className="flex items-center gap-1.5 rounded-lg bg-leaf px-3 py-2 font-semibold text-mali hover:bg-mali hover:text-white"><Eye size={13} /> Consulter</button></td>
              </tr>))}
          </tbody></table></div>
        <AdminPager page={Math.min(page, data?.pages ?? 1)} pages={data?.pages ?? 1} setPage={setPage} size={size} setSize={(n) => { setSize(n); setPage(1); }} from={total ? (page - 1) * size + 1 : 0} to={Math.min(page * size, total)} total={total} noun="fiches" />
      </div>
      <p className="flex items-center gap-2 rounded-xl bg-soft/80 px-4 py-3 font-mono text-[10px] text-muted"><ShieldCheck size={14} className="text-mali" /> Les numéros de pièce sont masqués dans les exports. Chaque signalement est horodaté et attribué à son auteur.</p>
      {open && <FicheAdminDialog id={open._id} onClose={() => setOpen(null)} onDone={load} />}
    </div>
  );
}
