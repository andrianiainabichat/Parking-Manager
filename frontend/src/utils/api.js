import axios from 'axios'

const isProd = window.location.hostname !== 'localhost'
const baseURL = isProd
  ? 'https://parking-manager-api.onrender.com/api'
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 60000, // ← 60 secondes au lieu de 15
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pm_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Erreur réseau'
    return Promise.reject(new Error(msg))
  }
)

export default api