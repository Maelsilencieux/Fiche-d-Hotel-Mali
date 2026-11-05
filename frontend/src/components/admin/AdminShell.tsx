"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Building2, ClipboardList, Users, FileText, SlidersHorizontal, Bell, ChevronDown, UserRound, MapPinned } from "lucide-react";
import { api } from "@/lib/api";
import { clearSession, getUser, type SessionUser } from "@/lib/session";
import AppShell, { type NavItem } from "@/components/shell/AppShell";

const nav: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/admin/hotels", label: "Hôtels", icon: Building2 },
  { href: "/admin/fiches", label: "Fiches de police", icon: ClipboardList },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/parametres", label: "Paramètres", icon: SlidersHorizontal },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    setUser(getUser());
    api<{ db: { ok: boolean; latencyMs: number | null } }>("/admin/health", undefined, "GET").then((r) => { setOnline(r.db.ok); setLatency(r.db.latencyMs); }).catch(() => setOnline(false));
    api<{ count: number }>("/notifications/unread-count", undefined, "GET").then((r) => setUnread(r.count)).catch(() => {});
  }, [path]);
  async function logout() { await api("/auth/logout").catch(() => {}); clearSession(); router.push("/connexion"); }
  const name = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Administrateur national";

  return (
    <AppShell roleLabel="Supervision nationale" rootHref="/admin" nav={nav} onLogout={logout}
      note={<><span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-gold"><MapPinned size={11} /> Réseau national</span><span className="mt-1 block">Supervision des fiches hôtelières, des lots journaliers et de la conformité au Mali.</span></>}
      header={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-muted"><i className={`h-2 w-2 rounded-full ${online === false ? "bg-rouge" : "bg-ok"}`} />République du Mali · Supervision nationale</p>
          <div className="flex items-center gap-4">
            <span className={`hidden items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] lg:flex ${online === false ? "bg-red-50 text-rouge" : "bg-leaf text-mali"}`}><i className={`h-1.5 w-1.5 rounded-full ${online === false ? "bg-rouge" : "bg-ok"}`} />{online === false ? "Plateforme indisponible" : "Synchronisation active"}</span>
            {latency !== null && <span className="hidden font-mono text-[10px] text-muted xl:block">Base : {latency} ms</span>}
            <span className="relative text-muted" aria-label={`${unread} notification(s)`}><Bell size={18} />{unread > 0 && <i className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rouge ring-2 ring-white" />}</span>
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-mali text-white"><UserRound size={16} /></span>
              <div className="hidden leading-tight sm:block"><p className="text-xs font-bold text-mali-deep">{name}</p><p className="font-mono text-[9px] text-muted">Super administrateur</p></div><ChevronDown size={14} className="hidden text-muted sm:block" /></div>
          </div>
        </div>}>
      {children}
    </AppShell>
  );
}
