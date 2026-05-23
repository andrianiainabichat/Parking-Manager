const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT v.*, c."nom" as "nomClient", c."mail" as "mailClient", c."telephone" as "telClient"
      FROM "VOITURE" v
      JOIN "CLIENT" c ON v."idClient" = c."idClient"
    `;
    const params = [];
    if (search) {
      query += ' WHERE v."matricule" ILIKE $1 OR v."marque" ILIKE $2';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY v."marque" ASC';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT v.*, c."nom" as "nomClient" FROM "VOITURE" v JOIN "CLIENT" c ON v."idClient"=c."idClient" WHERE v."idVoiture"=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Voiture non trouvée' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { matricule, marque, couleur, type, idClient } = req.body;
  if (!matricule || !marque || !couleur || !type || !idClient)
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  try {
    const idVoiture = uuidv4();
    await db.query(
      'INSERT INTO "VOITURE" ("idVoiture","matricule","marque","couleur","type","idClient") VALUES ($1,$2,$3,$4,$5,$6)',
      [idVoiture, matricule, marque, couleur, type, idClient]
    );
    const result = await db.query(
      `SELECT v.*, c."nom" as "nomClient" FROM "VOITURE" v JOIN "CLIENT" c ON v."idClient"=c."idClient" WHERE v."idVoiture"=$1`,
      [idVoiture]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ success: false, message: 'Ce matricule existe déjà' });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { matricule, marque, couleur, type, idClient } = req.body;
  try {
    await db.query(
      'UPDATE "VOITURE" SET "matricule"=$1,"marque"=$2,"couleur"=$3,"type"=$4,"idClient"=$5 WHERE "idVoiture"=$6',
      [matricule, marque, couleur, type, idClient, req.params.id]
    );
    const result = await db.query(
      `SELECT v.*, c."nom" as "nomClient" FROM "VOITURE" v JOIN "CLIENT" c ON v."idClient"=c."idClient" WHERE v."idVoiture"=$1`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM "VOITURE" WHERE "idVoiture"=$1', [req.params.id]);
    res.json({ success: true, message: 'Voiture supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
