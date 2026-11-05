import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import RegisterTabs from "@/components/auth/RegisterTabs";

export const metadata = { title: "Créer un compte – SafeStay Mali" };

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <section className="mx-auto max-w-xl px-4 py-12">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-[10px] font-medium text-mali shadow-sm ring-1 ring-line"><ShieldCheck size={11} /> Portail national régalien</p>
        <h1 className="mt-4 text-3xl font-extrabold text-mali">Créez votre compte SafeStay</h1>
        <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-muted">Rejoignez SafeStay pour simplifier et sécuriser la gestion numérique des fiches hôtelières de police. Choisissez le type de compte correspondant à votre profil.</p>
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
        <div className="h-1 bg-gradient-to-r from-[#14B53A] via-[#FCD116] to-[#CE1126]" />
        <div className="p-6 sm:p-8">
          <RegisterTabs initial={type === "hotel" ? "hotel" : "client"} />
          <p className="mt-6 text-center text-[11px] text-muted">Vous avez déjà un compte ? <Link href="/connexion" className="font-semibold text-mali">Se connecter ›</Link></p>
        </div>
      </div>
    </section>
  );
}
