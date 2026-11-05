"use client";
import { useCallback, useEffect, useState } from "react";
import { api, type ApiError } from "@/lib/api";
import type { Fiche, Statut, Stats } from "@/lib/types";

/** Charge les fiches de l'hôtel (jusqu'à 1000 par statut) pour filtrer/paginer côté client. */
export function useAllFiches(statuts?: Statut[]) {
  const [rows, setRows] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const key = statuts?.join(",") ?? "all";

  const load = useCallback(() => {
    setLoading(true); setErr("");
    const list: (Statut | undefined)[] = statuts ?? [undefined];
    Promise.all(list.map((s) => api<{ fiches: Fiche[] }>(`/fiches/hotel?limit=1000${s ? `&statut=${s}` : ""}`, undefined, "GET")))
      .then((r) => setRows(r.flatMap((x) => x.fiches).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))))
      .catch((e: ApiError) => setErr(e.message)).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(load, [load]);
  return { rows, loading, err, reload: load, setErr };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const reload = useCallback(() => { api<{ stats: Stats }>("/fiches/hotel/stats", undefined, "GET").then((r) => setStats(r.stats)).catch(() => {}); }, []);
  useEffect(reload, [reload]);
  return { stats, reload };
}
