// Configuracao do servico de Platforms
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { HookContext } from '../../declarations'
import type { Application } from '../../declarations'
import { PlatformsService, getOptions } from './platforms.class'
import type { PlatformData } from './platforms.schema'
import {
  platformDataValidator,
  platformPatchValidator,
  platformQueryValidator,
  platformResolver,
  platformExternalResolver,
  platformDataResolver,
  platformPatchResolver,
  platformQueryResolver
} from './platforms.schema'
import { requireAdmin } from '../../hooks/check-permissions'

export const platformsPath = 'platforms'
export const platformsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './platforms.class'
export * from './platforms.schema'

// Hook para serializar features array para JSON string
const serializeFeatures = async (context: HookContext) => {
  const data = context.data as PlatformData
  if (data.features && Array.isArray(data.features)) {
    context.data = {
      ...data,
      features: JSON.stringify(data.features)
    }
  }
  return context
}

// Hook para deserializar features de JSON string para array
const deserializeFeatures = async (context: HookContext) => {
  const deserialize = (platform: Record<string, unknown>) => {
    if (typeof platform.features === 'string') {
      platform.features = JSON.parse(platform.features)
    } else if (!platform.features) {
      platform.features = []
    }
    return platform
  }

  if (context.result) {
    if (Array.isArray(context.result.data)) {
      context.result.data = context.result.data.map(deserialize)
    } else if (context.result.data) {
      context.result = deserialize(context.result as Record<string, unknown>)
    } else {
      context.result = deserialize(context.result as Record<string, unknown>)
    }
  }

  return context
}

export const platforms = (app: Application) => {
  app.use(platformsPath, new PlatformsService(getOptions(app)), {
    methods: platformsMethods,
    events: []
  })

  app.service(platformsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(platformExternalResolver),
        schemaHooks.resolveResult(platformResolver)
      ],
      // Leitura requer autenticacao
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      // Mutacoes requerem admin
      create: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [
        schemaHooks.validateQuery(platformQueryValidator),
        schemaHooks.resolveQuery(platformQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        requireAdmin,
        schemaHooks.validateData(platformDataValidator),
        schemaHooks.resolveData(platformDataResolver),
        serializeFeatures
      ],
      patch: [
        requireAdmin,
        schemaHooks.validateData(platformPatchValidator),
        schemaHooks.resolveData(platformPatchResolver),
        serializeFeatures
      ],
      remove: [requireAdmin]
    },
    after: {
      all: [deserializeFeatures]
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [platformsPath]: PlatformsService
  }
}
