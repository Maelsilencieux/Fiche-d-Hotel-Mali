"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Send, Lock, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { api, type ApiError } from "@/lib/api";

const profils = ["Client / Voyageur", "Établissement hôtelier", "Autorité / Partenaire institutionnel", "Autre"];
const sujets = ["Assistance technique", "Problème de compte ou de connexion", "Question sur une fiche / déclaration", "Inscription d’un établissement", "Partenariat institutionnel", "Autre demande"];

function Select({ id, label, value, onChange, options, placeholder, error }: { id: string; label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string; error?: string }) {
  return (
    <div><label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-mali">{label} <span className="text-red-600">*</span></label>
      <div className={`relative rounded-lg border bg-white ${error ? "border-red-500" : "border-line"} focus-within:border-mali`}>
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} className="w-full appearance-none bg-transparent px-3 py-3 pr-9 text-sm text-ink outline-none"><option value="">{placeholder}</option>{options.map((o) => <option key={o}>{o}</option>)}</select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}</div>
  );
}

export default function ContactForm() {
  const [f, setF] = useState({ nom: "", email: "", profil: "", sujet: "", message: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [ref, setRef] = useState("");
  const set = (k: keyof typeof f, v: string | boolean) => { setF((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };

  async function submit(e: FormEvent) {
    e.preventDefault(); setError("");
    const er: Record<string, string> = {};
    if (!f.nom.trim()) er.nom = "Nom requis."; if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Adresse e-mail invalide.";
    if (!f.profil) er.profil = "Sélectionnez votre profil."; if (!f.sujet) er.sujet = "Sélectionnez un sujet.";
    if (f.message.trim().length < 10) er.message = "Décrivez votre demande (10 caractères minimum)."; if (!f.consent) er.consent = "Votre accord est nécessaire pour traiter la demande.";
    setErrors(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { const r = await api<{ reference: string }>("/contact", { nom: f.nom, email: f.email, profil: f.profil, sujet: f.sujet, message: f.message }); setRef(r.reference); }
    catch (x) { const a = x as ApiError; setErrors(a.fields ?? {}); setError(a.message); } finally { setBusy(false); }
  }

  if (ref) return (
    <div role="status" className="rounded-2xl bg-white p-10 text-center shadow-xl ring-1 ring-line">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-ok"><CheckCircle2 size={28} /></span>
      <h2 className="mt-4 text-2xl font-extrabold text-mali">Message transmis</h2>
      <p className="mt-2 text-sm text-muted">Notre équipe vous répondra sous 24h ouvrées. Conservez votre identifiant de suivi :</p>
      <p className="mt-3 inline-block rounded-lg bg-soft px-4 py-2 font-mono text-sm font-bold text-mali">{ref}</p>
      <p className="mt-6"><button onClick={() => { setRef(""); setF({ nom: "", email: "", profil: "", sujet: "", message: "", consent: false }); }} className="text-sm font-semibold text-mali underline">Envoyer un autre message</button></p>
    </div>
  );

  const input = (err?: string) => `w-full rounded-lg border bg-white px-3 py-3 text-sm outline-none placeholder:text-muted/60 focus:border-mali ${err ? "border-red-500" : "border-line"}`;
  return (
    <form onSubmit={submit} noValidate className="rounded-2xl bg-white p-F8 shadow-xl ring-1 ring-line">
      <p className="font-mono text-[10px] uppercase text-muted">Transmission directe</p>
      <h2 className="text-3xl font-extrabold text-mali">Envoyez-nous un message</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">Remplissez le formulaire ci-dessous et décrivez votre demande. Chaque soumission génère un identifiant unique de suivi.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="nom" className="mb-1.5 block text-sm font-semibold text-mali">Nom complet <span className="text-red-600">*</span></label><input id="nom" value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Ex: Jean-Paul Koyamba" autoComplete="name" className={input(errors.nom)} />{errors.nom && <p className="mt-1 text-[11px] text-red-600">{errors.nom}</p>}</div>
        <div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-mali">Adresse e-mail <span className="text-red-600">*</span></label><input id="email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Ex: votre.nom@exemple.com" autoComplete="email" className={input(errors.email)} />{errors.email && <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>}</div>
        <Select id="profil" label="Vous êtes" value={f.profil} onChange={(v) => set("profil", v)} options={profils} placeholder="Sélectionnez votre profil" error={errors.profil} />
        <Select id="sujet" label="Sujet de votre demande" value={f.sujet} onChange={(v) => set("sujet", v)} options={sujets} placeholder="Sélectionnez un sujet" error={errors.sujet} />
      </div>
      <div className="mt-5"><label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-mali">Votre message <span className="text-red-600">*</span></label>
        <textarea id="message" rows={5} value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="Décrivez précisément votre demande ou le problème rencontré…" className={input(errors.message)} />{errors.message && <p className="mt-1 text-[11px] text-red-600">{errors.message}</p>}</div>
      <label className="mt-5 flex items-start gap-3 text-xs leading-relaxed text-muted"><input type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4 accent-mali" />
        <span>J’accepte que les informations fournies soient utilisées pour traiter et répondre à ma demande dans le cadre de l’assistance SafeStay. <Link href="/confidentialite" className="font-semibold text-mali underline">En savoir plus sur la protection des données.</Link></span></label>
      {errors.consent && <p className="mt-1 text-[11px] text-red-600">{errors.consent}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="flex items-center gap-2 font-mono text-[10px] text-ok"><Lock size={12} /> Transmission sécurisée </p>
        <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-mali px-6 py-3 text-sm font-semibold text-white hover:bg-mali-deep disabled:opacity-60">{busy ? <Loader2 size={15} className="animate-spin" /> : null} Envoyer mon message <Send size={15} /></button></div>
    </form>
  );
}
