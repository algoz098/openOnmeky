// Hook para verificacao de permissoes baseadas em roles
import { Forbidden } from '@feathersjs/errors'
import type { HookContext } from '../declarations'

// Permissoes disponiveis no sistema
export type Permission =
  | '*'
  | 'users:manage'
  | 'users:read'
  | 'users:write'
  | 'brands:manage'
  | 'brands:read'
  | 'brands:write'
  | 'posts:manage'
  | 'posts:read'
  | 'posts:write'
  | 'settings:manage'
  | 'settings:read'
  | 'system:manage'
  | 'system:read'
  | 'roles:manage'
  | 'roles:read'
  | 'platforms:manage'
  | 'platforms:read'
  | 'ai:manage'
  | 'ai:use'

// Roles validas do sistema
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'super-admin': ['*'],
  admin: ['users:manage', 'brands:manage', 'posts:manage', 'settings:manage', 'system:read', 'ai:manage'],
  editor: ['brands:read', 'brands:write', 'posts:read', 'posts:write', 'ai:use'],
  viewer: ['brands:read', 'posts:read']
}

/**
 * Verifica se uma role tem uma permissao especifica
 */
export const hasPermission = (roleName: string, permissionToCheck: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[roleName]

  if (!permissions) {
    return false
  }

  // Super-admin tem todas as permissoes
  if (permissions.includes('*')) {
    return true
  }

  // Verificar permissao exata
  if (permissions.includes(permissionToCheck)) {
    return true
  }

  // Verificar permissao de categoria (ex: posts:manage inclui posts:read, posts:write)
  if (permissionToCheck.includes(':')) {
    const [category] = permissionToCheck.split(':')
    if (permissions.includes(`${category}:manage` as Permission)) {
      return true
    }
  }

  return false
}

/**
 * Hook para verificar se o usuario tem a permissao necessaria
 * @param requiredPermission - Permissao necessaria para acessar o recurso
 */
export const checkPermission = (requiredPermission: Permission) => {
  return async (context: HookContext) => {
    const user = context.params.user

    if (!user) {
      throw new Forbidden('Usuario nao autenticado')
    }

    const userRole = user.role || 'viewer'

    if (!hasPermission(userRole, requiredPermission)) {
      throw new Forbidden(`Permissao negada. Requer: ${requiredPermission}`)
    }

    return context
  }
}

/**
 * Hook para verificar se o usuario tem pelo menos uma das permissoes
 * @param permissions - Lista de permissoes aceitas
 */
export const checkAnyPermission = (permissions: Permission[]) => {
  return async (context: HookContext) => {
    const user = context.params.user

    if (!user) {
      throw new Forbidden('Usuario nao autenticado')
    }

    const userRole = user.role || 'viewer'

    const hasAny = permissions.some((perm) => hasPermission(userRole, perm))

    if (!hasAny) {
      throw new Forbidden(`Permissao negada. Requer uma das: ${permissions.join(', ')}`)
    }

    return context
  }
}

/**
 * Hook para verificar se o usuario e admin ou super-admin
 */
export const requireAdmin = async (context: HookContext) => {
  const user = context.params.user

  if (!user) {
    throw new Forbidden('Usuario nao autenticado')
  }

  const userRole = user.role || 'viewer'

  if (userRole !== 'admin' && userRole !== 'super-admin') {
    throw new Forbidden('Acesso restrito a administradores')
  }

  return context
}

/**
 * Hook para verificar se o usuario e super-admin
 */
export const requireSuperAdmin = async (context: HookContext) => {
  const user = context.params.user

  if (!user) {
    throw new Forbidden('Usuario nao autenticado')
  }

  if (user.role !== 'super-admin') {
    throw new Forbidden('Acesso restrito a super-administradores')
  }

  return context
}

