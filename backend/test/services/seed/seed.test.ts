// Testes TDD para Seed/Populacao de dados padrao
// Dados pre-populados necessarios para o sistema funcionar
// Estes testes devem FALHAR inicialmente ate a implementacao ser concluida

import assert from 'assert'
import { app, createAuthenticatedUser, cleanDatabaseFull, createTestUser, userParams } from '../../setup'

// Cast para any para permitir testes TDD antes da implementacao
const getSeedService = () => (app as any).service('seed')
const getPlatformsService = () => (app as any).service('platforms')
const getRolesService = () => (app as any).service('roles')
const getPromptsService = () => (app as any).service('prompt-templates')

// Limites de caracteres esperados por plataforma
const EXPECTED_PLATFORMS = [
  { name: 'twitter', charLimit: 280, displayName: 'Twitter/X' },
  { name: 'instagram', charLimit: 2200, displayName: 'Instagram' },
  { name: 'linkedin', charLimit: 3000, displayName: 'LinkedIn' },
  { name: 'threads', charLimit: 500, displayName: 'Threads' },
  { name: 'facebook', charLimit: 63206, displayName: 'Facebook' },
  { name: 'tiktok', charLimit: 2200, displayName: 'TikTok' }
]

describe('seed service', () => {
  let testUser: { id: number; email: string; name: string; role: string }

  before(async () => {
    // Criar usuario para consultas autenticadas
    testUser = await createTestUser('admin')
  })

  describe('service registration', () => {
    it('registered the service', () => {
      const service = getSeedService()
      assert.ok(service, 'Registered the service')
    })
  })

  describe('platform seed data', () => {
    it('should have all default platforms populated', async () => {
      const platforms = await getPlatformsService().find(userParams(testUser))

      for (const expected of EXPECTED_PLATFORMS) {
        const found = platforms.data.find((p: { name: string }) => p.name === expected.name)
        assert.ok(found, `Platform ${expected.name} should exist`)
      }
    })

    it('should have correct character limits for each platform', async () => {
      const platforms = await getPlatformsService().find(userParams(testUser))

      for (const expected of EXPECTED_PLATFORMS) {
        const found = platforms.data.find((p: { name: string }) => p.name === expected.name)
        assert.strictEqual(
          found.charLimit,
          expected.charLimit,
          `${expected.name} should have ${expected.charLimit} char limit`
        )
      }
    })

    it('should have display names for platforms', async () => {
      const platforms = await getPlatformsService().find(userParams(testUser))

      for (const expected of EXPECTED_PLATFORMS) {
        const found = platforms.data.find((p: { name: string }) => p.name === expected.name)
        assert.strictEqual(found.displayName, expected.displayName)
      }
    })
  })

  describe('role seed data', () => {
    it('should have all default roles populated', async () => {
      const roles = await getRolesService().find(userParams(testUser))

      const expectedRoles = ['super-admin', 'admin', 'editor', 'viewer']
      for (const roleName of expectedRoles) {
        const found = roles.data.find((r: { name: string }) => r.name === roleName)
        assert.ok(found, `Role ${roleName} should exist`)
      }
    })

    it('should have descriptions for each role', async () => {
      const roles = await getRolesService().find(userParams(testUser))

      for (const role of roles.data) {
        assert.ok(role.description, `Role ${role.name} should have a description`)
      }
    })
  })

  describe('prompt template seed data', () => {
    it('should have default text generation prompt', async () => {
      const prompts = await getPromptsService().find({ query: { type: 'text' }, ...userParams(testUser) })

      assert.ok(prompts.data.length > 0, 'Should have text prompt template')
      const textPrompt = prompts.data[0]
      assert.ok(textPrompt.template, 'Should have template content')
    })

    it('should have default image caption prompt', async () => {
      const prompts = await getPromptsService().find({ query: { type: 'image' }, ...userParams(testUser) })

      assert.ok(prompts.data.length > 0, 'Should have image prompt template')
    })

    it('should have default video script prompt', async () => {
      const prompts = await getPromptsService().find({ query: { type: 'video' }, ...userParams(testUser) })

      assert.ok(prompts.data.length > 0, 'Should have video prompt template')
    })

    it('should include placeholders in prompt templates', async () => {
      const prompts = await getPromptsService().find({ query: { type: 'text' }, ...userParams(testUser) })
      const textPrompt = prompts.data[0]

      assert.ok(
        textPrompt.template.includes('{') && textPrompt.template.includes('}'),
        'Template should have placeholders'
      )
    })
  })

  describe('seed idempotency', () => {
    it('should not duplicate data when seed runs multiple times', async () => {
      const platformsBefore = await getPlatformsService().find(userParams(testUser))
      const countBefore = platformsBefore.total || platformsBefore.data.length

      // Executar seed novamente (chamada interna sem provider)
      await getSeedService().create({ force: false })

      const platformsAfter = await getPlatformsService().find(userParams(testUser))
      const countAfter = platformsAfter.total || platformsAfter.data.length

      assert.strictEqual(countAfter, countBefore, 'Should not create duplicate platforms')
    })

    it('should allow force re-seed when specified', async () => {
      // Chamada interna sem provider
      const result = await getSeedService().create({ force: true })

      assert.ok(result.seeded, 'Should indicate seed was executed')
    })
  })

  describe('seed status', () => {
    it('should return seed status', async () => {
      const status = await getSeedService().find()

      assert.ok(status.platforms !== undefined, 'Should have platforms status')
      assert.ok(status.roles !== undefined, 'Should have roles status')
      assert.ok(status.prompts !== undefined, 'Should have prompts status')
    })

    it('should indicate if seed has been executed', async () => {
      const status = await getSeedService().find()

      assert.ok(status.seeded !== undefined, 'Should have seeded flag')
    })
  })

  describe('security - seed access control', () => {
    beforeEach(async () => {
      // Usa cleanDatabaseFull para limpar tudo e re-executar seed
      await cleanDatabaseFull()
    })

    it('should reject seed without authentication', async () => {
      try {
        await getSeedService().create({ force: false }, { provider: 'rest' })
        assert.fail('Deveria ter lancado erro de autenticacao')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotAuthenticated')
      }
    })

    it('should reject seed for non-super-admin users', async () => {
      const { token } = await createAuthenticatedUser('admin')

      try {
        await getSeedService().create(
          { force: false },
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

    it('should allow seed for super-admin users', async () => {
      const { token } = await createAuthenticatedUser('super-admin')

      const result = await getSeedService().create(
        { force: true },
        {
          provider: 'rest',
          authentication: { strategy: 'jwt', accessToken: token }
        }
      )

      assert.ok(result.seeded, 'Super-admin deve conseguir executar seed')
    })
  })
})
