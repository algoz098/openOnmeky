// Testes TDD para Prompts de Geracao de Marcas
// Baseado em docs/specs.md - Secao "Prompts de Geracao"
// Estes testes devem FALHAR inicialmente ate a implementacao ser concluida

import assert from 'assert'
import { app, createTestUser, userParams } from '../../setup'

// Cast para any para permitir testes TDD antes da implementacao do servico
const getBrandsService = () => (app as any).service('brands')

describe('brand prompts', () => {
  let testBrandId: number
  let testUser: { id: number; email: string; name: string; role: string }

  before(async () => {
    testUser = await createTestUser('admin')
    const brand = await getBrandsService().create(
      {
        name: 'Marca com Prompts',
        description: 'Marca para testar prompts'
      },
      userParams(testUser)
    )
    testBrandId = brand.id
  })

  describe('default prompts', () => {
    it('should have default prompts pre-filled when brand is created', async () => {
      const brand = await getBrandsService().create(
        {
          name: 'Nova Marca',
          description: 'Marca recem criada'
        },
        userParams(testUser)
      )

      assert.ok(brand.prompts, 'Brand should have prompts object')
      assert.ok(brand.prompts.text, 'Brand should have text prompt')
      assert.ok(brand.prompts.image, 'Brand should have image prompt')
      assert.ok(brand.prompts.video, 'Brand should have video prompt')
    })

    it('should have correct default text prompt template', async () => {
      const brand = await getBrandsService().get(testBrandId, userParams(testUser))

      assert.ok(brand.prompts.text.includes('{plataforma}'), 'Text prompt should include platform variable')
      assert.ok(brand.prompts.text.includes('{tema}'), 'Text prompt should include theme variable')
      assert.ok(brand.prompts.text.includes('{tom_de_voz}'), 'Text prompt should include tone variable')
    })

    it('should have correct default image prompt template', async () => {
      const brand = await getBrandsService().get(testBrandId, userParams(testUser))

      assert.ok(brand.prompts.image.includes('{cores}'), 'Image prompt should include colors variable')
      assert.ok(brand.prompts.image.includes('{tema}'), 'Image prompt should include theme variable')
    })

    it('should have correct default video prompt template', async () => {
      const brand = await getBrandsService().get(testBrandId, userParams(testUser))

      assert.ok(brand.prompts.video.includes('{duracao}'), 'Video prompt should include duration variable')
      assert.ok(brand.prompts.video.includes('{plataforma}'), 'Video prompt should include platform variable')
    })
  })

  describe('prompt customization', () => {
    it('should allow user to edit text prompt', async () => {
      const customPrompt = 'Crie um post {tipo} para {plataforma} sobre {tema}. Seja {tom_de_voz}.'

      const updated = await getBrandsService().patch(
        testBrandId,
        { prompts: { text: customPrompt } },
        userParams(testUser)
      )

      assert.strictEqual(updated.prompts.text, customPrompt)
    })

    it('should allow user to edit image prompt', async () => {
      const customPrompt = 'Gere uma imagem {estilo} com cores {cores} sobre {tema}.'

      const updated = await getBrandsService().patch(
        testBrandId,
        { prompts: { image: customPrompt } },
        userParams(testUser)
      )

      assert.strictEqual(updated.prompts.image, customPrompt)
    })

    it('should allow user to edit video prompt', async () => {
      const customPrompt = 'Roteiro de {duracao}s para {plataforma}: {tema}.'

      const updated = await getBrandsService().patch(
        testBrandId,
        { prompts: { video: customPrompt } },
        userParams(testUser)
      )

      assert.strictEqual(updated.prompts.video, customPrompt)
    })

    it('should allow user to reset prompt to default', async () => {
      await getBrandsService().patch(
        testBrandId,
        { prompts: { text: 'Prompt customizado' } },
        userParams(testUser)
      )

      const reset = await getBrandsService().patch(
        testBrandId,
        { resetPrompts: ['text'] },
        userParams(testUser)
      )

      assert.ok(reset.prompts.text.includes('{plataforma}'), 'Should be reset to default template')
    })
  })

  describe('variable substitution', () => {
    it('should correctly substitute variables in prompt preview', async () => {
      await getBrandsService().patch(
        testBrandId,
        {
          toneOfVoice: 'amigavel',
          colors: ['#FF5733', '#33FF57'],
          name: 'MinhaMarca'
        },
        userParams(testUser)
      )

      const preview = await getBrandsService().getPromptPreview(testBrandId, {
        type: 'text',
        tema: 'produtividade',
        plataforma: 'Instagram'
      })

      assert.ok(!preview.includes('{tema}'), 'Theme variable should be replaced')
      assert.ok(!preview.includes('{plataforma}'), 'Platform variable should be replaced')
      assert.ok(preview.includes('produtividade'), 'Should contain theme value')
      assert.ok(preview.includes('Instagram'), 'Should contain platform value')
    })

    it('should substitute all available variables', async () => {
      const preview = await getBrandsService().getPromptPreview(testBrandId, {
        type: 'text',
        tema: 'teste',
        plataforma: 'Twitter',
        limite: 280
      })

      for (const variable of ['{tema}', '{plataforma}', '{limite}']) {
        assert.ok(!preview.includes(variable), `Variable ${variable} should be replaced`)
      }
    })
  })
})
