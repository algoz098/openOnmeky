// Configuracao do servico de Seed
import { authenticate } from '@feathersjs/authentication'
import type { Application, HookContext } from '../../declarations'
import { SeedService } from './seed.class'
import { requireSuperAdmin } from '../../hooks/check-permissions'

export const seedPath = 'seed'
export const seedMethods = ['find', 'create'] as const

export * from './seed.class'
export * from './seed.schema'

/**
 * Hook condicional que aplica autenticacao apenas para chamadas externas (com provider).
 * Chamadas internas (sem provider) sao permitidas, ex: onboarding service.
 */
const authenticateExternal = async (context: HookContext, next: () => Promise<void>) => {
  if (context.params.provider) {
    // Chamada externa - requer autenticacao
    return authenticate('jwt')(context, next)
  }
  // Chamada interna - permitir
  return next()
}

/**
 * Hook condicional que verifica super-admin apenas para chamadas externas.
 */
const requireSuperAdminExternal = async (context: HookContext) => {
  if (context.params.provider) {
    // Chamada externa - requer super-admin
    return requireSuperAdmin(context)
  }
  // Chamada interna - permitir
  return context
}

export const seed = (app: Application) => {
  app.use(seedPath, new SeedService(app), {
    methods: seedMethods,
    events: []
  })

  // Seed requer super-admin para chamadas externas
  // Chamadas internas (sem provider) sao permitidas para onboarding
  app.service(seedPath).hooks({
    around: {
      all: [authenticateExternal]
    },
    before: {
      all: [requireSuperAdminExternal]
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [seedPath]: SeedService
  }
}
