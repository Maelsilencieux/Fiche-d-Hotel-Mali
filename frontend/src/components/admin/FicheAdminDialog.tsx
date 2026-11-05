"use client";
import { useEffect, useState } from "react";
import { X, Flag, FlagOff, Send, FileDown, Printer, Loader2, UserRound, Hotel, CalendarDays, FileText } from "lucide-react";
import { api, apiBlob, type ApiError } from "@/lib/api";
import { d as fd, dt, nuits, STATUT, PAIEMENT } from "@/lib/format";
import { printFiche } from "@/components/hotel/exports";
import type { Fiche } from "@/lib/types";

/** Détail d'une fiche pour la supervision nationale : consulter, signaler, transmettre, télécharger la pièce. */
export default function FicheAdminDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState<Fiche | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState("");
  const [flagging, setFlagging] = useState(false); const [motif, setMotif] = useState("");
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const load = () => api<{ fiche: Fiche }>(`/fiches/${id}`, undefined, "GET").then((r) => setF(r.fiche)).catch((e: ApiError) => setErr(e.message));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(key: string, call: () => Promise<unknown>) { setBusy(key); setErr(""); try { await call(); await load(); onDone(); setFlagging(false); setMotif(""); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); } }
  const flag = () => run("flag", () => api(`/admin/fiches/${id}/signaler`, { motif }, "PATCH"));
  const unflag = () => run("unflag", () => api(`/admin/fiches/${id}/lever-signalement`, undefined, "PATCH"));
  const transmit = () => run("tx", () => api(`/fiches/${id}/transmettre-police`, undefined, "PATCH"));
  async function piece() { setBusy("piece"); try { const b = await apiBlob(`/fiches/${id}/piece`); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${f?.reference}_piece.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(""); } }

  const Row = ({ icon: I, k, children }: { icon: any; k: string; children: React.ReactNode }) => <div className="flex gap-3 rounded-xl bg-soft/70 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-mali"><I size={14} /></span><div><p className="font-mono text-[9px] uppercase text-muted">{k}</p>{children}</div></div>;
  const n = f ? nuits(f.dateEntree, f.dateSortie) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-mali-deep/60 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Détail de la fiche" onClick={(e) => e.stopPropagation()} className="my-8 w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-3xl bg-mali-deep px-6 py-4 text-white">
          <div><p className="font-mono text-[10px] uppercase tracking-wider text-gold">Fiche de police</p><h2 className="font-display text-xl font-bold">{f?.reference ?? "Chargement…"}</h2></div>
          <button onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"><X size={15} /></button>
        </div>
        <div className="space-y-4 p-6">
          {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-rouge">{err}</p>}
          {!f && !err && <p className="p-8 text-center text-xs text-muted"><Loader2 className="mr-2 inline animate-spin" size={14} />Chargement…</p>}
          {f && <>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 font-mono text-[10px] font-semibold ${STATUT[f.statut].pill}`}>● {STATUT[f.statut].label}</span>
              {f.international && <span className="rounded-full bg-gold/30 px-3 py-1 font-mono text-[10px] font-semibold text-amber-900">International</span>}
              <span className="ml-auto font-mono text-[10px] text-muted">Déposée le {dt(f.createdAt)}</span>
            </div>
            {f.signalement?.actif && <p className="flex gap-2 rounded-xl border-l-4 border-rouge bg-rouge/5 p-3 text-xs text-rouge"><Flag size={14} className="mt-0.5 shrink-0" /><span><strong>Fiche signalée</strong> · {f.signalement.motif}{f.signalement.at ? ` (${dt(f.signalement.at)})` : ""}</span></p>}
            {f.statut === "refused" && f.refusMotif && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">Refusée par l’établissement : {f.refusMotif}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Row icon={UserRound} k="Voyageur"><p className="text-xs font-bold text-mali-deep">{f.flagEmoji} {f.prenom} {f.nom.toUpperCase()}</p><p className="text-[10px] text-muted">Né(e) le {fd(f.dateNaissance)} à {f.lieuNaissance}<br />{f.nationalite} · {f.profession || "profession non renseignée"}</p></Row>
              <Row icon={Hotel} k="Établissement"><p className="text-xs font-bold text-mali-deep">{f.hotel?.nomHotel}</p><p className="text-[10px] text-muted">{[f.hotelCommune || f.hotel?.ville, f.hotelRegion].filter(Boolean).join(" · ")}<br />Chambre {f.chambreNumero}</p></Row>
              <Row icon={CalendarDays} k="Séjour"><p className="text-xs font-bold text-mali-deep">{fd(f.dateEntree)} → {fd(f.dateSortie)}</p><p className="text-[10px] text-muted">{n} nuitée{n > 1 ? "s" : ""} · {f.motif}<br />De {f.venantDe} vers {f.allantA}</p></Row>
              <Row icon={FileText} k="Pièce d’identité"><p className="text-xs font-bold text-mali-deep">{f.typePiece} · {f.numeroPiece}</p><p className="text-[10px] text-muted">Délivrée à {f.delivreA} le {fd(f.delivreLe)}<br />Règlement : {PAIEMENT[f.modePaiement] ?? f.modePaiement}</p></Row>
            </div>
            {f.transmisReference && <p className="rounded-xl bg-leaf p-3 font-mono text-[11px] text-mali">Transmise le {dt(f.transmisAt)} · réf. {f.transmisReference}</p>}

            {flagging && <div className="rounded-xl border border-rouge/30 bg-rouge/5 p-3"><label className="text-[11px] font-semibold text-rouge" htmlFor="motif">Motif du signalement</label>
              <textarea id="motif" value={motif} onChange={(e) => setMotif(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-lg border border-line bg-white p-2.5 text-xs outline-none focus:border-rouge" placeholder="Ex. : pièce d’identité utilisée dans deux établissements à la même date" />
              <div className="mt-2 flex gap-2"><button onClick={flag} disabled={busy === "flag" || motif.trim().length < 5} className="flex items-center gap-2 rounded-lg bg-rouge px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === "flag" && <Loader2 size={13} className="animate-spin" />} Confirmer le signalement</button><button onClick={() => setFlagging(false)} className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-muted ring-1 ring-line">Annuler</button></div></div>}

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {f.signalement?.actif
                ? <button onClick={unflag} disabled={!!busy} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-mali ring-1 ring-line hover:bg-soft"><FlagOff size={13} /> Lever le signalement</button>
                : !flagging && <button onClick={() => setFlagging(true)} className="flex items-center gap-2 rounded-lg bg-rouge/10 px-4 py-2.5 text-xs font-semibold text-rouge hover:bg-rouge/20"><Flag size={13} /> Signaler</button>}
              {f.statut === "registered" && <button onClick={transmit} disabled={!!busy} className="flex items-center gap-2 rounded-lg bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep disabled:opacity-60">{busy === "tx" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Transmettre aux autorités</button>}
              <button onClick={piece} disabled={!!busy} className="flex items-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-xs font-semibold text-mali hover:bg-mali hover:text-white">{busy === "piece" ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Pièce (PDF)</button>
              <button onClick={() => printFiche(f)} className="flex items-center gap-2 rounded-lg bg-soft px-4 py-2.5 text-xs font-semibold text-mali hover:bg-leaf"><Printer size={13} /> Imprimer</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
