"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Inbox, Users, FileText, SlidersHorizontal, Bell, Radio } from "lucide-react";
import { api } from "@/lib/api";
import { SUPPORT } from "@/lib/config";
import { clearSession, getUser, type SessionUser } from "@/lib/session";
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import AppShell, { type NavItem } from "@/components/shell/AppShell";

const nav: NavItem[] = [
  { href: "/hotel", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/hotel/demandes", label: "Demandes", icon: Inbox },
  { href: "/hotel/clients", label: "Clients", icon: Users },
  { href: "/hotel/documents", label: "Documents", icon: FileText },
  { href: "/hotel/parametres", label: "Paramètres", icon: SlidersHorizontal },
];

export default function HotelShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [unread, setUnread] = useState(0);
  useEffect(() => { setUser(getUser()); api<{ count: number }>("/notifications/unread-count", undefined, "GET").then((r) => setUnread(r.count)).catch(() => {}); }, [path]);
  async function logout() { await api("/auth/logout").catch(() => {}); clearSession(); router.push("/connexion"); }

  return (
    <AppShell roleLabel="Portail hôtelier" rootHref="/hotel" nav={nav} onLogout={logout}
      note={<><span className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-gold">Liaison autorités <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></span><span className="mt-1 block">Chiffrement TLS 1.3 · lots journaliers scellés</span></>}
      footer={<footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 font-mono text-[9px] text-muted"><span>SafeStay Mali · Système national d’enregistrement hôtelier</span><span>Assistance réception : {SUPPORT.phone}</span><span>TLS 1.3</span></footer>}
      header={
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="truncate font-display text-lg font-bold text-mali-deep">{user?.nomHotel ?? "Mon établissement"}</p>
            <p className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-muted">{user?.rccm ? `RCCM ${user.rccm} · ` : ""}{user?.villeHotel ? `${user.villeHotel}, ` : ""}Mali <span className="flex items-center gap-1.5 rounded-full bg-leaf px-2 py-0.5 font-semibold text-mali"><Radio size={9} /> LIAISON ACTIVE</span></p></div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/hotel/demandes" aria-label={`${unread} notification(s)`} className="relative text-muted hover:text-mali"><Bell size={18} />{unread > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rouge px-1 text-[9px] font-bold text-white">{unread}</span>}</Link>
            <div className="hidden text-right leading-tight sm:block"><p className="text-[11px] font-bold text-mali-deep">Compte établissement</p><p className="font-mono text-[9px] text-muted">ID-ML-{(user?._id ?? "0000").slice(-4).toUpperCase()}</p></div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-mali text-sm font-bold text-white">{(user?.nomHotel ?? "H")[0]}</span>
          </div>
        </div>}>
      {children}
    </AppShell>
  );
}
