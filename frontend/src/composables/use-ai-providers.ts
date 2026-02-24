import { computed, reactive } from 'vue'
import { api } from 'src/api'
import { PROVIDER_CAPABILITIES } from 'src/types'
import type { AIProviderName, AgentType } from 'src/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any

// Tipos para os dados retornados pelo backend
export interface AIProviderInfo {
  name: string
  enabled: boolean
}

export interface AIModelInfo {
  id: string
  name: string
  type: 'text' | 'image' | 'video' | 'embedding' | 'unknown'
  contextWindow?: number
  maxOutputTokens?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModelsFind = any

// Cache de instancias useFind para modelos por provider
const modelsFinds = reactive<Record<string, ModelsFind>>({})

export function useAIProviders() {
  // Service stores do feathers-pinia
  const aiProvidersService = api.service('ai-providers') as AnyService
  const aiModelsService = api.service('ai-models') as AnyService

  // useFind para providers - busca automatica com paginacao client-side
  const providersParams = computed(() => ({ query: {} }))
  const providers$ = aiProvidersService.useFind(providersParams, { paginateOn: 'server' })

  // Lista de providers disponiveis
  const providers = computed(() => providers$.data as AIProviderInfo[])
  const loadingProviders = computed(() => providers$.isPending)

  // Buscar providers do backend (dispara a requisicao)
  const fetchProviders = async (): Promise<AIProviderInfo[]> => {
    await aiProvidersService.find({ query: {} })
    return providers.value
  }

  // Obter ou criar instancia useFind para um provider
  const getModelsFind = (provider: AIProviderName) => {
    if (!modelsFinds[provider]) {
      const params = computed(() => ({ query: { provider } }))
      modelsFinds[provider] = aiModelsService.useFind(params, { paginateOn: 'server' })
    }
    return modelsFinds[provider]
  }

  // Buscar modelos de um provider especifico
  const fetchModels = async (provider: AIProviderName): Promise<AIModelInfo[]> => {
    // Garante que a instancia useFind existe
    getModelsFind(provider)
    // Dispara a requisicao
    const response = await aiModelsService.find({ query: { provider } })
    const models = Array.isArray(response)
      ? (response as AIModelInfo[])
      : ((response as { data: AIModelInfo[] }).data || [])
    return models
  }

  // Obter modelos em cache para um provider (dados reativos do useFind)
  const getModels = (provider: AIProviderName): AIModelInfo[] => {
    const find$ = modelsFinds[provider]
    if (!find$) return []
    return (find$.data || []) as AIModelInfo[]
  }

  // Verificar se esta carregando modelos de um provider
  const isLoadingModels = (provider: AIProviderName): boolean => {
    const find$ = modelsFinds[provider]
    if (!find$) return false
    return find$.isPending
  }

  // Obter modelos filtrados por tipo de agente
  const getModelsForAgent = (provider: AIProviderName, agentType: AgentType): AIModelInfo[] => {
    const models = getModels(provider)

    // Filtrar por tipo de modelo baseado no tipo de agente
    if (agentType === 'imageGeneration' || agentType === 'textOverlay') {
      return models.filter(m => m.type === 'image')
    }
    if (agentType === 'videoGeneration') {
      return models.filter(m => m.type === 'video')
    }
    // Para outros agentes, retornar modelos de texto
    return models.filter(m => m.type === 'text' || m.type === 'unknown')
  }

  // Obter providers que suportam um tipo de agente
  const getProvidersForAgent = (agentType: AgentType): AIProviderInfo[] => {
    return providers.value.filter(p => {
      const caps = PROVIDER_CAPABILITIES[p.name as AIProviderName] || { text: true, image: false, video: false }
      if (agentType === 'imageGeneration' || agentType === 'textOverlay') return caps.image
      if (agentType === 'videoGeneration') return caps.video
      return caps.text
    })
  }

  // Limpar cache - reseta os stores
  const clearCache = () => {
    Object.keys(modelsFinds).forEach(key => delete modelsFinds[key])
  }

  return {
    // Estado reativo (feathers-pinia)
    providers,
    loadingProviders,
    providers$,

    // Metodos
    fetchProviders,
    fetchModels,
    getModels,
    getModelsFind,
    getModelsForAgent,
    getProvidersForAgent,
    isLoadingModels,
    clearCache
  }
}

