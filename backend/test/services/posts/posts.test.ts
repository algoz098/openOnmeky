// Testes TDD para o servico de Posts
// Baseado em docs/specs.md - Secao 2: Posts
// Estes testes devem FALHAR inicialmente ate a implementacao ser concluida

import assert from 'assert'
import { app, createTestUser, userParams } from '../../setup'

// Cast para any para permitir testes TDD antes da implementacao do servico
const getPostsService = () => (app as any).service('posts')
const getBrandsService = () => (app as any).service('brands')

describe('posts service', () => {
  let testBrandId: number
  let testUser: { id: number; email: string; name: string; role: string }

  before(async () => {
    testUser = await createTestUser('admin')
    const brand = await getBrandsService().create(
      {
        name: 'Marca para Posts',
        description: 'Marca para testar posts'
      },
      userParams(testUser)
    )
    testBrandId = brand.id
  })

  describe('service registration', () => {
    it('registered the service', () => {
      const service = getPostsService()
      assert.ok(service, 'Registered the service')
    })
  })

  describe('CRUD operations', () => {
    it('should create a post linked to a brand', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Este e meu primeiro post!',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      assert.ok(post.id, 'Post should have an id')
      assert.strictEqual(post.brandId, testBrandId)
      assert.strictEqual(post.content, 'Este e meu primeiro post!')
      assert.strictEqual(post.platform, 'instagram')
      assert.strictEqual(post.status, 'draft', 'New post should be a draft')
    })

    it('should require brandId when creating post', async () => {
      try {
        await getPostsService().create(
          {
            content: 'Post sem marca',
            platform: 'twitter'
          },
          userParams(testUser)
        )
        assert.fail('Should have thrown validation error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.ok(['BadRequest', 'ValidationError'].includes(err.name))
      }
    })

    it('should get a post by id', async () => {
      const created = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post para get',
          platform: 'linkedin'
        },
        userParams(testUser)
      )

      const post = await getPostsService().get(created.id, userParams(testUser))
      assert.strictEqual(post.id, created.id)
      assert.strictEqual(post.content, 'Post para get')
    })

    it('should update post content', async () => {
      const created = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Conteudo original',
          platform: 'twitter'
        },
        userParams(testUser)
      )

      const updated = await getPostsService().patch(
        created.id,
        { content: 'Conteudo atualizado' },
        userParams(testUser)
      )

      assert.strictEqual(updated.content, 'Conteudo atualizado')
    })

    it('should delete a post', async () => {
      const created = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post para deletar',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      await getPostsService().remove(created.id, userParams(testUser))

      try {
        await getPostsService().get(created.id, userParams(testUser))
        assert.fail('Should have thrown NotFound error')
      } catch (error: unknown) {
        const err = error as { name: string }
        assert.strictEqual(err.name, 'NotFound')
      }
    })

    it('should list all posts for a brand', async () => {
      const posts = await getPostsService().find({
        query: { brandId: testBrandId },
        ...userParams(testUser)
      })

      assert.ok(Array.isArray(posts.data), 'Should return array of posts')
      posts.data.forEach((post: { brandId: number }) => {
        assert.strictEqual(post.brandId, testBrandId)
      })
    })
  })

  describe('post origin tracking', () => {
    it('should track manual post origin', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post escrito manualmente',
          platform: 'instagram',
          origin: 'manual'
        },
        userParams(testUser)
      )

      assert.strictEqual(post.origin, 'manual')
    })

    it('should track AI generated post origin with prompt', async () => {
      const post = await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post gerado pela IA',
          platform: 'twitter',
          origin: 'ai',
          aiPrompt: 'Crie um post sobre produtividade'
        },
        userParams(testUser)
      )

      assert.strictEqual(post.origin, 'ai')
      assert.strictEqual(post.aiPrompt, 'Crie um post sobre produtividade')
    })
  })

  describe('brand isolation', () => {
    it('should not show posts from one brand in another brand', async () => {
      const brand2 = await getBrandsService().create(
        {
          name: 'Outra Marca',
          description: 'Marca diferente'
        },
        userParams(testUser)
      )

      await getPostsService().create(
        {
          brandId: testBrandId,
          content: 'Post da marca 1',
          platform: 'instagram'
        },
        userParams(testUser)
      )

      const postsOtherBrand = await getPostsService().find({
        query: { brandId: brand2.id },
        ...userParams(testUser)
      })

      postsOtherBrand.data.forEach((post: { brandId: number }) => {
        assert.strictEqual(post.brandId, brand2.id)
        assert.notStrictEqual(post.brandId, testBrandId)
      })
    })
  })
})
