// Testes TDD para o sistema de Roles
// Sistema selfhost com roles: super-admin, admin, editor, viewer
// Estes testes devem FALHAR inicialmente ate a implementacao ser concluida

import assert from 'assert'
import { app, createAuthenticatedUser, cleanDatabaseFull } from '../../setup'

// Cast para any para permitir testes TDD antes da implementacao
const getRolesService = () => (app as any).service('roles')
const getUsersService = () => (app as any).service('users')

// Definicao de roles esperadas
const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
}

describe('roles service', () => {
  describe('service registration', () => {
    it('registered the service', () => {
      const service = getRolesService()
      assert.ok(service, 'Registered the service')
    })
  })

  describe('role definitions', () => {
    it('should have all predefined roles available', async () => {
      const roles = await getRolesService().find()

      assert.ok(roles.data.find((r: { name: string }) => r.name === ROLES.SUPER_ADMIN))
      assert.ok(roles.data.find((r: { name: string }) => r.name === ROLES.ADMIN))
      assert.ok(roles.data.find((r: { name: string }) => r.name === ROLES.EDITOR))
      assert.ok(roles.data.find((r: { name: string }) => r.name === ROLES.VIEWER))
    })

    it('should have correct permissions for super-admin', async () => {
      const roles = await getRolesService().find({ query: { name: ROLES.SUPER_ADMIN } })
      const superAdmin = roles.data[0]

      assert.ok(superAdmin.permissions.includes('*'), 'Super-admin should have all permissions')
    })

    it('should have correct permissions for admin', async () => {
      const roles = await getRolesService().find({ query: { name: ROLES.ADMIN } })
      const admin = roles.data[0]

      assert.ok(admin.permissions.includes('users:manage'))
      assert.ok(admin.permissions.includes('brands:manage'))
      assert.ok(admin.permissions.includes('posts:manage'))
      assert.ok(!admin.permissions.includes('system:manage'))
    })

    it('should have correct permissions for editor', async () => {
      const roles = await getRolesService().find({ query: { name: ROLES.EDITOR } })
      const editor = roles.data[0]

      assert.ok(editor.permissions.includes('brands:read'))
      assert.ok(editor.permissions.includes('brands:write'))
      assert.ok(editor.permissions.includes('posts:read'))
      assert.ok(editor.permissions.includes('posts:write'))
      assert.ok(!editor.permissions.includes('users:manage'))
    })

    it('should have correct permissions for viewer', async () => {
      const roles = await getRolesService().find({ query: { name: ROLES.VIEWER } })
      const viewer = roles.data[0]

      assert.ok(viewer.permissions.includes('brands:read'))
      assert.ok(viewer.permissions.includes('posts:read'))
      assert.ok(!viewer.permissions.includes('brands:write'))
      assert.ok(!viewer.permissions.includes('posts:write'))
    })
  })

  describe('user role assignment', () => {
    it('should allow assigning a role to a user', async () => {
      const user = await getUsersService().create({
        email: 'editor@test.com',
        password: 'password123'
      })

      const updatedUser = await getUsersService().patch(user.id, {
        role: ROLES.EDITOR
      })

      assert.strictEqual(updatedUser.role, ROLES.EDITOR)
    })

    it('should default to viewer role for new users', async () => {
      const user = await getUsersService().create({
        email: 'newuser@test.com',
        password: 'password123'
      })

      assert.strictEqual(user.role, ROLES.VIEWER)
    })

    it('should not allow invalid role assignment', async () => {
      const user = await getUsersService().create({
        email: 'invalidrole@test.com',
        password: 'password123'
      })

      try {
        await getUsersService().patch(user.id, {
          role: 'invalid-role'
        })
        assert.fail('Should have thrown validation error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })
  })

  describe('permission checks', () => {
    it('should allow super-admin to perform any action', async () => {
      const canManageSystem = await getRolesService().checkPermission(ROLES.SUPER_ADMIN, 'system:manage')
      const canManageUsers = await getRolesService().checkPermission(ROLES.SUPER_ADMIN, 'users:manage')
      const canDeleteBrands = await getRolesService().checkPermission(ROLES.SUPER_ADMIN, 'brands:delete')

      assert.strictEqual(canManageSystem, true)
      assert.strictEqual(canManageUsers, true)
      assert.strictEqual(canDeleteBrands, true)
    })

    it('should restrict admin from system management', async () => {
      const canManageSystem = await getRolesService().checkPermission(ROLES.ADMIN, 'system:manage')
      const canManageUsers = await getRolesService().checkPermission(ROLES.ADMIN, 'users:manage')

      assert.strictEqual(canManageSystem, false)
      assert.strictEqual(canManageUsers, true)
    })

    it('should restrict editor to content operations', async () => {
      const canWritePosts = await getRolesService().checkPermission(ROLES.EDITOR, 'posts:write')
      const canManageUsers = await getRolesService().checkPermission(ROLES.EDITOR, 'users:manage')

      assert.strictEqual(canWritePosts, true)
      assert.strictEqual(canManageUsers, false)
    })

    it('should restrict viewer to read-only operations', async () => {
      const canReadPosts = await getRolesService().checkPermission(ROLES.VIEWER, 'posts:read')
      const canWritePosts = await getRolesService().checkPermission(ROLES.VIEWER, 'posts:write')

      assert.strictEqual(canReadPosts, true)
      assert.strictEqual(canWritePosts, false)
    })
  })

  describe('security - roles access control', () => {
    beforeEach(async () => {
      // Usa cleanDatabaseFull para limpar tudo e re-executar seed
      await cleanDatabaseFull()
    })

    it('should require authentication for roles find', async () => {
      try {
        await getRolesService().find({ provider: 'rest' })
        assert.fail('Deveria ter lancado erro de autenticacao')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotAuthenticated')
      }
    })

    it('should allow authenticated users to read roles', async () => {
      const { token } = await createAuthenticatedUser('viewer')

      const result = await getRolesService().find({
        provider: 'rest',
        authentication: { strategy: 'jwt', accessToken: token }
      })

      assert.ok(Array.isArray(result.data), 'Deve retornar array de roles')
    })

    it('should reject role creation for non-super-admin', async () => {
      const { token } = await createAuthenticatedUser('admin')

      try {
        await getRolesService().create(
          { name: 'custom-role', permissions: ['posts:read'] },
          {
            provider: 'rest',
            authentication: { strategy: 'jwt', accessToken: token }
          }
        )
        assert.fail('Deveria ter lancado erro de permissao')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'Forbidden')
      }
    })

    it('should allow super-admin to create roles', async () => {
      const { token } = await createAuthenticatedUser('super-admin')

      const result = await getRolesService().create(
        { name: 'custom-role', permissions: ['posts:read'], description: 'Test role' },
        {
          provider: 'rest',
          authentication: { strategy: 'jwt', accessToken: token }
        }
      )

      assert.ok(result.id, 'Super-admin deve conseguir criar roles')
    })
  })
})
