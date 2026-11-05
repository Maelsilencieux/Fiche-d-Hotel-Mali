"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser, type SessionUser } from "@/lib/session";

/** Protège un espace : redirige vers /connexion si non connecté ou mauvais rôle. */
export default function AuthGuard({ role, children }: { role: SessionUser["role"]; children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const u = getUser();
    if (!getToken() || !u || (u.role !== role && u.role !== "superadmin")) router.replace("/connexion");
    else setOk(true);
  }, [role, router]);
  return ok ? <>{children}</> : <p className="p-10 text-center font-mono text-xs text-muted">Vérification de la session…</p>;
}
