import Link from "next/link";

export default function Terms({ error }: { error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <input type="checkbox" name="terms" className="mt-0.5 h-3.5 w-3.5 accent-mali" />
        <span>J’accepte sans réserve les <Link href="/conditions" className="font-semibold text-mali underline">Conditions d’Utilisation</Link> et la <Link href="/confidentialite" className="font-semibold text-mali underline">Politique de Confidentialité</Link> républicaine régie par l’Arrêté N° 2024/ML-78.</span>
      </label>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
