"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, Copy, FileText, UserRound, Hotel, CalendarDays, BedDouble, Paperclip, Wallet, Workflow, TriangleAlert, Eye, Printer, Lock, Loader2, X } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { PAIEMENT, STATUT, d as fd, dt, nuits } from "@/lib/format";
import type { Fiche } from "@/lib/types";

const wait = { pending: "En attente de vérification par l’établissement", registered: "Validée par l’établissement", refused: "Refusée par l’établissement", transmitted: "Transmise aux autorités" } as const;

export default function Confirmation({ id }: { id?: string }) {
  const [f, setF] = useState<Fiche | null>(null);
  const [err, setErr] = useState(id ? "" : "Aucune fiche indiquée.");
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (id) api<{ fiche: Fiche }>(`/fiches/${id}`, undefined, "GET").then((r) => setF(r.fiche)).catch((e: ApiError) => setErr(e.message)); }, [id]);

  if (err) return <p role="alert" className="mx-auto my-16 max-w-md rounded-xl bg-red-50 p-6 text-center text-sm text-red-700">{err}</p>;
  if (!f) return <p className="p-16 text-center text-xs text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement de votre récépissé…</p>;

  const n = nuits(f.dateEntree, f.dateSortie);
  const s = f.statut;
  const stepState = [
    s === "refused" ? "done" : "done",
    s === "pending" ? "now" : s === "refused" ? "refused" : "done",
    s === "registered" ? "now" : s === "transmitted" ? "done" : "todo",
  ] as const;
  const steps = [
    { t: "1. Enregistrement initial", d: "Vos coordonnées d’identité et pièces justificatives ont été transmises et sécurisées sur le serveur SafeStay." },
    { t: "2. Vérification par l’hôtel", d: "À votre arrivée ou lors du check-in, l’équipe de réception contrôle la concordance de votre pièce d’identité physique avec la réservation." },
    { t: "3. Télé-transmission aux autorités", d: "Une fois la présence physique confirmée, l’établissement intègre votre fiche dans le lot journalier scellé transmis aux autorités compétentes." },
  ];
  const label = { done: "Étape achevée", now: "En cours", todo: "À venir", refused: "Refusée" };
  const Tile = ({ icon: I, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="flex gap-3 rounded-lg bg-soft/70 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-mali"><I size={14} /></span>
      <div><p className="font-mono text-[9px] text-muted">{title}</p>{children}</div></div>
  );

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf p-2 text-white [&>svg]:h-full [&>svg]:w-full [&>svg]:rounded-full [&>svg]:bg-mali [&>svg]:p-3"><Check size={28} /></span>
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-wider text-gold-deep">Enregistrement officiel</p><h1 className="mt-1 text-3xl font-bold text-mali-deep">Votre fiche a été envoyée avec succès !</h1>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">Votre fiche hôtelière a bien été enregistrée sur SafeStay. Elle est maintenant en attente de vérification par l’établissement hôtelier sélectionné.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-2 rounded-lg bg-soft px-3 py-2 text-mali"><Clock size={12} className="text-amber-600" /> Statut : {wait[s]}</span>
          <span className="flex items-center gap-2 rounded-lg bg-soft px-3 py-2 text-mali">N° référence : <strong>{f.reference}</strong>
            <button onClick={() => { navigator.clipboard?.writeText(f.reference); setCopied(true); setTimeout(() => setCopied(false), 1500); }} aria-label="Copier la référence" className="text-muted hover:text-mali">{copied ? <Check size={12} /> : <Copy size={12} />}</button></span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-sm font-bold text-mali"><FileText size={15} /> Récépissé numérique provisoire</h2><p className="font-mono text-[9px] text-muted">Horodatage serveur : {dt(f.createdAt)}</p></div>
          <span className="flex items-center gap-1 font-mono text-[9px] text-muted"><Lock size={10} /> Protocole TLS 1.3</span>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-gold/60 bg-gold/15 p-4 sm:grid-cols-2">
          <p><span className="block font-mono text-[9px] uppercase text-muted">Numéro de référence national</span><span className="font-mono text-lg font-bold text-mali-deep">{f.reference}</span></p>
          <p><span className="block font-mono text-[9px] uppercase text-muted">Horodatage de soumission (heure de Bamako, GMT)</span><span className="font-mono text-sm font-bold text-mali-deep">{dt(f.createdAt)}</span></p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Tile icon={UserRound} title="Client déclarant"><p className="text-xs font-bold text-mali">{f.prenom} {f.nom.toUpperCase()}</p><p className="text-[10px] text-muted">Nationalité : {f.nationalite}<br />{f.typePiece} n° : {f.numeroPiece}</p></Tile>
          <Tile icon={Hotel} title="Établissement récepteur"><p className="text-xs font-bold text-mali">{f.hotel?.nomHotel}</p><p className="text-[10px] text-muted">{[f.hotel?.adresse, f.hotel?.ville].filter(Boolean).join(", ")}</p></Tile>
          <Tile icon={CalendarDays} title="Période du séjour"><p className="text-xs font-bold text-mali">{fd(f.dateEntree)} → {fd(f.dateSortie)}</p><p className="text-[10px] text-muted">Durée déclarée : {n} nuitée{n > 1 ? "s" : ""}<br />Motif : {f.motif}</p></Tile>
          <Tile icon={BedDouble} title="Affectation & mobilité"><p className="text-xs font-bold text-mali">Chambre N° {f.chambreNumero}</p><p className="text-[10px] text-muted">Moyen : {f.transport}{f.plaque ? ` (${f.plaque})` : ""}</p></Tile>
          <Tile icon={Paperclip} title="Document justificatif joint"><p className="text-xs font-bold text-mali">{f.typePiece} · PDF transmis</p><p className="text-[10px] text-muted">Délivré à {f.delivreA} le {fd(f.delivreLe)}</p></Tile>
          <Tile icon={Wallet} title="Modalité financière convenue"><p className="text-xs font-bold text-mali">{PAIEMENT[f.modePaiement] ?? f.modePaiement}</p><p className="text-[10px] text-muted">Règlement final lors du check-in</p></Tile>
        </div>
        <p className="mt-4 flex items-center justify-between border-t border-line pt-3 font-mono text-[9px] text-muted"><span className="flex items-center gap-1"><Lock size={10} /> Déclaration soumise sous le protocole régalien chiffré TLS 1.3</span><span>ID : {f._id.slice(-8).toUpperCase()}</span></p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <p className="flex items-center gap-2 font-mono text-[9px] text-muted"><Workflow size={12} /> Workflow d’instruction</p>
        <h2 className="mt-1 text-xl font-extrabold text-mali">Que se passe-t-il ensuite ?</h2>
        <p className="text-xs text-muted">Suivez l’acheminement légal de votre dossier hôtelier depuis la réception jusqu’aux autorités de police.</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {steps.map((st, i) => { const state = stepState[i]; return (
            <li key={st.t} className={`rounded-xl p-4 ${state === "now" ? "bg-amber-50 ring-1 ring-amber-200" : state === "refused" ? "bg-red-50 ring-1 ring-red-200" : "bg-soft/70"}`}>
              <div className="flex items-center justify-between"><span className={`grid h-6 w-6 place-items-center rounded text-[10px] font-bold text-white ${state === "done" ? "bg-ok" : state === "now" ? "bg-amber-500" : state === "refused" ? "bg-red-600" : "bg-muted/60"}`}>{state === "done" ? <Check size={12} /> : state === "refused" ? <X size={12} /> : i + 1}</span>
                <span className="font-mono text-[8px] text-muted">{label[state]}</span></div>
              <h3 className="mt-3 text-xs font-bold text-mali">{st.t}</h3><p className="mt-1 text-[10px] leading-relaxed text-muted">{state === "refused" && i === 1 ? `Motif : ${f.refusMotif ?? "informations non conformes"}` : st.d}</p>
            </li>); })}
        </ol>
        <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900"><TriangleAlert size={14} className="mt-0.5 shrink-0" /><span><strong>Avis d’obligation légale de présence</strong><br />L’envoi réussi atteste de votre démarche d’enregistrement préalable mais <strong>ne constitue pas encore une validation administrative définitive de séjour</strong>. La présentation de votre pièce d’identité originale à la réception demeure indispensable.</span></p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/" className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft">Retour à l’accueil</Link>
        <Link href="/client" className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep"><Eye size={13} /> Voir le détail de ma fiche</Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 text-xs font-semibold text-muted hover:text-mali"><Printer size={13} /> Imprimer le récépissé</button>
      </div>
    </section>
  );
}
