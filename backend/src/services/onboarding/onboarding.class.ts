// Classe do servico de Onboarding
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import { Forbidden } from '@feathersjs/errors'
import type { Application } from '../../declarations'
import type {
  OnboardingStatus,
  OnboardingData,
  OnboardingResult,
  OnboardingAIProvider,
  OnboardingBrand
} from './onboarding.schema'
import type { SettingsService } from '../settings/settings.class'

export type { OnboardingStatus, OnboardingData, OnboardingResult }

export interface OnboardingParams extends Params {}

// Presets de configuracao de IA por marca
const AI_CONFIG_PRESETS = {
  quality: {
    reasoning: { provider: 'openai', model: 'o3' },
    textCreation: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    textAdaptation: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    analysis: { provider: 'openai', model: 'o3' },
    imageGeneration: { provider: 'openai', model: 'dall-e-3' },
    creativeDirection: { provider: 'openai', model: 'gpt-5.3-codex' },
    compliance: { provider: 'anthropic', model: 'claude-opus-4-6' }
  },
  balanced: {
    reasoning: { provider: 'google', model: 'gemini-3.1-pro-preview' },
    textCreation: { provider: 'openai', model: 'gpt-4o' },
    textAdaptation: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    analysis: { provider: 'groq', model: 'llama-3.1-8b-instant' },
    imageGeneration: { provider: 'google', model: 'imagen-4.0-ultra-generate-001' },
    creativeDirection: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    compliance: { provider: 'google', model: 'gemini-3.1-pro-preview' }
  },
  budget: {
    reasoning: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    textCreation: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    textAdaptation: { provider: 'groq', model: 'llama-3.1-8b-instant' },
    analysis: { provider: 'groq', model: 'llama-3.1-8b-instant' },
    imageGeneration: { provider: 'google', model: 'imagen-4.0-ultra-generate-001' },
    creativeDirection: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    compliance: { provider: 'groq', model: 'llama-3.3-70b-versatile' }
  }
}

export class OnboardingService implements ServiceInterface<
  OnboardingStatus | OnboardingResult,
  OnboardingData
> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(_params?: OnboardingParams): Promise<OnboardingStatus> {
    const needsOnboarding = await this.checkNeedsOnboarding()
    return { needsOnboarding }
  }

  async create(data: OnboardingData, _params?: OnboardingParams): Promise<OnboardingResult> {
    // Verificar se ja foi feito onboarding
    const needsOnboarding = await this.checkNeedsOnboarding()
    if (!needsOnboarding) {
      throw new Forbidden('Onboarding ja foi completado')
    }

    // 1. Criar super-admin
    const usersService = this.app.service('users')
    const user = await usersService.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'super-admin'
    })

    // 2. Executar seed
    const seedService = this.app.service('seed' as any)
    await seedService.create({ force: false })

    // 3. Configurar AI Providers (se fornecidos)
    let aiProvidersConfigured = 0
    if (data.aiProviders && data.aiProviders.length > 0) {
      aiProvidersConfigured = await this.configureAIProviders(data.aiProviders)
    }

    // 4. Criar primeira marca (se fornecida)
    let brandCreated: { id: number; name: string } | undefined
    if (data.brand) {
      brandCreated = await this.createFirstBrand(user.id, data.brand)
    }

    // 5. Marcar sistema como inicializado
    const systemService = this.app.service('system' as any) as any
    await systemService.setInitialized(true)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'super-admin'
      },
      seeded: true,
      aiProvidersConfigured: aiProvidersConfigured > 0 ? aiProvidersConfigured : undefined,
      brandCreated
    }
  }

  private async configureAIProviders(aiProviders: OnboardingAIProvider[]): Promise<number> {
    let configuredCount = 0
    const settingsService = this.app.service('settings') as unknown as SettingsService
    let firstProvider: OnboardingAIProvider['provider'] | null = null

    for (const aiProvider of aiProviders) {
      try {
        await settingsService.updateProvider(aiProvider.provider, {
          enabled: true,
          apiKey: aiProvider.apiKey,
          baseUrl: aiProvider.baseUrl
        })
        configuredCount++

        // Guardar primeiro provider para definir como padrao
        if (!firstProvider) {
          firstProvider = aiProvider.provider
        }
      } catch {
        // Continua para o proximo provider em caso de erro
      }
    }

    // Definir o primeiro provider configurado como padrao
    if (firstProvider) {
      try {
        await settingsService.setDefaultProvider(firstProvider)
      } catch {
        // Ignora erro ao definir provider padrao
      }
    }

    return configuredCount
  }

  private async createFirstBrand(
    userId: number,
    brandData: OnboardingBrand
  ): Promise<{ id: number; name: string }> {
    const db = this.app.get('sqliteClient')
    const now = new Date().toISOString()

    // Montar configuracao de IA baseada no preset
    let aiConfig = {}
    if (brandData.aiConfigPreset && AI_CONFIG_PRESETS[brandData.aiConfigPreset]) {
      aiConfig = AI_CONFIG_PRESETS[brandData.aiConfigPreset]
    }

    const brandInsert = {
      userId,
      name: brandData.name,
      sector: brandData.sector || null,
      toneOfVoice: brandData.toneOfVoice || null,
      targetAudience: brandData.targetAudience || null,
      aiConfig: JSON.stringify(aiConfig),
      createdAt: now,
      updatedAt: now
    }

    const [id] = await db('brands').insert(brandInsert)

    return { id, name: brandData.name }
  }

  private async checkNeedsOnboarding(): Promise<boolean> {
    try {
      // Usar conexao direta com o banco para evitar hooks de autenticacao
      const db = this.app.get('sqliteClient')
      const result = await db('users').count('* as count').first()
      const count = Number(result?.count ?? 0)
      return count === 0
    } catch {
      return true
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
