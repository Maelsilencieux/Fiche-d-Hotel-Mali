"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Eye, Check, X, Send, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { api, type ApiError } from "@/lib/api";
import { STATUT, d as fd, dt } from "@/lib/format";
import type { Fiche, Stats, Statut } from "@/lib/types";
import FicheDialog from "./FicheDialog";

const tabs: { id: "" | Statut; label: string; key: keyof Stats }[] = [
  { id: "", label: "Toutes", key: "totalClients" }, { id: "pending", label: "En attente", key: "pending" }, { id: "registered", label: "Validées", key: "registered" },
  { id: "refused", label: "Refusées", key: "refused" }, { id: "transmitted", label: "Transmises à la police", key: "transmitted" },
];

export default function FichesTable({ limit, stats, refreshKey, onChanged, initial = "" }: { limit: number; stats: Stats | null; refreshKey: number; onChanged: () => void; initial?: "" | Statut }) {
  const [statut, setStatut] = useState<"" | Statut>(initial);
  const [q, setQ] = useState(""); const [qs, setQs] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Fiche[]>([]); const [total, setTotal] = useState(0); const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true); const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => { const t = setTimeout(() => { setQs(q.trim()); setPage(1); }, 400); return () => clearTimeout(t); }, [q]);

  const load = useCallback(() => {
    setLoading(true); setErr("");
    const p = new URLSearchParams({ page: String(page), limit: String(limit) }); if (statut) p.set("statut", statut); if (qs) p.set("q", qs);
    api<{ fiches: Fiche[]; total: number; pages: number }>(`/fiches/hotel?${p}`, undefined, "GET")
      .then((r) => { setRows(r.fiches); setTotal(r.total); setPages(Math.max(1, r.pages)); }).catch((e: ApiError) => setErr(e.message)).finally(() => setLoading(false));
  }, [page, limit, statut, qs]);
  useEffect(load, [load, refreshKey]);

  async function quick(id: string, action: string) {
    setBusyId(id);
    try { await api(`/fiches/${id}/${action}`, undefined, "PATCH"); onChanged(); load(); } catch (e) { setErr((e as ApiError).message); } finally { setBusyId(""); }
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1; const to = Math.min(page * limit, total);
  const pageList = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);

  return (
    <div className="rounded-2xl border border-line bg-white/95 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg bg-soft/70 px-3 py-2"><Search size={14} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, prénom ou n° de pièce" aria-label="Rechercher une demande" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (<button key={t.label} onClick={() => { setStatut(t.id); setPage(1); }} aria-pressed={statut === t.id} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${statut === t.id ? "bg-mali text-white" : "bg-soft text-muted hover:text-mali"}`}>{t.label}{stats && <span className="ml-1 text-[9px] opacity-80">({stats[t.key]})</span>}</button>))}
        </div>
      </div>
      {err && <p role="alert" className="mx-4 mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-soft/80 font-mono text-[9px] text-muted"><tr>{["Référence", "Client & nationalité", "Date d’entrée", "Date de sortie", "Date de soumission", "Statut", "Actions"].map((h, i) => <th key={h} scope="col" className={`px-4 py-3 font-semibold ${i === 6 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line text-[11px]">
            {loading && <tr><td colSpan={7} className="p-8 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">Aucune demande ne correspond à ces critères.</td></tr>}
            {!loading && rows.map((f) => (
              <tr key={f._id} className="align-middle hover:bg-soft/40">
                <td className="px-4 py-3 font-mono font-bold text-mali">{f.reference}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-[10px] font-bold text-mali">{f.prenom[0]}{f.nom[0]}</span>
                  <span><span className="block font-bold text-mali">{f.prenom} {f.nom.toUpperCase()}</span><span className="block text-[10px] text-muted">{f.flagEmoji} {f.nationalite} · {f.typePiece} {f.numeroPiece}</span></span></div></td>
                <td className="px-4 py-3 font-mono">{fd(f.dateEntree)}</td><td className="px-4 py-3 font-mono">{fd(f.dateSortie)}</td><td className="px-4 py-3 font-mono text-[10px]">{dt(f.createdAt)}</td>
                <td className="px-4 py-3"><span className={`inline-block rounded-md px-2 py-1 text-[10px] font-semibold ${STATUT[f.statut].pill}`}>● {STATUT[f.statut].label}</span></td>
                <td className="px-4 py-3"><div className="flex items-center justify-end gap-1.5">
                  {f.statut === "refused" && <span className="max-w-[150px] truncate rounded bg-red-50 px-2 py-1 font-mono text-[9px] text-red-600" title={f.refusMotif}>Motif : {f.refusMotif}</span>}
                  {f.statut === "transmitted" && f.transmisReference && <span className="flex items-center gap-1 rounded bg-soft px-2 py-1 font-mono text-[9px] text-mali" title={f.transmisReference}><ShieldCheck size={10} /> Quittance #{f.transmisReference.split("-")[1]?.slice(-5)}</span>}
                  <button onClick={() => setOpen(f._id)} className="flex items-center gap-1 rounded-md bg-soft px-2.5 py-1.5 font-semibold text-mali hover:bg-soft/70"><Eye size={12} /> Consulter</button>
                  {f.statut === "pending" && (<>
                    <button disabled={busyId === f._id} onClick={() => quick(f._id, "valider")} className="flex items-center gap-1 rounded-md bg-ok px-2.5 py-1.5 font-semibold text-white disabled:opacity-60"><Check size={12} /> Valider</button>
                    <button onClick={() => setOpen(f._id)} className="flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 font-semibold text-red-600"><X size={12} /> Refuser</button></>)}
                  {f.statut === "registered" && <button disabled={busyId === f._id} onClick={() => quick(f._id, "transmettre-police")} className="flex items-center gap-1.5 rounded-md bg-mali px-3 py-2 font-semibold text-white disabled:opacity-60"><Send size={12} /> Transmettre à la police</button>}
                </div></td>
              </tr>))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-[11px] text-muted">
        <p>Affichage de {from} à {to} sur {total} demandes</p>
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md bg-white px-3 py-1.5 ring-1 ring-line disabled:opacity-50">‹ Précédent</button>
          {pageList.map((n, i) => (<span key={n} className="flex items-center">{i > 0 && n - pageList[i - 1] > 1 && <span className="px-1">…</span>}<button onClick={() => setPage(n)} aria-current={n === page ? "page" : undefined} className={`h-8 w-8 rounded-md ${n === page ? "bg-mali font-bold text-white" : "bg-white ring-1 ring-line"}`}>{n}</button></span>))}
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md bg-white px-3 py-1.5 ring-1 ring-line disabled:opacity-50">Suivant ›</button>
        </nav>
      </div>
      {open && <FicheDialog id={open} onClose={() => setOpen(null)} onChanged={() => { onChanged(); load(); }} />}
    </div>
  );
}
