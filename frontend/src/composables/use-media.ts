// Composable para gerenciamento de arquivos de midia
import { ref } from 'vue'
import { host } from 'src/api'
import type { Media } from 'src/types'

// Tipos MIME permitidos por categoria
export const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] as const
export const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'] as const
export type MediaFilterType = 'all' | 'image' | 'video'
export type MediaSourceType = 'all' | 'upload' | 'ai-generated'

export function useMedia() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uploadedMedias = ref<Media[]>([])
  const galleryMedias = ref<Media[]>([])
  const galleryTotal = ref(0)

  // Obtem o token JWT do localStorage
  const getAuthToken = (): string | null => {
    return localStorage.getItem('feathers-jwt')
  }

  // Faz upload de um arquivo
  const uploadFile = async (file: File): Promise<Media | null> => {
    loading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Usuario nao autenticado')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${host}/medias`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao fazer upload do arquivo')
      }

      const media = (await response.json()) as Media
      uploadedMedias.value.push(media)
      return media
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo'
      return null
    } finally {
      loading.value = false
    }
  }

  // Faz upload de multiplos arquivos
  const uploadFiles = async (files: File[]): Promise<Media[]> => {
    const results: Media[] = []
    for (const file of files) {
      const media = await uploadFile(file)
      if (media) {
        results.push(media)
      }
    }
    return results
  }

  // Remove uma media da lista local (nao deleta do servidor)
  const removeMedia = (mediaId: number) => {
    uploadedMedias.value = uploadedMedias.value.filter((m) => m.id !== mediaId)
  }

  // Limpa todas as medias da lista local
  const clearMedias = () => {
    uploadedMedias.value = []
  }

  // Converte arquivo para base64 (para envio direto ao AI)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
    })
  }

  // Converte arquivo para AIImage (base64 inline)
  const fileToAIImage = async (file: File): Promise<{ url: string; mimeType: string }> => {
    const base64 = await fileToBase64(file)
    return {
      url: base64,
      mimeType: file.type
    }
  }

  // Converte media do servidor para AIImage
  const mediaToAIImage = (media: Media): { url: string; mimeType: string } => {
    return {
      url: `${host}${media.url}`,
      mimeType: media.mimeType
    }
  }

  // Busca midias da galeria com filtros
  const fetchGallery = async (options: {
    filter?: MediaFilterType
    source?: MediaSourceType
    search?: string
    limit?: number
    skip?: number
  } = {}): Promise<{ data: Media[]; total: number }> => {
    loading.value = true
    error.value = null

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Usuario nao autenticado')
      }

      const params = new URLSearchParams()
      params.append('$limit', String(options.limit || 20))
      params.append('$skip', String(options.skip || 0))
      params.append('$sort[createdAt]', '-1')

      // Filtro por tipo de midia
      if (options.filter === 'image') {
        imageMimeTypes.forEach((mime) => params.append('mimeType[$in][]', mime))
      } else if (options.filter === 'video') {
        videoMimeTypes.forEach((mime) => params.append('mimeType[$in][]', mime))
      }

      // Filtro por origem da midia (upload vs ai-generated)
      if (options.source && options.source !== 'all') {
        params.append('source', options.source)
      }

      // Busca por nome
      if (options.search) {
        params.append('originalName[$like]', `%${options.search}%`)
      }

      const response = await fetch(`${host}/medias?${params.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao buscar midias')
      }

      const result = (await response.json()) as { data: Media[]; total: number; limit: number; skip: number }
      galleryMedias.value = result.data
      galleryTotal.value = result.total
      return { data: result.data, total: result.total }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erro ao buscar midias'
      return { data: [], total: 0 }
    } finally {
      loading.value = false
    }
  }

  // Obtem URL completa da midia
  const getMediaUrl = (media: Media): string => {
    if (media.url.startsWith('http')) return media.url
    return `${host}${media.url}`
  }

  // Verifica se a midia e uma imagem
  const isImage = (media: Media): boolean => {
    return imageMimeTypes.includes(media.mimeType as (typeof imageMimeTypes)[number])
  }

  // Verifica se a midia e um video
  const isVideo = (media: Media): boolean => {
    return videoMimeTypes.includes(media.mimeType as (typeof videoMimeTypes)[number])
  }

  return {
    loading,
    error,
    uploadedMedias,
    galleryMedias,
    galleryTotal,
    uploadFile,
    uploadFiles,
    removeMedia,
    clearMedias,
    fileToBase64,
    fileToAIImage,
    mediaToAIImage,
    fetchGallery,
    getMediaUrl,
    isImage,
    isVideo
  }
}

