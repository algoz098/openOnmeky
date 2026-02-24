// Schema para servico de Post Slides
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PostSlidesService } from './post-slides.class'

// Valores validos para purpose
export const validPurposes = ['hook', 'features', 'summary', 'cta'] as const

// Main data model schema
export const postSlideSchema = Type.Object(
  {
    id: Type.Number(),
    postId: Type.Number(),
    versionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    slideIndex: Type.Number(),
    purpose: Type.String(),
    text: Type.Optional(Type.String()),
    imageUrl: Type.Optional(Type.String()),
    imagePrompt: Type.Optional(Type.String()),
    masterImageUrl: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    // Campos relacionados (preenchidos via joins)
    versions: Type.Optional(Type.Array(Type.Any())),
    typography: Type.Optional(Type.Any()),
    generationMetadata: Type.Optional(Type.Any())
  },
  { $id: 'PostSlide', additionalProperties: false }
)
export type PostSlide = Static<typeof postSlideSchema>
export const postSlideValidator = getValidator(postSlideSchema, dataValidator)
export const postSlideResolver = resolve<PostSlide, HookContext<PostSlidesService>>({})

export const postSlideExternalResolver = resolve<PostSlide, HookContext<PostSlidesService>>({})

// Schema for creating new entries
export const postSlideDataSchema = Type.Object(
  {
    postId: Type.Number(),
    versionId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
    slideIndex: Type.Number(),
    purpose: Type.String(),
    text: Type.Optional(Type.String()),
    imageUrl: Type.Optional(Type.String()),
    imagePrompt: Type.Optional(Type.String()),
    masterImageUrl: Type.Optional(Type.String())
  },
  { $id: 'PostSlideData', additionalProperties: false }
)
export type PostSlideData = Static<typeof postSlideDataSchema>
export const postSlideDataValidator = getValidator(postSlideDataSchema, dataValidator)
export const postSlideDataResolver = resolve<PostSlideData, HookContext<PostSlidesService>>({})

// Schema for updating existing entries
export const postSlidePatchSchema = Type.Partial(postSlideDataSchema, {
  $id: 'PostSlidePatch',
  additionalProperties: false
})
export type PostSlidePatch = Static<typeof postSlidePatchSchema>
export const postSlidePatchValidator = getValidator(postSlidePatchSchema, dataValidator)
export const postSlidePatchResolver = resolve<PostSlidePatch, HookContext<PostSlidesService>>({})

// Schema for allowed query properties
export const postSlideQueryProperties = Type.Pick(postSlideSchema, [
  'id',
  'postId',
  'versionId',
  'slideIndex',
  'purpose'
])
export const postSlideQuerySchema = Type.Intersect(
  [querySyntax(postSlideQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type PostSlideQuery = Static<typeof postSlideQuerySchema>
export const postSlideQueryValidator = getValidator(postSlideQuerySchema, queryValidator)
export const postSlideQueryResolver = resolve<PostSlideQuery, HookContext<PostSlidesService>>({})
