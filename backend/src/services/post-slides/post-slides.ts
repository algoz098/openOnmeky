// Configuracao do servico de Post Slides
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application, HookContext } from '../../declarations'
import { PostSlidesService, getOptions } from './post-slides.class'
import {
  postSlideDataValidator,
  postSlidePatchValidator,
  postSlideQueryValidator,
  postSlideResolver,
  postSlideExternalResolver,
  postSlideDataResolver,
  postSlidePatchResolver,
  postSlideQueryResolver
} from './post-slides.schema'

export const postSlidesPath = 'post-slides'
export const postSlidesMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './post-slides.class'
export * from './post-slides.schema'

// Hook para carregar dados relacionados (versions, typography, metadata)
const loadRelatedData = async (context: HookContext) => {
  const app = context.app
  const db = app.get('sqliteClient')

  const loadForSlide = async (slide: Record<string, unknown>) => {
    const slideId = slide.id as number

    // Carregar versions
    const versions = await db('post_slide_versions').where('slideId', slideId)
    slide.versions = versions.reduce((acc: Record<string, unknown>, v: Record<string, unknown>) => {
      acc[v.aspectRatio as string] = {
        aspectRatio: v.aspectRatio,
        imageUrl: v.imageUrl,
        size: v.size,
        hasText: Boolean(v.hasText),
        generatedAt: v.generatedAt
      }
      return acc
    }, {})

    // Carregar typography
    const typography = await db('post_slide_typography').where('slideId', slideId).first()
    if (typography) {
      slide.typography = {
        text: typography.text,
        fontStyle: typography.fontStyle,
        fontFamily: typography.fontFamily,
        position: typography.position,
        size: typography.size,
        color: typography.color,
        backgroundColor: typography.backgroundColor,
        backgroundStyle: typography.backgroundStyle,
        alignment: typography.alignment,
        shadow: Boolean(typography.shadow),
        outline: Boolean(typography.outline)
      }
    }

    // Carregar generationMetadata
    const metadata = await db('post_slide_generation_metadata').where('slideId', slideId).first()
    if (metadata) {
      slide.generationMetadata = {
        provider: metadata.provider,
        model: metadata.model,
        generatedAt: metadata.generatedAt
      }
    }

    return slide
  }

  if (context.result) {
    if (Array.isArray(context.result.data)) {
      context.result.data = await Promise.all(context.result.data.map(loadForSlide))
    } else if (context.result && typeof context.result === 'object' && 'id' in context.result) {
      context.result = await loadForSlide(context.result as Record<string, unknown>)
    }
  }

  return context
}

export const postSlides = (app: Application) => {
  app.use(postSlidesPath, new PostSlidesService(getOptions(app)), {
    methods: postSlidesMethods,
    events: []
  })

  app.service(postSlidesPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(postSlideExternalResolver),
        schemaHooks.resolveResult(postSlideResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(postSlideQueryValidator),
        schemaHooks.resolveQuery(postSlideQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(postSlideDataValidator),
        schemaHooks.resolveData(postSlideDataResolver)
      ],
      patch: [
        schemaHooks.validateData(postSlidePatchValidator),
        schemaHooks.resolveData(postSlidePatchResolver)
      ],
      remove: []
    },
    after: {
      all: [loadRelatedData]
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [postSlidesPath]: PostSlidesService
  }
}
