// Configuracao do servico de Brands para Feathers
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application } from '../../declarations'
import { BrandService, getOptions } from './brands.class'
import { brandPath, brandMethods } from './brands.shared'
import {
  brandDataValidator,
  brandPatchValidator,
  brandQueryValidator,
  brandResolver,
  brandExternalResolver,
  brandDataResolver,
  brandPatchResolver,
  brandQueryResolver,
  defaultPrompts
} from './brands.schema'
import type { HookContext } from '../../declarations'

export * from './brands.class'
export * from './brands.schema'

// Hook para adicionar userId ao criar
const setUserId = async (context: HookContext) => {
  if (context.params.user) {
    context.data.userId = context.params.user.id
  }
  return context
}

// Hook para adicionar prompts padrao se nao fornecidos
const setDefaultPrompts = async (context: HookContext) => {
  if (!context.data.prompts) {
    context.data.prompts = defaultPrompts
  }
  return context
}

// Hook para sanitizar dados antes da validacao (converter null para valores apropriados)
const sanitizePatchData = async (context: HookContext) => {
  // Campos de array - converter null para []
  const arrayFields = ['values', 'preferredWords', 'avoidedWords', 'competitors', 'brandColors']

  // Campos de string - remover se null (nao atualiza o campo)
  const stringFields = ['logoUrl', 'description', 'sector', 'toneOfVoice', 'targetAudience']

  // Campos de objeto - converter null para {}
  const objectFields = ['prompts', 'aiConfig']

  for (const field of arrayFields) {
    if (field in context.data) {
      if (context.data[field] === null || context.data[field] === undefined) {
        context.data[field] = []
      }
    }
  }

  for (const field of stringFields) {
    if (field in context.data && context.data[field] === null) {
      // Remove do payload - nao atualiza o campo no banco
      delete context.data[field]
    }
  }

  for (const field of objectFields) {
    if (field in context.data && context.data[field] === null) {
      context.data[field] = {}
    }
  }

  // Remover campos que sao undefined (nao foram alterados)
  for (const key of Object.keys(context.data)) {
    if (context.data[key] === undefined) {
      delete context.data[key]
    }
  }

  return context
}

// Hook para processar campos especiais do patch (colors -> brandColors, resetPrompts)
const processPatchSpecialFields = async (context: HookContext) => {
  // Converter colors para brandColors
  if (context.data.colors) {
    context.data.brandColors = context.data.colors
    delete context.data.colors
  }

  // Processar resetPrompts
  if (context.data.resetPrompts && Array.isArray(context.data.resetPrompts)) {
    // Buscar o brand atual para obter prompts existentes
    const db = context.app.get('sqliteClient')
    const brand = await db('brands').where('id', context.id).first()

    let currentPrompts = brand?.prompts
    if (typeof currentPrompts === 'string') {
      currentPrompts = JSON.parse(currentPrompts)
    }
    currentPrompts = currentPrompts || {}

    // Resetar os prompts especificados para o padrao
    for (const promptType of context.data.resetPrompts) {
      if (defaultPrompts[promptType as keyof typeof defaultPrompts]) {
        currentPrompts[promptType] = defaultPrompts[promptType as keyof typeof defaultPrompts]
      }
    }

    context.data.prompts = currentPrompts
    delete context.data.resetPrompts
  }

  return context
}

// Hook para converter arrays JSON para o banco
const serializeJsonFields = async (context: HookContext) => {
  const jsonFields = [
    'values',
    'preferredWords',
    'avoidedWords',
    'competitors',
    'brandColors',
    'prompts',
    'aiConfig'
  ]

  for (const field of jsonFields) {
    if (context.data[field] && typeof context.data[field] === 'object') {
      context.data[field] = JSON.stringify(context.data[field])
    }
  }
  return context
}

