// Servico para regenerar a imagem de um slide especifico do carousel
// Permite refazer apenas uma foto sem regenerar todo o carousel

import type { Application, HookContext } from '../../declarations'
import type { ServiceInterface, Params } from '@feathersjs/feathers'
import type { CarouselSlide, CreativeBriefing, AgentContext } from '../ai-agents/types'
import type { Post } from './posts.schema'
import { ImageGenerationAgent } from '../ai-agents/image-generation-agent'
import { TextOverlayAgent } from '../ai-agents/text-overlay-agent'
import { BadRequest, NotFound } from '@feathersjs/errors'

export interface RegenerateSlideData {
  postId: number
  slideIndex: number
}

export interface RegenerateSlideResult {
  slide: CarouselSlide
  success: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RegenerateSlideParams extends Params {}

export class RegenerateSlideService implements ServiceInterface<RegenerateSlideResult, RegenerateSlideData> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: RegenerateSlideData, params?: RegenerateSlideParams): Promise<RegenerateSlideResult> {
    const { postId, slideIndex } = data
    const userId = (params as { user?: { id: number } })?.user?.id || 0

    // Valida slideIndex
    if (typeof slideIndex !== 'number' || slideIndex < 0 || slideIndex > 10) {
      throw new BadRequest(`Indice de slide invalido: ${slideIndex}`)
    }

    // Busca o post
    const post = (await this.app.service('posts').get(postId)) as Post

    // Valida slides
    if (!post.slides || !Array.isArray(post.slides) || post.slides.length === 0) {
      throw new BadRequest('Post nao possui slides')
    }

    const slide = post.slides[slideIndex] as CarouselSlide
    if (!slide) {
      throw new NotFound(`Slide ${slideIndex} nao encontrado`)
    }

    // Busca briefing criativo do post
    const briefing = post.creativeBriefing as CreativeBriefing | undefined
    if (!briefing) {
      throw new BadRequest('Post nao possui briefing criativo. Regenere o carousel completo.')
    }

    // Busca dados da marca
    const brand = await this.app.service('brands').get(post.brandId)

    // Monta contexto do agente
    const context: AgentContext = {
      brandId: post.brandId,
      brandName: brand.name,
      brandDescription: brand.description,
      toneOfVoice: brand.toneOfVoice,
      platform: post.platform,
      originalPrompt: post.aiPrompt || '',
      userId,
      brandColors: brand.brandColors,
      aiConfig: brand.aiConfig,
      referenceImages: post.aiReferenceImages as string[] | undefined
    }

    console.log(`[RegenerateSlide] Regenerando slide ${slideIndex} do post ${postId}`)

    // 1. Gera nova imagem master usando ImageGenerationAgent
    const imageAgent = new ImageGenerationAgent(this.app)
    const imageResult = await imageAgent.execute(context, {
      briefing,
      slides: [slide]
    })

    let updatedSlide = imageResult.result.slides[0]
    if (!updatedSlide.masterImageUrl && !updatedSlide.imageUrl) {
      throw new BadRequest('Falha ao gerar nova imagem para o slide')
    }

    console.log(
      `[RegenerateSlide] Imagem master gerada: ${updatedSlide.masterImageUrl || updatedSlide.imageUrl}`
    )

    // 2. Aplica text overlay usando TextOverlayAgent
    const textOverlayAgent = new TextOverlayAgent(this.app)
    const overlayResult = await textOverlayAgent.execute(context, {
      briefing,
      slides: [updatedSlide]
    })

    updatedSlide = overlayResult.result.slides[0]

    console.log(`[RegenerateSlide] Text overlay aplicado: ${updatedSlide.imageUrl}`)

    // 3. Atualiza o slide no array do post
    const updatedSlides = [...post.slides] as CarouselSlide[]
    updatedSlides[slideIndex] = updatedSlide

    await this.app.service('posts').patch(postId, { slides: updatedSlides })

    console.log(`[RegenerateSlide] Slide ${slideIndex} do post ${postId} regenerado com sucesso`)

    return {
      slide: updatedSlide,
      success: true
    }
  }
}

export const regenerateSlidePath = 'posts/regenerate-slide'
export const regenerateSlideMethods = ['create'] as const

// Hook de autenticacao
const authenticate = async (context: HookContext) => {
  const { params } = context
  if (!params.user) {
    throw new BadRequest('Autenticacao necessaria')
  }
  return context
}

export const regenerateSlide = (app: Application) => {
  // Registra servico customizado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(app as any).use(regenerateSlidePath, new RegenerateSlideService(app), {
    methods: regenerateSlideMethods,
    events: []
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(app as any).service(regenerateSlidePath).hooks({
    before: {
      all: [],
      create: [authenticate]
    }
  })
}

// Estende a interface ServiceTypes para incluir este servico
declare module '../../declarations' {
  interface ServiceTypes {
    [regenerateSlidePath]: RegenerateSlideService
  }
}
