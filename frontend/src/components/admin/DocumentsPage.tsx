"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, RotateCcw, Download, FileText, FileSpreadsheet, Archive, IdCard, FileCheck2, TriangleAlert, ScrollText, ShieldCheck, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import Link from "next/link";
import { api, apiBlob, type ApiError } from "@/lib/api";
import { d as fd, dt } from "@/lib/format";
import { downloadCsv, printTable } from "@/lib/export";
import { printFiche } from "@/components/hotel/exports";
import type { AdminHotel, DocItem, Fiche, Statut } from "@/lib/types";
import { AdminPager, StatCard, Th, Pill, prefRows, selectCls } from "./ui";

type Stats = { totalFiches: number; piecesActives: number; fichesPdf: number; manquants: number };
const sLabel: Record<Statut, string> = { pending: "En attente", registered: "Validé", transmitted: "Transmis", refused: "Refusé" };
const sTone: Record<Statut, "warn" | "ok" | "info" | "bad"> = { pending: "warn", registered: "ok", transmitted: "info", refused: "bad" };

export default function DocumentsPage() {
  const [rows, setRows] = useState<DocItem[]>([]); const [total, setTotal] = useState(0); const [pages, setPages] = useState(1); const [stats, setStats] = useState<Stats | null>(null);
  const [hotels, setHotels] = useState<(AdminHotel & { profile?: { _id?: string } | null })[]>([]);
  const [q, setQ] = useState(""); const [qs, setQs] = useState(""); const [type, setType] = useState(""); const [hotel, setHotel] = useState(""); const [st, setSt] = useState(""); const [dispo, setDispo] = useState("");
  const [page, setPage] = useState(1); const [size, setSize] = useState(prefRows); const [loading, setLoading] = useState(true); const [err, setErr] = useState(""); const [busy, setBusy] = useState("");
  useEffect(() => { const t = setTimeout(() => { setQs(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { api<{ hotels: any[] }>("/admin/hotels?statut=approved&limit=500", undefined, "GET").then((r) => setHotels(r.hotels)).catch(() => {}); }, []);

  const params = (p: number, l: number) => { const u = new URLSearchParams({ page: String(p), limit: String(l) }); if (qs) u.set("q", qs); if (type) u.set("type", type); if (hotel) u.set("hotel", hotel); if (st) u.set("statut", st); if (dispo) u.set("dispo", dispo); return u; };
  const load = useCallback(() => {
    setLoading(true);
    api<{ documents: DocItem[]; total: number; pages: number; stats: Stats }>(`/admin/documents?${params(page, size)}`, undefined, "GET").then((r) => { setRows(r.documents); setTotal(r.total); setPages(r.pages); setStats(r.stats); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, qs, type, hotel, st, dispo]);
  useEffect(load, [load]);

  async function exportAll(kind: "csv" | "pdf") {
    const r = await api<{ documents: DocItem[] }>(`/admin/documents?${params(1, 200)}`, undefined, "GET").catch(() => null); if (!r) return;
    const head = ["Client", "Réf. fiche", "Établissement", "Type pièce", "N° pièce", "Pièce PDF", "Fiche PDF", "Soumission", "Statut"];
    const body = r.documents.map((d) => [`${d.prenom} ${d.nom}`, d.reference, d.hotel?.nomHotel ?? "", d.typePiece, d.numeroPiece, d.pieceDisponible ? "Disponible" : "Indisponible", d.ficheDisponible ? "Disponible" : "Indisponible", fd(d.createdAt), sLabel[d.statut]]);
    kind === "csv" ? downloadCsv("documents", head, body) : printTable("Répertoire des documents", head, body);
  }
  async function piece(d: DocItem) { setBusy(d._id + "p"); setErr(""); try { const b = await apiBlob(`/fiches/${d._id}/piece`); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${d.reference}_${d.nom}_${d.prenom}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); } }
  async function fiche(d: DocItem) { setBusy(d._id + "f"); setErr(""); try { const r = await api<{ fiche: Fiche }>(`/fiches/${d._id}`, undefined, "GET"); printFiche(r.fiche); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); } }
  const reset = () => { setQ(""); setType(""); setHotel(""); setSt(""); setDispo(""); setPage(1); };
  const Chip = ({ d, kind }: { d: DocItem; kind: "p" | "f" }) => {
    const ok = kind === "p" ? d.pieceDisponible : d.ficheDisponible;
    if (!ok) return <Pill tone={kind === "f" && d.statut === "pending" ? "off" : "bad"}>Indisponible</Pill>;
    const key = d._id + kind;
    return <button disabled={busy === key} onClick={() => (kind === "p" ? piece(d) : fiche(d))} className="rounded-md bg-emerald-50 px-2.5 py-1.5 font-mono text-[10px] font-semibold text-ok hover:bg-emerald-100 disabled:opacity-60" title={kind === "p" ? "Télécharger la pièce d’identité" : "Ouvrir la fiche (PDF)"}>{busy === key ? <Loader2 size={11} className="inline animate-spin" /> : <Download size={11} className="mr-1 inline" />}Disponible (PDF)</button>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl"><h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-mali">Gestion des documents <span className="rounded bg-leaf px-2 py-1 font-mono text-[10px] font-semibold text-mali">Répertoire central</span></h1>
          <p className="mt-2 text-xs text-muted">Consultez et téléchargez les documents associés aux fiches hôtelières.</p></div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin#activite" className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><ShieldCheck size={14} /> Journal d’audit régalien</Link>
          <div className="flex overflow-hidden rounded-lg bg-mali text-white" role="group" aria-label="Exporter la liste"><span className="flex items-center gap-2 px-3 text-xs font-semibold"><Download size={14} /> Exporter la liste</span>
            <button onClick={() => exportAll("csv")} className="border-l border-white/20 px-3 py-2.5 text-xs font-bold hover:bg-white/10">CSV</button><button onClick={() => exportAll("pdf")} className="border-l border-white/20 px-3 py-2.5 text-xs font-bold hover:bg-white/10">PDF</button></div>
        </div>
      </div>
      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total fiches raccordées" value={stats?.totalFiches.toLocaleString("fr-FR") ?? "–"} icon={Archive} line="border-t-mali" tint="bg-leaf text-mali" foot="● Fiches archivées et raccordées" />
        <StatCard title="Pièces d’identité actives" value={stats?.piecesActives.toLocaleString("fr-FR") ?? "–"} icon={IdCard} line="border-t-ok" tint="bg-emerald-50 text-ok" foot="● Pièces d’identité numérisées conformes" />
        <StatCard title="Fiches hôtelières PDF" value={stats?.fichesPdf.toLocaleString("fr-FR") ?? "–"} icon={FileCheck2} line="border-t-gold" tint="bg-leaf/60 text-mali" foot="● Fiches validées ou transmises, PDF générable" />
        <StatCard title="Documents manquants" value={<span className="text-red-600">{stats?.manquants.toLocaleString("fr-FR") ?? "–"}</span>} icon={TriangleAlert} line="border-t-red-600" tint="bg-red-50 text-red-600" foot={<span className="text-red-600">● Pièces introuvables sur le serveur</span>} />
      </ul>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-mali-deep p-5 text-white"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/10"><ScrollText size={20} /></span>
        <div className="min-w-[260px] flex-1"><h2 className="flex flex-wrap items-center gap-2 text-base font-extrabold">Cadre souverain d’intégrité légale &amp; traçabilité judiciaire<span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[9px] text-emerald-300">DGSN certifié</span></h2>
          <p className="mt-1 text-xs leading-relaxed text-white/75">Les pièces d’identité ne sont accessibles qu’à travers des appels authentifiés (hôtel concerné ou super administrateur) ; aucun lien public n’existe vers les fichiers.</p></div>
        <span className="flex items-center gap-2 rounded bg-white/10 px-3 py-2 font-mono text-[10px]"><LockKeyhole size={12} /> Accès restreint</span></div>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm"><div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[220px] flex-[2] items-center gap-2 rounded-lg bg-soft/70 px-3 py-3"><Search size={15} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, référence ou n° de pièce" aria-label="Rechercher un document" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Type de pièce" className={selectCls}><option value="">Type : tous les types</option><option value="NINA">NINA</option><option value="CNI">CNI</option><option value="Passeport">Passeport</option><option value="Carte consulaire">Carte consulaire</option><option value="Titre de séjour">Titre de séjour</option><option value="Autre">Autre titre</option></select>
        <select value={hotel} onChange={(e) => { setHotel(e.target.value); setPage(1); }} aria-label="Hôtel" className={`${selectCls} max-w-[200px]`}><option value="">Hôtel : tous les hôtels</option>{hotels.filter((h) => h.profile?._id).map((h) => <option key={h._id} value={h.profile!._id}>{h.nomHotel}</option>)}</select>
        <select value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }} aria-label="Statut" className={selectCls}><option value="">Statut : tous</option>{(Object.keys(sLabel) as Statut[]).map((k) => <option key={k} value={k}>{sLabel[k]}</option>)}</select>
        <select value={dispo} onChange={(e) => { setDispo(e.target.value); setPage(1); }} aria-label="Disponibilité" className={selectCls}><option value="">Disponibilité : tous</option><option value="piece_ok">Pièce disponible</option><option value="piece_manquante">Pièce manquante</option></select>
        <button onClick={reset} aria-label="Réinitialiser les filtres" className="grid h-11 w-11 place-items-center rounded-lg bg-soft text-mali hover:bg-soft/70"><RotateCcw size={15} /></button></div></div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left">
          <thead className="bg-mali font-mono text-[10px] uppercase text-white"><tr><Th>Client</Th><Th>Réf. fiche</Th><Th>Établissement</Th><Th>Type pièce</Th><Th>Pièce d’identité</Th><Th>Fiche hôtelière</Th><Th>Soumission</Th><Th>Statut fiche</Th></tr></thead>
          <tbody className="divide-y divide-line text-[11px]">
            {loading && <tr><td colSpan={8} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des documents…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted">Aucun document ne correspond à ces critères.</td></tr>}
            {rows.map((d) => (
              <tr key={d._id} className="hover:bg-soft/40">
                <td className="px-4 py-3.5"><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold ${d.statut === "refused" ? "bg-red-50 text-red-600" : "bg-leaf text-mali"}`}>{d.prenom[0]}{d.nom[0]}</span><span><span className="block text-xs font-bold text-mali">{d.prenom} {d.nom.toUpperCase()}</span><span className="block font-mono text-[10px] text-muted">{d.numeroPiece}</span></span></div></td>
                <td className="px-4 py-3.5 font-mono text-[10px] font-bold text-mali">{d.reference}</td>
                <td className="px-4 py-3.5 text-xs font-semibold text-mali">{d.hotel?.nomHotel ?? "—"}</td>
                <td className="px-4 py-3.5"><span className="rounded bg-soft px-2 py-1 font-mono text-[10px] text-ink">{d.typePiece}</span></td>
                <td className="px-4 py-3.5"><Chip d={d} kind="p" /></td><td className="px-4 py-3.5"><Chip d={d} kind="f" /></td>
                <td className="px-4 py-3.5 font-mono text-[10px]">{dt(d.createdAt)}</td>
                <td className="px-4 py-3.5"><Pill tone={sTone[d.statut]}>{sLabel[d.statut]}</Pill></td>
              </tr>))}
          </tbody></table></div>
        <AdminPager page={page} pages={pages} setPage={setPage} size={size} setSize={setSize} from={total ? (page - 1) * size + 1 : 0} to={Math.min(page * size, total)} total={total} noun="documents" />
      </div>
      <p className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-ok" />Base documentaire centrale · système sécurisé TLS / DGSN Mali</span><span className="flex items-center gap-2"><RefreshCw size={11} />Dernière synchronisation : {new Date().toLocaleString("fr-FR")}</span></p>
    </div>
  );
}
