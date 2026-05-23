const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "TARIF" ORDER BY "dureeMin" ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/calculate/:duree', async (req, res) => {
  try {
    const duree = parseInt(req.params.duree);
    let result = await db.query(
      'SELECT * FROM "TARIF" WHERE "dureeMin" <= $1 AND "dureeMax" >= $2 LIMIT 1',
      [duree, duree]
    );
    if (!result.rows.length) {
      result = await db.query('SELECT * FROM "TARIF" ORDER BY "dureeMax" DESC LIMIT 1');
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { dureeMin, dureeMax, prix } = req.body;
  if (!dureeMin || !dureeMax || !prix)
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  if (parseInt(dureeMin) >= parseInt(dureeMax))
    return res.status(400).json({ success: false, message: 'Durée min doit être inférieure à durée max' });
  try {
    const idTarif = uuidv4();
    await db.query(
      'INSERT INTO "TARIF" ("idTarif","dureeMin","dureeMax","prix") VALUES ($1,$2,$3,$4)',
      [idTarif, dureeMin, dureeMax, prix]
    );
    const result = await db.query('SELECT * FROM "TARIF" WHERE "idTarif"=$1', [idTarif]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { dureeMin, dureeMax, prix } = req.body;
  try {
    await db.query(
      'UPDATE "TARIF" SET "dureeMin"=$1,"dureeMax"=$2,"prix"=$3 WHERE "idTarif"=$4',
      [dureeMin, dureeMax, prix, req.params.id]
    );
    const result = await db.query('SELECT * FROM "TARIF" WHERE "idTarif"=$1', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM "TARIF" WHERE "idTarif"=$1', [req.params.id]);
    res.json({ success: true, message: 'Tarif supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
