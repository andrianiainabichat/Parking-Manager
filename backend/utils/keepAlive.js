const https = require('https')

const RENDER_URL = process.env.RENDER_EXTERNAL_URL

function keepAlive() {
  if (!RENDER_URL) return // seulement en production

  setInterval(() => {
    const url = `${RENDER_URL}/api/health`
    https.get(url, (res) => {
      console.log(`🔄 Keep-alive ping → ${res.statusCode}`)
    }).on('error', (err) => {
      console.error('Keep-alive error:', err.message)
    })
  }, 10 * 60 * 1000) // ping toutes les 10 minutes
}

module.exports = keepAlive