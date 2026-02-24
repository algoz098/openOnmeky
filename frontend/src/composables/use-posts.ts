import { computed, ref } from 'vue'
import { api } from 'src/api'
import type { Post, PostStatus } from 'src/types'

// Cache local de posts
const postsCache = ref<Post[]>([])

// Informacoes de paginacao
const paginationInfo = ref<{
  total: number
  limit: number
  skip: number
}>({
  total: 0,
  limit: 10,
  skip: 0
})

export function usePosts() {
  const postsService = api.service('posts')

  // Lista reativa de posts
  const posts = computed(() => postsCache.value)

  // Informacoes de paginacao expostas
  const pagination = computed(() => paginationInfo.value)

  // Verifica se ha mais posts para carregar
  const hasMore = computed(() => {
    return paginationInfo.value.skip + paginationInfo.value.limit < paginationInfo.value.total
  })

  // Filtrar posts por status
  const postsByStatus = (status: PostStatus) => {
    return computed(() => posts.value.filter((p) => p.status === status))
  }

  // Posts de uma brand especifica
  const postsByBrand = (brandId: number) => {
    return computed(() => posts.value.filter((p) => p.brandId === brandId))
  }

  // Interface para resultado paginado
  interface PaginatedResult {
    data: Post[]
    total: number
    limit: number
    skip: number
  }

  // Buscar posts com paginacao
  const fetchPosts = async (query: Record<string, unknown> = {}, append = false) => {
    const result = await postsService.find({ query })

    let data: Post[]
    if (Array.isArray(result)) {
      data = result as Post[]
      paginationInfo.value = { total: data.length, limit: data.length, skip: 0 }
    } else {
      const paginated = result as PaginatedResult
      data = paginated.data || []
      paginationInfo.value = {
        total: paginated.total || data.length,
        limit: paginated.limit || 10,
        skip: paginated.skip || 0
      }
    }

    if (append) {
      postsCache.value = [...postsCache.value, ...data]
    } else {
      postsCache.value = data
    }

    return data
  }

  // Carregar mais posts
  const loadMore = async (query: Record<string, unknown> = {}) => {
    const nextSkip = paginationInfo.value.skip + paginationInfo.value.limit
    return fetchPosts({ ...query, $skip: nextSkip }, true)
  }

  // Buscar posts de uma brand
  const fetchPostsByBrand = async (brandId: number) => {
    return fetchPosts({ brandId })
  }

  // Buscar posts por periodo de datas (para calendario)
  const fetchPostsByDateRange = async (startDate: string, endDate: string) => {
    // Busca todos os posts e filtra no frontend
    // pois queries complexas com $or podem nao funcionar com o schema atual
    const query: Record<string, unknown> = {
      $limit: 200,
      $sort: { scheduledAt: 1 }
    }
    const result = await postsService.find({ query })

    let data: Post[]
    if (Array.isArray(result)) {
      data = result as Post[]
    } else {
      data = (result as PaginatedResult).data || []
    }

    // Filtra posts que tenham data no periodo
    const startDateTime = new Date(startDate).getTime()
    const endDateTime = new Date(`${endDate}T23:59:59.999Z`).getTime()

    const filtered = data.filter((post) => {
      const postDate = post.scheduledAt || post.publishedAt
      if (!postDate) return false
      const postDateTime = new Date(postDate).getTime()
      return postDateTime >= startDateTime && postDateTime <= endDateTime
    })

    // Atualiza o cache com os posts filtrados (para o calendario)
    postsCache.value = filtered
    return filtered
  }

  // Buscar um post por ID
  const getPost = async (id: number) => {
    return postsService.get(id) as Promise<Post>
  }

  // Criar novo post
  const createPost = async (data: Partial<Post>) => {
    const created = await postsService.create(data) as Post
    postsCache.value = [...postsCache.value, created]
    return created
  }

  // Atualizar post
  const updatePost = async (id: number, data: Partial<Post>) => {
    const updated = await postsService.patch(id, data) as Post
    postsCache.value = postsCache.value.map(p => p.id === id ? updated : p)
    return updated
  }

  // Remover post
  const removePost = async (id: number) => {
    await postsService.remove(id)
    postsCache.value = postsCache.value.filter(p => p.id !== id)
  }

  // Mudar status do post
  const changeStatus = async (id: number, status: PostStatus) => {
    return updatePost(id, { status })
  }

  // Agendar post
  const schedulePost = async (id: number, scheduledAt: string) => {
    return updatePost(id, { status: 'scheduled', scheduledAt })
  }

  // Publicar post (marca como publicado)
  const publishPost = async (id: number) => {
    return updatePost(id, { status: 'published' })
  }

  // Buscar posts nao agendados (draft ou approved sem scheduledAt)
  const fetchUnscheduledPosts = async () => {
    // Busca posts em draft ou approved e filtra no frontend
    // pois queries com null podem nao funcionar corretamente com Knex
    const query: Record<string, unknown> = {
      $limit: 100,
      $sort: { createdAt: -1 }
    }
    const result = await postsService.find({ query })

    let data: Post[]
    if (Array.isArray(result)) {
      data = result as Post[]
    } else {
      data = (result as PaginatedResult).data || []
    }

    // Filtra posts sem scheduledAt e com status draft ou approved
    return data.filter(
      (post) =>
        !post.scheduledAt &&
        (post.status === 'draft' || post.status === 'approved')
    )
  }

  return {
    posts,
    pagination,
    hasMore,
    postsByStatus,
    postsByBrand,
    postsCache,
    fetchPosts,
    loadMore,
    fetchPostsByBrand,
    fetchPostsByDateRange,
    fetchUnscheduledPosts,
    getPost,
    createPost,
    updatePost,
    removePost,
    changeStatus,
    schedulePost,
    publishPost
  }
}

