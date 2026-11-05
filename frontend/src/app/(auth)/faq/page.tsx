import Link from "next/link";
import { Clock, Lock, Headset, Phone, Mail, TriangleAlert, Send, CircleHelp } from "lucide-react";
import Breadcrumb from "@/components/auth/Breadcrumb";
import FaqExplorer from "@/components/faq/FaqExplorer";
import { SUPPORT } from "@/lib/config";

export const metadata = { title: "Foire aux questions – SafeStay Mali" };

const stats = [
  { i: Clock, k: "Délai de télé-transmission légal", v: "Moins de 24h", d: "Synchronisation quotidienne obligatoire", c: "border-t-[#14B53A]" },
  { i: Headset, k: "Permanence d’assistance", v: "24h/24 & 7j/7", d: "Ligne directe Police nationale & Ministère de la Sécurité", c: "border-t-[#CE1126]" },
];

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb items={[{ label: "Portail officiel Mali", href: "/" }, { label: "Assistance & Réglementation" }, { label: "Foire Aux Questions (FAQ)" }]}
        badge={<span className="flex items-center gap-1.5 rounded bg-soft px-2 py-0.5 text-[9px] font-semibold text-mali"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Centre d’aide régalien · Arrêté N° 2024/ML-78</span>} />
      <h1 className="text-3xl font-extrabold text-mali">Foire Aux Questions — SafeStay Mali</h1>
      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted">Trouvez des réponses claires sur la conformité de l’enregistrement hôtelier, les procédures voyageurs, les obligations des réceptifs et la protection souveraine de vos données.</p>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {stats.map(({ i: I, k, v, d, c }) => (
          <li key={k} className={`rounded-xl border border-line border-t-4 bg-white p-4 shadow-sm ${c}`}>
            <p className="flex items-center justify-between font-mono text-[9px] text-muted">{k}<I size={13} /></p>
            <p className="mt-2 text-xl font-extrabold text-mali">{v}</p><p className="mt-1 text-[10px] text-muted">{d}</p>
          </li>
        ))}
      </ul>

      <FaqExplorer />

      <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-mali"><CircleHelp size={16} /> Besoin d’aide supplémentaire ?</h2>
        <p className="mt-1 text-xs text-muted">Nos équipes opérationnelles et les inspecteurs de la Police des Frontières sont à votre écoute pour lever tout blocage.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-soft/80 p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold text-mali"><Headset size={14} /> Guichet d’Assistance Hôtelière &amp; autorités</h3>
            <p className="mt-1 text-[11px] text-muted">Ligne prioritaire de permanence ouverte aux gérants, directeurs de réceptifs et agents de réception.</p>
            <p className="mt-3 flex items-center gap-2 font-mono text-[10px] text-mali"><Phone size={11} /> Permanence : {SUPPORT.phone}</p>
            <p className="mt-1 flex items-center gap-2 font-mono text-[10px] text-mali"><Mail size={11} /> Email : {SUPPORT.email}</p>
          </div>
          <div className="rounded-xl bg-soft/80 p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold text-mali"><TriangleAlert size={14} /> Signaler une anomalie ou poser une question</h3>
            <p className="mt-1 text-[11px] text-muted">Transmettez votre requête spécifique, incident technique ou demande de dérogation au secrétariat du Mali.</p>
            <Link href="/contact" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-mali px-4 py-2 text-xs font-semibold text-white hover:bg-mali-deep"><Send size={12} /> Ouvrir un ticket d’assistance</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
