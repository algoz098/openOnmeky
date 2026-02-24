// Exporta todos os providers de IA e a interface base

export * from './ai-provider.interface'
export * from './openai.provider'
export * from './google.provider'
export * from './ollama.provider'
export * from './anthropic.provider'
export * from './groq.provider'

import { AIProvider, AIProviderName } from './ai-provider.interface'
import { OpenAIProvider, OpenAIConfig } from './openai.provider'
import { GoogleAIProvider, GoogleAIConfig } from './google.provider'
import { OllamaProvider, OllamaConfig } from './ollama.provider'
import { AnthropicProvider, AnthropicConfig } from './anthropic.provider'
import { GroqProvider, GroqConfig } from './groq.provider'

export type ProviderConfigMap = {
  openai: OpenAIConfig
  google: GoogleAIConfig
  ollama: OllamaConfig
  anthropic: AnthropicConfig
  groq: GroqConfig
}

/**
 * Factory para criar instancias de providers de IA
 */
export function createProvider<T extends AIProviderName>(name: T, config: ProviderConfigMap[T]): AIProvider {
  switch (name) {
    case 'openai':
      return new OpenAIProvider(config as OpenAIConfig)
    case 'google':
      return new GoogleAIProvider(config as GoogleAIConfig)
    case 'ollama':
      return new OllamaProvider(config as OllamaConfig)
    case 'anthropic':
      return new AnthropicProvider(config as AnthropicConfig)
    case 'groq':
      return new GroqProvider(config as GroqConfig)
    default:
      throw new Error(`Provider desconhecido: ${name}`)
  }
}
