// Migration: Migrar dados JSON existentes para as novas tabelas normalizadas
import type { Knex } from 'knex'

// Helper para parse seguro de JSON - arrays
function safeJsonParseArray<T>(value: unknown): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// Helper para parse seguro de JSON - objetos
function safeJsonParseObject<T extends Record<string, unknown>>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value as T
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

export async function up(knex: Knex): Promise<void> {
  // 1. Migrar slides dos posts
  const posts = await knex('posts').select(
    'id',
    'slides',
    'warnings',
    'mediaUrls',
    'aiReferenceImages',
    'creativeBriefing',
    'aiExecutions'
  )

  for (const post of posts) {
    // Migrar slides
    const slides = safeJsonParseArray<Record<string, unknown>>(post.slides)
    for (const slide of slides) {
      const [slideRow] = await knex('post_slides')
        .insert({
          postId: post.id,
          versionId: null,
          slideIndex: slide.index || 0,
          purpose: slide.purpose || 'hook',
          text: slide.text,
          imageUrl: slide.imageUrl,
          imagePrompt: slide.imagePrompt,
          masterImageUrl: slide.masterImageUrl
        })
        .returning('id')

      const slideId = typeof slideRow === 'object' ? slideRow.id : slideRow

      // Migrar versions do slide
      const versions = slide.versions as Record<string, Record<string, unknown>> | undefined
      if (versions) {
        for (const [aspectRatio, version] of Object.entries(versions)) {
          if (version && version.imageUrl) {
            await knex('post_slide_versions').insert({
              slideId,
              aspectRatio,
              imageUrl: version.imageUrl,
              size: version.size,
              hasText: version.hasText ? 1 : 0,
              generatedAt: version.generatedAt
            })
          }
        }
      }

      // Migrar typography do slide
      const typography = slide.typography as Record<string, unknown> | undefined
      if (typography && typography.text) {
        await knex('post_slide_typography').insert({
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

      // Migrar generationMetadata do slide
      const metadata = slide.generationMetadata as Record<string, unknown> | undefined
      if (metadata && metadata.provider) {
        await knex('post_slide_generation_metadata').insert({
          slideId,
          provider: metadata.provider,
          model: metadata.model,
          generatedAt: metadata.generatedAt
        })
      }
    }

    // Migrar warnings
    const warnings = safeJsonParseArray<string>(post.warnings)
    for (const message of warnings) {
      await knex('post_warnings').insert({ postId: post.id, message })
    }

    // Migrar aiReferenceImages
    const refImages = safeJsonParseArray<string>(post.aiReferenceImages)
    for (let i = 0; i < refImages.length; i++) {
      await knex('post_reference_images').insert({ postId: post.id, imageUrl: refImages[i], position: i })
    }

    // Migrar creativeBriefing
    const briefing = safeJsonParseObject<Record<string, unknown>>(post.creativeBriefing)
    if (briefing) {
      const typography = briefing.typography as Record<string, unknown> | undefined
      const overlayStyle = briefing.overlayStyle as Record<string, unknown> | undefined

      const [briefingRow] = await knex('post_creative_briefings')
        .insert({
          postId: post.id,
          concept: briefing.concept || '',
          narrative: briefing.narrative || '',
          visualStyle: briefing.visualStyle || '',
          typographyFontFamily: typography?.fontFamily,
          typographyPrimaryColor: typography?.primaryColor,
          typographySecondaryColor: typography?.secondaryColor,
          typographyStyle: typography?.style,
          overlayDesignReference: overlayStyle?.designReference,
          overlayDefaultType: overlayStyle?.defaultType,
          overlayGradientDirection: overlayStyle?.gradientDirection,
          overlayOpacity: overlayStyle?.opacity,
          overlayCornerRadius: overlayStyle?.cornerRadius,
          overlayPadding: overlayStyle?.padding
        })
        .returning('id')

      const briefingId = typeof briefingRow === 'object' ? briefingRow.id : briefingRow

      // Migrar colorPalette
      const colorPalette = briefing.colorPalette as string[] | undefined
      if (colorPalette) {
        for (let i = 0; i < colorPalette.length; i++) {
          await knex('post_briefing_colors').insert({ briefingId, color: colorPalette[i], position: i })
        }
      }

      // Migrar moodKeywords
      const moodKeywords = briefing.moodKeywords as string[] | undefined
      if (moodKeywords) {
        for (let i = 0; i < moodKeywords.length; i++) {
          await knex('post_briefing_mood_keywords').insert({
            briefingId,
            keyword: moodKeywords[i],
            position: i
          })
        }
      }

      // Migrar slides do briefing
      const briefingSlides = briefing.slides as Array<Record<string, unknown>> | undefined
      if (briefingSlides) {
        for (let i = 0; i < briefingSlides.length; i++) {
          const bs = briefingSlides[i]
          const overlayConfig = bs.overlayConfig as Record<string, unknown> | undefined
          await knex('post_briefing_slides').insert({
            briefingId,
            slideIndex: i,
            purpose: bs.purpose || '',
            direction: bs.direction || '',
            keyMessage: bs.keyMessage || '',
            overlayType: overlayConfig?.type,
            overlayPosition: overlayConfig?.position,
            overlayDescription: overlayConfig?.description
          })
        }
      }
    }

    // Migrar aiExecutions
    const executions = safeJsonParseArray<Record<string, unknown>>(post.aiExecutions)
    for (const exec of executions) {
      const [execRow] = await knex('post_ai_executions')
        .insert({
          postId: post.id,
          uuid: exec.id || `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: exec.type || 'generate',
          provider: exec.provider || 'unknown',
          model: exec.model || 'unknown',
          promptTokens: exec.promptTokens || 0,
          completionTokens: exec.completionTokens || 0,
          totalTokens: exec.totalTokens || 0,
          costUsd: exec.costUsd || 0,
          inputCost: (exec.costBreakdown as Record<string, number>)?.inputCost || 0,
          outputCost: (exec.costBreakdown as Record<string, number>)?.outputCost || 0,
          imageCost: (exec.costBreakdown as Record<string, number>)?.imageCost || 0,
          videoCost: (exec.costBreakdown as Record<string, number>)?.videoCost || 0,
          imagesGenerated: exec.imagesGenerated || 0,
          createdAt: exec.timestamp
        })
        .returning('id')

      const executionId = typeof execRow === 'object' ? execRow.id : execRow

      // Migrar agentBreakdown
      const agentBreakdown = exec.agentBreakdown as Array<Record<string, unknown>> | undefined
      if (agentBreakdown) {
        for (const agent of agentBreakdown) {
          await knex('post_ai_agent_costs').insert({
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

  // 2. Migrar slides das post_versions
  const versions = await knex('post_versions').select('id', 'postId', 'slides')
  for (const version of versions) {
    const slides = safeJsonParseArray<Record<string, unknown>>(version.slides)
    for (const slide of slides) {
      await knex('post_slides').insert({
        postId: version.postId,
        versionId: version.id,
        slideIndex: slide.index || 0,
        purpose: slide.purpose || 'hook',
        text: slide.text,
        imageUrl: slide.imageUrl,
        imagePrompt: slide.imagePrompt,
        masterImageUrl: slide.masterImageUrl
      })
    }
  }

  // 3. Migrar dados das brands
  const brands = await knex('brands').select(
    'id',
    'values',
    'preferredWords',
    'avoidedWords',
    'competitors',
    'brandColors',
    'prompts',
    'aiConfig'
  )
  for (const brand of brands) {
    // Migrar values
    const values = safeJsonParseArray<string>(brand.values)
    for (let i = 0; i < values.length; i++) {
      await knex('brand_values').insert({ brandId: brand.id, value: values[i], position: i })
    }

    // Migrar preferredWords
    const preferredWords = safeJsonParseArray<string>(brand.preferredWords)
    for (let i = 0; i < preferredWords.length; i++) {
      await knex('brand_preferred_words').insert({ brandId: brand.id, word: preferredWords[i], position: i })
    }

    // Migrar avoidedWords
    const avoidedWords = safeJsonParseArray<string>(brand.avoidedWords)
    for (let i = 0; i < avoidedWords.length; i++) {
      await knex('brand_avoided_words').insert({ brandId: brand.id, word: avoidedWords[i], position: i })
    }

    // Migrar competitors
    const competitors = safeJsonParseArray<string>(brand.competitors)
    for (let i = 0; i < competitors.length; i++) {
      await knex('brand_competitors').insert({ brandId: brand.id, name: competitors[i], position: i })
    }

    // Migrar brandColors
    const brandColors = safeJsonParseArray<string>(brand.brandColors)
    for (let i = 0; i < brandColors.length; i++) {
      await knex('brand_colors').insert({
        brandId: brand.id,
        color: brandColors[i],
        isPrimary: i === 0 ? 1 : 0,
        position: i
      })
    }

    // Migrar prompts para colunas
    const prompts = safeJsonParseObject<Record<string, string>>(brand.prompts)
    if (prompts && (prompts.text || prompts.image || prompts.video)) {
      await knex('brands').where('id', brand.id).update({
        promptText: prompts.text,
        promptImage: prompts.image,
        promptVideo: prompts.video
      })
    }

    // Migrar aiConfig
    const aiConfig = safeJsonParseObject<Record<string, Record<string, unknown>>>(brand.aiConfig)
    if (aiConfig) {
      for (const [agentType, config] of Object.entries(aiConfig)) {
        if (config && (config.provider || config.model)) {
          await knex('brand_ai_configs').insert({
            brandId: brand.id,
            agentType,
            provider: config.provider as string,
            model: config.model as string,
            temperature: config.temperature as number,
            maxTokens: config.maxTokens as number
          })
        }
      }
    }
  }

  // 4. Migrar dados dos ai_generation_logs
  const logs = await knex('ai_generation_logs').select('id', 'agentExecutions', 'referenceImages', 'slides')
  for (const log of logs) {
    // Migrar agentExecutions
    const agentExecutions = safeJsonParseArray<Record<string, unknown>>(log.agentExecutions)
    for (const exec of agentExecutions) {
      await knex('log_agent_executions').insert({
        logId: log.id,
        agentType: exec.agentType || 'unknown',
        provider: exec.provider || 'unknown',
        model: exec.model || 'unknown',
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        systemPrompt: exec.systemPrompt || '',
        userPrompt: exec.userPrompt || '',
        result: exec.result,
        imageUrl: exec.imageUrl,
        promptTokens: exec.promptTokens || 0,
        completionTokens: exec.completionTokens || 0,
        totalTokens: exec.totalTokens || 0,
        error: exec.error,
        status: exec.status || 'success'
      })
    }

    // Migrar referenceImages
    const refImages = safeJsonParseArray<string>(log.referenceImages)
    for (let i = 0; i < refImages.length; i++) {
      await knex('log_reference_images').insert({ logId: log.id, imageUrl: refImages[i], position: i })
    }

    // Migrar slides
    const slides = safeJsonParseArray<Record<string, unknown>>(log.slides)
    for (const slide of slides) {
      await knex('log_slides').insert({
        logId: log.id,
        slideIndex: slide.index || 0,
        purpose: slide.purpose || 'hook',
        text: slide.text,
        imageUrl: slide.imageUrl,
        imagePrompt: slide.imagePrompt,
        masterImageUrl: slide.masterImageUrl
      })
    }
  }

  // 5. Migrar dados das platforms
  const platforms = await knex('platforms').select('id', 'features')
  for (const platform of platforms) {
    const features = safeJsonParseArray<string>(platform.features)
    for (const feature of features) {
      await knex('platform_features').insert({ platformId: platform.id, feature })
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Nota: Esta migration nao pode ser revertida de forma segura
  // Os dados nas novas tabelas seriam perdidos
  // Para reverter, seria necessario reconstruir os JSONs a partir das tabelas
  console.warn('AVISO: Revertendo migracao de dados. Os dados nas novas tabelas serao perdidos.')

  // Limpar tabelas na ordem correta (devido a foreign keys)
  await knex('platform_features').del()
  await knex('log_slides').del()
  await knex('log_reference_images').del()
  await knex('log_agent_executions').del()
  await knex('brand_ai_configs').del()
  await knex('brand_colors').del()
  await knex('brand_competitors').del()
  await knex('brand_avoided_words').del()
  await knex('brand_preferred_words').del()
  await knex('brand_values').del()
  await knex('post_ai_agent_costs').del()
  await knex('post_ai_executions').del()
  await knex('post_briefing_slides').del()
  await knex('post_briefing_mood_keywords').del()
  await knex('post_briefing_colors').del()
  await knex('post_creative_briefings').del()
  await knex('post_reference_images').del()
  await knex('post_warnings').del()
  await knex('post_slide_generation_metadata').del()
  await knex('post_slide_typography').del()
  await knex('post_slide_versions').del()
  await knex('post_slides').del()

  // Limpar colunas de prompts
  await knex('brands').update({ promptText: null, promptImage: null, promptVideo: null })
}
