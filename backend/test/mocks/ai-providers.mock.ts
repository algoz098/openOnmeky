// Mocks para AI Providers
// Permite testar sem chamar APIs reais

import type {
  AIProvider,
  AIProviderCapabilities,
  AIProviderName,
  GenerateTextOptions,
  GenerateTextResult,
  GenerateImageOptions,
  GenerateImageResult,
  GenerateVideoOptions,
  GenerateVideoResult,
  AIModelInfo
} from '../../src/services/ai-providers/ai-provider.interface'

/**
 * Resposta padrao do mock para geracao de texto
 */
export const defaultTextResponse: GenerateTextResult = {
  content: 'Conteudo gerado pelo mock para testes automatizados.',
  model: 'mock-model',
  provider: 'openai' as AIProviderName,
  usage: {
    promptTokens: 100,
    completionTokens: 200,
    totalTokens: 300
  },
  finishReason: 'stop'
}

/**
 * Resposta padrao do mock para geracao de imagem
 */
export const defaultImageResponse: GenerateImageResult = {
  images: [
    {
      url: 'http://localhost:3030/uploads/mock-generated-image.png',
      revisedPrompt: 'Mock revised prompt for testing'
    }
  ],
  model: 'mock-image-model',
  provider: 'openai' as AIProviderName
}

/**
 * Resposta padrao do mock para geracao de video
 */
export const defaultVideoResponse: GenerateVideoResult = {
  videoUrl: 'http://localhost:3030/uploads/mock-generated-video.mp4',
  scriptContent: 'Mock video script content',
  model: 'mock-video-model',
  provider: 'google' as AIProviderName
}

/**
 * Cria um mock de AI Provider configuravel
 */
export function createMockProvider(
  name: AIProviderName = 'openai',
  overrides: Partial<{
    textResponse: GenerateTextResult
    imageResponse: GenerateImageResult
    videoResponse: GenerateVideoResult
    isAvailable: boolean
    capabilities: Partial<AIProviderCapabilities>
  }> = {}
): MockAIProvider {
  return new MockAIProvider(name, overrides)
}

/**
 * Implementacao mock de AIProvider
 */
export class MockAIProvider implements AIProvider {
  readonly name: AIProviderName
  readonly capabilities: AIProviderCapabilities

  private textResponse: GenerateTextResult
  private imageResponse: GenerateImageResult
  private videoResponse: GenerateVideoResult
  private available: boolean

  // Contadores de chamadas para assertions
  public generateTextCalls: GenerateTextOptions[] = []
  public generateImageCalls: GenerateImageOptions[] = []
  public generateVideoCalls: GenerateVideoOptions[] = []

  constructor(
    name: AIProviderName = 'openai',
    overrides: Partial<{
      textResponse: GenerateTextResult
      imageResponse: GenerateImageResult
      videoResponse: GenerateVideoResult
      isAvailable: boolean
      capabilities: Partial<AIProviderCapabilities>
    }> = {}
  ) {
    this.name = name
    this.available = overrides.isAvailable ?? true
    this.textResponse = { ...defaultTextResponse, provider: name, ...overrides.textResponse }
    this.imageResponse = { ...defaultImageResponse, provider: name, ...overrides.imageResponse }
    this.videoResponse = { ...defaultVideoResponse, provider: name, ...overrides.videoResponse }

    this.capabilities = {
      text: true,
      image: name === 'openai' || name === 'google' || name === 'ollama',
      video: name === 'google',
      embeddings: false,
      models: [`${name}-mock-model`],
      ...overrides.capabilities
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.available
  }

  async listModels(): Promise<AIModelInfo[]> {
    return this.capabilities.models.map(id => ({
      id,
      name: id,
      type: 'text' as const
    }))
  }

  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    this.generateTextCalls.push(options)
    return { ...this.textResponse, model: options.model || this.textResponse.model }
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    this.generateImageCalls.push(options)
    if (!this.capabilities.image) {
      throw new Error(`Provider ${this.name} does not support image generation`)
    }
    return { ...this.imageResponse, model: options.model || this.imageResponse.model }
  }

  async generateVideo(options: GenerateVideoOptions): Promise<GenerateVideoResult> {
    this.generateVideoCalls.push(options)
    if (!this.capabilities.video) {
      throw new Error(`Provider ${this.name} does not support video generation`)
    }
    return { ...this.videoResponse, model: options.model || this.videoResponse.model }
  }

  // Metodos utilitarios para testes
  reset(): void {
    this.generateTextCalls = []
    this.generateImageCalls = []
    this.generateVideoCalls = []
  }

  setTextResponse(response: Partial<GenerateTextResult>): void {
    this.textResponse = { ...this.textResponse, ...response }
  }

  setImageResponse(response: Partial<GenerateImageResult>): void {
    this.imageResponse = { ...this.imageResponse, ...response }
  }

  setAvailable(available: boolean): void {
    this.available = available
  }
}
