// Composable para gerenciamento de versoes de posts
import { computed, ref } from 'vue'
import { api } from 'src/api'
import type { PostVersion, Post } from 'src/types'

// Cache local de versoes por post
const versionsCache = ref<Map<number, PostVersion[]>>(new Map())

// Loading state
const loading = ref(false)

export function usePostVersions() {
  const versionsService = api.service('post-versions')
  const postsService = api.service('posts')

  // Interface para resultado paginado
  interface PaginatedResult {
    data: PostVersion[]
    total: number
    limit: number
    skip: number
  }

  // Buscar versoes de um post
  const fetchVersions = async (postId: number): Promise<PostVersion[]> => {
    loading.value = true
    try {
      const result = await versionsService.find({
        query: {
          postId,
          $sort: { version: -1 }
        }
      })

      let data: PostVersion[]
      if (Array.isArray(result)) {
        data = result as PostVersion[]
      } else {
        const paginated = result as PaginatedResult
        data = paginated.data || []
      }

      versionsCache.value.set(postId, data)
      return data
    } finally {
      loading.value = false
    }
  }

  // Obter versoes do cache
  const getVersionsForPost = (postId: number) => {
    return computed(() => versionsCache.value.get(postId) || [])
  }

  // Obter versao ativa de um post
  const getActiveVersion = (postId: number) => {
    return computed(() => {
      const versions = versionsCache.value.get(postId) || []
      return versions.find(v => v.isActive)
    })
  }

  // Aplicar uma versao ao post (tornar ativa)
  const applyVersion = async (versionId: number): Promise<PostVersion> => {
    loading.value = true
    try {
      // Atualiza a versao para ser ativa
      // O hook do backend desativara automaticamente as outras
      const updated = await versionsService.patch(versionId, { isActive: true }) as PostVersion

      // Atualiza o cache
      const postId = updated.postId
      const versions = versionsCache.value.get(postId) || []
      const updatedVersions = versions.map(v => ({
        ...v,
        isActive: v.id === versionId
      }))
      versionsCache.value.set(postId, updatedVersions)

      // Atualiza o post com o conteudo da versao
      await postsService.patch(postId, {
        content: updated.content,
        slides: updated.slides,
        mediaUrls: updated.mediaUrls,
        creativeBriefing: updated.creativeBriefing,
        currentVersionId: versionId
      })

      return updated
    } finally {
      loading.value = false
    }
  }

  // Criar versao manual a partir do conteudo atual do post
  const createManualVersion = async (post: Post): Promise<PostVersion> => {
    loading.value = true
    try {
      // Busca numero da proxima versao
      const versions = versionsCache.value.get(post.id) || []
      const maxVersion = versions.length > 0
        ? Math.max(...versions.map(v => v.version))
        : 0
      const nextVersion = maxVersion + 1

      // Cria nova versao manual
      const created = await versionsService.create({
        postId: post.id,
        version: nextVersion,
        content: post.content || '',
        caption: post.content,
        slides: post.slides,
        mediaUrls: post.mediaUrls,
        creativeBriefing: post.creativeBriefing,
        isActive: true,
        source: 'manual'
      }) as PostVersion

      // Atualiza cache
      const currentVersions = versionsCache.value.get(post.id) || []
      const updatedVersions = [
        created,
        ...currentVersions.map(v => ({ ...v, isActive: false }))
      ]
      versionsCache.value.set(post.id, updatedVersions)

      // Atualiza post com currentVersionId
      await postsService.patch(post.id, {
        currentVersionId: created.id
      })

      return created
    } finally {
      loading.value = false
    }
  }

  // Limpar cache de um post
  const clearCache = (postId?: number) => {
    if (postId) {
      versionsCache.value.delete(postId)
    } else {
      versionsCache.value.clear()
    }
  }

  return {
    loading: computed(() => loading.value),
    versionsCache,
    fetchVersions,
    getVersionsForPost,
    getActiveVersion,
    applyVersion,
    createManualVersion,
    clearCache
  }
}

