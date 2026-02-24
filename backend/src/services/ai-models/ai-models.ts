// Configuracao do servico de ai-models para Feathers
import { authenticate } from '@feathersjs/authentication'
import type { Application } from '../../declarations'
import { AIModelsService, getOptions } from './ai-models.class'

export const aiModelsPath = 'ai-models'
export const aiModelsMethods = ['find'] as const

export * from './ai-models.class'

// Funcao de configuracao que registra o servico
export const aiModels = (app: Application) => {
  // Registra o servico na aplicacao Feathers
  app.use(aiModelsPath, new AIModelsService(getOptions(app)), {
    methods: aiModelsMethods,
    events: []
  })

  // Configura hooks do servico
  app.service(aiModelsPath).hooks({
    around: {
      all: [],
      find: [authenticate('jwt')]
    },
    before: {
      all: [],
      find: []
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
    [aiModelsPath]: AIModelsService
  }
}
