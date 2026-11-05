const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
    reference: { type: String, unique: true },
    nom:       { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    profil:    { type: String, required: true, trim: true },
    sujet:     { type: String, required: true, trim: true },
    message:   { type: String, required: true, trim: true, maxlength: 4000 },
    statut:    { type: String, enum: ['nouveau', 'en_cours', 'traite'], default: 'nouveau' },
}, { timestamps: true });

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
