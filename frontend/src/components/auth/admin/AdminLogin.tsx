"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, Phone, Headset, Building2, MonitorCheck } from "lucide-react";
import { SUPPORT } from "@/lib/config";
import { api, type ApiError } from "@/lib/api";
import { saveSession, homeFor, type SessionUser } from "@/lib/session";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await api<{ token: string; user: SessionUser }>("/auth/login", { email, password });
      if (r.user.role !== "superadmin") {
        setError("Ce compte n'est pas un compte Administration. Utilisez la page de connexion standard.");
        return;
      }
      saveSession(r.token, r.user, remember);
      router.push("/admin");
    } catch (err) {
      const a = err as ApiError;
      setError(a.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-mali-deep">Se connecter</h1>
            <p className="mt-2 text-sm text-muted">Entrez vos identifiants pour accéder à votre compte.</p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-leaf/20 text-mali">
            <Lock size={24} />
          </span>
        </div>

        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-mali-deep">
              Adresse e-mail <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@safestay.ml"
                className="w-full rounded-lg border border-line bg-white/50 py-3 pl-10 pr-4 text-sm text-mali-deep outline-none transition focus:border-mali focus:bg-white focus:ring-2 focus:ring-mali/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-mali-deep">
              Mot de passe <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••••••"
                className="w-full rounded-lg border border-line bg-white/50 py-3 pl-10 pr-12 text-sm text-mali-deep outline-none transition focus:border-mali focus:bg-white focus:ring-2 focus:ring-mali/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-mali"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-mali"
              />
              Mémoriser cet appareil
            </label>
            <Link href="/mot-de-passe-oublie" className="font-semibold text-mali hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-mali py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-mali-deep disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Se connecter <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
            <Building2 size={16} /> Pas encore de compte ?{" "}
            <Link href="/inscription" className="font-semibold text-mali hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-soft/80 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mali text-white">
              <Headset size={20} />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-mali-deep">Assistance</h3>
              <p className="text-xs text-muted">Nos équipes sont à votre écoute</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Phone size={14} /> {SUPPORT.phone}
            </span>
            <span className="truncate">{SUPPORT.email}</span>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-line pt-4 font-mono text-[10px] text-muted">
          <MonitorCheck size={12} /> Poste certifié · Registre d'État sécurisé · Bamako, Mali
        </p>
      </div>
    </div>
  );
}