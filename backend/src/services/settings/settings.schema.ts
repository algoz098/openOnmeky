// Schema para servico de Settings (Configuracoes do Sistema)
import { resolve } from '@feathersjs/schema'
import { Type, getValidator } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator } from '../../validators'
import type { SettingsService } from './settings.class'

// Lista de providers de IA suportados
export const aiProviderNames = ['openai', 'google', 'ollama', 'anthropic', 'groq'] as const
export type AIProviderName = (typeof aiProviderNames)[number]

// Schema para configuracao de um provider de IA
export const aiProviderSettingSchema = Type.Object({
  enabled: Type.Boolean({ default: false }),
  apiKey: Type.Optional(Type.String()),
  baseUrl: Type.Optional(Type.String()),
  organizationId: Type.Optional(Type.String()),
  defaultModel: Type.Optional(Type.String())
})
export type AIProviderSetting = Static<typeof aiProviderSettingSchema>

// Schema para preco de um modelo de IA
export const modelPricingSchema = Type.Object({
  inputPricePerMillion: Type.Number({ description: 'Preco por 1M tokens de input (USD)' }),
  outputPricePerMillion: Type.Number({ description: 'Preco por 1M tokens de output (USD)' }),
  imagePricePerUnit: Type.Optional(Type.Number({ description: 'Preco por imagem gerada (USD)' })),
  videoPricePerSecond: Type.Optional(Type.Number({ description: 'Preco por segundo de video (USD)' }))
})
export type ModelPricing = Static<typeof modelPricingSchema>

// Schema para configuracao completa de precos
// Estrutura: { models: { provider: { model: pricing } } }
export const pricingSettingsSchema = Type.Object({
  models: Type.Record(
    Type.String(), // provider name
    Type.Record(Type.String(), modelPricingSchema) // model -> pricing
  ),
  currency: Type.Optional(Type.String({ default: 'USD' })),
  lastUpdated: Type.Optional(Type.String({ format: 'date-time' }))
})
export type PricingSettings = Static<typeof pricingSettingsSchema>

// Schema para todas as configuracoes de IA
export const aiSettingsSchema = Type.Object({
  openai: Type.Optional(aiProviderSettingSchema),
  google: Type.Optional(aiProviderSettingSchema),
  ollama: Type.Optional(aiProviderSettingSchema),
  anthropic: Type.Optional(aiProviderSettingSchema),
  groq: Type.Optional(aiProviderSettingSchema),
  defaultProvider: Type.Optional(Type.String()),
  // Configuracoes globais de geracao
  maxTokens: Type.Optional(
    Type.Number({ default: 8000, description: 'Limite maximo de tokens para geracao' })
  ),
  // Configuracoes de precos de modelos
  pricing: Type.Optional(pricingSettingsSchema)
})
export type AISettings = Static<typeof aiSettingsSchema>

// Schema para todas as configuracoes do sistema
export const settingsSchema = Type.Object({
  ai: Type.Optional(aiSettingsSchema)
})
export type Settings = Static<typeof settingsSchema>
export const settingsValidator = getValidator(settingsSchema, dataValidator)

// Schema para atualizar configuracoes de IA
export const aiSettingsDataSchema = Type.Object({
  provider: Type.Union(aiProviderNames.map(p => Type.Literal(p))),
  enabled: Type.Optional(Type.Boolean()),
  apiKey: Type.Optional(Type.String()),
  baseUrl: Type.Optional(Type.String()),
  organizationId: Type.Optional(Type.String()),
  defaultModel: Type.Optional(Type.String())
})
export type AISettingsData = Static<typeof aiSettingsDataSchema>
export const aiSettingsDataValidator = getValidator(aiSettingsDataSchema, dataValidator)

// Schema para definir provider padrao
export const defaultProviderDataSchema = Type.Object({
  provider: Type.Union(aiProviderNames.map(p => Type.Literal(p)))
})
export type DefaultProviderData = Static<typeof defaultProviderDataSchema>
export const defaultProviderDataValidator = getValidator(defaultProviderDataSchema, dataValidator)

// Resolvers
export const settingsResolver = resolve<Settings, HookContext<SettingsService>>({})
export const settingsExternalResolver = resolve<Settings, HookContext<SettingsService>>({
  // Oculta API keys na resposta externa (mostra apenas se esta configurado)
  ai: async value => {
    if (!value) return value
    const masked: AISettings = {}
    for (const provider of aiProviderNames) {
      if (value[provider]) {
        masked[provider] = {
          ...value[provider],
          apiKey: value[provider]?.apiKey ? '********' : undefined
        }
      }
    }
    masked.defaultProvider = value.defaultProvider
    return masked
  }
})
