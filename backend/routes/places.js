const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { etat, typePlace } = req.query;
    let query = 'SELECT * FROM "PLACE_PARKING"';
    const params = [];
    const conditions = [];
    if (etat)      { conditions.push(`"etat"=$${params.length+1}`);      params.push(etat); }
    if (typePlace) { conditions.push(`"typePlace"=$${params.length+1}`);  params.push(typePlace); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY "numeroPlace" ASC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "PLACE_PARKING" WHERE "idPlace"=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Place non trouvée' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { numeroPlace, typePlace } = req.body;
  if (!numeroPlace || !typePlace)
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  try {
    const idPlace = uuidv4();
    await db.query(
      'INSERT INTO "PLACE_PARKING" ("idPlace","numeroPlace","etat","typePlace") VALUES ($1,$2,$3,$4)',
      [idPlace, numeroPlace, 'Libre', typePlace]
    );
    const result = await db.query('SELECT * FROM "PLACE_PARKING" WHERE "idPlace"=$1', [idPlace]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ success: false, message: 'Ce numéro de place existe déjà' });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { numeroPlace, typePlace } = req.body;
  try {
    await db.query(
      'UPDATE "PLACE_PARKING" SET "numeroPlace"=$1,"typePlace"=$2 WHERE "idPlace"=$3',
      [numeroPlace, typePlace, req.params.id]
    );
    const result = await db.query('SELECT * FROM "PLACE_PARKING" WHERE "idPlace"=$1', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query('SELECT "etat" FROM "PLACE_PARKING" WHERE "idPlace"=$1', [req.params.id]);
    if (check.rows[0]?.etat === 'Occupée')
      return res.status(400).json({ success: false, message: 'Impossible de supprimer une place occupée' });
    await db.query('DELETE FROM "PLACE_PARKING" WHERE "idPlace"=$1', [req.params.id]);
    res.json({ success: true, message: 'Place supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
