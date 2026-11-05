"use client";
import { useCallback, useEffect, useState } from "react";
import { Hotel as HotelIcon, CalendarDays, Calendar, Car, Info, RefreshCw, BedDouble, Hash, Loader2 } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { api, type ApiError } from "@/lib/api";
import { SelectField, SectionTitle } from "./ui";
import { TRANSPORTS, nights } from "./model";
import type { StepProps } from "./StepProps";

type HotelItem = { _id: string; nomHotel: string; ville: string; adresse?: string; etoiles?: number; chambresDisponibles: { _id: string; numero: string; type: string; etage: number }[] };

export default function StepSejour({ d, set, errors: e, onHotel }: StepProps & { onHotel?: (name: string) => void }) {
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    setLoading(true); setErr("");
    api<{ hotels: HotelItem[] }>("/hotels", undefined, "GET").then((r) => setHotels(r.hotels)).catch((x: ApiError) => setErr(x.message)).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const hotel = hotels.find((h) => h._id === d.hotelId);
  const n = nights(d.dateEntree, d.dateSortie);
  const hotelName = hotel?.nomHotel;
  useEffect(() => { if (hotelName) onHotel?.(hotelName); }, [hotelName, onHotel]);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[9px] text-mali">Protocole de déclaration obligatoire</p>
        <h2 className="mt-1 text-2xl font-extrabold text-mali">Où allez-vous séjourner ?</h2>
        <p className="mt-1 text-xs text-muted">Sélectionnez l’hôtel agréé par le Ministère du Tourisme et précisez les modalités temporelles et logistiques de votre séjour en République du Mali.</p>
      </div>

      <section>
        <SectionTitle icon={<HotelIcon size={14} />} title="1. Établissement d’hébergement homologué" />
        <SelectField label="Choisir un hôtel" name="hotelId" required value={d.hotelId} error={e.hotelId} icon={loading ? <Loader2 size={13} className="animate-spin" /> : <HotelIcon size={13} />}
          onChange={(ev) => { set("hotelId", ev.target.value); set("chambreNumero", ""); }}
          options={hotels.map((h) => ({ value: h._id, label: `${h.nomHotel} — ${h.ville}` }))} hint="Liste des établissements homologués synchronisée en temps réel avec le registre national." />
        {err && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        {!loading && !err && hotels.length === 0 && <p className="mt-2 text-[11px] text-muted">Aucun établissement agréé n’est disponible pour le moment.</p>}
        {hotel && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-soft p-4">
            <div><p className="text-sm font-bold text-mali">{hotel.nomHotel} <span className="ml-1 rounded bg-emerald-100 px-1.5 text-[9px] font-semibold text-ok">Homologué{hotel.etoiles ? ` · ${hotel.etoiles}★` : ""}</span></p>
              <p className="mt-1 text-[11px] text-muted">{[hotel.adresse, hotel.ville].filter(Boolean).join(", ")}</p></div>
            <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-mali ring-1 ring-line hover:bg-soft"><RefreshCw size={12} /> Actualiser le registre</button>
          </div>
        )}
      </section>

      <section>
        <SectionTitle icon={<CalendarDays size={14} />} title="2. Période du séjour & affectation" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date d’arrivée prévue" name="dateEntree" type="date" required icon={<Calendar size={13} />} value={d.dateEntree} onChange={(ev) => set("dateEntree", ev.target.value)} error={e.dateEntree} />
          <Field label="Date de départ prévue" name="dateSortie" type="date" required icon={<Calendar size={13} />} value={d.dateSortie} onChange={(ev) => set("dateSortie", ev.target.value)} error={e.dateSortie} hint={n > 0 ? `✓ Sortie postérieure à l’arrivée (${n} nuitée${n > 1 ? "s" : ""})` : undefined} />
          {hotel && hotel.chambresDisponibles.length > 0 ? (
            <SelectField label="Numéro de chambre / suite" name="chambreNumero" required icon={<BedDouble size={13} />} value={d.chambreNumero} error={e.chambreNumero} onChange={(ev) => set("chambreNumero", ev.target.value)}
              options={hotel.chambresDisponibles.map((c) => ({ value: c.numero, label: `${c.numero} — ${c.type}` }))} hint="Chambres disponibles dans cet établissement." />
          ) : (
            <Field label="Numéro de chambre / suite" name="chambreNumero" required icon={<Hash size={13} />} placeholder="EX: 304" value={d.chambreNumero} onChange={(ev) => set("chambreNumero", ev.target.value)} error={e.chambreNumero} hint="Numéro attribué par la réception ou sélectionné à l’arrivée." />
          )}
        </div>
        <p className="mt-4 flex gap-2 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted"><Info size={14} className="mt-0.5 shrink-0 text-mali" /><span><strong className="text-mali">Règle de séjour :</strong> conformément à la réglementation des autorités compétentes, tout dépassement de la date de départ déclarée sans prolongation notifiée auprès de la réception expose l’occupant et le client à une régularisation administrative.</span></p>
      </section>

      <section>
        <SectionTitle icon={<Car size={14} />} title="3. Modalités d’acheminement & transport" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Moyen de transport employé" name="transport" required value={d.transport} error={e.transport} onChange={(ev) => set("transport", ev.target.value)} icon={<Car size={13} />} options={TRANSPORTS.map((t) => ({ value: t, label: t }))} hint="Véhicule d’entrée au sein de la zone urbaine de Bamako." />
          <Field label="Numéro de plaque d’immatriculation" tag="Facultatif si applicable" name="plaque" placeholder="EX: 1234 AB 01" value={d.plaque} onChange={(ev) => set("plaque", ev.target.value)} hint="Requis en cas de véhicule stationnant dans l’enceinte sécurisée de l’hôtel." />
        </div>
      </section>
    </div>
  );
}
