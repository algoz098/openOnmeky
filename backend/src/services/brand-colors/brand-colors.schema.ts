// Schema para servico de Brand Colors
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BrandColorsService } from './brand-colors.class'

// Main data model schema
export const brandColorSchema = Type.Object(
  {
    id: Type.Number(),
    brandId: Type.Number(),
    color: Type.String(), // hex color
    isPrimary: Type.Optional(Type.Boolean()),
    position: Type.Optional(Type.Number())
  },
  { $id: 'BrandColor', additionalProperties: false }
)
export type BrandColor = Static<typeof brandColorSchema>
export const brandColorValidator = getValidator(brandColorSchema, dataValidator)
export const brandColorResolver = resolve<BrandColor, HookContext<BrandColorsService>>({})

export const brandColorExternalResolver = resolve<BrandColor, HookContext<BrandColorsService>>({})

// Schema for creating new entries
export const brandColorDataSchema = Type.Object(
  {
    brandId: Type.Number(),
    color: Type.String(),
    isPrimary: Type.Optional(Type.Boolean()),
    position: Type.Optional(Type.Number())
  },
  { $id: 'BrandColorData', additionalProperties: false }
)
export type BrandColorData = Static<typeof brandColorDataSchema>
export const brandColorDataValidator = getValidator(brandColorDataSchema, dataValidator)
export const brandColorDataResolver = resolve<BrandColorData, HookContext<BrandColorsService>>({})

// Schema for updating existing entries
export const brandColorPatchSchema = Type.Partial(brandColorDataSchema, {
  $id: 'BrandColorPatch',
  additionalProperties: false
})
export type BrandColorPatch = Static<typeof brandColorPatchSchema>
export const brandColorPatchValidator = getValidator(brandColorPatchSchema, dataValidator)
export const brandColorPatchResolver = resolve<BrandColorPatch, HookContext<BrandColorsService>>({})

// Schema for allowed query properties
export const brandColorQueryProperties = Type.Pick(brandColorSchema, ['id', 'brandId', 'isPrimary'])
export const brandColorQuerySchema = Type.Intersect(
  [querySyntax(brandColorQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type BrandColorQuery = Static<typeof brandColorQuerySchema>
export const brandColorQueryValidator = getValidator(brandColorQuerySchema, queryValidator)
export const brandColorQueryResolver = resolve<BrandColorQuery, HookContext<BrandColorsService>>({})
