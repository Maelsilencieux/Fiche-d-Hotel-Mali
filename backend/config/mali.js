// ============================================================
//  Référentiel Mali — source unique pour les régions, communes,
//  pièces d'identité, nationalités (drapeaux) et heure de clôture.
//  ⚠ Le découpage administratif du Mali a évolué (réforme de 2023) :
//  ajustez REGIONS ci-dessous si votre autorité utilise un autre découpage.
// ============================================================

const REGIONS = [
    'District de Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou',
    'Mopti', 'Tombouctou', 'Gao', 'Kidal', 'Ménaka', 'Taoudénit',
];

// Suggestions de communes / quartiers (texte libre côté base : la liste sert d'aide à la saisie)
const COMMUNES = {
    'District de Bamako': ['Commune I', 'Commune II', 'Commune III', 'Commune IV', 'Commune V', 'Commune VI', 'ACI 2000', 'Badalabougou', 'Centre-Ville', 'Hippodrome', 'Hamdallaye', 'Cité du Niger'],
    'Kayes':      ['Kayes', 'Diboli', 'Nioro du Sahel', 'Kéniéba', 'Bafoulabé'],
    'Koulikoro':  ['Koulikoro', 'Kati', 'Kolokani', 'Dioïla', 'Kangaba', 'Ouélessébougou'],
    'Sikasso':    ['Sikasso', 'Koutiala', 'Bougouni', 'Kadiolo', 'Yanfolila', 'Yorosso'],
    'Ségou':      ['Ségou', 'San', 'Niono', 'Markala', 'Bla', 'Macina'],
    'Mopti':      ['Mopti', 'Sévaré', 'Djenné', 'Bandiagara', 'Douentza'],
    'Tombouctou': ['Tombouctou', 'Diré', 'Goundam', 'Niafunké'],
    'Gao':        ['Gao', 'Ansongo', 'Bourem'],
    'Kidal':      ['Kidal', 'Tessalit', 'Abeïbara'],
    'Ménaka':     ['Ménaka'],
    'Taoudénit':  ['Taoudénit'],
};

const PIECES = ['NINA', 'CNI', 'Passeport', 'Carte consulaire', 'Titre de séjour', 'Autre'];

// Heure de clôture de la télé-transmission journalière (Mali = GMT, pas de changement d'heure)
const DEADLINE_HOUR = parseInt(process.env.TRANSMISSION_DEADLINE_HOUR || '23', 10);

// ---------- Drapeaux (nationalité → emoji) ----------
const norm = (s = '') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\(.*?\)/g, '').trim();

const FLAG_TABLE = {
    '🇲🇱': ['malien', 'malienne', 'mali'],
    '🇧🇫': ['burkinabe', 'burkina faso'],
    '🇸🇳': ['senegalais', 'senegalaise', 'senegal'],
    '🇬🇳': ['guineen', 'guineenne', 'guinee'],
    '🇨🇮': ['ivoirien', 'ivoirienne', 'cote d\'ivoire'],
    '🇲🇷': ['mauritanien', 'mauritanienne', 'mauritanie'],
    '🇳🇪': ['nigerien', 'nigerienne', 'niger'],
    '🇩🇿': ['algerien', 'algerienne', 'algerie'],
    '🇲🇦': ['marocain', 'marocaine', 'maroc'],
    '🇹🇳': ['tunisien', 'tunisienne'],
    '🇱🇾': ['libyen', 'libyenne'],
    '🇹🇬': ['togolais', 'togolaise'],
    '🇧🇯': ['beninois', 'beninoise'],
    '🇬🇭': ['ghaneen', 'ghaneenne'],
    '🇳🇬': ['nigerian', 'nigeriane'],
    '🇬🇲': ['gambien', 'gambienne'],
    '🇨🇲': ['camerounais', 'camerounaise'],
    '🇹🇩': ['tchadien', 'tchadienne'],
    '🇨🇬': ['congolais', 'congolaise'],
    '🇨🇩': ['congolais rdc', 'congolaise rdc'],
    '🇫🇷': ['francais', 'francaise'],
    '🇺🇸': ['americain', 'americaine'],
    '🇬🇧': ['britannique'],
    '🇩🇪': ['allemand', 'allemande'],
    '🇧🇪': ['belge'],
    '🇨🇭': ['suisse'],
    '🇮🇹': ['italien', 'italienne'],
    '🇪🇸': ['espagnol', 'espagnole'],
    '🇨🇦': ['canadien', 'canadienne'],
    '🇨🇳': ['chinois', 'chinoise'],
    '🇹🇷': ['turc', 'turque'],
    '🇱🇧': ['libanais', 'libanaise'],
    '🇷🇺': ['russe'],
    '🇮🇳': ['indien', 'indienne'],
    '🇯🇵': ['japonais', 'japonaise'],
};
const FLAG_INDEX = {};
Object.entries(FLAG_TABLE).forEach(([flag, names]) => names.forEach((n) => { FLAG_INDEX[n] = flag; }));

const flagFor = (nationalite) => {
    const raw = String(nationalite || '');
    // « Congolaise (RDC) » doit se distinguer de « Congolaise (Congo) »
    if (/congolais/i.test(raw) && /rdc/i.test(raw)) return '🇨🇩';
    return FLAG_INDEX[norm(raw)] || '🌍';
};

const isMalian = (nationalite) => ['malien', 'malienne', 'mali'].includes(norm(nationalite));

module.exports = { REGIONS, COMMUNES, PIECES, DEADLINE_HOUR, flagFor, isMalian };
