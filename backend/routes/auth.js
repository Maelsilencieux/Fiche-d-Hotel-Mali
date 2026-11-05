const express   = require('express');
const { REGIONS } = require('../config/mali');
const router    = express.Router();
const { body, validationResult } = require('express-validator');
const crypto    = require('crypto');

const User      = require('../models/User');
const Hotel     = require('../models/Hotel');
const { sendToken } = require('../utils/jwt');
const { protect }   = require('../middleware/auth');
const email         = require('../utils/email');

// ============================================================
//  Helpers
// ============================================================
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
};

// ============================================================
//  POST /api/auth/register/client
//  Inscription d'un client
// ============================================================
router.post('/register/client', [
    body('nom').notEmpty().withMessage('Nom requis').trim(),
    body('prenom').notEmpty().withMessage('Prénom requis').trim(),
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Minimum 8 caractères'),
], validate, async (req, res) => {
    try {
        const { nom, prenom, email: mail, password, telephone } = req.body;

        const exists = await User.findOne({ email: mail });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé.' });
        }

        const user = await User.create({
            role: 'client',
            nom, prenom,
            email: mail,
            password,
            telephone: telephone || '',
            isActive: true,
            isVerified: true,  // simplifié ; activer email vérification si besoin
        });

        // Email de bienvenue (non bloquant)
        email.sendWelcomeClient(user).catch(console.error);

        sendToken(user, 201, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// ============================================================
//  POST /api/auth/register/hotel
//  Inscription d'un hôtel (compte en attente de validation)
// ============================================================
router.post('/register/hotel', [
    body('nomHotel').notEmpty().withMessage('Nom de l\'hôtel requis').trim(),
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Minimum 8 caractères'),
    body('rccm').notEmpty().withMessage('RCCM requis').trim(),
    body('adresseHotel').notEmpty().withMessage('Adresse requise').trim(),
    body('villeHotel').notEmpty().withMessage('Ville requise').trim(),
    body('regionHotel').optional({ values: 'falsy' }).isIn(REGIONS).withMessage('Région invalide'),
    body('communeHotel').optional({ values: 'falsy' }).trim(),
], validate, async (req, res) => {
    try {
        const {
            nomHotel, email: mail, password, rccm,
            adresseHotel, villeHotel, telephone,
            regionHotel, communeHotel,
        } = req.body;

        const exists = await User.findOne({ email: mail });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé.' });
        }

        // Créer le compte utilisateur hôtel (non actif avant approbation)
        const user = await User.create({
            role: 'hotel',
            nomHotel, rccm,
            adresseHotel, villeHotel,
            regionHotel: regionHotel || (/bamako/i.test(villeHotel) ? 'District de Bamako' : ''),
            communeHotel: communeHotel || '',
            email: mail, password,
            telephone: telephone || '',
            hotelStatus: 'pending',
            isActive: false,  // bloqué jusqu'à approbation superadmin
            isVerified: false,
        });

        // Créer le profil Hotel associé
        await Hotel.create({
            user: user._id,
            nomHotel,
            adresse: adresseHotel,
            ville: villeHotel,
            region:  regionHotel || (/bamako/i.test(villeHotel) ? 'District de Bamako' : ''),
            commune: communeHotel || '',
            telephone: telephone || '',
            email: mail,
            chambres: [],
        });

        // Email de confirmation de réception
        email.sendHotelPending(user).catch(console.error);

        res.status(201).json({
            success: true,
            message: 'Demande enregistrée. Votre compte sera activé après vérification de votre RCCM sous 24–48h.',
            hotelStatus: 'pending',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// ============================================================
//  POST /api/auth/login
//  Connexion universelle (client + hotel + superadmin)
// ============================================================
router.post('/login', [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').notEmpty().withMessage('Mot de passe requis'),
], validate, async (req, res) => {
    try {
        const { email: mail, password } = req.body;

        const user = await User.findOne({ email: mail }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
        }

        const match = await user.matchPassword(password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
        }

        // Hôtel en attente ou refusé
        if (user.role === 'hotel' && user.hotelStatus === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Votre compte hôtel est en attente de validation par SafeStay.',
                hotelStatus: 'pending',
            });
        }
        if (user.role === 'hotel' && user.hotelStatus === 'rejected') {
            return res.status(403).json({
                success: false,
                message: `Votre demande a été refusée : ${user.hotelRejectedReason || 'documents non conformes'}.`,
                hotelStatus: 'rejected',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Compte désactivé. Contactez le support.' });
        }

        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });
        sendToken(user, 200, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
//  GET /api/auth/me  — Profil utilisateur connecté
// ============================================================
router.get('/me', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.toSafe() });
});

// ============================================================
//  POST /api/auth/logout
// ============================================================
router.post('/logout', (req, res) => {
    res.cookie('ss_token', '', { httpOnly: true, expires: new Date(0) });
    res.json({ success: true, message: 'Déconnecté.' });
});

// ============================================================
//  POST /api/auth/forgot-password
//  Demande de réinitialisation — génère un token et envoie l'email
// ============================================================
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
], validate, async (req, res) => {
    try {
        const { email: mail } = req.body;

        const user = await User.findOne({ email: mail });

        // Réponse identique que l'email existe ou non (anti-énumération de comptes)
        const genericMsg = 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.';

        if (!user) {
            return res.json({ success: true, message: genericMsg });
        }

        // Générer un token aléatoire sécurisé
        const rawToken    = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetToken       = hashedToken;
        user.resetTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save({ validateBeforeSave: false });

        // Lien envoyé au client (page Next.js /reinitialiser-mot-de-passe)
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reinitialiser-mot-de-passe?token=${rawToken}&email=${encodeURIComponent(mail)}`;

        email.sendPasswordReset(user, resetUrl).catch(console.error);

        res.json({ success: true, message: genericMsg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
//  GET /api/auth/verify-reset-token
//  Vérifie qu'un token de reset est valide avant d'afficher le formulaire
// ============================================================
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token, email: mail } = req.query;
        if (!token || !mail) {
            return res.status(400).json({ success: false, message: 'Lien invalide.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email: mail,
            resetToken: hashedToken,
            resetTokenExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Lien invalide ou expiré.' });
        }

        res.json({ success: true, message: 'Token valide.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
//  POST /api/auth/reset-password
//  Définit le nouveau mot de passe avec le token reçu par email
// ============================================================
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token requis'),
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Minimum 8 caractères'),
], validate, async (req, res) => {
    try {
        const { token, email: mail, password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email: mail,
            resetToken: hashedToken,
            resetTokenExpire: { $gt: Date.now() },
        }).select('+password');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Lien invalide ou expiré. Refaites une demande.' });
        }

        // Définir le nouveau mot de passe (le hook pre-save le hache automatiquement)
        user.password         = password;
        user.resetToken       = undefined;
        user.resetTokenExpire = undefined;
        await user.save();

        // Email de confirmation (non bloquant)
        email.sendPasswordChanged(user).catch(console.error);

        // Connecter directement l'utilisateur après reset
        sendToken(user, 200, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
//  PUT /api/auth/change-password   (utilisateur connecté)
//  Body : { currentPassword, newPassword }
//  À coller dans routes/auth.js, avant `module.exports = router;`
//  (nécessite `passwordChangedAt: Date` dans models/User.js)
// ============================================================
router.put('/change-password', protect, [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 8 }).withMessage('Minimum 8 caractères'),
], validate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('+password');
        if (!(await user.matchPassword(req.body.currentPassword))) {
            return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect.' });
        }
        if (req.body.currentPassword === req.body.newPassword) {
            return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit être différent de l’ancien.' });
        }
        user.password = req.body.newPassword;      // haché par le hook pre-save
        user.passwordChangedAt = new Date();
        await user.save();

        email.sendPasswordChanged(user).catch(console.error);
        sendToken(user, 200, res);                 // renvoie un nouveau token
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
//  PUT /api/auth/profile   (utilisateur connecté)
//  Met à jour nom, prénom, téléphone (l'e-mail et le rôle ne changent pas ici)
// ============================================================
router.put('/profile', protect, [
    body('nom').optional().trim().notEmpty().withMessage('Nom invalide'),
    body('prenom').optional().trim().notEmpty().withMessage('Prénom invalide'),
    body('telephone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Téléphone invalide'),
], validate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        ['nom', 'prenom', 'telephone'].forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
        await user.save();
        res.json({ success: true, user: user.toSafe() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;
