import Breadcrumb from "@/components/auth/Breadcrumb";
import ForgotAside from "@/components/auth/recovery/ForgotAside";
import ForgotForm from "@/components/auth/recovery/ForgotForm";

export const metadata = { title: "Mot de passe oublié – SafeStay Mali" };

export default function Page() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb items={[{ label: "Portail officiel Mali", href: "/" }, { label: "Authentification Centralisée", href: "/connexion" }, { label: "Récupération de compte" }]} />
      <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]"><ForgotAside /><ForgotForm /></div>
    </section>
  );
}
