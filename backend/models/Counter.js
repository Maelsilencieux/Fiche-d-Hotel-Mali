const mongoose = require('mongoose');

// Compteur atomique (références de fiches) : évite les doublons de numéro
// quand deux fiches sont créées en même temps ou après une suppression.
const CounterSchema = new mongoose.Schema({
    _id: { type: String },   // ex. "fiche-2026"
    seq: { type: Number, default: 0 },
});

CounterSchema.statics.next = async function (key) {
    const doc = await this.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    return doc.seq;
};

module.exports = mongoose.model('Counter', CounterSchema);
