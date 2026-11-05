const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ============================================================
//  Middleware d'authentification JWT
// ============================================================

exports.protect = async (req, res, next) => {
    let token;

    // Récupérer le token depuis l'en-tête Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Non authentifié. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Utilisateur introuvable.' });
        }

        if (!req.user.isActive) {
            return res.status(403).json({ success: false, message: 'Compte désactivé.' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
    }
};

// ============================================================
//  Guards de rôle – usage : authorize('hotel', 'superadmin')
// ============================================================
exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`,
        });
    }
    next();
};

// ============================================================
//  Guard spécifique hôtel approuvé
// ============================================================
exports.hotelApproved = (req, res, next) => {
    if (req.user.role === 'hotel' && req.user.hotelStatus !== 'approved') {
        return res.status(403).json({
            success: false,
            message: 'Votre compte hôtel est en attente de validation par SafeStay.',
            hotelStatus: req.user.hotelStatus,
        });
    }
    next();
};
