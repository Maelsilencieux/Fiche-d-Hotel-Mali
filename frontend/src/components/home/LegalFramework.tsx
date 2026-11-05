import { Scale, Lock, KeyRound, Fingerprint, Server } from "lucide-react";

const checks = [
  { icon: Lock, label: "Chiffrement des échanges " },
  { icon: KeyRound, label: "Accès par habilitations nominatives" },
  { icon: Fingerprint, label: "Lots journaliers scellés " },
  { icon: Server, label: "Hébergement conforme à la réglementation nationale" },
];

export default function LegalFramework() {
  return (
    <section id="cadre-legal" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-12">
      <div className="bg-bogolan-dark relative overflow-hidden rounded-3xl bg-mali-deep text-white shadow-xl">
        <div className="flag-bar" />
        <div className="relative grid gap-8 p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-gold"><Scale size={12} /> Cadre juridique</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-snug">Sécurité, contrôle des accès et conformité réglementaire</h2>
            <p className="mt-4 text-xs leading-relaxed text-white/80">
              SafeStay Mali est déployée sous la tutelle du <strong className="text-white">Ministère de la Sécurité et de la Protection civile</strong>, conformément à l’<strong className="text-white">Arrêté interministériel N° 2024/ML-78</strong> relatif à la tenue et à la télé-transmission des registres de police hôteliers.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              L’accès aux données est cloisonné : seules les entités habilitées peuvent consulter les fiches, et chaque consultation est journalisée.
            </p>
          </div>
          <ul className="space-y-3 self-center rounded-2xl bg-black/25 p-5 backdrop-blur-sm">
            {checks.map(({ icon: I, label }) => (
              <li key={label} className="flex items-center gap-3 text-xs"><I size={15} className="shrink-0 text-gold" />{label}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
