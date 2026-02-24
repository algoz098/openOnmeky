// Provider Google AI para integracao com Gemini

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

export interface GoogleAIConfig extends AIProviderConfig {
  apiKey: string
  baseUrl?: string
}

export class GoogleAIProvider extends BaseAIProvider {
  readonly name = 'google' as const
  readonly capabilities: AIProviderCapabilities = {
    text: true,
    image: true,
    video: false,
    embeddings: true,
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
  }

  private baseUrl: string

  constructor(config: GoogleAIConfig) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false
    }

    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.config.apiKey}`, {
        method: 'GET'
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
      const response = await fetch(`${this.baseUrl}/models?key=${this.config.apiKey}`, {
        method: 'GET'
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const models: AIModelInfo[] = []

      for (const model of data.models || []) {
        const name = model.name as string
        // Extrair ID do modelo (formato: models/gemini-1.5-pro)
        const id = name.replace('models/', '')
        const idLower = id.toLowerCase()

        // Determinar tipo do modelo baseado em palavras-chave e metodos suportados
        const supportedMethods = model.supportedGenerationMethods || []
        let type: AIModelInfo['type'] = 'text'

        // Modelos de imagem - identificar por nome ou metodo
        // Inclui: imagen-*, *-image-*, *-image, nano-banana-*, gemini-*-image-preview
        if (
          idLower.includes('imagen') ||
          idLower.includes('-image-') ||
          idLower.endsWith('-image') ||
          idLower.includes('nano-banana') ||
          supportedMethods.includes('generateImages') ||
          supportedMethods.includes('predictImage') ||
          supportedMethods.includes('predict')
        ) {
          type = 'image'
        } else if (
          idLower.includes('veo') ||
          idLower.includes('video') ||
          supportedMethods.includes('predictLongRunning')
        ) {
          type = 'video'
        } else if (idLower.includes('embedding') || supportedMethods.includes('embedContent')) {
          type = 'embedding'
        }

        // Filtrar modelos de texto apenas se suportam generateContent
        // Modelos de imagem e video podem ter outros metodos
        if (type === 'text' && !supportedMethods.includes('generateContent')) {
          continue
        }

        models.push({
          id,
          name: model.displayName || id,
          type,
          contextWindow: model.inputTokenLimit,
          maxOutputTokens: model.outputTokenLimit
        })
      }

      // Ordenar por relevancia
      models.sort((a, b) => {
        const order = ['gemini-2.0', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0']
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
    const model = options.model || 'gemini-2.0-flash'

    // Converte mensagens para formato Gemini
    const contents = this.convertMessages(options.messages)

    const response = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: options.maxTokens || 1000,
            temperature: options.temperature ?? 0.7,
            topP: options.topP,
            stopSequences: options.stopSequences
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw this.handleError(error, response.status)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    const content = candidate?.content?.parts?.[0]?.text || ''

    return {
      content,
      model,
      provider: this.name,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0
          }
        : undefined,
      finishReason: candidate?.finishReason
    }
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const model = options.model || 'imagen-3.0-generate-001'

    console.log('[GoogleAIProvider] generateImage chamado')
    console.log('[GoogleAIProvider] Modelo:', model)

    // Detecta se e modelo Gemini (Nano Banana / Nano Banana Pro) ou Imagen
    const isGeminiModel =
      model.includes('gemini') || model.includes('flash-image') || model.includes('nano-banana')

    if (isGeminiModel) {
      return this.generateImageWithGemini(model, options)
    } else {
      return this.generateImageWithImagen(model, options)
    }
  }

  // Geracao de imagem usando modelos Gemini (Nano Banana / Nano Banana Pro)
  private async generateImageWithGemini(
    model: string,
    options: GenerateImageOptions
  ): Promise<GenerateImageResult> {
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`

    console.log('[GoogleAIProvider] Usando endpoint Gemini generateContent')
    console.log('[GoogleAIProvider] URL:', url.replace(this.config.apiKey || '', '***'))
    console.log('[GoogleAIProvider] Prompt (primeiros 100 chars):', options.prompt.substring(0, 100))

    // Constroi partes do conteudo com texto e imagens de referencia
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: options.prompt }
    ]

    // Adiciona imagens de referencia se disponivel
    if (options.referenceImages && options.referenceImages.length > 0) {
      console.log(`[GoogleAIProvider] Adicionando ${options.referenceImages.length} imagens de referencia`)

      for (const imageUrl of options.referenceImages) {
        try {
          // Baixa a imagem e converte para base64
          const imageData = await this.fetchImageAsBase64(imageUrl)
          if (imageData) {
            parts.push({
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.base64
              }
            })
            console.log(`[GoogleAIProvider] Imagem de referencia adicionada: ${imageUrl.substring(0, 50)}...`)
          }
        } catch (error) {
          console.warn(`[GoogleAIProvider] Falha ao processar imagem de referencia: ${imageUrl}`, error)
        }
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    })

    console.log('[GoogleAIProvider] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[GoogleAIProvider] Erro na resposta:', JSON.stringify(error, null, 2))
      throw this.handleError(error, response.status)
    }

    const data = await response.json()
    console.log(
      '[GoogleAIProvider] Resposta Gemini recebida:',
      JSON.stringify(data, null, 2).substring(0, 500)
    )

    // Extrai imagens da resposta Gemini
    const images: Array<{ base64?: string; url?: string }> = []
    const candidates = data.candidates || []

    for (const candidate of candidates) {
      const parts = candidate.content?.parts || []
      for (const part of parts) {
        if (part.inlineData) {
          images.push({ base64: part.inlineData.data })
        }
      }
    }

    console.log('[GoogleAIProvider] Imagens extraidas:', images.length)

    return {
      images,
      model,
      provider: this.name
    }
  }

  // Geracao de imagem usando modelos Imagen
  private async generateImageWithImagen(
    model: string,
    options: GenerateImageOptions
  ): Promise<GenerateImageResult> {
    const url = `${this.baseUrl}/models/${model}:predict?key=${this.config.apiKey}`

    console.log('[GoogleAIProvider] Usando endpoint Imagen predict')
    console.log('[GoogleAIProvider] URL:', url.replace(this.config.apiKey || '', '***'))
    console.log('[GoogleAIProvider] Prompt (primeiros 100 chars):', options.prompt.substring(0, 100))

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: options.prompt }],
        parameters: {
          sampleCount: options.n || 1
        }
      })
    })

    console.log('[GoogleAIProvider] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[GoogleAIProvider] Erro na resposta:', JSON.stringify(error, null, 2))
      throw this.handleError(error, response.status)
    }

    const data = await response.json()
    console.log('[GoogleAIProvider] Resposta recebida:', {
      hasPredictions: !!data.predictions,
      predictionsCount: data.predictions?.length || 0,
      hasBase64: !!data.predictions?.[0]?.bytesBase64Encoded,
      base64Length: data.predictions?.[0]?.bytesBase64Encoded?.length || 0
    })

    return {
      images: (data.predictions || []).map((pred: { bytesBase64Encoded?: string }) => ({
        base64: pred.bytesBase64Encoded
      })),
      model,
      provider: this.name
    }
  }

  // Tipo para partes do Gemini (texto ou imagem inline)
  private convertMessages(messages: AIMessage[]): Array<{
    role: string
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
  }> {
    const contents: Array<{
      role: string
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
    }> = []
    let systemPrompt = ''

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Sistema e sempre texto
        const textContent = typeof msg.content === 'string' ? msg.content : ''
        systemPrompt += textContent + '\n'
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user'
        const parts = this.convertContentToParts(msg.content)
        contents.push({ role, parts })
      }
    }

    // Prepend system prompt to first user message if exists
    if (systemPrompt && contents.length > 0 && contents[0].role === 'user') {
      // Encontra a primeira parte de texto
      const firstTextPart = contents[0].parts.find(p => p.text !== undefined)
      if (firstTextPart) {
        firstTextPart.text = systemPrompt + (firstTextPart.text || '')
      } else {
        // Adiciona texto no inicio
        contents[0].parts.unshift({ text: systemPrompt })
      }
    }

    return contents
  }

  // Converte conteudo da mensagem para partes do Gemini
  private convertContentToParts(
    content: string | AIMessageContent[]
  ): Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> {
    // Se e string simples
    if (typeof content === 'string') {
      return [{ text: content }]
    }

    // Se e array multimodal
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []
    for (const item of content) {
      if (item.type === 'text') {
        parts.push({ text: item.text })
      } else if (item.type === 'image') {
        // Para Gemini, precisamos converter URL para base64 inline
        // Se a URL ja for base64 (data:), extraimos os dados
        if (item.url.startsWith('data:')) {
          const [meta, data] = item.url.split(',')
          const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg'
          parts.push({ inlineData: { mimeType, data } })
        } else {
          // Para URLs externas, Gemini suporta fileData, mas vamos usar URL direto em texto por ora
          // Em producao, seria necessario fazer fetch da imagem e converter para base64
          parts.push({ text: `[Imagem: ${item.url}]` })
        }
      }
    }
    return parts
  }

  // Baixa imagem de URL e converte para base64
  private async fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
      // Se ja for base64 data URL, extrai os dados
      if (imageUrl.startsWith('data:')) {
        const [meta, data] = imageUrl.split(',')
        const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg'
        return { base64: data, mimeType }
      }

      // Se for path relativo, converte para URL absoluta
      let fullUrl = imageUrl
      if (imageUrl.startsWith('/')) {
        const baseUrl = process.env.APP_URL || process.env.BACKEND_URL || 'http://localhost:3030'
        fullUrl = `${baseUrl.replace(/\/$/, '')}${imageUrl}`
        console.log(`[GoogleAIProvider] Convertendo path relativo para URL: ${fullUrl}`)
      }

      // Baixa a imagem
      const response = await fetch(fullUrl)
      if (!response.ok) {
        console.warn(`[GoogleAIProvider] Falha ao baixar imagem: ${response.status}`)
        return null
      }

      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      // Detecta mimeType do content-type ou da extensao
      let mimeType = response.headers.get('content-type') || 'image/jpeg'
      if (mimeType.includes(';')) {
        mimeType = mimeType.split(';')[0]
      }

      return { base64, mimeType }
    } catch (error) {
      console.error(`[GoogleAIProvider] Erro ao processar imagem: ${imageUrl}`, error)
      return null
    }
  }

  private handleError(error: { error?: { message?: string } }, status: number): Error {
    const message = error?.error?.message || 'Erro ao comunicar com Google AI'

    if (status === 401 || status === 403) {
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
