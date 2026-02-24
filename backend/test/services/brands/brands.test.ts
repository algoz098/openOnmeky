// Testes completos para o servico de Brands (Marcas)
// Cobertura: CRUD, JSON serialization, related entities, validacao, seguranca

import assert from 'assert'
import { app, cleanDatabase, createTestUser, createAuthenticatedUser, userParams } from '../../setup'
import { testBrands, invalidBrands } from '../../fixtures'

describe('brands service', () => {
  let testUser: { id: number; email: string; name: string; role: string }

  beforeEach(async () => {
    await cleanDatabase()
    testUser = await createTestUser('admin')
  })

  describe('service registration', () => {
    it('should register the service', () => {
      const service = app.service('brands')
      assert.ok(service, 'Servico deve estar registrado')
    })
  })

  describe('create', () => {
    it('should create a brand with minimal data', async () => {
      const brand = await app
        .service('brands')
        .create(
          { name: testBrands.minimal.name, description: testBrands.minimal.description },
          userParams(testUser)
        )

      assert.ok(brand.id, 'Brand deve ter um ID')
      assert.strictEqual(brand.name, testBrands.minimal.name)
    })

    it('should create a brand with complete data', async () => {
      const brand = await app.service('brands').create(
        {
          name: testBrands.complete.name,
          description: testBrands.complete.description,
          sector: testBrands.complete.sector,
          toneOfVoice: testBrands.complete.toneOfVoice,
          targetAudience: testBrands.complete.targetAudience,
          values: testBrands.complete.values,
          preferredWords: testBrands.complete.preferredWords,
          avoidedWords: testBrands.complete.avoidedWords,
          brandColors: testBrands.complete.brandColors
        },
        userParams(testUser)
      )

      assert.ok(brand.id)
      assert.strictEqual(brand.name, testBrands.complete.name)
      assert.strictEqual(brand.sector, testBrands.complete.sector)
      assert.strictEqual(brand.toneOfVoice, testBrands.complete.toneOfVoice)
    })

    it('should assign userId automatically', async () => {
      const brand = await app
        .service('brands')
        .create({ name: 'Brand Auto User', description: 'Test' }, userParams(testUser))

      assert.strictEqual(brand.userId, testUser.id)
    })

    it('should reject brand without name', async () => {
      try {
        await app.service('brands').create(invalidBrands.noName as never, userParams(testUser))
        assert.fail('Deveria ter lancado erro de validacao')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })

    it('should allow creation with prompts', async () => {
      const brand = await app.service('brands').create(
        {
          name: 'Brand With Prompts',
          description: 'Test',
          prompts: {
            text: 'Custom text prompt template',
            image: 'Custom image prompt template'
          }
        },
        userParams(testUser)
      )

      assert.ok(brand.id, 'Brand deve ser criada com sucesso')
      assert.ok(brand.prompts, 'Brand deve ter prompts')
    })
  })

  describe('get', () => {
    it('should get a brand by id', async () => {
      const created = await app
        .service('brands')
        .create({ name: 'Marca para Get', description: 'Descricao' }, userParams(testUser))

      const brand = await app.service('brands').get(created.id, userParams(testUser))
      assert.strictEqual(brand.id, created.id)
      assert.strictEqual(brand.name, 'Marca para Get')
    })

    it('should throw NotFound for non-existent brand', async () => {
      try {
        await app.service('brands').get(99999, userParams(testUser))
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  describe('patch', () => {
    it('should update brand name', async () => {
      const created = await app
        .service('brands')
        .create({ name: 'Nome Original', description: 'Descricao' }, userParams(testUser))

      const updated = await app
        .service('brands')
        .patch(created.id, { name: 'Nome Atualizado' }, userParams(testUser))

      assert.strictEqual(updated.name, 'Nome Atualizado')
    })

    it('should update brand guidelines arrays', async () => {
      const created = await app
        .service('brands')
        .create({ name: 'Marca Update', description: 'Test' }, userParams(testUser))

      const updated = await app.service('brands').patch(
        created.id,
        {
          values: ['inovacao', 'qualidade'],
          preferredWords: ['solucao', 'resultado'],
          avoidedWords: ['problema', 'erro']
        },
        userParams(testUser)
      )

      assert.deepStrictEqual(updated.values, ['inovacao', 'qualidade'])
      assert.deepStrictEqual(updated.preferredWords, ['solucao', 'resultado'])
      assert.deepStrictEqual(updated.avoidedWords, ['problema', 'erro'])
    })

    it('should update tone of voice', async () => {
      const created = await app
        .service('brands')
        .create({ name: 'Marca Tom', description: 'Test' }, userParams(testUser))

      const updated = await app
        .service('brands')
        .patch(created.id, { toneOfVoice: 'professional' }, userParams(testUser))

      assert.strictEqual(updated.toneOfVoice, 'professional')
    })

    it('should throw NotFound for non-existent brand', async () => {
      try {
        await app.service('brands').patch(99999, { name: 'Test' }, userParams(testUser))
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  describe('remove', () => {
    it('should delete a brand', async () => {
      const created = await app
        .service('brands')
        .create({ name: 'Marca para Delete', description: 'Test' }, userParams(testUser))

      const removed = await app.service('brands').remove(created.id, userParams(testUser))
      assert.strictEqual(removed.id, created.id)

      try {
        await app.service('brands').get(created.id, userParams(testUser))
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })

    it('should throw NotFound for non-existent brand', async () => {
      try {
        await app.service('brands').remove(99999, userParams(testUser))
        assert.fail('Deveria ter lancado NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })
  })

  describe('find', () => {
    it('should list all brands for the user', async () => {
      await app.service('brands').create({ name: 'Brand 1' }, userParams(testUser))
      await app.service('brands').create({ name: 'Brand 2' }, userParams(testUser))

      const result = await app.service('brands').find(userParams(testUser))

      assert.ok(Array.isArray(result.data), 'Deve retornar array')
      assert.ok(result.data.length >= 2, 'Deve ter pelo menos 2 brands')
    })

    it('should filter brands by name', async () => {
      await app.service('brands').create({ name: 'Brand Especifica' }, userParams(testUser))
      await app.service('brands').create({ name: 'Outra Brand' }, userParams(testUser))

      const result = await app.service('brands').find({
        query: { name: 'Brand Especifica' },
        ...userParams(testUser)
      })

      assert.strictEqual(result.data.length, 1)
      assert.strictEqual(result.data[0].name, 'Brand Especifica')
    })
  })

  describe('user isolation', () => {
    it('should only show brands owned by the authenticated user', async () => {
      // Criar segundo usuario
      const userB = await createTestUser('viewer')

      await app.service('brands').create({ name: 'Marca Usuario A' }, userParams(testUser))

      const brandsUserB = await app.service('brands').find({
        query: {},
        ...userParams(userB)
      })

      assert.strictEqual(brandsUserB.data.length, 0, 'User B nao deve ver brands de User A')
    })

    it('should not allow user to access another users brand', async () => {
      const userB = await createTestUser('viewer')

      const brandUserA = await app.service('brands').create({ name: 'Marca Privada A' }, userParams(testUser))

      try {
        await app.service('brands').get(brandUserA.id, userParams(userB))
        assert.fail('Deveria ter lancado NotFound ou Forbidden')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['Forbidden', 'NotFound'].includes(err.name))
      }
    })
  })

  describe('multiple brands per user', () => {
    it('should allow user to create multiple brands', async () => {
      await app.service('brands').create({ name: 'Marca 1' }, userParams(testUser))
      await app.service('brands').create({ name: 'Marca 2' }, userParams(testUser))
      await app.service('brands').create({ name: 'Marca 3' }, userParams(testUser))

      const brands = await app.service('brands').find(userParams(testUser))
      assert.ok(brands.data.length >= 3, 'Usuario deve ter pelo menos 3 brands')
    })
  })

  describe('JSON serialization', () => {
    it('should serialize and deserialize arrays correctly', async () => {
      const brand = await app.service('brands').create(
        {
          name: 'Brand JSON Test',
          values: ['valor1', 'valor2', 'valor3'],
          brandColors: ['#FF0000', '#00FF00', '#0000FF']
        },
        userParams(testUser)
      )

      // Get the brand to verify deserialization
      const retrieved = await app.service('brands').get(brand.id, userParams(testUser))

      assert.ok(Array.isArray(retrieved.values), 'values deve ser array')
      assert.ok(Array.isArray(retrieved.brandColors), 'brandColors deve ser array')
      assert.deepStrictEqual(retrieved.values, ['valor1', 'valor2', 'valor3'])
      assert.deepStrictEqual(retrieved.brandColors, ['#FF0000', '#00FF00', '#0000FF'])
    })

    it('should handle empty arrays', async () => {
      const brand = await app.service('brands').create(
        {
          name: 'Brand Empty Arrays',
          values: [],
          preferredWords: []
        },
        userParams(testUser)
      )

      const retrieved = await app.service('brands').get(brand.id, userParams(testUser))

      assert.ok(
        Array.isArray(retrieved.values) || retrieved.values === null || retrieved.values === undefined
      )
    })
  })

  describe('security - brands access control', () => {
    it('should require authentication for brands operations', async () => {
      try {
        await app.service('brands').find({ provider: 'rest' })
        assert.fail('Deveria ter lancado erro de autenticacao')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotAuthenticated')
      }
    })

    it('should not allow user to patch another users brand', async () => {
      const userB = await createTestUser('viewer')

      const brandUserA = await app.service('brands').create({ name: 'Marca A' }, userParams(testUser))

      try {
        await app.service('brands').patch(brandUserA.id, { name: 'Hack' }, userParams(userB))
        assert.fail('Deveria ter lancado Forbidden ou NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['Forbidden', 'NotFound'].includes(err.name))
      }
    })

    it('should not allow user to delete another users brand', async () => {
      const userB = await createTestUser('viewer')

      const brandUserA = await app.service('brands').create({ name: 'Marca A' }, userParams(testUser))

      try {
        await app.service('brands').remove(brandUserA.id, userParams(userB))
        assert.fail('Deveria ter lancado Forbidden ou NotFound')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['Forbidden', 'NotFound'].includes(err.name))
      }
    })

    it('should work with JWT authentication via provider', async () => {
      const { token } = await createAuthenticatedUser('editor')

      const result = await app.service('brands').find({
        provider: 'rest',
        authentication: { strategy: 'jwt', accessToken: token }
      })

      assert.ok(result.data !== undefined, 'Deve retornar dados')
    })
  })
})
