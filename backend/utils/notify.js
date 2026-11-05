const Notification = require('../models/Notification');

// ============================================================
//  Helper centralisé pour créer une notification in-app
//  Non bloquant : les erreurs sont loguées mais ne cassent pas
//  le flux principal (validation, refus, etc.)
// ============================================================

async function notify({ user, type, title, message, fiche, link }) {
    try {
        await Notification.create({ user, type, title, message, fiche, link });
    } catch (err) {
        console.error('⚠️ Erreur création notification :', err.message);
    }
}

module.exports = { notify };
