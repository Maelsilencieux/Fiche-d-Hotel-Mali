/**
 * Règles de traduction FR → EN pour les textes dynamiques (avec nombres, noms, dates…).
 * Les textes fixes sont dans en.json ; ici : motifs à variables.
 * Chaque règle est appliquée dans l'ordre sur le texte français (remplacement par regex).
 */
const pl = (n: string | number) => (Number(n) === 1 ? "" : "s");

const DAYS: Record<string, string> = { lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday", vendredi: "Friday", samedi: "Saturday", dimanche: "Sunday" };
const MONTHS: Record<string, string> = { janvier: "January", février: "February", mars: "March", avril: "April", mai: "May", juin: "June", juillet: "July", août: "August", septembre: "September", octobre: "October", novembre: "November", décembre: "December" };
const MONTHS_ABBR: Record<string, string> = { "janv.": "Jan", "févr.": "Feb", mars: "Mar", "avr.": "Apr", mai: "May", juin: "Jun", "juil.": "Jul", août: "Aug", "sept.": "Sep", "oct.": "Oct", "nov.": "Nov", "déc.": "Dec" };

type Rule = [RegExp, string | ((...m: string[]) => string)];

export const RULES: Rule[] = [
  // --- Relatif / durées
  [/^Il y a (\d+) (min|h|j)$/, (_m, n, u) => `${n} ${u === "j" ? "d" : u} ago`],
  [/^Clôture de (\d+) h dépassée$/, "Cut-off of $1 h exceeded"],
  [/^Clôture à (\d+) h · il reste (.+)$/, "Cut-off at $1 h · $2 left"],
  [/^En retard \(clôture (\d+) h\)$/, "Late (cut-off $1 h)"],
  [/^scellé (\d{1,2}:\d{2})$/, "sealed $1"],
  [/^Connectée \((\d+) ms\)$/, "Connected ($1 ms)"],
  // --- Libellés avec variables
  [/^(\d+) notification\(s\)$/, "$1 notification(s)"],
  [/^Évolution sur (\d+) jours : (\d+) fiches transmises$/, "Trend over $1 days: $2 records transmitted"],
  [/^Informations complémentaires \((.+)\)$/, "Additional information ($1)"],
  [/^(\d+) hier$/, "$1 yesterday"],
  [/^(\d+) en cours$/, "$1 in progress"],
  [/^Couverture du réseau : (\d+) ?%$/, "Network coverage: $1%"],
  [/^(\d+) \/ (\d+) établissements actifs sur (\d+) j$/, "$1 / $2 active establishments over $3 d"],
  [/^Capacité : (\d+)%$/, "Capacity: $1%"],
  [/^(\d+)% du total$/, "$1% of total"],
  [/^Copier (.+)$/, "Copy $1"],
  [/^Valider (.+)$/, "Validate $1"],
  [/^Refuser (.+)$/, "Refuse $1"],
  [/^Consulter (.+)$/, "View $1"],
  [/^Télécharger la pièce de (.+)$/, "Download $1’s document"],
  [/^· traitée le (.+)$/, "· processed on $1"],
  [/^Agrément N° (.+)$/, "Licence no. $1"],
  [/^Motif : (.+)$/, "Purpose: $1"],
  [/^Vérifiez l’étape (\d+)\.?$/, "Check step $1."],
  [/^✓ Sortie postérieure à l’arrivée \((\d+) nuitées?\)$/, (_m, n) => `✓ Departure after arrival (${n} night${pl(n)})`],
  [/^Fichier trop volumineux \(max (\d+) Mo\)\.$/, "File too large (max $1 MB)."],
  [/^Archive générée — (\d+) pièce\(s\) introuvable\(s\)\.$/, "Archive generated — $1 document(s) not found."],
  [/^Transmission immédiate d’un lien sécurisé unique à signature cryptographique, valide strictement (\d+) minutes\.$/, "Immediate sending of a unique secure link with a cryptographic signature, valid for exactly $1 minutes."],
  [/^Astreinte télé-opérateurs au (.+)\.$/, "On-call tele-operators on $1."],
  [/^Le lien reçu par e-mail reste valide (\d+) minutes\. Passé ce délai, refaites une demande depuis la page « Mot de passe oublié »\.$/, "The link received by email stays valid for $1 minutes. After that, make a new request from the “Forgot password” page."],
  [/^Le guichet d’assistance est joignable au (.+) ou par e-mail à (.+)\. Vous pouvez aussi ouvrir un ticket depuis la page Contact\.$/, "The support desk can be reached on $1 or by email at $2. You can also open a ticket from the Contact page."],
  [/^La durée de conservation est fixée par l’Arrêté N° (.+)\. Consultez le texte du décret ou contactez l’assistance \((.+)\) pour la durée applicable à votre établissement\.$/, "The retention period is set by Order No. $1. See the text of the decree or contact support ($2) for the period that applies to your establishment."],
  // --- Messages d'activité / alertes du backend
  [/^(.+) · (\d+) fiche\(s\) à régulariser \(clôture (\d+) h\)$/, "$1 · $2 record(s) to regularise (cut-off $3 h)"],
  [/^(.+) · (\d+) fiche\(s\) en attente$/, "$1 · $2 record(s) pending"],
  [/^Pièce (.+?) (.{1,3}•••) enregistrée dans (\d+) établissements sur des séjours simultanés$/, "Document $1 $2 registered in $3 establishments for overlapping stays"],
  [/ · Ch\. /g, " · Rm. "],
  [/ · non conforme$/, " · non-compliant"],
  [/ · dossier d['’]accréditation$/, " · accreditation file"],
  [/^Compte voyageur · /, "Traveller account · "],
  // --- Notifications / messages du backend
  [/^Votre établissement "(.+)" a été approuvé\. Vous pouvez gérer vos chambres et fiches clients\.$/, 'Your establishment "$1" has been approved. You can manage your rooms and client records.'],
  [/^Hôtel "(.+)" approuvé\.$/, 'Hotel "$1" approved.'],
  [/^Votre demande pour "(.+)" a été refusée\. Motif : (.+)$/, 'Your request for "$1" has been refused. Reason: $2'],
  [/^Hôtel "(.+)" rejeté\.$/, 'Hotel "$1" rejected.'],
  [/^(.+) \((.+)\) attend votre homologation\.$/, "$1 ($2) is awaiting your approval."],
  [/^Votre demande a été refusée : (.+)\.$/, "Your request has been refused: $1."],
  [/^Vous avez déjà soumis une fiche \(réf\. (.+)\) pour cet hôtel et ces mêmes dates de séjour\. Statut actuel : (.+)\.$/, "You have already submitted a record (ref. $1) for this hotel and the same stay dates. Current status: $2."],
  [/^(.+) a soumis une fiche pour la chambre (.+)\.$/, "$1 submitted a record for room $2."],
  [/^Votre fiche (.+) a été transmise\. Référence : (.+)$/, "Your record $1 has been transmitted. Reference: $2"],
  [/^Votre fiche (.+) a été transmise aux autorités\. Référence : (.+)$/, "Your record $1 has been transmitted to the authorities. Reference: $2"],
  [/^(\d+) fiche\(s\) transmise\(s\)\.$/, "$1 record(s) transmitted."],
  [/^Le lot (.+) \((\d+) fiches?\) a été scellé\.$/, (_m, ref, n) => `Batch ${ref} (${n} record${pl(n)}) has been sealed.`],
  [/^La fiche est déjà : (.+)\.$/, "The record is already: $1."],
  [/^Votre fiche (.+) a été validée par l['’]hôtel et sera transmise à la police\.$/, "Your record $1 has been validated by the hotel and will be transmitted to the police."],
  [/^Votre fiche (.+) a été refusée\. Motif : (.+)$/, "Your record $1 has been refused. Reason: $2"],
  [/^Chambre (.+) existe déjà\.$/, "Room $1 already exists."],
  [/^Accès refusé\. Rôle requis : (.+)\.$/, "Access denied. Required role: $1."],
  [/^Les inscriptions de voyageurs sont temporairement fermées\.$/, "Traveller registrations are temporarily closed."],
  // --- Génériques
  [/(\d+) étoiles?\b/g, (_m, n) => `${n} star${pl(n)}`],
  // Dates en toutes lettres (« vendredi 6 novembre 2026 »)
  [new RegExp(`\\b(${Object.keys(DAYS).join("|")})\\b(?=.*\\d{4})`, "gi"), (m) => DAYS[m.toLowerCase()]],
  [new RegExp(`(\\d{1,2}) (${Object.keys(MONTHS).join("|")}) (\\d{4})`, "gi"), (_m, d, mo, y) => `${d} ${MONTHS[mo.toLowerCase()]} ${y}`],
  [/(\d{1,2}) (janv\.|févr\.|avr\.|juil\.|sept\.|oct\.|nov\.|déc\.|mars|mai|juin|août) (\d{4})/gi, (_m, d, mo, y) => `${d} ${MONTHS_ABBR[mo.toLowerCase()]} ${y}`],
  [/(\d{4}|\d{2}\/\d{2}\/\d{4}) à (\d{1,2}:\d{2})/g, "$1 at $2"],
];

/** Applique les règles ; renvoie `null` si aucune ne s'applique. */
export function applyRules(text: string): string | null {
  let out = text, changed = false;
  for (const [re, rep] of RULES) {
    const next = out.replace(re, rep as never);
    if (next !== out) { out = next; changed = true; }
  }
  return changed ? out : null;
}
