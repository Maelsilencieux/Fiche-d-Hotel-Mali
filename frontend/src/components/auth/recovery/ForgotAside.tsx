import { ShieldAlert, TrendingUp, Ban, Lock, Headset, ShieldCheck } from "lucide-react";
import { RESET_TOKEN_MINUTES, SUPPORT } from "@/lib/config";

const steps = [
  { t: "Saisie de l’identifiant officiel", d: "Indiquez l’adresse électronique certifiée rattachée à votre profil voyageur ou établissement hôtelier agréé." },
  { t: "Vérification par jeton temporaire", d: `Transmission immédiate d’un lien sécurisé unique à signature cryptographique, valide strictement ${RESET_TOKEN_MINUTES} minutes.` },
  { t: "Mise à jour sous haute conformité", d: "Définition d’une nouvelle clé d’authentification robuste avec révocation instantanée des sessions actives." },
];
const cards = [
  { i: Ban, t: "Protection active", d: "Blocage anti-usurpation par paliers en cas d’occurrences répétées." },
  { i: Lock, t: "Chiffrement AES", d: "Aucun secret n’est transmis en clair ni consultable par nos opérateurs." },
  { i: Headset, t: "Support Bamako", d: `Astreinte télé-opérateurs au ${SUPPORT.phone}.` },
];

export default function ForgotAside() {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 font-mono text-[9px] font-medium text-mali ring-1 ring-line"><ShieldAlert size={11} /> Sécurité &amp; protocole d’accès</p>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-mali">Récupération sécurisée de vos identifiants</h1>
      <p className="mt-3 max-w-lg text-xs leading-relaxed text-muted">En application des protocoles de sécurité de l’État malien et du <strong className="text-mali">Arrêté N° 2024/ML-78</strong>, la réinitialisation de votre mot de passe SafeStay requiert une vérification stricte de votre identité numérique.</p>

      <div className="mt-6 rounded-xl border border-line bg-soft/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold text-mali"><TrendingUp size={14} /> Procédure de réinitialisation en 3 étapes</h2>
          <span className="rounded bg-white px-1.5 font-mono text-[8px] text-muted">Norme SI-ML</span>
        </div>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-mali text-[10px] font-bold text-white">{i + 1}</span>
              <div><h3 className="text-xs font-bold text-mali">{s.t}</h3><p className="mt-0.5 text-[11px] leading-relaxed text-muted">{s.d}</p></div>
            </li>
          ))}
        </ol>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map(({ i: I, t, d }) => (
          <li key={t} className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-soft text-mali"><I size={14} /></span>
            <h3 className="mt-3 text-xs font-bold text-mali">{t}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{d}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-mali p-4 text-white">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p className="text-[11px] leading-relaxed"><span className="block font-mono text-[9px] text-white/70">Sceau légal · Arrêté N° 2024/ML-78</span>Hébergement certifié sous autorité souveraine malienne et contrôle direct du Ministère de la Sécurité et de la Protection civile.</p>
      </div>
    </div>
  );
}
