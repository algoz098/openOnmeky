// Schema para servico de Roles
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RolesService } from './roles.class'

// Main data model schema
export const roleSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    permissions: Type.Array(Type.String()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Role', additionalProperties: false }
)
export type Role = Static<typeof roleSchema>
export const roleValidator = getValidator(roleSchema, dataValidator)
export const roleResolver = resolve<Role, HookContext<RolesService>>({})

export const roleExternalResolver = resolve<Role, HookContext<RolesService>>({})

// Schema for creating new entries
export const roleDataSchema = Type.Object(
  {
    name: Type.String(),
    description: Type.Optional(Type.String()),
    permissions: Type.Array(Type.String())
  },
  { $id: 'RoleData', additionalProperties: false }
)
export type RoleData = Static<typeof roleDataSchema>
export const roleDataValidator = getValidator(roleDataSchema, dataValidator)
export const roleDataResolver = resolve<RoleData, HookContext<RolesService>>({})

// Schema for updating existing entries
export const rolePatchSchema = Type.Partial(roleDataSchema, {
  $id: 'RolePatch',
  additionalProperties: false
})
export type RolePatch = Static<typeof rolePatchSchema>
export const rolePatchValidator = getValidator(rolePatchSchema, dataValidator)
export const rolePatchResolver = resolve<RolePatch, HookContext<RolesService>>({})

// Schema for allowed query properties
export const roleQueryProperties = Type.Pick(roleSchema, ['id', 'name'])
export const roleQuerySchema = Type.Intersect(
  [querySyntax(roleQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type RoleQuery = Static<typeof roleQuerySchema>
export const roleQueryValidator = getValidator(roleQuerySchema, queryValidator)
export const roleQueryResolver = resolve<RoleQuery, HookContext<RolesService>>({})
