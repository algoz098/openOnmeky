// Schema para servico de System
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SystemService } from './system.class'

// Schema para configuracao do sistema (banco de dados)
export const systemConfigSchema = Type.Object(
  {
    id: Type.Number(),
    key: Type.String(),
    value: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'SystemConfig', additionalProperties: false }
)
export type SystemConfig = Static<typeof systemConfigSchema>
export const systemConfigValidator = getValidator(systemConfigSchema, dataValidator)

// Schema para status do sistema (retornado pelo find)
export const systemStatusSchema = Type.Object(
  {
    initialized: Type.Boolean()
  },
  { $id: 'SystemStatus', additionalProperties: false }
)
export type SystemStatus = Static<typeof systemStatusSchema>

export const systemStatusResolver = resolve<SystemStatus, HookContext<SystemService>>({})
export const systemStatusExternalResolver = resolve<SystemStatus, HookContext<SystemService>>({})

// Schema para query
export const systemQueryProperties = Type.Pick(systemConfigSchema, ['id', 'key'])
export const systemQuerySchema = Type.Intersect(
  [querySyntax(systemQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type SystemQuery = Static<typeof systemQuerySchema>
export const systemQueryValidator = getValidator(systemQuerySchema, queryValidator)
export const systemQueryResolver = resolve<SystemQuery, HookContext<SystemService>>({})
