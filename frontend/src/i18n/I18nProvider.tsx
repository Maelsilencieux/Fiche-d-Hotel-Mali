"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "fr", setLang: () => {} });
export const useI18n = () => useContext(Ctx);

const readCookie = (): Lang => (/(?:^|; )lang=en\b/.test(document.cookie) ? "en" : "fr");

/**
 * Langue de l'interface (FR par défaut, EN en option), mémorisée dans un cookie `lang`.
 * En anglais, le traducteur DOM remplace les textes français à la volée (voir translator.ts).
 */
export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [ready, setReady] = useState(false);
  useEffect(() => { setLangState(readCookie()); setReady(true); }, []);

  useEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    html.lang = lang;
    let stop: (() => void) | undefined; let cancelled = false;
    if (lang === "en") {
      Promise.all([import("./translator"), import("./en.json")])
        .then(([t, d]) => { if (cancelled) return; stop = t.start(d.default as Record<string, string>); })
        .catch((e) => console.error("Traduction indisponible :", e))
        .finally(() => html.classList.remove("i18n-pending"));
    } else html.classList.remove("i18n-pending");
    return () => { cancelled = true; stop?.(); };
  }, [lang, ready]);

  const setLang = useCallback((l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
    setLangState(l);
  }, []);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}
