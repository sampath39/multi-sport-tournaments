import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const API_URL = rawApiUrl.replace(/\/+$/, '')

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000,
})

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 with token refresh
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { refreshToken } = useAuthStore.getState()
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken })
        const { accessToken, user } = data

        useAuthStore.getState().setAuth(user, accessToken, refreshToken)
        onRefreshed(accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }

    // Handle timeout error
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      toast.error('Server is waking up (Render free tier). Please retry in 10-20 seconds!')
      return Promise.reject(error)
    }

    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      const message = error.response?.data?.message || error.message || 'An error occurred'
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

// ─── API Functions ────────────────────────────────────────────────────────────

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}

// Sports
export const sportsApi = {
  list: () => api.get('/sports').then(r => r.data),
  getAll: () => api.get('/sports').then(r => r.data),
  get: (id: string) => api.get(`/sports/${id}`).then(r => r.data),
}

// Tournaments
export const tournamentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/tournaments', { params }).then(r => r.data),
  get: (id: string) => api.get(`/tournaments/${id}`).then(r => r.data),
  getById: (id: string) => api.get(`/tournaments/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/tournaments', data).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/tournaments/${id}`, data).then(r => r.data),
  publish: (id: string) => api.post(`/tournaments/${id}/publish`).then(r => r.data),
  start: (id: string) => api.post(`/tournaments/${id}/publish`).then(r => r.data),
  addParticipant: (id: string, data: unknown) =>
    api.post(`/tournaments/${id}/participants`, data).then(r => r.data),
  addTeamMember: (tournamentId: string, participantId: string, data: unknown) =>
    api.post(`/tournaments/${tournamentId}/participants/${participantId}/members`, data).then(r => r.data),
  removeTeamMember: (tournamentId: string, participantId: string, memberId: string) =>
    api.delete(`/tournaments/${tournamentId}/participants/${participantId}/members/${memberId}`).then(r => r.data),
  getParticipants: (id: string) =>
    api.get(`/tournaments/${id}/participants`).then(r => r.data),
  generateRound: (id: string) =>
    api.post(`/tournaments/${id}/rounds/generate`).then(r => r.data),
  generateFixtures: (id: string) =>
    api.post(`/tournaments/${id}/rounds/generate`).then(r => r.data),
  getRounds: (id: string) => api.get(`/tournaments/${id}/rounds`).then(r => r.data),
  getStandings: (id: string) => api.get(`/tournaments/${id}/standings`).then(r => r.data),
  getBracket: (id: string) => api.get(`/tournaments/${id}/bracket`).then(r => r.data),
  getFixtures: (id: string) => api.get(`/tournaments/${id}/fixtures`).then(r => r.data),
  getMatches: (id: string) => api.get(`/tournaments/${id}/fixtures`).then(r => r.data),
}

// Matches
export const matchesApi = {
  get: (id: string) => api.get(`/matches/${id}`).then(r => r.data),
  getById: (id: string) => api.get(`/matches/${id}`).then(r => r.data),
  updateScore: (id: string, data: unknown) =>
    api.post(`/matches/${id}/score`, data).then(r => r.data),
  complete: (id: string, data: unknown) =>
    api.post(`/matches/${id}/complete`, data).then(r => r.data),
  addEvent: (id: string, data: unknown) =>
    api.post(`/matches/${id}/events`, data).then(r => r.data),
}

// Standings
export const standingsApi = {
  getByTournament: (id: string) => api.get(`/tournaments/${id}/standings`).then(r => r.data),
}

// Players
export const playersApi = {
  get: (id: string) => api.get(`/players/${id}`).then(r => r.data),
  list: (params?: Record<string, unknown>) =>
    api.get('/players', { params }).then(r => r.data),
}

// Venues
export const venuesApi = {
  list: () => api.get('/venues').then(r => r.data),
  get: (id: string) => api.get(`/venues/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/venues', data).then(r => r.data),
}
