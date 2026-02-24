// Testes para o servico de Users
import assert from 'assert'
import { app, cleanDatabase, createTestUser } from '../../setup'
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
      await app.service('users').create(testUsers.superAdmin)
      await app.service('users').create(testUsers.admin)

      const result = await app.service('users').find()

      assert.ok(Array.isArray(result.data), 'Deve retornar array')
      assert.strictEqual(result.data.length, 2, 'Deve ter 2 usuarios')
    })

    it('should filter users by email', async () => {
      await app.service('users').create(testUsers.superAdmin)
      await app.service('users').create(testUsers.admin)

      const result = await app.service('users').find({
        query: { email: testUsers.superAdmin.email }
      })

      assert.strictEqual(result.data.length, 1)
      assert.strictEqual(result.data[0].email, testUsers.superAdmin.email)
    })

    it('should filter users by role', async () => {
      await app.service('users').create(testUsers.superAdmin)
      await app.service('users').create(testUsers.admin)
      await app.service('users').create(testUsers.viewer)

      const result = await app.service('users').find({
        query: { role: 'admin' }
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
      const created = await app.service('users').create(testUsers.viewer)

      const updated = await app.service('users').patch(created.id, {
        name: 'Nome Atualizado'
      })

      assert.strictEqual(updated.name, 'Nome Atualizado')
      assert.strictEqual(updated.email, testUsers.viewer.email, 'Email nao deve mudar')
    })

    it('should update user role', async () => {
      const created = await app.service('users').create(testUsers.viewer)

      const updated = await app.service('users').patch(created.id, {
        role: 'editor'
      })

      assert.strictEqual(updated.role, 'editor')
    })

    it('should hash new password when updating', async () => {
      const created = await app.service('users').create(testUsers.editor)

      await app.service('users').patch(created.id, {
        password: 'NovaSenha123!'
      })

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
      const created = await app.service('users').create(testUsers.admin)
      const originalHash = created.password

      const updated = await app.service('users').patch(created.id, {
        name: 'Admin Atualizado'
      })

      // Em chamadas internas, password hash e retornado
      // Verifica que o hash nao mudou quando nao atualizamos o password
      assert.strictEqual(updated.password, originalHash, 'Hash do password deve permanecer igual')
    })

    it('should throw NotFound for non-existent id', async () => {
      try {
        await app.service('users').patch(99999, { name: 'Test' })
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  describe('remove', () => {
    it('should delete user by id', async () => {
      const created = await app.service('users').create(testUsers.viewer)

      const removed = await app.service('users').remove(created.id)
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
      try {
        await app.service('users').remove(99999)
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })
})
