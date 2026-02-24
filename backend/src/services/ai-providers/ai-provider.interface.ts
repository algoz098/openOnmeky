// Interface base para todos os providers de IA
// Define contratos que todos os providers devem implementar

export type AIProviderName = 'openai' | 'google' | 'ollama' | 'anthropic' | 'groq'

// Tipos de agentes de IA disponiveis
export type AgentType =
  | 'reasoning' // Analise complexa, planejamento estrategico
  | 'textCreation' // Geracao de posts, copys, legendas
  | 'textAdaptation' // Reescrita e adaptacao para plataformas
  | 'analysis' // Analise de sentimento, scoring
  | 'imageGeneration' // Geracao de imagens e criativos
  | 'videoGeneration' // Geracao de videos
  | 'creativeDirection' // Briefing, conceito, narrativa
  | 'compliance' // Verificacao de diretrizes da marca

// Tipos legados mantidos para compatibilidade
export type LegacyAgentType = 'text' | 'image' | 'video'

// Modelos recomendados por tipo de agente (Atualizado: Fevereiro 2026)
export const recommendedModels: Record<AgentType, Record<AIProviderName, string[]>> = {
  reasoning: {
    openai: ['o3', 'o4-mini', 'gpt-4o'],
    anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6'],
    google: ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    groq: ['llama-3.3-70b-versatile', 'llama-4-scout-17b-16e-instruct'],
    ollama: ['mixtral', 'llama3.3', 'qwen2.5']
  },
  textCreation: {
    openai: ['gpt-4o', 'gpt-4o-mini'],
    anthropic: ['claude-sonnet-4-6', 'claude-3-5-haiku-20241022'],
    google: ['gemini-3.1-pro-preview', 'gemini-2.0-flash'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
    ollama: ['llama3.3', 'llama3.2', 'mistral']
  },
  textAdaptation: {
    openai: ['gpt-4o-mini', 'gpt-4o'],
    anthropic: ['claude-3-5-haiku-20241022', 'claude-sonnet-4-6'],
    google: ['gemini-2.0-flash', 'gemini-2.5-flash'],
    groq: ['llama-3.1-8b-instant', 'gemma2-9b-it'],
    ollama: ['llama3.2', 'mistral']
  },
  analysis: {
    openai: ['o4-mini', 'gpt-4o-mini'],
    anthropic: ['claude-3-5-haiku-20241022', 'claude-sonnet-4-6'],
    google: ['gemini-2.0-flash', 'gemini-2.5-flash'],
    groq: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
    ollama: ['llama3.2', 'llama3.3']
  },
  imageGeneration: {
    openai: ['dall-e-3', 'dall-e-2'],
    anthropic: [],
    google: ['imagen-4.0-ultra-generate-001', 'imagen-3'],
    groq: [],
    ollama: ['stable-diffusion']
  },
  videoGeneration: {
    openai: [],
    anthropic: [],
    google: ['veo-3.0-generate-preview', 'veo-2'],
    groq: [],
    ollama: []
  },
  creativeDirection: {
    openai: ['gpt-5.3-codex', 'gpt-4o', 'o3'],
    anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6'],
    google: ['gemini-3.1-pro-preview', 'gemini-2.5-flash'],
    groq: ['llama-3.3-70b-versatile', 'llama-4-scout-17b-16e-instruct'],
    ollama: ['mixtral', 'llama3.3', 'qwen2.5']
  },
  compliance: {
    openai: ['o3', 'gpt-4o', 'gpt-4o-mini'],
    anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6'],
    google: ['gemini-3.1-pro-preview', 'gemini-2.0-flash'],
    groq: ['llama-3.3-70b-versatile'],
    ollama: ['llama3.3', 'llama3.2']
  }
}

// Conteudo de imagem para mensagens multimodais (vision)
export interface AIImageContent {
  type: 'image'
  url: string
  mimeType?: string
}

// Conteudo de texto para mensagens
export interface AITextContent {
  type: 'text'
  text: string
}

// Conteudo pode ser texto ou imagem (para vision)
export type AIMessageContent = AITextContent | AIImageContent

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | AIMessageContent[]
}

export interface GenerateTextOptions {
  messages: AIMessage[]
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  stopSequences?: string[]
}

export interface GenerateTextResult {
  content: string
  model: string
  provider: AIProviderName
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
}

export interface GenerateImageOptions {
  prompt: string
  model?: string
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'natural' | 'vivid'
  n?: number
  // Imagens de referencia para gerar imagens semelhantes (URLs ou base64)
  referenceImages?: string[]
}

export interface GenerateImageResult {
  images: Array<{
    url?: string
    base64?: string
    revisedPrompt?: string
  }>
  model: string
  provider: AIProviderName
}

export interface GenerateVideoOptions {
  prompt: string
  model?: string
  duration?: number
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export interface GenerateVideoResult {
  videoUrl?: string
  scriptContent?: string
  model: string
  provider: AIProviderName
}

export interface AIProviderConfig {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
  defaultModel?: string
  timeout?: number
}

export interface AIProviderCapabilities {
  text: boolean
  image: boolean
  video: boolean
  embeddings: boolean
  models: string[]
}

/** Informacao sobre um modelo de IA */
export interface AIModelInfo {
  id: string
  name: string
  type: 'text' | 'image' | 'video' | 'embedding' | 'unknown'
  contextWindow?: number
  maxOutputTokens?: number
}

/**
 * Interface base que todos os providers de IA devem implementar
 */
export interface AIProvider {
  /** Nome do provider */
  readonly name: AIProviderName

  /** Capacidades do provider */
  readonly capabilities: AIProviderCapabilities

  /**
   * Verifica se o provider esta disponivel e configurado corretamente
   */
  isAvailable(): Promise<boolean>

  /**
   * Lista modelos disponiveis no provider (busca dinamica da API)
   */
  listModels(): Promise<AIModelInfo[]>

  /**
   * Gera texto usando o modelo de linguagem
   */
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>

  /**
   * Gera imagem (se suportado pelo provider)
   */
  generateImage?(options: GenerateImageOptions): Promise<GenerateImageResult>

  /**
   * Gera video ou roteiro de video (se suportado pelo provider)
   */
  generateVideo?(options: GenerateVideoOptions): Promise<GenerateVideoResult>
}

/**
 * Classe abstrata base para providers de IA
 * Implementa funcionalidades comuns e define contratos
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: AIProviderName
  abstract readonly capabilities: AIProviderCapabilities

  protected config: AIProviderConfig

  constructor(config: AIProviderConfig = {}) {
    this.config = config
  }

  abstract isAvailable(): Promise<boolean>
  abstract generateText(options: GenerateTextOptions): Promise<GenerateTextResult>

  /**
   * Lista modelos disponiveis - implementacao padrao retorna lista estatica
   */
  async listModels(): Promise<AIModelInfo[]> {
    return this.capabilities.models.map(id => ({
      id,
      name: id,
      type: 'text' as const
    }))
  }

  async generateImage(_options: GenerateImageOptions): Promise<GenerateImageResult> {
    throw new Error(`Provider ${this.name} does not support image generation`)
  }

  async generateVideo(_options: GenerateVideoOptions): Promise<GenerateVideoResult> {
    throw new Error(`Provider ${this.name} does not support video generation`)
  }
}
