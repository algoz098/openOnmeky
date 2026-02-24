// Servico para gerenciar agregacao de uso de IA
import type { Application } from '../../declarations'
import type { CostBreakdown } from './ai-cost-calculator'

export interface UsageRecord {
  userId?: number
  brandId: number
  provider: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  imagesGenerated?: number
  videoSeconds?: number
  costUsd: number
}

export interface UsageSummary {
  id: number
  userId?: number
  brandId?: number
  period: 'daily' | 'monthly' | 'total'
  periodStart: string | null
  provider: string
  model: string
  requestCount: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  imagesGenerated: number
  videosGenerated: number
  videoSecondsGenerated: number
  estimatedCostUsd: number
  createdAt: string
  updatedAt: string
}

export class AIUsageService {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * Adiciona uso aos agregados (incrementa, nao sobrescreve)
   * Atualiza daily, monthly e total
   */
  async addUsage(record: UsageRecord): Promise<void> {
    const now = new Date()
    const dailyStart = now.toISOString().split('T')[0] // YYYY-MM-DD
    const monthlyStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    // Incrementa agregados
    await Promise.all([
      this.upsertSummary('daily', dailyStart, record),
      this.upsertSummary('monthly', monthlyStart, record),
      this.upsertSummary('total', null, record)
    ])
  }

  /**
   * Upsert com incremento atomico
   */
  private async upsertSummary(
    period: 'daily' | 'monthly' | 'total',
    periodStart: string | null,
    record: UsageRecord
  ): Promise<void> {
    const db = this.app.get('sqliteClient')
    const now = new Date().toISOString()

    // Tenta encontrar registro existente
    const existing = await db('ai_usage_summary')
      .where({
        userId: record.userId || null,
        brandId: record.brandId,
        period,
        periodStart: periodStart || null,
        provider: record.provider,
        model: record.model
      })
      .first()

    if (existing) {
      // Incrementa valores existentes
      await db('ai_usage_summary')
        .where({ id: existing.id })
        .update({
          requestCount: existing.requestCount + 1,
          totalPromptTokens: existing.totalPromptTokens + record.promptTokens,
          totalCompletionTokens: existing.totalCompletionTokens + record.completionTokens,
          totalTokens: existing.totalTokens + record.totalTokens,
          imagesGenerated: existing.imagesGenerated + (record.imagesGenerated || 0),
          videoSecondsGenerated: existing.videoSecondsGenerated + (record.videoSeconds || 0),
          estimatedCostUsd: parseFloat(existing.estimatedCostUsd) + record.costUsd,
          updatedAt: now
        })
    } else {
      // Cria novo registro
      await db('ai_usage_summary').insert({
        userId: record.userId || null,
        brandId: record.brandId,
        period,
        periodStart: periodStart || null,
        provider: record.provider,
        model: record.model,
        requestCount: 1,
        totalPromptTokens: record.promptTokens,
        totalCompletionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        imagesGenerated: record.imagesGenerated || 0,
        videosGenerated: record.imagesGenerated ? 0 : record.videoSeconds ? 1 : 0,
        videoSecondsGenerated: record.videoSeconds || 0,
        estimatedCostUsd: record.costUsd,
        createdAt: now,
        updatedAt: now
      })
    }
  }

  /**
   * Obtem resumo de uso por marca
   */
  async getUsageByBrand(brandId: number, period?: 'daily' | 'monthly' | 'total'): Promise<UsageSummary[]> {
    const db = this.app.get('sqliteClient')
    let query = db('ai_usage_summary').where({ brandId })

    if (period) {
      query = query.where({ period })
    }

    return query.orderBy('updatedAt', 'desc')
  }

  /**
   * Obtem resumo de uso por usuario
   */
  async getUsageByUser(userId: number, period?: 'daily' | 'monthly' | 'total'): Promise<UsageSummary[]> {
    const db = this.app.get('sqliteClient')
    let query = db('ai_usage_summary').where({ userId })

    if (period) {
      query = query.where({ period })
    }

    return query.orderBy('updatedAt', 'desc')
  }

  /**
   * Obtem custo total de uma marca
   */
  async getTotalCostByBrand(brandId: number): Promise<number> {
    const db = this.app.get('sqliteClient')
    const result = await db('ai_usage_summary')
      .where({ brandId, period: 'total' })
      .sum('estimatedCostUsd as total')
      .first()

    return parseFloat(result?.total || '0')
  }

  /**
   * Obtem custo do mes atual de uma marca
   */
  async getCurrentMonthCostByBrand(brandId: number): Promise<number> {
    const db = this.app.get('sqliteClient')
    const now = new Date()
    const monthlyStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const result = await db('ai_usage_summary')
      .where({ brandId, period: 'monthly', periodStart: monthlyStart })
      .sum('estimatedCostUsd as total')
      .first()

    return parseFloat(result?.total || '0')
  }
}

// Singleton para a aplicacao
let usageServiceInstance: AIUsageService | null = null

export function getAIUsageService(app: Application): AIUsageService {
  if (!usageServiceInstance) {
    usageServiceInstance = new AIUsageService(app)
  }
  return usageServiceInstance
}
