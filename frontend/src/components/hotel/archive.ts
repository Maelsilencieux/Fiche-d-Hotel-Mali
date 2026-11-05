import { apiBlob } from "@/lib/api";
import type { Fiche } from "@/lib/types";
import { csvText } from "./exports";

/** Télécharge une pièce d'identité PDF protégée. */
export async function downloadPiece(f: Fiche) {
  const b = await apiBlob(`/fiches/${f._id}/piece`);
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `${f.reference}_${f.nom}_${f.prenom}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Archive ZIP : toutes les pièces PDF des fiches fournies + inventaire CSV. */
export async function buildArchive(rows: Fiche[], name: string, onProgress: (done: number, total: number) => void) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip(); let missing = 0;
  for (let i = 0; i < rows.length; i++) {
    onProgress(i, rows.length);
    try { zip.file(`pieces/${rows[i].reference}_${rows[i].nom}_${rows[i].prenom}.pdf`, await apiBlob(`/fiches/${rows[i]._id}/piece`)); } catch { missing++; }
  }
  zip.file("inventaire.csv", csvText(rows));
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `archive-${name}.zip`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  onProgress(rows.length, rows.length);
  return missing;
}
