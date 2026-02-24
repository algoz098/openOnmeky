// Configuracao do servico de Settings
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { SettingsService } from './settings.class'
import { settingsExternalResolver, settingsResolver, defaultProviderDataValidator } from './settings.schema'
import { requireAdmin } from '../../hooks/check-permissions'

export const settingsPath = 'settings'
export const settingsMethods = ['find'] as const

export * from './settings.class'
export * from './settings.schema'

export const settings = (app: Application) => {
  // Registra o servico principal
  app.use(settingsPath, new SettingsService(app), {
    methods: settingsMethods,
    events: []
  })

  // Hook para configuracoes
  app.service(settingsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(settingsExternalResolver),
        schemaHooks.resolveResult(settingsResolver)
      ],
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

  // Endpoint customizado para atualizar provider: PATCH /settings/ai/:provider
  app.use(
    'settings/ai',
    {
      async patch(provider: string, data: any, params: any) {
        const service = app.service(settingsPath) as SettingsService
        return service.updateProvider(provider as any, data)
      },
      async find(params: any) {
        const service = app.service(settingsPath) as SettingsService
        return service.getAISettings()
      }
    },
    {
      methods: ['find', 'patch'],
      events: []
    }
  )

  app.service('settings/ai').hooks({
    around: {
      all: [authenticate('jwt'), requireAdmin]
    }
  })

  // Endpoint para definir provider padrao: POST /settings/ai/default
  app.use(
    'settings/ai/default',
    {
      async create(data: any, params: any) {
        const service = app.service(settingsPath) as SettingsService
        return service.setDefaultProvider(data.provider)
      }
    },
    {
      methods: ['create'],
      events: []
    }
  )

  app.service('settings/ai/default').hooks({
    around: {
      all: [authenticate('jwt'), requireAdmin]
    },
    before: {
      create: [schemaHooks.validateData(defaultProviderDataValidator)]
    }
  })

  // Endpoint para configuracoes globais: PATCH /settings/ai/global
  app.use(
    'settings/ai/global',
    {
      async patch(id: any, data: any, params: any) {
        const service = app.service(settingsPath) as SettingsService
        return service.updateGlobalSettings(data)
      }
    },
    {
      methods: ['patch'],
      events: []
    }
  )

  app.service('settings/ai/global').hooks({
    around: {
      all: [authenticate('jwt'), requireAdmin]
    }
  })

  // Endpoint para configuracoes de pricing de modelos: GET/PATCH /settings/ai/pricing
  app.use(
    'settings/ai/pricing',
    {
      // GET - Retorna configuracoes de pricing
      async find() {
        const service = app.service(settingsPath) as SettingsService
        return service.getPricingSettings()
      },
      // PATCH /:provider/:model - Atualiza preco de um modelo
      async patch(id: string, data: any) {
        const service = app.service(settingsPath) as SettingsService
        // id pode ser "provider/model" ou apenas "provider"
        const parts = id.split('/')
        if (parts.length === 2) {
          return service.updateModelPricing(parts[0], parts[1], data)
        } else {
          // Atualiza todos os modelos de um provider
          return service.updateProviderPricing(id, data)
        }
      },
      // POST /reset - Restaura precos padrao
      async create(data: any) {
        if (data?.action === 'reset') {
          const service = app.service(settingsPath) as SettingsService
          return service.resetPricingToDefaults()
        }
        throw new Error('Acao invalida')
      }
    },
    {
      methods: ['find', 'patch', 'create'],
      events: []
    }
  )

  app.service('settings/ai/pricing').hooks({
    around: {
      all: [authenticate('jwt'), requireAdmin]
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [settingsPath]: SettingsService
    'settings/ai': any
    'settings/ai/default': any
    'settings/ai/global': any
    'settings/ai/pricing': any
  }
}
