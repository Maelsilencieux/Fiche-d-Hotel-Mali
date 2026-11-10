require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const mongoose    = require('mongoose');

// Échec immédiat si les secrets indispensables manquent (évite des tokens signés avec « undefined »)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('❌ JWT_SECRET manquant ou trop court (16 caractères minimum). Copiez .env.example en .env.');
    process.exit(1);
}

const connectDB   = require('./config/db');
const User        = require('./models/User');

// ===== Routes =====
const authRoutes   = require('./routes/auth');
const hotelRoutes  = require('./routes/hotels');
const ficheRoutes  = require('./routes/fiches');
const adminRoutes  = require('./routes/admin');
const notifRoutes  = require('./routes/notifications');
const contactRoutes = require('./routes/contact');

// ===== Init =====
const app = express();
connectDB();

// ============================================================
//  SÉCURITÉ
// ============================================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // pour servir les PDFs
}));

// Rate limiting global
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 600,   // l'interface (SPA) enchaîne plusieurs appels par page
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
}));

// Rate limiting strict sur l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,   // seuls les échecs comptent (anti brute-force)
    message: { success: false, message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

// ============================================================
//  MIDDLEWARES
// ============================================================
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠ Les PDF d'identité ne sont PLUS servis en statique : ils sont accessibles uniquement
//   via GET /api/fiches/:id/piece (alias /cnib) (authentifié : hôtel concerné ou superadmin).

// ============================================================
//  ROUTES
// ============================================================
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/fiches', ficheRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/contact', contactRoutes);

// ============================================================
//  Health check
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'SafeStay Mali API opérationnelle',
        timestamp: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// ============================================================
//  404 handler
// ============================================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route introuvable : ${req.originalUrl}` });
});

// ============================================================
//  Error handler global
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Erreur non gérée :', err);

    // Multer : fichier trop grand
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: `Fichier trop volumineux (max ${process.env.MAX_FILE_SIZE_MB || 5} MB).` });
    }
    // Multer : mauvais type
    if (err.message === 'Seuls les fichiers PDF sont acceptés.') {
        return res.status(400).json({ success: false, message: err.message });
    }
    // Mongoose : doublon unique
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ success: false, message: `Ce ${field} est déjà utilisé.` });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Erreur serveur interne.',
    });
});

// ============================================================
//  Création automatique du SuperAdmin au démarrage
// ============================================================
const createSuperAdmin = async () => {
    try {
        if (process.env.NODE_ENV === 'production' && (!process.env.SUPERADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD === 'SuperAdmin2026!')) {
            console.warn('⚠️  SUPERADMIN_PASSWORD par défaut en production : changez-le immédiatement.');
        }
        const exists = await User.findOne({ role: 'superadmin' });
        if (!exists) {
            await User.create({
                role:       'superadmin',
                nom:        'Administrateur',
                prenom:     'National',
                email:      process.env.SUPERADMIN_EMAIL || 'superadmin@safestay.ml',
                password:   process.env.SUPERADMIN_PASSWORD || 'SuperAdmin2026!',
                isActive:   true,
                isVerified: true,
            });
            console.log('👑 SuperAdmin créé automatiquement.');
        }
    } catch (err) {
        console.error('Erreur création superadmin :', err.message);
    }
};

// ============================================================
//  Démarrage du serveur
// ============================================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
    console.log(`\n🚀 SafeStay Mali API démarrée sur le port ${PORT}`);
    console.log(`   Mode    : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   MongoDB : ${process.env.MONGO_URI || 'non configuré'}`);
    await createSuperAdmin();
    console.log(`\n📋 Routes disponibles :`);
    console.log(`   POST   /api/auth/register/client`);
    console.log(`   POST   /api/auth/register/hotel`);
    console.log(`   POST   /api/auth/login`);
    console.log(`   GET    /api/auth/me`);
    console.log(`   POST   /api/auth/forgot-password`);
    console.log(`   GET    /api/auth/verify-reset-token`);
    console.log(`   POST   /api/auth/reset-password`);
    console.log(`   GET    /api/hotels              (liste hôtels approuvés)`);
    console.log(`   GET    /api/hotels/:id/chambres  (chambres disponibles)`);
    console.log(`   POST   /api/fiches              (soumettre fiche - client)`);
    console.log(`   GET    /api/fiches/mes-fiches   (fiches du client)`);
    console.log(`   GET    /api/fiches/hotel        (fiches de l'hôtel)`);
    console.log(`   PATCH  /api/fiches/:id/valider`);
    console.log(`   PATCH  /api/fiches/:id/refuser`);
    console.log(`   PATCH  /api/fiches/:id/transmettre-police`);
    console.log(`   GET    /api/admin/stats         (superadmin)`);
    console.log(`   GET    /api/admin/hotels        (superadmin)`);
    console.log(`   PATCH  /api/admin/hotels/:id/approuver`);
    console.log(`   PATCH  /api/admin/hotels/:id/rejeter`);
    console.log(`   PUT    /api/auth/change-password`);
    console.log(`   POST   /api/contact             (public)`);
    console.log(`   GET    /api/admin/overview | activity | trend | health | messages`);
    console.log(`   GET    /api/admin/jour | lots | regions | anomalies | rapport-consolide   (supervision Mali)`);
    console.log(`   GET    /api/fiches/lots/aujourdhui          (hôtel : situation de clôture)`);
    console.log(`   PATCH  /api/fiches/transmettre-lot          (hôtel : transmettre toutes les fiches validées)`);
    console.log(`   PATCH  /api/fiches/lots/aujourdhui/sceller  (hôtel : sceller le lot du jour)`);
    console.log(`   GET    /api/notifications`);
    console.log(`   GET    /api/notifications/unread-count`);
    console.log(`   PATCH  /api/notifications/:id/read`);
    console.log(`   PATCH  /api/notifications/read-all`);
    console.log(`   GET    /api/health\n`);
});

// Gestion propre des erreurs non capturées
process.on('unhandledRejection', (err) => {
    console.error('❌ UnhandledRejection :', err.message);
    server.close(() => process.exit(1));
});

module.exports = app;
