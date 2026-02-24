// Agente de Geracao de Imagens
// Responsavel por gerar imagens MASTER (sem texto) para cada slide do carrousel
// A imagem master e salva separadamente e pode ser usada para gerar versoes em diferentes proporcoes

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type {
  AgentContext,
  AgentExecution,
  CreativeBriefing,
  CarouselSlide,
  SlidePurpose,
  ImageGenerationMetadata
} from './types'
import type { AIProviderName } from '../ai-providers'
import type { ProgressCallback } from './orchestrator'
import type { MediaService } from '../medias/medias.class'

interface ImageGenerationInput {
  briefing: CreativeBriefing
  slides: CarouselSlide[]
}

export class ImageGenerationAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'imageGeneration', 'imagen-3.0-generate-002')
  }

  async execute(
    context: AgentContext,
    input: ImageGenerationInput,
    onProgress?: ProgressCallback
  ): Promise<{
    result: { slides: CarouselSlide[] }
    executions: AgentExecution[]
  }> {
    console.log('[ImageGenerationAgent] Iniciando geracao de imagens em PARALELO')
    console.log('[ImageGenerationAgent] Context aiConfig:', JSON.stringify(context.aiConfig, null, 2))

    // Obtem modelo preferido da configuracao
    const model = this.getModel(context)
    console.log('[ImageGenerationAgent] Modelo preferido:', model)

    // Obtem servico de medias para salvar imagens localmente
    const mediaService = this.app.service('medias') as MediaService

    const purposeVisuals: Record<SlidePurpose, string> = {
      hook: 'eye-catching and impactful image that captures attention, scroll-stopping visual',
      features: 'image showcasing product details and features, clear product photography',
      summary: 'clean and informative image summarizing the product, minimal composition',
      cta: 'image with visual call-to-action elements, directional arrows or button-like shapes'
    }

    // Check if there are reference images
    const hasReferenceImages = context.referenceImages && context.referenceImages.length > 0
    if (hasReferenceImages) {
      console.log(
        `[ImageGenerationAgent] Using ${context.referenceImages!.length} reference images to guide generation`
      )
    }

    const totalSlides = input.slides.length
    let completedCount = 0

    // Funcao para processar um slide individual
    const processSlide = async (
      slide: CarouselSlide,
      slideIdx: number
    ): Promise<{ slide: CarouselSlide; execution: AgentExecution }> => {
      const purpose = slide.purpose as SlidePurpose

      // Include reference images instruction in prompt if available
      const referenceInstruction = hasReferenceImages
        ? 'IMPORTANT: Generate an image with visual style SIMILAR to the provided reference images. Maintain the same aesthetic, color palette, and composition.'
        : ''

      const imagePrompt = `Professional social media graphic in ${input.briefing.visualStyle} style.

# SUBJECT
${slide.text || input.briefing.slides[slide.index]?.keyMessage || context.originalPrompt}

# VISUAL DIRECTION
Purpose: ${purposeVisuals[purpose]}
Mood: ${input.briefing.moodKeywords.join(', ')}

# COLOR PALETTE
Primary: ${input.briefing.colorPalette[0] || '#333333'}
Secondary: ${input.briefing.colorPalette[1] || input.briefing.colorPalette[0] || '#666666'}
Accent: ${input.briefing.colorPalette[2] || '#FFFFFF'}
${context.brandColors?.length ? `Brand Colors to incorporate: ${context.brandColors.join(', ')}` : ''}

# TECHNICAL SPECIFICATIONS
- Platform: ${context.platform}
- Aspect Ratio: 1:1 (square format)
- Composition: Clean with clear focal point
- Negative Space: Leave ${purpose === 'cta' ? '40%' : '20%'} space for potential text overlay
- Style: ${input.briefing.visualStyle}

# RESTRICTIONS
- NO text, typography, or letters in the image
- NO watermarks or signatures
- NO copyrighted logos or characters
- NO realistic human faces (use illustrations or abstract representations)
- Ensure high contrast for readability
- Image must be safe for all audiences

# BRAND CONTEXT
Brand: ${context.brandName}
Target Audience: ${context.targetAudience || 'General'}

${referenceInstruction}

Create a scroll-stopping, professional image ready for ${context.platform}. High quality, 4K resolution, commercial photography style.`

      const startedAt = new Date().toISOString()

      try {
        console.log(
          `[ImageGenerationAgent] Gerando imagem para slide ${slide.index} (${purpose}) com modelo: ${model}`
        )

        // Obtem o provider correto para este modelo de imagem
        const provider = await this.getProviderForImage(model)
        console.log(`[ImageGenerationAgent] Provider para modelo ${model}: ${provider.name}`)

        // Verifica se provider suporta geracao de imagem
        if (!provider.generateImage) {
          throw new Error(`Provider ${provider.name} nao suporta geracao de imagens`)
        }

        const result = await provider.generateImage({
          prompt: imagePrompt,
          model,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          referenceImages: context.referenceImages
        })

        console.log(`[ImageGenerationAgent] Resultado recebido para slide ${slide.index}:`, {
          imagesCount: result.images?.length || 0,
          model: result.model,
          provider: result.provider,
          hasUrl: !!result.images[0]?.url,
          hasBase64: !!result.images[0]?.base64,
          base64Length: result.images[0]?.base64?.length || 0
        })

        // Extrai URL ou base64 do resultado
        const imageData = result.images[0]
        let localImageUrl: string | undefined

        if (imageData?.url && imageData.url.startsWith('http')) {
          console.log(`[ImageGenerationAgent] Salvando imagem de URL: ${imageData.url.substring(0, 50)}...`)
          const savedMedia = await mediaService.saveFromUrl(
            imageData.url,
            `ai-${purpose}-${Date.now()}-${slideIdx}.png`,
            context.userId,
            'ai-generated'
          )
          localImageUrl = savedMedia.url
          console.log(`[ImageGenerationAgent] Imagem salva localmente: ${localImageUrl}`)
        } else if (imageData?.base64) {
          console.log(`[ImageGenerationAgent] Salvando imagem de base64 (${imageData.base64.length} chars)`)
          const savedMedia = await mediaService.saveFromBase64(
            imageData.base64,
            `ai-${purpose}-${Date.now()}-${slideIdx}.png`,
            context.userId,
            'ai-generated'
          )
          localImageUrl = savedMedia.url
          console.log(`[ImageGenerationAgent] Imagem salva localmente: ${localImageUrl}`)
        } else {
          throw new Error('Nenhuma imagem retornada pelo provider')
        }

        // Emite progresso apos conclusao
        completedCount++
        if (onProgress) {
          await onProgress({
            current: completedCount,
            total: totalSlides,
            itemName: purpose
          })
        }

        // Metadados de geracao para permitir regeneracao futura
        const generationMetadata: ImageGenerationMetadata = {
          provider: provider.name,
          model: result.model,
          generatedAt: new Date().toISOString()
        }

        // Sucesso - retorna resultado com masterImageUrl
        return {
          slide: {
            ...slide,
            masterImageUrl: localImageUrl,
            imageUrl: localImageUrl,
            imagePrompt,
            generationMetadata
          },
          execution: {
            agentType: this.agentType,
            provider: provider.name,
            model: result.model,
            startedAt,
            completedAt: new Date().toISOString(),
            systemPrompt: 'Image generation (master)',
            userPrompt: imagePrompt,
            imageUrl: localImageUrl,
            status: 'success'
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        console.error(`[ImageGenerationAgent] ERRO no slide ${slide.index}: ${errorMessage}`)

        // Emite progresso mesmo em caso de erro
        completedCount++
        if (onProgress) {
          await onProgress({
            current: completedCount,
            total: totalSlides,
            itemName: purpose
          })
        }

        // Obtem provider name para o log de execucao
        const providerName = this.getProviderForImageModel(model)

        return {
          slide: {
            ...slide,
            imagePrompt
          },
          execution: {
            agentType: this.agentType,
            provider: providerName,
            model,
            startedAt,
            completedAt: new Date().toISOString(),
            systemPrompt: 'Image generation',
            userPrompt: imagePrompt,
            error: errorMessage,
            status: 'failed'
          }
        }
      }
    }

    // Executa todas as geracoes de imagem em PARALELO
    console.log(`[ImageGenerationAgent] Iniciando geracao paralela de ${totalSlides} imagens`)
    const startTime = Date.now()

    const results = await Promise.all(input.slides.map((slide, idx) => processSlide(slide, idx)))

    const elapsedTime = Date.now() - startTime
    console.log(`[ImageGenerationAgent] Geracao paralela concluida em ${elapsedTime}ms`)

    // Extrai slides e execucoes dos resultados (mantendo ordem original)
    const updatedSlides = results.map(r => r.slide)
    const executions = results.map(r => r.execution)

    return {
      result: { slides: updatedSlides },
      executions
    }
  }

  // Metodo auxiliar para gerar imagem individual (para retry)
  async generateSingleImage(
    context: AgentContext,
    slide: CarouselSlide,
    briefing: CreativeBriefing
  ): Promise<{ imageUrl?: string; execution: AgentExecution }> {
    const result = await this.execute(context, { briefing, slides: [slide] })
    return {
      imageUrl: result.result.slides[0]?.imageUrl,
      execution: result.executions[0]
    }
  }
}
