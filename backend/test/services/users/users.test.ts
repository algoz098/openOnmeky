// Testes para o servico de Users
import assert from 'assert'
import { app, cleanDatabase, createTestUser, userParams, externalUserParams } from '../../setup'
import { testUsers, invalidUsers } from '../../fixtures'

describe('users service', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  describe('service registration', () => {
    it('should register the service', () => {
      const service = app.service('users')
      assert.ok(service, 'Servico deve estar registrado')
    })
  })

  describe('create', () => {
    it('should create a user with valid data', async () => {
      const user = await app.service('users').create(testUsers.superAdmin)

      assert.ok(user.id, 'Usuario deve ter um ID')
      assert.strictEqual(user.email, testUsers.superAdmin.email)
      assert.strictEqual(user.name, testUsers.superAdmin.name)
      assert.strictEqual(user.role, testUsers.superAdmin.role)
    })

    it('should hash the password automatically', async () => {
      const user = await app.service('users').create(testUsers.admin)

      // Em chamadas internas, o password hash e retornado (external resolver so aplica em chamadas externas)
      // Verificar que o password foi hasheado (comeca com $2b$)
      assert.ok(user.password && user.password.startsWith('$2b$'), 'Password deve ser hasheado com bcrypt')
      assert.notStrictEqual(user.password, testUsers.admin.password, 'Password nao deve ser texto plano')

      // Verificar que o hash funciona (via autenticacao)
      const auth = await app.service('authentication').create({
        strategy: 'local',
        email: testUsers.admin.email,
        password: testUsers.admin.password
      })
      assert.ok(auth.accessToken, 'Deve conseguir autenticar com a senha original')
    })

    it('should hash password with bcrypt format', async () => {
      const user = await app.service('users').create(testUsers.editor)

      // Verifica formato bcrypt: $2b$<cost>$<salt+hash>
      assert.ok(user.password, 'Password deve existir')
      assert.match(
        user.password as string,
        /^\$2[aby]?\$\d{1,2}\$.{53}$/,
        'Password deve estar em formato bcrypt'
      )
    })

    it('should set default role as viewer', async () => {
      const user = await app.service('users').create({
        email: 'noroledefined@test.com',
        password: 'Test123!'
      })

      assert.strictEqual(user.role, 'viewer', 'Role padrao deve ser viewer')
    })

    it('should reject creation without email', async () => {
      try {
        await app.service('users').create(invalidUsers.noEmail as never)
        assert.fail('Deveria ter lancado erro de validacao')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })

    it('should allow creation without password (password is optional in schema)', async () => {
      // O schema define password como opcional, entao criar sem password e permitido
      // Isso pode ser util para usuarios que usam OAuth ou outros metodos de autenticacao
      const user = await app.service('users').create({
        email: 'nopassword@test.com',
        name: 'User Without Password'
      })

      assert.ok(user.id, 'Usuario deve ser criado')
      assert.strictEqual(user.email, 'nopassword@test.com')
    })

    it('should reject duplicate email', async () => {
      await app.service('users').create(testUsers.superAdmin)

      try {
        await app.service('users').create(invalidUsers.duplicateEmail)
        assert.fail('Deveria ter lancado erro de email duplicado')
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string }
        assert.ok(err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE'))
      }
    })

    it('should accept all valid roles', async () => {
      const roles = ['super-admin', 'admin', 'editor', 'viewer'] as const
      for (const role of roles) {
        const user = await app.service('users').create({
          email: `${role.replace('-', '')}@test.com`,
          password: 'Test123!',
          role
        })
        assert.strictEqual(user.role, role, `Deve aceitar role ${role}`)
      }
    })
  })

  describe('find', () => {
    it('should list all users', async () => {
      const superAdmin = await app.service('users').create(testUsers.superAdmin)
      await app.service('users').create(testUsers.admin)

      const result = await app.service('users').find(userParams(superAdmin))

      assert.ok(Array.isArray(result.data), 'Deve retornar array')
      assert.strictEqual(result.data.length, 2, 'Deve ter 2 usuarios')
    })

    it('should filter users by email', async () => {
      const superAdmin = await app.service('users').create(testUsers.superAdmin)
      await app.service('users').create(testUsers.admin)

      const result = await app.service('users').find({
        query: { email: testUsers.superAdmin.email },
        ...userParams(superAdmin)
      })

      assert.strictEqual(result.data.length, 1)
      assert.strictEqual(result.data[0].email, testUsers.superAdmin.email)
    })

    it('should filter users by role', async () => {
      const superAdmin = await app.service('users').create(testUsers.superAdmin)
      await app.service('users').create(testUsers.admin)
      await app.service('users').create(testUsers.viewer)

      const result = await app.service('users').find({
        query: { role: 'admin' },
        ...userParams(superAdmin)
      })

      assert.strictEqual(result.data.length, 1)
      assert.strictEqual(result.data[0].role, 'admin')
    })
  })

  describe('get', () => {
    it('should get user by id', async () => {
      const created = await app.service('users').create(testUsers.editor)

      const user = await app.service('users').get(created.id)

      assert.strictEqual(user.id, created.id)
      assert.strictEqual(user.email, testUsers.editor.email)
    })

    it('should throw NotFound for non-existent id', async () => {
      try {
        await app.service('users').get(99999)
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  describe('patch', () => {
    it('should update user name', async () => {
      const admin = await app.service('users').create(testUsers.superAdmin)
      const created = await app.service('users').create(testUsers.viewer)

      const updated = await app
        .service('users')
        .patch(created.id, { name: 'Nome Atualizado' }, userParams(admin))

      assert.strictEqual(updated.name, 'Nome Atualizado')
      assert.strictEqual(updated.email, testUsers.viewer.email, 'Email nao deve mudar')
    })

    it('should update user role', async () => {
      const admin = await app.service('users').create(testUsers.superAdmin)
      const created = await app.service('users').create(testUsers.viewer)

      const updated = await app.service('users').patch(created.id, { role: 'editor' }, userParams(admin))

      assert.strictEqual(updated.role, 'editor')
    })

    it('should hash new password when updating', async () => {
      const admin = await app.service('users').create(testUsers.superAdmin)
      const created = await app.service('users').create(testUsers.editor)

      await app.service('users').patch(created.id, { password: 'NovaSenha123!' }, userParams(admin))

      // Autenticar com nova senha
      const auth = await app.service('authentication').create({
        strategy: 'local',
        email: testUsers.editor.email,
        password: 'NovaSenha123!'
      })
      assert.ok(auth.accessToken, 'Deve autenticar com nova senha')

      // Senha antiga nao deve funcionar
      try {
        await app.service('authentication').create({
          strategy: 'local',
          email: testUsers.editor.email,
          password: testUsers.editor.password
        })
        assert.fail('Senha antiga nao deveria funcionar')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotAuthenticated')
      }
    })

    it('should preserve password hash after non-password patch', async () => {
      const admin = await app.service('users').create(testUsers.superAdmin)
      const created = await app.service('users').create(testUsers.admin)
      const originalHash = created.password

      const updated = await app
        .service('users')
        .patch(created.id, { name: 'Admin Atualizado' }, userParams(admin))

      // Em chamadas internas, password hash e retornado
      // Verifica que o hash nao mudou quando nao atualizamos o password
      assert.strictEqual(updated.password, originalHash, 'Hash do password deve permanecer igual')
    })

    it('should throw NotFound for non-existent id', async () => {
      const admin = await app.service('users').create(testUsers.superAdmin)
      try {
        await app.service('users').patch(99999, { name: 'Test' }, userParams(admin))
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  describe('remove', () => {
    it('should delete user by id', async () => {
      const admin = await createTestUser('admin')
      const created = await app.service('users').create(testUsers.viewer)

      const removed = await app.service('users').remove(created.id, userParams(admin))
      assert.strictEqual(removed.id, created.id)

      // Verificar que foi removido
      try {
        await app.service('users').get(created.id)
        assert.fail('Usuario deveria ter sido removido')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })

    it('should throw NotFound for non-existent id', async () => {
      const admin = await createTestUser('admin')
      try {
        await app.service('users').remove(99999, userParams(admin))
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  // ==================== TESTES DE PERMISSOES ====================

  describe('permissions - find', () => {
    it('should allow admin to see all users', async () => {
      const admin = await createTestUser('admin')
      await app.service('users').create(testUsers.viewer)
      await app.service('users').create(testUsers.editor)

      const result = await app.service('users').find(userParams(admin))

      assert.ok(result.data.length >= 3, 'Admin deve ver todos os usuarios')
    })

    it('should allow super-admin to see all users', async () => {
      const superAdmin = await createTestUser('super-admin')
      await app.service('users').create(testUsers.viewer)

      const result = await app.service('users').find(userParams(superAdmin))

      assert.ok(result.data.length >= 2, 'Super-admin deve ver todos os usuarios')
    })

    it('should restrict viewer to see only their own data', async () => {
      const viewer = await createTestUser('viewer')
      await app.service('users').create(testUsers.admin)

      const result = await app.service('users').find(userParams(viewer))

      // Viewer so deve ver a si mesmo devido ao query resolver
      assert.strictEqual(result.data.length, 1, 'Viewer deve ver apenas seu proprio registro')
      assert.strictEqual(result.data[0].id, viewer.id)
    })

    it('should restrict editor to see only their own data', async () => {
      const editor = await createTestUser('editor')
      await app.service('users').create(testUsers.admin)

      const result = await app.service('users').find(userParams(editor))

      assert.strictEqual(result.data.length, 1, 'Editor deve ver apenas seu proprio registro')
      assert.strictEqual(result.data[0].id, editor.id)
    })
  })

  describe('permissions - create', () => {
    it('should allow admin to create users', async () => {
      const admin = await createTestUser('admin')

      const user = await app
        .service('users')
        .create({ email: 'newuser@test.com', password: 'Test123!', role: 'viewer' }, userParams(admin))

      assert.ok(user.id, 'Admin deve criar usuario')
      assert.strictEqual(user.role, 'viewer')
    })

    it('should prevent admin from creating super-admin users', async () => {
      const admin = await createTestUser('admin')

      try {
        await app
          .service('users')
          .create(
            { email: 'newsuperadmin@test.com', password: 'Test123!', role: 'super-admin' },
            userParams(admin)
          )
        assert.fail('Admin nao deveria criar super-admin')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'Forbidden')
      }
    })

    it('should allow super-admin to create super-admin users', async () => {
      const superAdmin = await createTestUser('super-admin')

      const user = await app
        .service('users')
        .create(
          { email: 'newsuperadmin@test.com', password: 'Test123!', role: 'super-admin' },
          userParams(superAdmin)
        )

      assert.ok(user.id, 'Super-admin deve criar super-admin')
      assert.strictEqual(user.role, 'super-admin')
    })

    it('should prevent editor from creating admin users', async () => {
      const editor = await createTestUser('editor')

      try {
        await app
          .service('users')
          .create({ email: 'newadmin@test.com', password: 'Test123!', role: 'admin' }, userParams(editor))
        assert.fail('Editor nao deveria criar admin')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'Forbidden')
      }
    })
  })

  describe('permissions - patch', () => {
    it('should allow admin to update users', async () => {
      const admin = await createTestUser('admin')
      const viewer = await app.service('users').create(testUsers.viewer)

      const updated = await app
        .service('users')
        .patch(viewer.id, { name: 'Nome Atualizado pelo Admin' }, userParams(admin))

      assert.strictEqual(updated.name, 'Nome Atualizado pelo Admin')
    })

    it('should prevent editor from updating other users', async () => {
      const editor = await createTestUser('editor')
      const viewer = await app.service('users').create(testUsers.viewer)

      try {
        // Usa externalUserParams para ativar hook checkPermission (via provider: 'rest')
        await app.service('users').patch(viewer.id, { name: 'Tentativa' }, externalUserParams(editor))
        assert.fail('Editor nao deveria atualizar outros usuarios')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'Forbidden')
      }
    })

    it('should prevent admin from promoting user to super-admin', async () => {
      const admin = await createTestUser('admin')
      const viewer = await app.service('users').create(testUsers.viewer)

      try {
        await app.service('users').patch(viewer.id, { role: 'super-admin' }, userParams(admin))
        assert.fail('Admin nao deveria promover para super-admin')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'Forbidden')
      }
    })
  })

  describe('permissions - remove', () => {
    it('should allow admin to remove users', async () => {
      const admin = await createTestUser('admin')
      const viewer = await app.service('users').create(testUsers.viewer)

      const removed = await app.service('users').remove(viewer.id, userParams(admin))
      assert.strictEqual(removed.id, viewer.id)
    })

    it('should prevent editor from removing users', async () => {
      const editor = await createTestUser('editor')
      const viewer = await app.service('users').create(testUsers.viewer)

      try {
        // Usa externalUserParams para ativar hook checkPermission (via provider: 'rest')
        await app.service('users').remove(viewer.id, externalUserParams(editor))
        assert.fail('Editor nao deveria remover usuarios')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'Forbidden')
      }
    })
  })

  // ==================== TESTES DE PROTECOES DE SEGURANCA ====================
  // Usam externalUserParams() para ativar hooks de seguranca via provider: 'rest'

  describe('security - prevent self delete', () => {
    it('should prevent user from deleting themselves', async () => {
      const admin = await createTestUser('admin')

      try {
        // externalUserParams ativa hooks de seguranca como preventSelfDelete
        await app.service('users').remove(admin.id, externalUserParams(admin))
        assert.fail('Usuario nao deveria conseguir deletar a si mesmo')
      } catch (error: unknown) {
        const err = error as { name: string; message?: string }
        assert.strictEqual(err.name, 'BadRequest')
        assert.ok(err.message?.includes('propria conta'))
      }
    })

    it('should prevent super-admin from deleting themselves', async () => {
      const superAdmin = await createTestUser('super-admin')

      try {
        await app.service('users').remove(superAdmin.id, externalUserParams(superAdmin))
        assert.fail('Super-admin nao deveria conseguir deletar a si mesmo')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'BadRequest')
      }
    })
  })

  describe('security - protect last super-admin', () => {
    it('should prevent deletion of the last super-admin', async () => {
      const superAdmin = await createTestUser('super-admin')
      const admin = await createTestUser('admin')

      try {
        // externalUserParams ativa hooks de seguranca como protectLastSuperAdmin
        await app.service('users').remove(superAdmin.id, externalUserParams(admin))
        assert.fail('Nao deveria deletar o ultimo super-admin')
      } catch (error: unknown) {
        const err = error as { name: string; message?: string }
        assert.strictEqual(err.name, 'Forbidden')
        assert.ok(err.message?.includes('ultimo super-admin'))
      }
    })

    it('should allow deletion of super-admin when there are multiple', async () => {
      const superAdmin1 = await createTestUser('super-admin')
      const superAdmin2 = await app.service('users').create({
        email: 'superadmin2@test.com',
        password: 'Test123!',
        role: 'super-admin'
      })

      // Um super-admin pode deletar outro quando ha multiplos
      const removed = await app.service('users').remove(superAdmin2.id, externalUserParams(superAdmin1))
      assert.strictEqual(removed.id, superAdmin2.id)
    })

    it('should prevent demotion of the last super-admin', async () => {
      const superAdmin = await createTestUser('super-admin')

      try {
        await app.service('users').patch(superAdmin.id, { role: 'admin' }, externalUserParams(superAdmin))
        assert.fail('Nao deveria rebaixar o ultimo super-admin')
      } catch (error: unknown) {
        const err = error as { name: string; message?: string }
        assert.strictEqual(err.name, 'Forbidden')
        assert.ok(err.message?.includes('rebaixar'))
      }
    })

    it('should allow demotion of super-admin when there are multiple', async () => {
      const superAdmin1 = await createTestUser('super-admin')
      const superAdmin2 = await app.service('users').create({
        email: 'superadmin3@test.com',
        password: 'Test123!',
        role: 'super-admin'
      })

      // Um super-admin pode rebaixar outro quando ha multiplos
      const demoted = await app
        .service('users')
        .patch(superAdmin2.id, { role: 'admin' }, userParams(superAdmin1))
      assert.strictEqual(demoted.role, 'admin')
    })

    it('should allow name change of last super-admin', async () => {
      const superAdmin = await createTestUser('super-admin')

      // Mudar nome nao deve afetar a protecao
      const updated = await app
        .service('users')
        .patch(superAdmin.id, { name: 'Novo Nome' }, userParams(superAdmin))
      assert.strictEqual(updated.name, 'Novo Nome')
    })
  })
})
