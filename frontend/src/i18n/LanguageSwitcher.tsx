"use client";
import { Globe } from "lucide-react";
import { useI18n } from "./I18nProvider";

/** Bascule FR / EN. `dark` pour les fonds foncés. */
export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div role="group" aria-label="Langue / Language" translate="no" className={`flex items-center gap-0.5 rounded-full bg-soft p-0.5 text-[10px] font-bold ${className}`}>
      <Globe size={12} className="mx-1 text-muted" aria-hidden />
      {(["fr", "en"] as const).map((l) => (
        <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}
          className={`rounded-full px-2.5 py-1.5 ${lang === l ? "bg-mali text-white shadow-sm" : "text-muted hover:text-mali"}`}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}
