"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, Plus, Download, FileText, Building2, BadgeCheck, ClipboardClock, Ban, Loader2, Eye, Repeat2, TriangleAlert, ShieldCheck, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { REGIONS } from "@/lib/mali";
import { d as fd } from "@/lib/format";
import { downloadCsv, printTable } from "@/lib/export";
import type { AdminHotel } from "@/lib/types";
import AddUserDialog from "./AddUserDialog";
import HotelReviewDialog from "./HotelReviewDialog";
import { AdminPager, CopyBtn, Crumb, Initials, Pill, StatCard, Th, prefRows, selectCls } from "./ui";

type H = AdminHotel & { isActive: boolean; approvedAt?: string };
const status = (h: H) => (h.hotelStatus === "pending" ? "pending" : h.hotelStatus === "rejected" ? "rejected" : h.isActive ? "approved" : "disabled");
const label = { pending: "En attente d’approbation", approved: "Approuvé & actif", rejected: "Refusé", disabled: "Désactivé" } as const;
const tone = { pending: "warn", approved: "ok", rejected: "bad", disabled: "off" } as const;
const stars = (n?: number) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "");
const city = (h: H) => h.villeHotel ?? h.profile?.ville ?? "";
const region = (h: H) => h.profile?.region || h.regionHotel || "";
const place = (h: H) => [h.profile?.commune || h.communeHotel, city(h)].filter(Boolean).join(", ");

