import { useAuthStore, type UserRecord } from 'src/stores/auth-store'
import { useFeathers } from './use-feathers'

const getStoredToken = () => {
  try {
    return window.localStorage.getItem('feathers-jwt')
  } catch {
    return null
  }
}

export function useAuthApi() {
  const authStore = useAuthStore()
  const { api } = useFeathers()

  const checkBootstrap = async () => {
    try {
      const status = await api.service('onboarding').find()
      const needsOnboarding = status?.needsOnboarding ?? false
      authStore.setHasAdmin(!needsOnboarding)
      return !needsOnboarding
    } catch {
      authStore.setHasAdmin(true)
      return true
    }
  }

  const initAuth = async (force = false) => {
    if (authStore.initialized && !force) return

    const token = getStoredToken()
    if (!token) {
      authStore.clearAuth(true)
      return
    }

    try {
      const result = await api.reAuthenticate()
      authStore.setUser((result.user || null) as UserRecord | null)
    } catch {
      authStore.clearAuth(true)
    } finally {
      authStore.markInitialized()
    }
  }

  const ensureAuth = async () => {
    const token = getStoredToken()
    if (!token) {
      authStore.clearAuth(true)
      return
    }

    if (!authStore.initialized || !authStore.user) {
      await initAuth(true)
      return
    }

    const ageMs = Date.now() - authStore.lastAuthCheck
    if (ageMs > 60_000) {
      await initAuth(true)
    }
  }

  const login = async (email: string, password: string) => {
    authStore.setLoading(true)
    authStore.setError('')
    try {
      const result = await api.authenticate({ strategy: 'local', email, password })
      authStore.setUser((result.user || null) as UserRecord | null)
      authStore.markInitialized()
      return result
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      authStore.setError(message)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    authStore.setLoading(true)
    authStore.setError('')
    try {
      await api.service('users').create({ email, password })
      return login(email, password)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar'
      authStore.setError(message)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  const logout = async () => {
    await api.logout()
    authStore.clearAuth(false)
  }

  return {
    checkBootstrap,
    initAuth,
    ensureAuth,
    login,
    register,
    logout
  }
}
