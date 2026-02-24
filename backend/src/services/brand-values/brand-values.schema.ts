// Schema para servico de Brand Values
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BrandValuesService } from './brand-values.class'

// Main data model schema
export const brandValueSchema = Type.Object(
  {
    id: Type.Number(),
    brandId: Type.Number(),
    value: Type.String(),
    position: Type.Optional(Type.Number())
  },
  { $id: 'BrandValue', additionalProperties: false }
)
export type BrandValue = Static<typeof brandValueSchema>
export const brandValueValidator = getValidator(brandValueSchema, dataValidator)
export const brandValueResolver = resolve<BrandValue, HookContext<BrandValuesService>>({})

export const brandValueExternalResolver = resolve<BrandValue, HookContext<BrandValuesService>>({})

// Schema for creating new entries
export const brandValueDataSchema = Type.Object(
  {
    brandId: Type.Number(),
    value: Type.String(),
    position: Type.Optional(Type.Number())
  },
  { $id: 'BrandValueData', additionalProperties: false }
)
export type BrandValueData = Static<typeof brandValueDataSchema>
export const brandValueDataValidator = getValidator(brandValueDataSchema, dataValidator)
export const brandValueDataResolver = resolve<BrandValueData, HookContext<BrandValuesService>>({})

// Schema for updating existing entries
export const brandValuePatchSchema = Type.Partial(brandValueDataSchema, {
  $id: 'BrandValuePatch',
  additionalProperties: false
})
export type BrandValuePatch = Static<typeof brandValuePatchSchema>
export const brandValuePatchValidator = getValidator(brandValuePatchSchema, dataValidator)
export const brandValuePatchResolver = resolve<BrandValuePatch, HookContext<BrandValuesService>>({})

// Schema for allowed query properties
export const brandValueQueryProperties = Type.Pick(brandValueSchema, ['id', 'brandId'])
export const brandValueQuerySchema = Type.Intersect(
  [querySyntax(brandValueQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type BrandValueQuery = Static<typeof brandValueQuerySchema>
export const brandValueQueryValidator = getValidator(brandValueQuerySchema, queryValidator)
export const brandValueQueryResolver = resolve<BrandValueQuery, HookContext<BrandValuesService>>({})
