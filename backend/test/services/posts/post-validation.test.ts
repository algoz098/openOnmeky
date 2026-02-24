// Testes TDD para validacao de Posts (limites e ciclo de vida)
// Baseado em docs/specs.md - Secao "Plataformas e seus limites" e "Ciclo de vida"
// Estes testes devem FALHAR inicialmente ate a implementacao ser concluida

import assert from 'assert'
import { app, createTestUser, userParams } from '../../setup'

// Cast para any para permitir testes TDD antes da implementacao do servico
const getPostsService = () => (app as any).service('posts')
const getBrandsService = () => (app as any).service('brands')
const getPlatformsService = () => (app as any).service('platforms')

// Limites de caracteres por plataforma conforme specs
const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  linkedin: 3000,
  threads: 500
}

describe('post validation', () => {
  let testBrandId: number
  let testUser: { id: number; email: string; name: string; role: string }

  before(async () => {
    testUser = await createTestUser('admin')
    const brand = await getBrandsService().create(
      {
        name: 'Marca para Validacao',
        description: 'Testar validacoes de posts'
      },
      userParams(testUser)
    )
    testBrandId = brand.id
  })

  describe('character limits per platform', () => {
    it('should return platform character limit info', async () => {
      const platforms = await getPlatformsService().find()

      assert.ok(platforms.data.find((p: any) => p.name === 'twitter' && p.charLimit === 280))
      assert.ok(platforms.data.find((p: any) => p.name === 'instagram' && p.charLimit === 2200))
      assert.ok(platforms.data.find((p: any) => p.name === 'linkedin' && p.charLimit === 3000))
      assert.ok(platforms.data.find((p: any) => p.name === 'threads' && p.charLimit === 500))
    })

    it('should warn when content exceeds Twitter limit', async () => {
      const longContent = 'a'.repeat(PLATFORM_LIMITS.twitter + 50)

      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: longContent,
          platform: 'twitter'
        },
        userParams(testUser)
      )

      assert.ok(post.warnings, 'Post should have warnings')
      assert.ok(
        post.warnings.some((w: string) => w.includes('limite') || w.includes('caracteres')),
        'Should warn about character limit'
      )
    })

    it('should warn when content exceeds Instagram limit', async () => {
      const longContent = 'a'.repeat(PLATFORM_LIMITS.instagram + 100)

      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: longContent,
          platform: 'instagram'
        },
        userParams(testUser)
      )

      assert.ok(post.warnings, 'Post should have warnings')
    })

    it('should warn when content exceeds LinkedIn limit', async () => {
      const longContent = 'a'.repeat(PLATFORM_LIMITS.linkedin + 100)

      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: longContent,
          platform: 'linkedin'
        },
        userParams(testUser)
      )

      assert.ok(post.warnings, 'Post should have warnings')
    })

    it('should warn when content exceeds Threads limit', async () => {
      const longContent = 'a'.repeat(PLATFORM_LIMITS.threads + 50)

      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: longContent,
          platform: 'threads'
        },
        userParams(testUser)
      )

      assert.ok(post.warnings, 'Post should have warnings')
    })

    it('should not warn when content is within limit', async () => {
      const shortContent = 'Post curto e valido'

      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: shortContent,
          platform: 'twitter'
        },
        userParams(testUser)
      )

      assert.ok(!post.warnings || post.warnings.length === 0, 'Should not have character limit warnings')
    })

    it('should show character count in response', async () => {
      const content = 'Meu post de teste com algumas palavras'

      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: content,
          platform: 'instagram'
        },
        userParams(testUser)
      )

      assert.strictEqual(post.charCount, content.length)
      assert.strictEqual(post.charLimit, PLATFORM_LIMITS.instagram)
    })
  })

  describe('post lifecycle', () => {
    it('should create post with draft status by default', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Novo post',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      assert.strictEqual(post.status, 'draft')
    })

    it('should allow changing status to approved', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post para aprovar',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      const approved = await getPostsService().patch(post.id, { status: 'approved' }, userParams(testUser))
      assert.strictEqual(approved.status, 'approved')
    })

    it('should allow changing status to published', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post para publicar',
          platform: 'twitter'
        },
        userParams(testUser)
      )

      const published = await getPostsService().patch(post.id, { status: 'published' }, userParams(testUser))
      assert.strictEqual(published.status, 'published')
    })

    it('should record publishedAt timestamp when marked as published', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post com timestamp',
          platform: 'linkedin'
        },
        userParams(testUser)
      )

      const published = await getPostsService().patch(post.id, { status: 'published' }, userParams(testUser))
      assert.ok(published.publishedAt, 'Should have publishedAt timestamp')
    })

    it('should allow transition from draft to approved', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post draft para aprovacao',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      assert.strictEqual(post.status, 'draft')
      const approved = await getPostsService().patch(post.id, { status: 'approved' }, userParams(testUser))
      assert.strictEqual(approved.status, 'approved')
    })

    it('should allow transition from approved to published', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post aprovado para publicacao',
          platform: 'instagram',
          status: 'approved'
        },
        userParams(testUser)
      )

      const published = await getPostsService().patch(post.id, { status: 'published' }, userParams(testUser))
      assert.strictEqual(published.status, 'published')
      assert.ok(published.publishedAt, 'Should have publishedAt timestamp')
    })

    it('should allow transition from scheduled to published', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post agendado para publicacao',
          platform: 'instagram',
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 3600000).toISOString()
        },
        userParams(testUser)
      )

      const published = await getPostsService().patch(post.id, { status: 'published' }, userParams(testUser))
      assert.strictEqual(published.status, 'published')
      assert.ok(published.publishedAt, 'Should have publishedAt timestamp')
    })

    it('should allow direct transition from draft to published', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post direto para publicacao',
          platform: 'twitter'
        },
        userParams(testUser)
      )

      assert.strictEqual(post.status, 'draft')
      const published = await getPostsService().patch(post.id, { status: 'published' }, userParams(testUser))
      assert.strictEqual(published.status, 'published')
      assert.ok(published.publishedAt, 'Should have publishedAt timestamp')
    })
  })

  describe('post permissions', () => {
    let viewerUser: { id: number; email: string; name: string; role: string }
    let editorUser: { id: number; email: string; name: string; role: string }
    let viewerBrandId: number

    before(async () => {
      viewerUser = await createTestUser('viewer')
      editorUser = await createTestUser('editor')

      // Criar brand para o editor testar
      const brand = await getBrandsService().create(
        {
          name: 'Marca do Editor',
          description: 'Brand para testes de permissao'
        },
        userParams(editorUser)
      )
      viewerBrandId = brand.id
    })

    it('should allow editor to create and publish posts', async () => {
      const post = await getPostsService().create(
        {
          brandId: viewerBrandId,
          content: 'Post criado pelo editor',
          platform: 'instagram'
        },
        userParams(editorUser)
      )

      assert.ok(post.id, 'Editor should be able to create posts')
      assert.strictEqual(post.status, 'draft')

      const published = await getPostsService().patch(post.id, { status: 'published' }, userParams(editorUser))
      assert.strictEqual(published.status, 'published')
    })

    it('should allow viewer to read posts', async () => {
      // Criar um post como admin primeiro
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post para viewer ler',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      // Viewer deve conseguir ler posts (via find)
      const posts = await getPostsService().find({
        query: { brandId: testBrandId },
        ...userParams(viewerUser)
      })

      // O viewer pode nao ver posts de outras brands dependendo da implementacao
      // mas o servico deve funcionar sem erro
      assert.ok(posts, 'Viewer should be able to query posts')
    })
  })
})
