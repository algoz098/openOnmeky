// Schemas para o servico de logs de geracao de IA
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { AIGenerationLogsService } from './ai-generation-logs.class'

// Status de geracao
export const generationStatuses = ['started', 'in_progress', 'completed', 'failed'] as const
export type GenerationStatus = (typeof generationStatuses)[number]

// Tipos de geracao
export const generationTypes = ['carousel', 'single', 'text-only'] as const
export type GenerationType = (typeof generationTypes)[number]

// Execucao de um agente individual
export const agentExecutionSchema = Type.Object({
  agentType: Type.String(),
  provider: Type.String(),
  model: Type.String(),
  startedAt: Type.String(),
  completedAt: Type.Optional(Type.String()),
  systemPrompt: Type.String(),
  userPrompt: Type.String(),
  result: Type.Optional(Type.String()),
  imageUrl: Type.Optional(Type.String()),
  promptTokens: Type.Optional(Type.Number()),
  completionTokens: Type.Optional(Type.Number()),
  totalTokens: Type.Optional(Type.Number()),
  error: Type.Optional(Type.String()),
  status: Type.Union([Type.Literal('success'), Type.Literal('failed'), Type.Literal('retried')])
})
export type AgentExecution = Static<typeof agentExecutionSchema>

// Proporcoes de imagem suportadas
export const validAspectRatios = ['1:1', '4:5', '9:16', '16:9'] as const

// Schema de tipografia para overlay (espelho do posts.schema)
export const typographyConfigSchema = Type.Object({
  text: Type.String(),
  fontStyle: Type.Union([
    Type.Literal('bold'),
    Type.Literal('regular'),
    Type.Literal('light'),
    Type.Literal('italic')
  ]),
  fontFamily: Type.Union([
    Type.Literal('sans-serif'),
    Type.Literal('serif'),
    Type.Literal('display'),
    Type.Literal('handwritten')
  ]),
  position: Type.Union([
    Type.Literal('center'),
    Type.Literal('top'),
    Type.Literal('bottom'),
    Type.Literal('top-left'),
    Type.Literal('top-right'),
    Type.Literal('bottom-left'),
    Type.Literal('bottom-right')
  ]),
  size: Type.Union([
    Type.Literal('small'),
    Type.Literal('medium'),
    Type.Literal('large'),
    Type.Literal('xlarge')
  ]),
  color: Type.String(),
  backgroundColor: Type.Optional(Type.String()),
  backgroundStyle: Type.Optional(
    Type.Union([Type.Literal('gradient'), Type.Literal('blur'), Type.Literal('solid'), Type.Literal('none')])
  ),
  alignment: Type.Union([Type.Literal('left'), Type.Literal('center'), Type.Literal('right')]),
  shadow: Type.Optional(Type.Boolean()),
  outline: Type.Optional(Type.Boolean())
})

// Schema de versao de imagem derivada
export const imageVersionSchema = Type.Object({
  aspectRatio: Type.Union(validAspectRatios.map(r => Type.Literal(r))),
  imageUrl: Type.String(),
  size: Type.String(),
  hasText: Type.Boolean(),
  generatedAt: Type.String()
})

// Schema de metadados de geracao
export const imageGenerationMetadataSchema = Type.Object({
  provider: Type.String(),
  model: Type.String(),
  generatedAt: Type.String()
})

// Slide do carrousel - com suporte a master image e versoes
export const carouselSlideSchema = Type.Object({
  index: Type.Number(),
  purpose: Type.String(), // 'hook', 'features', 'summary', 'cta'
  text: Type.Optional(Type.String()), // Texto sobreposto na imagem (opcional - agente decide)
  imageUrl: Type.Optional(Type.String()), // Imagem final com texto (retrocompativel)
  imagePrompt: Type.Optional(Type.String()),
  // Novos campos para arquitetura master + derivadas
  masterImageUrl: Type.Optional(Type.String()), // Imagem base SEM texto
  typography: Type.Optional(typographyConfigSchema),
  versions: Type.Optional(
    Type.Partial(
      Type.Object({
        '1:1': imageVersionSchema,
        '4:5': imageVersionSchema,
        '9:16': imageVersionSchema,
        '16:9': imageVersionSchema
      })
    )
  ),
  generationMetadata: Type.Optional(imageGenerationMetadataSchema)
})
export type CarouselSlide = Static<typeof carouselSlideSchema>

// Schema de breakdown de custo
export const costBreakdownSchema = Type.Object({
  inputCost: Type.Number({ description: 'Custo de tokens de input em USD' }),
  outputCost: Type.Number({ description: 'Custo de tokens de output em USD' }),
  imageCost: Type.Number({ description: 'Custo de imagens geradas em USD' }),
  videoCost: Type.Number({ description: 'Custo de videos gerados em USD' }),
  inputTokens: Type.Number({ description: 'Total de tokens de input' }),
  outputTokens: Type.Number({ description: 'Total de tokens de output' }),
  imagesGenerated: Type.Number({ description: 'Numero de imagens geradas' }),
  videoSeconds: Type.Number({ description: 'Segundos de video gerados' })
})
export type CostBreakdown = Static<typeof costBreakdownSchema>

// Steps de geracao
export const generationSteps = [
  'loading_brand',
  'creative_direction',
  'analysis',
  'text_creation',
  'compliance',
  'image_generation',
  'text_overlay',
  'completed',
  'failed'
] as const
export type GenerationStep = (typeof generationSteps)[number]

// Schema de sub-etapa de progresso
export const progressSubStepSchema = Type.Object({
  current: Type.Number(),
  total: Type.Number(),
  itemName: Type.Optional(Type.String())
})

