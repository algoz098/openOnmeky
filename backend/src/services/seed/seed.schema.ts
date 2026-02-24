// Schema para servico de Seed
import { resolve } from '@feathersjs/schema'
import { Type, getValidator } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator } from '../../validators'
import type { SeedService } from './seed.class'

// Schema para status do seed (retornado pelo find)
export const seedStatusSchema = Type.Object(
  {
    seeded: Type.Boolean(),
    platforms: Type.Number(),
    roles: Type.Number(),
    prompts: Type.Number()
  },
  { $id: 'SeedStatus', additionalProperties: false }
)
export type SeedStatus = Static<typeof seedStatusSchema>

// Schema para criar seed
export const seedDataSchema = Type.Object(
  {
    force: Type.Optional(Type.Boolean({ default: false }))
  },
  { $id: 'SeedData', additionalProperties: false }
)
export type SeedData = Static<typeof seedDataSchema>
export const seedDataValidator = getValidator(seedDataSchema, dataValidator)

// Schema para resultado do seed
export const seedResultSchema = Type.Object(
  {
    seeded: Type.Boolean(),
    platforms: Type.Number(),
    roles: Type.Number(),
    prompts: Type.Number()
  },
  { $id: 'SeedResult', additionalProperties: false }
)
export type SeedResult = Static<typeof seedResultSchema>

export const seedStatusResolver = resolve<SeedStatus, HookContext<SeedService>>({})
export const seedResultResolver = resolve<SeedResult, HookContext<SeedService>>({})
