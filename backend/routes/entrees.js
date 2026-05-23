const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendEntreeEmail } = require('../middleware/emailService');

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    let query = `
      SELECT e.*, v."matricule", v."marque", v."couleur",
             c."nom" as "nomClient", c."mail" as "mailClient",
             p."numeroPlace", p."typePlace"
      FROM "ENTREE" e
      JOIN "VOITURE" v ON e."idVoiture" = v."idVoiture"
      JOIN "CLIENT" c ON v."idClient" = c."idClient"
      JOIN "PLACE_PARKING" p ON e."idPlace" = p."idPlace"
    `;
    const params = [];
    if (date) { query += ' WHERE DATE(e."dateEntree") = $1'; params.push(date); }
    query += ' ORDER BY e."dateEntree" DESC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { idVoiture, idPlace, motif } = req.body;
  if (!idVoiture || !idPlace)
    return res.status(400).json({ success: false, message: 'Voiture et place requis' });
  try {
    const placeCheck = await db.query('SELECT * FROM "PLACE_PARKING" WHERE "idPlace"=$1', [idPlace]);
    if (!placeCheck.rows.length) return res.status(404).json({ success: false, message: 'Place non trouvée' });
    if (placeCheck.rows[0].etat === 'Occupée')
      return res.status(400).json({ success: false, message: 'Cette place est déjà occupée' });

    const activeEntree = await db.query(
      `SELECT e."idEntree" FROM "ENTREE" e
       LEFT JOIN "SORTIE" s ON s."idEntree" = e."idEntree"
       WHERE e."idVoiture"=$1 AND s."idSortie" IS NULL`,
      [idVoiture]
    );
    if (activeEntree.rows.length)
      return res.status(400).json({ success: false, message: 'Cette voiture est déjà dans le parking' });

    const idEntree = uuidv4();
    const dateEntree = new Date();

    await db.query(
      'INSERT INTO "ENTREE" ("idEntree","idVoiture","idPlace","dateEntree","motif") VALUES ($1,$2,$3,$4,$5)',
      [idEntree, idVoiture, idPlace, dateEntree, motif || null]
    );
    await db.query('UPDATE "PLACE_PARKING" SET "etat"=$1 WHERE "idPlace"=$2', ['Occupée', idPlace]);

    const entreeData = await db.query(
      `SELECT e.*, v."matricule", v."marque", v."couleur",
              c."nom" as "nomClient", c."mail" as "mailClient", c."telephone",
              p."numeroPlace", p."typePlace"
       FROM "ENTREE" e
       JOIN "VOITURE" v ON e."idVoiture"=v."idVoiture"
       JOIN "CLIENT" c ON v."idClient"=c."idClient"
       JOIN "PLACE_PARKING" p ON e."idPlace"=p."idPlace"
       WHERE e."idEntree"=$1`,
      [idEntree]
    );
    const entry = entreeData.rows[0];

    sendEntreeEmail(
      { nom: entry.nomClient, mail: entry.mailClient },
      { marque: entry.marque, matricule: entry.matricule },
      { numeroPlace: entry.numeroPlace, typePlace: entry.typePlace },
      { idEntree: entry.idEntree, dateEntree: entry.dateEntree, motif: entry.motif }
    ).catch(err => console.error('Email error:', err.message));

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM "ENTREE" WHERE "idEntree"=$1', [req.params.id]);
    if (!rows.rows.length) return res.status(404).json({ success: false, message: 'Entrée non trouvée' });
    await db.query('UPDATE "PLACE_PARKING" SET "etat"=$1 WHERE "idPlace"=$2', ['Libre', rows.rows[0].idPlace]);
    await db.query('DELETE FROM "ENTREE" WHERE "idEntree"=$1', [req.params.id]);
    res.json({ success: true, message: 'Entrée supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
