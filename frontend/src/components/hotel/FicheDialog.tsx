"use client";
import { useEffect, useRef, useState } from "react";
import { X, Download, Check, Ban, Send, Loader2, IdCard, FileText, UserRound, PlaneTakeoff, ScanLine, BedDouble, CreditCard, ShieldCheck, ExternalLink, Briefcase } from "lucide-react";
import { api, apiBlob, type ApiError } from "@/lib/api";
import { PAIEMENT, STATUT, d as fd, dt, nuits } from "@/lib/format";
import type { Fiche } from "@/lib/types";

const PIECE: Record<string, string> = { NINA: "Carte NINA", CNI: "Carte nationale d’identité", Passeport: "Passeport international", "Carte consulaire": "Carte consulaire", "Titre de séjour": "Titre de séjour", Autre: "Autre titre officiel" };

/** Modal de détail partagé par « Demandes » et « Clients » : les actions dépendent du statut de la fiche. */
export default function FicheDialog({ id, onClose, onChanged, startRefusing = false }: { id: string; onClose: () => void; onChanged: () => void; startRefusing?: boolean }) {
  const [f, setF] = useState<Fiche | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"fiche" | "pdf">("fiche");
  const [refusing, setRefusing] = useState(startRefusing);
  const [motif, setMotif] = useState("");
  const [pdf, setPdf] = useState<{ url: string; size: number } | null>(null);
  const [pdfErr, setPdfErr] = useState("");
  const urlRef = useRef("");

  const load = () => api<{ fiche: Fiche }>(`/fiches/${id}`, undefined, "GET").then((r) => setF(r.fiche)).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); document.body.style.overflow = "hidden"; return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; if (urlRef.current) URL.revokeObjectURL(urlRef.current); }; }, [onClose]);
  useEffect(() => { // le PDF est chargé dès l'ouverture pour afficher sa taille
    apiBlob(`/fiches/${id}/cnib`).then((b) => { const url = URL.createObjectURL(b); urlRef.current = url; setPdf({ url, size: b.size }); }).catch((e: ApiError) => setPdfErr(e.message));
  }, [id]);

  async function act(path: string, body?: unknown) {
    setBusy(true); setErr("");
    try { await api(`/fiches/${id}/${path}`, body, "PATCH"); onChanged(); setRefusing(false); await load(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }
  const Sec = ({ icon: I, title, right, children }: { icon: any; title: string; right?: string; children: React.ReactNode }) => (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-3"><h3 className="flex items-center gap-2 text-sm font-bold text-mali"><I size={15} />{title}</h3>{right && <span className="font-mono text-[9px] text-muted">{right}</span>}</div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-3">{children}</dl>
    </section>
  );
  const Row = ({ k, children, wide }: { k: string; children: React.ReactNode; wide?: boolean }) => <div className={wide ? "col-span-2 lg:col-span-1" : ""}><dt className="font-mono text-[9px] uppercase text-muted">{k}</dt><dd className="mt-1 text-xs text-mali">{children}</dd></div>;
  const n = f ? nuits(f.dateEntree, f.dateSortie) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-mali-deep/60 p-3 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Détail du client" onClick={(e) => e.stopPropagation()} className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 bg-mali-deep px-5 py-4 text-white">
          <div className="flex items-center gap-4"><span className="hidden h-11 w-11 place-items-center rounded-lg bg-white/10 sm:grid"><IdCard size={20} /></span>
            <div><h2 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">Détail du client {f && <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-[10px] font-semibold">{f.reference}</span>}</h2>
              <p className="text-[11px] text-white/70">Fiche légale d’hébergement hôtelier certifiée SafeStay</p></div></div>
          <div className="flex items-center gap-3">{f && <span className={`hidden rounded-full px-3 py-1 font-mono text-[10px] font-semibold sm:block ${STATUT[f.statut].pill}`}>● {STATUT[f.statut].label.split(" ·")[0]} ({f.statut})</span>}
            <button onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20"><X size={16} /></button></div>
        </div>

        <div role="tablist" className="flex gap-2 border-b border-line bg-soft/70 px-5">
          {[{ id: "fiche", label: "Fiche du client", icon: FileText }, { id: "pdf", label: "Pièce d’identité (PDF sécurisé)", icon: FileText, extra: pdf ? `${(pdf.size / 1048576).toFixed(1)} Mo` : "" }].map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id as "fiche" | "pdf")} className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold ${tab === t.id ? "border-mali text-mali" : "border-transparent text-muted hover:text-mali"}`}>
              <t.icon size={14} />{t.label}{t.extra && <span className="rounded bg-white px-1.5 font-mono text-[9px]">{t.extra}</span>}</button>))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-soft/40 p-5">
          {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
          {!f ? <Loader2 className="mx-auto my-16 animate-spin text-muted" /> : tab === "fiche" ? (
            <>
              <Sec icon={UserRound} title="Identité du voyageur" right={`ID : ${f._id.slice(-8).toUpperCase()}`}>
                <Row k="Nom & prénom"><strong className="text-base">{f.prenom} {f.nom.toUpperCase()}</strong></Row>
                <Row k="Date et lieu de naissance">{fd(f.dateNaissance)} à {f.lieuNaissance}</Row>
                <Row k="Nationalité">{f.flagEmoji} {f.nationalite}</Row>
                <Row k="Profession">{f.profession || "—"}</Row>
                <Row k="Adresse de résidence">{f.adresse}, {f.ville}</Row>
                <Row k="Boîte postale / contact">{[f.bp, f.client?.email].filter(Boolean).join(" · ") || "—"}</Row>
              </Sec>
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-line bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 border-b border-line pb-3 text-sm font-bold text-mali"><PlaneTakeoff size={15} /> Informations de voyage</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-4"><Row k="Provenance">{f.venantDe}</Row><Row k="Destination">{f.allantA}</Row>
                    <Row k="Motif du séjour"><span className="inline-flex items-center gap-1.5 rounded bg-gold/25 px-2 py-1 font-semibold text-mali"><Briefcase size={12} />{f.motif}</span></Row></dl></section>
                <section className="rounded-xl border border-line bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 border-b border-line pb-3 text-sm font-bold text-mali"><ScanLine size={15} /> Pièce d’identité présentée</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-4"><Row k="Nature du titre">{PIECE[f.typePiece] ?? f.typePiece}</Row><Row k="Numéro du document"><span className="font-mono font-bold">{f.numeroPiece}</span></Row>
                    <Row k="Délivré le"><span className="font-mono">{fd(f.delivreLe)}</span></Row><Row k="Autorité émettrice">{f.delivreA}</Row></dl></section>
              </div>
              <section className="rounded-xl border border-line bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 border-b border-line pb-3 text-sm font-bold text-mali"><BedDouble size={15} /> Séjour, chambre & logistique</h3>
                <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4"><Row k="Établissement">{f.hotel?.nomHotel}</Row>
                  <Row k="Période du séjour"><span className="font-mono">{fd(f.dateEntree)} → {fd(f.dateSortie)}</span><span className="mt-1 block font-mono text-[10px] text-muted">({n} nuit{n > 1 ? "s" : ""} d’hébergement)</span></Row>
                  <Row k="Numéro de chambre"><span className="rounded bg-mali px-2 py-1 font-bold text-white">Chambre {f.chambreNumero}</span></Row>
                  <Row k="Transport & plaque">{f.transport}{f.plaque && <span className="mt-1 block font-mono text-[10px] text-muted">Immat. : {f.plaque}</span>}</Row></dl>
                <p className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs"><span className="flex items-center gap-2"><CreditCard size={14} className="text-mali" /> Règlement : <strong>{PAIEMENT[f.modePaiement] ?? f.modePaiement}</strong></span>
                  <span className="font-mono text-[10px] text-muted">Soumise le {dt(f.createdAt)}{f.traiteAt ? ` · traitée le ${dt(f.traiteAt)}` : ""}</span></p>
                {f.statut === "transmitted" && f.transmisReference && <p className="mt-3 rounded-lg bg-leaf/60 p-3 font-mono text-[10px] text-mali">Transmise à la police le {dt(f.transmisAt)} · Réf. {f.transmisReference}</p>}
                {f.statut === "refused" && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700"><strong>Motif du refus :</strong> {f.refusMotif}</p>}
              </section>
            </>
          ) : (
            <div>
              {pdfErr ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-xs text-red-700">{pdfErr}</p> : !pdf ? <Loader2 className="mx-auto my-16 animate-spin text-muted" /> : (
                <>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <a href={pdf.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-mali ring-1 ring-line"><ExternalLink size={13} /> Ouvrir dans un onglet</a>
                    <a href={pdf.url} download={`PIECE_${f.nom}_${f.prenom}.pdf`} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-mali ring-1 ring-line"><Download size={13} /> Télécharger</a>
                  </div>
                  <iframe src={pdf.url} title="Pièce d’identité numérisée" className="h-[60vh] w-full rounded-xl border border-line bg-white" />
                </>)}
            </div>
          )}
        </div>

        {refusing && f && (
          <div className="border-t border-line bg-white px-5 py-3"><label htmlFor="motif" className="text-[11px] font-semibold text-mali">Motif du refus (transmis au client)</label>
            <textarea id="motif" autoFocus value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} placeholder="Ex : Document expiré" className="mt-1 w-full rounded-lg border border-line bg-soft/60 p-3 text-xs outline-none focus:border-mali" /></div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-5 py-3">
          <p className="flex items-center gap-2 font-mono text-[10px] text-muted"><ShieldCheck size={14} className="text-mali" /> Fiche conforme aux exigences des autorités compétentes</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg bg-soft px-4 py-2.5 text-xs font-semibold text-mali hover:bg-soft/70">Fermer</button>
            {f?.statut === "pending" && !refusing && (<>
              <button disabled={busy} onClick={() => setRefusing(true)} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600"><Ban size={13} /> Refuser</button>
              <button disabled={busy} onClick={() => act("valider")} className="flex items-center gap-1.5 rounded-lg bg-ok px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"><Check size={13} /> Valider</button></>)}
            {refusing && (<>
              <button onClick={() => setRefusing(false)} className="rounded-lg px-3 py-2.5 text-xs font-semibold text-muted">Annuler</button>
              <button disabled={busy} onClick={() => act("refuser", { motif: motif.trim() || undefined })} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"><Ban size={13} /> Confirmer le refus</button></>)}
            {f?.statut === "registered" && <button disabled={busy} onClick={() => act("transmettre-police")} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep disabled:opacity-60"><Send size={13} /> Transmettre à la police</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
