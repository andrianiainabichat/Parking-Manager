const nodemailer = require('nodemailer')
require('dotenv').config()

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // false = STARTTLS sur port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

const sendEntreeEmail = async (client, voiture, place, entree) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  SMTP non configuré — email entrée ignoré')
    return
  }

  const transporter = createTransporter()
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px}
        .wrap{max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
        .header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px;text-align:center}
        .logo{font-size:2.5rem;margin-bottom:8px}
        .brand{color:#e8b84b;font-size:20px;font-weight:800;letter-spacing:1px}
        .badge{display:inline-block;background:#2ecc71;color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-top:10px}
        .body{padding:28px 32px}
        .greeting{font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px}
        .text{font-size:13px;color:#555;line-height:1.7;margin-bottom:16px}
        .info-card{background:#f8f9fa;border-left:4px solid #e8b84b;border-radius:8px;padding:16px 20px;margin:16px 0}
        .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:13px}
        .row:last-child{border-bottom:none}
        .label{color:#666}
        .value{color:#1a1a2e;font-weight:600}
        .footer{background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee}
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="header">
          <div class="logo">🅿️</div>
          <div class="brand">PARKING MANAGER</div>
          <div><span class="badge">✓ ENTRÉE ENREGISTRÉE</span></div>
        </div>
        <div class="body">
          <div class="greeting">Bonjour ${client.nom},</div>
          <p class="text">Votre véhicule a bien été enregistré dans notre parking.</p>
          <div class="info-card">
            <div class="row"><span class="label">🚗 Véhicule</span><span class="value">${voiture.marque} — ${voiture.matricule}</span></div>
            <div class="row"><span class="label">📍 Place</span><span class="value">N° ${place.numeroPlace} (${place.typePlace})</span></div>
            <div class="row"><span class="label">🕐 Entrée</span><span class="value">${new Date(entree.dateEntree).toLocaleString('fr-FR')}</span></div>
            ${entree.motif ? `<div class="row"><span class="label">📝 Motif</span><span class="value">${entree.motif}</span></div>` : ''}
          </div>
          <p style="font-size:12px;color:#888">Référence : ${entree.idEntree}</p>
        </div>
        <div class="footer">© 2025 Parking Manager — Message automatique</div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `Parking Manager <${process.env.SMTP_USER}>`,
    to: client.mail,
    subject: `🅿️ Entrée enregistrée — Place N°${place.numeroPlace}`,
    html
  })
  console.log(`📧 Email entrée envoyé à ${client.mail}`)
}

const sendSortieEmail = async (client, voiture, place, sortie) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  SMTP non configuré — email sortie ignoré')
    return
  }

  const transporter = createTransporter()
  const h = Math.floor(sortie.duree / 60)
  const m = sortie.duree % 60
  const dureeStr = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m} min`

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px}
        .wrap{max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)}
        .header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px;text-align:center}
        .logo{font-size:2.5rem;margin-bottom:8px}
        .brand{color:#e8b84b;font-size:20px;font-weight:800;letter-spacing:1px}
        .badge{display:inline-block;background:#e74c3c;color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-top:10px}
        .body{padding:28px 32px}
        .greeting{font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:8px}
        .text{font-size:13px;color:#555;line-height:1.7;margin-bottom:16px}
        .info-card{background:#f8f9fa;border-left:4px solid #e8b84b;border-radius:8px;padding:16px 20px;margin:16px 0}
        .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:13px}
        .row:last-child{border-bottom:none}
        .label{color:#666}
        .value{color:#1a1a2e;font-weight:600}
        .montant-box{background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:10px;padding:20px;text-align:center;margin:20px 0}
        .montant-label{color:#a0a0b0;font-size:12px;margin-bottom:4px}
        .montant-value{color:#e8b84b;font-size:28px;font-weight:800}
        .footer{background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee}
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="header">
          <div class="logo">🅿️</div>
          <div class="brand">PARKING MANAGER</div>
          <div><span class="badge">⬆ SORTIE ENREGISTRÉE</span></div>
        </div>
        <div class="body">
          <div class="greeting">Bonjour ${client.nom},</div>
          <p class="text">Votre véhicule vient de quitter le parking.</p>
          <div class="info-card">
            <div class="row"><span class="label">🚗 Véhicule</span><span class="value">${voiture.marque} — ${voiture.matricule}</span></div>
            <div class="row"><span class="label">📍 Place</span><span class="value">N° ${place.numeroPlace}</span></div>
            <div class="row"><span class="label">⏱ Durée</span><span class="value">${dureeStr}</span></div>
            <div class="row"><span class="label">🕐 Sortie</span><span class="value">${new Date(sortie.dateSortie).toLocaleString('fr-FR')}</span></div>
          </div>
          <div class="montant-box">
            <div class="montant-label">MONTANT PAYÉ</div>
            <div class="montant-value">${sortie.montant.toLocaleString('fr-FR')} Ar</div>
          </div>
          <p style="font-size:13px;color:#555;text-align:center">Merci de votre confiance. À bientôt !</p>
        </div>
        <div class="footer">© 2025 Parking Manager — Message automatique</div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `Parking Manager <${process.env.SMTP_USER}>`,
    to: client.mail,
    subject: `🅿️ Sortie — ${sortie.montant.toLocaleString('fr-FR')} Ar | Parking Manager`,
    html
  })
  console.log(`📧 Email sortie envoyé à ${client.mail}`)
}

module.exports = { sendEntreeEmail, sendSortieEmail }