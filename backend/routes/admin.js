const express = require('express');
const router  = express.Router();

const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const User    = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const Hotel   = require('../models/Hotel');
const Fiche   = require('../models/Fiche');
const Lot     = require('../models/Lot');
const { REGIONS, DEADLINE_HOUR } = require('../config/mali');
const { protect, authorize } = require('../middleware/auth');
const emailSvc = require('../utils/email');
const { notify } = require('../utils/notify');

// Toutes les routes admin nécessitent d'être superadmin
router.use(protect, authorize('superadmin'));

// ============================================================
//  GET /api/admin/stats
//  Statistiques globales de la plateforme
// ============================================================
router.get('/stats', async (req, res) => {
    try {
        const [
            totalClients,
            totalHotels,
            hotelsPending,
            hotelsApproved,
            totalFiches,
            fichesPending,
            fichesRegistered,
            fichesTransmitted,
        ] = await Promise.all([
            User.countDocuments({ role: 'client' }),
            User.countDocuments({ role: 'hotel' }),
            User.countDocuments({ role: 'hotel', hotelStatus: 'pending' }),
            User.countDocuments({ role: 'hotel', hotelStatus: 'approved' }),
            Fiche.countDocuments(),
            Fiche.countDocuments({ statut: 'pending' }),
            Fiche.countDocuments({ statut: 'registered' }),
            Fiche.countDocuments({ statut: 'transmitted' }),
        ]);

        res.json({
            success: true,
            stats: {
                totalClients, totalHotels,
                hotelsPending, hotelsApproved,
                totalFiches, fichesPending,
                fichesRegistered, fichesTransmitted,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/hotels
//  Liste tous les hôtels (approuvés + en attente + refusés)
// ============================================================
router.get('/hotels', async (req, res) => {
    try {
        const { statut, q } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const filter = { role: 'hotel' };
        if (statut) filter.hotelStatus = statut;
        if (q) { const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); filter.$or = [{ nomHotel: rx }, { email: rx }, { rccm: rx }]; }

        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort('-createdAt').limit(limit),
            User.countDocuments(filter),
        ]);
        const profiles = await Hotel.find({ user: { $in: users.map(u => u._id) } }).select('user etoiles ville region commune adresse totalChambres chambresOccupees');
        const byUser = Object.fromEntries(profiles.map(p => [String(p.user), p]));
        const hotels = users.map(u => ({ ...u.toObject(), profile: byUser[String(u._id)] || null }));

        res.json({ success: true, count: hotels.length, total, hotels });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/admin/hotels/:userId/approuver
//  Approuver un compte hôtel
// ============================================================
router.patch('/hotels/:userId/approuver', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId, role: 'hotel' });
        if (!user) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });

        if (user.hotelStatus === 'approved') {
            return res.status(400).json({ success: false, message: 'Cet hôtel est déjà approuvé.' });
        }

        user.hotelStatus = 'approved';
        user.isActive    = true;
        user.isVerified  = true;
        user.approvedAt  = new Date();
        user.approvedBy  = req.user._id;
        await user.save();

        // Email de confirmation
        emailSvc.sendHotelApproved(user).catch(console.error);

        // Notification in-app pour l'hôtel
        notify({
            user:    user._id,
            type:    'hotel_approved',
            title:   '✅ Compte hôtel approuvé',
            message: `Votre établissement "${user.nomHotel}" a été approuvé. Vous pouvez gérer vos chambres et fiches clients.`,
            link:    '/hotel',
        }).catch(console.error);

        res.json({ success: true, message: `Hôtel "${user.nomHotel}" approuvé.`, user: user.toSafe() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/admin/hotels/:userId/rejeter
//  Rejeter un compte hôtel
// ============================================================
router.patch('/hotels/:userId/rejeter', async (req, res) => {
    try {
        const { raison } = req.body;
        const user = await User.findOne({ _id: req.params.userId, role: 'hotel' });
        if (!user) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });

        user.hotelStatus         = 'rejected';
        user.isActive            = false;
        user.hotelRejectedReason = raison || 'Documents non conformes';
        await user.save();

        emailSvc.sendHotelRejected(user, user.hotelRejectedReason).catch(console.error);

        // Notification in-app pour l'hôtel
        notify({
            user:    user._id,
            type:    'hotel_rejected',
            title:   '❌ Demande hôtel refusée',
            message: `Votre demande pour "${user.nomHotel}" a été refusée. Motif : ${user.hotelRejectedReason}`,
        }).catch(console.error);

        res.json({ success: true, message: `Hôtel "${user.nomHotel}" rejeté.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/clients
//  Liste des clients
// ============================================================
router.get('/clients', async (req, res) => {
    try {
        const clients = await User.find({ role: 'client' })
            .select('-password')
            .sort('-createdAt');
        res.json({ success: true, count: clients.length, clients });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  DELETE /api/admin/users/:userId
//  Désactiver un compte (soft delete)
// ============================================================
router.delete('/users/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        if (user.role === 'superadmin') return res.status(400).json({ success: false, message: 'Impossible de supprimer un superadmin.' });

        user.isActive = false;
        await user.save();
        res.json({ success: true, message: 'Compte désactivé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/overview
//  Chiffres clés du tableau de bord superadmin
// ============================================================
router.get('/overview', async (req, res) => {
    try {
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const [hTotal, hActifs, hPending, hRejected, hNew, uTotal, uClients, uVerified,
               fTotal, fPending, fRegistered, fTransmitted, fRefused, msgNew] = await Promise.all([
            User.countDocuments({ role: 'hotel' }),
            User.countDocuments({ role: 'hotel', hotelStatus: 'approved', isActive: true }),
            User.countDocuments({ role: 'hotel', hotelStatus: 'pending' }),
            User.countDocuments({ role: 'hotel', hotelStatus: 'rejected' }),
            User.countDocuments({ role: 'hotel', createdAt: { $gte: monthStart } }),
            User.countDocuments(),
            User.countDocuments({ role: 'client' }),
            User.countDocuments({ isVerified: true }),
            Fiche.countDocuments(),
            Fiche.countDocuments({ statut: 'pending' }),
            Fiche.countDocuments({ statut: 'registered' }),
            Fiche.countDocuments({ statut: 'transmitted' }),
            Fiche.countDocuments({ statut: 'refused' }),
            ContactMessage.countDocuments({ statut: 'nouveau' }),
        ]);
        const pct = (n) => (fTotal ? Math.round((n / fTotal) * 1000) / 10 : 0);
        res.json({
            success: true,
            hotels: { total: hTotal, actifs: hActifs, pending: hPending, rejected: hRejected, nouveauxCeMois: hNew },
            users:  { total: uTotal, clients: uClients, hotels: hTotal, certifiesPct: uTotal ? Math.round((uVerified / uTotal) * 1000) / 10 : 0 },
            fiches: { total: fTotal, pending: fPending, registered: fRegistered, transmitted: fTransmitted, refused: fRefused,
                      pct: { pending: pct(fPending), registered: pct(fRegistered), transmitted: pct(fTransmitted), refused: pct(fRefused) } },
            messagesNouveaux: msgNew,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/activity?limit=8
//  Fil d'audit : fiches créées / transmises / refusées, inscriptions
// ============================================================
router.get('/activity', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 8, 50);
        const [created, transmitted, refused, users] = await Promise.all([
            Fiche.find().sort('-createdAt').limit(limit).populate('hotel', 'nomHotel').select('reference createdAt hotel chambreNumero typePiece nationalite'),
            Fiche.find({ statut: 'transmitted' }).sort('-transmisAt').limit(limit).populate('hotel', 'nomHotel').select('reference transmisAt hotel'),
            Fiche.find({ statut: 'refused' }).sort('-traiteAt').limit(limit).populate('hotel', 'nomHotel').select('reference traiteAt refusMotif hotel'),
            User.find({ role: { $in: ['client', 'hotel'] } }).sort('-createdAt').limit(limit).select('role nomHotel email createdAt'),
        ]);
        const events = [
            ...created.map(f => ({ type: 'fiche_created', title: 'Nouvelle fiche voyageur', detail: `${f.hotel?.nomHotel ?? 'Hôtel'} · Ch. ${f.chambreNumero} (${f.typePiece})`, at: f.createdAt, ref: f.reference })),
            ...transmitted.map(f => ({ type: 'fiche_transmitted', title: 'Fiche télé-transmise aux autorités', detail: `${f.hotel?.nomHotel ?? 'Hôtel'} · ${f.reference}`, at: f.transmisAt, ref: f.reference })),
            ...refused.map(f => ({ type: 'fiche_refused', title: 'Fiche refusée par l\'établissement', detail: `${f.hotel?.nomHotel ?? 'Hôtel'} · ${f.refusMotif || 'non conforme'}`, at: f.traiteAt, ref: f.reference, alert: true })),
            ...users.map(u => u.role === 'hotel'
                ? { type: 'hotel_request', title: 'Demande d\'inscription reçue', detail: `${u.nomHotel} · dossier d'accréditation`, at: u.createdAt }
                : { type: 'user_created', title: 'Nouvel utilisateur créé', detail: `Compte voyageur · ${u.email}`, at: u.createdAt }),
        ].filter(e => e.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit);
        res.json({ success: true, events });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/trend?days=14
//  Fiches créées / transmises par jour + taux de transmission < 24 h
// ============================================================
router.get('/trend', async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days) || 14, 90);
        const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (days - 1));
        const day = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field } });
        const [c, t, recent] = await Promise.all([
            Fiche.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: day('$createdAt'), n: { $sum: 1 } } }]),
            Fiche.aggregate([{ $match: { transmisAt: { $gte: since } } }, { $group: { _id: day('$transmisAt'), n: { $sum: 1 } } }]),
            Fiche.find({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }, statut: { $in: ['registered', 'transmitted'] } }).select('createdAt transmisAt statut'),
        ]);
        const cm = Object.fromEntries(c.map(x => [x._id, x.n])), tm = Object.fromEntries(t.map(x => [x._id, x.n]));
        const series = Array.from({ length: days }, (_, i) => {
            const d = new Date(since); d.setDate(since.getDate() + i);
            const k = d.toISOString().slice(0, 10);
            return { date: k, created: cm[k] || 0, transmitted: tm[k] || 0 };
        });
        const onTime = recent.filter(f => f.transmisAt && (f.transmisAt - f.createdAt) <= 86400000).length;
        res.json({ success: true, series, conformite: { rate: recent.length ? Math.round((onTime / recent.length) * 1000) / 10 : null, windowDays: 30, sample: recent.length } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/health
//  État réel des services (base de données, e-mail, uptime)
// ============================================================
router.get('/health', async (req, res) => {
    let latencyMs = null, dbOk = false;
    try { const t0 = Date.now(); await mongoose.connection.db.admin().ping(); latencyMs = Date.now() - t0; dbOk = true; } catch (_) {}
    res.json({
        success: true,
        db: { ok: dbOk, latencyMs },
        email: { configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS) },
        uptimeSeconds: Math.round(process.uptime()),
        env: process.env.NODE_ENV || 'development',
        time: new Date().toISOString(),
    });
});

// ============================================================
//  Messages du formulaire de contact
// ============================================================
router.get('/messages', async (req, res) => {
    try {
        const filter = req.query.statut ? { statut: req.query.statut } : {};
        const messages = await ContactMessage.find(filter).sort('-createdAt').limit(Math.min(parseInt(req.query.limit) || 50, 200));
        res.json({ success: true, count: messages.length, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch('/messages/:id', async (req, res) => {
    try {
        if (!['nouveau', 'en_cours', 'traite'].includes(req.body.statut)) return res.status(400).json({ success: false, message: 'Statut invalide.' });
        const m = await ContactMessage.findByIdAndUpdate(req.params.id, { statut: req.body.statut }, { new: true });
        if (!m) return res.status(404).json({ success: false, message: 'Message introuvable.' });
        res.json({ success: true, message: m });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  Helpers
// ============================================================
const esc = (v) => new RegExp(String(v).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
const uploadsDir = () => path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', 'cnib');
const filesOnDisk = () => { try { return new Set(fs.readdirSync(uploadsDir())); } catch (_) { return new Set(); } };

// ============================================================
//  GET /api/admin/users?page&limit&q&type&statut
//  type : client | hotel | superadmin     statut : active | inactive | pending
// ============================================================
router.get('/users', async (req, res) => {
    try {
        const page  = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 200);
        const { q, type, statut } = req.query;
        const and = [];
        if (type)  and.push({ role: type });
        if (q)     { const rx = esc(q); and.push({ $or: [{ nom: rx }, { prenom: rx }, { email: rx }, { telephone: rx }, { nomHotel: rx }] }); }
        const pendingHotel = { role: 'hotel', hotelStatus: 'pending' };
        if (statut === 'pending')  and.push(pendingHotel);
        if (statut === 'active')   and.push({ isActive: true });
        if (statut === 'inactive') and.push({ isActive: false, $nor: [pendingHotel] });
        const filter = and.length ? { $and: and } : {};

        const [users, total, tAll, tClients, tHotels, tAdmins, tInactive, tPending] = await Promise.all([
            User.find(filter).select('-password').sort('-createdAt').skip((page - 1) * limit).limit(limit),
            User.countDocuments(filter),
            User.countDocuments(), User.countDocuments({ role: 'client' }), User.countDocuments({ role: 'hotel' }), User.countDocuments({ role: 'superadmin' }),
            User.countDocuments({ isActive: false, $nor: [pendingHotel] }), User.countDocuments(pendingHotel),
        ]);
        res.json({ success: true, total, page, pages: Math.max(1, Math.ceil(total / limit)), users,
            stats: { total: tAll, clients: tClients, hotels: tHotels, admins: tAdmins, desactives: tInactive, enAttente: tPending, actifs: tAll - tInactive - tPending } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/users/:id  — détail + rattachement hôtel + volumes de fiches
// ============================================================
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        let hotel = null, fiches = 0, transmitted = 0;
        if (user.role === 'hotel') {
            hotel = await Hotel.findOne({ user: user._id }).select('nomHotel etoiles adresse ville region commune telephone email');
            if (hotel) [fiches, transmitted] = await Promise.all([Fiche.countDocuments({ hotel: hotel._id }), Fiche.countDocuments({ hotel: hotel._id, statut: 'transmitted' })]);
        } else if (user.role === 'client') {
            [fiches, transmitted] = await Promise.all([Fiche.countDocuments({ client: user._id }), Fiche.countDocuments({ client: user._id, statut: 'transmitted' })]);
        }
        res.json({ success: true, user, hotel, stats: { fiches, transmitted } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  POST /api/admin/users  — création d'un compte (client | hotel | superadmin)
//  Hôtel : créé directement approuvé + profil Hotel. Mot de passe généré si absent
//  (renvoyé UNE seule fois dans `tempPassword`).
// ============================================================
router.post('/users', async (req, res) => {
    try {
        const { role, email: mail, nom, prenom, telephone, nomHotel, rccm, adresseHotel, villeHotel, etoiles, regionHotel, communeHotel } = req.body;
        if (!['client', 'hotel', 'superadmin'].includes(role)) return res.status(400).json({ success: false, message: 'Rôle invalide.' });
        if (!mail || !/^\S+@\S+\.\S+$/.test(mail)) return res.status(422).json({ success: false, message: 'Email invalide.', errors: [{ path: 'email', msg: 'Email invalide' }] });
        if (role === 'hotel' && !(nomHotel && rccm && adresseHotel && villeHotel)) return res.status(422).json({ success: false, message: 'Nom, RCCM, adresse et ville de l\'hôtel requis.' });
        if (role !== 'hotel' && !(nom && prenom)) return res.status(422).json({ success: false, message: 'Nom et prénom requis.' });
        if (req.body.password && req.body.password.length < 8) return res.status(422).json({ success: false, message: 'Mot de passe : minimum 8 caractères.', errors: [{ path: 'password', msg: 'Minimum 8 caractères' }] });
        if (await User.findOne({ email: mail.toLowerCase() })) return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé.' });

        const generated = !req.body.password;
        const password  = req.body.password || crypto.randomBytes(9).toString('base64url') + 'A1!';
        const base = { role, email: mail, password, telephone: telephone || '', isActive: true, isVerified: true };
        const user = await User.create(role === 'hotel'
            ? { ...base, nomHotel, rccm, adresseHotel, villeHotel, regionHotel: regionHotel || '', communeHotel: communeHotel || '', hotelStatus: 'approved', approvedAt: new Date(), approvedBy: req.user._id }
            : { ...base, nom, prenom });
        if (role === 'hotel') {
            await Hotel.create({ user: user._id, nomHotel, adresse: adresseHotel, ville: villeHotel, region: REGIONS.includes(regionHotel) ? regionHotel : (/bamako/i.test(villeHotel) ? 'District de Bamako' : ''), commune: communeHotel || '', telephone: telephone || '', email: mail, etoiles: Math.min(5, Math.max(1, parseInt(etoiles) || 3)), chambres: [] });
        }
        res.status(201).json({ success: true, user: user.toSafe(), tempPassword: generated ? password : undefined });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/admin/users/:id  — modification (rôle et e-mail non modifiables)
// ============================================================
router.patch('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        const fields = user.role === 'hotel' ? ['telephone', 'nomHotel', 'adresseHotel', 'villeHotel', 'regionHotel', 'communeHotel', 'rccm'] : ['nom', 'prenom', 'telephone'];
        fields.forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
        await user.save();
        if (user.role === 'hotel') {
            const upd = { nomHotel: user.nomHotel, adresse: user.adresseHotel, ville: user.villeHotel, telephone: user.telephone };
            if (req.body.regionHotel !== undefined) upd.region = req.body.regionHotel;
            if (req.body.communeHotel !== undefined) upd.commune = req.body.communeHotel;
            if (req.body.etoiles) upd.etoiles = Math.min(5, Math.max(1, parseInt(req.body.etoiles) || 3));
            await Hotel.findOneAndUpdate({ user: user._id }, upd);
        }
        res.json({ success: true, user: user.toSafe() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/admin/users/:id/statut  { isActive: boolean }  — désactiver / réactiver
// ============================================================
router.patch('/users/:id/statut', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        if (user._id.equals(req.user._id)) return res.status(400).json({ success: false, message: 'Vous ne pouvez pas désactiver votre propre compte.' });
        if (user.role === 'superadmin' && req.body.isActive === false) return res.status(400).json({ success: false, message: 'Impossible de désactiver un superadmin.' });
        if (user.role === 'hotel' && user.hotelStatus !== 'approved' && req.body.isActive === true) return res.status(400).json({ success: false, message: 'Un hôtel non approuvé ne peut pas être activé : approuvez-le d\'abord.' });
        user.isActive = !!req.body.isActive;
        await user.save();
        res.json({ success: true, user: user.toSafe() });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/admin/documents?page&limit&q&type&hotel&statut&dispo
//  Pièces d'identité (PDF) et fiches : disponibilité réelle des fichiers
//  dispo : piece_ok | piece_manquante
// ============================================================
router.get('/documents', async (req, res) => {
    try {
        const page  = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 200);
        const { q, type, hotel, statut, dispo } = req.query;
        const filter = {};
        if (type) filter.typePiece = type;
        if (hotel && mongoose.isValidObjectId(hotel)) filter.hotel = hotel;
        if (statut) filter.statut = statut;
        if (q) { const rx = esc(q); filter.$or = [{ nom: rx }, { prenom: rx }, { reference: rx }, { numeroPiece: rx }]; }

        const disk = filesOnDisk();
        const has = (f) => !!f.cnibFichier && disk.has(f.cnibFichier);
        const proj = 'reference nom prenom typePiece numeroPiece statut createdAt cnibFichier hotel';
        let items, total;
        if (dispo) {
            const all = await Fiche.find(filter).select(proj).sort('-createdAt').populate('hotel', 'nomHotel').lean();
            const kept = all.filter(f => (dispo === 'piece_ok') === has(f));
            total = kept.length; items = kept.slice((page - 1) * limit, page * limit);
        } else {
            [items, total] = await Promise.all([Fiche.find(filter).select(proj).sort('-createdAt').skip((page - 1) * limit).limit(limit).populate('hotel', 'nomHotel').lean(), Fiche.countDocuments(filter)]);
        }
        const documents = items.map(({ cnibFichier, ...f }) => ({ ...f, pieceDisponible: !!cnibFichier && disk.has(cnibFichier), ficheDisponible: ['registered', 'transmitted'].includes(f.statut) }));

        const allNames = await Fiche.find().select('cnibFichier').lean();
        const totalFiches = allNames.length, piecesActives = allNames.filter(has).length;
        const fichesPdf = await Fiche.countDocuments({ statut: { $in: ['registered', 'transmitted'] } });
        res.json({ success: true, total, page, pages: Math.max(1, Math.ceil(total / limit)), documents,
            stats: { totalFiches, piecesActives, fichesPdf, manquants: totalFiches - piecesActives } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  SUPERVISION NATIONALE (v3 Mali)
//  /jour · /lots/summary · /lots · /regions · /anomalies · /rapport-consolide
// ============================================================
const dayStart = (offset = 0) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + offset); return d; };
const dayKey   = (d = new Date()) => d.toISOString().slice(0, 10);
const deadlineReached = () => new Date().getUTCHours() >= DEADLINE_HOUR;
const pctOf = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0);

// Hôtels « réseau » = approuvés et actifs
async function networkHotels() {
    const users = await User.find({ role: 'hotel', hotelStatus: 'approved', isActive: true }).select('_id nomHotel lastLoginAt').lean();
    const profiles = await Hotel.find({ user: { $in: users.map(u => u._id) } }).select('user nomHotel region commune ville').lean();
    return profiles.map(h => ({ ...h, lastLoginAt: users.find(u => String(u._id) === String(h.user))?.lastLoginAt }));
}

// Situation de clôture du jour pour chaque hôtel du réseau
async function lotSituation() {
    const hotels = await networkHotels();
    const date = dayKey();
    const [lots, pendingByHotel] = await Promise.all([
        Lot.find({ date }).select('hotel statut count scelleAt updatedAt').lean(),
        Fiche.aggregate([{ $match: { statut: 'registered' } }, { $group: { _id: '$hotel', n: { $sum: 1 } } }]),
    ]);
    const pending = Object.fromEntries(pendingByHotel.map(x => [String(x._id), x.n]));
    const late = deadlineReached();
    const rows = hotels.map(h => {
        const hl = lots.filter(l => String(l.hotel) === String(h._id));
        const open = hl.some(l => l.statut === 'en_cours');
        const aTransmettre = pending[String(h._id)] || 0;
        let statut = 'aucun';
        if (open || aTransmettre > 0) statut = late ? 'en_retard' : 'en_cours';
        else if (hl.length) statut = 'scelle';
        return { hotel: h, statut, count: hl.reduce((n, l) => n + l.count, 0), aTransmettre, at: hl.map(l => l.scelleAt || l.updatedAt).filter(Boolean).sort((a, b) => b - a)[0] || null };
    });
    return { rows, late, date };
}

// ------------------------------------------------------------
//  GET /api/admin/jour — chiffres du jour (cartes du tableau de bord)
// ------------------------------------------------------------
router.get('/jour', async (req, res) => {
    try {
        const [today, yesterday, intl, anomalies] = await Promise.all([
            Fiche.countDocuments({ createdAt: { $gte: dayStart(0) } }),
            Fiche.countDocuments({ createdAt: { $gte: dayStart(-1), $lt: dayStart(0) } }),
            Fiche.countDocuments({ createdAt: { $gte: dayStart(0) }, international: true }),
            computeAnomalies(),
        ]);
        const sit = await lotSituation();
        const scelles = sit.rows.filter(r => r.statut === 'scelle').length;
        res.json({
            success: true,
            date: sit.date,
            fiches: { aujourdhui: today, hier: yesterday, variationPct: yesterday ? Math.round(((today - yesterday) / yesterday) * 1000) / 10 : null },
            lots: { scelles, total: sit.rows.length, enCours: sit.rows.filter(r => r.statut === 'en_cours').length, enRetard: sit.rows.filter(r => r.statut === 'en_retard').length, conformitePct: pctOf(scelles, sit.rows.length) },
            internationaux: { aujourdhui: intl, pctVolume: pctOf(intl, today) },
            signalements: { total: anomalies.length, actionRequise: anomalies.filter(a => a.severity === 'high').length },
            clotureHeure: DEADLINE_HOUR,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------------------------------------
//  GET /api/admin/lots?limit=6 — activité récente des télé-transmissions
// ------------------------------------------------------------
router.get('/lots', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 6, 100);
        const sit = await lotSituation();
        const withActivity = sit.rows
            .filter(r => r.statut !== 'aucun')
            .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
        res.json({
            success: true,
            date: sit.date, clotureHeure: DEADLINE_HOUR,
            totalScelles: sit.rows.filter(r => r.statut === 'scelle').length,
            totalReseau: sit.rows.length,
            lots: withActivity.slice(0, limit).map(r => ({
                hotelId: r.hotel._id, etablissement: r.hotel.nomHotel,
                commune: [r.hotel.commune, r.hotel.ville].filter(Boolean).join(', '),
                region: r.hotel.region, fiches: r.count || r.aTransmettre, horodatage: r.at, statut: r.statut,
            })),
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------------------------------------
//  GET /api/admin/regions?days=30 — flux par région & commune + couverture réseau
// ------------------------------------------------------------
router.get('/regions', async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
        const since = dayStart(-(days - 1));
        const [byRegion, byCommune, hotels] = await Promise.all([
            Fiche.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $ifNull: ['$hotelRegion', ''] }, n: { $sum: 1 } } }]),
            Fiche.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { r: { $ifNull: ['$hotelRegion', ''] }, c: { $ifNull: ['$hotelCommune', ''] } }, n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
            networkHotels(),
        ]);
        const total = byRegion.reduce((n, r) => n + r.n, 0);
        const regionCount = Object.fromEntries(byRegion.map(r => [r._id, r.n]));
        const known = new Set(REGIONS);
        const names = [...REGIONS, ...(regionCount[''] ? ['Non renseignée'] : [])];
        const regions = names.map(name => {
            const key = name === 'Non renseignée' ? '' : name;
            const fiches = regionCount[key] || 0;
            const communes = byCommune.filter(c => c._id.r === key && c._id.c).slice(0, 4).map(c => ({ nom: c._id.c, fiches: c.n }));
            const hotelsRegion = hotels.filter(h => (h.region || '') === key);
            return { region: name, fiches, pct: pctOf(fiches, total), communes, hotels: hotelsRegion.length };
        }).filter(r => r.fiches > 0 || r.hotels > 0).sort((a, b) => b.fiches - a.fiches);

        // Couverture : hôtels du réseau actifs (connexion ou fiche) sur les 7 derniers jours
        const weekAgo = dayStart(-6);
        const recentHotels = await Fiche.distinct('hotel', { createdAt: { $gte: weekAgo } });
        const recentSet = new Set(recentHotels.map(String));
        const connected = hotels.filter(h => recentSet.has(String(h._id)) || (h.lastLoginAt && h.lastLoginAt >= weekAgo)).length;
        res.json({ success: true, days, total, regions, couverture: { connectes: connected, total: hotels.length, pct: pctOf(connected, hotels.length), fenetreJours: 7 } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------------------------------------
//  Anomalies : lots en retard · fiches en attente > 24 h · même pièce dans 2 hôtels aux dates qui se chevauchent
// ------------------------------------------------------------
async function computeAnomalies() {
    const out = [];
    const sit = await lotSituation();
    sit.rows.filter(r => r.statut === 'en_retard').forEach(r => out.push({
        type: 'lot_en_retard', severity: 'high', title: 'Lot non scellé après clôture',
        detail: `${r.hotel.nomHotel} · ${r.aTransmettre + r.count} fiche(s) à régulariser (clôture ${DEADLINE_HOUR} h)`, hotel: r.hotel.nomHotel, at: new Date(),
    }));

    const stale = await Fiche.aggregate([
        { $match: { statut: 'pending', createdAt: { $lte: new Date(Date.now() - 86400000) } } },
        { $group: { _id: '$hotel', n: { $sum: 1 }, oldest: { $min: '$createdAt' } } },
    ]);
    if (stale.length) {
        const names = Object.fromEntries((await Hotel.find({ _id: { $in: stale.map(x => x._id) } }).select('nomHotel').lean()).map(h => [String(h._id), h.nomHotel]));
        stale.forEach(x => out.push({ type: 'fiche_en_attente', severity: 'medium', title: 'Fiches sans traitement depuis plus de 24 h', detail: `${names[String(x._id)] || 'Hôtel'} · ${x.n} fiche(s) en attente`, hotel: names[String(x._id)], at: x.oldest }));
    }

    const flagged = await Fiche.find({ 'signalement.actif': true }).sort('-signalement.at').limit(10).select('reference signalement').lean();
    flagged.forEach(f => out.push({ type: 'fiche_signalee', severity: 'high', title: 'Fiche signalée', detail: `${f.reference} · ${f.signalement.motif}`, at: f.signalement.at }));

    // Une même pièce, deux établissements différents, séjours qui se chevauchent (actifs seulement)
    const dup = await Fiche.aggregate([
        { $match: { statut: { $in: ['registered', 'transmitted'] }, dateSortie: { $gte: dayStart(-30) } } },
        { $group: { _id: { p: '$typePiece', n: '$numeroPiece' }, fiches: { $push: { hotel: '$hotel', in: '$dateEntree', out: '$dateSortie', ref: '$reference' } }, hotels: { $addToSet: '$hotel' } } },
        { $match: { 'hotels.1': { $exists: true } } },
        { $limit: 50 },
    ]);
    dup.forEach(g => {
        const overlap = g.fiches.some((a, i) => g.fiches.some((b, j) => j > i && String(a.hotel) !== String(b.hotel) && a.in < b.out && b.in < a.out));
        if (overlap) out.push({ type: 'identite_double', severity: 'high', title: 'Contrôle d’identité requis', detail: `Pièce ${g._id.p} ${String(g._id.n).slice(0, 3)}••• enregistrée dans ${g.hotels.length} établissements sur des séjours simultanés`, at: new Date() });
    });
    return out;
}

router.get('/anomalies', async (req, res) => {
    try {
        const anomalies = await computeAnomalies();
        res.json({ success: true, total: anomalies.length, actionRequise: anomalies.filter(a => a.severity === 'high').length, anomalies: anomalies.slice(0, Math.min(parseInt(req.query.limit) || 20, 100)) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ------------------------------------------------------------
//  GET /api/admin/rapport-consolide?from=AAAA-MM-JJ&to=AAAA-MM-JJ
//  CSV (séparateur « ; », UTF-8 avec BOM → s'ouvre directement dans Excel)
//  Une ligne par établissement : volumes de la période par statut.
// ------------------------------------------------------------
router.get('/rapport-consolide', async (req, res) => {
    try {
        const from = req.query.from ? new Date(req.query.from) : dayStart(-29);
        const to   = req.query.to ? new Date(new Date(req.query.to).getTime() + 86399999) : new Date();
        if (isNaN(from) || isNaN(to) || from > to) return res.status(400).json({ success: false, message: 'Période invalide.' });

        const agg = await Fiche.aggregate([
            { $match: { createdAt: { $gte: from, $lte: to } } },
            { $group: { _id: '$hotel',
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$statut', 'pending'] }, 1, 0] } },
                registered: { $sum: { $cond: [{ $eq: ['$statut', 'registered'] }, 1, 0] } },
                transmitted: { $sum: { $cond: [{ $eq: ['$statut', 'transmitted'] }, 1, 0] } },
                refused: { $sum: { $cond: [{ $eq: ['$statut', 'refused'] }, 1, 0] } },
                internationaux: { $sum: { $cond: ['$international', 1, 0] } } } },
        ]);
        const hotels = await Hotel.find({ _id: { $in: agg.map(a => a._id) } }).select('nomHotel region commune ville').lean();
        const byId = Object.fromEntries(hotels.map(h => [String(h._id), h]));
        const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['Établissement', 'Région', 'Commune / quartier', 'Fiches reçues', 'En attente', 'Validées', 'Transmises', 'Refusées', 'Voyageurs internationaux'];
        const lines = agg
            .map(a => ({ h: byId[String(a._id)] || {}, a }))
            .sort((x, y) => y.a.total - x.a.total)
            .map(({ h, a }) => [cell(h.nomHotel), cell(h.region), cell(h.commune || h.ville), a.total, a.pending, a.registered, a.transmitted, a.refused, a.internationaux].join(';'));
        const sum = k => agg.reduce((n, a) => n + a[k], 0);
        lines.push(['"TOTAL NATIONAL"', '""', '""', sum('total'), sum('pending'), sum('registered'), sum('transmitted'), sum('refused'), sum('internationaux')].join(';'));

        const csv = '\uFEFF' + `"Rapport consolidé SafeStay Mali";"${from.toISOString().slice(0, 10)} → ${to.toISOString().slice(0, 10)}"\r\n` + header.map(cell).join(';') + '\r\n' + lines.join('\r\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="rapport-consolide-${dayKey()}.csv"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GESTIONNAIRE DES FICHES (superadmin)
//  GET   /admin/fiches?statut&region&hotel&q&from&to&international&signalees&page&limit
//  GET   /admin/fiches/export   (mêmes filtres → CSV)
//  PATCH /admin/fiches/:id/signaler | /lever-signalement
// ============================================================
const escRx = (v) => new RegExp(String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

function buildFicheFilter(q) {
    const f = {};
    if (['pending', 'registered', 'refused', 'transmitted'].includes(q.statut)) f.statut = q.statut;
    if (q.region) f.hotelRegion = q.region === 'Non renseignée' ? { $in: ['', null] } : q.region;
    if (q.hotel && /^[0-9a-f]{24}$/i.test(q.hotel)) f.hotel = q.hotel;
    if (q.international === '1') f.international = true;
    if (q.international === '0') f.international = false;
    if (q.signalees === '1') f['signalement.actif'] = true;
    if (q.from || q.to) {
        f.createdAt = {};
        if (q.from && !isNaN(new Date(q.from))) f.createdAt.$gte = new Date(q.from);
        if (q.to && !isNaN(new Date(q.to))) f.createdAt.$lte = new Date(new Date(q.to).getTime() + 86399999);
        if (!Object.keys(f.createdAt).length) delete f.createdAt;
    }
    if (q.q) { const rx = escRx(q.q); f.$or = [{ reference: rx }, { nom: rx }, { prenom: rx }, { numeroPiece: rx }, { transmisReference: rx }]; }
    return f;
}

router.get('/fiches', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
        const page  = Math.max(parseInt(req.query.page) || 1, 1);
        const filter = buildFicheFilter(req.query);
        const [fiches, total, byStatut, intl, flagged] = await Promise.all([
            Fiche.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit)
                .select('-cnibFichier')
                .populate('hotel', 'nomHotel ville region commune')
                .populate('client', 'nom prenom email'),
            Fiche.countDocuments(filter),
            Fiche.aggregate([{ $match: filter }, { $group: { _id: '$statut', n: { $sum: 1 } } }]),
            Fiche.countDocuments({ ...filter, international: true }),
            Fiche.countDocuments({ ...filter, 'signalement.actif': true }),
        ]);
        const st = Object.fromEntries(byStatut.map(x => [x._id, x.n]));
        res.json({
            success: true, page, pages: Math.max(1, Math.ceil(total / limit)), total, fiches,
            stats: { total, pending: st.pending || 0, registered: st.registered || 0, transmitted: st.transmitted || 0, refused: st.refused || 0, internationaux: intl, signalees: flagged },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/fiches/export', async (req, res) => {
    try {
        const fiches = await Fiche.find(buildFicheFilter(req.query)).sort('-createdAt').limit(5000)
            .populate('hotel', 'nomHotel ville region commune').lean();
        const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const mask = v => (v ? String(v).slice(0, 3) + '•••' : '');       // le n° de pièce n'est jamais exporté en clair
        const head = ['Référence', 'Date de dépôt', 'Statut', 'Établissement', 'Région', 'Commune / ville', 'Nom', 'Prénom', 'Nationalité', 'International', 'Pièce', 'N° pièce (masqué)', 'Entrée', 'Sortie', 'Réf. transmission', 'Signalée'];
        const rows = fiches.map(f => [f.reference, f.createdAt?.toISOString().slice(0, 16).replace('T', ' '), f.statut, f.hotel?.nomHotel, f.hotelRegion || f.hotel?.region, f.hotelCommune || f.hotel?.ville, f.nom, f.prenom, f.nationalite, f.international ? 'oui' : 'non', f.typePiece, mask(f.numeroPiece), f.dateEntree?.toISOString().slice(0, 10), f.dateSortie?.toISOString().slice(0, 10), f.transmisReference, f.signalement?.actif ? 'oui' : 'non'].map(cell).join(';'));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="fiches-${dayKey()}.csv"`);
        res.send('\uFEFF' + head.map(cell).join(';') + '\r\n' + rows.join('\r\n'));
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch('/fiches/:id/signaler', async (req, res) => {
    try {
        const motif = String(req.body.motif || '').trim();
        if (motif.length < 5) return res.status(400).json({ success: false, message: 'Indiquez un motif de signalement (5 caractères minimum).' });
        const fiche = await Fiche.findByIdAndUpdate(req.params.id, { signalement: { actif: true, motif: motif.slice(0, 500), par: req.user._id, at: new Date() } }, { new: true }).select('reference signalement');
        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche introuvable.' });
        res.json({ success: true, message: 'Fiche signalée.', fiche });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.patch('/fiches/:id/lever-signalement', async (req, res) => {
    try {
        const fiche = await Fiche.findByIdAndUpdate(req.params.id, { 'signalement.actif': false }, { new: true }).select('reference signalement');
        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche introuvable.' });
        res.json({ success: true, message: 'Signalement levé.', fiche });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
