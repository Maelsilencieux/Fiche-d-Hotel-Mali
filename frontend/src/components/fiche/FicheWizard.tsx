"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Lock, ShieldCheck, Save, Headset, Phone, BadgeCheck, Gavel } from "lucide-react";
import { SUPPORT } from "@/lib/config";
import { api, type ApiError } from "@/lib/api";
import { getUser } from "@/lib/session";
import { Draft, Key, STEPS, emptyDraft, validate } from "./model";
import StepIdentite from "./StepIdentite";
import StepVoyage from "./StepVoyage";
import StepSejour from "./StepSejour";
import StepValidation from "./StepValidation";
import { AsideIdentite, Recap } from "./Aside";

const DRAFT_KEY = "ss_fiche_draft";
const FIELD_STEP: Partial<Record<string, number>> = { nom: 0, prenom: 0, dateNaissance: 0, lieuNaissance: 0, nationalite: 0, adresse: 0, ville: 0, venantDe: 1, allantA: 1, motif: 1, hotelId: 2, chambreNumero: 2, dateEntree: 2, dateSortie: 2, transport: 2, numeroPiece: 3, delivreLe: 3, delivreA: 3 };

export default function FicheWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(emptyDraft);
  const [hotelName, setHotelName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ reference: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [certify, setCertify] = useState(false);

  // Chargement du brouillon + préremplissage nom/prénom depuis le compte
  useEffect(() => {
    const u = getUser();
    setSessionId(`ID-ML-${(u?._id ?? "0000").slice(-4).toUpperCase()}`);
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { const s = JSON.parse(raw); setD({ ...emptyDraft(), ...s.d }); setStep(s.step ?? 0); setHotelName(s.hotelName ?? ""); setReady(true); return; }
    } catch {}
    setD((p) => ({ ...p, nom: (u?.nom ?? "").toUpperCase(), prenom: u?.prenom ?? "" }));
    setReady(true);
  }, []);

  // Sauvegarde automatique locale (le fichier PDF n'est jamais stocké)
  useEffect(() => { if (ready && !done) localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, step, hotelName })); }, [d, step, hotelName, ready, done]);

  const set = useCallback((k: Key, v: string) => { setD((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })); }, []);
  const onHotel = useCallback((n: string) => setHotelName(n), []);
  const go = (s: number) => { setStep(s); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); };

  function next() { const e = validate(step, d); setErrors(e); if (Object.keys(e).length === 0) go(step + 1); }

  async function submit() {
    const e = validate(3, d); setErrors(e);
    if (!file) { setFileError("La numérisation PDF de la pièce est obligatoire."); return; } setFileError("");
    if (!certify) { setError("Cochez l’engagement sur l’honneur pour soumettre votre fiche."); return; }
    if (Object.keys(e).length) return;
    setSending(true); setError("");
    const f = new FormData();
    (Object.keys(d) as (keyof Draft)[]).forEach((k) => { if (k !== "id" && k !== "hotelId" && d[k]) f.append(k, d[k]); });
    f.append("hotelId", d.hotelId); f.append("cnib", file);
    try {
      const r = await api<{ fiche: { _id: string; reference: string } }>("/fiches", f);
      localStorage.removeItem(DRAFT_KEY); setDone({ reference: r.fiche.reference });
      router.push(`/client/fiche/confirmation?id=${r.fiche._id}`);
    } catch (err) {
      const a = err as ApiError;
      const bad = Object.keys(a.fields ?? {}).map((k) => FIELD_STEP[k]).filter((x): x is number => x !== undefined);
      if (bad.length) { setError(`${a.message} Vérifiez l’étape ${Math.min(...bad) + 1}.`); setStep(Math.min(...bad)); } else setError(a.message);
    } finally { setSending(false); }
  }

  if (done) return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-ok"><CheckCircle2 size={28} /></span>
        <h1 className="mt-4 text-2xl font-extrabold text-mali">Fiche soumise avec succès</h1>
        <p className="mt-2 text-xs text-muted">Votre déclaration a été transmise à l’établissement pour vérification. Conservez votre référence :</p>
        <p className="mt-3 inline-block rounded-lg bg-soft px-4 py-2 font-mono text-sm font-bold text-mali">{done.reference}</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/client" className="rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white">Voir mes déclarations</Link><Link href="/" className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line">Accueil</Link></div>
      </div>
    </section>
  );
  if (!ready) return null;

  const nav = (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
      <button type="button" disabled={step === 0} onClick={() => go(step - 1)} className="flex items-center gap-2 rounded-lg bg-soft px-4 py-2.5 text-xs font-semibold text-muted enabled:text-mali disabled:opacity-60"><ArrowLeft size={13} /> Précédent</button>
      {step < 3 ? <button type="button" onClick={next} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep">Suivant : {STEPS[step].next} <ArrowRight size={13} /></button>
        : <button type="button" onClick={submit} disabled={sending} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep disabled:opacity-60">{sending ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} Soumettre ma fiche hôtelière de police</button>}
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-mali shadow-sm ring-1 ring-line"><i className="h-1.5 w-1.5 rounded-full bg-ok" /> République du Mali · Ministère de la Sécurité et de la Protection civile</p>
        <h1 className="mt-4 text-4xl font-bold text-mali-deep md:text-[2.7rem]">Fiche hôtelière de police</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">Enregistrement légal et obligatoire pour tout séjour en établissement d’hébergement au Mali.</p>
        <p className="mt-3 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-gold/25 px-4 py-1.5 font-mono text-[10px] text-amber-900"><span className="flex items-center gap-1.5"><BadgeCheck size={12} /> Réf. formulaire : <strong>FHP-ML-{new Date().getFullYear()}</strong></span><span className="flex items-center gap-1.5"><Gavel size={12} /> Arrêté N° 2024/ML-78</span><span>Session {sessionId}</span></p>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-white p-3 shadow-sm">
        <ol className="grid gap-2 sm:grid-cols-4" aria-label="Progression">
          {STEPS.map((s, i) => { const state = i < step ? "done" : i === step ? "now" : "todo"; return (
            <li key={s.label}>
              <button type="button" disabled={i > step} onClick={() => go(i)} aria-current={state === "now" ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${state === "now" ? "bg-mali text-white shadow-md" : state === "done" ? "bg-leaf" : "bg-soft/70"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${state === "done" ? "bg-mali text-white" : state === "now" ? "bg-gold text-mali-deep" : "bg-white text-muted"}`}>{state === "done" ? <Check size={15} /> : i + 1}</span>
                <span className="min-w-0"><span className={`block font-mono text-[9px] uppercase tracking-wide ${state === "now" ? "text-white/70" : "text-muted"}`}>{state === "now" ? "Étape actuelle" : state === "done" ? "Conforme" : "À suivre"}</span><span className={`block truncate text-xs font-bold ${state === "now" ? "text-white" : state === "todo" ? "text-muted" : "text-mali-deep"}`}>{i + 1}. {s.label}</span></span>
              </button>
            </li>); })}
        </ol>
        <div className="mx-1 mt-3 h-1.5 overflow-hidden rounded-full bg-soft"><i className="block h-full rounded-full bg-gradient-to-r from-[#14B53A] via-[#FCD116] to-[#CE1126] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

      {step === 3 ? (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm"><StepValidation d={d} set={set} errors={errors} file={file} setFile={(f) => { setFile(f); setFileError(""); }} fileError={fileError} /></div>
          <div><Recap d={d} hotelName={hotelName} fileName={file?.name} goTo={go} />
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-leaf/70 p-4 text-[11px] leading-relaxed text-mali-deep">
              <input type="checkbox" checked={certify} onChange={(e) => setCertify(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-mali" />
              <span><strong>Engagement sur l’honneur :</strong> je certifie l’exactitude des renseignements fournis sur cette fiche hôtelière de police. Je reconnais que toute fausse déclaration m’expose aux sanctions prévues par la loi.<span className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] text-muted"><ShieldCheck size={11} /> Données protégées · horodatage UTC sécurisé</span></span>
            </label>{nav}</div>
        </div>
      ) : (
        <div className={`mt-6 grid items-start gap-6 ${step === 0 ? "lg:grid-cols-[1.7fr_1fr]" : ""}`}>
          <div className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
            {step === 0 && <StepIdentite d={d} set={set} errors={errors} />}
            {step === 1 && <StepVoyage d={d} set={set} errors={errors} />}
            {step === 2 && <StepSejour d={d} set={set} errors={errors} onHotel={onHotel} />}
            <p className="mt-6 flex items-center justify-between rounded bg-soft px-3 py-2 font-mono text-[9px] text-muted"><span className="flex items-center gap-1.5"><Save size={11} /> Enregistrement automatique local actif</span><span>ID saisie : {d.id}</span></p>
            {nav}
            <p className="mt-5 text-center font-mono text-[9px] text-muted"><Lock size={10} className="mr-1 inline" />Données chiffrées de bout en bout · Souveraineté numérique nationale</p>
          </div>
          {step === 0 && <AsideIdentite d={d} />}
        </div>
      )}

      <aside className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-mali-deep p-5 text-white">
        <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gold text-mali-deep"><Headset size={20} /></span><span><span className="block text-sm font-bold">Besoin d’aide pour le remplissage ?</span><span className="block text-[11px] text-white/70">Assistance technique et réglementaire pour voyageurs et gérants.</span></span></span>
        <span className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 font-mono text-sm font-bold text-gold"><Phone size={15} /> {SUPPORT.phone}</span>
      </aside>
    </section>
  );
}
