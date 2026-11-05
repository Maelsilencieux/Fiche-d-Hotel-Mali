import Link from "next/link";
import { ArrowRight, Compass, FileText, Network, Lock, Sparkles, CheckCircle2, Send, UserCheck } from "lucide-react";

const points = [
  { icon: FileText, label: "Fiches hôtelières 100 % numériques" },
  { icon: Network, label: "Bamako et toutes les régions du Mali" },
  { icon: Lock, label: "Données chiffrées, accès tracés" },
];

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-mali">
          <Sparkles size={11} /> Bienvenue sur SafeStay Mali
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[1.08] text-mali-deep md:text-[3.2rem]">
          La fiche de police hôtelière, <span className="relative whitespace-nowrap text-mali"><span className="relative z-10">simple</span><i className="absolute inset-x-0 bottom-1 z-0 h-3 bg-gold/70" /></span> et sécurisée.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
          SafeStay Mali modernise l’enregistrement des voyageurs : le client renseigne sa fiche, l’hôtel la vérifie, et les fiches validées sont télé-transmises chaque jour aux autorités dans un lot scellé.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/inscription" className="flex items-center gap-2 rounded-xl bg-mali px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-mali/20 hover:bg-mali-deep">
            Commencer maintenant <ArrowRight size={15} />
          </Link>
          <Link href="/#fonctionnement" className="flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-semibold text-mali-deep hover:bg-soft">
            <Compass size={15} /> Découvrir le parcours
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {points.map(({ icon: I, label }) => (
            <li key={label} className="flex max-w-[12rem] items-center gap-2 text-[11px] font-medium text-ink">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/25 text-amber-900"><I size={14} /></span>{label}
            </li>
          ))}
        </ul>
      </div>

      {/* Illustration 100 % CSS : aucune image à fournir */}
      <div className="relative">
        <div className="bg-bogolan-dark absolute -inset-3 rounded-[2rem] bg-mali-deep" aria-hidden />
        <div className="relative rounded-3xl bg-white p-5 shadow-2xl">
          <div className="flag-bar rounded-full" />
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted">Parcours d’une fiche</p>
          <ol className="mt-3 space-y-3">
            {[
              { i: UserCheck, t: "Le voyageur remplit sa fiche", s: "Identité, séjour, pièce d’identité (PDF)", c: "bg-[#14B53A]/15 text-mali" },
              { i: CheckCircle2, t: "L’hôtel vérifie et valide", s: "Contrôle de la pièce originale à l’accueil", c: "bg-gold/30 text-amber-900" },
              { i: Send, t: "Lot scellé et transmis", s: "Empreinte SHA-256 avant l’heure de clôture", c: "bg-rouge/10 text-rouge" },
            ].map(({ i: I, t, s, c }, n) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c}`}><I size={20} /></span>
                <span className="flex-1"><span className="block text-sm font-bold text-mali-deep">{t}</span><span className="block text-[11px] text-muted">{s}</span></span>
                <span className="font-display text-2xl font-bold text-line">{n + 1}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-leaf p-3"><p className="font-mono text-[9px] uppercase text-muted">Échéance</p><p className="font-display text-2xl font-bold text-mali">23 h</p><p className="font-mono text-[9px] text-muted">clôture journalière</p></div>
            <div className="rounded-2xl bg-gold/25 p-3"><p className="font-mono text-[9px] uppercase text-muted">Traçabilité</p><p className="font-display text-2xl font-bold text-amber-900">Scellée</p><p className="font-mono text-[9px] text-muted">chaque lot, chaque accès</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
