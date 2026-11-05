import type { ReactNode } from "react";
import { STATUT } from "@/lib/format";
import type { Fiche } from "@/lib/types";

export const Avatar = ({ f, tone = "bg-soft text-mali" }: { f: Fiche; tone?: string }) => (
  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${tone}`}>{f.prenom[0]}{f.nom[0]}</span>
);

export const StatutPill = ({ s }: { s: Fiche["statut"] }) => (
  <span className={`inline-block whitespace-nowrap rounded-md px-2 py-1 font-mono text-[10px] font-semibold ${STATUT[s].pill}`}>● {s === "transmitted" ? "Transmise" : STATUT[s].label}</span>
);

export function Pager({ page, pages, setPage, from, to, total, noun }: { page: number; pages: number; setPage: (n: number) => void; from: number; to: number; total: number; noun: string }) {
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-soft/80 px-4 py-3 text-[11px] text-muted">
      <p>Affichage de <strong className="text-mali">{from}</strong> à <strong className="text-mali">{to}</strong> sur <strong className="text-mali">{total}</strong> {noun}</p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md bg-white px-3 py-1.5 disabled:opacity-40">‹ Précédent</button>
        {list.map((n, i) => (<span key={n} className="flex items-center">{i > 0 && n - list[i - 1] > 1 && <span className="px-1">…</span>}
          <button onClick={() => setPage(n)} aria-current={n === page ? "page" : undefined} className={`h-8 w-8 rounded-md ${n === page ? "bg-mali font-bold text-white" : "bg-white"}`}>{n}</button></span>))}
        <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md bg-white px-3 py-1.5 disabled:opacity-40">Suivant ›</button>
      </nav>
    </div>
  );
}

export const Tag = ({ children, tone }: { children: ReactNode; tone: string }) => <span className={`rounded px-2 py-1 font-mono text-[9px] font-semibold ${tone}`}>{children}</span>;
