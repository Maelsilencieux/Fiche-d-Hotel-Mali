"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { UserRound, ShieldCheck, SlidersHorizontal, Info, BadgeCheck, Mail, Phone, Lock, CalendarDays, Globe, Save, Loader2, CheckCircle2, Circle, Eye, EyeOff, KeyRound, Activity, ScanFace } from "lucide-react";
import Link from "next/link";
import { api, type ApiError } from "@/lib/api";
import { dt } from "@/lib/format";
import { getUser, saveSession, type SessionUser } from "@/lib/session";
import type { ActivityEvent, Health } from "@/lib/types";
import { Crumb } from "./ui";

type Me = SessionUser & { telephone?: string; createdAt?: string; lastLoginAt?: string };
const tabs = [{ id: "profil", label: "Mon profil", icon: UserRound }, { id: "secu", label: "Sécurité & accès", icon: ShieldCheck, badge: "Protégé" }, { id: "pref", label: "Préférences", icon: SlidersHorizontal }, { id: "about", label: "À propos de SafeStay", icon: Info }] as const;
const rules = [{ l: "12 caractères minimum", ok: (p: string) => p.length >= 12 }, { l: "Une majuscule", ok: (p: string) => /[A-Z]/.test(p) }, { l: "Un chiffre", ok: (p: string) => /\d/.test(p) }, { l: "Un caractère spécial", ok: (p: string) => /[^A-Za-z0-9]/.test(p) }];
const env = () => { const u = navigator.userAgent; const b = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "Navigateur"; const o = /Windows/.test(u) ? "Windows" : /Mac OS/.test(u) ? "macOS" : /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Linux/.test(u) ? "Linux" : ""; return `${b}${o ? ` · ${o}` : ""}`; };

function Pw({ id, label, v, set, ph }: { id: string; label: string; v: string; set: (s: string) => void; ph: string }) {
  const [show, setShow] = useState(false);
  return <div><label htmlFor={id} className="mb-1.5 block text-sm font-bold text-mali">{label}</label><div className="flex items-center rounded-lg border border-line bg-white focus-within:border-mali"><Lock size={14} className="ml-3 text-muted" /><input id={id} type={show ? "text" : "password"} value={v} onChange={(e) => set(e.target.value)} placeholder={ph} autoComplete={id === "cur" ? "current-password" : "new-password"} className="w-full bg-transparent px-3 py-3 text-xs outline-none" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"} className="pr-3 text-muted">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>;
}

