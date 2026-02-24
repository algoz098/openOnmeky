// Schema para servico de Posts
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PostsService } from './posts.class'

// Valores validos para status e origin
export const validStatuses = ['draft', 'approved', 'scheduled', 'published'] as const
export const validOrigins = ['manual', 'ai'] as const
export const validAiModes = ['text', 'carousel'] as const
export const validAiTypes = ['post', 'story', 'reels', 'article'] as const
export const validAiTones = ['formal', 'casual', 'humoristico', 'inspirador'] as const
export const validAspectRatios = ['1:1', '4:5', '9:16', '16:9'] as const
// Estados da geracao de IA
export const validAiStates = ['idle', 'loading', 'error'] as const

// Schema de tipografia para overlay
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

// Schema de slide do carrousel (para posts) - com suporte a master image
export const postCarouselSlideSchema = Type.Object({
  index: Type.Number(),
  purpose: Type.String(), // 'hook', 'features', 'summary', 'cta'
  text: Type.Optional(Type.String()),
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
export type PostCarouselSlide = Static<typeof postCarouselSlideSchema>

// Schema do briefing criativo (para persistir no post)
export const creativeBriefingSchema = Type.Object({
  concept: Type.String(),
  narrative: Type.String(),
  visualStyle: Type.String(),
  colorPalette: Type.Array(Type.String()),
  moodKeywords: Type.Array(Type.String()),
  typography: Type.Optional(
    Type.Object({
      fontFamily: Type.Union([
        Type.Literal('sans-serif'),
        Type.Literal('serif'),
        Type.Literal('display'),
        Type.Literal('handwritten')
      ]),
      primaryColor: Type.String(),
      secondaryColor: Type.String(),
      style: Type.Union([
        Type.Literal('modern'),
        Type.Literal('classic'),
        Type.Literal('playful'),
        Type.Literal('elegant'),
        Type.Literal('bold')
      ])
    })
  ),
  overlayStyle: Type.Optional(
    Type.Object({
      designReference: Type.String(),
      defaultType: Type.Union([
        Type.Literal('gradient'),
        Type.Literal('blur'),
        Type.Literal('solid'),
        Type.Literal('none')
      ]),
      gradientDirection: Type.Union([
        Type.Literal('bottom-up'),
        Type.Literal('top-down'),
        Type.Literal('left-right'),
        Type.Literal('radial')
      ]),
      opacity: Type.Number(),
      cornerRadius: Type.Union([Type.Literal('none'), Type.Literal('subtle'), Type.Literal('rounded')]),
      padding: Type.Union([Type.Literal('compact'), Type.Literal('normal'), Type.Literal('spacious')])
    })
  ),
  slides: Type.Array(
    Type.Object({
      purpose: Type.String(),
      direction: Type.String(),
      keyMessage: Type.String(),
      overlayConfig: Type.Optional(
        Type.Object({
          type: Type.Union([
            Type.Literal('gradient'),
            Type.Literal('blur'),
            Type.Literal('solid'),
            Type.Literal('none')
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
          description: Type.String()
        })
      )
    })
  )
})
export type PostCreativeBriefing = Static<typeof creativeBriefingSchema>

// Schema para breakdown de custos de uso de IA
export const aiUsageCostBreakdownSchema = Type.Object({
  inputCost: Type.Number(),
  outputCost: Type.Number(),
  imageCost: Type.Number(),
  videoCost: Type.Number()
})

// Schema para custo por agente (usado em carousels)
export const agentCostSchema = Type.Object({
  agentType: Type.String(),
  provider: Type.String(),
  model: Type.String(),
  promptTokens: Type.Number(),
  completionTokens: Type.Number(),
  totalTokens: Type.Number(),
  costUsd: Type.Number(),
  imagesGenerated: Type.Optional(Type.Number())
})
export type AgentCost = Static<typeof agentCostSchema>

// Schema para uma execucao de IA (cada geracao e uma execucao)
export const aiExecutionSchema = Type.Object({
  id: Type.String(), // UUID para identificar a execucao
  type: Type.String(), // 'generate', 'rewrite', 'adapt', 'suggest-hashtags', 'carousel'
  provider: Type.String(),
  model: Type.String(),
  promptTokens: Type.Number(),
  completionTokens: Type.Number(),
  totalTokens: Type.Number(),
  costUsd: Type.Number(),
  costBreakdown: aiUsageCostBreakdownSchema,
  imagesGenerated: Type.Optional(Type.Number()),
  // Para carousels: breakdown por agente
  agentBreakdown: Type.Optional(Type.Array(agentCostSchema)),
  timestamp: Type.String({ format: 'date-time' })
})
export type AIExecution = Static<typeof aiExecutionSchema>

// Main data model schema
export const postSchema = Type.Object(
  {
    id: Type.Number(),
    brandId: Type.Number(),
    userId: Type.Optional(Type.Number()),
    content: Type.String(),
    platform: Type.String(),
    status: Type.Optional(
      Type.Union(
        validStatuses.map(s => Type.Literal(s)),
        { default: 'draft' }
      )
    ),
    origin: Type.Optional(
      Type.Union(
        validOrigins.map(o => Type.Literal(o)),
        { default: 'manual' }
      )
    ),
    aiPrompt: Type.Optional(Type.String()),
    aiContext: Type.Optional(Type.String()),
    aiMode: Type.Optional(Type.Union(validAiModes.map(m => Type.Literal(m)))),
    aiType: Type.Optional(Type.Union(validAiTypes.map(t => Type.Literal(t)))),
    aiTone: Type.Optional(Type.Union(validAiTones.map(t => Type.Literal(t)))),
    aiReferenceImages: Type.Optional(Type.Array(Type.String())),
    charCount: Type.Optional(Type.Number()),
    charLimit: Type.Optional(Type.Number()),
    warnings: Type.Optional(Type.Array(Type.String())),
    mediaUrls: Type.Optional(Type.Array(Type.String())),
    slides: Type.Optional(Type.Array(postCarouselSlideSchema)),
    // Novo campo para persistir o briefing criativo completo
    creativeBriefing: Type.Optional(creativeBriefingSchema),
    // Campos de uso de IA (ultima geracao) - mantidos para compatibilidade
    lastUsagePromptTokens: Type.Optional(Type.Number()),
    lastUsageCompletionTokens: Type.Optional(Type.Number()),
    lastUsageTotalTokens: Type.Optional(Type.Number()),
    lastUsageCostUsd: Type.Optional(Type.Number()),
    lastUsageCostBreakdown: Type.Optional(aiUsageCostBreakdownSchema),
    lastUsageProvider: Type.Optional(Type.String()),
    lastUsageModel: Type.Optional(Type.String()),
    // Campos de multiplas execucoes de IA (acumulados)
    aiExecutions: Type.Optional(Type.Array(aiExecutionSchema)),
    totalPromptTokens: Type.Optional(Type.Number()),
    totalCompletionTokens: Type.Optional(Type.Number()),
    totalTokensUsed: Type.Optional(Type.Number()),
    totalCostUsd: Type.Optional(Type.Number()),
    totalImagesGenerated: Type.Optional(Type.Number()),
    executionCount: Type.Optional(Type.Number()),
    // Campo de versao ativa
    currentVersionId: Type.Optional(Type.Number({ description: 'ID da versao ativa do post' })),
    // Campos de controle de geracao de IA em andamento
    aiState: Type.Optional(
      Type.Union(
        validAiStates.map(s => Type.Literal(s)),
        {
          default: 'idle',
          description: 'Estado da geracao de IA: idle, loading, error'
        }
      )
    ),
    activeLogId: Type.Optional(Type.Number({ description: 'ID do log de geracao ativo' })),
    scheduledAt: Type.Optional(Type.String({ format: 'date-time' })),
    publishedAt: Type.Optional(Type.String({ format: 'date-time' })),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Post', additionalProperties: false }
)
export type Post = Static<typeof postSchema>
export const postValidator = getValidator(postSchema, dataValidator)
export const postResolver = resolve<Post, HookContext<PostsService>>({})

export const postExternalResolver = resolve<Post, HookContext<PostsService>>({})

// Schema for creating new entries
// content e opcional para permitir salvar rascunhos incompletos
export const postDataSchema = Type.Object(
  {
    brandId: Type.Number(),
    content: Type.Optional(Type.String()),
    platform: Type.String(),
    status: Type.Optional(
      Type.Union(
        validStatuses.map(s => Type.Literal(s)),
        { default: 'draft' }
      )
    ),
    origin: Type.Optional(
      Type.Union(
        validOrigins.map(o => Type.Literal(o)),
        { default: 'manual' }
      )
    ),
    aiPrompt: Type.Optional(Type.String()),
    aiContext: Type.Optional(Type.String()),
    aiMode: Type.Optional(Type.Union(validAiModes.map(m => Type.Literal(m)))),
    aiType: Type.Optional(Type.Union(validAiTypes.map(t => Type.Literal(t)))),
    aiTone: Type.Optional(Type.Union(validAiTones.map(t => Type.Literal(t)))),
    aiReferenceImages: Type.Optional(Type.Array(Type.String())),
    mediaUrls: Type.Optional(Type.Array(Type.String())),
    slides: Type.Optional(Type.Array(postCarouselSlideSchema)),
    creativeBriefing: Type.Optional(creativeBriefingSchema),
    // Campos de uso de IA (ultima geracao) - mantidos para compatibilidade
    lastUsagePromptTokens: Type.Optional(Type.Number()),
    lastUsageCompletionTokens: Type.Optional(Type.Number()),
    lastUsageTotalTokens: Type.Optional(Type.Number()),
    lastUsageCostUsd: Type.Optional(Type.Number()),
    lastUsageCostBreakdown: Type.Optional(aiUsageCostBreakdownSchema),
    lastUsageProvider: Type.Optional(Type.String()),
    lastUsageModel: Type.Optional(Type.String()),
    // Campos de multiplas execucoes de IA (acumulados)
    aiExecutions: Type.Optional(Type.Array(aiExecutionSchema)),
    totalPromptTokens: Type.Optional(Type.Number()),
    totalCompletionTokens: Type.Optional(Type.Number()),
    totalTokensUsed: Type.Optional(Type.Number()),
    totalCostUsd: Type.Optional(Type.Number()),
    totalImagesGenerated: Type.Optional(Type.Number()),
    executionCount: Type.Optional(Type.Number()),
    scheduledAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'PostData', additionalProperties: false }
)
export type PostData = Static<typeof postDataSchema>
export const postDataValidator = getValidator(postDataSchema, dataValidator)
export const postDataResolver = resolve<PostData, HookContext<PostsService>>({})

// Schema for updating existing entries
export const postPatchSchema = Type.Partial(
  Type.Object({
    content: Type.String(),
    platform: Type.String(),
    status: Type.Union(validStatuses.map(s => Type.Literal(s))),
    origin: Type.Union(validOrigins.map(o => Type.Literal(o))),
    aiPrompt: Type.String(),
    aiContext: Type.String(),
    aiMode: Type.Union(validAiModes.map(m => Type.Literal(m))),
    aiType: Type.Union(validAiTypes.map(t => Type.Literal(t))),
    aiTone: Type.Union(validAiTones.map(t => Type.Literal(t))),
    aiReferenceImages: Type.Array(Type.String()),
    mediaUrls: Type.Array(Type.String()),
    slides: Type.Array(postCarouselSlideSchema),
    creativeBriefing: creativeBriefingSchema,
    // Campos de uso de IA (ultima geracao) - mantidos para compatibilidade
    lastUsagePromptTokens: Type.Number(),
    lastUsageCompletionTokens: Type.Number(),
    lastUsageTotalTokens: Type.Number(),
    lastUsageCostUsd: Type.Number(),
    lastUsageCostBreakdown: aiUsageCostBreakdownSchema,
    lastUsageProvider: Type.String(),
    lastUsageModel: Type.String(),
    // Campos de multiplas execucoes de IA (acumulados)
    aiExecutions: Type.Array(aiExecutionSchema),
    totalPromptTokens: Type.Number(),
    totalCompletionTokens: Type.Number(),
    totalTokensUsed: Type.Number(),
    totalCostUsd: Type.Number(),
    totalImagesGenerated: Type.Number(),
    executionCount: Type.Number(),
    currentVersionId: Type.Number(),
    // Campos de controle de geracao de IA em andamento
    aiState: Type.Union(validAiStates.map(s => Type.Literal(s))),
    activeLogId: Type.Union([Type.Number(), Type.Null()]),
    scheduledAt: Type.String({ format: 'date-time' })
  }),
  { $id: 'PostPatch', additionalProperties: false }
)
export type PostPatch = Static<typeof postPatchSchema>
export const postPatchValidator = getValidator(postPatchSchema, dataValidator)
export const postPatchResolver = resolve<PostPatch, HookContext<PostsService>>({})

// Schema for allowed query properties
export const postQueryProperties = Type.Pick(postSchema, [
  'id',
  'brandId',
  'platform',
  'status',
  'origin',
  'content',
  'scheduledAt',
  'publishedAt',
  'createdAt'
])
export const postQuerySchema = Type.Intersect(
  [querySyntax(postQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type PostQuery = Static<typeof postQuerySchema>
export const postQueryValidator = getValidator(postQuerySchema, queryValidator)
export const postQueryResolver = resolve<PostQuery, HookContext<PostsService>>({})
