import { RESET_TOKEN_MINUTES, SUPPORT } from "@/lib/config";

export const categories = [
  { id: "voyageurs", label: "Voyageurs & Séjours", title: "Voyageurs & Séjours", sub: "Procédures d’accueil, pièces d’identité et quittance mobile" },
  { id: "hotels", label: "Établissements Hôteliers", title: "Établissements Hôteliers", sub: "Agrément, télé-transmission journalière et fonctionnement technique" },
  { id: "securite", label: "Cadre Légal, autorités & Sécurité", title: "Sécurité & Récupération de Compte", sub: "Accréditations d’accès, mots de passe et canaux d’urgence" },
] as const;

// ⚠ Réponses rédigées à partir du design et du backend : à faire valider par les autorités compétentes avant mise en ligne.
export const faqs: { cat: (typeof categories)[number]["id"]; q: string; a: string }[] = [
  { cat: "voyageurs", q: "Est-il obligatoire de remplir la fiche individuelle d’hébergement numérique ?", a: "Oui. Le Arrêté N° 2024/ML-78 impose l’enregistrement de chaque voyageur hébergé. La fiche numérique SafeStay remplace la fiche papier et peut être remplie en ligne avant l’arrivée ou à la réception de l’hôtel." },
  { cat: "voyageurs", q: "Quels documents d’identité sont acceptés pour la vérification ?", a: "Le passeport, la carte nationale d’identité (CNI) et le titre de séjour en cours de validité. L’établissement confronte toujours la pièce originale à la fiche saisie au moment de l’accueil." },
  { cat: "voyageurs", q: "Comment utiliser le Récépissé avec QR Code à la réception de l’hôtel ?", a: "Une fois la fiche validée par l’établissement, un récépissé vous est délivré. Présentez-le à la réception : il atteste que votre fiche est enregistrée et transmise." },
  { cat: "voyageurs", q: "Mes données personnelles sont-elles conservées en sécurité ?", a: "Oui. Les échanges sont chiffrés en TLS 1.3, les pièces d’identité sont protégées par chiffrement et les données sont hébergées à Bamako, conformément au cadre Loi sur les données personnelles. Chaque accès est tracé." },
  { cat: "hotels", q: "Comment inscrire et faire homologuer mon hôtel sur SafeStay Mali ?", a: "Créez un compte « Établissement hôtelier » avec votre numéro RCCM, votre adresse et votre ville. Votre compte est activé après vérification de votre RCCM sous 24 à 48 heures ; vous êtes prévenu par e-mail." },
  { cat: "hotels", q: "À quel moment et comment doit s’effectuer la télé-transmission du lot journalier ?", a: "Seules les fiches que vous avez validées sont transmises aux autorités. Le délai légal de télé-transmission est inférieur à 24 heures ; la plateforme accuse réception de chaque transmission." },
  { cat: "hotels", q: "Que faire si la connexion Internet est momentanément interrompue à Bamako ou en province ?", a: "Notez les informations des voyageurs et enregistrez-les dès le retour de la connexion, dans le délai légal. Si l’interruption se prolonge, contactez l’assistance pour documenter l’incident." },
  { cat: "hotels", q: "Quelle est la durée légale d’archivage des fiches et quittances de contrôle ?", a: `La durée de conservation est fixée par l’Arrêté N° 2024/ML-78. Consultez le texte du décret ou contactez l’assistance (${SUPPORT.email}) pour la durée applicable à votre établissement.` },
  { cat: "securite", q: "J’ai oublié mon mot de passe, combien de temps le lien de réinitialisation reste-t-il valide ?", a: `Le lien reçu par e-mail reste valide ${RESET_TOKEN_MINUTES} minutes. Passé ce délai, refaites une demande depuis la page « Mot de passe oublié ».` },
  { cat: "securite", q: "Qui contacter en cas de difficulté technique ou d’urgence opérationnelle ?", a: `Le guichet d’assistance est joignable au ${SUPPORT.phone} ou par e-mail à ${SUPPORT.email}. Vous pouvez aussi ouvrir un ticket depuis la page Contact.` },
];
