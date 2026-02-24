// Configuracao do servico de Posts
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { HookContext } from '../../declarations'
import type { Application } from '../../declarations'
import { PostsService, getOptions, PLATFORM_LIMITS } from './posts.class'
import type { PostData, Post, PostCarouselSlide } from './posts.schema'
import { MediaService } from '../medias/medias.class'
import {
  postDataValidator,
  postPatchValidator,
  postQueryValidator,
  postResolver,
  postExternalResolver,
  postDataResolver,
  postPatchResolver,
  postQueryResolver
} from './posts.schema'
import { filterByUserBrands, verifyBrandOwnership, verifyBrandAccess } from '../../hooks/filter-by-user'

export const postsPath = 'posts'
export const postsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export * from './posts.class'
export * from './posts.schema'

// Campos JSON que precisam ser serializados/deserializados
const JSON_ARRAY_FIELDS = ['warnings', 'mediaUrls', 'slides', 'aiReferenceImages', 'aiExecutions']
const JSON_OBJECT_FIELDS = ['creativeBriefing', 'lastUsageCostBreakdown']
const JSON_STRING_FIELDS = ['aiPrompt', 'aiContext', 'content']

// Hook para sanitizar dados antes da validacao (converter null para valores apropriados)
const sanitizePostData = async (context: HookContext) => {
  if (!context.data) return context

  // Campos de array - converter null para []
  for (const field of JSON_ARRAY_FIELDS) {
    if (field in context.data) {
      if (context.data[field] === null || context.data[field] === undefined) {
        context.data[field] = []
      }
    }
  }

  // Campos de string - remover se null (nao atualiza o campo no banco)
  for (const field of JSON_STRING_FIELDS) {
    if (field in context.data && context.data[field] === null) {
      delete context.data[field]
    }
  }

  // Campos de objeto - converter null para undefined (remover)
  for (const field of JSON_OBJECT_FIELDS) {
    if (field in context.data && context.data[field] === null) {
      delete context.data[field]
    }
  }

  // Remover campos que sao undefined (nao foram alterados)
  for (const key of Object.keys(context.data)) {
    if (context.data[key] === undefined) {
      delete context.data[key]
    }
  }

  return context
}

// Hook unificado para serializar campos JSON antes de salvar no banco
const serializeJsonFields = async (context: HookContext) => {
  if (!context.data) return context

  const data = context.data as Record<string, unknown>

  // Serializar campos de array (apenas se forem array, nao se ja forem string)
  for (const field of JSON_ARRAY_FIELDS) {
    if (data[field] && Array.isArray(data[field])) {
      context.data[field] = JSON.stringify(data[field])
    }
  }

  // Serializar campos de objeto (apenas se forem objeto, nao se ja forem string)
  for (const field of JSON_OBJECT_FIELDS) {
    if (data[field] && typeof data[field] === 'object' && !Array.isArray(data[field])) {
      context.data[field] = JSON.stringify(data[field])
    }
  }

  return context
}

// Hook para calcular charCount, charLimit e warnings (nao serializa - isso e feito no hook serializeJsonFields)
const calculateCharLimits = async (context: HookContext) => {
  const data = context.data as PostData
  if (!data.platform) return context

  let charLimit = PLATFORM_LIMITS[data.platform] || 2200

  // Tentar obter limite da plataforma do banco
  try {
    const platformsService = context.app.service('platforms')
    const platforms = await platformsService.find({ query: { name: data.platform } })
    if (platforms.data && platforms.data.length > 0) {
      charLimit = platforms.data[0].charLimit
    }
  } catch {
    // Usar fallback
  }

  const content = data.content || ''
  const charCount = content.length
  const warnings: string[] = []

  if (charCount > charLimit) {
    warnings.push(
      `Conteudo excede o limite de ${charLimit} caracteres para ${data.platform}. Atual: ${charCount}`
    )
  }

  // Apenas atualiza os campos calculados, sem serializar (serializacao e feita depois)
  context.data = {
    ...data,
    content: content || '', // Garantir que content nunca seja null
    charCount,
    charLimit,
    warnings: warnings.length > 0 ? warnings : [],
    status: data.status || 'draft',
    origin: data.origin || 'manual'
  }

  return context
}