// Schema de progresso de geracao (para persistencia)
export const generationProgressSchema = Type.Object({
  step: Type.Union(generationSteps.map(s => Type.Literal(s))),
  stepIndex: Type.Number(),
  totalSteps: Type.Number(),
  message: Type.String(),
  agentType: Type.Optional(Type.String()),
  subStep: Type.Optional(progressSubStepSchema)
})
export type GenerationProgress = Static<typeof generationProgressSchema>

// Schema principal do log
export const aiGenerationLogSchema = Type.Object(
  {
    id: Type.Number(),
    brandId: Type.Number(),
    userId: Type.Optional(Type.Number()),
    postId: Type.Optional(Type.Number()),
    generationType: Type.Union(generationTypes.map(t => Type.Literal(t))),
    status: Type.Union(generationStatuses.map(s => Type.Literal(s))),
    agentExecutions: Type.Optional(Type.Array(agentExecutionSchema)),
    originalPrompt: Type.Optional(Type.String()),
    platform: Type.Optional(Type.String()),
    referenceImages: Type.Optional(Type.Array(Type.String())),
    slides: Type.Optional(Type.Array(carouselSlideSchema)),
    totalPromptTokens: Type.Optional(Type.Number()),
    totalCompletionTokens: Type.Optional(Type.Number()),
    totalTokens: Type.Optional(Type.Number()),
    executionTimeMs: Type.Optional(Type.Number()),
    // Campos de custo
    estimatedCostUsd: Type.Optional(Type.Number({ description: 'Custo estimado em USD' })),
    costBreakdown: Type.Optional(costBreakdownSchema),
    mainProvider: Type.Optional(Type.String({ description: 'Provider principal usado' })),
    mainModel: Type.Optional(Type.String({ description: 'Modelo principal usado' })),
    // Campos de erro
    errorMessage: Type.Optional(Type.String()),
    errorStack: Type.Optional(Type.String()),
    // Campo para persistir ultimo progresso (para reconexao apos refresh)
    lastProgress: Type.Optional(generationProgressSchema),
    startedAt: Type.Optional(Type.String({ format: 'date-time' })),
    completedAt: Type.Optional(Type.String({ format: 'date-time' })),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'AIGenerationLog', additionalProperties: false }
)
export type AIGenerationLog = Static<typeof aiGenerationLogSchema>
export const aiGenerationLogValidator = getValidator(aiGenerationLogSchema, dataValidator)
export const aiGenerationLogResolver = resolve<AIGenerationLog, HookContext<AIGenerationLogsService>>({})
export const aiGenerationLogExternalResolver = resolve<AIGenerationLog, HookContext<AIGenerationLogsService>>(
  {}
)

// Schema para criar log
export const aiGenerationLogDataSchema = Type.Object(
  {
    brandId: Type.Number(),
    generationType: Type.Union(generationTypes.map(t => Type.Literal(t))),
    originalPrompt: Type.Optional(Type.String()),
    platform: Type.Optional(Type.String()),
    referenceImages: Type.Optional(Type.Array(Type.String())),
    // postId pode ser passado na criacao para associar diretamente ao post
    postId: Type.Optional(Type.Number({ description: 'ID do post associado' }))
  },
  { $id: 'AIGenerationLogData', additionalProperties: false }
)
export type AIGenerationLogData = Static<typeof aiGenerationLogDataSchema>
export const aiGenerationLogDataValidator = getValidator(aiGenerationLogDataSchema, dataValidator)
export const aiGenerationLogDataResolver = resolve<AIGenerationLogData, HookContext<AIGenerationLogsService>>(
  {}
)

// Schema para atualizar log
export const aiGenerationLogPatchSchema = Type.Partial(
  Type.Object({
    postId: Type.Number(),
    status: Type.Union(generationStatuses.map(s => Type.Literal(s))),
    agentExecutions: Type.Array(agentExecutionSchema),
    slides: Type.Array(carouselSlideSchema),
    totalPromptTokens: Type.Number(),
    totalCompletionTokens: Type.Number(),
    totalTokens: Type.Number(),
    executionTimeMs: Type.Number(),
    // Campos de custo
    estimatedCostUsd: Type.Number(),
    costBreakdown: costBreakdownSchema,
    mainProvider: Type.String(),
    mainModel: Type.String(),
    // Campos de erro
    errorMessage: Type.String(),
    errorStack: Type.String(),
    // Campo para persistir ultimo progresso (para reconexao apos refresh)
    lastProgress: generationProgressSchema,
    completedAt: Type.String({ format: 'date-time' })
  }),
  { $id: 'AIGenerationLogPatch', additionalProperties: false }
)
export type AIGenerationLogPatch = Static<typeof aiGenerationLogPatchSchema>
export const aiGenerationLogPatchValidator = getValidator(aiGenerationLogPatchSchema, dataValidator)
export const aiGenerationLogPatchResolver = resolve<
  AIGenerationLogPatch,
  HookContext<AIGenerationLogsService>
>({})

// Schema para queries
export const aiGenerationLogQueryProperties = Type.Pick(aiGenerationLogSchema, [
  'id',
  'brandId',
  'userId',
  'postId',
  'status',
  'generationType',
  'platform'
])
export const aiGenerationLogQuerySchema = Type.Intersect(
  [querySyntax(aiGenerationLogQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type AIGenerationLogQuery = Static<typeof aiGenerationLogQuerySchema>
export const aiGenerationLogQueryValidator = getValidator(aiGenerationLogQuerySchema, queryValidator)
export const aiGenerationLogQueryResolver = resolve<
  AIGenerationLogQuery,
  HookContext<AIGenerationLogsService>
>({})
