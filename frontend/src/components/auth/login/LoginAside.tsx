import { Landmark, FileCheck2, Activity, ShieldCheck, Scale, BadgeCheck } from "lucide-react";

const cards = [
  { icon: FileCheck2, title: "Gestion numérique", text: "Remplissage dématérialisé et archivage immédiat des fiches d’hôtel.", tint: "bg-[#14B53A]/15 text-mali" },
  { icon: Activity, title: "Suivi en temps réel", text: "Statut de chaque fiche, de la saisie à la transmission.", tint: "bg-gold/30 text-amber-900" },
  { icon: ShieldCheck, title: "Données protégées", text: "Échanges chiffrés, accès journalisés, lots scellés.", tint: "bg-rouge/10 text-rouge" },
];

export default function LoginAside() {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-mali"><Landmark size={11} /> Bienvenue sur SafeStay Mali</p>
      <h1 className="mt-4 text-4xl font-bold leading-tight text-mali-deep md:text-[2.6rem]">Connectez-vous à votre espace sécurisé.</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">Accédez à vos démarches liées aux fiches hôtelières de police. Une plateforme numérique conçue pour simplifier les procédures et sécuriser les informations, conformément à la réglementation malienne.</p>

      {/* Panneau décoratif 100 % CSS (plus d'image à fournir) */}
      <figure className="bg-bogolan-dark relative mt-6 overflow-hidden rounded-3xl bg-mali-deep p-6 text-white shadow-lg">
        <div className="flag-bar absolute inset-x-0 top-0" />
        <div className="relative pt-2">
          <p className="flex items-center gap-2 font-display text-lg font-bold"><BadgeCheck size={18} className="text-gold" /> Télédéclaration certifiée</p>
          <p className="mt-1 text-xs text-white/75">Conformité aux obligations de tenue du registre de police hôtelier.</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[["1", "Saisie"], ["2", "Validation"], ["3", "Lot scellé"]].map(([n, l], i) => (
              <div key={l} className="rounded-xl bg-black/25 py-3"><p className={`font-display text-2xl font-bold ${["text-[#4ADE80]", "text-gold", "text-[#FB7185]"][i]}`}>{n}</p><p className="font-mono text-[9px] uppercase tracking-wider text-white/70">{l}</p></div>
            ))}
          </div>
        </div>
        <figcaption className="relative mt-4 flex justify-between font-mono text-[9px] text-white/55"><span>Réseau national du Mali</span><span className="font-semibold text-gold">Registre hôtelier</span></figcaption>
      </figure>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {cards.map(({ icon: I, title, text, tint }) => (
          <li key={title} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${tint}`}><I size={16} /></span>
            <h3 className="mt-3 text-xs font-bold text-mali-deep">{title}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ul>

    </div>
  );
}
