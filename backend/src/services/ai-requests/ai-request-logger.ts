// Logger interno para registrar requests de IA diretamente no banco
// Este modulo NAO passa pela API do Feathers, insere diretamente
import type { Application } from '../../declarations'
import { getAICostCalculator } from '../ai-usage/ai-cost-calculator'
import { aiRequestActions, agentLabels, type AIRequestActionCode } from './ai-requests.schema'

export interface LogRequestParams {
  // Rastreabilidade obrigatoria
  postId: number
  userId: number
  brandId: number

  // Contexto da acao
  actionCode: AIRequestActionCode
  logId?: number

  // Detalhes do request
  agentType: string
  provider: string
  model: string

  // Uso
  promptTokens?: number
  completionTokens?: number
  imagesGenerated?: number
  videoSeconds?: number

  // Timestamps
  requestedAt: Date // quando o usuario clicou
  startedAt?: Date // quando a chamada API comecou
  completedAt?: Date // quando terminou

  // Status
  status?: 'success' | 'failed' | 'retried'
  errorMessage?: string
}

export class AIRequestLogger {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * Registra um request de IA no banco de dados
   * Este metodo insere diretamente, sem passar pelos hooks do Feathers
   */
  async log(params: LogRequestParams): Promise<void> {
    const calculator = getAICostCalculator(this.app)
    const db = this.app.get('sqliteClient')

    // Calcula custo
    const costResult = await calculator.calculateCost({
      provider: params.provider,
      model: params.model,
      promptTokens: params.promptTokens || 0,
      completionTokens: params.completionTokens || 0,
      imagesGenerated: params.imagesGenerated,
      videoSeconds: params.videoSeconds
    })

    const completedAt = params.completedAt || new Date()
    const startedAt = params.startedAt || params.requestedAt
    const durationMs = completedAt.getTime() - startedAt.getTime()

    // Obtem descricao da acao em portugues
    const action = aiRequestActions[params.actionCode] || params.actionCode

    // Obtem label do agente em portugues
    const agentLabel = agentLabels[params.agentType] || params.agentType

    // Insere diretamente no banco (nao passa pela API)
    await db('ai_requests').insert({
      // Rastreabilidade
      postId: params.postId,
      userId: params.userId,
      brandId: params.brandId,

      // Contexto
      action,
      actionCode: params.actionCode,
      logId: params.logId || null,

      // Agente
      agentType: params.agentType,
      agentLabel,

      // Provider
      provider: params.provider,
      model: params.model,

      // Tokens
      promptTokens: params.promptTokens || 0,
      completionTokens: params.completionTokens || 0,
      totalTokens: (params.promptTokens || 0) + (params.completionTokens || 0),

      // Custos
      costUsd: costResult.costUsd,
      inputCost: costResult.breakdown.inputCost,
      outputCost: costResult.breakdown.outputCost,
      imageCost: costResult.breakdown.imageCost,
      videoCost: costResult.breakdown.videoCost,

      // Media
      imagesGenerated: params.imagesGenerated || 0,
      videoSecondsGenerated: params.videoSeconds || 0,

      // Timestamps
      requestedAt: params.requestedAt.toISOString(),
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs,

      // Status
      status: params.status || 'success',
      errorMessage: params.errorMessage || null,

      createdAt: new Date().toISOString()
    })
  }
}

// Singleton
let loggerInstance: AIRequestLogger | null = null

export function getAIRequestLogger(app: Application): AIRequestLogger {
  if (!loggerInstance) {
    loggerInstance = new AIRequestLogger(app)
  }
  return loggerInstance
}
