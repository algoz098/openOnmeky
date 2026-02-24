import { computed, ref } from 'vue'
import { api, socket } from 'src/api'
import type { Brand } from 'src/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any

export function useBrands() {
  const brandsService = api.service('brands') as AnyService

  // useFind para busca reativa de brands (feathers-pinia)
  const brandsParams = computed(() => ({ query: {} }))
  const brands$ = brandsService.useFind(brandsParams, { paginateOn: 'client' })

  // Lista reativa de brands
  const brands = computed(() => (brands$.data || []) as Brand[])
  const loadingBrands = computed(() => brands$.isPending as boolean)

  // Brand selecionada atualmente
  const currentBrand = computed(() => {
    const id = localStorage.getItem('currentBrandId')
    if (!id) return null
    return brands.value.find((b: Brand) => b.id === Number(id)) || null
  })

  // Buscar todas as brands (dispara a requisicao)
  const fetchBrands = async () => {
    await brandsService.find({ query: {} })
    return brands.value
  }

  // useGet para buscar uma brand por ID (reativo)
  const useGetBrand = (id: number | null) => {
    const idRef = ref(id)
    return brandsService.useGet(idRef)
  }

  // Buscar uma brand por ID (metodo direto)
  const getBrand = async (id: number) => {
    return brandsService.get(id) as Promise<Brand>
  }

  // Criar nova brand
  const createBrand = async (data: Partial<Brand>) => {
    return brandsService.create(data) as Promise<Brand>
  }

  // Atualizar brand
  const updateBrand = async (id: number, data: Partial<Brand>) => {
    return brandsService.patch(id, data) as Promise<Brand>
  }

  // Remover brand
  const removeBrand = (id: number) => {
    return brandsService.remove(id) as Promise<Brand>
  }

  // Selecionar brand atual
  const selectBrand = (id: number) => {
    localStorage.setItem('currentBrandId', String(id))
  }

  // Preview de prompt com variaveis substituidas
  const getPromptPreview = async (
    brandId: number,
    params: {
      type: 'text' | 'image' | 'video'
      tema?: string
      plataforma?: string
      limite?: number
      estilo?: string
      duracao?: number
    }
  ) => {
    // Chama via socket.io diretamente (metodo customizado do backend)
    return new Promise((resolve, reject) => {
      socket.emit('brands::getPromptPreview', brandId, params, {}, (error: Error | null, result: unknown) => {
        if (error) reject(error)
        else resolve(result)
      })
    })
  }

  return {
    // Estado reativo (feathers-pinia)
    brands,
    brands$,
    loadingBrands,
    currentBrand,

    // Metodos
    fetchBrands,
    useGetBrand,
    getBrand,
    createBrand,
    updateBrand,
    removeBrand,
    selectBrand,
    getPromptPreview
  }
}

