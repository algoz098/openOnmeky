// Tipos para os componentes de onboarding

export type ProviderName = 'openai' | 'google' | 'anthropic' | 'groq' | 'ollama'

export interface AdminData {
  name: string
  email: string
  password: string
}

export interface AIProviderConfig {
  provider: ProviderName
  apiKey?: string | undefined
  baseUrl?: string | undefined
}

// Array de providers configurados no onboarding
export type AIProvidersData = AIProviderConfig[]

export type AIConfigPreset = 'quality' | 'balanced' | 'budget'

export interface BrandData {
  name: string
  sector?: string | undefined
  toneOfVoice?: string | undefined
  targetAudience?: string | undefined
  aiConfigPreset?: AIConfigPreset | undefined
}

export interface OnboardingResultData {
  user: {
    id: number
    email: string
    name?: string | undefined
    role: string
  }
  seeded: boolean
  aiProvidersConfigured?: number | undefined
  brandCreated?: {
    id: number
    name: string
  } | undefined
}

