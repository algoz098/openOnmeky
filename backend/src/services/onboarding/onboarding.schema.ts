// Schema para servico de Onboarding
import { resolve } from '@feathersjs/schema'
import { Type, getValidator } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator } from '../../validators'
import type { OnboardingService } from './onboarding.class'

// Schema para status do onboarding (retornado pelo find)
export const onboardingStatusSchema = Type.Object(
  {
    needsOnboarding: Type.Boolean()
  },
  { $id: 'OnboardingStatus', additionalProperties: false }
)
export type OnboardingStatus = Static<typeof onboardingStatusSchema>

// Schema para configuracao de AI Provider durante onboarding
export const onboardingAIProviderSchema = Type.Object({
  provider: Type.Union([
    Type.Literal('openai'),
    Type.Literal('google'),
    Type.Literal('anthropic'),
    Type.Literal('groq'),
    Type.Literal('ollama')
  ]),
  apiKey: Type.Optional(Type.String()),
  baseUrl: Type.Optional(Type.String())
})
export type OnboardingAIProvider = Static<typeof onboardingAIProviderSchema>

// Schema para criacao de marca durante onboarding
export const onboardingBrandSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  sector: Type.Optional(Type.String()),
  toneOfVoice: Type.Optional(Type.String()),
  targetAudience: Type.Optional(Type.String()),
  aiConfigPreset: Type.Optional(
    Type.Union([Type.Literal('quality'), Type.Literal('balanced'), Type.Literal('budget')])
  )
})
export type OnboardingBrand = Static<typeof onboardingBrandSchema>

// Schema para criar super-admin durante onboarding (expandido)
export const onboardingDataSchema = Type.Object(
  {
    // Dados do admin (obrigatorios)
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 6 }),
    name: Type.String(),
    // Configuracao de AI Providers (opcional - array de providers)
    aiProviders: Type.Optional(Type.Array(onboardingAIProviderSchema)),
    // Primeira marca (opcional)
    brand: Type.Optional(onboardingBrandSchema)
  },
  { $id: 'OnboardingData', additionalProperties: false }
)
export type OnboardingData = Static<typeof onboardingDataSchema>
export const onboardingDataValidator = getValidator(onboardingDataSchema, dataValidator)

// Schema para resultado do onboarding
export const onboardingResultSchema = Type.Object(
  {
    user: Type.Object({
      id: Type.Number(),
      email: Type.String(),
      name: Type.Optional(Type.String()),
      role: Type.String()
    }),
    seeded: Type.Boolean(),
    aiProvidersConfigured: Type.Optional(Type.Number()),
    brandCreated: Type.Optional(
      Type.Object({
        id: Type.Number(),
        name: Type.String()
      })
    )
  },
  { $id: 'OnboardingResult', additionalProperties: false }
)
export type OnboardingResult = Static<typeof onboardingResultSchema>

export const onboardingStatusResolver = resolve<OnboardingStatus, HookContext<OnboardingService>>({})
export const onboardingResultResolver = resolve<OnboardingResult, HookContext<OnboardingService>>({})
