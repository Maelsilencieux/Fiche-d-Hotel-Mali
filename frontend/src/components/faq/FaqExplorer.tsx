"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, Plane, Building2, ShieldCheck, Download, BookOpen, ExternalLink, FileText, Gavel, EyeOff, Scale } from "lucide-react";
import { categories, faqs } from "./data";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const icons = { voyageurs: Plane, hotels: Building2, securite: ShieldCheck };

export default function FaqExplorer() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const list = useMemo(() => faqs.map((f, i) => ({ ...f, n: i + 1 })).filter((f) => (cat === "all" || f.cat === cat) && (!q || norm(f.q + f.a).includes(norm(q)))), [q, cat]);
  const count = (id: string) => faqs.filter((f) => f.cat === id).length;

  return (
    <>
      <div className="mt-8 rounded-xl border border-line bg-white p-3 shadow-sm">
        <label className="flex items-center gap-2 rounded-lg bg-soft/70 px-3 py-2.5">
          <Search size={14} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par mot-clé (ex: passeport,, quittance, délai de transmission, QR code…)" aria-label="Rechercher dans la FAQ" className="w-full bg-transparent text-xs outline-none placeholder:text-muted/70" />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {[{ id: "all", label: "Tous les sujets", n: faqs.length }, ...categories.map((c) => ({ id: c.id, label: c.label, n: count(c.id) }))].map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${cat === c.id ? "bg-mali text-white" : "bg-soft text-muted hover:text-mali"}`}>
              {c.label} <span className="ml-1 rounded bg-white/25 px-1 text-[9px]">{c.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {list.length === 0 && <p role="status" className="rounded-xl bg-white p-6 text-center text-xs text-muted">Aucune question ne correspond à « {q} ». Essayez un autre mot-clé ou <Link href="/contact" className="font-semibold text-mali underline">contactez l’assistance</Link>.</p>}
          {categories.map((c) => {
            const items = list.filter((f) => f.cat === c.id); if (!items.length) return null;
            const I = icons[c.id];
            return (
              <section key={c.id} aria-labelledby={`h-${c.id}`}>
                <div className="mb-3 flex items-center gap-3 border-b border-line pb-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-soft text-mali"><I size={14} /></span>
                  <div><h2 id={`h-${c.id}`} className="text-sm font-bold text-mali">{c.title}</h2><p className="text-[10px] text-muted">{c.sub}</p></div>
                </div>
                <div className="space-y-2">
                  {items.map((f) => (
                    <details key={f.n} open={!!q} className="group rounded-lg border border-line bg-white shadow-sm">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold text-mali [&::-webkit-details-marker]:hidden">
                        <span>Q{f.n} : {f.q}</span><ChevronDown size={14} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-xs font-bold text-mali"><ShieldCheck size={14} /> Garanties Régaliennes</h2>
            <dl className="mt-3 space-y-2 text-[11px]">
              {[[Gavel, "Cadre juridique", "Arrêté N° 2024/ML-78 du Gouvernement de la République du Mali."], [Scale, "Contrôle autorités", "Inspection inspirée conjointe Police nationale & Ministère du Tourisme."], [EyeOff, "Secret d’État & Loi sur les données personnelles", "Audit d’intégrité journalier sans rétention dans le cloud étranger."]].map(([I, t, d]: any) => (
                <div key={t} className="rounded-lg bg-soft/70 p-3"><dt className="flex items-center gap-1.5 font-mono text-[9px] font-semibold text-mali"><I size={11} />{t}</dt><dd className="mt-1 leading-relaxed text-muted">{d}</dd></div>
              ))}
            </dl>
            <Link href="/#cadre-legal" className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-mali hover:underline"><Download size={12} /> Télécharger le texte du Décret (PDF)</Link>
          </div>
          <div className="rounded-xl bg-mali p-4 text-white shadow-lg">
            <h2 className="flex items-center gap-2 text-xs font-bold"><BookOpen size={14} /> Guide de l’Hôtelier</h2>
            <p className="mt-2 text-[11px] leading-relaxed text-white/80">Consultez le manuel pas-à-pas de configuration de vos terminaux de réception et le protocole de scan des fiches individuelles d’hébergement.</p>
            <Link href="/guide-hotelier" className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-xs font-semibold text-mali hover:bg-soft"><ExternalLink size={12} /> Consulter le guide d’utilisation</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
