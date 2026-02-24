// Servico Feathers para expor informacoes sobre providers de IA
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type { SettingsService } from '../settings/settings.class'
import type { AIProviderInfo } from './ai-providers.shared'

export interface AIProvidersParams extends Params {
  query?: {
    enabled?: boolean
  }
}

export class AIProvidersService<ServiceParams extends Params = AIProvidersParams> implements ServiceInterface<
  AIProviderInfo,
  unknown,
  ServiceParams
> {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(params?: ServiceParams): Promise<AIProviderInfo[]> {
    const settingsService = this.app.service('settings') as unknown as SettingsService
    const enabledProviders = await settingsService.getEnabledProviders()

    // Filtra por habilitado se solicitado
    if (params?.query?.enabled === true) {
      return enabledProviders.map(name => ({ name, enabled: true }))
    }

    // Retorna todos os providers com status
    const allProviders = ['openai', 'google', 'ollama', 'anthropic', 'groq']

    return allProviders.map(name => ({
      name,
      enabled: enabledProviders.includes(name as any)
    }))
  }
}

export const getOptions = (app: Application): Application => {
  return app
}
