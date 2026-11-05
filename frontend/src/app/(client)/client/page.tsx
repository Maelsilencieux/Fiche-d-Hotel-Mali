import { redirect } from "next/navigation";

// Tableau de bord client : pas encore conçu → on ouvre directement la déclaration.
export default function ClientHome() { redirect("/client/fiche/nouvelle"); }
