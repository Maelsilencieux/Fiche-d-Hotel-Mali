import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Fraunces } from "next/font/google";
import I18nProvider from "@/i18n/I18nProvider";
import "./globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "SafeStay Mali – Fiches hôtelières de police",
  description: "Digitalisation des fiches hôtelières de police et télé-transmission journalière au Mali.",
};
export const viewport: Viewport = { themeColor: "#0a6b3b" };

// Exécuté avant le premier affichage : si l'utilisateur a choisi l'anglais, on masque brièvement la page
// (le temps que la traduction s'applique) pour éviter un flash de français. Filet de sécurité : 2,5 s.
const LANG_BOOT = `(function(){try{if(/(?:^|; )lang=en\b/.test(document.cookie)){var h=document.documentElement;h.classList.add('i18n-pending');h.lang='en';setTimeout(function(){h.classList.remove('i18n-pending')},2500)}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} /></head>
      <body className="font-sans antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
