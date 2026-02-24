// Tipos compartilhados do frontend

// Usuario
export interface User {
  id: number
  email: string
  name?: string
  role?: 'super-admin' | 'admin' | 'editor' | 'viewer'
  createdAt?: string
  updatedAt?: string
}

// Provedores de IA disponiveis
export type AIProviderName = 'openai' | 'google' | 'ollama' | 'anthropic' | 'groq'

// Capacidades de cada provider de IA (centralizado para evitar duplicacao)
export interface AIProviderCapabilities {
  text: boolean
  image: boolean
  video: boolean
}

export const PROVIDER_CAPABILITIES: Record<AIProviderName, AIProviderCapabilities> = {
  openai: { text: true, image: true, video: false },
  google: { text: true, image: true, video: true },
  anthropic: { text: true, image: false, video: false },
  ollama: { text: true, image: true, video: false },
  groq: { text: true, image: false, video: false }
}

// Tipos de agentes de IA disponiveis
export type AgentType =
  | 'reasoning'
  | 'textCreation'
  | 'textAdaptation'
  | 'analysis'
  | 'imageGeneration'
  | 'textOverlay'
  | 'videoGeneration'
  | 'creativeDirection'
  | 'compliance'

// Configuracao de agente de IA
export interface AIAgentConfig {
  provider?: AIProviderName
  model?: string
  temperature?: number
  maxTokens?: number
}

// Configuracao de IA da marca com agentes especializados
export interface BrandAIConfig {
  // Agentes especializados
  reasoning?: AIAgentConfig // Analise complexa, planejamento estrategico
  textCreation?: AIAgentConfig // Geracao de posts, copys, legendas
  textAdaptation?: AIAgentConfig // Reescrita e adaptacao para plataformas
  analysis?: AIAgentConfig // Analise de sentimento, scoring
  imageGeneration?: AIAgentConfig // Geracao de imagens e criativos
  textOverlay?: AIAgentConfig // Adicao de texto sobre imagens (usa modelos de imagem)
  videoGeneration?: AIAgentConfig // Geracao de videos
  creativeDirection?: AIAgentConfig // Briefing, conceito, narrativa
  compliance?: AIAgentConfig // Verificacao de diretrizes da marca
  // Campos legados para compatibilidade
  text?: AIAgentConfig
  image?: AIAgentConfig
  video?: AIAgentConfig
}

// Metadados dos agentes para exibicao na UI
export interface AgentMetadata {
  key: AgentType
  label: string
  description: string
  icon: string
  supportsImage: boolean
  supportsVideo: boolean
}

// Lista de agentes com metadados
export const AI_AGENTS: AgentMetadata[] = [
  {
    key: 'reasoning',
    label: 'Raciocinio',
    description: 'Analise complexa e planejamento estrategico',
    icon: 'psychology',
    supportsImage: false,
    supportsVideo: false
  },
  {
    key: 'textCreation',
    label: 'Criacao de Texto',
    description: 'Geracao de posts, copys e legendas',
    icon: 'edit_note',
    supportsImage: false,
    supportsVideo: false
  },
  {
    key: 'textAdaptation',
    label: 'Adaptacao de Texto',
    description: 'Reescrita e adaptacao para plataformas',
    icon: 'transform',
    supportsImage: false,
    supportsVideo: false
  },
  {
    key: 'analysis',
    label: 'Analise',
    description: 'Analise de sentimento e scoring de conteudo',
    icon: 'analytics',
    supportsImage: false,
    supportsVideo: false
  },
  {
    key: 'imageGeneration',
    label: 'Geracao de Imagem',
    description: 'Criacao de imagens e criativos visuais',
    icon: 'image',
    supportsImage: true,
    supportsVideo: false
  },
  {
    key: 'textOverlay',
    label: 'Texto sobre Imagem',
    description: 'Adicao de texto sobre imagens geradas',
    icon: 'text_fields',
    supportsImage: true,
    supportsVideo: false
  },
  {
    key: 'videoGeneration',
    label: 'Geracao de Video',
    description: 'Criacao de videos e animacoes',
    icon: 'videocam',
    supportsImage: false,
    supportsVideo: true
  },
  {
    key: 'creativeDirection',
    label: 'Direcao Criativa',
    description: 'Briefing, conceito e narrativa',
    icon: 'palette',
    supportsImage: false,
    supportsVideo: false
  },
  {
    key: 'compliance',
    label: 'Compliance',
    description: 'Verificacao de diretrizes da marca',
    icon: 'verified',
    supportsImage: false,
    supportsVideo: false
  }
]

