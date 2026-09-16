import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  fullName: string
  displayName: string
  profilePhotoUrl?: string
  roles: string[]
  emailVerified: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (updates: Partial<User>) => void
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      hasRole: (role: string) =>
        get().user?.roles?.includes(role) ?? false,

      isAdmin: () => {
        const roles = get().user?.roles ?? []
        return roles.some(r =>
          ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'TOURNAMENT_ADMIN'].includes(r)
        )
      },
    }),
    {
      name: 'tournament-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
