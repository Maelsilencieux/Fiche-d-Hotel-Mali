const mongoose = require('mongoose');

// ============================================================
//  Lot de télé-transmission journalier
//  Un hôtel regroupe les fiches transmises dans la journée ; il « scelle »
//  le lot avant l'heure de clôture. Le sceau est une empreinte SHA-256
//  calculée sur le contenu : toute modification ultérieure est détectable.
// ============================================================
const LotSchema = new mongoose.Schema({
    hotel:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    hotelUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date:      { type: String, required: true, index: true },        // AAAA-MM-JJ (heure du Mali = UTC)
    rang:      { type: Number, default: 1 },                          // plusieurs lots possibles par jour
    fiches:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fiche' }],
    count:     { type: Number, default: 0 },
    statut:    { type: String, enum: ['en_cours', 'scelle'], default: 'en_cours', index: true },
    scelleAt:  { type: Date },
    scellePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    empreinte: { type: String },                                      // SHA-256 hexadécimal
    reference: { type: String, unique: true, sparse: true },          // LOT-AAAAMMJJ-xxxx
}, { timestamps: true });

LotSchema.index({ hotel: 1, date: 1, rang: 1 }, { unique: true });

module.exports = mongoose.model('Lot', LotSchema);
