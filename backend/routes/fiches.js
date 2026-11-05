const express = require('express');
const router  = express.Router();
const path    = require('path');
const { body, validationResult } = require('express-validator');

const crypto  = require('crypto');
const Fiche   = require('../models/Fiche');
const Lot     = require('../models/Lot');
const Hotel   = require('../models/Hotel');
const User    = require('../models/User');
const upload  = require('../middleware/upload');
const { protect, authorize, hotelApproved } = require('../middleware/auth');
const emailSvc = require('../utils/email');
const { notify } = require('../utils/notify');
const { PIECES, DEADLINE_HOUR, flagFor, isMalian } = require('../config/mali');

// Date du jour au format AAAA-MM-JJ (le Mali est à UTC+0 toute l'année)
const todayKey = () => new Date().toISOString().slice(0, 10);

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });
    next();
};

// ============================================================
//  POST /api/fiches
//  Soumettre une fiche (client)
//  multipart/form-data avec le champ "cnib" (PDF)
// ============================================================
router.post('/',
    protect,
    authorize('client'),
    upload.single('cnib'),
    [
        body('nom').notEmpty().withMessage('Nom requis'),
        body('prenom').notEmpty().withMessage('Prénom requis'),
        body('dateNaissance').isDate().withMessage('Date de naissance invalide')
            .custom(v => new Date(v) <= new Date()).withMessage('La date de naissance ne peut pas être dans le futur'),
        body('lieuNaissance').notEmpty(),
        body('nationalite').notEmpty(),
        body('adresse').notEmpty(),
        body('ville').notEmpty(),
        body('venantDe').notEmpty(),
        body('allantA').notEmpty(),
        body('motif').notEmpty(),
        body('numeroPiece').notEmpty().withMessage('N° de pièce requis'),
        body('typePiece').optional({ values: 'falsy' }).isIn(PIECES).withMessage('Type de pièce invalide'),
        body('delivreLe').isDate(),
        body('delivreA').notEmpty(),
        body('hotelId').notEmpty().withMessage('Hôtel requis'),
        body('chambreNumero').notEmpty().withMessage('Chambre requise'),
        body('dateEntree').isDate(),
        body('dateSortie').isDate(),
        body('transport').notEmpty(),
    ],
    validate,
    async (req, res) => {
        try {
            // Vérifier que le PDF de la pièce d'identité a bien été envoyé
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Fichier PDF de la pièce d\'identité (NINA, CNI ou passeport) requis.' });
            }

            const hotel = await Hotel.findById(req.body.hotelId);
            if (!hotel) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });

            // Vérifier que la date de sortie est après l'entrée
            const entree = new Date(req.body.dateEntree);
            const sortie = new Date(req.body.dateSortie);
            if (sortie <= entree) {
                return res.status(400).json({ success: false, message: 'La date de sortie doit être après la date d\'entrée.' });
            }

            // ─────────────────────────────────────────────────────
            //  ANTI-DOUBLON : empêcher la soumission multiple
            //  Bloque si une fiche du MÊME client, pour le MÊME hôtel,
            //  avec les MÊMES dates de séjour, existe déjà et n'est pas refusée.
            //  (une fiche "refused" peut être resoumise après correction)
            // ─────────────────────────────────────────────────────
            const doublon = await Fiche.findOne({
                client:     req.user._id,
                hotel:      hotel._id,
                dateEntree: entree,
                dateSortie: sortie,
                statut:     { $in: ['pending', 'registered', 'transmitted'] },
            });

            if (doublon) {
                return res.status(409).json({
                    success: false,
                    message: `Vous avez déjà soumis une fiche (réf. ${doublon.reference}) pour cet hôtel et ces mêmes dates de séjour. Statut actuel : ${doublon.statut}.`,
                    existingFiche: {
                        reference: doublon.reference,
                        statut:    doublon.statut,
                        createdAt: doublon.createdAt,
                    },
                });
            }

            const {
                nom, prenom, dateNaissance, lieuNaissance, nationalite,
                profession, adresse, ville, bp,
                venantDe, allantA, motif,
                numeroPiece, typePiece, delivreLe, delivreA,
                chambreNumero, transport, plaque, modePaiement,
            } = req.body;

            const fiche = await Fiche.create({
                client:        req.user._id,
                hotel:         hotel._id,
                hotelUser:     hotel.user,
                nom, prenom,
                dateNaissance, lieuNaissance,
                nationalite,
                flagEmoji:     flagFor(nationalite),
                international: !isMalian(nationalite),
                hotelRegion:   hotel.region  || '',
                hotelCommune:  hotel.commune || hotel.ville || '',
                profession:    profession || '',
                adresse, ville, bp: bp || '',
                venantDe, allantA, motif,
                numeroPiece,
                typePiece:     typePiece || 'NINA',
                delivreLe,
                delivreA,
                cnibFichier:   req.file.filename,
                dateEntree:    entree,
                dateSortie:    sortie,
                chambreNumero,
                transport,
                plaque:        plaque || '',
                modePaiement:  modePaiement || 'cash',
                statut:        'pending',
            });

            // Marquer la chambre comme occupée
            const chambre = hotel.chambres.find(c => c.numero === chambreNumero);
            if (chambre) { chambre.disponible = false; await hotel.save(); }

            // Email de confirmation au client (non bloquant)
            emailSvc.sendFicheReceived(req.user.email, fiche).catch(console.error);

            // Notification in-app pour l'hôtel : nouvelle fiche reçue
            notify({
                user:    hotel.user,
                type:    'fiche_received',
                title:   '📋 Nouvelle fiche reçue',
                message: `${prenom} ${nom} a soumis une fiche pour la chambre ${chambreNumero}.`,
                fiche:   fiche._id,
                link:    '/hotel/demandes',
            }).catch(console.error);

            res.status(201).json({
                success: true,
                message: 'Fiche soumise avec succès.',
                fiche: {
                    _id:       fiche._id,
                    reference: fiche.reference,
                    statut:    fiche.statut,
                    createdAt: fiche.createdAt,
                },
            });
        } catch (err) {
            // Doublon détecté par l'index unique MongoDB (double-clic simultané
            // qui a passé la vérification applicative avant l'insertion)
            if (err.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Une fiche identique est déjà en cours de traitement pour cet hôtel et ces dates. Veuillez patienter.',
                });
            }
            console.error(err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

// ============================================================
//  GET /api/fiches/mes-fiches
//  Liste des fiches du client connecté
// ============================================================
router.get('/mes-fiches', protect, authorize('client'), async (req, res) => {
    try {
        const fiches = await Fiche.find({ client: req.user._id })
            .populate('hotel', 'nomHotel ville')
            .sort('-createdAt')
            .select('-cnibFichier');

        res.json({ success: true, count: fiches.length, fiches });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/fiches/hotel
//  Fiches reçues par l'hôtel connecté (avec filtres)
// ============================================================
router.get('/hotel', protect, authorize('hotel'), hotelApproved, async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ user: req.user._id });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });

        // Filtres : statut (un ou plusieurs, séparés par des virgules), q (recherche partielle),
        //           from / to (dates de soumission, AAAA-MM-JJ), page, limit (max 1000)
        const { statut, page = 1, q, from, to } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 20, 1000);
        const filter = { hotel: hotel._id };
        if (statut) filter.statut = { $in: String(statut).split(',').map(s => s.trim()).filter(Boolean) };
        if (q) {
            const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ nom: rx }, { prenom: rx }, { reference: rx }, { numeroPiece: rx }];
        }
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to)   filter.createdAt.$lte = new Date(new Date(to).getTime() + 86399999);
        }

        const fiches = await Fiche.find(filter)
            .populate('client', 'email')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Fiche.countDocuments(filter);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            fiches,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/fiches/hotel/stats
