import Link from "next/link";

/** Emblème SafeStay Mali : écu aux trois bandes du drapeau (vert · or · rouge). */
export function Emblem({ size = 36 }: { size?: number }) {
  const id = "mali-shield"; // identique pour toutes les instances : le contour est le même
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="SafeStay Mali" className="shrink-0">
      <defs><clipPath id={id}><path d="M20 4 33 9v10c0 8.2-5.2 14.2-13 17-7.8-2.8-13-8.8-13-17V9z" /></clipPath></defs>
      <rect width="40" height="40" rx="11" fill="#053b22" />
      <g clipPath={`url(#${id})`}><rect x="6" y="3" width="9.5" height="34" fill="#14b53a" /><rect x="15.5" y="3" width="9.5" height="34" fill="#fcd116" /><rect x="25" y="3" width="9" height="34" fill="#ce1126" /></g>
      <path d="M20 4 33 9v10c0 8.2-5.2 14.2-13 17-7.8-2.8-13-8.8-13-17V9z" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m15.5 20 3.2 3.4 6-6.8" fill="none" stroke="#053b22" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ sub = "République du Mali", light = false, href = "/", size = 36 }: { sub?: string; light?: boolean; href?: string; size?: number }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Emblem size={size} />
      <span className="leading-tight">
        <span className={`block font-display text-[17px] font-bold tracking-tight ${light ? "text-white" : "text-mali-deep"}`}>SafeStay <span className={light ? "text-gold" : "text-mali"}>Mali</span></span>
        <span className={`block font-mono text-[9px] uppercase tracking-wider ${light ? "text-white/60" : "text-muted"}`}>{sub}</span>
      </span>
    </Link>
  );
}
