"use client";
import { useEffect, useState } from "react";
import { X, Loader2, ShieldCheck, UserRound, Building2, IdCard, MapPin, ArrowRight, Power, PencilLine, Save, BadgeCheck } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { dt } from "@/lib/format";
import { regId } from "@/lib/export";
import type { AdminUser } from "@/lib/types";
import { Initials } from "./ui";

type Detail = { user: AdminUser; hotel: { nomHotel: string; etoiles?: number; adresse?: string; ville?: string; telephone?: string; email?: string } | null; stats: { fiches: number; transmitted: number } };
export const typeLabel = (u: AdminUser) => (u.role === "hotel" ? "Utilisateur d’hôtel" : u.role === "superadmin" ? "Super admin" : "Client simple");
export const fullName = (u: AdminUser) => (u.role === "hotel" ? u.nomHotel ?? "Établissement" : [u.prenom, u.nom].filter(Boolean).join(" "));

/** Détail d'un compte (2 onglets) avec désactivation / réactivation et modification. */
export default function UserDialog({ id, onClose, onDone, openHotel }: { id: string; onClose: () => void; onDone: () => void; openHotel?: (id: string) => void }) {
  const [d, setD] = useState<Detail | null>(null); const [tab, setTab] = useState<"gen" | "comp">("gen");
  const [edit, setEdit] = useState(false); const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const load = () => api<Detail>(`/admin/users/${id}`, undefined, "GET").then(setD).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);

  async function run(fn: () => Promise<unknown>, close = false) { setBusy(true); setErr(""); try { await fn(); onDone(); await load(); setEdit(false); if (close) onClose(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); } }
  const u = d?.user;
  const startEdit = () => { if (!u) return; setForm(u.role === "hotel" ? { telephone: u.telephone ?? "", nomHotel: u.nomHotel ?? "", adresseHotel: u.adresseHotel ?? "", villeHotel: u.villeHotel ?? "" } : { nom: u.nom ?? "", prenom: u.prenom ?? "", telephone: u.telephone ?? "" }); setEdit(true); };
  const pending = u?.role === "hotel" && u.hotelStatus === "pending";
  const status = !u ? null : pending ? { t: "En attente d’approbation", c: "text-amber-700" } : u.isActive ? { t: "Actif & opérationnel", c: "text-ok" } : { t: "Désactivé", c: "text-muted" };

  const Cell = ({ k, children, wide }: { k: string; children: React.ReactNode; wide?: boolean }) => <div className={`rounded-lg bg-soft/70 p-4 ${wide ? "sm:col-span-2" : ""}`}><dt className="font-mono text-[9px] uppercase text-muted">{k}</dt><dd className="mt-1 break-words text-sm font-semibold text-mali">{children}</dd></div>;
  const inp = (k: string, label: string) => <label className="block"><span className="font-mono text-[9px] uppercase text-muted">{label}</span><input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-mali" /></label>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mali-deep/60 p-3 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Détail du compte utilisateur" onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border-t-4 border-t-mali bg-white shadow-2xl">
        {!u ? <div className="p-16 text-center text-muted">{err ? <p role="alert" className="text-red-700">{err}</p> : <Loader2 className="mx-auto animate-spin" />}</div> : (<>
          <div className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-xl bg-mali text-lg font-extrabold text-white">{u.role === "hotel" ? (u.nomHotel ?? "H").slice(0, 2).toUpperCase() : `${u.prenom?.[0] ?? ""}${u.nom?.[0] ?? ""}`}</span>
              <div><p className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-mali"><ShieldCheck size={12} /> Détails du compte utilisateur · habilitation Police Hub</p>
                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-mali">{fullName(u)}<span className="rounded bg-leaf px-2 py-1 font-mono text-[10px] font-semibold text-mali">{typeLabel(u)}</span><span className={`rounded bg-soft px-2 py-1 font-mono text-[10px] font-semibold ${status!.c}`}>● {status!.t}</span></h2>
                <p className="mt-1 font-mono text-[11px] text-muted">{u.email} · ID registre : {regId(u._id, u.createdAt)}</p></div></div>
            <button onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-soft"><X size={18} /></button>
          </div>
          <div role="tablist" className="flex gap-2 border-b border-line bg-soft/70 px-5">
            {[{ id: "gen", label: "Informations générales", icon: UserRound }, { id: "comp", label: u.role === "hotel" ? `Informations complémentaires (${d?.hotel?.nomHotel ?? u.nomHotel})` : "Activité du compte", icon: u.role === "hotel" ? Building2 : IdCard }].map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id as "gen" | "comp")} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold ${tab === t.id ? "border-mali text-mali" : "border-transparent text-muted hover:text-mali"}`}><t.icon size={14} />{t.label}</button>))}
          </div>
          <div className="flex-1 overflow-y-auto bg-soft/40 p-5">
            {tab === "gen" ? (
              <section className="rounded-xl border border-line bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-base font-bold text-mali"><IdCard size={16} /> Identité &amp; droits d’accès</h3>
                {edit ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{u.role === "hotel" ? <>{inp("nomHotel", "Établissement")}{inp("telephone", "Téléphone direct")}{inp("adresseHotel", "Adresse")}{inp("villeHotel", "Ville")}</> : <>{inp("nom", "Nom")}{inp("prenom", "Prénom")}{inp("telephone", "Téléphone direct")}</>}<p className="font-mono text-[10px] text-muted sm:col-span-2">L’e-mail et le type de compte ne sont pas modifiables.</p></div> : (
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {u.role === "hotel" ? <Cell k="Établissement" wide>{u.nomHotel}</Cell> : <><Cell k="Nom">{u.nom || "—"}</Cell><Cell k="Prénom">{u.prenom || "—"}</Cell></>}
                    <Cell k="Courriel de connexion" wide>{u.email}</Cell><Cell k="Téléphone direct">{u.telephone || "—"}</Cell>
                    <Cell k="Type de compte">{u.role === "hotel" ? "Utilisateur d’hôtel agréé" : u.role === "superadmin" ? "Super administrateur" : "Client / voyageur"}</Cell><Cell k="Date de création">{dt(u.createdAt)}</Cell>
                    <Cell k="Dernière connexion">{u.lastLoginAt ? dt(u.lastLoginAt) : "Jamais connecté"}</Cell><Cell k="Statut du compte"><span className={status!.c}>● {status!.t}</span></Cell>
                  </dl>)}
              </section>
            ) : (
              <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-mali">{u.role === "hotel" ? <><Building2 size={16} /> Rattachement établissement</> : <><IdCard size={16} /> Fiches déposées</>}</h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  {u.role === "hotel" && <><div className="rounded-lg bg-soft/70 p-4"><dt className="font-mono text-[9px] uppercase text-muted">Hôtel</dt><dd className="mt-1 text-base font-extrabold text-mali">{d?.hotel?.nomHotel ?? u.nomHotel}</dd><dd className="mt-1 font-mono text-[10px] text-muted">Catégorie : {d?.hotel?.etoiles ?? "—"} étoiles</dd><dd className="mt-3 flex items-start gap-1.5 text-[11px] text-muted"><MapPin size={12} className="mt-0.5 shrink-0" />{[u.adresseHotel, u.villeHotel].filter(Boolean).join(", ")}</dd></div>
                    <div className="rounded-lg bg-soft/70 p-4"><dt className="font-mono text-[9px] uppercase text-muted">Rôle &amp; contact établissement</dt><dd className="mt-1 text-sm font-semibold text-mali">Compte établissement</dd><dd className="mt-1 font-mono text-[11px] text-mali">{d?.hotel?.email ?? u.email}</dd>{u.hotelStatus === "approved" && <dd className="mt-3 inline-flex items-center gap-1.5 rounded bg-leaf px-2 py-1 font-mono text-[10px] font-semibold text-mali"><BadgeCheck size={11} /> Homologué &amp; raccordé autorités</dd>}</div></>}
                  <div className="rounded-lg bg-soft/70 p-4"><dt className="font-mono text-[9px] uppercase text-muted">{u.role === "hotel" ? "Fiches transmises par cet établissement" : "Fiches transmises aux autorités"}</dt><dd className="mt-1 text-3xl font-extrabold text-mali">{(d?.stats.transmitted ?? 0).toLocaleString("fr-FR")}</dd><dd className="text-[11px] text-muted">sur {(d?.stats.fiches ?? 0).toLocaleString("fr-FR")} fiches au total</dd>
                    {u.role === "hotel" && openHotel && <button onClick={() => openHotel(u._id)} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-mali">Consulter la fiche de l’hôtel <ArrowRight size={13} /></button>}</div>
                </dl></section>)}
            {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white p-4">
            {u.role !== "superadmin" && !pending ? (u.isActive
              ? <button disabled={busy} onClick={() => run(() => api(`/admin/users/${u._id}/statut`, { isActive: false }, "PATCH"))} className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"><Power size={13} /> Désactiver le compte</button>
              : <button disabled={busy} onClick={() => run(() => api(`/admin/users/${u._id}/statut`, { isActive: true }, "PATCH"))} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-ok"><Power size={13} /> Réactiver le compte</button>) : <span />}
            <div className="flex gap-2"><button onClick={onClose} className="rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-mali ring-1 ring-line">Fermer</button>
              {u.role !== "superadmin" && (edit ? <button disabled={busy} onClick={() => run(() => api(`/admin/users/${u._id}`, form, "PATCH"))} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer</button>
                : <button onClick={() => { setTab("gen"); startEdit(); }} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep"><PencilLine size={13} /> Modifier les informations</button>)}</div>
          </div></>)}
      </div>
    </div>
  );
}
