// Schema para o servico ai-requests (somente leitura)
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { AIRequestsService } from './ai-requests.class'

// Acoes possiveis - mapeamento actionCode -> descricao em portugues
export const aiRequestActions = {
  carousel_generate: 'Usuario gerou carousel',
  carousel_regenerate: 'Usuario regenerou carousel',
  text_generate: 'Usuario gerou texto',
  text_rewrite: 'Usuario reescreveu texto',
  text_adapt: 'Usuario adaptou texto',
  hashtags_suggest: 'Usuario solicitou hashtags',
  image_regenerate: 'Usuario regenerou imagem',
  slide_text_edit: 'Usuario editou texto do slide'
} as const

export type AIRequestActionCode = keyof typeof aiRequestActions

// Labels dos agentes em portugues
export const agentLabels: Record<string, string> = {
  creativeDirection: 'Direcao Criativa',
  analysis: 'Analise',
  textCreation: 'Criacao de Texto',
  textGeneration: 'Geracao de Texto',
  imageGeneration: 'Geracao de Imagem',
  textOverlay: 'Overlay de Texto',
  compliance: 'Validacao'
}

// Schema principal (leitura)
export const aiRequestSchema = Type.Object(
  {
    id: Type.Number(),

    // Rastreabilidade
    postId: Type.Number(),
    userId: Type.Number(),
    brandId: Type.Number(),

    // Contexto
    action: Type.String(),
    actionCode: Type.String(),
    logId: Type.Optional(Type.Number()),

    // Agente
    agentType: Type.String(),
    agentLabel: Type.Optional(Type.String()),

    // Provider
    provider: Type.String(),
    model: Type.String(),

    // Tokens
    promptTokens: Type.Number(),
    completionTokens: Type.Number(),
    totalTokens: Type.Number(),

    // Custos
    costUsd: Type.Number(),
    inputCost: Type.Number(),
    outputCost: Type.Number(),
    imageCost: Type.Number(),
    videoCost: Type.Number(),

    // Media
    imagesGenerated: Type.Number(),
    videoSecondsGenerated: Type.Number(),

    // Timestamps
    requestedAt: Type.String({ format: 'date-time' }),
    startedAt: Type.Optional(Type.String({ format: 'date-time' })),
    completedAt: Type.Optional(Type.String({ format: 'date-time' })),
    durationMs: Type.Optional(Type.Number()),

    // Status
    status: Type.String(),
    errorMessage: Type.Optional(Type.String()),

    createdAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'AIRequest', additionalProperties: false }
)
export type AIRequest = Static<typeof aiRequestSchema>
export const aiRequestValidator = getValidator(aiRequestSchema, dataValidator)
export const aiRequestResolver = resolve<AIRequest, HookContext<AIRequestsService>>({})
export const aiRequestExternalResolver = resolve<AIRequest, HookContext<AIRequestsService>>({})

// Query schema - campos permitidos para filtros
export const aiRequestQueryProperties = Type.Pick(aiRequestSchema, [
  'id',
  'postId',
  'userId',
  'brandId',
  'actionCode',
  'agentType',
  'provider',
  'model',
  'status'
])

export const aiRequestQuerySchema = Type.Intersect(
  [
    querySyntax(aiRequestQueryProperties),
    Type.Object(
      {
        requestedAt: Type.Optional(
          Type.Object({
            $gte: Type.Optional(Type.String()),
            $lte: Type.Optional(Type.String())
          })
        )
      },
      { additionalProperties: false }
    )
  ],
  { additionalProperties: false }
)
export type AIRequestQuery = Static<typeof aiRequestQuerySchema>
export const aiRequestQueryValidator = getValidator(aiRequestQuerySchema, queryValidator)
export const aiRequestQueryResolver = resolve<AIRequestQuery, HookContext<AIRequestsService>>({})
