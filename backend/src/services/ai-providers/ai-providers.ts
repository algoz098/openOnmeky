// Configuracao do servico de ai-providers para Feathers
import { authenticate } from '@feathersjs/authentication'
import type { Application } from '../../declarations'
import { AIProvidersService, getOptions } from './ai-providers.class'
import { aiProvidersPath, aiProvidersMethods } from './ai-providers.shared'

export { AIProvidersService, getOptions, type AIProvidersParams } from './ai-providers.class'
export { AIProviderInfo, aiProvidersPath, aiProvidersMethods } from './ai-providers.shared'

// Funcao de configuracao que registra o servico
export const aiProviders = (app: Application) => {
  // Registra o servico na aplicacao Feathers
  app.use(aiProvidersPath, new AIProvidersService(getOptions(app)), {
    methods: aiProvidersMethods,
    events: []
  })

  // Configura hooks do servico
  app.service(aiProvidersPath).hooks({
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
    [aiProvidersPath]: AIProvidersService
  }
}
