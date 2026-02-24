// Testes TDD para o processo de Onboarding
// Sistema selfhost que requer onboarding na primeira execucao
// Estes testes devem FALHAR inicialmente ate a implementacao ser concluida

import assert from 'assert'
import { app } from '../../../src/app'

// Cast para any para permitir testes TDD antes da implementacao
const getOnboardingService = () => (app as any).service('onboarding')
const getUsersService = () => (app as any).service('users')
const getSystemService = () => (app as any).service('system')

// Funcao helper para limpar usuarios e resetar estado do sistema
const cleanUsersAndResetSystem = async () => {
  const users = await getUsersService().find()
  for (const user of users.data) {
    await getUsersService().remove(user.id)
  }
}

describe('onboarding service', () => {
  describe('service registration', () => {
    it('registered the service', () => {
      const service = getOnboardingService()
      assert.ok(service, 'Registered the service')
    })
  })

  describe('first-time setup detection', () => {
    beforeEach(async () => {
      await cleanUsersAndResetSystem()
    })

    it('should detect when system needs onboarding (no users exist)', async () => {
      const status = await getOnboardingService().find()

      assert.ok(status.needsOnboarding !== undefined, 'Should have needsOnboarding flag')
    })

    it('should return needsOnboarding=true when no users exist', async () => {
      const status = await getOnboardingService().find()
      assert.strictEqual(status.needsOnboarding, true)
    })

    it('should return needsOnboarding=false after onboarding is complete', async () => {
      await getOnboardingService().create({
        email: 'superadmin@test.com',
        password: 'securepassword123',
        name: 'Super Admin'
      })

      const status = await getOnboardingService().find()
      assert.strictEqual(status.needsOnboarding, false)
    })
  })

  describe('super-admin creation during onboarding', () => {
    beforeEach(async () => {
      await cleanUsersAndResetSystem()
    })

    it('should create super-admin user during onboarding', async () => {
      const result = await getOnboardingService().create({
        email: 'admin@empresa.com',
        password: 'senhaforte123',
        name: 'Administrador Principal'
      })

      assert.ok(result.user, 'Should return created user')
      assert.strictEqual(result.user.email, 'admin@empresa.com')
      assert.strictEqual(result.user.role, 'super-admin')
    })

    it('should hash the super-admin password', async () => {
      const result = await getOnboardingService().create({
        email: 'admin2@empresa.com',
        password: 'senhaforte123',
        name: 'Admin'
      })

      const user = await getUsersService().get(result.user.id)
      assert.notStrictEqual(user.password, 'senhaforte123', 'Password should be hashed')
    })

    it('should require email for onboarding', async () => {
      try {
        await getOnboardingService().create({
          password: 'senhaforte123',
          name: 'Sem Email'
        })
        assert.fail('Should have thrown validation error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })

    it('should require password for onboarding', async () => {
      try {
        await getOnboardingService().create({
          email: 'semsenha@test.com',
          name: 'Sem Senha'
        })
        assert.fail('Should have thrown validation error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })
  })

  describe('onboarding restrictions', () => {
    beforeEach(async () => {
      await cleanUsersAndResetSystem()
    })

    it('should not allow onboarding if already completed', async () => {
      // Primeiro onboarding
      await getOnboardingService().create({
        email: 'primeiro@test.com',
        password: 'senha123',
        name: 'Primeiro Admin'
      })

      // Tentativa de segundo onboarding
      try {
        await getOnboardingService().create({
          email: 'segundo@test.com',
          password: 'senha123',
          name: 'Segundo Admin'
        })
        assert.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as { name: string; message: string }
        assert.ok(
          err.message.includes('onboarding') || err.name === 'Forbidden',
          'Should indicate onboarding already completed'
        )
      }
    })

    it('should mark system as initialized after onboarding', async () => {
      await getOnboardingService().create({
        email: 'init@test.com',
        password: 'senha123',
        name: 'Init Admin'
      })

      const systemStatus = await getSystemService().find()
      assert.strictEqual(systemStatus.initialized, true)
    })
  })

  describe('seed data during onboarding', () => {
    beforeEach(async () => {
      await cleanUsersAndResetSystem()
    })

    it('should populate default platforms during onboarding', async () => {
      await getOnboardingService().create({
        email: 'seedtest@test.com',
        password: 'senha123',
        name: 'Seed Test'
      })

      const platforms = await (app as any).service('platforms').find()
      assert.ok(platforms.data.length >= 4, 'Should have default platforms')
    })

    it('should populate default roles during onboarding', async () => {
      await getOnboardingService().create({
        email: 'roletest@test.com',
        password: 'senha123',
        name: 'Role Test'
      })

      const roles = await (app as any).service('roles').find()
      assert.ok(roles.data.length >= 4, 'Should have 4 default roles')
    })
  })
})
