// Servico para derivar novas versoes de imagem a partir de master images
// Permite gerar imagens em diferentes proporcoes com texto overlay

import type { Application, HookContext } from '../../declarations'
import type { ServiceInterface, Params } from '@feathersjs/feathers'
import type { AspectRatio, ImageVersion, CarouselSlide, CreativeBriefing } from '../ai-agents/types'
import type { Post } from './posts.schema'
import { TextOverlayAgent } from '../ai-agents/text-overlay-agent'
import { BadRequest, NotFound } from '@feathersjs/errors'

export interface DeriveImageData {
  postId: number
  slideIndex: number
  aspectRatio: AspectRatio
}

export interface DeriveImageResult {
  slide: CarouselSlide
  version: ImageVersion
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DeriveImageParams extends Params {}

export class DeriveImageService implements ServiceInterface<DeriveImageResult, DeriveImageData> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async create(data: DeriveImageData, params?: DeriveImageParams): Promise<DeriveImageResult> {
    const { postId, slideIndex, aspectRatio } = data
    const userId = (params as { user?: { id: number } })?.user?.id || 0

    // Valida proporcao
    const validAspectRatios: AspectRatio[] = ['1:1', '4:5', '9:16', '16:9']
    if (!validAspectRatios.includes(aspectRatio)) {
      throw new BadRequest(`Proporcao invalida: ${aspectRatio}. Use: ${validAspectRatios.join(', ')}`)
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

    // Verifica se tem master image
    const masterImageUrl = slide.masterImageUrl || slide.imageUrl
    if (!masterImageUrl) {
      throw new BadRequest(`Slide ${slideIndex} nao possui imagem master`)
    }

    // Verifica se ja existe essa versao
    if (slide.versions?.[aspectRatio]) {
      console.log(`[DeriveImage] Versao ${aspectRatio} ja existe para slide ${slideIndex}`)
      return {
        slide,
        version: slide.versions[aspectRatio]
      }
    }

    // Busca briefing criativo do post
    const briefing = post.creativeBriefing as CreativeBriefing | undefined
    if (!briefing) {
      throw new BadRequest('Post nao possui briefing criativo para derivacao')
    }

    // Busca dados da marca
    const brand = await this.app.service('brands').get(post.brandId)

    // Executa o TextOverlayAgent com a nova proporcao
    const textOverlayAgent = new TextOverlayAgent(this.app)
    const result = await textOverlayAgent.execute(
      {
        brandId: post.brandId,
        brandName: brand.name,
        brandDescription: brand.description,
        toneOfVoice: brand.toneOfVoice,
        platform: post.platform,
        originalPrompt: post.aiPrompt || '',
        userId,
        brandColors: brand.brandColors,
        aiConfig: brand.aiConfig
      },
      {
        briefing,
        slides: [{ ...slide, masterImageUrl }],
        targetAspectRatio: aspectRatio
      }
    )

    const updatedSlide = result.result.slides[0]
    const newVersion = updatedSlide.versions?.[aspectRatio]

    if (!newVersion) {
      throw new BadRequest('Falha ao gerar nova versao da imagem')
    }

    // Atualiza o post com a nova versao
    const updatedSlides = [...post.slides] as CarouselSlide[]
    updatedSlides[slideIndex] = updatedSlide

    await this.app.service('posts').patch(postId, { slides: updatedSlides })

    console.log(`[DeriveImage] Nova versao ${aspectRatio} gerada para slide ${slideIndex} do post ${postId}`)

    return {
      slide: updatedSlide,
      version: newVersion
    }
  }
}

export const deriveImagePath = 'posts/derive-image'
export const deriveImageMethods = ['create'] as const

// Hook de autenticacao
const authenticate = async (context: HookContext) => {
  const { params } = context
  if (!params.user) {
    throw new BadRequest('Autenticacao necessaria')
  }
  return context
}

export const deriveImage = (app: Application) => {
  // Registra servico customizado ignorando tipagem estrita para path dinamico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(app as any).use(deriveImagePath, new DeriveImageService(app), {
    methods: deriveImageMethods,
    events: []
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(app as any).service(deriveImagePath).hooks({
    before: {
      all: [],
      create: [authenticate]
    }
  })
}

// Estende a interface ServiceTypes para incluir este servico
declare module '../../declarations' {
  interface ServiceTypes {
    [deriveImagePath]: DeriveImageService
  }
}
