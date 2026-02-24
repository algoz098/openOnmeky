// Configuracao do servico de Prompt Templates
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { PromptTemplatesService, getOptions } from './prompt-templates.class'
import {
  promptTemplateDataValidator,
  promptTemplatePatchValidator,
  promptTemplateQueryValidator,
  promptTemplateResolver,
  promptTemplateExternalResolver,
  promptTemplateDataResolver,
  promptTemplatePatchResolver,
  promptTemplateQueryResolver
} from './prompt-templates.schema'
import { requireAdmin } from '../../hooks/check-permissions'

export const promptTemplatesPath = 'prompt-templates'
export const promptTemplatesMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './prompt-templates.class'
export * from './prompt-templates.schema'

export const promptTemplates = (app: Application) => {
  app.use(promptTemplatesPath, new PromptTemplatesService(getOptions(app), app), {
    methods: promptTemplatesMethods,
    events: []
  })

  app.service(promptTemplatesPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(promptTemplateExternalResolver),
        schemaHooks.resolveResult(promptTemplateResolver)
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
        schemaHooks.validateQuery(promptTemplateQueryValidator),
        schemaHooks.resolveQuery(promptTemplateQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        requireAdmin,
        schemaHooks.validateData(promptTemplateDataValidator),
        schemaHooks.resolveData(promptTemplateDataResolver)
      ],
      patch: [
        requireAdmin,
        schemaHooks.validateData(promptTemplatePatchValidator),
        schemaHooks.resolveData(promptTemplatePatchResolver)
      ],
      remove: [requireAdmin]
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
    [promptTemplatesPath]: PromptTemplatesService
  }
}
