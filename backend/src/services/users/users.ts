// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'
import { BadRequest, Forbidden } from '@feathersjs/errors'
import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  userDataValidator,
  userPatchValidator,
  userQueryValidator,
  userResolver,
  userExternalResolver,
  userDataResolver,
  userPatchResolver,
  userQueryResolver
} from './users.schema'

import type { Application, HookContext } from '../../declarations'
import { UserService, getOptions } from './users.class'
import { userPath, userMethods } from './users.shared'
import { checkPermission } from '../../hooks/check-permissions'

export * from './users.class'
export * from './users.schema'

/**
 * Hook para impedir que usuario delete a si mesmo
 * Nota: Chamadas internas (provider === undefined) ignoram esta verificacao
 */
const preventSelfDelete = async (context: HookContext) => {
  // Chamadas internas nao precisam dessa verificacao
  if (context.params.provider === undefined) {
    return context
  }

  const currentUser = context.params.user
  const targetId = context.id

  if (currentUser && targetId && currentUser.id === Number(targetId)) {
    throw new BadRequest('Voce nao pode excluir sua propria conta')
  }

  return context
}

/**
 * Hook para proteger o ultimo super-admin
 * Nota: Chamadas internas (provider === undefined) ignoram esta verificacao
 */
const protectLastSuperAdmin = async (context: HookContext) => {
  // Chamadas internas nao precisam dessa verificacao
  if (context.params.provider === undefined) {
    return context
  }

  const targetId = context.id

  if (!targetId) return context

  // Buscar o usuario que sera deletado/modificado
  const targetUser = await context.service.get(targetId, { ...context.params, query: {} })

  // Se nao for super-admin, pode prosseguir
  if (targetUser.role !== 'super-admin') return context

  // Se for patch e nao estiver mudando a role, pode prosseguir
  if (context.method === 'patch' && !context.data?.role) return context

  // Contar quantos super-admins existem
  const superAdmins = await context.service.find({
    ...context.params,
    query: { role: 'super-admin' },
    paginate: false
  })

  const count = Array.isArray(superAdmins) ? superAdmins.length : superAdmins.data?.length || 0

  if (count <= 1) {
    if (context.method === 'remove') {
      throw new Forbidden('Nao e possivel excluir o ultimo super-admin do sistema')
    }
    if (context.method === 'patch' && context.data?.role !== 'super-admin') {
      throw new Forbidden('Nao e possivel rebaixar o ultimo super-admin do sistema')
    }
  }

  return context
}

/**
 * Hook para impedir que usuarios nao-admin criem usuarios com role elevada
 */
const validateRoleAssignment = async (context: HookContext) => {
  const currentUser = context.params.user
  const newRole = context.data?.role

  // Se nao houver usuario autenticado (bootstrap) ou nao estiver definindo role, permite
  if (!currentUser || !newRole) return context

  const currentRole = currentUser.role || 'viewer'

  // Apenas super-admin pode criar/promover para super-admin
  if (newRole === 'super-admin' && currentRole !== 'super-admin') {
    throw new Forbidden('Apenas super-admins podem criar ou promover usuarios para super-admin')
  }

  // Apenas admin ou super-admin podem criar/promover para admin
  if (newRole === 'admin' && currentRole !== 'super-admin' && currentRole !== 'admin') {
    throw new Forbidden('Apenas administradores podem criar ou promover usuarios para admin')
  }

  return context
}

// A configure function that registers the service and its hooks via `app.configure`
export const user = (app: Application) => {
  // Register our service on the Feathers application
  app.use(userPath, new UserService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: userMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(userPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(userExternalResolver), schemaHooks.resolveResult(userResolver)],
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      create: [],
      update: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]
    },
    before: {
      all: [schemaHooks.validateQuery(userQueryValidator), schemaHooks.resolveQuery(userQueryResolver)],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(userDataValidator),
        schemaHooks.resolveData(userDataResolver),
        validateRoleAssignment
      ],
      patch: [
        checkPermission('users:manage'),
        schemaHooks.validateData(userPatchValidator),
        schemaHooks.resolveData(userPatchResolver),
        validateRoleAssignment,
        protectLastSuperAdmin
      ],
      remove: [checkPermission('users:manage'), preventSelfDelete, protectLastSuperAdmin]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [userPath]: UserService
  }
}