// Hook para setar publishedAt quando status muda para published
const setPublishedAt = async (context: HookContext) => {
  const data = context.data as Record<string, unknown>
  if (data.status === 'published') {
    context.data = {
      ...data,
      publishedAt: new Date().toISOString()
    }
  }
  return context
}

// Extrai todas as URLs de midia de um post (mediaUrls + slides.imageUrl)
const extractMediaUrls = (post: Post | Record<string, unknown>): string[] => {
  const urls: string[] = []

  // Extrair de mediaUrls
  let mediaUrls = post.mediaUrls
  if (typeof mediaUrls === 'string') {
    try {
      mediaUrls = JSON.parse(mediaUrls)
    } catch {
      mediaUrls = []
    }
  }
  if (Array.isArray(mediaUrls)) {
    urls.push(...mediaUrls.filter((url): url is string => typeof url === 'string'))
  }

  // Extrair de slides
  let slides = post.slides
  if (typeof slides === 'string') {
    try {
      slides = JSON.parse(slides)
    } catch {
      slides = []
    }
  }
  if (Array.isArray(slides)) {
    for (const slide of slides as PostCarouselSlide[]) {
      if (slide.imageUrl) {
        urls.push(slide.imageUrl)
      }
    }
  }

  return urls
}

// Hook para capturar URLs de midia antigas antes do patch
// IMPORTANTE: Usa query direta ao banco para evitar loop infinito de hooks
const captureOldMediaUrls = async (context: HookContext) => {
  const id = context.id
  if (!id) return context

  try {
    // Busca o post atual diretamente no banco (evita loop infinito de hooks)
    const db = context.app.get('sqliteClient')
    const currentPost = await db('posts').where('id', id).first()

    if (currentPost) {
      // Armazena URLs antigas no contexto para uso posterior
      context.params.oldMediaUrls = extractMediaUrls(currentPost)
    } else {
      context.params.oldMediaUrls = []
    }
  } catch {
    // Post nao encontrado ou erro - ignora
    context.params.oldMediaUrls = []
  }

  return context
}

// Hook para limpar midias orfas apos o patch
const cleanupOrphanedMedia = async (context: HookContext) => {
  const oldUrls: string[] = context.params.oldMediaUrls || []
  if (oldUrls.length === 0) return context

  const updatedPost = context.result as Post
  if (!updatedPost) return context

  const newUrls = extractMediaUrls(updatedPost)

  // Encontra URLs que foram removidas (estavam no post antigo mas nao estao no novo)
  const orphanedUrls = oldUrls.filter(url => !newUrls.includes(url))

  if (orphanedUrls.length === 0) return context

  console.log(`[Posts] Limpando ${orphanedUrls.length} midia(s) orfa(s):`, orphanedUrls)

  // Remove arquivos orfaos
  try {
    const mediaService = context.app.service('medias') as MediaService
    for (const url of orphanedUrls) {
      // So remove arquivos locais (que comecam com /uploads/)
      if (url.startsWith('/uploads/')) {
        await mediaService.removeByUrl(url)
      }
    }
  } catch (error) {
    console.error('[Posts] Erro ao limpar midias orfas:', error)
  }

  return context
}

// Helper seguro para parse de JSON
const safeJsonParse = (value: unknown, fallback: unknown = []): unknown => {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value)
  } catch {
    console.warn(`[Posts] Falha ao parsear JSON: ${value.substring(0, 50)}...`)
    return fallback
  }
}

