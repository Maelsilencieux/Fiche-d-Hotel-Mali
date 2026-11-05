const express   = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const ContactMessage = require('../models/ContactMessage');
const { sendEmail }  = require('../utils/email');

const router = express.Router();

// Anti-spam : 5 messages / heure / IP
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, message: 'Trop de messages envoyés. Réessayez plus tard.' } });

// ============================================================
//  POST /api/contact   (public)
// ============================================================
router.post('/', limiter, [
    body('nom').trim().notEmpty().withMessage('Nom requis'),
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('profil').trim().notEmpty().withMessage('Profil requis'),
    body('sujet').trim().notEmpty().withMessage('Sujet requis'),
    body('message').trim().isLength({ min: 10, max: 4000 }).withMessage('Message : 10 à 4000 caractères'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, message: 'Données invalides', errors: errors.array() });

    try {
        const { nom, email, profil, sujet, message } = req.body;
        const count = await ContactMessage.countDocuments();
        const reference = `TK-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
        await ContactMessage.create({ reference, nom, email, profil, sujet, message });

        // Notification à l'équipe (non bloquante)
        const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        sendEmail({
            to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
            subject: `[SafeStay ${reference}] ${sujet}`,
            html: `<p><b>${esc(nom)}</b> (${esc(email)}) — ${esc(profil)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
        }).catch(console.error);

        res.status(201).json({ success: true, reference, message: 'Message transmis.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
