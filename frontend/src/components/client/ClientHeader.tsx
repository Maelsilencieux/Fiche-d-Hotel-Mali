"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import { clearSession } from "@/lib/session";
import Logo from "@/components/Logo";

export default function ClientHeader() {
  const router = useRouter();
  async function logout() { await api("/auth/logout").catch(() => {}); clearSession(); router.push("/connexion"); }
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="flag-bar" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-4">
          <Logo href="/client" sub="Espace voyageur" />
          <span className="hidden border-l border-line pl-4 leading-tight md:block">
            <span className="block text-[11px] font-semibold text-mali-deep">Fiche hôtelière de police</span>
            <span className="block font-mono text-[8px] uppercase tracking-wider text-muted">Démarche officielle</span>
          </span>
        </div>
        <nav className="flex items-center gap-1 text-xs font-medium" aria-label="Espace voyageur">
          <Link href="/client" className="rounded-lg bg-leaf px-3 py-1.5 font-bold text-mali">Accueil</Link>
          <Link href="/client/fiche/nouvelle" className="hidden rounded-lg px-3 py-1.5 text-muted hover:text-mali sm:block">Nouvelle fiche</Link>
          <Link href="/faq" className="hidden rounded-lg px-3 py-1.5 text-muted hover:text-mali sm:block">Aide</Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-gold/25 px-2.5 py-1 font-mono text-[9px] font-semibold text-amber-900 lg:flex"><BadgeCheck size={11} /> Voyageur vérifié</span>
          <button onClick={logout} className="px-2 py-1.5 text-muted hover:text-rouge">Déconnexion</button>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-mali text-white" aria-hidden><UserRound size={15} /></span>
        </nav>
      </div>
    </header>
  );
}
