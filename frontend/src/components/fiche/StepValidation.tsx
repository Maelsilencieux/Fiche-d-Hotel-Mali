"use client";
import { useRef, useState } from "react";
import { FileText, UploadCloud, CheckCircle2, Wallet, Receipt, CreditCard, Ticket, Hash, Calendar, MapPin, Check, RefreshCw } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { PIECES, PAIEMENTS } from "./model";
import { SectionTitle } from "./ui";
import type { StepProps } from "./StepProps";

export const MAX_MB = 5;
const payIcons = { cash: Wallet, cheque: Receipt, carte: CreditCard, voucher: Ticket };

export default function StepValidation({ d, set, errors: e, file, setFile, fileError }: StepProps & { file: File | null; setFile: (f: File | null) => void; fileError: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localErr, setLocalErr] = useState("");

  function pick(f?: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") return setLocalErr("Format PDF uniquement.");
    if (f.size > MAX_MB * 1024 * 1024) return setLocalErr(`Fichier trop volumineux (max ${MAX_MB} Mo).`);
    setLocalErr(""); setFile(f);
  }
  const err = localErr || fileError;

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle icon={<FileText size={14} />} title="Pièce d’identité présentée" right={<span className="rounded bg-soft px-2 py-0.5 font-mono text-[9px] text-muted">Requis</span>} />
        <p className="text-[11px] font-semibold text-mali">Type de pièce d’identité <span className="text-red-600">*</span></p>
        <div role="radiogroup" className="mt-2 grid grid-cols-3 gap-2">
          {PIECES.map((p) => { const on = d.typePiece === p.id; return (
            <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => set("typePiece", p.id)} className={`rounded-lg p-3 text-center ${on ? "bg-mali text-white" : "bg-soft text-ink hover:bg-soft/70"}`}>
              <span className="block text-xs font-bold">{p.label}</span><span className={`block text-[9px] ${on ? "text-white/75" : "text-muted"}`}>{p.d}</span></button>); })}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Numéro de pièce d’identité" tag="Norme ICAO" name="numeroPiece" required icon={<Hash size={13} />} placeholder="EX: A1234567" value={d.numeroPiece} onChange={(ev) => set("numeroPiece", ev.target.value.toUpperCase())} error={e.numeroPiece} /></div>
          <Field label="Date de délivrance" name="delivreLe" type="date" required icon={<Calendar size={13} />} value={d.delivreLe} onChange={(ev) => set("delivreLe", ev.target.value)} error={e.delivreLe} />
          <Field label="Lieu de délivrance" name="delivreA" required icon={<MapPin size={13} />} placeholder="EX: Bamako, Police nationale" value={d.delivreA} onChange={(ev) => set("delivreA", ev.target.value)} error={e.delivreA} />
        </div>

        <p className="mb-1.5 mt-4 text-[11px] font-semibold text-mali">Numérisation du document (PDF recto/verso) <span className="text-red-600">*</span></p>
        <div onDragOver={(ev) => { ev.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(ev) => { ev.preventDefault(); setDrag(false); pick(ev.dataTransfer.files[0]); }}
          className={`rounded-xl border-2 border-dashed p-6 text-center ${drag ? "border-mali bg-soft" : "border-line bg-soft/50"}`}>
          <UploadCloud className="mx-auto text-mali" size={26} />
          <p className="mt-2 text-xs font-semibold text-mali">Glissez-déposez la copie recto/verso scannée</p>
          <p className="text-[10px] text-muted">Format PDF obligatoire · Taille max. {MAX_MB} Mo</p>
          <button type="button" onClick={() => input.current?.click()} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-mali ring-1 ring-line hover:bg-soft">Parcourir les fichiers</button>
          <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(ev) => pick(ev.target.files?.[0])} />
        </div>
        {file && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-soft p-3">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-mali text-white"><FileText size={16} /></span>
              <div className="min-w-0"><p className="truncate font-mono text-[11px] font-semibold text-mali">{file.name}</p><p className="flex items-center gap-1 text-[10px] text-ok"><CheckCircle2 size={11} /> {(file.size / 1048576).toFixed(1)} Mo · Prêt pour la transmission sécurisée</p></div></div>
            <button type="button" onClick={() => input.current?.click()} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-mali ring-1 ring-line"><RefreshCw size={12} /> Remplacer</button>
          </div>
        )}
        {err && <p role="alert" className="mt-2 text-[10px] text-red-600">{err}</p>}
      </section>

      <section>
        <SectionTitle icon={<Wallet size={14} />} title="Mode de règlement prévu" right={<span className="rounded bg-soft px-2 py-0.5 font-mono text-[9px] text-muted">À l’établissement</span>} />
        <p className="mb-3 text-[11px] text-muted">Sélectionnez la modalité utilisée pour régler vos nuitées et taxes de séjour auprès de la réception hôtelière.</p>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {PAIEMENTS.map((p) => { const I = payIcons[p.id]; const on = d.modePaiement === p.id; return (
            <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => set("modePaiement", p.id)} className={`relative rounded-xl p-4 text-left ${on ? "bg-mali text-white" : "bg-soft text-ink hover:bg-soft/70"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${on ? "bg-white/15" : "bg-white text-mali"}`}><I size={15} /></span>
              <span className="mt-2 block text-xs font-bold">{p.label}</span><span className={`block text-[10px] ${on ? "text-white/75" : "text-muted"}`}>{p.d}</span>
              {on && <Check size={14} className="absolute right-3 top-3" />}
            </button>); })}
        </div>
      </section>
    </div>
  );
}
