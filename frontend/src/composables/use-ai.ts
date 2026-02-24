import { ref, type Ref } from 'vue'
import { api, feathersClient } from 'src/api'
import type { AIGenerateResult, AIImage, CarouselSlide } from 'src/types'

// Tipos de operacao suportados pelo backend
type AIOperationType = 'generate' | 'rewrite' | 'adapt' | 'suggest-hashtags' | 'carousel'

// Plataformas de redes sociais suportadas pelo backend
type SocialPlatform = 'twitter' | 'instagram' | 'linkedin' | 'threads' | 'facebook' | 'tiktok'

// Etapas do processo de geracao
export type GenerationStep =
  | 'loading_brand'
  | 'creative_direction'
  | 'analysis'
  | 'text_creation'
  | 'compliance'
  | 'image_generation'
  | 'text_overlay'
  | 'completed'
  | 'failed'

// Sub-etapa para operacoes com multiplos itens
export interface SubStep {
  current: number
  total: number
  itemName?: string
}

// Progresso da geracao em tempo real
export interface GenerationProgress {
  step: GenerationStep
  stepIndex: number
  totalSteps: number
  message: string
  agentType?: string
  subStep?: SubStep
  execution?: {
    agentType: string
    model: string
    provider: string
    promptTokens?: number
    completionTokens?: number
    executionTimeMs?: number
    success: boolean
    error?: string
  }
}

// Tipos de proporcao de imagem
type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9'

// Dados para enviar ao servico de AI (conforme schema do backend)
interface AIServiceData {
  brandId: number
  type: AIOperationType
  prompt?: string
  images?: AIImage[]
  platform?: SocialPlatform
  provider?: string
  includeHashtags?: boolean
  originalContent?: string
  originalPlatform?: SocialPlatform
  targetPlatform?: SocialPlatform
  content?: string
  saveAsPost?: boolean
  targetAspectRatio?: AspectRatio
  // ID do post existente para atualizar (ao inves de criar novo)
  postId?: number
}

