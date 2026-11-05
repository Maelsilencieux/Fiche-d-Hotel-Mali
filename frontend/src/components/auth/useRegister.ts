"use client";
import { useState, type FormEvent } from "react";
import { api, type ApiError } from "@/lib/api";

/** Logique commune aux deux formulaires d'inscription (client / hôtel). */
export function useRegister(endpoint: string, build: (f: FormData) => Record<string, unknown>, onDone: (r: any) => void) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    const pwd = String(f.get("password") ?? "");
    if (pwd.length < 8) errs.password = "Minimum 8 caractères.";
    if (pwd !== f.get("confirm")) errs.confirm = "Les mots de passe ne correspondent pas.";
    if (!f.get("terms")) errs.terms = "Vous devez accepter les conditions.";
    setErrors(errs); setGlobalError("");
    if (Object.keys(errs).length) return;

    setLoading(true);
    try { onDone(await api(endpoint, build(f))); }
    catch (err) { const a = err as ApiError; setErrors(a.fields ?? {}); setGlobalError(a.message); }
    finally { setLoading(false); }
  }
  return { errors, globalError, loading, submit };
}
