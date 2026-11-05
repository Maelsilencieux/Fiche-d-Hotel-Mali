import { Landmark } from "lucide-react";

export default function TopBar() {
  return (
    <div className="bg-mali-deep font-mono text-[10px] text-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5">
        <p className="flex items-center gap-2">
          <Landmark size={12} className="text-gold" />
          <span className="font-semibold text-white">République du Mali</span>
          <span className="hidden sm:inline">· Ministère de la Sécurité et de la Protection civile</span>
        </p>
        <p className="hidden items-center gap-1.5 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Portail officiel ·
        </p>
      </div>
    </div>
  );
}
