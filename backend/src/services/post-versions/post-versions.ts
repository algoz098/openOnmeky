// Servico de Versoes de Posts
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application, HookContext } from '../../declarations'
import { PostVersionsService, getOptions } from './post-versions.class'
import {
  postVersionDataValidator,
  postVersionDataResolver,
  postVersionPatchValidator,
  postVersionPatchResolver,
  postVersionQueryValidator,
  postVersionQueryResolver,
  postVersionResolver,
  postVersionExternalResolver
} from './post-versions.schema'
import { filterByUserPosts, verifyPostAccess, verifyPostOwnership } from '../../hooks/filter-by-user'

export const postVersionsPath = 'post-versions'
export const postVersionsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

// Campos JSON que precisam ser serializados/deserializados
const JSON_FIELDS = ['slides', 'mediaUrls', 'creativeBriefing']

// Helper seguro para parse de JSON
const safeJsonParse = (value: unknown, fallback: unknown = []): unknown => {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// Hook para carregar dados normalizados e deserializar campos JSON na resposta
const loadNormalizedDataAndDeserialize = async (context: HookContext) => {
  const db = context.app.get('sqliteClient')

  const processItem = async (item: Record<string, unknown>) => {
    const versionId = item.id as number

    // Carregar slides da nova tabela (slides da versao, nao do post)
    const dbSlides = await db('post_slides').where('versionId', versionId).orderBy('slideIndex', 'asc')

    if (dbSlides.length > 0) {
      const slides = await Promise.all(
        dbSlides.map(async (slide: Record<string, unknown>) => {
          const slideId = slide.id as number

          // Carregar versions
          const versions = await db('post_slide_versions').where('slideId', slideId)
          const versionsObj: Record<string, unknown> = {}
          for (const v of versions) {
            versionsObj[v.aspectRatio as string] = {
              aspectRatio: v.aspectRatio,
              imageUrl: v.imageUrl,
              size: v.size,
              hasText: Boolean(v.hasText),
              generatedAt: v.generatedAt
            }
          }

          // Carregar typography
          const typography = await db('post_slide_typography').where('slideId', slideId).first()

          // Carregar generationMetadata
          const metadata = await db('post_slide_generation_metadata').where('slideId', slideId).first()

          return {
            index: slide.slideIndex,
            purpose: slide.purpose,
            text: slide.text,
            imageUrl: slide.imageUrl,
            imagePrompt: slide.imagePrompt,
            masterImageUrl: slide.masterImageUrl,
            versions: Object.keys(versionsObj).length > 0 ? versionsObj : undefined,
            typography: typography
              ? {
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
              : undefined,
            generationMetadata: metadata
              ? {
                  provider: metadata.provider,
                  model: metadata.model,
                  generatedAt: metadata.generatedAt
                }
              : undefined
          }
        })
      )
      item.slides = slides
    } else {
      // Fallback: deserializar do JSON antigo
      item.slides = safeJsonParse(item.slides, [])
    }

    // Deserializar outros campos JSON
    item.mediaUrls = safeJsonParse(item.mediaUrls, [])
    item.creativeBriefing = safeJsonParse(item.creativeBriefing, null)

    return item
  }

  if (context.result) {
    if (Array.isArray(context.result.data)) {
      context.result.data = await Promise.all(context.result.data.map(processItem))
    } else if (context.result.data) {
      context.result = { ...context.result, data: await processItem(context.result.data) }
    } else if (!context.result.data && context.result.id) {
      context.result = await processItem(context.result)
    }
  }

  return context
}

// Hook para sincronizar dados nas tabelas normalizadas apos create/patch
const syncNormalizedTables = async (context: HookContext) => {
  const result = context.result as Record<string, unknown>
  if (!result || !result.id) return context

  const versionId = result.id as number
  const postId = result.postId as number
  const db = context.app.get('sqliteClient')
  const data = context.data as Record<string, unknown> | undefined

  // Sincronizar slides
  if (data?.slides) {
    let slides: Array<Record<string, unknown>> = []
    if (typeof data.slides === 'string') {
      try {
        slides = JSON.parse(data.slides)
      } catch {
        slides = []
      }
    } else if (Array.isArray(data.slides)) {
      slides = data.slides as Array<Record<string, unknown>>
    }

    // Deletar slides antigos da versao
    await db('post_slides').where('versionId', versionId).del()

    // Inserir novos slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const [insertedSlide] = await db('post_slides')
        .insert({
          postId,
          versionId,
          slideIndex: slide.index ?? i,
          purpose: slide.purpose || 'hook',
          text: slide.text,
          imageUrl: slide.imageUrl,
          imagePrompt: slide.imagePrompt,
          masterImageUrl: slide.masterImageUrl
        })
        .returning('id')

      const slideId = typeof insertedSlide === 'object' ? insertedSlide.id : insertedSlide

      // Inserir versions
      const versions = slide.versions as Record<string, unknown> | undefined
      if (versions && typeof versions === 'object') {
        for (const [aspectRatio, versionData] of Object.entries(versions)) {
          const v = versionData as Record<string, unknown>
          await db('post_slide_versions').insert({
            slideId,
            aspectRatio,
            imageUrl: v.imageUrl,
            size: v.size,
            hasText: v.hasText ? 1 : 0,
            generatedAt: v.generatedAt
          })
        }
      }

      // Inserir typography
      const typography = slide.typography as Record<string, unknown> | undefined
      if (typography) {
        await db('post_slide_typography').insert({
          slideId,
          text: typography.text,
          fontStyle: typography.fontStyle,
          fontFamily: typography.fontFamily,
          position: typography.position,
          size: typography.size,
          color: typography.color,
          backgroundColor: typography.backgroundColor,
          backgroundStyle: typography.backgroundStyle,
          alignment: typography.alignment,
          shadow: typography.shadow ? 1 : 0,
          outline: typography.outline ? 1 : 0
        })
      }

      // Inserir generationMetadata
      const metadata = slide.generationMetadata as Record<string, unknown> | undefined
      if (metadata) {
        await db('post_slide_generation_metadata').insert({
          slideId,
          provider: metadata.provider,
          model: metadata.model,
          generatedAt: metadata.generatedAt
        })
      }
    }
  }

  return context
}

// Hook para serializar campos JSON antes de salvar
const serializeJsonFields = async (context: HookContext) => {
  const data = context.data as Record<string, unknown>

  for (const field of JSON_FIELDS) {
    if (data[field] && typeof data[field] !== 'string') {
      data[field] = JSON.stringify(data[field])
    }
  }

  return context
}

// Hook para garantir defaults na criacao
const setDefaults = async (context: HookContext) => {
  context.data = {
    source: 'ai',
    isActive: false,
    ...context.data
  }
  return context
}

// Hook para desativar outras versoes quando uma e ativada
const deactivateOthers = async (context: HookContext) => {
  const data = context.data as Record<string, unknown>

  // Se esta versao esta sendo ativada, desativar as outras
  if (data.isActive === true && context.id) {
    const version = await context.service.get(context.id)
    const postId = version.postId

    // Desativar todas as outras versoes do mesmo post
    const db = context.app.get('sqliteClient')
    await db('post_versions')
      .where('postId', postId)
      .where('id', '!=', context.id)
      .update({ isActive: false })
  }

  return context
}

export const postVersions = (app: Application) => {
  app.use(postVersionsPath, new PostVersionsService(getOptions(app)), {
    methods: postVersionsMethods,
    events: []
  })

  app.service(postVersionsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(postVersionExternalResolver),
        schemaHooks.resolveResult(postVersionResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(postVersionQueryValidator),
        schemaHooks.resolveQuery(postVersionQueryResolver)
      ],
      find: [filterByUserPosts],
      get: [verifyPostAccess],
      create: [
        verifyPostOwnership,
        setDefaults,
        schemaHooks.validateData(postVersionDataValidator),
        schemaHooks.resolveData(postVersionDataResolver),
        serializeJsonFields
      ],
      patch: [
        verifyPostAccess,
        schemaHooks.validateData(postVersionPatchValidator),
        schemaHooks.resolveData(postVersionPatchResolver),
        serializeJsonFields,
        deactivateOthers
      ],
      remove: [verifyPostAccess]
    },
    after: {
      all: [loadNormalizedDataAndDeserialize],
      create: [syncNormalizedTables],
      patch: [syncNormalizedTables]
    },
    error: {
      all: []
    }
  })
}

// Declara o servico no tipo da aplicacao
declare module '../../declarations' {
  interface ServiceTypes {
    [postVersionsPath]: PostVersionsService
  }
}
