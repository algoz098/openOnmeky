// Agent Orchestrator
// Coordinates execution of all agents to generate a complete carousel

import type { Application } from '../../declarations'
import { CreativeDirectionAgent } from './creative-direction-agent'
import { AnalysisAgent } from './analysis-agent'
import { TextCreationAgent } from './text-creation-agent'
import { ImageGenerationAgent } from './image-generation-agent'
import { TextOverlayAgent } from './text-overlay-agent'
import { ComplianceAgent } from './compliance-agent'
import { AIRequestLogger } from '../ai-requests/ai-request-logger'
import type { AIRequestActionCode } from '../ai-requests/ai-requests.schema'
import type {
  AgentContext,
  AgentExecution,
  OrchestrationResult,
  CarouselSlide,
  CreativeBriefing,
  BrandAIConfig
} from './types'

export interface OrchestratorInput {
  brandId: number
  userId: number
  prompt: string
  platform: string
  referenceImages?: string[]
  logId?: number // Log ID for real-time updates
  targetAspectRatio?: '1:1' | '4:5' | '9:16' | '16:9' // Proporcao alvo para imagens
  // Campos para logging de ai_requests
  postId?: number // ID do post para associar ai_requests
  requestedAt?: Date // Timestamp de quando usuario clicou
}

// Generation process steps
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

export interface GenerationProgress {
  step: GenerationStep
  stepIndex: number
  totalSteps: number
  message: string
  agentType?: string
  execution?: AgentExecution
  // Sub-etapa para operacoes com multiplos itens (ex: geracao de imagens)
  subStep?: {
    current: number
    total: number
    itemName?: string
  }
}

// Callback para agentes reportarem sub-etapas
export type ProgressCallback = (subStep: {
  current: number
  total: number
  itemName?: string
}) => Promise<void>

export class AgentOrchestrator {
  private app: Application
  private creativeAgent: CreativeDirectionAgent
  private analysisAgent: AnalysisAgent
  private textAgent: TextCreationAgent
  private imageAgent: ImageGenerationAgent
  private textOverlayAgent: TextOverlayAgent
  private complianceAgent: ComplianceAgent
  private requestLogger: AIRequestLogger
  private logId?: number
  // Campos para logging de ai_requests
  private postId?: number
  private userId?: number
  private brandId?: number
  private requestedAt?: Date
  private actionCode: AIRequestActionCode = 'carousel_generate'

  constructor(app: Application) {
    this.app = app
    this.creativeAgent = new CreativeDirectionAgent(app)
    this.analysisAgent = new AnalysisAgent(app)
    this.textAgent = new TextCreationAgent(app)
    this.imageAgent = new ImageGenerationAgent(app)
    this.textOverlayAgent = new TextOverlayAgent(app)
    this.complianceAgent = new ComplianceAgent(app)
    this.requestLogger = new AIRequestLogger(app)
  }

