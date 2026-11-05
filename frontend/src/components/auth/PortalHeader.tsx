import Link from "next/link";
import Logo from "@/components/Logo";

export default function PortalHeader({ current }: { current?: "connexion" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="flag-bar" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo sub="Portail officiel · Enregistrement hôtelier" />
        <nav className="flex items-center gap-1 text-xs font-semibold" aria-label="Navigation">
          <Link href="/" className="rounded-lg px-3 py-2 text-muted hover:bg-soft hover:text-mali-deep">Accueil</Link>
          <Link href="/connexion" aria-current={current === "connexion" ? "page" : undefined} className="rounded-xl bg-mali px-4 py-2.5 text-white hover:bg-mali-deep">Connexion</Link>
          <Link href="/inscription" className="hidden rounded-lg px-3 py-2 text-muted hover:bg-soft hover:text-mali-deep sm:block">Créer un compte</Link>
        </nav>
      </div>
    </header>
  );
}
