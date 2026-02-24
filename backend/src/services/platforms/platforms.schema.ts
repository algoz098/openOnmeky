// Schema para servico de Platforms
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PlatformsService } from './platforms.class'

// Main data model schema
export const platformSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String(),
    displayName: Type.String(),
    charLimit: Type.Number(),
    features: Type.Optional(Type.Array(Type.String())),
    active: Type.Optional(Type.Boolean({ default: true })),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Platform', additionalProperties: false }
)
export type Platform = Static<typeof platformSchema>
export const platformValidator = getValidator(platformSchema, dataValidator)
export const platformResolver = resolve<Platform, HookContext<PlatformsService>>({})

export const platformExternalResolver = resolve<Platform, HookContext<PlatformsService>>({})

// Schema for creating new entries
export const platformDataSchema = Type.Object(
  {
    name: Type.String(),
    displayName: Type.String(),
    charLimit: Type.Number(),
    features: Type.Optional(Type.Array(Type.String())),
    active: Type.Optional(Type.Boolean({ default: true }))
  },
  { $id: 'PlatformData', additionalProperties: false }
)
export type PlatformData = Static<typeof platformDataSchema>
export const platformDataValidator = getValidator(platformDataSchema, dataValidator)
export const platformDataResolver = resolve<PlatformData, HookContext<PlatformsService>>({})

// Schema for updating existing entries
export const platformPatchSchema = Type.Partial(platformDataSchema, {
  $id: 'PlatformPatch',
  additionalProperties: false
})
export type PlatformPatch = Static<typeof platformPatchSchema>
export const platformPatchValidator = getValidator(platformPatchSchema, dataValidator)
export const platformPatchResolver = resolve<PlatformPatch, HookContext<PlatformsService>>({})

// Schema for allowed query properties
export const platformQueryProperties = Type.Pick(platformSchema, ['id', 'name', 'active'])
export const platformQuerySchema = Type.Intersect(
  [querySyntax(platformQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type PlatformQuery = Static<typeof platformQuerySchema>
export const platformQueryValidator = getValidator(platformQuerySchema, queryValidator)
export const platformQueryResolver = resolve<PlatformQuery, HookContext<PlatformsService>>({})
