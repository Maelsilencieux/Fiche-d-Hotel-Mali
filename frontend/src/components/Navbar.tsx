"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const path = usePathname();
  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const linkCls = (href: string) =>
    `rounded-lg px-3 py-2 text-xs font-semibold ${isOn(href) ? "bg-leaf text-mali" : "text-muted hover:bg-soft hover:text-mali-deep"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <nav className="hidden gap-1 md:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isOn(l.href) ? "page" : undefined} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/connexion" aria-current={path.startsWith("/connexion") ? "page" : undefined}
            className="flex items-center gap-1.5 rounded-xl bg-mali px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-mali-deep">
            <LogIn size={14} /> Se connecter
          </Link>
          <Link href="/inscription" aria-label="Créer un compte" aria-current={path.startsWith("/inscription") ? "page" : undefined}
            className="flex items-center gap-1.5 rounded-xl border border-gold bg-gold/20 px-3 py-2.5 text-xs font-semibold text-mali-deep hover:bg-gold/40 sm:px-4">
            <UserPlus size={14} /> <span className="hidden sm:inline">Créer un compte</span>
          </Link>
        </div>
      </div>

      {/* Mobile : les 3 liens passent sur une seconde ligne */}
      <nav className="flex justify-center gap-1 border-t border-line px-4 py-1.5 md:hidden" aria-label="Navigation principale (mobile)">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={linkCls(l.href)}>{l.label}</Link>
        ))}
      </nav>
    </header>
  );
}