// Tipo para preset de configuracao de IA
export type AIConfigPresetType = 'quality' | 'balanced' | 'budget'

// Interface para preset de IA
export interface AIConfigPreset {
  type: AIConfigPresetType
  label: string
  description: string
  icon: string
  config: BrandAIConfig
}

// Presets de configuracao de IA (Atualizado: Fevereiro 2026)
export const AI_CONFIG_PRESETS: AIConfigPreset[] = [
  {
    type: 'quality',
    label: 'Qualidade Maxima',
    description: 'Melhores modelos disponiveis, sem restricao de custo',
    icon: 'workspace_premium',
    config: {
      reasoning: { provider: 'openai', model: 'o3' },
      textCreation: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
      textAdaptation: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
      analysis: { provider: 'openai', model: 'o3' },
      imageGeneration: { provider: 'openai', model: 'dall-e-3' },
      textOverlay: { provider: 'google', model: 'gemini-2.0-flash-exp-image-generation' },
      videoGeneration: { provider: 'google', model: 'veo-3.0-generate-preview' },
      creativeDirection: { provider: 'openai', model: 'gpt-5.3-codex' },
      compliance: { provider: 'anthropic', model: 'claude-opus-4-6' }
    }
  },
  {
    type: 'balanced',
    label: 'Custo-Beneficio',
    description: 'Equilibrio entre qualidade e custo, combinando provedores',
    icon: 'balance',
    config: {
      reasoning: { provider: 'google', model: 'gemini-3.1-pro-preview' },
      textCreation: { provider: 'openai', model: 'gpt-4o' },
      textAdaptation: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      analysis: { provider: 'groq', model: 'llama-3.1-8b-instant' },
      imageGeneration: { provider: 'google', model: 'imagen-4.0-ultra-generate-001' },
      textOverlay: { provider: 'google', model: 'gemini-2.0-flash-exp-image-generation' },
      videoGeneration: { provider: 'google', model: 'veo-3.0-generate-preview' },
      creativeDirection: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
      compliance: { provider: 'google', model: 'gemini-3.1-pro-preview' }
    }
  },
  {
    type: 'budget',
    label: 'Economico',
    description: 'Menor custo possivel usando modelos gratuitos e locais',
    icon: 'savings',
    config: {
      reasoning: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      textCreation: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      textAdaptation: { provider: 'groq', model: 'llama-3.1-8b-instant' },
      analysis: { provider: 'groq', model: 'llama-3.1-8b-instant' },
      imageGeneration: { provider: 'google', model: 'imagen-4.0-ultra-generate-001' },
      textOverlay: { provider: 'google', model: 'gemini-2.0-flash-exp-image-generation' },
      videoGeneration: { provider: 'google', model: 'veo-2' },
      creativeDirection: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      compliance: { provider: 'groq', model: 'llama-3.3-70b-versatile' }
    }
  }
]

