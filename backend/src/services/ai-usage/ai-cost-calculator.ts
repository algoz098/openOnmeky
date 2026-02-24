// Calculador de custos de uso de IA
import type { Application } from '../../declarations'
import type { SettingsService, ModelPricing } from '../settings/settings.class'

export interface CostCalculationParams {
  provider: string
  model: string
  promptTokens: number
  completionTokens: number
  imagesGenerated?: number
  videoSeconds?: number
}

export interface CostBreakdown {
  inputCost: number
  outputCost: number
  imageCost: number
  videoCost: number
  inputTokens: number
  outputTokens: number
  imagesGenerated: number
  videoSeconds: number
}

export interface CostResult {
  costUsd: number
  breakdown: CostBreakdown
  pricing: ModelPricing | null
  warning?: string
}

export class AICostCalculator {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * Calcula o custo de uma geracao baseado no uso de tokens
   */
  async calculateCost(params: CostCalculationParams): Promise<CostResult> {
    const settingsService = this.app.service('settings') as unknown as SettingsService
    const pricing = await settingsService.getModelPricing(params.provider, params.model)

    const breakdown: CostBreakdown = {
      inputCost: 0,
      outputCost: 0,
      imageCost: 0,
      videoCost: 0,
      inputTokens: params.promptTokens,
      outputTokens: params.completionTokens,
      imagesGenerated: params.imagesGenerated || 0,
      videoSeconds: params.videoSeconds || 0
    }

    if (!pricing) {
      return {
        costUsd: 0,
        breakdown,
        pricing: null,
        warning: `Preco nao configurado para ${params.provider}/${params.model}`
      }
    }

    // Calcula custos
    breakdown.inputCost = (params.promptTokens / 1_000_000) * pricing.inputPricePerMillion
    breakdown.outputCost = (params.completionTokens / 1_000_000) * pricing.outputPricePerMillion
    breakdown.imageCost = (params.imagesGenerated || 0) * (pricing.imagePricePerUnit || 0)
    breakdown.videoCost = (params.videoSeconds || 0) * (pricing.videoPricePerSecond || 0)

    const totalCost = breakdown.inputCost + breakdown.outputCost + breakdown.imageCost + breakdown.videoCost

    return {
      costUsd: totalCost,
      breakdown,
      pricing
    }
  }

  /**
   * Calcula custo agregado de multiplas execucoes de agentes
   */
  async calculateAggregateCost(
    executions: Array<{
      provider: string
      model: string
      promptTokens?: number
      completionTokens?: number
      imagesGenerated?: number
      videoSeconds?: number
    }>
  ): Promise<CostResult> {
    let totalCost = 0
    const aggregateBreakdown: CostBreakdown = {
      inputCost: 0,
      outputCost: 0,
      imageCost: 0,
      videoCost: 0,
      inputTokens: 0,
      outputTokens: 0,
      imagesGenerated: 0,
      videoSeconds: 0
    }
    const warnings: string[] = []

    for (const exec of executions) {
      const result = await this.calculateCost({
        provider: exec.provider,
        model: exec.model,
        promptTokens: exec.promptTokens || 0,
        completionTokens: exec.completionTokens || 0,
        imagesGenerated: exec.imagesGenerated,
        videoSeconds: exec.videoSeconds
      })

      totalCost += result.costUsd
      aggregateBreakdown.inputCost += result.breakdown.inputCost
      aggregateBreakdown.outputCost += result.breakdown.outputCost
      aggregateBreakdown.imageCost += result.breakdown.imageCost
      aggregateBreakdown.videoCost += result.breakdown.videoCost
      aggregateBreakdown.inputTokens += result.breakdown.inputTokens
      aggregateBreakdown.outputTokens += result.breakdown.outputTokens
      aggregateBreakdown.imagesGenerated += result.breakdown.imagesGenerated
      aggregateBreakdown.videoSeconds += result.breakdown.videoSeconds

      if (result.warning) {
        warnings.push(result.warning)
      }
    }

    return {
      costUsd: totalCost,
      breakdown: aggregateBreakdown,
      pricing: null, // Multiplos pricings usados
      warning: warnings.length > 0 ? warnings.join('; ') : undefined
    }
  }
}

// Singleton para a aplicacao
let calculatorInstance: AICostCalculator | null = null

export function getAICostCalculator(app: Application): AICostCalculator {
  if (!calculatorInstance) {
    calculatorInstance = new AICostCalculator(app)
  }
  return calculatorInstance
}