export default function HotelsPage() {
  const [rows, setRows] = useState<H[]>([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState("");
  const [q, setQ] = useState(""); const [st, setSt] = useState(""); const [cat, setCat] = useState(""); const [loc, setLoc] = useState(""); const [reg, setReg] = useState("");
  const [page, setPage] = useState(1); const [size, setSize] = useState(prefRows);
  const [open, setOpen] = useState<H | null>(null); const [add, setAdd] = useState(false);

  const load = () => api<{ hotels: H[] }>("/admin/hotels?limit=500", undefined, "GET").then((r) => { setRows(r.hotels); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  const cities = useMemo(() => Array.from(new Set(rows.map(city).filter(Boolean))).sort(), [rows]);
  const filtered = useMemo(() => rows.filter((h) => {
    const t = `${h.nomHotel} ${h.email} ${h.telephone ?? ""} ${h.rccm ?? ""}`.toLowerCase();
    return (!q || t.includes(q.toLowerCase())) && (!st || status(h) === st) && (!cat || String(h.profile?.etoiles) === cat) && (!loc || city(h) === loc) && (!reg || region(h) === reg);
  }), [rows, q, st, cat, loc, reg]);
  const pages = Math.max(1, Math.ceil(filtered.length / size)); const p = Math.min(page, pages); const slice = filtered.slice((p - 1) * size, p * size);
  const n = (s: string) => rows.filter((h) => status(h) === s).length;
  const reset = () => { setQ(""); setSt(""); setCat(""); setLoc(""); setReg(""); setPage(1); };
  const table = () => ({ head: ["Établissement", "RCCM", "Catégorie", "E-mail", "Téléphone", "Ville", "Inscription", "Statut"], body: filtered.map((h) => [h.nomHotel, h.rccm ?? "", h.profile?.etoiles ?? "", h.email, h.telephone ?? "", city(h), fd(h.createdAt), label[status(h)]]) });

  return (
    <div className="space-y-6">
      <Crumb items={[{ label: "Administration centrale", href: "/admin" }, { label: "Hôtels" }, { label: "Gestion des établissements" }]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl"><h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-mali">Gestion des hôtels <span className="rounded-md bg-gold/25 px-2 py-1 font-mono text-[10px] font-semibold text-amber-800">● {rows.length} établissements enregistrés</span></h1>
          <p className="mt-2 text-xs leading-relaxed text-muted">Consultez les établissements, gérez les demandes d’inscription et ajoutez directement de nouveaux hôtels à la plateforme SafeStay.</p></div>
        <div className="flex flex-wrap gap-3">
          <div className="flex overflow-hidden rounded-lg bg-white ring-1 ring-line" role="group" aria-label="Exporter la liste">
            <span className="flex items-center gap-2 px-3 text-xs font-semibold text-mali"><Download size={14} /> Exporter la liste</span>
            <button onClick={() => { const t = table(); downloadCsv("hotels", t.head, t.body); }} className="border-l border-line px-3 py-2.5 text-xs font-bold text-mali hover:bg-soft">CSV</button>
            <button onClick={() => { const t = table(); printTable("Liste des établissements", t.head, t.body); }} className="border-l border-line px-3 py-2.5 text-xs font-bold text-mali hover:bg-soft">PDF</button></div>
          <button onClick={() => setAdd(true)} className="flex items-center gap-2 rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep"><Plus size={14} /> Ajouter un hôtel</button>
        </div>
      </div>
      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total établissements" value={rows.length} icon={Building2} line="border-t-mali text-mali" progress={100} tint="bg-soft text-mali" foot={<span className="flex items-center gap-1.5"><Repeat2 size={12} />{n("approved")} actifs sur le réseau</span>} />
        <StatCard title="Hôtels actifs & homologués" value={n("approved")} icon={BadgeCheck} line="border-t-ok text-ok" progress={rows.length ? Math.round((n("approved")) / rows.length * 100) : 0} tint="bg-emerald-50 text-ok" foot={<span className="flex items-center gap-1.5 text-ok"><i className="h-2 w-2 rounded-full bg-ok" />Transmissions actives</span>} />
        <StatCard title="Demandes en attente" value={n("pending")} icon={ClipboardClock} line="border-t-gold text-gold-deep" progress={rows.length ? Math.round((n("pending")) / rows.length * 100) : 0} tint="bg-leaf/60 text-mali" foot={<span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-500" />{n("pending")} dossier{n("pending") > 1 ? "s" : ""} à instruire d’urgence</span>} />
        <StatCard title="Refusés / désactivés" value={n("rejected") + n("disabled")} icon={Ban} line="border-t-rouge text-rouge" progress={rows.length ? Math.round((n("rejected") + n("disabled")) / rows.length * 100) : 0} tint="bg-red-50 text-red-600" foot={<span className="flex items-center gap-1.5 text-red-600"><TriangleAlert size={12} />{n("disabled")} révoqué{n("disabled") > 1 ? "s" : ""} · {n("rejected")} refusé{n("rejected") > 1 ? "s" : ""}</span>} />
      </ul>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] flex-[2] items-center gap-2 rounded-lg bg-soft/70 px-3 py-3"><Search size={15} className="text-muted" /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher par hôtel, e-mail, téléphone ou RCCM" aria-label="Rechercher un hôtel" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
          <select value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }} aria-label="Statut" className={selectCls}><option value="">Tous les statuts</option>{Object.entries(label).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} aria-label="Catégorie" className={selectCls}><option value="">Toutes catégories</option>{[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} étoile{s > 1 ? "s" : ""}</option>)}</select>
          <select value={reg} onChange={(e) => { setReg(e.target.value); setPage(1); }} aria-label="Région" className={selectCls}><option value="">Toutes les régions</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
          <select value={loc} onChange={(e) => { setLoc(e.target.value); setPage(1); }} aria-label="Localité" className={selectCls}><option value="">Toutes les localités</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>
          <button onClick={reset} className="flex items-center gap-2 rounded-lg bg-soft px-4 py-3 text-xs font-semibold text-mali hover:bg-soft/70"><RotateCcw size={13} /> Réinitialiser</button>
        </div>
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-muted"><span>Affichage de {filtered.length ? (p - 1) * size + 1 : 0} à {Math.min(p * size, filtered.length)} sur {filtered.length} établissements · <span className="rounded bg-leaf px-1.5 py-0.5 text-mali">Territoire : {reg || "toutes les régions du Mali"}</span></span><span className="flex items-center gap-1.5"><Activity size={11} />Mis à jour en temps réel</span></p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left">
          <thead className="bg-mali font-mono text-[10px] uppercase text-white"><tr><Th>Établissement</Th><Th>Contact</Th><Th>Localisation</Th><Th>Inscription</Th><Th>Statut</Th><Th>Action</Th></tr></thead>
          <tbody className="divide-y divide-line text-[11px]">
            {loading && <tr><td colSpan={6} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des établissements…</td></tr>}
            {!loading && slice.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted">Aucun établissement ne correspond à ces critères.</td></tr>}
            {slice.map((h) => (
              <tr key={h._id} className="cursor-pointer hover:bg-soft/40" onClick={() => setOpen(h)}>
                <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Initials a={h.nomHotel[0]} b={h.nomHotel.split(" ")[1]?.[0]} /><span><span className="block text-sm font-bold text-mali">{h.nomHotel}</span><span className="mt-1 flex items-center gap-2 font-mono text-[10px]">{h.rccm && <span className="rounded bg-soft px-1.5 py-0.5 font-bold text-mali">{h.rccm}</span>}<span className="tracking-wider text-mali" aria-label={`${h.profile?.etoiles ?? 0} étoiles`}>{stars(h.profile?.etoiles)}</span></span></span></div></td>
                <td className="px-4 py-3.5 font-mono text-[10px]"><span className="flex items-center gap-1.5 text-mali">{h.email}<CopyBtn text={h.email} /></span><span className="text-muted">{h.telephone}</span></td>
                <td className="px-4 py-3.5"><span className="block text-xs font-bold text-mali">{place(h)}</span><span className="block font-mono text-[10px] text-muted">{[region(h), h.adresseHotel ?? h.profile?.adresse].filter(Boolean).join(" · ")}</span></td>
                <td className="px-4 py-3.5 font-mono text-[10px]">{fd(h.createdAt)}</td>
                <td className="px-4 py-3.5"><Pill tone={tone[status(h)]}>{label[status(h)]}</Pill></td>
                <td className="px-4 py-3.5"><button onClick={(e) => { e.stopPropagation(); setOpen(h); }} className="flex items-center gap-1.5 rounded-md bg-soft px-3 py-2 font-semibold text-mali hover:bg-soft/70"><Eye size={13} /> Consulter</button></td>
              </tr>))}
          </tbody></table></div>
        <AdminPager page={p} pages={pages} setPage={setPage} size={size} setSize={setSize} from={filtered.length ? (p - 1) * size + 1 : 0} to={Math.min(p * size, filtered.length)} total={filtered.length} noun="dossiers" />
      </div>
      <p className="flex items-center gap-2 rounded-lg bg-soft/80 px-4 py-3 font-mono text-[10px] text-muted"><ShieldCheck size={14} className="text-mali" /> Enregistrement sécurisé sous l’autorité du Ministère de la Sécurité et de la Protection civile et du Ministère du Tourisme du Mali.</p>
      {open && <HotelReviewDialog hotel={open} onClose={() => setOpen(null)} onDone={load} />}
      {add && <AddUserDialog lockRole="hotel" onClose={() => setAdd(false)} onDone={load} />}
    </div>
  );
}
