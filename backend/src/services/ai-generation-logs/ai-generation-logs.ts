// Servico de logs de geracao de IA
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application, HookContext } from '../../declarations'
import { AIGenerationLogsService, getOptions } from './ai-generation-logs.class'
import {
  aiGenerationLogDataValidator,
  aiGenerationLogDataResolver,
  aiGenerationLogPatchValidator,
  aiGenerationLogPatchResolver,
  aiGenerationLogQueryValidator,
  aiGenerationLogQueryResolver,
  aiGenerationLogResolver,
  aiGenerationLogExternalResolver
} from './ai-generation-logs.schema'
import { filterByUserBrands, verifyBrandOwnership, verifyBrandAccess } from '../../hooks/filter-by-user'

export const aiGenerationLogsPath = 'ai-generation-logs'
export const aiGenerationLogsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

// Helper seguro para parse de JSON
const safeJsonParse = (value: unknown, fallback: unknown = []): unknown => {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// Hook para carregar dados normalizados e deserializar campos JSON na resposta
const loadNormalizedDataAndDeserialize = async (context: HookContext) => {
  const db = context.app.get('sqliteClient')

  const processItem = async (item: Record<string, unknown>) => {
    const logId = item.id as number

    // Carregar agentExecutions da nova tabela
    const dbAgentExecutions = await db('log_agent_executions').where('logId', logId)
    if (dbAgentExecutions.length > 0) {
      item.agentExecutions = dbAgentExecutions.map((exec: Record<string, unknown>) => ({
        agentType: exec.agentType,
        provider: exec.provider,
        model: exec.model,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        systemPrompt: exec.systemPrompt,
        userPrompt: exec.userPrompt,
        result: exec.result,
        imageUrl: exec.imageUrl,
        promptTokens: exec.promptTokens,
        completionTokens: exec.completionTokens,
        totalTokens: exec.totalTokens,
        error: exec.error,
        status: exec.status
      }))
    } else {
      item.agentExecutions = safeJsonParse(item.agentExecutions, [])
    }

    // Carregar referenceImages da nova tabela
    const dbRefImages = await db('log_reference_images').where('logId', logId).orderBy('position', 'asc')
    if (dbRefImages.length > 0) {
      item.referenceImages = dbRefImages.map((r: { imageUrl: string }) => r.imageUrl)
    } else {
      item.referenceImages = safeJsonParse(item.referenceImages, [])
    }

    // Carregar slides da nova tabela
    const dbSlides = await db('log_slides').where('logId', logId).orderBy('slideIndex', 'asc')
    if (dbSlides.length > 0) {
      item.slides = dbSlides.map((s: Record<string, unknown>) => ({
        index: s.slideIndex,
        purpose: s.purpose,
        text: s.text,
        imageUrl: s.imageUrl,
        imagePrompt: s.imagePrompt,
        masterImageUrl: s.masterImageUrl
      }))
    } else {
      item.slides = safeJsonParse(item.slides, [])
    }

    // Deserializar campos JSON restantes
    item.lastProgress = safeJsonParse(item.lastProgress, null)
    item.costBreakdown = safeJsonParse(item.costBreakdown, null)

    return item
  }

  if (context.result) {
    if (Array.isArray(context.result.data)) {
      context.result.data = await Promise.all(context.result.data.map(processItem))
    } else if (context.result.data) {
      context.result = { ...context.result, data: await processItem(context.result.data) }
    } else if (!context.result.data && context.result.id) {
      context.result = await processItem(context.result)
    }
  }

  return context
}

// Hook para sincronizar dados nas tabelas normalizadas apos create/patch
const syncNormalizedTables = async (context: HookContext) => {
  const result = context.result as Record<string, unknown>
  if (!result || !result.id) return context

  const logId = result.id as number
  const db = context.app.get('sqliteClient')
  const data = context.data as Record<string, unknown> | undefined

  // Sincronizar agentExecutions
  if (data?.agentExecutions) {
    let executions: Array<Record<string, unknown>> = []
    if (typeof data.agentExecutions === 'string') {
      try {
        executions = JSON.parse(data.agentExecutions)
      } catch {
        executions = []
      }
    } else if (Array.isArray(data.agentExecutions)) {
      executions = data.agentExecutions as Array<Record<string, unknown>>
    }

    await db('log_agent_executions').where('logId', logId).del()
    for (const exec of executions) {
      await db('log_agent_executions').insert({
        logId,
        agentType: exec.agentType || 'unknown',
        provider: exec.provider || 'unknown',
        model: exec.model || 'unknown',
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        systemPrompt: exec.systemPrompt || '',
        userPrompt: exec.userPrompt || '',
        result: exec.result,
        imageUrl: exec.imageUrl,
        promptTokens: exec.promptTokens || 0,
        completionTokens: exec.completionTokens || 0,
        totalTokens: exec.totalTokens || 0,
        error: exec.error,
        status: exec.status || 'success'
      })
    }
  }

  // Sincronizar referenceImages
  if (data?.referenceImages) {
    let refImages: string[] = []
    if (typeof data.referenceImages === 'string') {
      try {
        refImages = JSON.parse(data.referenceImages)
      } catch {
        refImages = []
      }
    } else if (Array.isArray(data.referenceImages)) {
      refImages = data.referenceImages as string[]
    }

    await db('log_reference_images').where('logId', logId).del()
    for (let i = 0; i < refImages.length; i++) {
      await db('log_reference_images').insert({
        logId,
        imageUrl: refImages[i],
        position: i
      })
    }
  }

  // Sincronizar slides
  if (data?.slides) {
    let slides: Array<Record<string, unknown>> = []
    if (typeof data.slides === 'string') {
      try {
        slides = JSON.parse(data.slides)
      } catch {
        slides = []
      }
    } else if (Array.isArray(data.slides)) {
      slides = data.slides as Array<Record<string, unknown>>
    }

    await db('log_slides').where('logId', logId).del()
    for (const slide of slides) {
      await db('log_slides').insert({
        logId,
        slideIndex: slide.index || 0,
        purpose: slide.purpose || 'hook',
        text: slide.text,
        imageUrl: slide.imageUrl,
        imagePrompt: slide.imagePrompt,
        masterImageUrl: slide.masterImageUrl
      })
    }
  }

  return context
}

// Hook para serializar campos JSON antes de salvar
const serializeJsonFields = async (context: HookContext) => {
  const data = context.data as Record<string, unknown>
  const jsonFields = ['agentExecutions', 'referenceImages', 'slides', 'lastProgress', 'costBreakdown']

  for (const field of jsonFields) {
    if (data[field] && typeof data[field] !== 'string') {
      data[field] = JSON.stringify(data[field])
    }
  }

  return context
}

// Hook para adicionar userId do contexto
const setUserId = async (context: HookContext) => {
  if (context.params.user) {
    context.data = {
      ...context.data,
      userId: context.params.user.id
    }
  }
  return context
}

export const aiGenerationLogs = (app: Application) => {
  app.use(aiGenerationLogsPath, new AIGenerationLogsService(getOptions(app)), {
    methods: aiGenerationLogsMethods,
    events: ['progress'] // Evento customizado para progresso em tempo real
  })

  app.service(aiGenerationLogsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(aiGenerationLogExternalResolver),
        schemaHooks.resolveResult(aiGenerationLogResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(aiGenerationLogQueryValidator),
        schemaHooks.resolveQuery(aiGenerationLogQueryResolver)
      ],
      find: [filterByUserBrands],
      get: [verifyBrandAccess],
      create: [
        verifyBrandOwnership,
        schemaHooks.validateData(aiGenerationLogDataValidator),
        schemaHooks.resolveData(aiGenerationLogDataResolver),
        setUserId,
        serializeJsonFields
      ],
      patch: [
        verifyBrandAccess,
        schemaHooks.validateData(aiGenerationLogPatchValidator),
        schemaHooks.resolveData(aiGenerationLogPatchResolver),
        serializeJsonFields
      ],
      remove: [verifyBrandAccess]
    },
    after: {
      all: [loadNormalizedDataAndDeserialize],
      create: [syncNormalizedTables],
      patch: [syncNormalizedTables]
    },
    error: {
      all: []
    }
  })
}

// Declara o servico no tipo da aplicacao
declare module '../../declarations' {
  interface ServiceTypes {
    [aiGenerationLogsPath]: AIGenerationLogsService
  }
}
