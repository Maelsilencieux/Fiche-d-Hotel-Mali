import { Gem, FileX2, SpellCheck, DatabaseZap, LockKeyhole } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const items = [
  { icon: FileX2, title: "Fini les registres papier", text: "Les formulaires volumineux, difficiles à stocker et à exploiter, sont remplacés par un registre sécurisé consultable selon les habilitations.", tint: "bg-[#14B53A]/15 text-mali" },
  { icon: SpellCheck, title: "Moins d’erreurs de saisie", text: "Des contrôles automatiques (numéro de pièce, nationalité, dates) fiabilisent l’état civil dès la saisie.", tint: "bg-gold/30 text-amber-900" },
  { icon: DatabaseZap, title: "Suivi centralisé des fiches", text: "Chaque fiche a un statut clair (en attente, validée, transmise) et un horodatage vérifiable pour chaque action.", tint: "bg-rouge/10 text-rouge" },
  { icon: LockKeyhole, title: "Sécurité et confidentialité", text: "Pièces d’identité protégées, accès tracés et lots journaliers scellés par empreinte numérique.", tint: "bg-leaf text-mali" },
];

export default function Benefits() {
  return (
    <section id="avantages" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8">
      <SectionHeading icon={<Gem size={12} />} tag="Bénéfices opérationnels" title="Pourquoi choisir SafeStay Mali ?">
        Une plateforme pensée pour simplifier le travail des réceptionnistes, rassurer les voyageurs et garantir la traçabilité.
      </SectionHeading>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {items.map(({ icon: I, title, text, tint }) => (
          <article key={title} className="flex gap-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tint}`}><I size={22} /></span>
            <div>
              <h3 className="font-display text-base font-bold text-mali-deep">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
