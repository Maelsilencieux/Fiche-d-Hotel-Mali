const mongoose = require('mongoose');
const Counter  = require('./Counter');
const { PIECES } = require('../config/mali');

// ============================================================
//  Modèle Fiche d'enregistrement hôtelière
//  Cycle de vie : pending → registered | refused → transmitted
// ============================================================

const FicheSchema = new mongoose.Schema({

    // --- Références ---
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true,
    },
    hotelUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // --- Identité du client ---
    nom:          { type: String, required: true, trim: true },
    prenom:       { type: String, required: true, trim: true },
    dateNaissance:{ type: Date, required: true },
    lieuNaissance:{ type: String, required: true, trim: true },
    nationalite:  { type: String, required: true, trim: true },
    flagEmoji:    { type: String, default: '🌍' },
    profession:   { type: String, trim: true },
    adresse:      { type: String, required: true, trim: true },
    ville:        { type: String, required: true, trim: true },
    bp:           { type: String, trim: true },

    // --- Voyage ---
    venantDe:  { type: String, required: true, trim: true },
    allantA:   { type: String, required: true, trim: true },
    motif:     {
        type: String,
        enum: ['Tourisme','Affaires','Conférence','Formation','Reportage','Médical','Famille','Transit','Autre'],
        required: true,
    },

    // --- Pièce d'identité ---
    numeroPiece:    { type: String, required: true, trim: true },
    typePiece:      { type: String, enum: PIECES, default: 'NINA' },
    delivreLe:      { type: Date, required: true },
    delivreA:       { type: String, required: true, trim: true },
    cnibFichier:    { type: String },  // nom du PDF de la pièce sur le serveur (champ conservé pour compatibilité)

    // --- Séjour ---
    dateEntree:   { type: Date, required: true },
    dateSortie:   { type: Date, required: true },
    chambreNumero:{ type: String, required: true, trim: true },
    transport:    { type: String, required: true, trim: true },
    plaque:       { type: String, trim: true },

    // --- Paiement ---
    modePaiement: {
        type: String,
        enum: ['cash','cheque','carte','voucher'],
        default: 'cash',
    },

    // --- Supervision territoriale (copiés depuis l'hôtel à la création) ---
    hotelRegion:  { type: String, trim: true, index: true },
    hotelCommune: { type: String, trim: true },
    international:{ type: Boolean, default: false, index: true },   // nationalité ≠ malienne

    // --- Signalement par l'administration nationale ---
    signalement: {
        actif:  { type: Boolean, default: false, index: true },
        motif:  { type: String, trim: true, maxlength: 500 },
        par:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at:     { type: Date },
    },

    // --- Lot de télé-transmission ---
    lot: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot' },

    // --- Statut & Workflow ---
    statut: {
        type: String,
        enum: ['pending', 'registered', 'refused', 'transmitted'],
        default: 'pending',
        index: true,
    },
    refusMotif: { type: String, trim: true },

    // --- Traitement hôtel ---
    traitePar:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    traiteAt:   { type: Date },

    // --- Transmission police ---
    transmisAt:       { type: Date },
    transmisReference:{ type: String },  // ref police unique

    // --- Numéro de référence SafeStay Mali (SSM-AAAA-00001) ---
    reference: { type: String, unique: true },

}, { timestamps: true });

// ===== Génération automatique de la référence (compteur atomique par année) =====
FicheSchema.pre('save', async function(next) {
    try {
        if (this.isNew && !this.reference) {
            const year = new Date().getFullYear();
            const n    = await Counter.next(`fiche-${year}`);
            this.reference = `SSM-${year}-${String(n).padStart(5, '0')}`;
        }
        next();
    } catch (err) { next(err); }
});

// ===== Index texte pour recherche =====
FicheSchema.index({ nom: 'text', prenom: 'text', numeroPiece: 'text' });
FicheSchema.index({ createdAt: -1 });
FicheSchema.index({ transmisAt: -1 });

// ===== Index unique partiel anti-doublon (protection au niveau base) =====
// Empêche deux fiches actives (pending/registered/transmitted) pour le même
// client + hôtel + dates de séjour, même en cas de double-clic simultané.
FicheSchema.index(
    { client: 1, hotel: 1, dateEntree: 1, dateSortie: 1 },
    {
        unique: true,
        partialFilterExpression: { statut: { $in: ['pending', 'registered', 'transmitted'] } },
        name: 'unique_active_fiche_per_stay',
    }
);

module.exports = mongoose.model('Fiche', FicheSchema);
