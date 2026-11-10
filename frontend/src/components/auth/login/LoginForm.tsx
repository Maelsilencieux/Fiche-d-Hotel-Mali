"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, CheckCircle2, Headset, Phone, Building2, MonitorCheck } from "lucide-react";
import { SUPPORT } from "@/lib/config";
import { api, type ApiError } from "@/lib/api";
import { saveSession, homeFor, type SessionUser } from "@/lib/session";
import { Field, PasswordField } from "../Field";



export default function LoginForm({ justRegistered }: { justRegistered?: "client" | "hotel" }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 
async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  console.log("Email récupéré :", email);
  console.log("Mot de passe renseigné :", password.length > 0);

  setErrors({});
  setError("");

  if (!email || !password) {
    setError("Veuillez renseigner votre e-mail et votre mot de passe.");
    return;
  }

  setLoading(true);

  try {
    const r = await api<{ token: string; user: SessionUser }>(
      "/auth/login",
      { email, password }
    );

    saveSession(r.token, r.user, remember);
    router.push(homeFor(r.user.role));
  } catch (err) {
    const a = err as ApiError;
    setErrors(a.fields ?? {});
    setError(a.message);
  } finally {
    setLoading(false);
  }
}


  const ph = "identifiant@exemple.ml";

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-mali-deep">Se connecter</h2>
          <p className="mt-1 text-xs text-ok">Entrez vos identifiants pour accéder à votre compte.</p>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-soft text-mali"><Lock size={14} /></span>
      </div>

      {justRegistered && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-ok">
          <CheckCircle2 size={14} /> Compte créé. Connectez-vous avec vos identifiants.
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-5 space-y-4">
        <Field label="Adresse e-mail" name="email" type="email" required icon={<Mail size={13} />} placeholder={ph} error={errors.email} autoComplete="email" />
        <PasswordField label="Mot de passe" name="password" required placeholder="Entrez votre mot de passe" error={errors.password} autoComplete="current-password" />
        <div className="flex items-center justify-between text-[11px]">
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" name="remember" className="h-3.5 w-3.5 accent-mali" /> Mémoriser cet appareil</label>
          <Link href="/mot-de-passe-oublie" className="font-semibold text-mali hover:underline">Mot de passe oublié ?</Link>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-mali py-3 text-sm font-semibold text-white hover:bg-mali-deep disabled:opacity-60">
          {loading && <Loader2 size={15} className="animate-spin" />} Se connecter <ArrowRight size={15} />
        </button>
      </form>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-center text-[11px] text-muted"><Building2 size={13} /> Pas encore de compte ? <Link href="/inscription" className="font-semibold text-mali hover:underline">Créer un compte ›</Link></p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-soft px-3.5 py-3 text-[11px]">
        <span className="flex items-center gap-1.5 font-bold text-mali-deep"><Headset size={14} className="text-mali" /> Assistance</span>
        <span className="flex items-center gap-1.5 text-muted"><Phone size={12} /> {SUPPORT.phone}</span>
        <span className="truncate text-muted">{SUPPORT.email}</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4 font-mono text-[9px] text-muted">
        <p className="flex items-center gap-1.5"><MonitorCheck size={11} /> Poste certifié · Registre d’État sécurisé · Bamako, Mali</p>
        <Link href="/admin-login" className="hover:text-mali hover:underline">Accès Admin</Link>
      </div>
    </div>
  );
}