// Hook para sincronizar dados nas tabelas normalizadas apos create/patch
const syncNormalizedTables = async (context: HookContext) => {
  const result = context.result as Record<string, unknown>
  if (!result || !result.id) return context

  const postId = result.id as number
  const db = context.app.get('sqliteClient')
  const data = context.data as Record<string, unknown> | undefined

  // Sincronizar slides (apenas se slides foi atualizado)
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

    // Deletar slides antigos do post (nao de versoes)
    await db('post_slides').where('postId', postId).whereNull('versionId').del()

    // Inserir novos slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const [insertedSlide] = await db('post_slides')
        .insert({
          postId,
          versionId: null,
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

  // Sincronizar warnings (apenas se warnings foi atualizado)
  if (data?.warnings) {
    let warnings: string[] = []
    if (typeof data.warnings === 'string') {
      try {
        warnings = JSON.parse(data.warnings)
      } catch {
        warnings = []
      }
    } else if (Array.isArray(data.warnings)) {
      warnings = data.warnings as string[]
    }

    await db('post_warnings').where('postId', postId).del()
    for (const message of warnings) {
      await db('post_warnings').insert({ postId, message })
    }
  }

  // Sincronizar aiReferenceImages (apenas se aiReferenceImages foi atualizado)
  if (data?.aiReferenceImages) {
    let refImages: string[] = []
    if (typeof data.aiReferenceImages === 'string') {
      try {
        refImages = JSON.parse(data.aiReferenceImages)
      } catch {
        refImages = []
      }
    } else if (Array.isArray(data.aiReferenceImages)) {
      refImages = data.aiReferenceImages as string[]
    }

    await db('post_reference_images').where('postId', postId).del()
    for (let i = 0; i < refImages.length; i++) {
      await db('post_reference_images').insert({
        postId,
        imageUrl: refImages[i],
        position: i
      })
    }
  }

  // Sincronizar aiExecutions (apenas se aiExecutions foi atualizado)
  if (data?.aiExecutions) {
    let executions: Array<Record<string, unknown>> = []
    if (typeof data.aiExecutions === 'string') {
      try {
        executions = JSON.parse(data.aiExecutions)
      } catch {
        executions = []
      }
    } else if (Array.isArray(data.aiExecutions)) {
      executions = data.aiExecutions as Array<Record<string, unknown>>
    }

    // Deletar execucoes antigas
    const oldExecutions = await db('post_ai_executions').where('postId', postId).select('id')
    for (const oldExec of oldExecutions) {
      await db('post_ai_agent_costs').where('executionId', oldExec.id).del()
    }
    await db('post_ai_executions').where('postId', postId).del()

    // Inserir novas execucoes
    for (const exec of executions) {
      const costBreakdown = exec.costBreakdown as Record<string, number> | undefined

      const [insertedExec] = await db('post_ai_executions')
        .insert({
          postId,
          uuid: (exec.id as string) || `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: exec.type || 'generate',
          provider: exec.provider || 'unknown',
          model: exec.model || 'unknown',
          promptTokens: exec.promptTokens || 0,
          completionTokens: exec.completionTokens || 0,
          totalTokens: exec.totalTokens || 0,
          costUsd: exec.costUsd || 0,
          inputCost: costBreakdown?.inputCost || 0,
          outputCost: costBreakdown?.outputCost || 0,
          imageCost: costBreakdown?.imageCost || 0,
          videoCost: costBreakdown?.videoCost || 0,
          imagesGenerated: exec.imagesGenerated || 0,
          createdAt: exec.timestamp
        })
        .returning('id')

      const executionId = typeof insertedExec === 'object' ? insertedExec.id : insertedExec

      // Inserir agentBreakdown
      const agentBreakdown = exec.agentBreakdown as Array<Record<string, unknown>> | undefined
      if (agentBreakdown && Array.isArray(agentBreakdown)) {
        for (const agent of agentBreakdown) {
          await db('post_ai_agent_costs').insert({
            executionId,
            agentType: agent.agentType || 'unknown',
            provider: agent.provider || 'unknown',
            model: agent.model || 'unknown',
            promptTokens: agent.promptTokens || 0,
            completionTokens: agent.completionTokens || 0,
            totalTokens: agent.totalTokens || 0,
            costUsd: agent.costUsd || 0,
            imagesGenerated: agent.imagesGenerated || 0
          })
        }
      }
    }
  }

  return context
}

// Hook para carregar dados normalizados e deserializar campos JSON
const loadNormalizedDataAndDeserialize = async (context: HookContext) => {
  const app = context.app
  const db = app.get('sqliteClient')

  const processPost = async (post: Record<string, unknown>) => {
    const postId = post.id as number

    // Carregar slides da nova tabela (apenas slides do post, nao de versoes)
    const dbSlides = await db('post_slides')
      .where('postId', postId)
      .whereNull('versionId')
      .orderBy('slideIndex', 'asc')

    if (dbSlides.length > 0) {
      // Carregar dados relacionados para cada slide
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
      post.slides = slides
    } else {
      // Fallback: deserializar do JSON antigo se nao houver dados na nova tabela
      post.slides = safeJsonParse(post.slides, [])
    }

    // Carregar warnings da nova tabela
    const dbWarnings = await db('post_warnings').where('postId', postId)
    if (dbWarnings.length > 0) {
      post.warnings = dbWarnings.map((w: { message: string }) => w.message)
    } else {
      post.warnings = safeJsonParse(post.warnings, [])
    }

    // Carregar aiReferenceImages da nova tabela
    const dbRefImages = await db('post_reference_images').where('postId', postId).orderBy('position', 'asc')
    if (dbRefImages.length > 0) {
      post.aiReferenceImages = dbRefImages.map((r: { imageUrl: string }) => r.imageUrl)
    } else {
      post.aiReferenceImages = safeJsonParse(post.aiReferenceImages, [])
    }

    // Carregar aiExecutions da nova tabela
    const dbExecutions = await db('post_ai_executions').where('postId', postId).orderBy('createdAt', 'desc')
    if (dbExecutions.length > 0) {
      const executions = await Promise.all(
        dbExecutions.map(async (exec: Record<string, unknown>) => {
          // Carregar breakdown de agentes
          const executionId = exec.id as number
          const agentBreakdown = await db('post_ai_agent_costs').where('executionId', executionId)

          return {
            id: exec.uuid,
            type: exec.type,
            provider: exec.provider,
            model: exec.model,
            promptTokens: exec.promptTokens,
            completionTokens: exec.completionTokens,
            totalTokens: exec.totalTokens,
            costUsd: exec.costUsd,
            costBreakdown: {
              inputCost: exec.inputCost,
              outputCost: exec.outputCost,
              imageCost: exec.imageCost,
              videoCost: exec.videoCost
            },
            imagesGenerated: exec.imagesGenerated,
            timestamp: exec.createdAt,
            agentBreakdown:
              agentBreakdown.length > 0
                ? agentBreakdown.map((a: Record<string, unknown>) => ({
                    agentType: a.agentType,
                    provider: a.provider,
                    model: a.model,
                    promptTokens: a.promptTokens,
                    completionTokens: a.completionTokens,
                    totalTokens: a.totalTokens,
                    costUsd: a.costUsd,
                    imagesGenerated: a.imagesGenerated
                  }))
                : undefined
          }
        })
      )
      post.aiExecutions = executions
    } else {
      // Fallback: deserializar do JSON antigo
      const parsedExecutions = safeJsonParse(post.aiExecutions, [])
      post.aiExecutions = Array.isArray(parsedExecutions) ? parsedExecutions : []
    }

    // Deserializar campos restantes do JSON (ainda nao normalizados)
    post.mediaUrls = safeJsonParse(post.mediaUrls, [])

    if (post.creativeBriefing) {
      post.creativeBriefing = safeJsonParse(post.creativeBriefing, null)
    }

    if (post.lastUsageCostBreakdown) {
      post.lastUsageCostBreakdown = safeJsonParse(post.lastUsageCostBreakdown, null)
    }

    return post
  }

  if (context.result) {
    if (Array.isArray(context.result.data)) {
      context.result.data = await Promise.all(context.result.data.map(processPost))
    } else if (context.result && typeof context.result === 'object' && 'id' in context.result) {
      context.result = await processPost(context.result as Record<string, unknown>)
    }
  }

  return context
}

export const posts = (app: Application) => {
  app.use(postsPath, new PostsService(getOptions(app)), {
    methods: postsMethods,
    events: []
  })

  app.service(postsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(postExternalResolver),
        schemaHooks.resolveResult(postResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(postQueryValidator), schemaHooks.resolveQuery(postQueryResolver)],
      // Filtra posts por brands do usuario
      find: [filterByUserBrands],
      get: [verifyBrandAccess],
      create: [
        verifyBrandOwnership,
        sanitizePostData,
        schemaHooks.validateData(postDataValidator),
        schemaHooks.resolveData(postDataResolver),
        calculateCharLimits,
        serializeJsonFields
      ],
      patch: [
        verifyBrandAccess,
        captureOldMediaUrls,
        sanitizePostData,
        schemaHooks.validateData(postPatchValidator),
        schemaHooks.resolveData(postPatchResolver),
        setPublishedAt,
        serializeJsonFields
      ],
      remove: [verifyBrandAccess]
    },
    after: {
      all: [loadNormalizedDataAndDeserialize],
      create: [syncNormalizedTables],
      patch: [syncNormalizedTables, cleanupOrphanedMedia]
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [postsPath]: PostsService
  }
}
