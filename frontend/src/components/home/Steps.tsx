import { ClipboardList, UserCheck, BedDouble, ShieldCheck, Smartphone, ScanSearch, Radio } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const steps = [
  { n: 1, icon: UserCheck, title: "Le voyageur remplit sa fiche", text: "Il se connecte, choisit son établissement et renseigne son état civil ainsi que sa pièce d’identité (NINA, CNI ou passeport), en ligne ou à son arrivée.", foot: { icon: Smartphone, label: "Saisie guidée et sécurisée" }, tone: "border-t-[#14B53A]", num: "bg-[#14B53A] text-white" },
  { n: 2, icon: BedDouble, title: "L’hôtel vérifie la fiche", text: "L’établissement examine les informations, les confronte à la pièce originale présentée à l’accueil, puis valide la fiche ou motive un refus documenté.", foot: { icon: ScanSearch, label: "Contrôle d’authenticité à l’accueil" }, tone: "border-t-gold", num: "bg-gold text-mali-deep" },
  { n: 3, icon: ShieldCheck, title: "Transmission aux autorités", text: "Seules les fiches validées sont télé-transmises, regroupées dans un lot journalier que l’hôtel scelle avant l’heure de clôture.", foot: { icon: Radio, label: "Lot scellé · empreinte vérifiable" }, tone: "border-t-rouge", num: "bg-rouge text-white" },
];

export default function Steps() {
  return (
    <section id="fonctionnement" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
      <SectionHeading icon={<ClipboardList size={12} />} tag="Procédure réglementaire" title="Comment fonctionne SafeStay Mali ?">
        Un parcours de conformité entièrement dématérialisé, en trois étapes.
      </SectionHeading>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map(({ n, icon: I, title, text, foot, tone, num }) => (
          <li key={n} className={`flex flex-col rounded-2xl border border-line border-t-4 bg-white p-6 shadow-sm ${tone}`}>
            <div className="flex items-center justify-between">
              <span className={`grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-bold ${num}`}>{n}</span>
              <I size={22} className="text-muted" />
            </div>
            <h3 className="mt-5 font-display text-lg font-bold text-mali-deep">{title}</h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">{text}</p>
            <p className="mt-5 flex items-center gap-1.5 border-t border-line pt-3 font-mono text-[10px] text-mali"><foot.icon size={12} />{foot.label}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
