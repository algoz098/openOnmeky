import { computed, ref } from 'vue'
import { api } from 'src/api'
import type { Platform } from 'src/types'

// Cache local de platforms
const platformsCache = ref<Platform[]>([])

export function usePlatforms() {
  const platformsService = api.service('platforms')

  // Lista reativa de plataformas
  const platforms = computed(() => platformsCache.value)

  // Apenas plataformas ativas
  const activePlatforms = computed(() => platforms.value.filter((p) => p.active))

  // Buscar todas as plataformas
  const fetchPlatforms = async () => {
    const result = await platformsService.find({ query: {} })
    const data = (Array.isArray(result) ? result : (result as { data?: Platform[] }).data || []) as Platform[]
    platformsCache.value = data
    return data
  }

  // Buscar plataforma por nome
  const getPlatformByName = (name: string) => {
    return computed(() => platforms.value.find((p) => p.name === name))
  }

  // Obter limite de caracteres de uma plataforma
  const getCharLimit = (platformName: string): number => {
    const platform = platforms.value.find((p) => p.name === platformName)
    return platform?.charLimit || 0
  }

  return {
    platforms,
    activePlatforms,
    platformsCache,
    fetchPlatforms,
    getPlatformByName,
    getCharLimit
  }
}

