import { defineStore } from 'pinia'

export interface UserRecord {
  id: number
  email: string
  role?: string
  created_at?: string
  updated_at?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserRecord | null,
    initialized: false,
    lastAuthCheck: 0,
    loading: false,
    error: '',
    hasAdmin: true
  }),
  getters: {
    isAuthenticated: state => !!state.user
  },
  actions: {
    setUser(user: UserRecord | null) {
      this.user = user
    },

    setHasAdmin(value: boolean) {
      this.hasAdmin = value
    },

    setLoading(value: boolean) {
      this.loading = value
    },

    setError(value: string) {
      this.error = value
    },

    markInitialized() {
      this.initialized = true
      this.lastAuthCheck = Date.now()
    },

    clearAuth(initialized = true) {
      this.user = null
      this.initialized = initialized
      this.lastAuthCheck = Date.now()
    }
  }
})
