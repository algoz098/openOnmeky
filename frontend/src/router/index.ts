import { defineRouter } from '#q-app/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import routes from './routes'
import { api } from '../api'

// Cache para evitar chamadas repetidas ao onboarding
let onboardingChecked = false
let needsOnboarding = false

async function checkOnboarding(): Promise<boolean> {
  if (onboardingChecked) return needsOnboarding
  try {
    const result = await api.service('onboarding').find()
    needsOnboarding = result?.needsOnboarding ?? false
    onboardingChecked = true
    return needsOnboarding
  } catch {
    return false
  }
}

// Reset cache quando necessario (ex: apos completar onboarding)
export function resetOnboardingCache() {
  onboardingChecked = false
  needsOnboarding = false
}

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Navigation guard para autenticacao e onboarding
  Router.beforeEach(async (to, _from, next) => {
    const isPublic = to.meta.public === true
    const requiresAuth = to.meta.requiresAuth === true
    const token = localStorage.getItem('feathers-jwt')

    // Verificar se precisa de onboarding
    const shouldOnboard = await checkOnboarding()

    // Se precisa de onboarding, redireciona para /onboarding (exceto se ja esta la)
    if (shouldOnboard && to.path !== '/onboarding') {
      next('/onboarding')
      return
    }

    // Se a rota requer autenticacao e nao ha token, redireciona para login
    if (requiresAuth && !token) {
      next('/login')
      return
    }

    // Se usuario autenticado tenta acessar login, redireciona para dashboard
    // Nota: permite acesso ao /onboarding se needsOnboarding for true
    if (isPublic && token && to.path === '/login') {
      next('/dashboard')
      return
    }

    // Se usuario autenticado tenta acessar onboarding mas NAO precisa de onboarding
    if (isPublic && token && to.path === '/onboarding' && !shouldOnboard) {
      next('/dashboard')
      return
    }

    next()
  })

  return Router
})
