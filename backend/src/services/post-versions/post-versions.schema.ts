// Schema para servico de Versoes de Posts
// Cada geracao de IA cria uma nova versao, permitindo historico e rollback
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PostVersionsService } from './post-versions.class'
import { postCarouselSlideSchema, creativeBriefingSchema } from '../posts/posts.schema'

// Valores validos para source
export const validVersionSources = ['ai', 'manual'] as const
export type VersionSource = (typeof validVersionSources)[number]

// Schema principal da versao do post
export const postVersionSchema = Type.Object(
  {
    id: Type.Number(),
    postId: Type.Number({ description: 'ID do post pai' }),
    logId: Type.Optional(Type.Number({ description: 'ID do ai_generation_log associado' })),
    version: Type.Number({ description: 'Numero sequencial da versao' }),
    // Conteudo da versao
    content: Type.String({ description: 'Conteudo textual principal' }),
    caption: Type.Optional(Type.String({ description: 'Caption/descricao para carousels' })),
    slides: Type.Optional(Type.Array(postCarouselSlideSchema)),
    mediaUrls: Type.Optional(Type.Array(Type.String())),
    creativeBriefing: Type.Optional(creativeBriefingSchema),
    // Metadados
    isActive: Type.Boolean({ description: 'Se esta versao esta ativa no post' }),
    source: Type.Union(validVersionSources.map(s => Type.Literal(s))),
    prompt: Type.Optional(Type.String({ description: 'Prompt usado para geracao' })),
    // Estatisticas de geracao (somente para source=ai)
    totalTokens: Type.Optional(Type.Number()),
    costUsd: Type.Optional(Type.Number()),
    executionTimeMs: Type.Optional(Type.Number()),
    // Timestamps
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'PostVersion', additionalProperties: false }
)
export type PostVersion = Static<typeof postVersionSchema>
export const postVersionValidator = getValidator(postVersionSchema, dataValidator)
export const postVersionResolver = resolve<PostVersion, HookContext<PostVersionsService>>({})
export const postVersionExternalResolver = resolve<PostVersion, HookContext<PostVersionsService>>({})

// Schema para criar nova versao
export const postVersionDataSchema = Type.Object(
  {
    postId: Type.Number(),
    logId: Type.Optional(Type.Number()),
    version: Type.Number(),
    content: Type.String(),
    caption: Type.Optional(Type.String()),
    slides: Type.Optional(Type.Array(postCarouselSlideSchema)),
    mediaUrls: Type.Optional(Type.Array(Type.String())),
    creativeBriefing: Type.Optional(creativeBriefingSchema),
    isActive: Type.Optional(Type.Boolean()),
    source: Type.Optional(Type.Union(validVersionSources.map(s => Type.Literal(s)))),
    prompt: Type.Optional(Type.String()),
    totalTokens: Type.Optional(Type.Number()),
    costUsd: Type.Optional(Type.Number()),
    executionTimeMs: Type.Optional(Type.Number())
  },
  { $id: 'PostVersionData', additionalProperties: false }
)
export type PostVersionData = Static<typeof postVersionDataSchema>
export const postVersionDataValidator = getValidator(postVersionDataSchema, dataValidator)
export const postVersionDataResolver = resolve<PostVersionData, HookContext<PostVersionsService>>({})

// Schema para atualizar versao
export const postVersionPatchSchema = Type.Partial(
  Type.Object({
    content: Type.String(),
    caption: Type.String(),
    slides: Type.Array(postCarouselSlideSchema),
    mediaUrls: Type.Array(Type.String()),
    creativeBriefing: creativeBriefingSchema,
    isActive: Type.Boolean(),
    source: Type.Union(validVersionSources.map(s => Type.Literal(s))),
    prompt: Type.String(),
    totalTokens: Type.Number(),
    costUsd: Type.Number(),
    executionTimeMs: Type.Number()
  }),
  { $id: 'PostVersionPatch', additionalProperties: false }
)
export type PostVersionPatch = Static<typeof postVersionPatchSchema>
export const postVersionPatchValidator = getValidator(postVersionPatchSchema, dataValidator)
export const postVersionPatchResolver = resolve<PostVersionPatch, HookContext<PostVersionsService>>({})

// Schema para queries
export const postVersionQueryProperties = Type.Pick(postVersionSchema, [
  'id',
  'postId',
  'logId',
  'version',
  'isActive',
  'source',
  'createdAt'
])
export const postVersionQuerySchema = Type.Intersect(
  [querySyntax(postVersionQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type PostVersionQuery = Static<typeof postVersionQuerySchema>
export const postVersionQueryValidator = getValidator(postVersionQuerySchema, queryValidator)
export const postVersionQueryResolver = resolve<PostVersionQuery, HookContext<PostVersionsService>>({})