  // Valida configuracao de IA da marca ANTES de iniciar a geracao
  // Garante que todos os modelos configurados sao validos e suportados
  private validateConfiguration(aiConfig: BrandAIConfig | undefined): void {
    if (!aiConfig) {
      console.log('[Orchestrator] Nenhuma configuracao de IA na marca, usando defaults')
      return
    }

    const errors: string[] = []

    // Mapeamento de agentes para tipo de modelo esperado
    const agentModelTypes: Record<string, 'text' | 'image' | 'video'> = {
      reasoning: 'text',
      textCreation: 'text',
      textAdaptation: 'text',
      analysis: 'text',
      imageGeneration: 'image',
      textOverlay: 'image',
      videoGeneration: 'video',
      creativeDirection: 'text',
      compliance: 'text',
      // Campos legados
      text: 'text',
      image: 'image',
      video: 'video'
    }

    // Providers que suportam cada tipo de modelo
    const providerCapabilities: Record<string, { text: boolean; image: boolean; video: boolean }> = {
      openai: { text: true, image: true, video: false },
      google: { text: true, image: true, video: true },
      anthropic: { text: true, image: false, video: false },
      groq: { text: true, image: false, video: false },
      ollama: { text: true, image: true, video: false }
    }

    // Modelos de imagem conhecidos e seus providers
    const knownImageModels: Record<string, string> = {
      'dall-e-2': 'openai',
      'dall-e-3': 'openai',
      'gpt-image-1': 'openai'
    }

    // Prefixos de modelos de imagem
    const imageModelPrefixes: Array<{ prefix: string; provider: string }> = [
      { prefix: 'dall-e', provider: 'openai' },
      { prefix: 'gpt-image', provider: 'openai' },
      { prefix: 'imagen', provider: 'google' },
      { prefix: 'gemini', provider: 'google' },
      { prefix: 'nano-banana', provider: 'google' },
      { prefix: 'flash', provider: 'google' },
      { prefix: 'stable-diffusion', provider: 'ollama' },
      { prefix: 'sd-', provider: 'ollama' }
    ]

    // Valida cada agente configurado
    for (const [agentKey, config] of Object.entries(aiConfig)) {
      if (!config || typeof config !== 'object') continue

      const agentConfig = config as { provider?: string; model?: string }
      const expectedType = agentModelTypes[agentKey]
      if (!expectedType) continue

      const provider = agentConfig.provider
      const model = agentConfig.model

      // Valida provider
      if (provider && !providerCapabilities[provider]) {
        errors.push(`Agente "${agentKey}": provider "${provider}" nao e reconhecido`)
        continue
      }

      // Valida se provider suporta o tipo de modelo
      if (provider && expectedType) {
        const caps = providerCapabilities[provider]
        if (expectedType === 'image' && !caps.image) {
          errors.push(
            `Agente "${agentKey}": provider "${provider}" nao suporta geracao de imagem. ` +
              `Use: openai, google ou ollama`
          )
        }
        if (expectedType === 'video' && !caps.video) {
          errors.push(
            `Agente "${agentKey}": provider "${provider}" nao suporta geracao de video. Use: google`
          )
        }
      }

      // Valida modelo de imagem
      if (model && expectedType === 'image') {
        // Verifica se modelo e conhecido diretamente
        const directProvider = knownImageModels[model]
        if (directProvider) {
          if (provider && provider !== directProvider) {
            errors.push(
              `Agente "${agentKey}": modelo "${model}" pertence ao provider "${directProvider}", ` +
                `mas esta configurado para usar "${provider}"`
            )
          }
        } else {
          // Verifica por prefixo
          const matchingPrefix = imageModelPrefixes.find(
            p => model.includes(p.prefix) || model.startsWith(p.prefix)
          )
          if (!matchingPrefix) {
            errors.push(
              `Agente "${agentKey}": modelo de imagem "${model}" nao e reconhecido. ` +
                `Modelos suportados: dall-e-2, dall-e-3, gpt-image-1, imagen-*, gemini-*, nano-banana-*, stable-diffusion`
            )
          } else if (provider && provider !== matchingPrefix.provider) {
            errors.push(
              `Agente "${agentKey}": modelo "${model}" pertence ao provider "${matchingPrefix.provider}", ` +
                `mas esta configurado para usar "${provider}"`
            )
          }
        }
      }
    }

    // Se houver erros, lanca excecao com todos os problemas encontrados
    if (errors.length > 0) {
      const errorMessage =
        `Configuracao de IA invalida para a marca:\n` + errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
      console.error(`[Orchestrator] ${errorMessage}`)
      throw new Error(errorMessage)
    }

    console.log('[Orchestrator] Configuracao de IA validada com sucesso')
  }

  // Emite progresso atualizando o log e publicando evento
  private async emitProgress(
    step: GenerationStep,
    stepIndex: number,
    message: string,
    executions: AgentExecution[],
    agentType?: string,
    subStep?: { current: number; total: number; itemName?: string }
  ): Promise<void> {
    if (!this.logId) return

    try {
      // Prepara objeto de progresso para persistencia e emissao
      // Nota: lastProgress nao inclui 'execution' para evitar dados excessivos no banco
      const lastProgress = {
        step,
        stepIndex,
        totalSteps: 7, // Agora temos 7 etapas com text_overlay
        message,
        agentType,
        subStep
      }

      // Atualiza o log com as execucoes mais recentes E o ultimo progresso
      // Isso permite recuperar o estado apos refresh da pagina
      await this.app.service('ai-generation-logs').patch(this.logId, {
        status: step === 'failed' ? 'failed' : step === 'completed' ? 'completed' : 'in_progress',
        agentExecutions: executions,
        lastProgress
      })

      // Emite evento customizado para o frontend
      // Inclui execution para exibicao em tempo real
      const progress: GenerationProgress = {
        ...lastProgress,
        execution: executions[executions.length - 1]
      }
      this.app.service('ai-generation-logs').emit('progress', { logId: this.logId, progress })
    } catch (error) {
      console.warn('[Orchestrator] Erro ao emitir progresso:', error)
    }
  }

  // Cria callback de progresso para um passo especifico
  private createProgressCallback(
    step: GenerationStep,
    stepIndex: number,
    baseMessage: string,
    executions: AgentExecution[],
    agentType: string
  ): ProgressCallback {
    return async (subStep: { current: number; total: number; itemName?: string }) => {
      const itemInfo = subStep.itemName ? ` (${subStep.itemName})` : ''
      const message = `${baseMessage} ${subStep.current}/${subStep.total}${itemInfo}`
      await this.emitProgress(step, stepIndex, message, executions, agentType, subStep)
    }
  }

