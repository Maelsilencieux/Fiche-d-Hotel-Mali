import { IdCard, User, Calendar, MapPin, Building2, Briefcase, Globe, Mail, BadgeCheck } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { SelectField, SectionTitle, Required } from "./ui";
import { NATIONALITES } from "./model";
import type { StepProps } from "./StepProps";

export default function StepIdentite({ d, set, errors: e }: StepProps) {
  return (
    <>
      <SectionTitle icon={<IdCard size={14} />} title="État civil & Coordonnées" right={<Required />} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de famille" tag="En majuscules" name="nom" required icon={<User size={13} />} placeholder="EX: KOWE" value={d.nom} onChange={(ev) => set("nom", ev.target.value.toUpperCase())} error={e.nom} autoComplete="family-name" />
        <Field label="Prénom(s)" tag="Conforme pièce" name="prenom" required icon={<BadgeCheck size={13} />} placeholder="EX: Jean-Pierre" value={d.prenom} onChange={(ev) => set("prenom", ev.target.value)} error={e.prenom} autoComplete="given-name" />
        <Field label="Date de naissance" name="dateNaissance" type="date" required icon={<Calendar size={13} />} value={d.dateNaissance} onChange={(ev) => set("dateNaissance", ev.target.value)} error={e.dateNaissance} />
        <Field label="Lieu de naissance" name="lieuNaissance" required icon={<Building2 size={13} />} placeholder="EX: Bamako" value={d.lieuNaissance} onChange={(ev) => set("lieuNaissance", ev.target.value)} error={e.lieuNaissance} />
        <SelectField label="Nationalité légale" tag="Pays d’émission" name="nationalite" required icon={<Globe size={13} />} value={d.nationalite} onChange={(ev) => set("nationalite", ev.target.value)} error={e.nationalite} options={NATIONALITES.map((n) => ({ value: n, label: n }))} />
        <Field label="Profession ou statut" name="profession" required icon={<Briefcase size={13} />} placeholder="EX: Ingénieur agronome" value={d.profession} onChange={(ev) => set("profession", ev.target.value)} error={e.profession} />
        <Field label="Adresse de résidence habituelle" name="adresse" required icon={<MapPin size={13} />} placeholder="EX: Quartier Sica 1, Rue des Martyrs" value={d.adresse} onChange={(ev) => set("adresse", ev.target.value)} error={e.adresse} />
        <Field label="Ville de résidence" name="ville" required icon={<Building2 size={13} />} placeholder="EX: Bamako" value={d.ville} onChange={(ev) => set("ville", ev.target.value)} error={e.ville} />
      </div>
      <div className="mt-4"><Field label="Boîte postale (BP)" tag="Facultatif" name="bp" icon={<Mail size={13} />} placeholder="EX: BP 1420 Bamako" value={d.bp} onChange={(ev) => set("bp", ev.target.value)} /></div>
    </>
  );
}
