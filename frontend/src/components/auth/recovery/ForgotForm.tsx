"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound, UserRound, Hotel, Mail, ArrowRight, ArrowLeft, Loader2, ShieldCheck, MailCheck } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { Field } from "../Field";

export default function ForgotForm() {
  const [profile, setProfile] = useState<"client" | "hotel">("client");
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState("");
  const [sent, setSent] = useState<{ email: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setError(""); setFieldErr(""); setLoading(true);
    try { const r = await api<{ message: string }>("/auth/forgot-password", { email }); setSent({ email, message: r.message }); }
    catch (err) { const a = err as ApiError; setFieldErr(a.fields?.email ?? ""); setError(a.fields?.email ? "" : a.message); }
    finally { setLoading(false); }
  }

  const tabs = [{ id: "client", label: "Client / Voyageur", icon: UserRound }, { id: "hotel", label: "Hôtel / Établissement", icon: Hotel }] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
      <div className="h-1 bg-gradient-to-r from-[#14B53A] via-[#FCD116] via-50% to-[#CE1126]" />
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between font-mono text-[9px]">
          <span className="flex items-center gap-1 rounded bg-soft px-2 py-0.5 text-mali"><KeyRound size={10} /> Réinitialisation d’accès</span>
          <span className="flex items-center gap-1.5 text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Serveur d’envoi opérationnel</span>
        </div>

        {sent ? (
          <div role="status" className="py-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-ok"><MailCheck size={22} /></span>
            <h2 className="mt-4 text-xl font-extrabold text-mali">Vérifiez votre messagerie</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted">{sent.message}</p>
            <p className="mt-1 font-mono text-[10px] text-mali">{sent.email}</p>
            <button onClick={() => setSent(null)} className="mt-5 text-xs font-semibold text-mali hover:underline">Utiliser une autre adresse</button>
          </div>
        ) : (
          <>
            <h2 className="mt-5 text-2xl font-extrabold text-mali">Mot de passe oublié ?</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">Renseignez l’adresse e-mail associée à votre compte SafeStay pour recevoir la procédure sécurisée de récupération.</p>

            <p className="mb-2 mt-5 font-mono text-[9px] text-muted">Type de compte</p>
            <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
              {tabs.map(({ id, label, icon: I }) => (
                <button key={id} type="button" role="tab" aria-selected={profile === id} onClick={() => setProfile(id)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold ${profile === id ? "bg-mali text-white shadow" : "text-muted hover:text-mali"}`}><I size={13} /> {label}</button>
              ))}
            </div>

            <form onSubmit={submit} noValidate className="mt-5 space-y-4">
              <Field label="Adresse e-mail enregistrée" name="email" type="email" required icon={<Mail size={13} />} autoComplete="email"
                placeholder={profile === "client" ? "ex: voyageur@safestay.ml" : "ex: reception@hotel.ml"} error={fieldErr}
                hint="Indiquez le courriel personnel renseigné lors de l’enregistrement de votre titre de séjour ou manifeste." />
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
              <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-mali py-3 text-sm font-semibold text-white hover:bg-mali-deep disabled:opacity-60">
                {loading && <Loader2 size={15} className="animate-spin" />} Envoyer le lien de réinitialisation <ArrowRight size={15} />
              </button>
            </form>
          </>
        )}

        <div className="mt-6 flex items-center justify-between text-[11px]">
          <Link href="/connexion" className="flex items-center gap-1 font-semibold text-mali hover:underline"><ArrowLeft size={12} /> Retour à la connexion</Link>
          <span className="text-muted">Pas de compte ? <Link href="/inscription" className="font-semibold text-mali underline">Créer un compte</Link></span>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-line pt-4 font-mono text-[9px] text-muted"><ShieldCheck size={11} /> Protocole sécurisé TLS 1.3 · Centre de télé-transmission Bamako, Mali</p>
      </div>
    </div>
  );
}