export default function AdminSettings() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("profil");
  const [me, setMe] = useState<Me | null>(getUser() as Me | null);
  const [f, setF] = useState({ nom: "", prenom: "", telephone: "" }); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [cf, setCf] = useState("");
  const [rows, setRows] = useState(10); const [health, setHealth] = useState<Health | null>(null); const [events, setEvents] = useState<ActivityEvent[]>([]); const [ua, setUa] = useState("");

  useEffect(() => {
    setUa(env()); setRows(Number(localStorage.getItem("ss_pref_rows")) || 10);
    api<{ user: Me }>("/auth/me", undefined, "GET").then((r) => { setMe(r.user); setF({ nom: r.user.nom ?? "", prenom: r.user.prenom ?? "", telephone: r.user.telephone ?? "" }); }).catch(() => {});
    api<Health>("/admin/health", undefined, "GET").then(setHealth).catch(() => {});
    api<{ events: ActivityEvent[] }>("/admin/activity?limit=3", undefined, "GET").then((r) => setEvents(r.events)).catch(() => {});
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { const r = await api<{ user: Me }>("/auth/profile", f, "PUT"); setMe(r.user); const t = localStorage.getItem("ss_token") ?? sessionStorage.getItem("ss_token"); if (t) saveSession(t, r.user, !!localStorage.getItem("ss_token")); setMsg({ ok: true, t: "Profil mis à jour." }); }
    catch (x) { setMsg({ ok: false, t: (x as ApiError).message }); } finally { setBusy(false); }
  }
  const passed = useMemo(() => rules.map((r) => r.ok(nw)), [nw]);
  const valid = passed.every(Boolean) && nw === cf && !!cur;
  async function savePwd(e: FormEvent) {
    e.preventDefault(); setMsg(null); if (!valid) { setMsg({ ok: false, t: nw !== cf ? "Les mots de passe ne correspondent pas." : "Le nouveau mot de passe ne respecte pas tous les critères." }); return; }
    setBusy(true);
    try { const r = await api<{ token: string; user: SessionUser }>("/auth/change-password", { currentPassword: cur, newPassword: nw }, "PUT"); saveSession(r.token, r.user, !!localStorage.getItem("ss_token")); setCur(""); setNw(""); setCf(""); setMsg({ ok: true, t: "Mot de passe modifié avec succès." }); }
    catch (x) { setMsg({ ok: false, t: (x as ApiError).message }); } finally { setBusy(false); }
  }
  const full = [me?.prenom, me?.nom].filter(Boolean).join(" ") || "Super administrateur";
  const Banner = () => msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-xs ${msg.ok ? "bg-emerald-50 text-ok" : "bg-red-50 text-red-700"}`}>{msg.t}</p>;
  const Ro = ({ k, v, icon: I }: { k: string; v?: string; icon?: any }) => <div><span className="text-sm font-bold text-mali">{k}</span><div className="mt-1.5 flex items-center justify-between rounded-lg bg-soft/80 px-3 py-3 text-sm text-mali">{v || "—"}{I && <I size={14} className="text-muted" />}</div></div>;

  return (
    <div className="space-y-6">
      <Crumb items={[{ label: "Administration centrale", href: "/admin" }, { label: "Paramètres du système" }]} />
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><h1 className="text-4xl font-extrabold text-mali">Paramètres</h1><p className="mt-2 text-xs leading-relaxed text-muted">Gérez votre compte régalien, configurez les protocoles d’authentification et ajustez les préférences opérationnelles de la plateforme.</p></div>
        <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-line"><span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-ok"><BadgeCheck size={20} /></span><p className="font-mono text-[10px] text-muted"><strong className="block text-mali">● HABILITATION NIVEAU 1</strong>Sécurité : maximale (super admin habilité)</p></div></div>

      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl bg-white p-2 shadow-sm ring-1 ring-line">{tabs.map(({ id, label, icon: I, ...r }) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setMsg(null); }} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-xs font-bold ${tab === id ? "bg-mali text-white" : "text-muted hover:text-mali"}`}><I size={15} />{label}{"badge" in r && <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${tab === id ? "bg-white/20" : "bg-leaf text-mali"}`}>{r.badge}</span>}</button>))}</div>

      {tab === "profil" && <>
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-white/95 p-6 shadow-sm"><span className="grid h-20 w-20 place-items-center rounded-2xl bg-mali text-3xl font-extrabold text-white">{(me?.prenom?.[0] ?? "S") + (me?.nom?.[0] ?? "A")}</span>
          <div className="min-w-[240px] flex-1"><h2 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold text-mali">{full}<span className="rounded bg-mali px-2 py-1 font-mono text-[10px] font-bold text-white">SUPER ADMINISTRATEUR</span></h2><p className="mt-2 inline-flex items-center gap-1.5 rounded bg-emerald-100 px-2 py-1 font-mono text-[10px] font-bold text-ok"><ScanFace size={12} /> CONTRÔLE RÉGALIEN</p><p className="mt-2 text-xs text-muted">Administration centrale · République du Mali</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><p className="rounded-lg bg-soft/80 px-4 py-3 font-mono text-[10px] uppercase text-muted">Dernière connexion<strong className="block text-xs normal-case text-mali">{me?.lastLoginAt ? dt(me.lastLoginAt) : "Première session"}</strong></p><p className="rounded-lg bg-soft/80 px-4 py-3 font-mono text-[10px] uppercase text-muted">Environnement<strong className="block text-xs normal-case text-mali">{ua || "…"}</strong></p></div></div>
        <div className="grid items-start gap-6 xl:grid-cols-[1.7fr_1fr]">
          <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-line bg-white/95 p-6 shadow-sm"><div><h2 className="text-xl font-extrabold text-mali">Informations du compte</h2><p className="text-xs text-muted">Consultez et mettez à jour les renseignements officiels de votre profil administrateur.</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-bold text-mali">Prénom</span><input value={f.prenom} onChange={(e) => setF({ ...f, prenom: e.target.value })} className="mt-1.5 w-full rounded-lg bg-soft/80 px-3 py-3 text-sm outline-none focus:ring-1 focus:ring-mali" /></label>
              <label className="block"><span className="text-sm font-bold text-mali">Nom</span><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} className="mt-1.5 w-full rounded-lg bg-soft/80 px-3 py-3 text-sm outline-none focus:ring-1 focus:ring-mali" /></label>
              <Ro k="Adresse e-mail (non modifiable ici)" v={me?.email} icon={Mail} />
              <label className="block"><span className="text-sm font-bold text-mali">Numéro de téléphone</span><div className="mt-1.5 flex items-center rounded-lg bg-soft/80 focus-within:ring-1 focus-within:ring-mali"><input value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="+223 …" className="w-full bg-transparent px-3 py-3 text-sm outline-none" /><Phone size={14} className="mr-3 text-muted" /></div></label>
              <Ro k="Rôle dans la plateforme" v="Super administrateur" icon={ShieldCheck} /><Ro k="Date de création du compte" v={me?.createdAt ? dt(me.createdAt).split(",")[0] : undefined} icon={CalendarDays} />
              <div className="sm:col-span-2"><Ro k="Juridiction assignée" v="République du Mali · couverture territoriale nationale" icon={Globe} /></div></div>
            <p className="flex gap-3 rounded-xl bg-soft/80 p-4 text-xs leading-relaxed text-muted"><Info size={16} className="mt-0.5 shrink-0 text-mali" /><span><strong className="block text-mali">Avis de conformité régalienne</strong>Le changement d’adresse e-mail ou du rôle ne peut pas être effectué depuis cette page : contactez la Direction de la sécurité nationale.</span></p>
            <Banner /><div className="flex justify-end gap-3"><button type="button" onClick={() => me && setF({ nom: me.nom ?? "", prenom: me.prenom ?? "", telephone: me.telephone ?? "" })} className="rounded-lg bg-soft px-5 py-3 text-xs font-bold text-mali">Annuler les modifications</button>
              <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-3 text-xs font-bold text-white hover:bg-mali-deep disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer les modifications</button></div></form>
          <aside className="rounded-2xl border border-line bg-white/95 p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-extrabold text-mali"><Activity size={16} /> Activité récente du réseau</h2><span className="font-mono text-[10px] text-muted">Direct</span></div>
            <ul className="mt-4 space-y-4">{events.length === 0 && <li className="text-xs text-muted">Aucune activité.</li>}{events.map((e, i) => <li key={i} className="flex gap-3"><i className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.alert ? "bg-red-500" : "bg-mali"}`} /><div><p className="text-sm font-semibold text-mali">{e.title}</p><p className="font-mono text-[10px] text-muted">{e.detail} · {dt(e.at)}</p></div></li>)}</ul></aside>
        </div></>}

      {tab === "secu" && <form onSubmit={savePwd} className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-line bg-white/95 p-6 shadow-sm"><div><h2 className="flex items-center gap-2 text-xl font-extrabold text-mali"><KeyRound size={18} /> Mot de passe &amp; accès</h2><p className="text-xs text-muted">Un e-mail de confirmation est envoyé après chaque changement de mot de passe.</p></div>
        <Pw id="cur" label="Mot de passe actuel" v={cur} set={setCur} ph="••••••••••••" /><Pw id="nw" label="Nouveau mot de passe" v={nw} set={setNw} ph="Minimum 12 caractères" /><Pw id="cf" label="Confirmer le nouveau mot de passe" v={cf} set={setCf} ph="Répétez le nouveau mot de passe" />
        <ul className="grid gap-2 rounded-xl bg-soft/80 p-4 sm:grid-cols-2">{rules.map((r, i) => <li key={r.l} className={`flex items-center gap-2 text-xs ${passed[i] ? "text-ok" : "text-ink"}`}>{passed[i] ? <CheckCircle2 size={14} /> : <Circle size={14} className="text-muted" />}{r.l}</li>)}</ul>
        <Banner /><div className="flex justify-between"><Link href="/mot-de-passe-oublie" className="self-center text-xs font-semibold text-mali">Mot de passe oublié ?</Link><button disabled={busy || !valid} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-3 text-xs font-bold text-white disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer le nouveau mot de passe</button></div></form>}

      {tab === "pref" && <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-line bg-white/95 p-6 shadow-sm"><h2 className="text-xl font-extrabold text-mali">Préférences d’affichage</h2>
        <label className="block"><span className="text-sm font-bold text-mali">Lignes par page par défaut (Hôtels, Utilisateurs, Documents)</span><select value={rows} onChange={(e) => { setRows(+e.target.value); localStorage.setItem("ss_pref_rows", e.target.value); setMsg({ ok: true, t: "Préférence enregistrée sur cet appareil." }); }} className="mt-1.5 w-full rounded-lg bg-soft/80 px-3 py-3 text-sm">{[10, 20, 50].map((n) => <option key={n}>{n}</option>)}</select></label><Banner />
        <p className="font-mono text-[10px] text-muted">Les préférences sont conservées localement dans ce navigateur.</p></section>}

      {tab === "about" && <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-line bg-white/95 p-6 shadow-sm"><h2 className="text-xl font-extrabold text-mali">À propos de SafeStay Mali</h2>
        <p className="text-xs leading-relaxed text-muted">Plateforme nationale de dématérialisation des fiches hôtelières de police, placée sous la tutelle du Ministère de la Sécurité et de la Protection civile et du Ministère du Tourisme (Arrêté N° 2024/ML-78).</p>
        <dl className="grid gap-3 sm:grid-cols-2">{[["Environnement", health?.env ?? "…"], ["Base de données", health ? (health.db.ok ? `Connectée (${health.db.latencyMs ?? "–"} ms)` : "Indisponible") : "…"], ["Service e-mail", health ? (health.email.configured ? "Configuré" : "Non configuré") : "…"], ["Heure serveur", health ? dt(health.time) : "…"]].map(([k, v]) => <div key={k} className="rounded-lg bg-soft/80 p-4"><dt className="font-mono text-[9px] uppercase text-muted">{k}</dt><dd className="mt-1 text-sm font-semibold text-mali">{v}</dd></div>)}</dl>
        <p className="text-xs"><Link href="/contact" className="font-bold text-mali underline">Contacter le support</Link> · <Link href="/#cadre-legal" className="font-bold text-mali underline">Cadre légal</Link></p></section>}
    </div>
  );
}
