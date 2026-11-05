"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, RotateCcw, UserPlus, FileText, FileSpreadsheet, Users, IdCard, Building2, UserX, Loader2, Eye, Globe, Plane, BadgeCheck, ShieldCheck, ScanFace, Funnel, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { d as fd } from "@/lib/format";
import { downloadCsv, printTable, regId } from "@/lib/export";
import type { AdminUser } from "@/lib/types";
import AddUserDialog from "./AddUserDialog";
import HotelReviewDialog from "./HotelReviewDialog";
import UserDialog, { fullName, typeLabel } from "./UserDialog";
import { AdminPager, CopyBtn, Crumb, Initials, Pill, StatCard, Th, prefRows, selectCls } from "./ui";

type Stats = { total: number; clients: number; hotels: number; admins: number; desactives: number; enAttente: number; actifs: number };
const stat = (u: AdminUser) => (u.role === "hotel" && u.hotelStatus === "pending" ? "pending" : u.isActive ? "active" : "inactive");
const L = { active: "Actif", pending: "En attente", inactive: "Désactivé" } as const;
const T = { active: "ok", pending: "warn", inactive: "off" } as const;

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]); const [total, setTotal] = useState(0); const [pages, setPages] = useState(1); const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState(""); const [qs, setQs] = useState(""); const [type, setType] = useState(""); const [st, setSt] = useState(""); const [page, setPage] = useState(1); const [size, setSize] = useState(prefRows);
  const [loading, setLoading] = useState(true); const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null); const [hotel, setHotel] = useState<any>(null); const [add, setAdd] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setQs(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(size) }); if (qs) p.set("q", qs); if (type) p.set("type", type); if (st) p.set("statut", st);
    api<{ users: AdminUser[]; total: number; pages: number; stats: Stats }>(`/admin/users?${p}`, undefined, "GET").then((r) => { setRows(r.users); setTotal(r.total); setPages(r.pages); setStats(r.stats); setErr(""); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [page, size, qs, type, st]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  async function exportAll(kind: "csv" | "pdf") {
    const p = new URLSearchParams({ page: "1", limit: "200" }); if (qs) p.set("q", qs); if (type) p.set("type", type); if (st) p.set("statut", st);
    const r = await api<{ users: AdminUser[] }>(`/admin/users?${p}`, undefined, "GET").catch(() => null); if (!r) return;
    const head = ["ID registre", "Nom", "E-mail", "Téléphone", "Type", "Hôtel associé", "Création", "Statut"];
    const body = r.users.map((u) => [regId(u._id, u.createdAt), fullName(u), u.email, u.telephone ?? "", typeLabel(u), u.nomHotel ?? "", fd(u.createdAt), L[stat(u)]]);
    kind === "csv" ? downloadCsv("utilisateurs", head, body) : printTable("Rapport des utilisateurs", head, body);
  }
  const reset = () => { setQ(""); setType(""); setSt(""); setPage(1); };
  const Icon = (u: AdminUser) => (u.role === "superadmin" ? <ShieldCheck size={11} /> : u.role === "hotel" ? <Building2 size={11} /> : <UsersRound size={11} />);

  return (
    <div className="space-y-6">
      <Crumb items={[{ label: "Portail national DGSN" }, { label: "Administration centrale", href: "/admin" }, { label: "Utilisateurs" }]} right={<span className="flex items-center gap-1.5 rounded bg-white px-2 py-1 text-[9px] ring-1 ring-line"><i className="h-1.5 w-1.5 rounded-full bg-ok" />Synchro DGSN · temps réel certifié</span>} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl"><h1 className="text-3xl font-extrabold text-mali">Gestion des utilisateurs</h1><p className="mt-2 text-xs leading-relaxed text-muted">Retrouvez tous les comptes de SafeStay, consultez leurs informations et gérez leur accès à la plateforme.</p></div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => exportAll("csv")} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><FileSpreadsheet size={14} /> Export CSV</button>
          <button onClick={() => exportAll("pdf")} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><FileText size={14} /> Rapport PDF</button>
          <button onClick={() => setAdd(true)} className="flex items-center gap-2 rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep"><UserPlus size={14} /> Nouvel utilisateur</button>
        </div>
      </div>
      {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total des utilisateurs" value={stats?.total.toLocaleString("fr-FR") ?? "–"} icon={Users} line="border-t-mali" tint="bg-leaf text-mali" foot={<span className="flex items-center gap-1.5"><Globe size={12} className="text-ok" />Réseau national consolidé Mali</span>} />
        <StatCard title="Clients simples" value={stats?.clients.toLocaleString("fr-FR") ?? "–"} icon={IdCard} line="border-t-gold" tint="bg-soft text-mali" foot={<span className="flex items-center gap-1.5"><Plane size={12} />Voyageurs nationaux &amp; internationaux</span>} />
        <StatCard title="Utilisateurs d’hôtels" value={stats?.hotels.toLocaleString("fr-FR") ?? "–"} icon={Building2} line="border-t-mali" tint="bg-leaf text-mali" foot={<span className="flex items-center gap-1.5"><BadgeCheck size={12} />Comptes établissements</span>} />
        <StatCard title="Comptes désactivés" value={stats?.desactives ?? "–"} icon={UserX} line="border-t-red-600" tint="bg-red-50 text-red-600" foot={<span><span className="font-bold text-ok">{stats?.actifs.toLocaleString("fr-FR")}</span> actifs · <span className="font-bold text-amber-700">{stats?.enAttente}</span> en attente</span>} />
      </ul>

      <div className="flex gap-4 rounded-xl border border-line bg-white/95 p-5 shadow-sm"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-mali text-white"><ScanFace size={20} /></span>
        <div><h2 className="text-base font-extrabold text-mali">Cadre souverain d’intégrité légale &amp; traçabilité judiciaire</h2><p className="mt-1 text-xs leading-relaxed text-muted">Toute modification, désactivation ou suppression de profil conserve l’historique des fiches d’hôtel préalablement transmises aux services de la Police nationale (DGSN). Les comptes super administrateur font l’objet d’un audit de sécurité automatisé.</p></div></div>

      <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm"><div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[240px] flex-[2] items-center gap-2 rounded-lg bg-soft/70 px-3 py-3"><Search size={15} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, prénom, e-mail, téléphone" aria-label="Rechercher un utilisateur" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Type de compte" className={selectCls}><option value="">Tous les types ({stats?.total ?? "…"})</option><option value="client">Clients simples</option><option value="hotel">Utilisateurs d’hôtel</option><option value="superadmin">Super administrateurs</option></select>
        <label className="flex items-center gap-2"><Funnel size={14} className="text-muted" /><select value={st} onChange={(e) => { setSt(e.target.value); setPage(1); }} aria-label="Statut" className={selectCls}><option value="">Tous les statuts</option><option value="active">Actifs</option><option value="pending">En attente</option><option value="inactive">Désactivés</option></select></label>
        <button onClick={reset} className="flex items-center gap-2 rounded-lg bg-soft px-4 py-3 text-xs font-semibold text-mali hover:bg-soft/70"><RotateCcw size={13} /> Réinitialiser</button></div></div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white/95 shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left">
          <thead className="bg-mali font-mono text-[10px] uppercase text-white"><tr><Th>Utilisateur &amp; ID registre</Th><Th>Adresse e-mail</Th><Th>Téléphone</Th><Th>Type de compte</Th><Th>Hôtel associé</Th><Th>Création</Th><Th>Statut</Th><Th>Action</Th></tr></thead>
          <tbody className="divide-y divide-line text-[11px]">
            {loading && <tr><td colSpan={8} className="p-10 text-center text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement des utilisateurs…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted">Aucun utilisateur ne correspond à ces critères.</td></tr>}
            {rows.map((u) => (
              <tr key={u._id} onClick={() => setOpen(u._id)} className={`cursor-pointer hover:bg-soft/40 ${u.role === "superadmin" ? "bg-soft/60" : ""}`}>
                <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Initials a={u.role === "hotel" ? u.nomHotel?.[0] : u.prenom?.[0]} b={u.role === "hotel" ? u.nomHotel?.split(" ")[1]?.[0] : u.nom?.[0]} dark={u.role === "superadmin"} off={!u.isActive && stat(u) === "inactive"} /><span><span className="block text-sm font-bold text-mali">{fullName(u)}</span><span className="block font-mono text-[10px] text-muted">{regId(u._id, u.createdAt)}</span></span></div></td>
                <td className="px-4 py-3.5 text-xs"><span className="flex items-center gap-1.5">{u.email}<CopyBtn text={u.email} /></span></td>
                <td className="px-4 py-3.5 font-mono text-[10px]">{u.telephone || "—"}</td>
                <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[10px] font-bold ${u.role === "superadmin" ? "bg-mali text-white" : u.role === "hotel" ? "bg-leaf text-mali" : "bg-soft text-ink"}`}>{Icon(u)}{typeLabel(u)}</span></td>
                <td className="px-4 py-3.5">{u.role === "hotel" ? <><span className="block text-xs font-bold text-mali">{u.nomHotel}</span><span className="block font-mono text-[10px] text-muted">{u.villeHotel}</span></> : <span className="text-xs italic text-muted">Aucun</span>}</td>
                <td className="px-4 py-3.5 font-mono text-[10px]">{fd(u.createdAt)}</td>
                <td className="px-4 py-3.5"><Pill tone={T[stat(u)]}>{L[stat(u)]}</Pill></td>
                <td className="px-4 py-3.5"><button onClick={(e) => { e.stopPropagation(); setOpen(u._id); }} className="flex items-center gap-1.5 rounded-md bg-soft px-3 py-2 font-semibold text-mali hover:bg-soft/70"><Eye size={13} /> Consulter</button></td>
              </tr>))}
          </tbody></table></div>
        <AdminPager page={page} pages={pages} setPage={setPage} size={size} setSize={setSize} from={total ? (page - 1) * size + 1 : 0} to={Math.min(page * size, total)} total={total} noun="utilisateurs" />
      </div>
      <p className="flex items-center gap-2 rounded-lg bg-soft/80 px-4 py-3 font-mono text-[10px] text-muted"><ShieldCheck size={14} className="text-mali" /> Supervision des accès et sécurité des comptes sous l’autorité des autorités compétentes et du Ministère de la Sécurité et de la Protection civile.</p>
      {open && <UserDialog id={open} onClose={() => setOpen(null)} onDone={load} openHotel={(id) => { const h = rows.find((r) => r._id === id); setOpen(null); if (h) setHotel({ ...h, profile: null }); }} />}
      {hotel && <HotelReviewDialog hotel={hotel} onClose={() => setHotel(null)} onDone={load} />}
      {add && <AddUserDialog onClose={() => setAdd(false)} onDone={load} />}
    </div>
  );
}
