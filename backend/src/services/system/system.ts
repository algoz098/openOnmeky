// Configuracao do servico de System
import { authenticate } from '@feathersjs/authentication'
import type { Application, HookContext } from '../../declarations'
import { SystemService } from './system.class'
import { requireAdmin } from '../../hooks/check-permissions'

export const systemPath = 'system'
export const systemMethods = ['find'] as const

export * from './system.class'
export * from './system.schema'

/**
 * Hook condicional que aplica autenticacao apenas para chamadas externas (com provider).
 * Chamadas internas (sem provider) sao permitidas, ex: onboarding service.
 */
const authenticateExternal = async (context: HookContext, next: () => Promise<void>) => {
  if (context.params.provider) {
    return authenticate('jwt')(context, next)
  }
  return next()
}

/**
 * Hook condicional que verifica admin apenas para chamadas externas.
 */
const requireAdminExternal = async (context: HookContext) => {
  if (context.params.provider) {
    return requireAdmin(context)
  }
  return context
}

export const system = (app: Application) => {
  app.use(systemPath, new SystemService(app), {
    methods: systemMethods,
    events: []
  })

  // System info requer admin para chamadas externas
  // Chamadas internas (sem provider) sao permitidas para onboarding
  app.service(systemPath).hooks({
    around: {
      all: [authenticateExternal]
    },
    before: {
      all: [requireAdminExternal]
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [systemPath]: SystemService
  }
}
