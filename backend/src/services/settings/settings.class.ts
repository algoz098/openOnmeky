// Classe do servico de Settings
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type {
  Settings,
  AISettings,
  AIProviderSetting,
  AIProviderName,
  PricingSettings,
  ModelPricing
} from './settings.schema'
import { aiProviderNames } from './settings.schema'

export type { Settings, AISettings, AIProviderSetting, PricingSettings, ModelPricing }

export interface SettingsParams extends Params {}

const AI_SETTINGS_KEY = 'ai_settings'

export class SettingsService implements ServiceInterface<Settings> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  // GET /settings - Retorna todas as configuracoes
  async find(_params?: SettingsParams): Promise<Settings> {
    const aiSettings = await this.getAISettings()
    return { ai: aiSettings }
  }

  // GET /settings/ai - Retorna configuracoes de IA
  async getAISettings(): Promise<AISettings> {
    try {
      const db = this.app.get('sqliteClient')
      const config = await db('system_config').where('key', AI_SETTINGS_KEY).first()
      if (config?.value) {
        return JSON.parse(config.value)
      }
      return this.getDefaultAISettings()
    } catch {
      return this.getDefaultAISettings()
    }
  }

  // Atualiza configuracao de um provider especifico
  async updateProvider(provider: AIProviderName, data: Partial<AIProviderSetting>): Promise<AISettings> {
    const current = await this.getAISettings()

    const existingConfig = current[provider] || { enabled: false }
    current[provider] = {
      ...existingConfig,
      ...data,
      enabled: data.enabled !== undefined ? data.enabled : existingConfig.enabled
    }

    await this.saveAISettings(current)

    return current
  }

  // Define o provider padrao
  async setDefaultProvider(provider: AIProviderName): Promise<AISettings> {
    const current = await this.getAISettings()
    current.defaultProvider = provider
    await this.saveAISettings(current)
    return current
  }

  // Atualiza configuracoes globais de IA
  async updateGlobalSettings(data: { maxTokens?: number }): Promise<AISettings> {
    const current = await this.getAISettings()
    if (data.maxTokens !== undefined) {
      current.maxTokens = data.maxTokens
    }
    await this.saveAISettings(current)
    return current
  }

  // Retorna configuracao de um provider especifico (para uso interno)
  async getProviderConfig(provider: AIProviderName): Promise<AIProviderSetting | undefined> {
    const settings = await this.getAISettings()
    return settings[provider]
  }

  // Verifica se um provider esta habilitado e configurado
  async isProviderEnabled(provider: AIProviderName): Promise<boolean> {
    const config = await this.getProviderConfig(provider)
    if (!config?.enabled) return false

    // Ollama nao precisa de API key
    if (provider === 'ollama') return true

    return !!config.apiKey
  }

  // Retorna lista de providers habilitados
  async getEnabledProviders(): Promise<AIProviderName[]> {
    const enabled: AIProviderName[] = []
    for (const provider of aiProviderNames) {
      if (await this.isProviderEnabled(provider)) {
        enabled.push(provider)
      }
    }
    return enabled
  }

  // ==================== METODOS DE PRICING ====================

  // Retorna configuracoes de precos de modelos
  async getPricingSettings(): Promise<PricingSettings> {
    const settings = await this.getAISettings()
    return settings.pricing || this.getDefaultPricing()
  }

  // Atualiza preco de um modelo especifico
  async updateModelPricing(provider: string, model: string, pricing: ModelPricing): Promise<PricingSettings> {
    const current = await this.getAISettings()
    if (!current.pricing) {
      current.pricing = this.getDefaultPricing()
    }
    if (!current.pricing.models[provider]) {
      current.pricing.models[provider] = {}
    }

    current.pricing.models[provider][model] = pricing
    current.pricing.lastUpdated = new Date().toISOString()

    await this.saveAISettings(current)
    return current.pricing
  }

  // Atualiza todos os precos de um provider
  async updateProviderPricing(
    provider: string,
    models: Record<string, ModelPricing>
  ): Promise<PricingSettings> {
    const current = await this.getAISettings()
    if (!current.pricing) {
      current.pricing = this.getDefaultPricing()
    }

    current.pricing.models[provider] = models
    current.pricing.lastUpdated = new Date().toISOString()

    await this.saveAISettings(current)
    return current.pricing
  }

  // Obtem preco de um modelo especifico (sincrono, usa cache)
  async getModelPricing(provider: string, model: string): Promise<ModelPricing | null> {
    const pricing = await this.getPricingSettings()
    if (!pricing?.models?.[provider]) return null

    // Tenta modelo exato, depois fallback para "*" (wildcard)
    return pricing.models[provider][model] || pricing.models[provider]['*'] || null
  }

  // Restaura precos padrao
  async resetPricingToDefaults(): Promise<PricingSettings> {
    const current = await this.getAISettings()
    current.pricing = this.getDefaultPricing()
    await this.saveAISettings(current)
    return current.pricing
  }

  // Precos padrao baseados em precos publicos (Fevereiro 2026)
  private getDefaultPricing(): PricingSettings {
    return {
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      models: {
        openai: {
          'gpt-4o': { inputPricePerMillion: 2.5, outputPricePerMillion: 10.0 },
          'gpt-4o-mini': { inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },
          o3: { inputPricePerMillion: 10.0, outputPricePerMillion: 40.0 },
          'o4-mini': { inputPricePerMillion: 1.1, outputPricePerMillion: 4.4 },
          'gpt-5.3-codex': { inputPricePerMillion: 5.0, outputPricePerMillion: 20.0 },
          'dall-e-3': { inputPricePerMillion: 0, outputPricePerMillion: 0, imagePricePerUnit: 0.04 },
          'dall-e-2': { inputPricePerMillion: 0, outputPricePerMillion: 0, imagePricePerUnit: 0.02 }
        },
        anthropic: {
          'claude-opus-4-6': { inputPricePerMillion: 15.0, outputPricePerMillion: 75.0 },
          'claude-sonnet-4-6': { inputPricePerMillion: 3.0, outputPricePerMillion: 15.0 },
          'claude-3-5-haiku-20241022': { inputPricePerMillion: 0.8, outputPricePerMillion: 4.0 }
        },
        google: {
          'gemini-3.1-pro-preview': { inputPricePerMillion: 1.25, outputPricePerMillion: 5.0 },
          'gemini-2.5-flash': { inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },
          'gemini-2.0-flash': { inputPricePerMillion: 0.075, outputPricePerMillion: 0.3 },
          'gemini-1.5-pro': { inputPricePerMillion: 1.25, outputPricePerMillion: 5.0 },
          'imagen-4.0-ultra-generate-001': {
            inputPricePerMillion: 0,
            outputPricePerMillion: 0,
            imagePricePerUnit: 0.03
          },
          'imagen-3': { inputPricePerMillion: 0, outputPricePerMillion: 0, imagePricePerUnit: 0.025 },
          'veo-3.0-generate-preview': {
            inputPricePerMillion: 0,
            outputPricePerMillion: 0,
            videoPricePerSecond: 0.1
          }
        },
        groq: {
          'llama-3.3-70b-versatile': { inputPricePerMillion: 0.59, outputPricePerMillion: 0.79 },
          'llama-3.1-8b-instant': { inputPricePerMillion: 0.05, outputPricePerMillion: 0.08 },
          'mixtral-8x7b-32768': { inputPricePerMillion: 0.24, outputPricePerMillion: 0.24 },
          'gemma2-9b-it': { inputPricePerMillion: 0.2, outputPricePerMillion: 0.2 }
        },
        ollama: {
          // Wildcard para todos os modelos locais (custo zero)
          '*': { inputPricePerMillion: 0, outputPricePerMillion: 0, imagePricePerUnit: 0 }
        }
      }
    }
  }

  private getDefaultAISettings(): AISettings {
    return {
      openai: { enabled: false },
      google: { enabled: false },
      ollama: { enabled: true, baseUrl: 'http://localhost:11434' },
      anthropic: { enabled: false },
      groq: { enabled: false },
      defaultProvider: 'ollama',
      maxTokens: 8000,
      pricing: this.getDefaultPricing()
    }
  }

  private async saveAISettings(settings: AISettings): Promise<void> {
    const db = this.app.get('sqliteClient')
    const value = JSON.stringify(settings)
    const now = new Date().toISOString()

    const existing = await db('system_config').where('key', AI_SETTINGS_KEY).first()

    if (existing) {
      await db('system_config').where('key', AI_SETTINGS_KEY).update({ value, updatedAt: now })
    } else {
      await db('system_config').insert({
        key: AI_SETTINGS_KEY,
        value,
        createdAt: now,
        updatedAt: now
      })
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
