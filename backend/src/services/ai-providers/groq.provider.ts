// Provider Groq para inferencia rapida de modelos open-source

import {
  BaseAIProvider,
  AIProviderCapabilities,
  AIProviderConfig,
  GenerateTextOptions,
  GenerateTextResult,
  AIModelInfo
} from './ai-provider.interface'

export interface GroqConfig extends AIProviderConfig {
  apiKey: string
  baseUrl?: string
}

export class GroqProvider extends BaseAIProvider {
  readonly name = 'groq' as const
  readonly capabilities: AIProviderCapabilities = {
    text: true,
    image: false,
    video: false,
    embeddings: false,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it']
  }

  private baseUrl: string

  constructor(config: GroqConfig) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://api.groq.com/openai/v1'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      return response.ok
    } catch {
      return false
    }
  }

  async listModels(): Promise<AIModelInfo[]> {
    if (!this.config.apiKey) {
      return []
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const models: AIModelInfo[] = []

      for (const model of data.data || []) {
        const id = model.id as string

        // Filtrar apenas modelos ativos
        if (!model.active) continue

        models.push({
          id,
          name: id,
          type: 'text',
          contextWindow: model.context_window
        })
      }

      // Ordenar por relevancia
      models.sort((a, b) => {
        const order = ['llama-3.3', 'llama-3.1', 'mixtral', 'gemma']
        const aIdx = order.findIndex(p => a.id.includes(p))
        const bIdx = order.findIndex(p => b.id.includes(p))
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
      })

      return models
    } catch {
      return []
    }
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const model = options.model || 'llama-3.3-70b-versatile'

    // Groq usa formato compativel com OpenAI
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: options.messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        stop: options.stopSequences
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw this.handleError(error, response.status)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    return {
      content: choice?.message?.content || '',
      model: data.model || model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0
          }
        : undefined,
      finishReason: choice?.finish_reason
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`
    }
  }

  private handleError(error: { error?: { message?: string } }, status: number): Error {
    const message = error?.error?.message || 'Erro ao comunicar com Groq'

    if (status === 401) {
      return new Error('Servico de IA indisponivel. Verifique a configuracao.')
    }
    if (status === 429) {
      return new Error('Limite de requisicoes excedido. Tente novamente mais tarde.')
    }
    if (status >= 500) {
      return new Error('Servico de IA indisponivel. Tente novamente mais tarde.')
    }

    return new Error(message)
  }
}
