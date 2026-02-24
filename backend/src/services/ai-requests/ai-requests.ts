// Configuracao do servico ai-requests (somente leitura via API)
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { Forbidden } from '@feathersjs/errors'
import type { Application } from '../../declarations'
import { AIRequestsService, getOptions } from './ai-requests.class'
import {
  aiRequestQueryValidator,
  aiRequestQueryResolver,
  aiRequestResolver,
  aiRequestExternalResolver
} from './ai-requests.schema'

export const aiRequestsPath = 'ai-requests'
// IMPORTANTE: Somente find e get sao expostos via API
export const aiRequestsMethods = ['find', 'get'] as const

export * from './ai-requests.class'
export * from './ai-requests.schema'

export const aiRequests = (app: Application) => {
  app.use(aiRequestsPath, new AIRequestsService(getOptions(app)), {
    methods: aiRequestsMethods,
    events: []
  })

  app.service(aiRequestsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(aiRequestExternalResolver),
        schemaHooks.resolveResult(aiRequestResolver)
      ]
    },
    before: {
      all: [],
      find: [
        schemaHooks.validateQuery(aiRequestQueryValidator),
        schemaHooks.resolveQuery(aiRequestQueryResolver)
      ],
      get: [],
      // Bloqueia create/patch/remove via API
      create: [
        async () => {
          throw new Forbidden('Operacao nao permitida via API')
        }
      ],
      patch: [
        async () => {
          throw new Forbidden('Operacao nao permitida via API')
        }
      ],
      remove: [
        async () => {
          throw new Forbidden('Operacao nao permitida via API')
        }
      ]
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
    [aiRequestsPath]: AIRequestsService
  }
}
