// Servico Feathers para listar modelos de IA de um provider
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type { AIModelInfo } from '../ai-providers'
import type { SettingsService } from '../settings/settings.class'
import { aiProviderNames, type AIProviderName } from '../settings/settings.schema'
import { createProvider, type ProviderConfigMap } from '../ai-providers'
import { BadRequest } from '@feathersjs/errors'

export interface AIModelsQuery {
  provider: string
}

export interface AIModelsParams extends Params {
  query?: AIModelsQuery
}

export class AIModelsService implements ServiceInterface<AIModelInfo, unknown, AIModelsParams> {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * Lista modelos disponiveis de um provider especifico
   * Requer query.provider para especificar qual provider
   * Busca os modelos diretamente da API do provider
   */
  async find(params?: AIModelsParams): Promise<AIModelInfo[]> {
    const providerId = params?.query?.provider as AIProviderName

    if (!providerId) {
      throw new BadRequest('Query parameter "provider" e obrigatorio')
    }

    if (!aiProviderNames.includes(providerId)) {
      return []
    }

    const settingsService = this.app.service('settings') as unknown as SettingsService
    const providerConfig = await settingsService.getProviderConfig(providerId)

    if (!providerConfig?.enabled) {
      return []
    }

    // Ollama nao precisa de apiKey, outros providers precisam
    if (providerId !== 'ollama' && !providerConfig.apiKey) {
      return []
    }

    // Criar instancia do provider com a configuracao do banco de dados
    const config = this.buildProviderConfig(providerId, providerConfig)
    const provider = createProvider(providerId, config)

    // Buscar modelos da API do provider
    return provider.listModels()
  }

  /**
   * Constroi a configuracao do provider a partir das settings
   */
  private buildProviderConfig<T extends AIProviderName>(
    providerId: T,
    settings: { apiKey?: string; baseUrl?: string; organizationId?: string }
  ): ProviderConfigMap[T] {
    switch (providerId) {
      case 'openai':
        return {
          apiKey: settings.apiKey!,
          baseUrl: settings.baseUrl,
          organizationId: settings.organizationId
        } as ProviderConfigMap[T]
      case 'google':
        return {
          apiKey: settings.apiKey!
        } as ProviderConfigMap[T]
      case 'ollama':
        return {
          baseUrl: settings.baseUrl || 'http://localhost:11434'
        } as ProviderConfigMap[T]
      case 'anthropic':
        return {
          apiKey: settings.apiKey!,
          baseUrl: settings.baseUrl
        } as ProviderConfigMap[T]
      case 'groq':
        return {
          apiKey: settings.apiKey!,
          baseUrl: settings.baseUrl
        } as ProviderConfigMap[T]
      default:
        throw new BadRequest(`Provider ${providerId} nao suportado`)
    }
  }
}

export const getOptions = (app: Application): Application => {
  return app
}
