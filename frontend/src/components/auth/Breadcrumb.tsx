import Link from "next/link";
import { Fragment } from "react";

export default function Breadcrumb({ items, badge }: { items: { label: string; href?: string }[]; badge?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/90 px-3 py-2 font-mono text-[10px] text-muted ring-1 ring-line">
      <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <Fragment key={it.label}>
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? <Link href={it.href} className="hover:text-mali">{it.label}</Link> : <span aria-current="page" className="font-semibold text-mali">{it.label}</span>}
          </Fragment>
        ))}
      </nav>
      {badge}
    </div>
  );
}
