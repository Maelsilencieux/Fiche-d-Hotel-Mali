"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CircleHelp, LogIn } from "lucide-react";
import PortalHeader from "./PortalHeader";
import Logo from "@/components/Logo";

export default function AuthHeader() {
  const path = usePathname();
  const isLogin = path.startsWith("/connexion");
  if (["/mot-de-passe-oublie", "/reinitialiser-mot-de-passe", "/faq"].some((p) => path.startsWith(p))) return <PortalHeader />;

  if (isLogin) return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="flag-bar" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-xs font-semibold sm:flex" aria-label="Navigation">
          <Link href="/" className="text-muted hover:text-mali">Accueil</Link>
          <Link href="/connexion" aria-current="page" className="border-b-2 border-gold py-1 text-mali-deep">Connexion</Link>
        </nav>
        <Link href="/inscription" className="rounded-xl border border-gold bg-gold/20 px-4 py-2.5 text-xs font-semibold text-mali-deep hover:bg-gold/40">Créer un compte</Link>
      </div>
    </header>
  );

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-mali-deep px-4 py-1.5 text-center font-mono text-[10px] text-white/90">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="font-semibold text-gold">République du Mali</span> · Ministère de la Sécurité et de la Protection civile · 
      </div>
      <div className="border-b border-line bg-white/90 backdrop-blur">
        <div className="flag-bar" />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo sub="Fiches hôtelières de police" />
          <nav className="flex items-center gap-1" aria-label="Navigation">
            <Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-soft hover:text-mali-deep sm:flex"><Home size={13} /> Accueil</Link>
            <Link href="/faq" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-soft hover:text-mali-deep sm:flex"><CircleHelp size={13} /> FAQ</Link>
            <Link href="/connexion" className="ml-1 flex items-center gap-1.5 rounded-xl bg-mali px-4 py-2.5 text-xs font-semibold text-white hover:bg-mali-deep"><LogIn size={14} /> Se connecter</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
