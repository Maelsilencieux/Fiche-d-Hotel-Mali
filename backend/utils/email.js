const nodemailer = require('nodemailer');

// ============================================================
//  Transporter (SMTP)
// ============================================================
const createTransporter = () => nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ============================================================
//  Envoi générique
// ============================================================
const sendEmail = async ({ to, subject, html }) => {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"SafeStay Mali" <no-reply@safestay.ml>',
        to,
        subject,
        html,
    });
    console.log(`📧 Email envoyé : ${info.messageId}`);
    return info;
};

// ============================================================
//  Templates emails
// ============================================================

exports.sendWelcomeClient = async (user) => {
    await sendEmail({
        to: user.email,
        subject: '✅ Bienvenue sur SafeStay',
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Bienvenue, ${user.prenom} !</h3>
                <p>Votre compte client a été créé avec succès.<br>
                Vous pouvez dès maintenant remplir votre fiche d'enregistrement hôtelière.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendHotelPending = async (user) => {
    await sendEmail({
        to: user.email,
        subject: '⏳ Demande d\'inscription hôtel reçue — SafeStay',
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Votre demande a été reçue</h3>
                <p>L'inscription de <strong>${user.nomHotel}</strong> est en cours de vérification.<br>
                Notre équipe vérifie votre RCCM et vos informations sous 24–48h.<br>
                Vous recevrez un email de confirmation dès validation.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendHotelApproved = async (user) => {
    await sendEmail({
        to: user.email,
        subject: '✅ Compte hôtel approuvé — SafeStay',
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Félicitations !</h3>
                <p>Le compte de <strong>${user.nomHotel}</strong> a été approuvé.<br>
                Vous pouvez maintenant vous connecter et gérer vos fiches clients.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendHotelRejected = async (user, reason) => {
    await sendEmail({
        to: user.email,
        subject: '❌ Demande refusée — SafeStay',
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Demande non approuvée</h3>
                <p>Votre demande d'inscription pour <strong>${user.nomHotel}</strong> a été refusée.</p>
                <p><strong>Motif :</strong> ${reason || 'Documents non conformes'}</p>
                <p>Contactez-nous à support@safestay.ml pour plus d'informations.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendFicheReceived = async (clientEmail, fiche) => {
    await sendEmail({
        to: clientEmail,
        subject: `📋 Fiche ${fiche.reference} transmise à l'hôtel`,
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Votre fiche a été envoyée</h3>
                <p>Référence : <strong>${fiche.reference}</strong></p>
                <p>Elle est en attente de validation par l'hôtel.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendFicheValidated = async (clientEmail, fiche) => {
    await sendEmail({
        to: clientEmail,
        subject: `✅ Fiche ${fiche.reference} validée`,
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Fiche validée !</h3>
                <p>Votre fiche d'enregistrement <strong>${fiche.reference}</strong> a été validée par l'hôtel. Vous recevrez un nouvel e-mail dès sa transmission aux autorités.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendFicheRefused = async (clientEmail, fiche) => {
    await sendEmail({
        to: clientEmail,
        subject: `❌ Fiche ${fiche.reference} refusée`,
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Fiche refusée</h3>
                <p>Votre fiche <strong>${fiche.reference}</strong> a été refusée.</p>
                <p><strong>Motif :</strong> ${fiche.refusMotif || 'Informations non conformes'}</p>
                <p>Veuillez soumettre une nouvelle fiche corrigée.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

// ============================================================
//  Mot de passe oublié
// ============================================================

exports.sendPasswordReset = async (user, resetUrl) => {
    const nomAffiche = user.prenom || user.nomHotel || 'utilisateur';
    await sendEmail({
        to: user.email,
        subject: '🔑 Réinitialisation de votre mot de passe — SafeStay',
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Bonjour ${nomAffiche},</h3>
                <p>Vous avez demandé la réinitialisation de votre mot de passe.
                Cliquez sur le bouton ci-dessous pour en définir un nouveau :</p>
                <div style="text-align:center;margin:28px 0">
                    <a href="${resetUrl}" style="background:#0B6B3A;color:#fff;padding:13px 28px;border-radius:9px;text-decoration:none;font-weight:700;display:inline-block">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                <p style="color:#6B7A94;font-size:13px">Ce lien est valable <strong>30 minutes</strong>.
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe restera inchangé.</p>
                <p style="color:#6B7A94;font-size:11px;word-break:break-all;margin-top:16px">
                Lien direct : ${resetUrl}</p>
                <p style="color:#6B7A94;font-size:12px;margin-top:20px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

exports.sendPasswordChanged = async (user) => {
    const nomAffiche = user.prenom || user.nomHotel || 'utilisateur';
    await sendEmail({
        to: user.email,
        subject: '✅ Mot de passe modifié — SafeStay',
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Bonjour ${nomAffiche},</h3>
                <p>Votre mot de passe a été modifié avec succès.</p>
                <p style="color:#6B7A94;font-size:13px">Si vous n'êtes pas à l'origine de ce changement,
                contactez immédiatement support@safestay.ml.</p>
                <p style="color:#6B7A94;font-size:12px;margin-top:20px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

exports.sendFicheTransmitted = async (clientEmail, fiche, nomHotel = '') => {
    const date = new Date(fiche.transmisAt || Date.now()).toLocaleString('fr-FR', { timeZone: 'Africa/Bamako', dateStyle: 'long', timeStyle: 'short' });
    await sendEmail({
        to: clientEmail,
        subject: `📤 Fiche ${fiche.reference} transmise aux autorités`,
        html: `
            <div style="font-family:DM Sans,sans-serif;max-width:520px;margin:auto;padding:32px">
                <div style="height:4px;background:linear-gradient(90deg,#14B53A 33%,#FCD116 33% 66%,#CE1126 66%);margin-bottom:18px"></div><h2 style="color:#0B6B3A">SafeStay Mali</h2>
                <h3>Votre fiche a été transmise</h3>
                <p>L'établissement ${esc(nomHotel)} a transmis votre fiche aux autorités compétentes.</p>
                <table style="font-size:14px;border-collapse:collapse">
                    <tr><td style="padding:4px 12px 4px 0;color:#6B685B">Référence fiche</td><td><strong>${esc(fiche.reference)}</strong></td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#6B685B">Référence de transmission</td><td><strong>${esc(fiche.transmisReference)}</strong></td></tr>
                    <tr><td style="padding:4px 12px 4px 0;color:#6B685B">Date (heure de Bamako)</td><td>${date}</td></tr>
                </table>
                <p>Conservez ces références : elles pourront vous être demandées.</p>
                <p style="color:#6B7A94;font-size:12px">© 2026 SafeStay Mali — République du Mali</p>
            </div>
        `,
    });
};

module.exports = { ...exports, sendEmail };
