import Link from "next/link";
import { ShieldCheck, CircleHelp, Lock, CheckCircle2, FileSearch } from "lucide-react";
import { fmt, nights, type Draft } from "./model";
import { SUPPORT } from "@/lib/config";

/** Colonne de droite de l'étape 1. */
export function AsideIdentite({ d }: { d: Draft }) {
  const full = d.nom && d.prenom;
  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-mali"><ShieldCheck size={15} /> Contrôle aux frontières</h2>
        <p className="font-mono text-[9px] text-muted">Direction Générale de la Police</p>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">L’article 4 de l’Arrêté N° 2024/ML-78 oblige chaque établissement récepteur à transmettre l’état signalétique de tout client dans un délai maximal de 24 heures suivant la prise de chambre.</p>
        <p className="mt-3 flex justify-between rounded bg-soft px-2 py-1.5 font-mono text-[9px] text-muted"><span>Récépissé de dépôt</span><span className="font-semibold text-mali">Généré à l’étape 4</span></p>
      </div>
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-mali">Aperçu fiche signalétique</h2><span className="rounded bg-soft px-1.5 font-mono text-[8px] text-muted">Temps réel</span></div>
        <div className="mt-3 rounded-lg bg-soft p-3">
          <div className="flex justify-between font-mono text-[9px] text-muted"><span>Titulaire</span>{full && <span className="flex items-center gap-1 text-ok"><CheckCircle2 size={10} /> Conforme</span>}</div>
          <p className="mt-1 text-sm font-bold text-mali">{full ? `${d.nom} ${d.prenom}` : "—"}</p>
          <p className="text-[10px] text-muted">{d.nationalite}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><div><p className="text-muted">Résidence</p><p className="font-semibold text-mali">{d.ville ? `${d.ville}, Mali` : "—"}</p></div><div><p className="text-muted">Profession</p><p className="font-semibold text-mali">{d.profession || "—"}</p></div></div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[10px] text-muted"><CircleHelp size={12} className="text-mali" /> Une question sur votre déclaration ? <a href={`mailto:${SUPPORT.email}`} className="font-semibold text-mali underline">Support SafeStay</a></p>
      </div>
      <div className="flex gap-3 rounded-xl bg-soft p-4"><Lock size={16} className="mt-0.5 shrink-0 text-mali" /><p className="text-[11px] leading-relaxed text-muted"><strong className="block text-mali">Confidentialité &amp; protection des données</strong>Les renseignements transmis sont exclusivement réservés aux services autorisés de la police judiciaire malienne.</p></div>
    </aside>
  );
}

/** Récapitulatif de l'étape 4. */
export function Recap({ d, hotelName, fileName, goTo }: { d: Draft; hotelName: string; fileName?: string; goTo: (s: number) => void }) {
  const n = nights(d.dateEntree, d.dateSortie);
  const Block = ({ n: no, title, step, children }: { n: number; title: string; step: number; children: React.ReactNode }) => (
    <div className="rounded-lg bg-soft/70 p-3">
      <div className="flex items-center justify-between"><h3 className="text-[11px] font-bold text-mali">{no}. {title}</h3><button type="button" onClick={() => goTo(step)} className="text-[10px] font-semibold text-mali underline">Modifier</button></div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">{children}</dl>
    </div>
  );
  const Row = ({ k, v }: { k: string; v?: string }) => (<div><dt className="text-muted">{k}</dt><dd className="font-semibold text-mali">{v || "—"}</dd></div>);
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-mali"><FileSearch size={15} /> Récapitulatif de la déclaration</h2><span className="rounded bg-soft px-1.5 font-mono text-[8px] text-muted">4 blocs</span></div>
      <p className="mb-3 text-[10px] text-muted">Vérifiez l’exactitude stricte de vos déclarations avant télétransmission au serveur central du Ministère.</p>
      <div className="space-y-2">
        <Block n={1} title="Identité personnelle" step={0}><Row k="Nom & Prénom" v={`${d.nom} ${d.prenom}`} /><Row k="Nationalité" v={d.nationalite} /><Row k="Naissance" v={`${fmt(d.dateNaissance)} à ${d.lieuNaissance}`} /><Row k="Profession" v={d.profession} /><Row k="Domicile habituel" v={[d.adresse, d.ville].filter(Boolean).join(", ")} /></Block>
        <Block n={2} title="Itinéraire & motif" step={1}><Row k="Provenance" v={d.venantDe} /><Row k="Destination" v={d.allantA} /><Row k="Motif séjour" v={d.motif} /></Block>
        <Block n={3} title="Séjour & hébergement" step={2}><Row k="Établissement hôte" v={hotelName} /><Row k="Chambre attribuée" v={d.chambreNumero} /><Row k={`Durée${n ? ` (${n} nuit${n > 1 ? "s" : ""})` : ""}`} v={`${fmt(d.dateEntree)} → ${fmt(d.dateSortie)}`} /><Row k="Transport / plaque" v={`${d.transport}${d.plaque ? ` (${d.plaque})` : ""}`} /></Block>
        <div className="rounded-lg bg-soft/70 p-3"><h3 className="text-[11px] font-bold text-mali">4. Pièce jointe & règlement</h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]"><Row k="Titre d’identité" v={`${d.typePiece} · ${d.numeroPiece}`} /><Row k="Délivré par" v={`${d.delivreA}, ${fmt(d.delivreLe)}`} /><Row k="Fichier transmis" v={fileName} /><Row k="Règlement" v={d.modePaiement} /></dl></div>
      </div>
      <p className="mt-3 flex gap-2 rounded-lg bg-soft p-3 text-[10px] leading-relaxed text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-mali" />En soumettant cette déclaration, je certifie sur l’honneur l’exactitude des informations fournies, conformément à l’article 12 de l’Arrêté N° 2024/ML-78 relatif au contrôle des séjours.</p>
    </div>
  );
}
