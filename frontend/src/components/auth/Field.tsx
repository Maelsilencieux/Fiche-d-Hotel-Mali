"use client";
import { useState, type ReactNode, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label: string; tag?: string; error?: string; hint?: string; prefix?: ReactNode; icon?: ReactNode;
};

const input = "w-full rounded-lg border border-line bg-soft/60 px-3 py-2.5 text-xs text-ink placeholder:text-muted/60 focus:border-mali focus:bg-white";

export function Field({ label, tag, error, hint, prefix, icon, id, required, ...rest }: Props) {
  const fid = id ?? rest.name;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between"><label htmlFor={fid} className="text-[11px] font-semibold text-mali">{label}{required && <span className="text-red-600"> *</span>}</label>{tag && <span className="font-mono text-[9px] text-ok">{tag}</span>}</div>
      <div className={`flex items-center rounded-lg border bg-soft/60 focus-within:border-mali focus-within:bg-white ${error ? "border-red-500" : "border-line"}`}>
        {icon && <span className="pl-3 text-muted">{icon}</span>}
        {prefix && <span className="pl-3 font-mono text-[11px] text-muted">{prefix}</span>}
        <input id={fid} required={required} aria-invalid={!!error} className="w-full bg-transparent px-3 py-2.5 text-xs text-ink outline-none placeholder:text-muted/60" {...rest} />
      </div>
      {error ? <p className="mt-1 text-[10px] text-red-600">{error}</p> : hint && <p className="mt-1 text-[10px] text-muted">{hint}</p>}
    </div>
  );
}

export function PasswordField(props: Omit<Props, "type" | "icon" | "prefix">) {
  const [show, setShow] = useState(false);
  const { label, error, hint, id, required, ...rest } = props;
  const fid = id ?? rest.name;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 block text-[11px] font-semibold text-mali">{label}{required && <span className="text-red-600"> *</span>}</label>
      <div className={`flex items-center rounded-lg border bg-soft/60 focus-within:border-mali focus-within:bg-white ${error ? "border-red-500" : "border-line"}`}>
        <Lock size={13} className="ml-3 text-muted" />
        <input id={fid} required={required} aria-invalid={!!error} type={show ? "text" : "password"} className="w-full bg-transparent px-3 py-2.5 text-xs text-ink outline-none placeholder:text-muted/60" {...rest} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="pr-3 text-muted hover:text-mali">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error ? <p className="mt-1 text-[10px] text-red-600">{error}</p> : hint && <p className="mt-1 text-[10px] text-muted">{hint}</p>}
    </div>
  );
}
