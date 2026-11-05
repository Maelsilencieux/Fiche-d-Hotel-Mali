"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Lock, type LucideIcon } from "lucide-react";
import Logo from "@/components/Logo";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

/**
 * Coque commune aux espaces Administration et Hôtel.
 * Panneau latéral « flottant » vert profond, actif en or, bandeau bogolan en pied.
 */
export default function AppShell({ roleLabel, rootHref, nav, header, note, footer, onLogout, children }: {
  roleLabel: string; rootHref: string; nav: NavItem[]; header: ReactNode; note: ReactNode; footer?: ReactNode; onLogout: () => void; children: ReactNode;
}) {
  const path = usePathname();
  const active = (h: string) => (h === rootHref ? path === rootHref : path.startsWith(h));
  return (
    <div className="min-h-screen">
      <div className="flag-bar sticky top-0 z-40" />
      <div className="mx-auto flex max-w-[1680px] gap-5 p-3 md:p-5">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col overflow-hidden rounded-3xl bg-mali-deep text-white shadow-xl md:flex">
          <div className="px-5 pt-6"><Logo light sub={roleLabel} />
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-gold"><Lock size={10} /> Espace sécurisé</p></div>
          <nav className="mt-6 flex-1 space-y-1 px-3" aria-label={roleLabel}>
            {nav.map(({ href, label, icon: I, badge }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${active(href) ? "bg-gold text-mali-deep shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                <I size={16} />{label}{badge && <span className="ml-auto rounded-full bg-mali-deep/15 px-2 py-0.5 font-mono text-[9px]">{badge}</span>}
              </Link>))}
          </nav>
          <div className="bg-bogolan-dark relative mx-3 mb-3 rounded-2xl bg-black/20 p-4">
            <div className="relative text-[11px] leading-relaxed text-white/80">{note}</div>
          </div>
          <button onClick={onLogout} className="mx-5 mb-5 flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-semibold text-white/80 hover:text-white"><LogOut size={14} /> Déconnexion</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">{header}</header>
          <nav className="mt-3 flex gap-1 overflow-x-auto rounded-xl border border-line bg-white/90 p-1.5 md:hidden" aria-label={`${roleLabel} (mobile)`}>
            {nav.map(({ href, label }) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold ${active(href) ? "bg-mali text-white" : "text-muted"}`}>{label}</Link>)}
            <button onClick={onLogout} className="ml-auto whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold text-rouge">Quitter</button>
          </nav>
          <main className="py-6">{children}</main>
          {footer}
        </div>
      </div>
    </div>
  );
}
