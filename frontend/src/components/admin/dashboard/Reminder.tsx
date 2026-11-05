import { Gavel, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function Reminder({ heure }: { heure: number }) {
  return (
    <section aria-labelledby="rappels" className="relative overflow-hidden rounded-3xl bg-gold p-6 text-mali-deep shadow-sm">
      <div className="bg-bogolan-light absolute inset-0 opacity-70" aria-hidden />
      <div className="relative">
        <h2 id="rappels" className="flex items-center gap-2 font-display text-lg font-bold"><Gavel size={18} /> Rappels réglementaires</h2>
        <p className="mt-3 text-sm leading-relaxed">Délai de télé-transmission journalière fixé à <strong className="rounded bg-mali-deep px-1.5 py-0.5 text-gold">{heure} h</strong> pour les établissements du réseau. Les fiches sont horodatées et regroupées dans un lot scellé conformément à l’arrêté interministériel régissant les registres de police hôteliers.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Link href="/#cadre-legal" className="flex items-center gap-1.5 text-xs font-bold underline underline-offset-2">Directive d’exploitation <ExternalLink size={12} /></Link>
          <span className="rounded-lg bg-white/80 px-2.5 py-1.5 font-mono text-[10px] font-bold">CODE-RÉG : 2024/ML-78</span>
        </div>
      </div>
    </section>
  );
}
