const h = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** CSV « ; » avec BOM UTF-8 (s'ouvre directement dans Excel). */
export function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Rapport imprimable (Imprimer → Enregistrer en PDF). */
export function printTable(title: string, head: string[], rows: (string | number)[][]) {
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${h(title)}</title><style>body{font:11px system-ui,sans-serif;margin:28px;color:#1C1B16}h1{font-size:17px;margin:0}p{margin:4px 0 14px;color:#6B685B}table{width:100%;border-collapse:collapse}th{background:#0A6B3B;color:#fff;text-align:left;padding:7px;font-size:10px}td{padding:6px 7px;border-bottom:1px solid #E6DFC9}</style></head><body>
<h1>SafeStay Mali — ${h(title)}</h1><p>Édité le ${new Date().toLocaleString("fr-FR")} · ${rows.length} ligne(s) · Arrêté N° 2024/ML-78</p>
<table><thead><tr>${head.map((c) => `<th>${h(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${h(c)}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${head.length}">Aucune donnée.</td></tr>`}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export const regId = (id: string, iso: string) => `USR-${new Date(iso).getFullYear()}-${id.slice(-4).toUpperCase()}`;
