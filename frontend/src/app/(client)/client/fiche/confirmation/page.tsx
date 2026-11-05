import Confirmation from "@/components/fiche/Confirmation";

export const metadata = { title: "Fiche envoyée – SafeStay Mali" };
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <Confirmation id={id} />;
}
