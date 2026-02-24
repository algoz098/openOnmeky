// Provider Anthropic para integracao com Claude

import {
  BaseAIProvider,
  AIProviderCapabilities,
  AIProviderConfig,
  GenerateTextOptions,
  GenerateTextResult,
  AIModelInfo,
  AIMessage,
  AIMessageContent
} from './ai-provider.interface'

export interface AnthropicConfig extends AIProviderConfig {
  apiKey: string
  baseUrl?: string
}

export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'anthropic' as const
  readonly capabilities: AIProviderCapabilities = {
    text: true,
    image: false,
    video: false,
    embeddings: false,
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229'
    ]
  }

  private baseUrl: string
  private anthropicVersion = '2023-06-01'

  constructor(config: AnthropicConfig) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    // Anthropic nao tem endpoint de verificacao simples
    // Retornamos true se a API key esta configurada
    return true
  }

  async listModels(): Promise<AIModelInfo[]> {
    // Anthropic nao tem endpoint publico para listar modelos
    // Retornamos a lista conhecida de modelos disponiveis
    const models: AIModelInfo[] = [
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        type: 'text',
        contextWindow: 200000,
        maxOutputTokens: 32000
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        type: 'text',
        contextWindow: 200000,
        maxOutputTokens: 64000
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        type: 'text',
        contextWindow: 200000,
        maxOutputTokens: 8192
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        type: 'text',
        contextWindow: 200000,
        maxOutputTokens: 8192
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        type: 'text',
        contextWindow: 200000,
        maxOutputTokens: 4096
      }
    ]

    return models
  }

  // Tipo para conteudo Anthropic (texto ou imagem)
  private convertContentToAnthropicFormat(
    content: string | AIMessageContent[]
  ):
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      > {
    if (typeof content === 'string') {
      return content
    }

    const parts: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    > = []

    for (const item of content) {
      if (item.type === 'text') {
        parts.push({ type: 'text', text: item.text })
      } else if (item.type === 'image') {
        // Se a URL ja for base64 (data:), extraimos os dados
        if (item.url.startsWith('data:')) {
          const [meta, data] = item.url.split(',')
          const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg'
          parts.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data
            }
          })
        } else {
          // Para URLs externas, adicionamos como texto (em producao seria necessario fetch)
          parts.push({ type: 'text', text: `[Imagem: ${item.url}]` })
        }
      }
    }

    return parts
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const model = options.model || 'claude-sonnet-4-20250514'

    // Separa system message das outras
    let systemPrompt = ''
    const messages: Array<{
      role: 'user' | 'assistant'
      content:
        | string
        | Array<
            | { type: 'text'; text: string }
            | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
          >
    }> = []

    for (const msg of options.messages) {
      if (msg.role === 'system') {
        // System e sempre texto
        const textContent = typeof msg.content === 'string' ? msg.content : ''
        systemPrompt += textContent + '\n'
      } else {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: this.convertContentToAnthropicFormat(msg.content)
        })
      }
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens || 1000,
        system: systemPrompt.trim() || undefined,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        stop_sequences: options.stopSequences
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw this.handleError(error, response.status)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    return {
      content,
      model: data.model || model,
      provider: this.name,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens || 0,
            completionTokens: data.usage.output_tokens || 0,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
          }
        : undefined,
      finishReason: data.stop_reason
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey!,
      'anthropic-version': this.anthropicVersion
    }
  }

  private handleError(error: { error?: { message?: string } }, status: number): Error {
    const message = error?.error?.message || 'Erro ao comunicar com Anthropic'

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
