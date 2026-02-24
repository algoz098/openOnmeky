// Provider Ollama para execucao local de modelos de IA

import {
  BaseAIProvider,
  AIProviderCapabilities,
  AIProviderConfig,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateImageOptions,
  GenerateImageResult,
  AIModelInfo
} from './ai-provider.interface'

export interface OllamaConfig extends AIProviderConfig {
  baseUrl?: string
  defaultModel?: string
}

export class OllamaProvider extends BaseAIProvider {
  readonly name = 'ollama' as const
  readonly capabilities: AIProviderCapabilities = {
    text: true,
    image: true,
    video: false,
    embeddings: true,
    models: ['llama3.2', 'llama3.1', 'mistral', 'mixtral', 'codellama', 'llava']
  }

  private baseUrl: string

  constructor(config: OllamaConfig = {}) {
    super(config)
    this.baseUrl = config.baseUrl || 'http://localhost:11434'
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET'
      })
      return response.ok
    } catch {
      return false
    }
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const model = options.model || this.config.defaultModel || 'llama3.2'

    // Converte mensagens para formato Ollama
    const messages = options.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          num_predict: options.maxTokens || 1000,
          temperature: options.temperature ?? 0.7,
          top_p: options.topP,
          stop: options.stopSequences
        }
      })
    })

    if (!response.ok) {
      throw this.handleError(response.status)
    }

    const data = await response.json()

    return {
      content: data.message?.content || '',
      model: data.model || model,
      provider: this.name,
      usage: data.eval_count
        ? {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: data.eval_count || 0,
            totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
          }
        : undefined,
      finishReason: data.done ? 'stop' : undefined
    }
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    // Ollama suporta modelos multimodais como LLaVA para descricao de imagens
    // Para geracao de imagens, usamos modelos como stable-diffusion via Ollama
    const model = options.model || 'stable-diffusion'

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        stream: false,
        images: true
      })
    })

    if (!response.ok) {
      throw this.handleError(response.status)
    }

    const data = await response.json()

    return {
      images: data.images ? data.images.map((img: string) => ({ base64: img })) : [{ base64: data.image }],
      model,
      provider: this.name
    }
  }

  /**
   * Lista modelos disponiveis no Ollama local
   */
  async listModels(): Promise<AIModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET'
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const models: AIModelInfo[] = []

      for (const model of data.models || []) {
        const name = model.name as string

        // Determinar tipo do modelo
        let type: AIModelInfo['type'] = 'text'
        if (name.includes('stable-diffusion') || name.includes('sdxl')) {
          type = 'image'
        } else if (name.includes('embed') || name.includes('nomic-embed')) {
          type = 'embedding'
        }

        models.push({
          id: name,
          name: name,
          type
        })
      }

      return models
    } catch {
      return []
    }
  }

  private handleError(status: number): Error {
    if (status === 0 || status === 404) {
      return new Error('Ollama nao esta rodando. Inicie o servico local com: ollama serve')
    }
    if (status >= 500) {
      return new Error('Erro no servico Ollama local. Verifique os logs.')
    }

    return new Error('Erro ao comunicar com Ollama')
  }
}
