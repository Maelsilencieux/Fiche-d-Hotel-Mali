import Link from "next/link";
import LoginAside from "@/components/auth/login/LoginAside";
import LoginForm from "@/components/auth/login/LoginForm";

export const metadata = { title: "Connexion – SafeStay Mali" };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ inscrit?: string }> }) {
  const { inscrit } = await searchParams;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between text-[11px]">
        <p className="text-muted"><span className="font-semibold text-mali">Portail Souverain</span> / Authentification Centralisée</p>
        <p className="hidden items-center gap-1.5 rounded-md bg-white px-2.5 py-1 font-mono text-[10px] text-muted ring-1 ring-line sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Système National Opérationnel</p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
        <LoginAside />
        <LoginForm justRegistered={inscrit === "client" ? "client" : inscrit === "hotel" ? "hotel" : undefined} />
      </div>
    </section>
  );
}
