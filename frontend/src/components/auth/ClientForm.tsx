"use client";
import { useRouter } from "next/navigation";
import { IdCard, ArrowRight, Mail, Phone, Loader2 } from "lucide-react";
import { Field, PasswordField } from "./Field";
import Terms from "./Terms";
import { useRegister } from "./useRegister";

export default function ClientForm() {
  const router = useRouter();
  const { errors, globalError, loading, submit } = useRegister(
    "/auth/register/client",
    (f) => ({
      nom: f.get("nom"), prenom: f.get("prenom"), email: f.get("email"), password: f.get("password"),
      telephone: f.get("telephone") ? `+223 ${f.get("telephone")}` : "",
    }),
    () => router.push("/connexion?inscrit=client"),
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-mali"><IdCard size={17} /></span>
        <div><h2 className="text-sm font-bold text-mali">Identité du voyageur</h2><p className="text-[10px] text-muted">Pour le pré-enregistrement sécurisé de vos fiches hôtelières au Mali</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" name="nom" placeholder="Ex: KODRO" required error={errors.nom} autoComplete="family-name" />
        <Field label="Prénom" name="prenom" placeholder="Ex: Jean-Luc" required error={errors.prenom} autoComplete="given-name" />
      </div>
      <Field label="Adresse e-mail" name="email" type="email" placeholder="amadou.traore@exemple.ml" required icon={<Mail size={13} />} error={errors.email} autoComplete="email" />
      <Field label="Numéro de téléphone" name="telephone" type="tel" prefix={<><Phone size={12} className="mr-1 inline" />+223</>} placeholder="70 00 00 00" hint="Numéro pour la réception du récépissé et alertes SMS de conformité." autoComplete="tel-national" />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField label="Mot de passe" name="password" placeholder="••••••••" required error={errors.password} hint="Au moins 8 caractères requis." autoComplete="new-password" />
        <PasswordField label="Confirmation du mot de passe" name="confirm" placeholder="••••••••" required error={errors.confirm} autoComplete="new-password" />
      </div>
      <Terms error={errors.terms} />
      {globalError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{globalError}</p>}
      <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-mali py-3 text-sm font-semibold text-white hover:bg-mali-deep disabled:opacity-60">
        {loading ? <Loader2 size={15} className="animate-spin" /> : null} Créer mon compte client <ArrowRight size={15} />
      </button>
    </form>
  );
}
