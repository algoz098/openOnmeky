// Provider OpenAI para integracao com GPT-4o, GPT-5, DALL-E e outros modelos
// Usa o SDK oficial da OpenAI para melhor compatibilidade

import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources'
import type { ImageGenerateParamsNonStreaming, Image } from 'openai/resources/images'
import {
  BaseAIProvider,
  AIProviderCapabilities,
  AIProviderConfig,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateImageOptions,
  GenerateImageResult,
  AIModelInfo,
  AIMessage,
  AIMessageContent
} from './ai-provider.interface'

export interface OpenAIConfig extends AIProviderConfig {
  apiKey: string
  organizationId?: string
  baseUrl?: string
}

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai' as const
  readonly capabilities: AIProviderCapabilities = {
    text: true,
    image: true,
    video: false,
    embeddings: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-5-pro', 'gpt-5', 'dall-e-3', 'dall-e-2']
  }

  private client: OpenAI

  constructor(config: OpenAIConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.baseUrl
    })
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    try {
      await this.client.models.list()
      return true
    } catch {
      return false
    }
  }

  async listModels(): Promise<AIModelInfo[]> {
    if (!this.config.apiKey) {
      return []
    }

    try {
      const response = await this.client.models.list()
      const models: AIModelInfo[] = []

      // Filtrar apenas modelos relevantes
      const relevantPrefixes = ['gpt-', 'dall-e', 'o1', 'o3', 'text-embedding']

      for (const model of response.data) {
        const id = model.id
        const isRelevant = relevantPrefixes.some(prefix => id.startsWith(prefix))

        if (!isRelevant) continue

        let type: AIModelInfo['type'] = 'unknown'
        if (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3')) {
          type = 'text'
        } else if (id.startsWith('dall-e')) {
          type = 'image'
        } else if (id.startsWith('text-embedding')) {
          type = 'embedding'
        }

        models.push({ id, name: id, type })
      }

      // Ordenar por relevancia
      models.sort((a, b) => {
        const order = ['gpt-5', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o1', 'gpt-4', 'gpt-3.5', 'dall-e-3']
        const aIdx = order.findIndex(p => a.id.startsWith(p))
        const bIdx = order.findIndex(p => b.id.startsWith(p))
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
      })

      return models
    } catch {
      return []
    }
  }

  // Modelos que usam a Responses API (GPT-5+)
  private readonly responsesModels = ['gpt-5', 'gpt-5-pro', 'gpt-5-mini', 'gpt-5.2', 'gpt-5.2-pro']

  private usesResponsesApi(model: string): boolean {
    return this.responsesModels.some(prefix => model.startsWith(prefix))
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const model = options.model || 'gpt-4o'

    console.log(`[OpenAIProvider] generateText - modelo: ${model}`)

    if (this.usesResponsesApi(model)) {
      return this.generateTextWithResponsesApi(model, options)
    }

    return this.generateTextWithChatCompletions(model, options)
  }

  // Chat Completions API (GPT-4, GPT-3.5, etc)
  private async generateTextWithChatCompletions(
    model: string,
    options: GenerateTextOptions
  ): Promise<GenerateTextResult> {
    try {
      const messages = this.convertToChatMessages(options.messages)

      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP,
        stop: options.stopSequences
      })

      const choice = response.choices[0]

      return {
        content: choice?.message?.content || '',
        model: response.model,
        provider: this.name,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens
            }
          : undefined,
        finishReason: choice?.finish_reason || undefined
      }
    } catch (error) {
      console.error(`[OpenAIProvider] Erro ao gerar texto:`, error)
      throw this.handleSdkError(error)
    }
  }

  // Responses API (GPT-5+)
  private async generateTextWithResponsesApi(
    model: string,
    options: GenerateTextOptions
  ): Promise<GenerateTextResult> {
    console.log(`[OpenAIProvider] Usando Responses API para modelo ${model}`)

    try {
      const systemMsg = options.messages.find(m => m.role === 'system')
      const userMsg = options.messages.find(m => m.role === 'user')

      // Responses API aceita string simples como input
      const input = typeof userMsg?.content === 'string' ? userMsg.content : JSON.stringify(userMsg?.content)

      const response = await this.client.responses.create({
        model,
        input,
        instructions: typeof systemMsg?.content === 'string' ? systemMsg.content : undefined
      })

      // Extrai texto da resposta
      let content = ''
      if (response.output && Array.isArray(response.output)) {
        for (const item of response.output) {
          if (item.type === 'message' && item.content) {
            for (const part of item.content) {
              if (part.type === 'output_text') {
                content += part.text
              }
            }
          }
        }
      }

      return {
        content,
        model: response.model,
        provider: this.name,
        usage: response.usage
          ? {
              promptTokens: response.usage.input_tokens,
              completionTokens: response.usage.output_tokens,
              totalTokens: response.usage.input_tokens + response.usage.output_tokens
            }
          : undefined,
        finishReason: response.status
      }
    } catch (error) {
      console.error(`[OpenAIProvider] Erro ao gerar texto com Responses API:`, error)
      throw this.handleSdkError(error)
    }
  }

  // Converte mensagens para formato Chat Completions
  private convertToChatMessages(messages: AIMessage[]): ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (typeof msg.content === 'string') {
        return { role: msg.role as 'system' | 'user' | 'assistant', content: msg.content }
      }

      // Multimodal
      const content = (msg.content as AIMessageContent[]).map(part => {
        if (part.type === 'text') {
          return { type: 'text' as const, text: part.text || '' }
        } else if (part.type === 'image') {
          return { type: 'image_url' as const, image_url: { url: part.url || '' } }
        }
        return { type: 'text' as const, text: '' }
      })

      return { role: msg.role as 'user', content }
    })
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const model = options.model || 'dall-e-3'

    try {
      // Parametros base suportados por todos os modelos
      const params: ImageGenerateParamsNonStreaming = {
        model,
        prompt: options.prompt,
        size: (options.size || '1024x1024') as '1024x1024' | '1792x1024' | '1024x1792',
        quality: (options.quality || 'standard') as 'standard' | 'hd',
        n: options.n || 1
      }

      // response_format so e suportado por dall-e-2 e dall-e-3 (nao por gpt-image-1)
      if (model === 'dall-e-2' || model === 'dall-e-3') {
        params.response_format = 'url'
      }

      // style so e suportado por dall-e-3 (nao por gpt-image-1, gpt-image-1-mini, etc)
      if (model === 'dall-e-3') {
        params.style = (options.style || 'natural') as 'natural' | 'vivid'
      }

      const response = await this.client.images.generate(params)

      return {
        images: (response.data || []).map((img: Image) => ({
          url: img.url,
          revisedPrompt: img.revised_prompt
        })),
        model,
        provider: this.name
      }
    } catch (error) {
      console.error(`[OpenAIProvider] Erro ao gerar imagem:`, error)
      throw this.handleSdkError(error)
    }
  }

  private handleSdkError(error: unknown): Error {
    if (error instanceof OpenAI.APIError) {
      const message = error.message || 'Erro ao comunicar com OpenAI'

      if (error.status === 401) {
        return new Error('Servico de IA indisponivel. Verifique a configuracao.')
      }
      if (error.status === 429) {
        return new Error('Limite de requisicoes excedido. Tente novamente mais tarde.')
      }
      if (error.status && error.status >= 500) {
        return new Error('Servico de IA indisponivel. Tente novamente mais tarde.')
      }

      return new Error(message)
    }

    if (error instanceof Error) {
      return error
    }

    return new Error('Erro desconhecido ao comunicar com OpenAI')
  }
}
