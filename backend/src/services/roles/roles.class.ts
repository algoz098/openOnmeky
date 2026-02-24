// Classe do servico de Roles
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { Role, RoleData, RolePatch, RoleQuery } from './roles.schema'

export type { Role, RoleData, RolePatch, RoleQuery }

export interface RolesParams extends KnexAdapterParams<RoleQuery> {}

// Definicao das roles padrao com suas permissoes
export const DEFAULT_ROLES: Array<{ name: string; description: string; permissions: string[] }> = [
  {
    name: 'super-admin',
    description: 'Acesso total ao sistema',
    permissions: ['*']
  },
  {
    name: 'admin',
    description: 'Gerenciamento de usuarios, marcas e posts',
    permissions: ['users:manage', 'brands:manage', 'posts:manage']
  },
  {
    name: 'editor',
    description: 'Criacao e edicao de conteudo',
    permissions: ['brands:read', 'brands:write', 'posts:read', 'posts:write']
  },
  {
    name: 'viewer',
    description: 'Acesso somente leitura',
    permissions: ['brands:read', 'posts:read']
  }
]

export class RolesService extends KnexService<Role, RoleData, RolesParams, RolePatch> {
  // Metodo customizado para verificar permissao
  async checkPermission(roleName: string, permissionToCheck: string): Promise<boolean> {
    // Buscar role pelo nome usando acesso direto ao adapter para evitar hooks
    const db = this.options.Model
    const roleRow = await db('roles').where('name', roleName).first()

    if (!roleRow) {
      return false
    }

    const permissions: string[] =
      typeof roleRow.permissions === 'string' ? JSON.parse(roleRow.permissions) : roleRow.permissions || []

    // Super-admin tem todas as permissoes
    if (permissions.includes('*')) {
      return true
    }

    // Verificar permissao exata
    if (permissions.includes(permissionToCheck)) {
      return true
    }

    // Verificar permissao de categoria (ex: posts:manage inclui posts:read, posts:write)
    if (typeof permissionToCheck === 'string' && permissionToCheck.includes(':')) {
      const [category] = permissionToCheck.split(':')
      if (permissions.includes(`${category}:manage`)) {
        return true
      }
    }

    return false
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'roles'
  }
}
