// Tipos para o sistema de agentes de IA

import type { AIProviderName, GenerateTextResult, GenerateImageResult } from '../ai-providers'

// Tipos de agentes disponiveis
export type AgentType =
  | 'creativeDirection'
  | 'analysis'
  | 'textCreation'
  | 'imageGeneration'
  | 'textOverlay'
  | 'compliance'

// Configuracao de agente por tipo (espelha o schema da marca)
// Usa string para provider pois vem do schema da marca
export interface AIAgentConfig {
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

// Configuracao completa de IA da marca
export interface BrandAIConfig {
  reasoning?: AIAgentConfig
  textCreation?: AIAgentConfig
  textAdaptation?: AIAgentConfig
  analysis?: AIAgentConfig
  imageGeneration?: AIAgentConfig
  textOverlay?: AIAgentConfig
  videoGeneration?: AIAgentConfig
  creativeDirection?: AIAgentConfig
  compliance?: AIAgentConfig
  // Campos legados
  text?: AIAgentConfig
  image?: AIAgentConfig
  video?: AIAgentConfig
}

// Proposito de cada slide do carrousel
export type SlidePurpose = 'hook' | 'features' | 'summary' | 'cta'

// Tipos para estilo de overlay/scrim
export type OverlayType = 'gradient' | 'blur' | 'solid' | 'none'
export type GradientDirection = 'bottom-up' | 'top-down' | 'left-right' | 'radial'
export type CornerRadius = 'none' | 'subtle' | 'rounded'
export type OverlayPadding = 'compact' | 'normal' | 'spacious'

// Configuracao global de overlay definida pelo diretor criativo
export interface OverlayStyleConfig {
  designReference: string // Ex: "Apple keynote minimalism", "luxury magazine editorial"
  defaultType: OverlayType
  gradientDirection: GradientDirection
  opacity: number // 0.5 - 0.95
  cornerRadius: CornerRadius
  padding: OverlayPadding
}

// Configuracao de overlay especifica por slide
export interface SlideOverlayConfig {
  type: OverlayType
  position: 'center' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  description: string // Descricao detalhada do visual do overlay
}

// Configuracao de tipografia para overlay de texto
export interface TypographyConfig {
  text: string
  fontStyle: 'bold' | 'regular' | 'light' | 'italic'
  fontFamily: 'sans-serif' | 'serif' | 'display' | 'handwritten'
  position: 'center' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: 'small' | 'medium' | 'large' | 'xlarge'
  color: string // hex color
  backgroundColor?: string // hex color for text panel/background
  backgroundStyle?: OverlayType
  alignment: 'left' | 'center' | 'right'
  shadow?: boolean
  outline?: boolean
}

// Proporcoes de imagem suportadas
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9'

// Dimensoes por proporcao
export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 }
}

// Versao derivada de uma imagem
export interface ImageVersion {
  aspectRatio: AspectRatio
  imageUrl: string
  size: string // Ex: '1080x1080'
  hasText: boolean
  generatedAt: string
}

// Metadados de geracao de imagem
export interface ImageGenerationMetadata {
  provider: string
  model: string
  generatedAt: string
}

// Slide do carrousel com suporte a master image e versoes
export interface CarouselSlide {
  index: number
  purpose: SlidePurpose
  text?: string // Texto sobreposto na imagem (opcional - agente decide)
  imageUrl?: string // URL da imagem final (com texto) - retrocompativel
  imagePrompt?: string
  typography?: TypographyConfig // Configuracao de tipografia para overlay
  // Novos campos para arquitetura master + derivadas
  masterImageUrl?: string // Imagem base SEM texto (alta res)
  versions?: Partial<Record<AspectRatio, ImageVersion>> // Versoes derivadas por proporcao
  generationMetadata?: ImageGenerationMetadata // Metadados da geracao
}

// Briefing criado pelo agente de direcao criativa
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
  // Configuracao de overlay/scrim definida pelo diretor criativo
  overlayStyle?: OverlayStyleConfig
  slides: Array<{
    purpose: SlidePurpose
    direction: string
    keyMessage: string
    // Configuracao especifica de overlay para este slide
    overlayConfig?: SlideOverlayConfig
  }>
}

// Resultado de analise
export interface AnalysisResult {
  approved: boolean
  score: number
  feedback: string
  suggestions: string[]
}

// Resultado de compliance
export interface ComplianceResult {
  approved: boolean
  violations: Array<{
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
  suggestions: string[]
}

// Execucao de um agente
export interface AgentExecution {
  agentType: AgentType
  provider: AIProviderName
  model: string
  startedAt: string
  completedAt?: string
  systemPrompt: string
  userPrompt: string
  result?: string
  imageUrl?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  error?: string
  status: 'success' | 'failed' | 'retried'
}

// Prompts customizados da marca
export interface BrandPrompts {
  text?: string
  image?: string
  video?: string
}

// Contexto compartilhado entre agentes
export interface AgentContext {
  brandId: number
  brandName: string
  brandDescription?: string
  toneOfVoice?: string
  values?: string[]
  preferredWords?: string[]
  avoidedWords?: string[]
  targetAudience?: string
  brandColors?: string[]
  // Novos campos para melhorar qualidade dos overlays
  sector?: string // Setor de atuacao (tech, moda, alimentos, etc.)
  competitors?: string[] // Concorrentes (indica nivel de design esperado)
  logoUrl?: string // URL do logo da marca
  prompts?: BrandPrompts // Prompts customizados da marca
  platform: string
  originalPrompt: string
  referenceImages?: string[]
  userId: number
  // Configuracao de IA da marca para cada tipo de agente
  aiConfig?: BrandAIConfig
}

// Resultado de texto gerado
export interface TextGenerationResult extends GenerateTextResult {
  slideIndex?: number
  purpose?: SlidePurpose
}

// Resultado de imagem gerada
export interface ImageGenerationResult extends GenerateImageResult {
  slideIndex?: number
  purpose?: SlidePurpose
}

// Resultado completo da orquestracao
export interface OrchestrationResult {
  success: boolean
  slides: CarouselSlide[]
  caption?: string // Descricao geral do post (caption do Instagram, etc)
  briefing?: CreativeBriefing
  executions: AgentExecution[]
  totalTokens: {
    prompt: number
    completion: number
    total: number
  }
  executionTimeMs: number
  error?: string
}

// Configuracao de retry
export interface RetryConfig {
  maxAttempts: number
  delayMs: number
  backoffMultiplier: number
}

// Configuracao do orquestrador
export interface OrchestratorConfig {
  retry: RetryConfig
  timeout: number
  saveIntermediateResults: boolean
}
