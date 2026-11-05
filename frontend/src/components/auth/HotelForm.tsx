"use client";
import { useState } from "react";
import { REGIONS, COMMUNES } from "@/lib/mali";
import { Building2, ArrowRight, Mail, Phone, Loader2, Clock } from "lucide-react";
import { Field, PasswordField } from "./Field";
import Terms from "./Terms";
import { useRegister } from "./useRegister";

// Champs alignés sur POST /api/auth/register/hotel (design à confirmer)
export default function HotelForm() {
  const [done, setDone] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const { errors, globalError, loading, submit } = useRegister(
    "/auth/register/hotel",
    (f) => ({
      nomHotel: f.get("nomHotel"), rccm: f.get("rccm"), adresseHotel: f.get("adresseHotel"), villeHotel: f.get("villeHotel"), regionHotel: f.get("regionHotel"), communeHotel: f.get("communeHotel"),
      email: f.get("email"), password: f.get("password"), telephone: f.get("telephone") ? `+223 ${f.get("telephone")}` : "",
    }),
    (r) => setDone(r.message),
  );

  if (done) return (
    <div role="status" className="rounded-xl bg-soft p-6 text-center">
      <Clock className="mx-auto text-mali" size={26} />
      <h2 className="mt-3 text-sm font-bold text-mali">Demande enregistrée</h2>
      <p className="mt-1 text-xs text-muted">{done}</p>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-mali"><Building2 size={17} /></span>
        <div><h2 className="text-sm font-bold text-mali">Identité de l’établissement</h2><p className="text-[10px] text-muted">Votre compte sera activé après vérification de votre RCCM (24–48h)</p></div>
      </div>
      <Field label="Nom de l’établissement" name="nomHotel" placeholder="Ex: Hôtel Oubamako" required error={errors.nomHotel} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="N° RCCM" name="rccm" placeholder="RCCM/ML-BKO-..." required error={errors.rccm} />
        <Field label="Ville" name="villeHotel" placeholder="Ex: Bamako" required error={errors.villeHotel} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-[11px] font-semibold text-mali">Région <span className="text-rouge">*</span></span>
          <select name="regionHotel" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-mali/30">{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="block"><span className="text-[11px] font-semibold text-mali">Commune / quartier</span>
          <input name="communeHotel" list="communes-ml" placeholder="Ex : ACI 2000" className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-mali/30" />
          <datalist id="communes-ml">{(COMMUNES[region] ?? []).map((c) => <option key={c} value={c} />)}</datalist></label>
      </div>
      <Field label="Adresse" name="adresseHotel" placeholder="Quartier, rue" required error={errors.adresseHotel} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Adresse e-mail" name="email" type="email" required icon={<Mail size={13} />} error={errors.email} placeholder="contact@hotel.ml" />
        <Field label="Téléphone" name="telephone" type="tel" prefix={<><Phone size={12} className="mr-1 inline" />+223</>} placeholder="70 00 00 00" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField label="Mot de passe" name="password" placeholder="••••••••" required error={errors.password} hint="Au moins 8 caractères requis." />
        <PasswordField label="Confirmation du mot de passe" name="confirm" placeholder="••••••••" required error={errors.confirm} />
      </div>
      <Terms error={errors.terms} />
      {globalError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{globalError}</p>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-mali py-3 text-sm font-semibold text-white hover:bg-mali-deep disabled:opacity-60">
        {loading ? <Loader2 size={15} className="animate-spin" /> : null} Créer mon compte établissement <ArrowRight size={15} />
      </button>
    </form>
  );
}
