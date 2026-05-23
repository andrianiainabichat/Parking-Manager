const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const { sendSortieEmail } = require('../middleware/emailService');

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT s.*, v."matricule", v."marque", v."couleur",
             c."nom" as "nomClient", c."mail" as "mailClient",
             p."numeroPlace", p."typePlace",
             e."dateEntree", e."motif"
      FROM "SORTIE" s
      JOIN "VOITURE" v ON s."idVoiture" = v."idVoiture"
      JOIN "CLIENT" c ON v."idClient" = c."idClient"
      JOIN "PLACE_PARKING" p ON s."idPlace" = p."idPlace"
      JOIN "ENTREE" e ON s."idEntree" = e."idEntree"
    `;
    const params = [];
    if (date) { query += ' WHERE DATE(s."dateSortie") = $1'; params.push(date); }
    query += ' ORDER BY s."dateSortie" DESC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/recette', async (req, res) => {
  try {
    const global = await db.query(`
      SELECT
        COALESCE(SUM("montant"),0) as "recetteTotale",
        COUNT(*) as "nbSorties",
        COALESCE(AVG("montant"),0) as "moyennePaiement",
        COALESCE(AVG("duree"),0) as "moyenneDuree",
        MIN("dateSortie") as "premiereSortie",
        MAX("dateSortie") as "derniereSortie"
      FROM "SORTIE"
    `);
    const parMois = await db.query(`
      SELECT TO_CHAR("dateSortie",'YYYY-MM') as "mois", SUM("montant") as "total", COUNT(*) as "nb"
      FROM "SORTIE"
      GROUP BY "mois"
      ORDER BY "mois" DESC
      LIMIT 12
    `);
    res.json({ success: true, data: { global: global.rows[0], parMois: parMois.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { idEntree } = req.body;
  if (!idEntree)
    return res.status(400).json({ success: false, message: 'idEntree requis' });
  try {
    const entreeRows = await db.query(
      `SELECT e.*, v."idVoiture", v."matricule", v."marque", v."couleur",
              c."idClient", c."nom" as "nomClient", c."mail" as "mailClient",
              p."idPlace", p."numeroPlace", p."typePlace"
       FROM "ENTREE" e
       JOIN "VOITURE" v ON e."idVoiture"=v."idVoiture"
       JOIN "CLIENT" c ON v."idClient"=c."idClient"
       JOIN "PLACE_PARKING" p ON e."idPlace"=p."idPlace"
       WHERE e."idEntree"=$1`,
      [idEntree]
    );
    if (!entreeRows.rows.length)
      return res.status(404).json({ success: false, message: 'Entrée non trouvée' });

    const existingSortie = await db.query('SELECT "idSortie" FROM "SORTIE" WHERE "idEntree"=$1', [idEntree]);
    if (existingSortie.rows.length)
      return res.status(400).json({ success: false, message: 'Une sortie existe déjà pour cette entrée' });

    const entree = entreeRows.rows[0];
    const dateSortie = new Date();
    const dateEntree = new Date(entree.dateEntree);
    const dureeMs = dateSortie - dateEntree;
    const dureeMin = Math.ceil(dureeMs / 60000);

    let tarifRows = await db.query(
      'SELECT * FROM "TARIF" WHERE "dureeMin" <= $1 AND "dureeMax" >= $2',
      [dureeMin, dureeMin]
    );
    let montant = 0;
    if (tarifRows.rows.length) {
      montant = tarifRows.rows[0].prix;
    } else {
      const maxTarif = await db.query('SELECT * FROM "TARIF" ORDER BY "dureeMax" DESC LIMIT 1');
      if (maxTarif.rows.length) montant = maxTarif.rows[0].prix;
    }

    const idSortie = uuidv4();
    await db.query(
      'INSERT INTO "SORTIE" ("idSortie","idVoiture","idPlace","idEntree","dateSortie","duree","montant") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [idSortie, entree.idVoiture, entree.idPlace, idEntree, dateSortie, dureeMin, montant]
    );
    await db.query('UPDATE "PLACE_PARKING" SET "etat"=$1 WHERE "idPlace"=$2', ['Libre', entree.idPlace]);

    const sortieData = await db.query(
      `SELECT s.*, v."matricule", v."marque", c."nom" as "nomClient", c."mail" as "mailClient", p."numeroPlace"
       FROM "SORTIE" s
       JOIN "VOITURE" v ON s."idVoiture"=v."idVoiture"
       JOIN "CLIENT" c ON v."idClient"=c."idClient"
       JOIN "PLACE_PARKING" p ON s."idPlace"=p."idPlace"
       WHERE s."idSortie"=$1`,
      [idSortie]
    );

    sendSortieEmail(
      { nom: entree.nomClient, mail: entree.mailClient },
      { marque: entree.marque, matricule: entree.matricule },
      { numeroPlace: entree.numeroPlace },
      { dateSortie, duree: dureeMin, montant }
    ).catch(err => console.error('Email error:', err.message));

    res.status(201).json({ success: true, data: sortieData.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM "SORTIE" WHERE "idSortie"=$1', [req.params.id]);
    res.json({ success: true, message: 'Sortie supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PDF relevé mensuel
router.get('/releve/pdf', async (req, res) => {
  const { idVoiture, mois } = req.query;
  if (!idVoiture || !mois)
    return res.status(400).json({ success: false, message: 'idVoiture et mois requis' });
  try {
    const voitureRows = await db.query(
      `SELECT v.*, c."nom" as "nomClient", c."telephone", c."mail"
       FROM "VOITURE" v JOIN "CLIENT" c ON v."idClient"=c."idClient" WHERE v."idVoiture"=$1`,
      [idVoiture]
    );
    if (!voitureRows.rows.length)
      return res.status(404).json({ success: false, message: 'Voiture non trouvée' });

    const voiture = voitureRows.rows[0];
    const sorties = await db.query(
      `SELECT s.*, e."dateEntree"
       FROM "SORTIE" s
       JOIN "ENTREE" e ON s."idEntree"=e."idEntree"
       WHERE s."idVoiture"=$1 AND TO_CHAR(s."dateSortie",'YYYY-MM')=$2
       ORDER BY s."dateSortie" ASC`,
      [idVoiture, mois]
    );

    const rows = sorties.rows;
    const totalMontant = rows.reduce((sum, s) => sum + parseInt(s.montant), 0);
    const [annee, moisNum] = mois.split('-');
    const nomMois = new Date(annee, moisNum - 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=releve_${mois}_${voiture.matricule.replace(' ', '_')}.pdf`);
    doc.pipe(res);

    doc.rect(0, 0, 612, 80).fill('#1a1a2e');
    doc.fillColor('#e8b84b').fontSize(22).font('Helvetica-Bold').text('PARKING MANAGER', 50, 20);
    doc.fillColor('#a0a0b0').fontSize(11).font('Helvetica').text('Relevé de Stationnement', 50, 48);
    doc.fillColor('white').fontSize(10).text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 400, 35);

    doc.fillColor('#1a1a2e').fontSize(14).font('Helvetica-Bold').text(`Période : ${nomMois}`, 50, 100);
    doc.moveTo(50, 118).lineTo(562, 118).strokeColor('#e8b84b').lineWidth(2).stroke();

    doc.fillColor('#333').fontSize(10).font('Helvetica');
    doc.text(`Client : ${voiture.nomClient}`, 50, 130);
    doc.text(`Téléphone : ${voiture.telephone}`, 50, 148);
    doc.text(`Email : ${voiture.mail}`, 50, 166);
    doc.text(`Véhicule : ${voiture.marque}`, 300, 130);
    doc.text(`Matricule : ${voiture.matricule}`, 300, 148);
    doc.text(`Couleur : ${voiture.couleur} — Type : ${voiture.type}`, 300, 166);

    const tableTop = 210;
    const col = [50, 140, 240, 340, 420, 510];
    const headers = ['Date', 'Heure Entrée', 'Heure Sortie', 'Durée', 'Montant (Ar)'];

    doc.rect(50, tableTop - 4, 512, 22).fill('#1a1a2e');
    doc.fillColor('#e8b84b').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, col[i], tableTop + 1, { width: col[i+1] - col[i] - 5 }));

    let y = tableTop + 26;
    rows.forEach((s, idx) => {
      const h = Math.floor(s.duree / 60); const m = s.duree % 60;
      const dureeStr = h > 0 ? `${h}h${m > 0 ? m+'min' : ''}` : `${m}min`;
      if (idx % 2 === 0) doc.rect(50, y - 2, 512, 18).fill('#f8f9fa');
      doc.fillColor('#333').fontSize(9).font('Helvetica');
      doc.text(new Date(s.dateSortie).toLocaleDateString('fr-FR'), col[0], y, { width: 85 });
      doc.text(new Date(s.dateEntree).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }), col[1], y, { width: 95 });
      doc.text(new Date(s.dateSortie).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }), col[2], y, { width: 95 });
      doc.text(dureeStr, col[3], y, { width: 75 });
      doc.text(parseInt(s.montant).toLocaleString('fr-FR') + ' Ar', col[4], y, { width: 90 });
      y += 20;
    });

    doc.moveTo(50, y + 5).lineTo(562, y + 5).strokeColor('#e8b84b').lineWidth(1.5).stroke();
    doc.rect(380, y + 10, 182, 30).fill('#1a1a2e');
    doc.fillColor('#a0a0b0').fontSize(10).font('Helvetica').text('TOTAL PAYÉ', 390, y + 14);
    doc.fillColor('#e8b84b').fontSize(14).font('Helvetica-Bold').text(`${totalMontant.toLocaleString('fr-FR')} Ar`, 390, y + 14, { align: 'right', width: 162 });
    doc.fillColor('#999').fontSize(8).font('Helvetica').text('Parking Manager — Document généré automatiquement', 50, 780, { align: 'center', width: 512 });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
