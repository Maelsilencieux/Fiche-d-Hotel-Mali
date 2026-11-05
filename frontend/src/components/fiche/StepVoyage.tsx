import { PlaneTakeoff, PlaneLanding, ShieldCheck, Briefcase, Compass, Presentation, GraduationCap, Video, Stethoscope, Users, ArrowLeftRight, ClipboardList } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { MOTIFS } from "./model";
import type { StepProps } from "./StepProps";

const motifs: Record<(typeof MOTIFS)[number], { i: any; d: string }> = {
  Affaires: { i: Briefcase, d: "Rendez-vous, commerce, mission" }, Tourisme: { i: Compass, d: "Loisirs, visites, découvertes" }, Conférence: { i: Presentation, d: "Séminaire, sommet, plénière" },
  Formation: { i: GraduationCap, d: "Stage, études, atelier technique" }, Reportage: { i: Video, d: "Presse, médias, accréditation" }, Médical: { i: Stethoscope, d: "Soins, consultation, hospitalisation" },
  Famille: { i: Users, d: "Visite familiale, événement privé" }, Transit: { i: ArrowLeftRight, d: "Correspondance, escale…" }, Autre: { i: ClipboardList, d: "Motif spécifique à préciser" },
};

export default function StepVoyage({ d, set, errors: e }: StepProps) {
  return (
    <>
      <p className="font-mono text-[9px] text-mali">● Formulaire d’immigration régalien</p>
      <h2 className="mt-1 text-2xl font-extrabold text-mali">Votre voyage</h2>
      <p className="mt-1 text-xs text-muted">Indiquez votre provenance, votre destination et le motif de votre déplacement sur le territoire malien.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Venant de (lieu de départ)" tag="Code origine" name="venantDe" required icon={<PlaneTakeoff size={13} />} placeholder="EX: Dakar, Sénégal" value={d.venantDe} onChange={(ev) => set("venantDe", ev.target.value)} error={e.venantDe} hint="Dernière escale internationale ou ville de départ intra-Mali." />
        <Field label="Allant à (destination principale)" tag="Code arrivée" name="allantA" required icon={<PlaneLanding size={13} />} placeholder="EX: Bamako" value={d.allantA} onChange={(ev) => set("allantA", ev.target.value)} error={e.allantA} hint="Commune ou préfecture de l’établissement hôtelier récepteur." />
      </div>

      <div className="mt-5 grid gap-4 rounded-xl bg-soft p-4 sm:grid-cols-[1fr_1fr]">
        <div className="bg-bogolan-dark relative grid aspect-[16/9] place-items-center overflow-hidden rounded-lg bg-mali-deep text-center text-white"><div><p className="font-display text-xl font-bold">Mali</p><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-gold">Bamako · Régions</p></div></div>
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[9px] font-semibold text-mali"><ShieldCheck size={12} /> Contrôle de conformité de circulation</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">Conformément aux décrets ministériels conjoints régissant les fiches d’hôtel de police, le renseignement sincère de votre itinéraire facilite l’assistance consulaire et garantit la régularité de votre séjour.</p>
          <p className="mt-3 flex gap-4 font-mono text-[9px] text-muted"><span>● Transit sécurisé</span><span>● Synchronisation nationale</span></p>
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-[11px] font-semibold text-mali">Motif du séjour en République du Mali <span className="text-red-600">*</span></legend>
        <p className="text-[10px] text-ok">Sélectionnez la catégorie légale correspondant strictement à l’objet principal de votre présence.</p>
        <div role="radiogroup" className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOTIFS.map((m) => { const { i: I, d: desc } = motifs[m]; const on = d.motif === m; return (
            <button key={m} type="button" role="radio" aria-checked={on} onClick={() => set("motif", m)}
              className={`flex items-center gap-3 rounded-xl p-3 text-left ${on ? "bg-mali text-white" : "bg-soft text-ink hover:bg-soft/70"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${on ? "bg-white/15" : "bg-white text-mali"}`}><I size={16} /></span>
              <span className="flex-1"><span className="block text-xs font-bold">{m}</span><span className={`block text-[10px] ${on ? "text-white/75" : "text-muted"}`}>{desc}</span></span>
              <span className={`h-3.5 w-3.5 rounded-full border-2 ${on ? "border-white bg-white" : "border-muted/50"}`} />
            </button>); })}
        </div>
        {e.motif && <p className="mt-2 text-[10px] text-red-600">{e.motif}</p>}
      </fieldset>
    </>
  );
}
