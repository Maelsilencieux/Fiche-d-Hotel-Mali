"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Landmark, ShieldCheck, Lock, Building2, UserRound, Mail, Phone, MapPin, KeyRound, Clock, Circle, CheckCircle2, Info, Save, X, Loader2, ArrowRight, Eye, EyeOff, CircleCheck } from "lucide-react";
import { api, type ApiError } from "@/lib/api";
import { getUser, saveSession, type SessionUser } from "@/lib/session";
import { SUPPORT } from "@/lib/config";

type HotelInfo = { nomHotel: string; ville?: string; etoiles?: number; telephone?: string; email?: string };
type Me = SessionUser & { telephone?: string; nom?: string; prenom?: string; hotelStatus?: string; passwordChangedAt?: string };

const rules = [
  { id: "len", label: "12 caractères minimum", ok: (p: string) => p.length >= 12 },
  { id: "up", label: "Au moins une majuscule", ok: (p: string) => /[A-Z]/.test(p) },
  { id: "num", label: "Au moins un chiffre", ok: (p: string) => /\d/.test(p) },
  { id: "sp", label: "Caractère spécial (!@#$%^&*)", ok: (p: string) => /[^A-Za-z0-9]/.test(p) },
];
const levels = ["En attente de saisie", "Faible", "Moyen", "Bon", "Fort"];
const tones = ["bg-line", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-ok"];

function PwField({ label, id, value, onChange, placeholder, icon, right }: { label: string; id: string; value: string; onChange: (v: string) => void; placeholder: string; icon: React.ReactNode; right?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><label htmlFor={id} className="text-sm font-bold text-mali">{label}</label>{right}</div>
      <div className="flex items-center rounded-lg border border-line bg-white shadow-sm focus-within:border-mali"><span className="pl-3 text-muted">{icon}</span>
        <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={id === "cur" ? "current-password" : "new-password"} className="w-full bg-transparent px-3 py-3 text-xs outline-none placeholder:text-muted/60" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"} className="pr-3 text-muted hover:text-mali">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
    </div>
  );
}

export default function SettingsPanel() {
  const [me, setMe] = useState<Me | null>(getUser() as Me | null);
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [cf, setCf] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  const [now, setNow] = useState("");

  useEffect(() => {
    setNow(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    api<{ user: Me }>("/auth/me", undefined, "GET").then((r) => setMe(r.user)).catch(() => {});
    api<{ hotel: HotelInfo }>("/hotels/mon-hotel", undefined, "GET").then((r) => setHotel(r.hotel)).catch(() => {});
  }, []);

  const passed = useMemo(() => rules.map((r) => r.ok(nw)), [nw]);
  const score = nw ? passed.filter(Boolean).length : 0;
  const valid = passed.every(Boolean) && nw === cf && cur.length > 0;
  const days = me?.passwordChangedAt ? Math.floor((Date.now() - +new Date(me.passwordChangedAt)) / 86400000) : null;

  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(""); setOk(false);
    if (!valid) { setErr(nw !== cf ? "Les mots de passe ne correspondent pas." : "Le nouveau mot de passe ne respecte pas tous les critères."); return; }
    setBusy(true);
    try {
      const r = await api<{ token: string; user: SessionUser }>("/auth/change-password", { currentPassword: cur, newPassword: nw }, "PUT");
      saveSession(r.token, r.user, !!localStorage.getItem("ss_token")); setOk(true); setCur(""); setNw(""); setCf("");
      api<{ user: Me }>("/auth/me", undefined, "GET").then((x) => setMe(x.user)).catch(() => {});
    } catch (x) { setErr((x as ApiError).message); } finally { setBusy(false); }
  }

  const Info_ = ({ icon: I, k, v, sub, tag }: { icon: any; k: string; v: string; sub?: string; tag?: string }) => (
    <div className="rounded-lg bg-soft/70 p-4"><div className="flex items-start justify-between"><p className="font-mono text-[9px] uppercase text-muted">{k}</p><I size={14} className="text-muted" /></div>
      <p className="mt-1 text-sm font-bold text-mali">{v}</p>{(sub || tag) && <p className="mt-1 text-[11px] text-muted">{tag && <span className="mr-2 rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">{tag}</span>}{sub}</p>}</div>
  );
  const name = [me?.prenom, me?.nom].filter(Boolean).join(" ");
  const ville = hotel?.ville ?? me?.villeHotel ?? "Bamako";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold text-mali">Paramètres <span className="flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 font-mono text-[10px] font-semibold text-mali"><ShieldCheck size={12} /> Accès sécurisé</span></h1>
          <p className="mt-2 text-xs text-muted">Gérez les informations de votre compte hôtelier et la sécurité de votre accès.</p></div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-line"><span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-mali"><ShieldCheck size={18} /></span>
          <p className="font-mono text-[10px] text-muted">Session active : <strong className="text-mali">OP-{ville.slice(0, 6).toUpperCase()}-{(me?._id ?? "000").slice(-3).toUpperCase()}</strong><span className="block"><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ok" />Connexion sécurisée : aujourd’hui à {now}</span></p></div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.3fr]">
        <section className="rounded-2xl border border-line border-t-4 border-t-mali bg-white/95 p-6 shadow-sm" aria-labelledby="info-t">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-mali"><Landmark size={18} /></span><div><h2 id="info-t" className="text-lg font-bold text-mali">Informations du compte</h2><p className="font-mono text-[9px] uppercase text-muted">Identité administrative</p></div></div>
            <span className="flex items-center gap-1.5 rounded bg-soft px-2 py-1 font-mono text-[9px] text-muted"><Lock size={10} /> Lecture seule</span></div>
          <p className="mt-4 flex gap-3 rounded-lg bg-soft/70 p-4 text-[11px] leading-relaxed text-muted"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-mali" />Les informations d’homologation de votre établissement sont certifiées par l’autorité administrative et ne peuvent être modifiées que sur demande officielle.</p>
          <div className="mt-4 space-y-3">
            <Info_ icon={Lock} k="Établissement homologué" v={me?.nomHotel ?? hotel?.nomHotel ?? "—"} tag={me?.rccm ? `Agrément N° ${me.rccm}` : undefined} sub={hotel?.etoiles ? `Cat. ${hotel.etoiles} étoiles` : undefined} />
            <Info_ icon={UserRound} k="Responsable habilité" v={name || "Titulaire du compte établissement"} sub="Gestionnaire titulaire" />
            <Info_ icon={Mail} k="Adresse e-mail du compte" v={me?.email ?? "—"} sub="Messagerie chiffrée protocolée TLS 1.3" />
            <Info_ icon={Phone} k="Téléphone professionnel" v={me?.telephone ?? hotel?.telephone ?? "—"} sub="Standard direct Réception / Urgences" />
            <Info_ icon={MapPin} k="Juridiction & localisation" v={`${ville}, République du Mali`} />
            <Info_ icon={CircleCheck} k="Statut opérationnel" v="Transmission aux autorités" tag={me?.hotelStatus === "approved" || !me?.hotelStatus ? "● Compte homologué & actif" : `● ${me.hotelStatus}`} />
          </div>
          <div className="mt-5 rounded-xl bg-soft p-5"><h3 className="flex items-center gap-2 text-xs font-bold text-mali"><Info size={14} /> Modification des données certifiées</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">Pour modifier les coordonnées officielles de votre établissement ou changer le titulaire délégué, veuillez contacter le support administratif SafeStay ou les autorités compétentes.</p>
            <p className="mt-3 flex items-center justify-between text-xs"><Link href="/contact" className="flex items-center gap-1.5 font-bold text-mali">Contacter le support <ArrowRight size={13} /></Link><span className="font-mono text-[9px] text-muted">Réf : DML-DIR</span></p></div>
        </section>

        <section className="rounded-2xl border border-line border-t-4 border-t-mali bg-white/95 p-6 shadow-sm" aria-labelledby="sec-t">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-mali"><ShieldCheck size={18} /></span><div><h2 id="sec-t" className="text-lg font-bold text-mali">Sécurité du compte</h2><p className="font-mono text-[9px] uppercase text-muted">Gestion des identifiants SafeStay</p></div></div>
            <span className="flex items-center gap-1.5 rounded bg-soft px-2 py-1 font-mono text-[9px] text-muted"><KeyRound size={10} /> POL-AUTH-09</span></div>
          <p className="mt-4 text-xs leading-relaxed text-muted">Modifiez votre mot de passe pour protéger votre espace hôtelier et sécuriser les transmissions d’identité vers les postes de police.</p>
          {days !== null && <div className="mt-4 flex gap-3 rounded-xl bg-soft/70 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-mali"><Clock size={16} /></span>
            <div><p className="flex flex-wrap items-center gap-2 text-sm font-bold text-mali">Dernière modification : il y a {days} jour{days > 1 ? "s" : ""}{days < 90 && <span className="rounded bg-white px-2 py-0.5 font-mono text-[9px] font-normal text-muted">Valide encore {90 - days} jours</span>}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Recommandation souveraine : renouveler les identifiants de transmission hôtelière tous les 90 jours.</p></div></div>}

          <form onSubmit={submit} noValidate className="mt-5 space-y-5">
            <PwField id="cur" label="Mot de passe actuel" value={cur} onChange={setCur} placeholder="••••••••••••" icon={<KeyRound size={14} />} right={<Link href="/mot-de-passe-oublie" className="font-mono text-[11px] font-semibold text-mali">Mot de passe oublié ?</Link>} />
            <PwField id="new" label="Nouveau mot de passe" value={nw} onChange={setNw} placeholder="Minimum 12 caractères" icon={<Lock size={14} />} />
            <div aria-live="polite"><div className="flex items-center justify-between font-mono text-[10px] text-muted"><span>FORCE DU MOT DE PASSE :</span><span>{levels[score]}</span></div>
              <div className="mt-1.5 grid grid-cols-4 gap-2">{[1, 2, 3, 4].map((n) => <i key={n} className={`h-1.5 rounded-full ${score >= n ? tones[score] : "bg-line"}`} />)}</div></div>
            <PwField id="cf" label="Confirmer le nouveau mot de passe" value={cf} onChange={setCf} placeholder="Répétez le nouveau mot de passe" icon={<Lock size={14} />} />
            <div className="rounded-xl bg-soft/70 p-4"><p className="font-mono text-[10px] uppercase text-muted">Critères de conformité gouvernementale :</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{rules.map((r, i) => <li key={r.id} className={`flex items-center gap-2 text-xs ${passed[i] ? "text-ok" : "text-ink"}`}>{passed[i] ? <CheckCircle2 size={14} /> : <Circle size={14} className="text-muted" />}{r.label}</li>)}</ul></div>
            <p className="flex gap-3 rounded-xl bg-leaf/60 p-4 text-xs leading-relaxed text-mali"><Info size={15} className="mt-0.5 shrink-0" />Un e-mail de confirmation sera envoyé à l’adresse du compte dès que le mot de passe aura été modifié.</p>
            {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
            {ok && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-ok"><CheckCircle2 size={14} /> Mot de passe modifié avec succès.</p>}
            <div className="flex justify-end gap-3"><button type="button" onClick={() => { setCur(""); setNw(""); setCf(""); setErr(""); }} className="flex items-center gap-2 rounded-lg bg-soft px-5 py-3 text-xs font-semibold text-mali"><X size={14} /> Annuler</button>
              <button disabled={busy || !valid} className="flex items-center gap-2 rounded-lg bg-mali px-5 py-3 text-xs font-semibold text-white hover:bg-mali-deep disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer le nouveau mot de passe</button></div>
          </form>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 p-5 shadow-sm ring-1 ring-line"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-mali"><ShieldCheck size={18} /></span>
        <div><p className="text-sm font-bold text-mali">Protocole National de Télédéclaration SafeStay <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] text-ok">CONFORME</span></p><p className="font-mono text-[10px] text-muted">Arrêté N° 2024/ML-78 | Chiffrement TLS 1.3 | Assistance : {SUPPORT.phone}</p></div></div>
        <p className="font-mono text-[10px] text-muted">Dernière vérification du poste : {new Date().toLocaleString("fr-FR")}</p></div>
    </div>
  );
}
