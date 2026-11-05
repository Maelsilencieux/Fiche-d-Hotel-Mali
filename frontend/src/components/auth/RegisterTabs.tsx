"use client";
import { useState } from "react";
import { UserRound, Hotel } from "lucide-react";
import ClientForm from "./ClientForm";
import HotelForm from "./HotelForm";

export default function RegisterTabs({ initial = "client" }: { initial?: "client" | "hotel" }) {
  const [tab, setTab] = useState<"client" | "hotel">(initial);
  const tabs = [{ id: "client", label: "Client / Voyageur", icon: UserRound }, { id: "hotel", label: "Établissement hôtelier", icon: Hotel }] as const;
  return (
    <>
      <p className="mb-3 text-center font-mono text-[9px] text-muted">Sélectionnez votre type d’accès</p>
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
        {tabs.map(({ id, label, icon: I }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold ${tab === id ? "bg-mali text-white shadow" : "text-muted hover:text-mali"}`}>
            <I size={14} /> {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-6">{tab === "client" ? <ClientForm /> : <HotelForm />}</div>
    </>
  );
}
