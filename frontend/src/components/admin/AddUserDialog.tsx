"use client";
import { REGIONS } from "@/lib/mali";
import { useEffect, useState, type FormEvent } from "react";
import { X, Loader2, Copy, Check, KeyRound } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { Field } from "@/components/auth/Field";

type Role = "client" | "hotel" | "superadmin";

/** Création d'un compte : « Ajouter un hôtel » (lockRole="hotel") ou « Nouvel utilisateur ». */
export default function AddUserDialog({ lockRole, onClose, onDone }: { lockRole?: Role; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState<Role>(lockRole ?? "client");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ user: AdminUser; tempPassword?: string } | null>(null); const [copied, setCopied] = useState(false);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true); setError(""); setErrors({});
    try { const r = await api<{ user: AdminUser; tempPassword?: string }>("/admin/users", { ...f, role, password: f.password || undefined }); setCreated(r); onDone(); }
    catch (x) { const a = x as ApiError; setErrors(a.fields ?? {}); setError(a.message); } finally { setBusy(false); }
  }
  const title = lockRole === "hotel" ? "Ajouter un hôtel" : "Nouvel utilisateur";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mali-deep/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl bg-mali-deep px-5 py-4 text-white"><h2 className="text-lg font-extrabold">{title}</h2><button onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><X size={15} /></button></div>
        {created ? (
          <div className="p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-ok"><Check size={24} /></span>
            <h3 className="mt-3 text-base font-extrabold text-mali">Compte créé</h3><p className="mt-1 text-xs text-muted">{created.user.nomHotel ?? `${created.user.prenom} ${created.user.nom}`} · {created.user.email}</p>
            {created.tempPassword ? (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-left"><p className="flex items-center gap-2 text-xs font-bold text-amber-800"><KeyRound size={14} /> Mot de passe temporaire (affiché une seule fois)</p>
                <p className="mt-2 flex items-center justify-between rounded bg-white px-3 py-2 font-mono text-sm font-bold text-mali">{created.tempPassword}
                  <button onClick={() => { navigator.clipboard?.writeText(created.tempPassword!); setCopied(true); }} aria-label="Copier le mot de passe" className="text-muted hover:text-mali">{copied ? <Check size={14} /> : <Copy size={14} />}</button></p>
                <p className="mt-2 text-[11px] text-amber-800">Transmettez-le de façon sécurisée ; l’utilisateur peut le changer via « Mot de passe oublié ».</p></div>) : null}
            <button onClick={onClose} className="mt-5 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white">Terminer</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4 p-6">
            {!lockRole && <div><label htmlFor="role" className="mb-1.5 block text-[11px] font-semibold text-mali">Type de compte <span className="text-red-600">*</span></label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-lg border border-line bg-soft/60 px-3 py-2.5 text-xs"><option value="client">Client / voyageur</option><option value="hotel">Utilisateur d’hôtel (établissement)</option><option value="superadmin">Super administrateur</option></select></div>}
            {role === "hotel" ? (<>
              <Field label="Nom de l’établissement" name="nomHotel" required error={errors.nomHotel} placeholder="Ex : Hôtel Oubamako" />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="N° RCCM / agrément" name="rccm" required placeholder="AGR-001-HT" /><Field label="Ville" name="villeHotel" required placeholder="Bamako" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-[11px] font-semibold text-mali">Région</span><select name="regionHotel" defaultValue="District de Bamako" className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 text-xs">{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></label><Field label="Commune / quartier" name="communeHotel" placeholder="ACI 2000" /></div>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]"><Field label="Adresse" name="adresseHotel" required placeholder="Av. de l’Indépendance" />
                <div><label htmlFor="etoiles" className="mb-1.5 block text-[11px] font-semibold text-mali">Catégorie</label><select id="etoiles" name="etoiles" defaultValue="3" className="w-full rounded-lg border border-line bg-soft/60 px-3 py-2.5 text-xs">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} étoile{n > 1 ? "s" : ""}</option>)}</select></div></div>
            </>) : (
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Nom" name="nom" required error={errors.nom} /><Field label="Prénom" name="prenom" required error={errors.prenom} /></div>)}
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Adresse e-mail" name="email" type="email" required error={errors.email} /><Field label="Téléphone" name="telephone" type="tel" placeholder="+223 …" /></div>
            <Field label="Mot de passe initial" name="password" type="text" autoComplete="off" error={errors.password} hint="Laissez vide pour générer un mot de passe temporaire sécurisé." />
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-line pt-4"><button type="button" onClick={onClose} className="rounded-lg bg-soft px-4 py-2.5 text-xs font-semibold text-mali">Annuler</button>
              <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep disabled:opacity-60">{busy && <Loader2 size={13} className="animate-spin" />} Créer le compte</button></div>
          </form>)}
      </div>
    </div>
  );
}
