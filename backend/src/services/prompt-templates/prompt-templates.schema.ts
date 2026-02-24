// Schema para servico de Prompt Templates
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PromptTemplatesService } from './prompt-templates.class'

// Tipos validos de prompt
export const validPromptTypes = ['text', 'image', 'video'] as const

// Main data model schema
export const promptTemplateSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String(),
    type: Type.Union(validPromptTypes.map(t => Type.Literal(t))),
    template: Type.String(),
    description: Type.Optional(Type.String()),
    isDefault: Type.Optional(Type.Boolean({ default: false })),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'PromptTemplate', additionalProperties: false }
)
export type PromptTemplate = Static<typeof promptTemplateSchema>
export const promptTemplateValidator = getValidator(promptTemplateSchema, dataValidator)
export const promptTemplateResolver = resolve<PromptTemplate, HookContext<PromptTemplatesService>>({})

export const promptTemplateExternalResolver = resolve<PromptTemplate, HookContext<PromptTemplatesService>>({})

// Schema for creating new entries
export const promptTemplateDataSchema = Type.Object(
  {
    name: Type.String(),
    type: Type.Union(validPromptTypes.map(t => Type.Literal(t))),
    template: Type.String(),
    description: Type.Optional(Type.String()),
    isDefault: Type.Optional(Type.Boolean({ default: false }))
  },
  { $id: 'PromptTemplateData', additionalProperties: false }
)
export type PromptTemplateData = Static<typeof promptTemplateDataSchema>
export const promptTemplateDataValidator = getValidator(promptTemplateDataSchema, dataValidator)
export const promptTemplateDataResolver = resolve<PromptTemplateData, HookContext<PromptTemplatesService>>({})

// Schema for updating existing entries
export const promptTemplatePatchSchema = Type.Partial(promptTemplateDataSchema, {
  $id: 'PromptTemplatePatch',
  additionalProperties: false
})
export type PromptTemplatePatch = Static<typeof promptTemplatePatchSchema>
export const promptTemplatePatchValidator = getValidator(promptTemplatePatchSchema, dataValidator)
export const promptTemplatePatchResolver = resolve<PromptTemplatePatch, HookContext<PromptTemplatesService>>(
  {}
)

// Schema for allowed query properties
export const promptTemplateQueryProperties = Type.Pick(promptTemplateSchema, [
  'id',
  'name',
  'type',
  'isDefault'
])
export const promptTemplateQuerySchema = Type.Intersect(
  [querySyntax(promptTemplateQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type PromptTemplateQuery = Static<typeof promptTemplateQuerySchema>
export const promptTemplateQueryValidator = getValidator(promptTemplateQuerySchema, queryValidator)
export const promptTemplateQueryResolver = resolve<PromptTemplateQuery, HookContext<PromptTemplatesService>>(
  {}
)
