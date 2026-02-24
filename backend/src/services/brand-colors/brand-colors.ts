// Configuracao do servico de Brand Colors
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { BrandColorsService, getOptions } from './brand-colors.class'
import {
  brandColorDataValidator,
  brandColorPatchValidator,
  brandColorQueryValidator,
  brandColorResolver,
  brandColorExternalResolver,
  brandColorDataResolver,
  brandColorPatchResolver,
  brandColorQueryResolver
} from './brand-colors.schema'
import { filterByUserBrands, verifyBrandOwnership, verifyBrandAccess } from '../../hooks/filter-by-user'

export const brandColorsPath = 'brand-colors'
export const brandColorsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './brand-colors.class'
export * from './brand-colors.schema'

export const brandColors = (app: Application) => {
  app.use(brandColorsPath, new BrandColorsService(getOptions(app)), {
    methods: brandColorsMethods,
    events: []
  })

  app.service(brandColorsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(brandColorExternalResolver),
        schemaHooks.resolveResult(brandColorResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(brandColorQueryValidator),
        schemaHooks.resolveQuery(brandColorQueryResolver)
      ],
      find: [filterByUserBrands],
      get: [verifyBrandAccess],
      create: [
        verifyBrandOwnership,
        schemaHooks.validateData(brandColorDataValidator),
        schemaHooks.resolveData(brandColorDataResolver)
      ],
      patch: [
        verifyBrandAccess,
        schemaHooks.validateData(brandColorPatchValidator),
        schemaHooks.resolveData(brandColorPatchResolver)
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
    [brandColorsPath]: BrandColorsService
  }
}
