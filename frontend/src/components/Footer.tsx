import Link from "next/link";
import { Emblem } from "./Logo";

const cols = [
  { title: "Navigation", items: [["Accueil", "/"], ["Comment ça marche", "/#fonctionnement"], ["Avantages pour les hôtels", "/#avantages"], ["Cadre légal", "/#cadre-legal"], ["Foire aux questions", "/faq"]] },
  { title: "Conformité", items: [["Arrêté interministériel 2024/ML-78", "/#cadre-legal"], ["Ministère de la Sécurité et de la Protection civile", "#"], ["Politique de confidentialité", "#"], ["Conditions d’utilisation", "#"]] },
  { title: "Support & contact", items: [["Bamako, République du Mali", "#"], ["contact@safestay.ml", "mailto:contact@safestay.ml"], ["Assistance technique 7j/7", "/contact"]] },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-mali-deep text-white/80">
      <div className="flag-bar" />
      <div className="bg-bogolan-dark absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="flex items-center gap-2.5 font-display text-lg font-bold text-white"><Emblem size={34} /> SafeStay <span className="text-gold">Mali</span></p>
          <p className="mt-3 text-xs leading-relaxed">Plateforme nationale de dématérialisation des fiches hôtelières de police et de télé-transmission journalière aux autorités maliennes.</p>
          <p className="mt-4 flex items-center gap-1.5 font-mono text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Système actif · Bamako &amp; régions</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-gold">{c.title}</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {c.items.map(([label, href]) => (<li key={label}><Link href={href} className="hover:text-white">{label}</Link></li>))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative border-t border-white/10 px-4 py-4 text-center font-mono text-[10px] text-white/50">
        © 2026 République du Mali — Tous droits réservés · Données hébergées conformément à la réglementation nationale.
      </div>
    </footer>
  );
}
