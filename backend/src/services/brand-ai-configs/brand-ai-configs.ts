// Configuracao do servico de Brand AI Configs
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { BrandAiConfigsService, getOptions } from './brand-ai-configs.class'
import {
  brandAiConfigDataValidator,
  brandAiConfigPatchValidator,
  brandAiConfigQueryValidator,
  brandAiConfigResolver,
  brandAiConfigExternalResolver,
  brandAiConfigDataResolver,
  brandAiConfigPatchResolver,
  brandAiConfigQueryResolver
} from './brand-ai-configs.schema'
import { filterByUserBrands, verifyBrandOwnership, verifyBrandAccess } from '../../hooks/filter-by-user'

export const brandAiConfigsPath = 'brand-ai-configs'
export const brandAiConfigsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './brand-ai-configs.class'
export * from './brand-ai-configs.schema'

export const brandAiConfigs = (app: Application) => {
  app.use(brandAiConfigsPath, new BrandAiConfigsService(getOptions(app)), {
    methods: brandAiConfigsMethods,
    events: []
  })

  app.service(brandAiConfigsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(brandAiConfigExternalResolver),
        schemaHooks.resolveResult(brandAiConfigResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(brandAiConfigQueryValidator),
        schemaHooks.resolveQuery(brandAiConfigQueryResolver)
      ],
      find: [filterByUserBrands],
      get: [verifyBrandAccess],
      create: [
        verifyBrandOwnership,
        schemaHooks.validateData(brandAiConfigDataValidator),
        schemaHooks.resolveData(brandAiConfigDataResolver)
      ],
      patch: [
        verifyBrandAccess,
        schemaHooks.validateData(brandAiConfigPatchValidator),
        schemaHooks.resolveData(brandAiConfigPatchResolver)
      ],
      remove: [verifyBrandAccess]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [brandAiConfigsPath]: BrandAiConfigsService
  }
}
