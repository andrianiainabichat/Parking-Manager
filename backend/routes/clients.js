const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET all clients
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, COUNT(v."idVoiture") as "nbVoitures"
      FROM "CLIENT" c
      LEFT JOIN "VOITURE" v ON c."idClient" = v."idClient"
      GROUP BY c."idClient"
      ORDER BY c."nom" ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "CLIENT" WHERE "idClient" = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Client non trouvé' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create client
router.post('/', async (req, res) => {
  const { nom, sexe, age, telephone, mail } = req.body;
  if (!nom || !sexe || !age || !telephone || !mail)
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  try {
    const idClient = uuidv4();
    await db.query(
      'INSERT INTO "CLIENT" ("idClient","nom","sexe","age","telephone","mail") VALUES ($1,$2,$3,$4,$5,$6)',
      [idClient, nom, sexe, age, telephone, mail]
    );
    const result = await db.query('SELECT * FROM "CLIENT" WHERE "idClient" = $1', [idClient]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ success: false, message: 'Cet email existe déjà' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update client
router.put('/:id', async (req, res) => {
  const { nom, sexe, age, telephone, mail } = req.body;
  try {
    await db.query(
      'UPDATE "CLIENT" SET "nom"=$1,"sexe"=$2,"age"=$3,"telephone"=$4,"mail"=$5 WHERE "idClient"=$6',
      [nom, sexe, age, telephone, mail, req.params.id]
    );
    const result = await db.query('SELECT * FROM "CLIENT" WHERE "idClient" = $1', [req.params.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM "CLIENT" WHERE "idClient" = $1', [req.params.id]);
    res.json({ success: true, message: 'Client supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
