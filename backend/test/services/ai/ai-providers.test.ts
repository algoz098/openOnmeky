// Testes TDD para Providers de IA e tratamento de erros
// Baseado em docs/specs.md - Secao "Providers de IA"
// Usa mocks para evitar chamadas reais a APIs de IA

import assert from 'assert'
import { app, createTestUser } from '../../setup'
import {
  setupAIMocks,
  cleanupAIMocks,
  setMockResponse,
  getMockProvider
} from '../../helpers/ai-mock.helper'

// Cast para any para permitir testes TDD antes da implementacao do servico
const getAIService = () => (app as unknown as { service: (name: string) => unknown }).service('ai')
const getBrandsService = () => (app as unknown as { service: (name: string) => unknown }).service('brands')
const getProvidersService = () => (app as unknown as { service: (name: string) => unknown }).service('ai-providers')

describe('AI providers', () => {
  let testBrandId: number
  let testUser: { id: number; email: string; name: string; role: string }

  before(async () => {
    // Configura mocks de AI antes de qualquer teste
    setupAIMocks(app)

    // Cria usuario real para os testes
    testUser = await createTestUser('admin')

    const brand = await (getBrandsService() as { create: Function }).create(
      {
        name: 'Marca para IA',
        description: 'Testar providers de IA',
        toneOfVoice: 'casual'
      },
      { user: testUser }
    )
    testBrandId = brand.id
  })

  after(() => {
    // Limpa todos os mocks apos os testes
    cleanupAIMocks()
  })

  describe('OpenAI provider', () => {
    it('should generate content using OpenAI GPT-4o', async () => {
      // Configura resposta mock para OpenAI
      setMockResponse('openai', {
        content: 'A sustentabilidade e essencial para o futuro do nosso planeta!',
        provider: 'openai',
        model: 'gpt-4o'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre sustentabilidade',
        platform: 'instagram',
        provider: 'openai'
      })

      assert.ok(result.content, 'Should return generated content')
      assert.strictEqual(result.provider, 'openai')

      // Verifica que o mock provider foi chamado
      const mockProvider = getMockProvider('openai')
      assert.ok(mockProvider, 'Mock provider should exist')
      assert.ok(mockProvider.generateTextCalls.length > 0, 'Provider should have been called')
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Configura mock para simular erro
      const mockProvider = getMockProvider('openai')
      if (mockProvider) {
        mockProvider.setAvailable(false)
      }

      try {
        await (getAIService() as { create: Function }).create({
          brandId: testBrandId,
          type: 'generate',
          prompt: 'teste',
          platform: 'instagram',
          provider: 'openai',
          _forceError: true
        })
        assert.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as { message: string }
        assert.ok(err.message, 'Should have error message')
        assert.ok(!err.message.includes('API key'), 'Should not expose sensitive info in error')
      } finally {
        // Restaura disponibilidade do mock
        if (mockProvider) {
          mockProvider.setAvailable(true)
        }
      }
    })

    it('should return user-friendly error when OpenAI is unavailable', async () => {
      // Configura mock para simular indisponibilidade
      const mockProvider = getMockProvider('openai')
      if (mockProvider) {
        mockProvider.setAvailable(false)
      }

      try {
        await (getAIService() as { create: Function }).create({
          brandId: testBrandId,
          type: 'generate',
          prompt: 'teste',
          platform: 'instagram',
          provider: 'openai',
          _simulateUnavailable: true
        })
        assert.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as { message: string }
        assert.ok(
          err.message.includes('indisponivel') ||
            err.message.includes('unavailable') ||
            err.message.includes('tente novamente'),
          'Should show user-friendly error message'
        )
      } finally {
        // Restaura disponibilidade do mock
        if (mockProvider) {
          mockProvider.setAvailable(true)
        }
      }
    })
  })

  describe('Ollama provider (local)', () => {
    it('should generate content using Ollama locally', async () => {
      // Configura resposta mock para Ollama
      setMockResponse('ollama', {
        content: 'A tecnologia avanca rapidamente transformando nosso dia a dia!',
        provider: 'ollama',
        model: 'llama3.2'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre tecnologia',
        platform: 'twitter',
        provider: 'ollama'
      })

      assert.ok(result.content, 'Should return generated content')
      assert.strictEqual(result.provider, 'ollama')

      // Verifica que o mock provider foi chamado
      const mockProvider = getMockProvider('ollama')
      assert.ok(mockProvider, 'Mock provider should exist')
      assert.ok(mockProvider.generateTextCalls.length > 0, 'Provider should have been called')
    })

    it('should handle Ollama not running gracefully', async () => {
      // Configura mock para simular Ollama indisponivel
      const mockProvider = getMockProvider('ollama')
      if (mockProvider) {
        mockProvider.setAvailable(false)
      }

      try {
        await (getAIService() as { create: Function }).create({
          brandId: testBrandId,
          type: 'generate',
          prompt: 'teste',
          platform: 'instagram',
          provider: 'ollama',
          _simulateNotRunning: true
        })
        assert.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as { message: string }
        assert.ok(
          err.message.includes('Ollama') || err.message.includes('local'),
          'Should indicate Ollama is not running'
        )
      } finally {
        // Restaura disponibilidade do mock
        if (mockProvider) {
          mockProvider.setAvailable(true)
        }
      }
    })
  })

  describe('provider abstraction', () => {
    it('should use default provider when not specified', async () => {
      // Configura resposta mock (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Inovacao e o motor do progresso!',
        provider: 'ollama'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre inovacao',
        platform: 'linkedin'
      })

      assert.ok(result.provider, 'Should return which provider was used')
    })

    it('should list available providers', async () => {
      // O servico ai-providers.find() retorna array diretamente, nao { data: [...] }
      const providers = await (getProvidersService() as { find: Function }).find()

      assert.ok(Array.isArray(providers), 'Should return array of providers')
      assert.ok(
        providers.some((p: { name: string }) => p.name === 'openai'),
        'OpenAI should be available'
      )
    })

    it('should allow switching providers without code changes', async () => {
      // Configura respostas especificas para cada provider
      setMockResponse('openai', {
        content: 'Post de teste OpenAI',
        provider: 'openai'
      })
      setMockResponse('ollama', {
        content: 'Post de teste Ollama',
        provider: 'ollama'
      })

      const resultOpenAI = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'post de teste',
        platform: 'twitter',
        provider: 'openai'
      })

      const resultOllama = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'post de teste',
        platform: 'twitter',
        provider: 'ollama'
      })

      assert.strictEqual(resultOpenAI.provider, 'openai')
      assert.strictEqual(resultOllama.provider, 'ollama')
    })
  })

  describe('hashtag suggestions', () => {
    it('should suggest relevant hashtags for a post', async () => {
      // Configura resposta mock com hashtags separadas por linha
      // (o AIService parseia linhas que comecam com #)
      setMockResponse('ollama', {
        content: '#desenvolvimento\n#software\n#codigo\n#boaspraticas\n#programacao'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'suggest-hashtags',
        content: 'Post sobre desenvolvimento de software e boas praticas de codigo'
      })

      assert.ok(Array.isArray(result.hashtags), 'Should return array of hashtags')
      assert.ok(result.hashtags.length > 0, 'Should suggest at least one hashtag')
      result.hashtags.forEach((tag: string) => {
        assert.ok(tag.startsWith('#'), 'Each hashtag should start with #')
      })
    })
  })

  describe('error handling', () => {
    it('should require brandId for generation', async () => {
      try {
        await (getAIService() as { create: Function }).create({
          type: 'generate',
          prompt: 'teste sem marca',
          platform: 'instagram'
        })
        assert.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })

    it('should handle invalid provider gracefully', async () => {
      try {
        await (getAIService() as { create: Function }).create({
          brandId: testBrandId,
          type: 'generate',
          prompt: 'teste',
          platform: 'instagram',
          provider: 'invalid_provider'
        })
        assert.fail('Should have thrown error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'NotFound'].includes(err.name))
      }
    })
  })
})