// Helper seguro para parse de JSON
const safeJsonParse = (value: unknown, fallback: unknown = []): unknown => {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// Hook para carregar dados normalizados e deserializar campos JSON do banco
const loadNormalizedDataAndDeserialize = async (context: HookContext) => {
  const db = context.app.get('sqliteClient')

  const processResult = async (result: Record<string, unknown>) => {
    const brandId = result.id as number

    // Carregar values da nova tabela
    const dbValues = await db('brand_values').where('brandId', brandId).orderBy('position', 'asc')
    if (dbValues.length > 0) {
      result.values = dbValues.map((v: { value: string }) => v.value)
    } else {
      result.values = safeJsonParse(result.values, [])
    }

    // Carregar preferredWords da nova tabela
    const dbPreferredWords = await db('brand_preferred_words')
      .where('brandId', brandId)
      .orderBy('position', 'asc')
    if (dbPreferredWords.length > 0) {
      result.preferredWords = dbPreferredWords.map((w: { word: string }) => w.word)
    } else {
      result.preferredWords = safeJsonParse(result.preferredWords, [])
    }

    // Carregar avoidedWords da nova tabela
    const dbAvoidedWords = await db('brand_avoided_words')
      .where('brandId', brandId)
      .orderBy('position', 'asc')
    if (dbAvoidedWords.length > 0) {
      result.avoidedWords = dbAvoidedWords.map((w: { word: string }) => w.word)
    } else {
      result.avoidedWords = safeJsonParse(result.avoidedWords, [])
    }

    // Carregar competitors da nova tabela
    const dbCompetitors = await db('brand_competitors').where('brandId', brandId).orderBy('position', 'asc')
    if (dbCompetitors.length > 0) {
      result.competitors = dbCompetitors.map((c: { name: string }) => c.name)
    } else {
      result.competitors = safeJsonParse(result.competitors, [])
    }

    // Carregar brandColors da nova tabela
    const dbColors = await db('brand_colors').where('brandId', brandId).orderBy('position', 'asc')
    if (dbColors.length > 0) {
      result.brandColors = dbColors.map((c: { color: string }) => c.color)
    } else {
      result.brandColors = safeJsonParse(result.brandColors, [])
    }

    // Carregar aiConfig da nova tabela
    const dbAiConfigs = await db('brand_ai_configs').where('brandId', brandId)
    if (dbAiConfigs.length > 0) {
      const aiConfig: Record<string, unknown> = {}
      for (const config of dbAiConfigs) {
        aiConfig[config.agentType as string] = {
          provider: config.provider,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      }
      result.aiConfig = aiConfig
    } else {
      result.aiConfig = safeJsonParse(result.aiConfig, {})
    }

    // Deserializar prompts (ainda como JSON na coluna ou usar colunas separadas)
    // Se promptText/promptImage/promptVideo existirem, usar esses
    if (result.promptText || result.promptImage || result.promptVideo) {
      result.prompts = {
        text: result.promptText,
        image: result.promptImage,
        video: result.promptVideo
      }
    } else {
      result.prompts = safeJsonParse(result.prompts, {})
    }

    return result
  }

  if (Array.isArray(context.result)) {
    context.result = await Promise.all(context.result.map(processResult))
  } else if (context.result?.data && Array.isArray(context.result.data)) {
    context.result.data = await Promise.all(context.result.data.map(processResult))
  } else if (context.result) {
    context.result = await processResult(context.result as Record<string, unknown>)
  }

  return context
}

// Hook para sincronizar dados nas tabelas normalizadas apos create/patch
const syncNormalizedTables = async (context: HookContext) => {
  const result = context.result as Record<string, unknown>
  if (!result || !result.id) return context

  const brandId = result.id as number
  const db = context.app.get('sqliteClient')
  const data = context.data as Record<string, unknown> | undefined

  // Sincronizar values
  if (data?.values) {
    let values: string[] = []
    if (typeof data.values === 'string') {
      try {
        values = JSON.parse(data.values)
      } catch {
        values = []
      }
    } else if (Array.isArray(data.values)) {
      values = data.values as string[]
    }

    await db('brand_values').where('brandId', brandId).del()
    for (let i = 0; i < values.length; i++) {
      await db('brand_values').insert({ brandId, value: values[i], position: i })
    }
  }

  // Sincronizar preferredWords
  if (data?.preferredWords) {
    let words: string[] = []
    if (typeof data.preferredWords === 'string') {
      try {
        words = JSON.parse(data.preferredWords)
      } catch {
        words = []
      }
    } else if (Array.isArray(data.preferredWords)) {
      words = data.preferredWords as string[]
    }

    await db('brand_preferred_words').where('brandId', brandId).del()
    for (let i = 0; i < words.length; i++) {
      await db('brand_preferred_words').insert({ brandId, word: words[i], position: i })
    }
  }

  // Sincronizar avoidedWords
  if (data?.avoidedWords) {
    let words: string[] = []
    if (typeof data.avoidedWords === 'string') {
      try {
        words = JSON.parse(data.avoidedWords)
      } catch {
        words = []
      }
    } else if (Array.isArray(data.avoidedWords)) {
      words = data.avoidedWords as string[]
    }

    await db('brand_avoided_words').where('brandId', brandId).del()
    for (let i = 0; i < words.length; i++) {
      await db('brand_avoided_words').insert({ brandId, word: words[i], position: i })
    }
  }

  // Sincronizar competitors
  if (data?.competitors) {
    let competitors: string[] = []
    if (typeof data.competitors === 'string') {
      try {
        competitors = JSON.parse(data.competitors)
      } catch {
        competitors = []
      }
    } else if (Array.isArray(data.competitors)) {
      competitors = data.competitors as string[]
    }

    await db('brand_competitors').where('brandId', brandId).del()
    for (let i = 0; i < competitors.length; i++) {
      await db('brand_competitors').insert({ brandId, name: competitors[i], position: i })
    }
  }

  // Sincronizar brandColors
  if (data?.brandColors) {
    let colors: string[] = []
    if (typeof data.brandColors === 'string') {
      try {
        colors = JSON.parse(data.brandColors)
      } catch {
        colors = []
      }
    } else if (Array.isArray(data.brandColors)) {
      colors = data.brandColors as string[]
    }

    await db('brand_colors').where('brandId', brandId).del()
    for (let i = 0; i < colors.length; i++) {
      await db('brand_colors').insert({
        brandId,
        color: colors[i],
        isPrimary: i === 0 ? 1 : 0,
        position: i
      })
    }
  }

  // Sincronizar aiConfig
  if (data?.aiConfig) {
    let aiConfig: Record<string, Record<string, unknown>> = {}
    if (typeof data.aiConfig === 'string') {
      try {
        aiConfig = JSON.parse(data.aiConfig)
      } catch {
        aiConfig = {}
      }
    } else if (typeof data.aiConfig === 'object' && !Array.isArray(data.aiConfig)) {
      aiConfig = data.aiConfig as Record<string, Record<string, unknown>>
    }

    await db('brand_ai_configs').where('brandId', brandId).del()
    for (const [agentType, config] of Object.entries(aiConfig)) {
      if (config && (config.provider || config.model)) {
        await db('brand_ai_configs').insert({
          brandId,
          agentType,
          provider: config.provider as string,
          model: config.model as string,
          temperature: config.temperature as number,
          maxTokens: config.maxTokens as number
        })
      }
    }
  }

  return context
}

// Funcao de configuracao que registra o servico
// Hook condicional que ignora metodos customizados (getPromptPreview)
const conditionalResolveExternal = async (context: HookContext, next: () => Promise<void>): Promise<void> => {
  if (context.method === 'getPromptPreview') {
    await next()
    return
  }
  await schemaHooks.resolveExternal(brandExternalResolver)(context, next)
}

const conditionalResolveResult = async (context: HookContext, next: () => Promise<void>): Promise<void> => {
  if (context.method === 'getPromptPreview') {
    await next()
    return
  }
  await schemaHooks.resolveResult(brandResolver)(context, next)
}

// Hook condicional para validar query apenas em metodos padrao
const conditionalValidateQuery = async (context: HookContext) => {
  if (context.method === 'getPromptPreview') {
    return context
  }
  return schemaHooks.validateQuery(brandQueryValidator)(context)
}

// Hook condicional para resolver query apenas em metodos padrao
const conditionalResolveQuery = async (context: HookContext) => {
  if (context.method === 'getPromptPreview') {
    return context
  }
  return schemaHooks.resolveQuery(brandQueryResolver)(context)
}

// Hook condicional para carregar dados normalizados apenas em metodos padrao
const conditionalLoadNormalizedData = async (context: HookContext) => {
  if (context.method === 'getPromptPreview') {
    return context
  }
  return loadNormalizedDataAndDeserialize(context)
}

export const brand = (app: Application) => {
  // Registra o servico na aplicacao Feathers
  app.use(brandPath, new BrandService(getOptions(app)), {
    methods: brandMethods,
    events: []
  })

  // Configura hooks do servico
  app.service(brandPath).hooks({
    around: {
      all: [conditionalResolveExternal, conditionalResolveResult],
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      create: [authenticate('jwt')],
      update: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [conditionalValidateQuery, conditionalResolveQuery],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(brandDataValidator),
        schemaHooks.resolveData(brandDataResolver),
        setUserId,
        setDefaultPrompts,
        serializeJsonFields
      ],
      patch: [
        sanitizePatchData,
        schemaHooks.validateData(brandPatchValidator),
        schemaHooks.resolveData(brandPatchResolver),
        processPatchSpecialFields,
        serializeJsonFields
      ],
      remove: []
    },
    after: {
      all: [conditionalLoadNormalizedData],
      create: [syncNormalizedTables],
      patch: [syncNormalizedTables]
    },
    error: {
      all: []
    }
  })
}

// Adiciona o servico ao indice de tipos
declare module '../../declarations' {
  interface ServiceTypes {
    [brandPath]: BrandService
  }
}
