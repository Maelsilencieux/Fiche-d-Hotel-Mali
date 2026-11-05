"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";

export function Crumb({ items, right }: { items: { label: string; href?: string }[]; right?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase text-muted">
      <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-1.5">{items.map((it, i) => (
        <span key={it.label} className="flex items-center gap-1.5">{i > 0 && <span aria-hidden>›</span>}{it.href ? <Link href={it.href} className="hover:text-mali">{it.label}</Link> : <span aria-current="page" className="font-bold text-mali">{it.label}</span>}</span>))}</nav>{right}
    </div>
  );
}

export function StatCard({ title, value, icon: I, line, tint, foot, progress }: { title: string; value: ReactNode; icon: any; line: string; tint: string; foot: ReactNode; progress?: number }) {
  return (
    <li className={`rounded-xl border border-line border-t-4 bg-white/95 p-5 shadow-sm ${line}`}>
      <div className="flex items-start justify-between gap-2"><p className="font-mono text-[10px] uppercase leading-relaxed text-muted">{title}</p><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tint}`}><I size={18} /></span></div>
      <p className="mt-1 font-display text-4xl font-bold text-mali-deep">{value}</p><p className="mt-3 text-[11px] text-muted">{foot}</p>
      {progress !== undefined && <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-soft"><i className="block h-full rounded-full bg-current opacity-70" style={{ width: `${Math.min(100, Math.max(0, progress))}%`, color: "inherit" }} /></span>}
    </li>
  );
}

export function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1200); }} aria-label={`Copier ${text}`} className="text-muted hover:text-mali">{ok ? <Check size={12} /> : <Copy size={12} />}</button>;
}

export const Initials = ({ a, b, dark, off }: { a?: string; b?: string; dark?: boolean; off?: boolean }) => (
  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${dark ? "bg-mali text-white" : off ? "bg-soft text-muted" : "bg-leaf text-mali"}`}>{(a?.[0] ?? "") + (b?.[0] ?? "")}</span>
);

export function AdminPager({ page, pages, setPage, size, setSize, from, to, total, noun }: { page: number; pages: number; setPage: (n: number) => void; size: number; setSize: (n: number) => void; from: number; to: number; total: number; noun: string }) {
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-soft/80 px-4 py-3 font-mono text-[11px] text-muted">
      <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2">Afficher par page :<select value={size} onChange={(e) => { setSize(+e.target.value); setPage(1); }} className="rounded border border-line bg-white px-2 py-1">{[10, 20, 50].map((n) => <option key={n}>{n}</option>)}</select></label>
        <span>Affichage de <strong className="text-mali">{from}</strong> à <strong className="text-mali">{to}</strong> sur <strong className="text-mali">{total.toLocaleString("fr-FR")}</strong> {noun}</span></div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="flex items-center rounded-md bg-white px-2.5 py-1.5 disabled:opacity-40"><ChevronLeft size={13} /> Précédent</button>
        {list.map((n, i) => (<span key={n} className="flex items-center">{i > 0 && n - list[i - 1] > 1 && <span className="px-1">…</span>}<button onClick={() => setPage(n)} aria-current={n === page ? "page" : undefined} className={`h-8 w-8 rounded-md ${n === page ? "bg-mali font-bold text-white" : "bg-white"}`}>{n}</button></span>))}
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="flex items-center rounded-md bg-white px-2.5 py-1.5 disabled:opacity-40">Suivant <ChevronRight size={13} /></button>
      </nav>
    </div>
  );
}

export const selectCls = "rounded-lg bg-soft/70 px-3 py-3 text-xs text-ink outline-none focus:ring-1 focus:ring-mali";
export const Th = ({ children }: { children: ReactNode }) => <th scope="col" className="px-4 py-3.5 font-bold">{children}</th>;

export const Pill = ({ tone, children }: { tone: "ok" | "warn" | "bad" | "off" | "info"; children: ReactNode }) => (
  <span className={`inline-block whitespace-nowrap rounded-md px-2.5 py-1.5 font-mono text-[10px] font-semibold ${{ ok: "bg-emerald-50 text-ok", warn: "bg-amber-50 text-amber-700", bad: "bg-red-50 text-red-600", off: "bg-soft text-muted", info: "bg-leaf text-mali" }[tone]}`}>● {children}</span>
);

/** Préférence « lignes par page » (page Paramètres → Préférences). */
export const prefRows = () => (typeof window === "undefined" ? 10 : [10, 20, 50].includes(Number(localStorage.getItem("ss_pref_rows"))) ? Number(localStorage.getItem("ss_pref_rows")) : 10);