//  Statistiques dashboard hôtel
// ============================================================
router.get('/hotel/stats', protect, authorize('hotel'), hotelApproved, async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ user: req.user._id });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });

        const [pending, registered, refused, transmitted, totalClients] = await Promise.all([
            Fiche.countDocuments({ hotel: hotel._id, statut: 'pending' }),
            Fiche.countDocuments({ hotel: hotel._id, statut: 'registered' }),
            Fiche.countDocuments({ hotel: hotel._id, statut: 'refused' }),
            Fiche.countDocuments({ hotel: hotel._id, statut: 'transmitted' }),
            Fiche.countDocuments({ hotel: hotel._id }),
        ]);

        res.json({
            success: true,
            stats: {
                totalClients,
                pending,
                registered,
                refused,
                transmitted,
                chambresOccupees: hotel.chambresOccupees,
                totalChambres:    hotel.totalChambres,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ============================================================
//  Lots de télé-transmission
// ============================================================
const lotRef = (date, hotelId, rang) => `LOT-${date.replace(/-/g, '')}-${String(hotelId).slice(-4).toUpperCase()}${rang > 1 ? '-' + rang : ''}`;

// Ajoute une fiche au lot ouvert du jour (en crée un si nécessaire : lot déjà scellé ou premier de la journée)
async function addToOpenLot(hotelId, hotelUser, ficheId) {
    const date = todayKey();
    let lot = await Lot.findOne({ hotel: hotelId, date, statut: 'en_cours' }).sort('-rang');
    if (!lot) {
        const last = await Lot.findOne({ hotel: hotelId, date }).sort('-rang');
        const rang = (last?.rang || 0) + 1;
        lot = new Lot({ hotel: hotelId, hotelUser, date, rang, reference: lotRef(date, hotelId, rang) });
    }
    if (!lot.fiches.some(f => String(f) === String(ficheId))) lot.fiches.push(ficheId);
    lot.count = lot.fiches.length;
    await lot.save();
    return lot;
}

// État de clôture pour un hôtel : en_cours | scelle | en_retard | aucun
const deadlineReached = () => new Date().getUTCHours() >= DEADLINE_HOUR;

// ============================================================
//  GET /api/fiches/lots/aujourdhui
//  Situation de télé-transmission du jour pour l'hôtel connecté
// ============================================================
router.get('/lots/aujourdhui', protect, authorize('hotel'), hotelApproved, async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ user: req.user._id });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });
        const date = todayKey();
        const [lots, aTransmettre] = await Promise.all([
            Lot.find({ hotel: hotel._id, date }).sort('rang').select('-fiches'),
            Fiche.countDocuments({ hotel: hotel._id, statut: 'registered' }),
        ]);
        const ouvert = lots.find(l => l.statut === 'en_cours');
        let statut = 'aucun';
        if (ouvert || aTransmettre > 0) statut = deadlineReached() ? 'en_retard' : 'en_cours';
        else if (lots.length) statut = 'scelle';
        res.json({
            success: true, date, statut,
            clotureHeure: DEADLINE_HOUR, clotureAtteinte: deadlineReached(),
            aTransmettre,                                    // fiches validées pas encore transmises
            transmisAujourdhui: lots.reduce((n, l) => n + l.count, 0),
            lots,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/fiches/transmettre-lot
//  Transmet en une fois toutes les fiches validées (ou une sélection : { ids: [...] })
// ============================================================
router.patch('/transmettre-lot', protect, authorize('hotel'), hotelApproved, async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ user: req.user._id });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });
        const filter = { hotel: hotel._id, statut: 'registered' };
        if (Array.isArray(req.body.ids) && req.body.ids.length) filter._id = { $in: req.body.ids };
        const fiches = await Fiche.find(filter).populate('client', 'nom prenom email');
        if (!fiches.length) return res.status(400).json({ success: false, message: 'Aucune fiche validée à transmettre.' });

        let lot;
        for (const f of fiches) {
            f.statut = 'transmitted';
            f.transmisAt = new Date();
            f.transmisReference = `POLICE-ML-${Date.now()}-${f.reference}`;
            lot = await addToOpenLot(hotel._id, hotel.user, f._id);
            f.lot = lot._id;
            await f.save();
            notify({
                user: f.client, type: 'fiche_transmitted', title: '📤 Fiche transmise aux autorités',
                message: `Votre fiche ${f.reference} a été transmise. Référence : ${f.transmisReference}`, fiche: f._id, link: '/client',
            }).catch(console.error);
        }
        res.json({ success: true, message: `${fiches.length} fiche(s) transmise(s).`, transmises: fiches.length, lot: { _id: lot._id, reference: lot.reference, count: lot.count, statut: lot.statut } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/fiches/lots/aujourdhui/sceller
//  Scelle le lot ouvert du jour : calcule l'empreinte SHA-256 du contenu
// ============================================================
router.patch('/lots/aujourdhui/sceller', protect, authorize('hotel'), hotelApproved, async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ user: req.user._id });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hôtel introuvable.' });
        const date = todayKey();
        const lot = await Lot.findOne({ hotel: hotel._id, date, statut: 'en_cours' }).sort('-rang').populate('fiches', 'reference transmisReference numeroPiece');
        if (!lot || !lot.count) return res.status(400).json({ success: false, message: 'Aucun lot ouvert à sceller aujourd\'hui. Transmettez d\'abord des fiches validées.' });

        const payload = JSON.stringify({
            lot: lot.reference, hotel: String(hotel._id), date,
            fiches: lot.fiches.map(f => [f.reference, f.transmisReference, f.numeroPiece]).sort(),
        });
        lot.empreinte = crypto.createHash('sha256').update(payload).digest('hex');
        lot.statut    = 'scelle';
        lot.scelleAt  = new Date();
        lot.scellePar = req.user._id;
        await lot.save();

        notify({
            user: req.user._id, type: 'lot_sealed', title: '🔒 Lot journalier scellé',
            message: `Le lot ${lot.reference} (${lot.count} fiche${lot.count > 1 ? 's' : ''}) a été scellé.`, link: '/hotel',
        }).catch(console.error);

                    emailSvc.sendFicheTransmitted(f.client.email, f, hotel.nomHotel).catch(console.error);

        res.json({ success: true, message: 'Lot scellé.', lot: { _id: lot._id, reference: lot.reference, count: lot.count, statut: lot.statut, scelleAt: lot.scelleAt, empreinte: lot.empreinte } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/fiches/:id
//  Détail d'une fiche (client owner ou hôtel concerné ou superadmin)
// ============================================================
router.get('/:id', protect, async (req, res) => {
    try {
        const fiche = await Fiche.findById(req.params.id)
            .populate('client', 'nom prenom email')
            .populate('hotel', 'nomHotel ville adresse');

        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche introuvable.' });

        // Contrôle d'accès
        const isOwner   = fiche.client._id.toString() === req.user._id.toString();
        const isHotel   = fiche.hotelUser && fiche.hotelUser.toString() === req.user._id.toString();
        const isAdmin   = req.user.role === 'superadmin';

        if (!isOwner && !isHotel && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Accès refusé.' });
        }

        res.json({ success: true, fiche });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/fiches/:id/valider
//  L'hôtel valide la fiche (statut → registered)
// ============================================================
router.patch('/:id/valider', protect, authorize('hotel'), hotelApproved, async (req, res) => {
    try {
        const fiche = await Fiche.findById(req.params.id).populate('client', 'email');
        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche introuvable.' });

        if (fiche.hotelUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Cette fiche n\'appartient pas à votre hôtel.' });
        }
        if (fiche.statut !== 'pending') {
            return res.status(400).json({ success: false, message: `La fiche est déjà : ${fiche.statut}.` });
        }

        fiche.statut    = 'registered';
        fiche.traitePar = req.user._id;
        fiche.traiteAt  = new Date();
        await fiche.save();

        // Email client
        if (fiche.client?.email) {
            emailSvc.sendFicheValidated(fiche.client.email, fiche).catch(console.error);
        }

        // Notification in-app pour le client : fiche validée ✅
        notify({
            user:    fiche.client._id,
            type:    'fiche_registered',
            title:   '✅ Votre fiche a été validée',
            message: `Votre fiche ${fiche.reference} a été validée par l'hôtel et sera transmise à la police.`,
            fiche:   fiche._id,
            link:    '/client',
        }).catch(console.error);

        res.json({ success: true, message: 'Fiche validée.', fiche });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/fiches/:id/refuser
//  L'hôtel refuse la fiche (statut → refused)
// ============================================================
router.patch('/:id/refuser', protect, authorize('hotel'), hotelApproved, [
    body('motif').optional().isString(),
], validate, async (req, res) => {
    try {
        const fiche = await Fiche.findById(req.params.id).populate('client', 'email');
        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche introuvable.' });

        if (fiche.hotelUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Cette fiche n\'appartient pas à votre hôtel.' });
        }
        if (fiche.statut !== 'pending') {
            return res.status(400).json({ success: false, message: `La fiche est déjà : ${fiche.statut}.` });
        }

        fiche.statut      = 'refused';
        fiche.refusMotif  = req.body.motif || 'Informations non conformes';
        fiche.traitePar   = req.user._id;
        fiche.traiteAt    = new Date();
        await fiche.save();

        // Remettre la chambre disponible
        const hotel = await Hotel.findById(fiche.hotel);
        if (hotel) {
            const chambre = hotel.chambres.find(c => c.numero === fiche.chambreNumero);
            if (chambre) { chambre.disponible = true; await hotel.save(); }
        }

        // Email client
        if (fiche.client?.email) {
            emailSvc.sendFicheRefused(fiche.client.email, fiche).catch(console.error);
        }

        // Notification in-app pour le client : fiche refusée ❌
        notify({
            user:    fiche.client._id,
            type:    'fiche_refused',
            title:   '❌ Votre fiche a été refusée',
            message: `Votre fiche ${fiche.reference} a été refusée. Motif : ${fiche.refusMotif}`,
            fiche:   fiche._id,
            link:    '/client',
        }).catch(console.error);

        res.json({ success: true, message: 'Fiche refusée.', fiche });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  PATCH /api/fiches/:id/transmettre-police
//  L'hôtel transmet la fiche à la police (statut → transmitted)
//  La fiche doit être "registered" (validée)
// ============================================================
router.patch('/:id/transmettre-police', protect, authorize('hotel', 'superadmin'), async (req, res) => {
    try {
        const fiche = await Fiche.findById(req.params.id)
            .populate('client', 'nom prenom email')
            .populate('hotel', 'nomHotel ville');

        if (!fiche) return res.status(404).json({ success: false, message: 'Fiche introuvable.' });

        if (req.user.role === 'hotel') {
            if (fiche.hotelUser.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Accès refusé.' });
            }
        }

        if (fiche.statut !== 'registered') {
            return res.status(400).json({
                success: false,
                message: 'Seules les fiches validées peuvent être transmises à la police.',
            });
        }

        // Génération de la référence police unique
        const refPolice = `POLICE-ML-${Date.now()}-${fiche.reference}`;

        fiche.statut            = 'transmitted';
        fiche.transmisAt        = new Date();
        fiche.transmisReference = refPolice;
        const lot = await addToOpenLot(fiche.hotel._id || fiche.hotel, fiche.hotelUser, fiche._id);
        fiche.lot = lot._id;
        await fiche.save();

        // Notification in-app pour le client : fiche transmise à la police 📤
        notify({
            user:    fiche.client._id,
            type:    'fiche_transmitted',
            title:   '📤 Fiche transmise à la police',
            message: `Votre fiche ${fiche.reference} a été transmise aux autorités. Référence : ${refPolice}`,
            fiche:   fiche._id,
            link:    '/client',
        }).catch(console.error);

        emailSvc.sendFicheTransmitted(fiche.client.email, fiche, fiche.hotel?.nomHotel).catch(console.error);

        // ─────────────────────────────────────────────────────
        //  Ici, en production, vous déclencheriez :
        //  - Un appel API vers la base de données police sécurisée
        //  - Ou un push vers un service gouvernemental
        //  - Ou l'envoi d'un email chiffré à la police
        //  Pour l'instant on log la référence.
        // ─────────────────────────────────────────────────────
        console.log(`🚔 Fiche transmise à la police : ${refPolice}`);
        console.log(`   Client : ${fiche.prenom} ${fiche.nom}`);
        console.log(`   Hôtel  : ${fiche.hotel?.nomHotel}`);
        console.log(`   Pièce  : ${fiche.typePiece} ${fiche.numeroPiece}`);

        res.json({
            success: true,
            message: 'Fiche transmise aux autorités.',
            referencePolice: refPolice,
            lot: { _id: lot._id, reference: lot.reference, count: lot.count, statut: lot.statut },
            fiche,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================================
//  GET /api/fiches/:id/piece   (alias historique : /cnib)
//  Télécharger le PDF de la pièce d'identité (hôtel ou superadmin)
// ============================================================
router.get(['/:id/piece', '/:id/cnib'], protect, authorize('hotel', 'superadmin'), async (req, res) => {
    try {
        const fiche = await Fiche.findById(req.params.id);
        if (!fiche || !fiche.cnibFichier) {
            return res.status(404).json({ success: false, message: 'Fichier introuvable.' });
        }

        if (req.user.role === 'hotel' && fiche.hotelUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Accès refusé.' });
        }

        const filePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', 'cnib', fiche.cnibFichier);
        res.download(filePath, `PIECE_${fiche.nom}_${fiche.prenom}.pdf`);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
