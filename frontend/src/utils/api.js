import axios from 'axios'

const api = axios.create({
  // En dev : proxy Vite vers localhost:3000
  // En prod : variable d'environnement VITE_API_URL
  baseURL: import.meta.env.VITE_API_URL || '/api',
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