// Modelos disponiveis por provedor (Atualizado: Fevereiro 2026)
export const PROVIDER_MODELS: Record<AIProviderName, { text: string[]; image: string[]; video: string[] }> = {
  openai: {
    text: ['gpt-4o', 'gpt-4o-mini', 'o3', 'o4-mini', 'gpt-5.3-codex', 'gpt-5.2-codex'],
    image: ['dall-e-3', 'dall-e-2'],
    video: []
  },
  anthropic: {
    text: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-3-5-haiku-20241022'],
    image: [],
    video: []
  },
  google: {
    text: ['gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    image: [
      'imagen-4.0-ultra-generate-001',
      'imagen-3',
      'nano-banana-pro-preview',
      'nano-banana-preview'
    ],
    video: ['veo-3.0-generate-preview', 'veo-2']
  },
  groq: {
    text: ['llama-3.3-70b-versatile', 'llama-4-scout-17b-16e-instruct', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    image: [],
    video: []
  },
  ollama: {
    text: ['llama3.3', 'llama3.2', 'qwen2.5', 'mistral', 'mixtral'],
    image: ['stable-diffusion'],
    video: []
  }
}

// Helper para obter modelos por agente
export function getModelsForAgent(provider: AIProviderName, agentType: AgentType): string[] {
  const providerModels = PROVIDER_MODELS[provider]
  if (!providerModels) return []

  // Agentes de imagem (incluindo textOverlay que usa modelos de imagem)
  if (agentType === 'imageGeneration' || agentType === 'textOverlay') {
    return providerModels.image
  }

  // Agentes de video
  if (agentType === 'videoGeneration') {
    return providerModels.video
  }

  // Todos os outros sao agentes de texto
  return providerModels.text
}

// Prompts da marca
export interface BrandPrompts {
  text?: string
  image?: string
  video?: string
}

// Marca
export interface Brand {
  id: number
  userId: number
  name: string
  description?: string
  sector?: string
  toneOfVoice?: string
  values?: string[]
  preferredWords?: string[]
  avoidedWords?: string[]
  targetAudience?: string
  competitors?: string[]
  brandColors?: string[]
  logoUrl?: string
  prompts?: BrandPrompts
  aiConfig?: BrandAIConfig
  createdAt?: string
  updatedAt?: string
}

// Status de post (alinhado com backend validStatuses)
export type PostStatus = 'draft' | 'approved' | 'scheduled' | 'published' | 'failed'

// Origem do post
export type PostOrigin = 'manual' | 'ai' | 'rewritten'

// Modos de geracao de IA
export type AIMode = 'text' | 'carousel'
export type AIType = 'post' | 'story' | 'reels' | 'article'
export type AITone = 'formal' | 'casual' | 'humoristico' | 'inspirador'

// Post
export interface Post {
  id: number
  brandId: number
  userId: number
  content: string
  platform: string
  status: PostStatus
  origin: PostOrigin
  aiPrompt?: string
  aiContext?: string
  aiMode?: AIMode
  aiType?: AIType
  aiTone?: AITone
  aiReferenceImages?: string[]
  charCount?: number
  charLimit?: number
  warnings?: string[]
  mediaUrls?: string[]
  slides?: CarouselSlide[]
  // Briefing criativo para regeneracao de imagens em diferentes proporcoes
  creativeBriefing?: CreativeBriefing
  // Campos de uso de IA (ultima geracao) - mantidos para compatibilidade
  lastUsagePromptTokens?: number
  lastUsageCompletionTokens?: number
  lastUsageTotalTokens?: number
  lastUsageCostUsd?: number
  lastUsageCostBreakdown?: AICostBreakdown
  lastUsageProvider?: string
  lastUsageModel?: string
  // Campos de multiplas execucoes de IA (acumulados)
  aiExecutions?: AIExecution[]
  totalPromptTokens?: number
  totalCompletionTokens?: number
  totalTokensUsed?: number
  totalCostUsd?: number
  totalImagesGenerated?: number
  executionCount?: number
  // Campo de versao ativa
  currentVersionId?: number
  // Campos de controle de geracao de IA em andamento
  aiState?: 'idle' | 'loading' | 'error'
  activeLogId?: number
  scheduledAt?: string
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

// Fonte da versao do post
export type VersionSource = 'ai' | 'manual'

// Versao do post (cada geracao de IA cria uma nova versao)
export interface PostVersion {
  id: number
  postId: number
  logId?: number
  version: number
  // Conteudo da versao
  content: string
  caption?: string
  slides?: CarouselSlide[]
  mediaUrls?: string[]
  creativeBriefing?: CreativeBriefing
  // Metadados
  isActive: boolean
  source: VersionSource
  prompt?: string
  // Estatisticas de geracao (somente para source=ai)
  totalTokens?: number
  costUsd?: number
  executionTimeMs?: number
  // Timestamps
  createdAt?: string
  updatedAt?: string
}

// Plataforma
export interface Platform {
  id: number
  name: string
  displayName: string
  charLimit: number
  features?: Record<string, unknown>
  active: boolean
  createdAt?: string
  updatedAt?: string
}

// Role
export interface Role {
  id: number
  name: string
  description?: string
  permissions: string[]
  createdAt?: string
  updatedAt?: string
}

// Prompt Template
export interface PromptTemplate {
  id: number
  name: string
  type: 'text' | 'image' | 'video'
  template: string
  description?: string
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

// Origem da midia
export type MediaSource = 'upload' | 'ai-generated'

// Media (arquivos de midia enviados)
export interface Media {
  id: number
  userId: number
  originalName: string
  storedName: string
  mimeType: string
  size: number
  path: string
  url: string
  source?: MediaSource
  createdAt?: string
  updatedAt?: string
}

// Imagem para enviar ao prompt de IA
export interface AIImage {
  url: string
  mimeType?: string
}

// Parametros de geracao de IA
export interface AIGenerateParams {
  brandId: number
  prompt: string
  type: 'text' | 'image' | 'video'
  platform?: string
  images?: AIImage[]
  options?: {
    provider?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

// Proposito de slide do carrousel
export type SlidePurpose = 'hook' | 'features' | 'summary' | 'cta'

// Proporcoes de imagem suportadas
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9'

// Versao derivada de uma imagem
export interface ImageVersion {
  aspectRatio: AspectRatio
  imageUrl: string
  size: string
  hasText: boolean
  generatedAt: string
}

// Metadados de geracao de imagem
export interface ImageGenerationMetadata {
  provider: string
  model: string
  generatedAt: string
}

// Configuracao de tipografia para overlay de texto
export interface TypographyConfig {
  text: string
  fontStyle: 'bold' | 'regular' | 'light' | 'italic'
  fontFamily: 'sans-serif' | 'serif' | 'display' | 'handwritten'
  position: 'center' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: 'small' | 'medium' | 'large' | 'xlarge'
  color: string
  backgroundColor?: string
  backgroundStyle?: 'gradient' | 'blur' | 'solid' | 'none'
  alignment: 'left' | 'center' | 'right'
  shadow?: boolean
  outline?: boolean
}

// Slide do carrousel com suporte a master image e versoes
export interface CarouselSlide {
  index: number
  purpose: SlidePurpose
  text: string
  imageUrl?: string // Imagem final (com texto) - retrocompativel
  imagePrompt?: string
  // Novos campos para arquitetura master + derivadas
  masterImageUrl?: string // Imagem base SEM texto
  typography?: TypographyConfig
  versions?: Partial<Record<AspectRatio, ImageVersion>>
  generationMetadata?: ImageGenerationMetadata
}

// Briefing criativo gerado pelo agente de direcao criativa
export interface CreativeBriefing {
  concept: string
  narrative: string
  visualStyle: string
  colorPalette: string[]
  moodKeywords: string[]
  typography?: {
    fontFamily: 'sans-serif' | 'serif' | 'display' | 'handwritten'
    primaryColor: string
    secondaryColor: string
    style: 'modern' | 'classic' | 'playful' | 'elegant' | 'bold'
  }
  slides: Array<{
    purpose: SlidePurpose
    direction: string
    keyMessage: string
  }>
}

// Breakdown de custo de IA
export interface AICostBreakdown {
  inputCost: number
  outputCost: number
  imageCost: number
  videoCost: number
}

// Custo por agente (usado em carousels)
export interface AgentCost {
  agentType: string
  provider: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  imagesGenerated?: number
}

// Uma execucao de IA (cada geracao e uma execucao)
export interface AIExecution {
  id: string // UUID para identificar a execucao
  type: string // 'generate', 'rewrite', 'adapt', 'suggest-hashtags', 'carousel'
  provider: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  costBreakdown: AICostBreakdown
  imagesGenerated?: number
  // Para carousels: breakdown por agente
  agentBreakdown?: AgentCost[]
  timestamp: string
}

// Uso de IA com informacoes de custo
export interface AIUsageInfo {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd?: number
  costBreakdown?: AICostBreakdown
  // Para carousels: breakdown por agente
  agentBreakdown?: AgentCost[]
}

// Resultado de geracao de IA
export interface AIGenerateResult {
  content: string
  type?: 'text' | 'image' | 'video'
  provider: string
  model?: string
  usage?: AIUsageInfo
  // Campos para carrousel
  slides?: CarouselSlide[]
  briefing?: CreativeBriefing
  postId?: number
  logId?: number
}

