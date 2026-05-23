const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const authMiddleware = require('./middleware/auth')

// CORS : accepte le frontend Vercel + localhost en dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, mobile)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS bloqué pour : ${origin}`))
  },
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes publiques
app.use('/api/auth', require('./routes/auth'))

// Routes protégées
app.use('/api/clients',  authMiddleware, require('./routes/clients'))
app.use('/api/voitures', authMiddleware, require('./routes/voitures'))
app.use('/api/places',   authMiddleware, require('./routes/places'))
app.use('/api/tarifs',   authMiddleware, require('./routes/tarifs'))
app.use('/api/entrees',  authMiddleware, require('./routes/entrees'))
app.use('/api/sorties',  authMiddleware, require('./routes/sorties'))

// Dashboard protégé
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const db = require('./config/db')
  try {
    const clients      = await db.query('SELECT COUNT(*) as total FROM "CLIENT"')
    const voitures     = await db.query('SELECT COUNT(*) as total FROM "VOITURE"')
    const placesLibres = await db.query(`SELECT COUNT(*) as total FROM "PLACE_PARKING" WHERE "etat"='Libre'`)
    const placesTotal  = await db.query('SELECT COUNT(*) as total FROM "PLACE_PARKING"')
    const recette      = await db.query(`SELECT COALESCE(SUM("montant"),0) as total FROM "SORTIE"`)
    const entreesAuj   = await db.query(`SELECT COUNT(*) as total FROM "ENTREE" WHERE DATE("dateEntree")=CURRENT_DATE`)
    const sortiesAuj   = await db.query(`SELECT COUNT(*) as total FROM "SORTIE" WHERE DATE("dateSortie")=CURRENT_DATE`)

    const vehiculesPresents = await db.query(`
      SELECT e."idEntree", v."matricule", v."marque", v."couleur", v."type",
             c."nom" as "nomClient", p."numeroPlace", p."typePlace",
             e."dateEntree", e."motif"
      FROM "ENTREE" e
      LEFT JOIN "SORTIE" s ON s."idEntree" = e."idEntree"
      JOIN "VOITURE" v ON e."idVoiture" = v."idVoiture"
      JOIN "CLIENT" c ON v."idClient" = c."idClient"
      JOIN "PLACE_PARKING" p ON e."idPlace" = p."idPlace"
      WHERE s."idSortie" IS NULL
      ORDER BY e."dateEntree" ASC
    `)

    const recetteMois = await db.query(`
      SELECT TO_CHAR("dateSortie",'YYYY-MM') as "mois", SUM("montant") as "total"
      FROM "SORTIE"
      GROUP BY "mois" ORDER BY "mois" DESC LIMIT 6
    `)

    const total  = parseInt(placesTotal.rows[0].total)
    const libres = parseInt(placesLibres.rows[0].total)

    res.json({
      success: true,
      data: {
        clients:           parseInt(clients.rows[0].total),
        voitures:          parseInt(voitures.rows[0].total),
        placesLibres:      libres,
        placesTotal:       total,
        placesOccupees:    total - libres,
        recetteTotale:     parseInt(recette.rows[0].total),
        entreesAujourdhui: parseInt(entreesAuj.rows[0].total),
        sortiesAujourdhui: parseInt(sortiesAuj.rows[0].total),
        vehiculesPresents: vehiculesPresents.rows,
        recetteMois:       recetteMois.rows
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Parking Manager API opérationnel',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} non trouvée` })
})

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.message)
  res.status(500).json({ success: false, message: err.message })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`\n🅿️  Parking Manager API → http://localhost:${PORT}`)
  console.log(`🌍  Environnement : ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗  CORS autorisé : ${allowedOrigins.join(', ')}\n`)
  // Keep-alive pour Render Free Plan
const keepAlive = require('./utils/keepAlive')
keepAlive()
})