  // Loga execucao de agente na tabela ai_requests
  private async logAgentExecution(execution: AgentExecution): Promise<void> {
    // So loga se tiver postId (sempre deve ter no novo fluxo)
    if (!this.postId || !this.userId || !this.brandId) return

    try {
      await this.requestLogger.log({
        postId: this.postId,
        userId: this.userId,
        brandId: this.brandId,
        actionCode: this.actionCode,
        logId: this.logId,
        agentType: execution.agentType,
        provider: execution.provider,
        model: execution.model,
        promptTokens: execution.promptTokens,
        completionTokens: execution.completionTokens,
        imagesGenerated: execution.imageUrl ? 1 : 0,
        requestedAt: this.requestedAt || new Date(),
        startedAt: execution.startedAt ? new Date(execution.startedAt) : undefined,
        completedAt: execution.completedAt ? new Date(execution.completedAt) : undefined,
        status: execution.status,
        errorMessage: execution.error
      })
    } catch (err) {
      // Erro de logging nao deve interromper a geracao
      console.warn('[Orchestrator] Erro ao logar ai_request:', err)
    }
  }

  async orchestrate(input: OrchestratorInput): Promise<OrchestrationResult> {
    const startTime = Date.now()
    const allExecutions: AgentExecution[] = []
    let slides: CarouselSlide[] = []
    let briefing: CreativeBriefing | undefined
    let caption: string | undefined
    this.logId = input.logId

    // Armazena dados para logging de ai_requests
    this.postId = input.postId
    this.userId = input.userId
    this.brandId = input.brandId
    this.requestedAt = input.requestedAt

    try {
      // 1. Buscar dados da marca
      await this.emitProgress('loading_brand', 0, 'Carregando dados da marca...', allExecutions)
      const brand = await this.app.service('brands').get(input.brandId)

      console.log('[Orchestrator] Marca carregada:', brand.name)

      // Valida configuracao de IA ANTES de iniciar qualquer agente
      this.validateConfiguration(brand.aiConfig as BrandAIConfig | undefined)

      const context: AgentContext = {
        brandId: input.brandId,
        brandName: brand.name,
        brandDescription: brand.description,
        toneOfVoice: brand.toneOfVoice,
        values: brand.values,
        preferredWords: brand.preferredWords,
        avoidedWords: brand.avoidedWords,
        targetAudience: brand.targetAudience,
        brandColors: brand.brandColors,
        // Novos campos para melhorar qualidade dos overlays
        sector: brand.sector,
        competitors: brand.competitors,
        logoUrl: brand.logoUrl,
        prompts: brand.prompts,
        platform: input.platform,
        originalPrompt: input.prompt,
        referenceImages: input.referenceImages,
        userId: input.userId,
        aiConfig: brand.aiConfig
      }

      // Helper para adicionar execucoes e logar no ai_requests
      const addExecutions = async (executions: AgentExecution[]) => {
        for (const exec of executions) {
          allExecutions.push(exec)
          await this.logAgentExecution(exec)
        }
      }

      // 2. Agente de Direcao Criativa - define o briefing
      await this.emitProgress(
        'creative_direction',
        1,
        'Gerando direcao criativa...',
        allExecutions,
        'creativeDirection'
      )
      const creativeResult = await this.creativeAgent.execute(context)
      await addExecutions(creativeResult.executions)
      briefing = creativeResult.result
      await this.emitProgress(
        'creative_direction',
        1,
        'Direcao criativa concluida',
        allExecutions,
        'creativeDirection'
      )

      // 3. Agente de Analise - valida o briefing
      await this.emitProgress('analysis', 2, 'Analisando briefing criativo...', allExecutions, 'analysis')
      const analysisResult = await this.analysisAgent.execute(context, { briefing })
      await addExecutions(analysisResult.executions)
      await this.emitProgress('analysis', 2, 'Analise concluida', allExecutions, 'analysis')

      // Se briefing reprovado com score muito baixo, tenta novamente
      if (!analysisResult.result.approved && analysisResult.result.score < 50) {
        await this.emitProgress(
          'creative_direction',
          2,
          'Refinando direcao criativa...',
          allExecutions,
          'creativeDirection'
        )
        const retryCreative = await this.creativeAgent.execute(context)
        await addExecutions(retryCreative.executions)
        briefing = retryCreative.result
      }

      // 4. Agente de Texto - cria texto de cada slide
      await this.emitProgress(
        'text_creation',
        3,
        'Criando textos dos slides...',
        allExecutions,
        'textCreation'
      )
      const textResult = await this.textAgent.execute(context, { briefing })
      await addExecutions(textResult.executions)
      slides = textResult.result.slides
      caption = textResult.result.caption
      await this.emitProgress('text_creation', 3, 'Textos criados', allExecutions, 'textCreation')

      // 5. Agente de Compliance - valida textos
      await this.emitProgress('compliance', 4, 'Validando compliance...', allExecutions, 'compliance')
      const complianceResult = await this.complianceAgent.execute(context, { slides })
      await addExecutions(complianceResult.executions)

      // Se compliance falhar, corrige os textos
      if (!complianceResult.result.approved) {
        const correctionFeedback = this.complianceAgent.getCorrectionFeedback(complianceResult.result)
        if (correctionFeedback) {
          await this.emitProgress('text_creation', 4, 'Corrigindo textos...', allExecutions, 'textCreation')
          const correctedContext = {
            ...context,
            originalPrompt: `${context.originalPrompt}\n\nCORRECOES NECESSARIAS:\n${correctionFeedback}`
          }
          const retryText = await this.textAgent.execute(correctedContext, { briefing })
          await addExecutions(retryText.executions)
          slides = retryText.result.slides

          const revalidate = await this.complianceAgent.execute(context, { slides })
          await addExecutions(revalidate.executions)
        }
      }
      await this.emitProgress('compliance', 4, 'Compliance validado', allExecutions, 'compliance')

      // 6. Agente de Imagem - gera imagens de fundo para cada slide
      await this.emitProgress(
        'image_generation',
        5,
        'Preparando geracao de imagens...',
        allExecutions,
        'imageGeneration',
        { current: 0, total: slides.length }
      )
      const imageProgressCallback = this.createProgressCallback(
        'image_generation',
        5,
        'Gerando imagem',
        allExecutions,
        'imageGeneration'
      )
      const imageResult = await this.imageAgent.execute(context, { briefing, slides }, imageProgressCallback)
      await addExecutions(imageResult.executions)
      slides = imageResult.result.slides
      await this.emitProgress('image_generation', 5, 'Imagens geradas', allExecutions, 'imageGeneration')

      // 7. Agente de Text Overlay - adiciona texto estilizado sobre as imagens
      await this.emitProgress(
        'text_overlay',
        6,
        'Preparando adicao de texto...',
        allExecutions,
        'textOverlay',
        { current: 0, total: slides.length }
      )
      const overlayProgressCallback = this.createProgressCallback(
        'text_overlay',
        6,
        'Adicionando texto no slide',
        allExecutions,
        'textOverlay'
      )
      const overlayResult = await this.textOverlayAgent.execute(
        context,
        { briefing, slides, targetAspectRatio: input.targetAspectRatio },
        overlayProgressCallback
      )
      await addExecutions(overlayResult.executions)
      slides = overlayResult.result.slides
      await this.emitProgress(
        'text_overlay',
        6,
        'Texto adicionado em todos os slides',
        allExecutions,
        'textOverlay'
      )

      // Calcula totais
      const totalTokens = this.calculateTotalTokens(allExecutions)

      await this.emitProgress('completed', 7, 'Geracao concluida!', allExecutions)

      return {
        success: true,
        slides,
        caption,
        briefing,
        executions: allExecutions,
        totalTokens,
        executionTimeMs: Date.now() - startTime
      }
    } catch (error) {
      // O base-agent pode lancar { error: Error, execution: AgentExecution }
      let errorMessage = 'Erro desconhecido'
      if (error && typeof error === 'object' && 'error' in error) {
        const wrappedError = error as { error: Error; execution?: AgentExecution }
        errorMessage = wrappedError.error?.message || errorMessage
        if (wrappedError.execution) {
          allExecutions.push(wrappedError.execution)
          // Loga execucao com erro no ai_requests
          await this.logAgentExecution(wrappedError.execution)
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      console.error(`[Orchestrator] Erro durante orquestracao: ${errorMessage}`)

      // Emite progresso de falha
      await this.emitProgress('failed', -1, `Erro: ${errorMessage}`, allExecutions)

      return {
        success: false,
        slides,
        caption,
        briefing,
        executions: allExecutions,
        totalTokens: this.calculateTotalTokens(allExecutions),
        executionTimeMs: Date.now() - startTime,
        error: errorMessage
      }
    }
  }

  private calculateTotalTokens(executions: AgentExecution[]): {
    prompt: number
    completion: number
    total: number
  } {
    let prompt = 0
    let completion = 0

    for (const exec of executions) {
      prompt += exec.promptTokens || 0
      completion += exec.completionTokens || 0
    }

    return { prompt, completion, total: prompt + completion }
  }
}
