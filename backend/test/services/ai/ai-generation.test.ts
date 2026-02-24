// Testes TDD para o modulo de Geracao de Conteudo com IA
// Baseado em docs/specs.md - Secao 3: Geracao de Conteudo com IA
// Usa mocks para evitar chamadas reais a APIs de IA

import assert from 'assert'
import { app, createTestUser } from '../../setup'
import {
  setupAIMocks,
  cleanupAIMocks,
  setMockResponse
} from '../../helpers/ai-mock.helper'

// Cast para any para permitir testes TDD antes da implementacao do servico
const getAIService = () => (app as unknown as { service: (name: string) => unknown }).service('ai')
const getBrandsService = () => (app as unknown as { service: (name: string) => unknown }).service('brands')

describe('AI content generation service', () => {
  let testBrandId: number
  let testUser: { id: number; email: string; name: string; role: string }

  before(async () => {
    // Configura mocks de AI antes de qualquer teste
    setupAIMocks(app)

    // Cria usuario real para os testes
    testUser = await createTestUser('admin')

    const brand = await (getBrandsService() as { create: Function }).create(
      {
        name: 'TechBrand',
        description: 'Empresa de tecnologia',
        toneOfVoice: 'profissional e amigavel',
        values: ['inovacao', 'transparencia', 'qualidade'],
        preferredWords: ['solucao', 'inovador', 'eficiente'],
        avoidedWords: ['problema', 'dificil', 'complicado'],
        targetAudience: 'Desenvolvedores e gestores de TI, 25-45 anos'
      },
      { user: testUser }
    )
    testBrandId = brand.id
  })

  after(() => {
    // Limpa todos os mocks apos os testes
    cleanupAIMocks()
  })

  describe('service registration', () => {
    it('registered the service', () => {
      const service = getAIService()
      assert.ok(service, 'Registered the service')
    })
  })

  describe('simple generation', () => {
    it('should generate a post from a topic description', async () => {
      // Configura resposta mock para todos os providers (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Trabalhar remotamente aumenta a produtividade quando bem estruturado!'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre produtividade no trabalho remoto',
        platform: 'instagram'
      })

      assert.ok(result.content, 'Should return generated content')
      assert.ok(result.content.length > 0, 'Content should not be empty')
    })

    it('should respect platform character limits', async () => {
      // Configura resposta curta para Twitter (< 280 chars)
      setMockResponse('ollama', {
        content: 'Lancamento incrivel! Confira agora. #novidade'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre lancamento de produto',
        platform: 'twitter'
      })

      assert.ok(result.content.length <= 280, 'Twitter post should be <= 280 chars')
    })

    it('should include hashtags when appropriate', async () => {
      // Configura resposta com hashtags (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'A inteligencia artificial esta transformando o mundo! #IA #tecnologia #futuro #inovacao'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre inteligencia artificial',
        platform: 'instagram',
        includeHashtags: true
      })

      assert.ok(result.content.includes('#'), 'Should include hashtags')
    })
  })

  describe('brand guidelines integration', () => {
    it('should use brand tone of voice in generation', async () => {
      // Configura resposta mock (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Nosso novo recurso foi desenvolvido com inovacao e eficiencia!'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre nosso novo recurso',
        platform: 'linkedin'
      })

      assert.ok(result.content, 'Should generate content')
      assert.ok(result.brandContextUsed, 'Should indicate brand context was used')
    })

    it('should not use avoided words from brand guidelines', async () => {
      // Configura resposta sem palavras evitadas (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Nossa solucao inovadora transforma desafios em oportunidades de crescimento!'
      })

      const brand = await (getBrandsService() as { get: Function }).get(testBrandId, { user: testUser })
      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'crie um post sobre como resolver dificuldades',
        platform: 'instagram'
      })

      const avoidedWords = brand.avoidedWords || []
      for (const word of avoidedWords) {
        assert.ok(
          !result.content.toLowerCase().includes(word.toLowerCase()),
          `Should not contain avoided word: ${word}`
        )
      }
    })

    it('should use custom prompt template from brand', async () => {
      // Configura resposta mock (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Marketing digital e essencial para o sucesso!'
      })

      await (getBrandsService() as { patch: Function }).patch(
        testBrandId,
        {
          prompts: {
            text: 'Voce e um especialista em {tema}. Crie um post {tom_de_voz} para {plataforma}.'
          }
        },
        { user: testUser }
      )

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'generate',
        prompt: 'marketing digital',
        platform: 'twitter'
      })

      assert.ok(result.promptUsed, 'Should return the prompt that was used')
      assert.ok(result.promptUsed.includes('especialista'), 'Should use custom prompt template')
    })
  })

  describe('rewrite generation', () => {
    it('should rewrite existing text in brand tone', async () => {
      const originalText = 'Nosso produto e muito bom e resolve varios problemas complicados.'

      // Configura resposta diferente do original (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Nossa solucao inovadora oferece resultados eficientes para seu negocio!'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'rewrite',
        originalContent: originalText,
        platform: 'linkedin'
      })

      assert.ok(result.content, 'Should return rewritten content')
      assert.notStrictEqual(result.content, originalText, 'Content should be different')
    })
  })

  describe('platform adaptation', () => {
    it('should adapt Instagram post to Twitter format', async () => {
      const instagramPost = `
        Descubra como nossa nova funcionalidade pode transformar sua rotina de trabalho!
        Estamos muito animados em compartilhar essa novidade com voces.
        Clique no link da bio para saber mais. #produtividade #inovacao #trabalho
      `

      // Configura resposta curta para Twitter (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Nova funcionalidade que transforma sua rotina! Confira #produtividade'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'adapt',
        originalContent: instagramPost,
        originalPlatform: 'instagram',
        targetPlatform: 'twitter'
      })

      assert.ok(result.content.length <= 280, 'Should fit Twitter limit')
    })

    it('should adapt Twitter post to LinkedIn format', async () => {
      const twitterPost = 'Nova feature! Confira nosso blog. #tech'

      // Configura resposta mais longa para LinkedIn (fallback usa ollama)
      setMockResponse('ollama', {
        content: 'Temos o prazer de anunciar uma nova funcionalidade que vai revolucionar a forma como voce trabalha. Nossa equipe de engenharia desenvolveu esta solucao pensando em voce. Confira todos os detalhes em nosso blog e descubra como essa inovacao pode impactar positivamente seus resultados.'
      })

      const result = await (getAIService() as { create: Function }).create({
        brandId: testBrandId,
        type: 'adapt',
        originalContent: twitterPost,
        originalPlatform: 'twitter',
        targetPlatform: 'linkedin'
      })

      assert.ok(result.content.length > twitterPost.length, 'LinkedIn post should be longer')
    })
  })
})
