// Configuracao do servico de AI para Feathers
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { AIService, getOptions } from './ai.class'
import { aiPath, aiMethods } from './ai.shared'
import { aiDataValidator, aiDataResolver } from './ai.schema'

export * from './ai.class'
export * from './ai.schema'
export * from './ai.shared'

// Funcao de configuracao que registra o servico
export const ai = (app: Application) => {
  // Registra o servico na aplicacao Feathers
  app.use(aiPath, new AIService(getOptions(app)), {
    methods: aiMethods,
    events: []
  })

  // Configura hooks do servico
  app.service(aiPath).hooks({
    around: {
      all: [],
      create: [authenticate('jwt')]
    },
    before: {
      all: [],
      create: [schemaHooks.validateData(aiDataValidator), schemaHooks.resolveData(aiDataResolver)]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Adiciona o servico ao indice de tipos
declare module '../../declarations' {
  interface ServiceTypes {
    [aiPath]: AIService
  }
}
