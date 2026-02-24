// Configuracao do servico de Brand Values
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { BrandValuesService, getOptions } from './brand-values.class'
import {
  brandValueDataValidator,
  brandValuePatchValidator,
  brandValueQueryValidator,
  brandValueResolver,
  brandValueExternalResolver,
  brandValueDataResolver,
  brandValuePatchResolver,
  brandValueQueryResolver
} from './brand-values.schema'
import { filterByUserBrands, verifyBrandOwnership, verifyBrandAccess } from '../../hooks/filter-by-user'

export const brandValuesPath = 'brand-values'
export const brandValuesMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './brand-values.class'
export * from './brand-values.schema'

export const brandValues = (app: Application) => {
  app.use(brandValuesPath, new BrandValuesService(getOptions(app)), {
    methods: brandValuesMethods,
    events: []
  })

  app.service(brandValuesPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(brandValueExternalResolver),
        schemaHooks.resolveResult(brandValueResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(brandValueQueryValidator),
        schemaHooks.resolveQuery(brandValueQueryResolver)
      ],
      find: [filterByUserBrands],
      get: [verifyBrandAccess],
      create: [
        verifyBrandOwnership,
        schemaHooks.validateData(brandValueDataValidator),
        schemaHooks.resolveData(brandValueDataResolver)
      ],
      patch: [
        verifyBrandAccess,
        schemaHooks.validateData(brandValuePatchValidator),
        schemaHooks.resolveData(brandValuePatchResolver)
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
    [brandValuesPath]: BrandValuesService
  }
}
