// Configuracao do servico de Roles
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { HookContext } from '../../declarations'
import type { Application } from '../../declarations'
import { RolesService, getOptions } from './roles.class'
import type { RoleData } from './roles.schema'
import {
  roleDataValidator,
  rolePatchValidator,
  roleQueryValidator,
  roleResolver,
  roleExternalResolver,
  roleDataResolver,
  rolePatchResolver,
  roleQueryResolver
} from './roles.schema'
import { requireSuperAdmin } from '../../hooks/check-permissions'

export const rolesPath = 'roles'
export const rolesMethods = ['find', 'get', 'create', 'patch', 'remove', 'checkPermission'] as const

export * from './roles.class'
export * from './roles.schema'

// Hook para serializar permissions array para JSON string
const serializePermissions = async (context: HookContext) => {
  const data = context.data as RoleData
  if (data.permissions && Array.isArray(data.permissions)) {
    context.data = {
      ...data,
      permissions: JSON.stringify(data.permissions)
    }
  }
  return context
}

// Hook para deserializar permissions de JSON string para array
const deserializePermissions = async (context: HookContext) => {
  // Ignorar metodos customizados que nao retornam roles (ex: checkPermission retorna boolean)
  if (context.method === 'checkPermission') {
    return context
  }

  const deserialize = (role: Record<string, unknown>) => {
    // Verificar se e um objeto com campo permissions
    if (role && typeof role === 'object' && 'permissions' in role) {
      if (typeof role.permissions === 'string') {
        role.permissions = JSON.parse(role.permissions)
      } else if (!role.permissions) {
        role.permissions = []
      }
    }
    return role
  }

  if (context.result && typeof context.result === 'object') {
    if (Array.isArray(context.result.data)) {
      context.result.data = context.result.data.map(deserialize)
    } else if (context.result && typeof context.result === 'object' && 'id' in context.result) {
      context.result = deserialize(context.result as Record<string, unknown>)
    }
  }

  return context
}

// Hook condicional que ignora metodos customizados
const conditionalResolveExternal = async (context: HookContext, next: () => Promise<void>): Promise<void> => {
  if (context.method === 'checkPermission') {
    await next()
    return
  }
  await schemaHooks.resolveExternal(roleExternalResolver)(context, next)
}

const conditionalResolveResult = async (context: HookContext, next: () => Promise<void>): Promise<void> => {
  if (context.method === 'checkPermission') {
    await next()
    return
  }
  await schemaHooks.resolveResult(roleResolver)(context, next)
}

// Hook condicional para validar query apenas em metodos padrao
const conditionalValidateQuery = async (context: HookContext) => {
  if (context.method === 'checkPermission') {
    return context
  }
  return schemaHooks.validateQuery(roleQueryValidator)(context)
}

// Hook condicional para resolver query apenas em metodos padrao
const conditionalResolveQuery = async (context: HookContext) => {
  if (context.method === 'checkPermission') {
    return context
  }
  return schemaHooks.resolveQuery(roleQueryResolver)(context)
}

export const roles = (app: Application) => {
  app.use(rolesPath, new RolesService(getOptions(app)), {
    methods: rolesMethods,
    events: []
  })

  app.service(rolesPath).hooks({
    around: {
      all: [conditionalResolveExternal, conditionalResolveResult],
      // Roles requer autenticacao para leitura
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      // Mutacoes requerem super-admin
      create: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [conditionalValidateQuery, conditionalResolveQuery],
      find: [],
      get: [],
      create: [
        requireSuperAdmin,
        schemaHooks.validateData(roleDataValidator),
        schemaHooks.resolveData(roleDataResolver),
        serializePermissions
      ],
      patch: [
        requireSuperAdmin,
        schemaHooks.validateData(rolePatchValidator),
        schemaHooks.resolveData(rolePatchResolver),
        serializePermissions
      ],
      remove: [requireSuperAdmin]
    },
    after: {
      all: [deserializePermissions]
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [rolesPath]: RolesService
  }
}
