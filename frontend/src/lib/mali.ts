/** Miroir de backend/config/mali.js — gardez les deux fichiers synchronisés. */
export const REGIONS = ["District de Bamako", "Kayes", "Koulikoro", "Sikasso", "Ségou", "Mopti", "Tombouctou", "Gao", "Kidal", "Ménaka", "Taoudénit"] as const;

export const COMMUNES: Record<string, string[]> = {
  "District de Bamako": ["Commune I", "Commune II", "Commune III", "Commune IV", "Commune V", "Commune VI", "ACI 2000", "Badalabougou", "Centre-Ville", "Hippodrome", "Hamdallaye", "Cité du Niger"],
  Kayes: ["Kayes", "Diboli", "Nioro du Sahel", "Kéniéba", "Bafoulabé"],
  Koulikoro: ["Koulikoro", "Kati", "Kolokani", "Dioïla", "Kangaba", "Ouélessébougou"],
  Sikasso: ["Sikasso", "Koutiala", "Bougouni", "Kadiolo", "Yanfolila", "Yorosso"],
  Ségou: ["Ségou", "San", "Niono", "Markala", "Bla", "Macina"],
  Mopti: ["Mopti", "Sévaré", "Djenné", "Bandiagara", "Douentza"],
  Tombouctou: ["Tombouctou", "Diré", "Goundam", "Niafunké"],
  Gao: ["Gao", "Ansongo", "Bourem"],
  Kidal: ["Kidal", "Tessalit", "Abeïbara"],
  Ménaka: ["Ménaka"],
  Taoudénit: ["Taoudénit"],
};
