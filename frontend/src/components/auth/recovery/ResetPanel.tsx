"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, Circle, CheckCircle2, ListChecks, ArrowLeft, Loader2, Lock, History, XCircle } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { saveSession, homeFor, type SessionUser } from "@/lib/session";
import { PasswordField } from "../Field";

const rules = [
  { id: "len", label: "Au moins 8 caractères (recommandé : 12+)", ok: (p: string) => p.length >= 8 },
  { id: "case", label: "Une majuscule (A-Z) et une minuscule (a-z)", ok: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: "num", label: "Un chiffre numérique (0 à 9)", ok: (p: string) => /\d/.test(p) },
  { id: "sym", label: "Au moins un symbole spécial (@, #, $, !, %, *, ?)", ok: (p: string) => /[^A-Za-z0-9]/.test(p) },
];
const levels = ["Non saisi", "Faible", "Moyen", "Bon", "Fort"];
const maskEmail = (e: string) => { const [l, d] = e.split("@"); return d ? `${l[0]}***${l.length > 1 ? l.at(-1) : ""}@${d}` : e; };

export default function ResetPanel({ token, email }: { token?: string; email?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "valid" | "invalid">(token && email ? "checking" : "invalid");
  const [msg, setMsg] = useState(token && email ? "" : "Lien invalide.");
  const [pwd, setPwd] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) return;
    api(`/auth/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`, undefined, "GET")
      .then(() => setState("valid")).catch((e: ApiError) => { setMsg(e.message); setState("invalid"); });
  }, [token, email]);

  const passed = useMemo(() => rules.map((r) => r.ok(pwd)), [pwd]);
  const score = pwd ? passed.filter(Boolean).length : 0;
  const allOk = passed.every(Boolean) && pwd === confirm;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!allOk) { setError(passed.every(Boolean) ? "Les mots de passe ne correspondent pas." : "Le mot de passe ne respecte pas tous les critères."); return; }
    setError(""); setLoading(true);
    try {
      const r = await api<{ token: string; user: SessionUser }>("/auth/reset-password", { token, email, password: pwd });
      saveSession(r.token, r.user, false);
      router.push(homeFor(r.user.role));
    } catch (err) { setError((err as ApiError).message); } finally { setLoading(false); }
  }

  const tone = ["bg-line", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-ok"][score];

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.45fr]">
      {/* ---- Colonne gauche ---- */}
      <div>
        <p className="inline-flex items-center gap-1.5 font-mono text-[9px] font-medium text-mali"><ShieldCheck size={11} /> Arrêté N° 2024/ML-78 · Sécurité nationale</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-mali">Définissez votre nouvelle clé d’accès sécurisée</h1>
        <p className="mt-3 text-xs leading-relaxed text-muted">Pour garantir l’intégrité de la télédéclaration hôtelière et la confidentialité régalienne des manifestes de séjour, tout accès ministériel ou réceptif requiert une conformité cryptographique stricte.</p>

        <div className="mt-5 rounded-xl border border-line bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between font-mono text-[9px] text-muted"><span>Compte en réinitialisation</span><span className="rounded bg-soft px-1.5 text-mali">Session TLS 1.3</span></div>
          <div className="flex items-center gap-3 rounded-lg bg-mali p-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded bg-white/15"><Building2 size={16} /></span>
            <p className="truncate font-mono text-[11px] font-semibold">{email ? maskEmail(email) : "—"}</p>
          </div>
          <p className={`mt-3 flex items-center gap-2 text-[11px] ${state === "valid" ? "text-ok" : state === "invalid" ? "text-red-600" : "text-muted"}`}>
            {state === "checking" ? <><Loader2 size={13} className="animate-spin" /> Vérification du jeton…</> : state === "valid" ? <><CheckCircle2 size={13} /> Jeton cryptographique validé</> : <><XCircle size={13} /> Jeton invalide ou expiré</>}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-bold text-mali"><ListChecks size={14} /> Critères d’homologation bonnes pratiques de sécurité</h2><span className="rounded bg-soft px-1.5 font-mono text-[8px] text-muted">{rules.length} règles</span></div>
          <p className="mt-2 text-[10px] text-muted">Les critères se valident dynamiquement lors de la saisie de votre clé :</p>
          <ul className="mt-3 space-y-1.5">
            {rules.map((r, i) => (
              <li key={r.id} className={`flex items-center gap-2 rounded-md px-3 py-2 text-[11px] ${passed[i] ? "bg-emerald-50 text-ok" : "bg-soft/70 text-ink"}`}>
                {passed[i] ? <CheckCircle2 size={13} /> : <Circle size={13} className="text-muted" />}{r.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl bg-soft p-4">
          <History size={18} className="mt-0.5 shrink-0 text-mali" />
          <p className="text-[11px] leading-relaxed text-muted"><strong className="block text-mali">Connexion immédiate</strong>Une fois la nouvelle clé enregistrée, vous êtes connecté automatiquement et un e-mail de confirmation vous est envoyé.</p>
        </div>
      </div>

      {/* ---- Formulaire ---- */}
      <div className="rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-center justify-between font-mono text-[9px] text-muted"><span>Formulaire d’enregistrement</span>
          <span className="flex gap-1" aria-hidden><i className="h-1.5 w-1.5 rounded-full bg-[#14B53A]" /><i className="h-1.5 w-1.5 rounded-full bg-[#FCD116]" /><i className="h-1.5 w-1.5 rounded-full bg-[#CE1126]" /></span></div>
        <h2 className="mt-3 text-2xl font-extrabold text-mali">Saisir le nouveau mot de passe</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">Définissez une clé d’authentification robuste conforme au standard de transmission SafeStay Mali.</p>

        {state === "invalid" ? (
          <div role="alert" className="mt-6 rounded-xl bg-red-50 p-5 text-center">
            <XCircle className="mx-auto text-red-600" size={24} />
            <p className="mt-2 text-sm font-bold text-red-700">{msg || "Lien invalide ou expiré."}</p>
            <Link href="/mot-de-passe-oublie" className="mt-3 inline-block rounded-lg bg-mali px-4 py-2 text-xs font-semibold text-white">Refaire une demande</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <PasswordField label="Nouveau mot de passe" name="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••••••" autoComplete="new-password" disabled={state !== "valid"} />
            <div aria-live="polite">
              <div className="flex items-center justify-between font-mono text-[9px] text-muted"><span>Robustesse globale :</span><span className="font-semibold text-mali">{levels[score]}</span></div>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">{[1, 2, 3, 4].map((n) => <i key={n} className={`h-1 rounded-full ${score >= n ? tone : "bg-line"}`} />)}</div>
            </div>
            <PasswordField label="Confirmer le nouveau mot de passe" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••••••" autoComplete="new-password" disabled={state !== "valid"}
              error={confirm && pwd !== confirm ? "Les mots de passe ne correspondent pas." : undefined} />
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <button disabled={loading || state !== "valid"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-mali py-3 text-sm font-semibold text-white hover:bg-mali-deep disabled:opacity-60">
              {loading && <Loader2 size={15} className="animate-spin" />} Enregistrer le nouveau mot de passe &amp; Se connecter <Lock size={14} />
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-[11px]">
          <Link href="/connexion" className="flex items-center gap-1 font-semibold text-mali hover:underline"><ArrowLeft size={12} /> Annuler et revenir à la connexion</Link>
          <Link href="/faq" className="text-muted hover:text-mali">Assistance guichet SafeStay</Link>
        </div>
      </div>
    </div>
  );
}
