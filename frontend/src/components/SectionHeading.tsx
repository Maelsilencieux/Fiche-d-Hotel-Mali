import { type ReactNode } from "react";

export default function SectionHeading({ icon, tag, title, children }: { icon: ReactNode; tag: string; title: string; children: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full bg-gold/25 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-900">{icon}{tag}</p>
      <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-mali-deep">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
