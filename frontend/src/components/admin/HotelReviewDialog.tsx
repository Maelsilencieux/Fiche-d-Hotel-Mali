"use client";
import { useEffect, useState } from "react";
import { X, Check, Ban, Loader2, Power, Building2, MapPin, Mail, Phone, Star } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { dt } from "@/lib/format";
import type { AdminHotel } from "@/lib/types";

/** Fiche d'un établissement : actions selon son statut (approuver / rejeter / désactiver / réactiver). */
export default function HotelReviewDialog({ hotel, onClose, onDone }: { hotel: AdminHotel & { isActive?: boolean; approvedAt?: string }; onClose: () => void; onDone: () => void }) {
  const [refusing, setRefusing] = useState(false); const [raison, setRaison] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [stats, setStats] = useState<{ fiches: number; transmitted: number } | null>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => { api<{ stats: { fiches: number; transmitted: number } }>(`/admin/users/${hotel._id}`, undefined, "GET").then((r) => setStats(r.stats)).catch(() => {}); }, [hotel._id]);

  async function run(call: () => Promise<unknown>) { setBusy(true); setErr(""); try { await call(); onDone(); onClose(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); } }
  const approve = () => run(() => api(`/admin/hotels/${hotel._id}/approuver`, undefined, "PATCH"));
  const reject = () => run(() => api(`/admin/hotels/${hotel._id}/rejeter`, { raison: raison.trim() || undefined }, "PATCH"));
  const toggle = (on: boolean) => run(() => api(`/admin/users/${hotel._id}/statut`, { isActive: on }, "PATCH"));

  const st = hotel.hotelStatus === "pending" ? { t: "En attente d’approbation", c: "bg-amber-50 text-amber-700" } : hotel.hotelStatus === "rejected" ? { t: "Refusé", c: "bg-red-50 text-red-600" } : hotel.isActive === false ? { t: "Désactivé (révoqué)", c: "bg-soft text-muted" } : { t: "Approuvé & actif", c: "bg-emerald-50 text-ok" };
  const Row = ({ icon: I, k, v }: { icon?: any; k: string; v?: string | number }) => <div className="rounded-lg bg-soft/70 p-3"><dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-muted">{I && <I size={11} />}{k}</dt><dd className="mt-1 text-xs font-semibold text-mali">{v || "—"}</dd></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mali-deep/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Fiche de l’établissement" onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between rounded-t-2xl bg-mali-deep px-5 py-4 text-white"><div><p className="font-mono text-[10px] text-white/60">Dossier établissement · habilitation Police Hub</p><h2 className="flex flex-wrap items-center gap-2 text-xl font-extrabold">{hotel.nomHotel}<span className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${st.c}`}>● {st.t}</span></h2></div>
          <button onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><X size={15} /></button></div>
        <dl className="grid gap-3 p-5 sm:grid-cols-2">
          <Row icon={Building2} k="N° RCCM / agrément" v={hotel.rccm} /><Row icon={Star} k="Catégorie" v={hotel.profile?.etoiles ? `${"★".repeat(hotel.profile.etoiles)} (${hotel.profile.etoiles} étoiles)` : undefined} />
          <Row icon={MapPin} k="Adresse" v={[hotel.adresseHotel, hotel.villeHotel].filter(Boolean).join(", ")} /><Row icon={Phone} k="Téléphone" v={hotel.telephone} />
          <Row icon={Mail} k="E-mail du compte" v={hotel.email} /><Row k="Inscription" v={dt(hotel.createdAt)} />
          <Row k="Fiches reçues" v={stats ? stats.fiches.toLocaleString("fr-FR") : "…"} /><Row k="Fiches transmises aux autorités" v={stats ? stats.transmitted.toLocaleString("fr-FR") : "…"} />
          {hotel.hotelRejectedReason && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700 sm:col-span-2"><strong>Motif du refus :</strong> {hotel.hotelRejectedReason}</p>}
        </dl>
        {refusing && <div className="px-5 pb-3"><label htmlFor="raison" className="text-[11px] font-semibold text-mali">Motif du rejet (transmis à l’établissement)</label><textarea id="raison" autoFocus rows={2} value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Ex : RCCM illisible" className="mt-1 w-full rounded-lg border border-line bg-soft/60 p-3 text-xs outline-none focus:border-mali" /></div>}
        {err && <p role="alert" className="mx-5 mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">
          <button onClick={onClose} className="rounded-lg bg-soft px-4 py-2.5 text-xs font-semibold text-mali">Fermer</button>
          {hotel.hotelStatus === "approved" && hotel.isActive !== false && <button disabled={busy} onClick={() => toggle(false)} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"><Power size={13} /> Désactiver</button>}
          {hotel.hotelStatus === "approved" && hotel.isActive === false && <button disabled={busy} onClick={() => toggle(true)} className="flex items-center gap-1.5 rounded-lg bg-ok px-4 py-2.5 text-xs font-semibold text-white"><Power size={13} /> Réactiver</button>}
          {hotel.hotelStatus !== "approved" && !refusing && <>
            {hotel.hotelStatus === "pending" && <button onClick={() => setRefusing(true)} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"><Ban size={13} /> Rejeter</button>}
            <button disabled={busy} onClick={approve} className="flex items-center gap-1.5 rounded-lg bg-ok px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approuver</button></>}
          {refusing && <button disabled={busy} onClick={reject} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{busy && <Loader2 size={13} className="animate-spin" />} Confirmer le rejet</button>}
        </div>
      </div>
    </div>
  );
}
