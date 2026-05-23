const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'parking_secret_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// ── REGISTER ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { nom, email, password, role } = req.body;
  if (!nom || !email || !password)
    return res.status(400).json({ success: false, message: 'Nom, email et mot de passe requis' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
  try {
    const existing = await db.query('SELECT "idUser" FROM "USER" WHERE "email"=$1', [email]);
    if (existing.rows.length)
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });

    const hashed = await bcrypt.hash(password, 12);
    const idUser = uuidv4();
    const userRole = role === 'admin' ? 'admin' : 'agent';

    await db.query(
      'INSERT INTO "USER" ("idUser","nom","email","password","role") VALUES ($1,$2,$3,$4,$5)',
      [idUser, nom, email, hashed, userRole]
    );

    const token = jwt.sign({ idUser, nom, email, role: userRole }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: { idUser, nom, email, role: userRole }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── LOGIN ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
  try {
    const result = await db.query('SELECT * FROM "USER" WHERE "email"=$1', [email]);
    if (!result.rows.length)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const token = jwt.sign(
      { idUser: user.idUser, nom: user.nom, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: { idUser: user.idUser, nom: user.nom, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── FORGOT PASSWORD ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: 'Email requis' });
  try {
    const result = await db.query('SELECT * FROM "USER" WHERE "email"=$1', [email]);
    // On répond toujours OK pour ne pas révéler si l'email existe
    if (!result.rows.length)
      return res.json({ success: true, message: 'Si cet email existe, un lien a été envoyé.' });

    const user = result.rows[0];
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db.query(
      'UPDATE "USER" SET "resetToken"=$1, "resetExpires"=$2 WHERE "idUser"=$3',
      [token, expires, user.idUser]
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Parking Manager <no-reply@parking.mg>',
      to: user.email,
      subject: '🅿️ Réinitialisation de votre mot de passe — Parking Manager',
      html: `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8">
        <style>
          body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:20px}
          .box{max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
          .header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;text-align:center}
          .header h1{color:#e8b84b;margin:0;font-size:22px;letter-spacing:2px}
          .body{padding:30px}
          .btn{display:inline-block;background:linear-gradient(135deg,#e8b84b,#c49a30);color:#1a1a2e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;margin:20px 0}
          .footer{background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#999}
          .warn{background:#fff8e1;border-left:4px solid #e8b84b;padding:10px 14px;border-radius:4px;font-size:13px;color:#555;margin-top:16px}
        </style></head>
        <body>
          <div class="box">
            <div class="header">
              <div style="font-size:36px;margin-bottom:8px">🅿️</div>
              <h1>PARKING MANAGER</h1>
            </div>
            <div class="body">
              <h2 style="color:#1a1a2e;margin-top:0">Réinitialisation du mot de passe</h2>
              <p style="color:#555">Bonjour <strong>${user.nom}</strong>,</p>
              <p style="color:#555">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
              <div style="text-align:center">
                <a href="${resetLink}" class="btn">🔑 Réinitialiser mon mot de passe</a>
              </div>
              <div class="warn">
                ⏱ Ce lien est valable <strong>1 heure</strong> uniquement.<br>
                Si vous n'avez pas fait cette demande, ignorez cet email.
              </div>
            </div>
            <div class="footer">© 2025 Parking Manager — Ce message est automatique.</div>
          </div>
        </body></html>
      `
    });

    res.json({ success: true, message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── RESET PASSWORD ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
  try {
    const result = await db.query(
      'SELECT * FROM "USER" WHERE "resetToken"=$1 AND "resetExpires" > NOW()',
      [token]
    );
    if (!result.rows.length)
      return res.status(400).json({ success: false, message: 'Lien invalide ou expiré' });

    const user = result.rows[0];
    const hashed = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE "USER" SET "password"=$1, "resetToken"=NULL, "resetExpires"=NULL WHERE "idUser"=$2',
      [hashed, user.idUser]
    );

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ME (profil connecté) ─────────────────────────────────────
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT "idUser","nom","email","role","createdAt" FROM "USER" WHERE "idUser"=$1',
      [req.user.idUser]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
