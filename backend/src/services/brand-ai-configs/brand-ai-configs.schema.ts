// Schema para servico de Brand AI Configs
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BrandAiConfigsService } from './brand-ai-configs.class'

// Tipos de agentes validos
export const validAgentTypes = [
  'creative-direction',
  'text-creation',
  'image-generation',
  'text-overlay',
  'analysis',
  'compliance'
] as const

// Main data model schema
export const brandAiConfigSchema = Type.Object(
  {
    id: Type.Number(),
    brandId: Type.Number(),
    agentType: Type.String(),
    provider: Type.Optional(Type.String()),
    model: Type.Optional(Type.String()),
    temperature: Type.Optional(Type.Number()),
    maxTokens: Type.Optional(Type.Number())
  },
  { $id: 'BrandAiConfig', additionalProperties: false }
)
export type BrandAiConfig = Static<typeof brandAiConfigSchema>
export const brandAiConfigValidator = getValidator(brandAiConfigSchema, dataValidator)
export const brandAiConfigResolver = resolve<BrandAiConfig, HookContext<BrandAiConfigsService>>({})

export const brandAiConfigExternalResolver = resolve<BrandAiConfig, HookContext<BrandAiConfigsService>>({})

// Schema for creating new entries
export const brandAiConfigDataSchema = Type.Object(
  {
    brandId: Type.Number(),
    agentType: Type.String(),
    provider: Type.Optional(Type.String()),
    model: Type.Optional(Type.String()),
    temperature: Type.Optional(Type.Number()),
    maxTokens: Type.Optional(Type.Number())
  },
  { $id: 'BrandAiConfigData', additionalProperties: false }
)
export type BrandAiConfigData = Static<typeof brandAiConfigDataSchema>
export const brandAiConfigDataValidator = getValidator(brandAiConfigDataSchema, dataValidator)
export const brandAiConfigDataResolver = resolve<BrandAiConfigData, HookContext<BrandAiConfigsService>>({})

// Schema for updating existing entries
export const brandAiConfigPatchSchema = Type.Partial(brandAiConfigDataSchema, {
  $id: 'BrandAiConfigPatch',
  additionalProperties: false
})
export type BrandAiConfigPatch = Static<typeof brandAiConfigPatchSchema>
export const brandAiConfigPatchValidator = getValidator(brandAiConfigPatchSchema, dataValidator)
export const brandAiConfigPatchResolver = resolve<BrandAiConfigPatch, HookContext<BrandAiConfigsService>>({})

// Schema for allowed query properties
export const brandAiConfigQueryProperties = Type.Pick(brandAiConfigSchema, [
  'id',
  'brandId',
  'agentType',
  'provider'
])
export const brandAiConfigQuerySchema = Type.Intersect(
  [querySyntax(brandAiConfigQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type BrandAiConfigQuery = Static<typeof brandAiConfigQuerySchema>
export const brandAiConfigQueryValidator = getValidator(brandAiConfigQuerySchema, queryValidator)
export const brandAiConfigQueryResolver = resolve<BrandAiConfigQuery, HookContext<BrandAiConfigsService>>({})
