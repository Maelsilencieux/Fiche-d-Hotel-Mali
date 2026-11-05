import Link from "next/link";
import { House, AtSign, PhoneCall, MapPin, Clock, CircleHelp, ShieldCheck, LockKeyhole } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import { SUPPORT } from "@/lib/config";

export const metadata = { title: "Contact – SafeStay Mali" };

const Channel = ({ icon: I, k, v, sub, tag }: { icon: any; k: string; v: string; sub: string; tag?: string }) => (
  <li className="flex gap-4 rounded-xl border border-line bg-white p-4 shadow-sm">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-soft text-mali"><I size={18} /></span>
    <div className="min-w-0 flex-1"><p className="flex items-center justify-between font-mono text-[10px] uppercase text-muted">{k}{tag && <span className="rounded-full bg-leaf px-2 py-0.5 text-[9px] font-semibold text-mali">● {tag}</span>}</p>
      <p className="mt-1 text-base font-bold text-mali">{v}</p><p className="mt-1 text-xs text-muted">{sub}</p></div>
  </li>
);

export default function ContactPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-2 font-mono text-[11px] text-muted"><Link href="/" className="flex items-center gap-1.5 hover:text-mali"><House size={13} /> Accueil</Link> / <span className="font-bold text-mali" aria-current="page">Contact</span></nav>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-soft px-3 py-1 font-mono text-[10px] text-mali"><i className="h-1.5 w-1.5 rounded-full bg-mali" /> Support &amp; assistance institutionnelle · Réponse sous 24h ouvrées</p>
            <h1 className="mt-3 text-4xl font-extrabold text-mali">Contactez l’équipe SafeStay</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">Une question sur SafeStay ? Besoin d’assistance ou d’informations sur notre plateforme ? Notre équipe est à votre écoute pour vous accompagner.</p>
          </div>
          <p className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 font-mono text-[11px] text-mali shadow-sm ring-1 ring-line"><ShieldCheck size={16} className="text-ok" /> Guichet numérique officiel du Mali</p>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl items-start gap-8 px-4 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="font-mono text-[10px] uppercase text-muted">Canaux sécurisés</p>
          <h2 className="text-2xl font-extrabold text-mali">Nos coordonnées</h2>
          <p className="mt-2 text-sm text-muted">Retrouvez ici les différents moyens de joindre notre équipe d’administration et de supervision opérationnelle.</p>
          <ul className="mt-5 space-y-3">
            <Channel icon={AtSign} k="Courriel officiel" v={SUPPORT.contactEmail} sub="Traitement indexé et archivé au protocole étatique" tag="Canal officiel" />
            <Channel icon={PhoneCall} k="Standard téléphonique" v={SUPPORT.phone} sub="Ligne directe d’assistance administrative & technique" />
            <Channel icon={MapPin} k="Siège administratif" v="Bamako, République du Mali" sub="Direction de coordination administrative SafeStay" />
            <Channel icon={Clock} k="Horaires de service" v="Du lundi au vendredi : 08h00 – 17h30 (GMT+1)" sub="● Astreinte technique 24/7 active pour les complexes hôteliers" />
          </ul>
          <div className="mt-5 rounded-xl bg-soft p-5"><h3 className="flex items-center gap-2 text-sm font-bold text-mali"><CircleHelp size={16} /> Comment pouvons-nous vous aider ?</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">Que vous soyez un client, un établissement hôtelier ou un partenaire, vous pouvez nous envoyer votre demande à l’aide du formulaire. Nos inspecteurs et agents techniques répondent avec diligence.</p></div>
          <p className="mt-4 flex gap-3 rounded-xl border border-line bg-white p-4 text-xs leading-relaxed text-muted"><LockKeyhole size={18} className="shrink-0 text-mali" /><span><strong className="text-mali">Plateforme souveraine certifiée :</strong> vos échanges et métadonnées d’acheminement sont chiffrés et traités en conformité stricte avec les décrets nationaux de protection des données.</span></p>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
