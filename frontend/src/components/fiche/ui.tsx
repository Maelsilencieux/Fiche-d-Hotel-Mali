import type { ReactNode, SelectHTMLAttributes } from "react";

export function SelectField({ label, tag, icon, error, hint, options, required, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; tag?: string; icon?: ReactNode; error?: string; hint?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between"><label htmlFor={rest.name} className="text-[11px] font-semibold text-mali">{label}{required && <span className="text-red-600"> *</span>}</label>{tag && <span className="font-mono text-[9px] text-ok">{tag}</span>}</div>
      <div className={`flex items-center rounded-lg border bg-soft/60 focus-within:border-mali focus-within:bg-white ${error ? "border-red-500" : "border-line"}`}>
        {icon && <span className="pl-3 text-muted">{icon}</span>}
        <select id={rest.name} aria-invalid={!!error} className="w-full bg-transparent px-3 py-2.5 text-xs text-ink outline-none" {...rest}>
          <option value="">Sélectionner…</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {error ? <p className="mt-1 text-[10px] text-red-600">{error}</p> : hint && <p className="mt-1 text-[10px] text-muted">{hint}</p>}
    </div>
  );
}

export function SectionTitle({ icon, title, right }: { icon: ReactNode; title: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold text-mali"><span className="grid h-7 w-7 place-items-center rounded-md bg-soft text-mali">{icon}</span>{title}</h2>{right}
    </div>
  );
}

export const Required = () => <span className="rounded bg-red-50 px-2 py-0.5 font-mono text-[9px] text-red-600">Champs obligatoires *</span>;