export function useAI() {
  const aiService = api.service('ai')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Estado de progresso em tempo real
  const progress = ref<GenerationProgress | null>(null)
  const progressLogs = ref<GenerationProgress[]>([]) as Ref<GenerationProgress[]>

  // Gerar texto (com suporte a imagens para vision)
  const generateText = async (
    brandId: number,
    prompt: string,
    platform?: string,
    options?: { provider?: string },
    images?: AIImage[]
  ): Promise<AIGenerateResult | null> => {
    loading.value = true
    error.value = null
    try {
      const data: AIServiceData = {
        brandId,
        type: 'generate',
        prompt
      }
      if (platform) data.platform = platform as SocialPlatform
      if (options?.provider) data.provider = options.provider
      if (images && images.length > 0) data.images = images

      const result = await aiService.create(data)
      return result as AIGenerateResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao gerar conteudo'
      return null
    } finally {
      loading.value = false
    }
  }

  // Reescrever conteudo para outra plataforma
  const rewrite = async (
    brandId: number,
    content: string,
    targetPlatform: string,
    options?: { provider?: string }
  ): Promise<AIGenerateResult | null> => {
    loading.value = true
    error.value = null
    try {
      const data: AIServiceData = {
        brandId,
        type: 'rewrite',
        originalContent: content,
        targetPlatform: targetPlatform as SocialPlatform
      }
      if (options?.provider) data.provider = options.provider

      const result = await aiService.create(data)
      return result as AIGenerateResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao reescrever conteudo'
      return null
    } finally {
      loading.value = false
    }
  }

  // Sugerir hashtags
  const suggestHashtags = async (
    brandId: number,
    content: string,
    platform?: string
  ): Promise<AIGenerateResult | null> => {
    loading.value = true
    error.value = null
    try {
      const data: AIServiceData = {
        brandId,
        type: 'suggest-hashtags',
        content,
        includeHashtags: true
      }
      if (platform) data.platform = platform as SocialPlatform

      const result = await aiService.create(data)
      return result as AIGenerateResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao sugerir hashtags'
      return null
    } finally {
      loading.value = false
    }
  }

  // Gerar carrousel com 4 slides usando sistema de agentes
  const generateCarousel = async (
    brandId: number,
    prompt: string,
    platform?: string,
    options?: { saveAsPost?: boolean; targetAspectRatio?: AspectRatio; postId?: number },
    images?: AIImage[]
  ): Promise<AIGenerateResult | null> => {
    loading.value = true
    error.value = null
    progress.value = null
    progressLogs.value = []

    // Escuta eventos de progresso via socket
    const logsService = feathersClient.service('ai-generation-logs')
    const handleProgress = (data: { logId: number; progress: GenerationProgress }) => {
      progress.value = data.progress
      progressLogs.value.push(data.progress)
    }
    logsService.on('progress', handleProgress)

    try {
      const data: AIServiceData = {
        brandId,
        type: 'carousel',
        prompt,
        saveAsPost: options?.saveAsPost !== false
      }
      if (platform) data.platform = platform as SocialPlatform
      if (images && images.length > 0) data.images = images
      if (options?.targetAspectRatio) data.targetAspectRatio = options.targetAspectRatio
      // Se postId foi passado, envia para atualizar post existente ao inves de criar novo
      if (options?.postId) data.postId = options.postId

      const result = await aiService.create(data)
      return result as AIGenerateResult
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao gerar carrousel'
      return null
    } finally {
      loading.value = false
      logsService.off('progress', handleProgress)
    }
  }

  // Limpar progresso manualmente
  const clearProgress = () => {
    progress.value = null
    progressLogs.value = []
  }

  // Referencia para o handler de progresso ativo (para desconectar depois)
  let activeProgressHandler: ((data: { logId: number; progress: GenerationProgress }) => void) | null = null

  // Reconectar aos eventos de progresso de uma geracao em andamento
  // Usado quando o usuario atualiza a pagina durante uma geracao
  // Agora busca o status atual do log antes de se inscrever nos eventos
  const reconnectToProgress = async (activeLogId: number): Promise<(() => void) | null> => {
    const logsService = feathersClient.service('ai-generation-logs')

    // Remove handler anterior se existir
    if (activeProgressHandler) {
      logsService.off('progress', activeProgressHandler)
    }

    try {
      // Busca o log atual para verificar status e recuperar lastProgress
      const log = await logsService.get(activeLogId)

      // Se a geracao ja terminou, nao reconecta
      if (log.status === 'completed' || log.status === 'failed') {
        loading.value = false
        // Restaura o ultimo progresso para exibir estado final
        if (log.lastProgress) {
          progress.value = log.lastProgress as GenerationProgress
        }
        return null
      }

      // Restaura o ultimo progresso conhecido do banco de dados
      // Isso permite mostrar o estado atual mesmo apos refresh
      if (log.lastProgress) {
        progress.value = log.lastProgress as GenerationProgress
        progressLogs.value.push(log.lastProgress as GenerationProgress)
      }

      // Cria novo handler que filtra por logId
      activeProgressHandler = (data: { logId: number; progress: GenerationProgress }) => {
        if (data.logId === activeLogId) {
          progress.value = data.progress
          progressLogs.value.push(data.progress)

          // Se a geracao terminou, desconecta automaticamente
          if (data.progress.step === 'completed' || data.progress.step === 'failed') {
            disconnectProgress()
          }
        }
      }

      logsService.on('progress', activeProgressHandler)
      loading.value = true

      // Retorna funcao para desconectar manualmente
      return disconnectProgress
    } catch (err) {
      console.error('[useAI] Erro ao reconectar ao progresso:', err)
      loading.value = false
      return null
    }
  }

  // Desconecta do evento de progresso
  const disconnectProgress = () => {
    if (activeProgressHandler) {
      const logsService = feathersClient.service('ai-generation-logs')
      logsService.off('progress', activeProgressHandler)
      activeProgressHandler = null
    }
    loading.value = false
  }

  // Listar providers disponiveis
  const getProviders = async () => {
    try {
      const result = await api.service('ai-providers').find({})
      return result.data || result
    } catch {
      return []
    }
  }

  // Regenerar imagem de um slide especifico do carousel
  const regenerateSlideImage = async (
    postId: number,
    slideIndex: number
  ): Promise<{ slide: CarouselSlide; success: boolean } | null> => {
    loading.value = true
    error.value = null
    try {
      // Usa service customizado de regeneracao de slide
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const regenerateService = (api as any).service('posts/regenerate-slide')
      const result = await regenerateService.create({
        postId,
        slideIndex
      })
      return result as { slide: CarouselSlide; success: boolean }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao regenerar imagem do slide'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    progress,
    progressLogs,
    generateText,
    rewrite,
    suggestHashtags,
    generateCarousel,
    clearProgress,
    getProviders,
    regenerateSlideImage,
    reconnectToProgress,
    disconnectProgress
  }
}

