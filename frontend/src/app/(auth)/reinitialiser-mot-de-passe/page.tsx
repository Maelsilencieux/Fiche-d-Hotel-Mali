import Breadcrumb from "@/components/auth/Breadcrumb";
import ResetPanel from "@/components/auth/recovery/ResetPanel";

export const metadata = { title: "Nouveau mot de passe – SafeStay Mali" };

// Lien reçu par e-mail : /reinitialiser-mot-de-passe?token=...&email=...
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token, email } = await searchParams;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb items={[{ label: "Portail officiel Mali", href: "/" }, { label: "Authentification Centralisée", href: "/connexion" }, { label: "Réinitialisation du mot de passe" }]}
        badge={<span className="flex items-center gap-1.5 rounded bg-soft px-2 py-0.5 text-[9px] font-semibold text-mali"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> Session temporaire</span>} />
      <ResetPanel token={token} email={email} />
    </section>
  );
}
