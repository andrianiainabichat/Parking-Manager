import axios from 'axios'

// En production : VITE_API_URL doit être défini sur Vercel
// En développement : proxy Vite vers localhost:3000
const baseURL = import.meta.env.VITE_API_URL || '/api'

console.log('API baseURL:', baseURL) // Pour déboguer

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Erreur réseau'
    return Promise.reject(new Error(msg))
  }
)

export default api