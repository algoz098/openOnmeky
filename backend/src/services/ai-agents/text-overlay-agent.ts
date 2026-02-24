// Agente de Overlay de Texto
// Responsavel por adicionar texto estilizado sobre as imagens MASTER
// Preserva a masterImageUrl e salva versoes com texto em versions

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type {
  AgentContext,
  AgentExecution,
  CreativeBriefing,
  CarouselSlide,
  SlidePurpose,
  TypographyConfig,
  OverlayType,
  SlideOverlayConfig,
  ImageVersion,
  AspectRatio
} from './types'
import type { AIProviderName } from '../ai-providers'
import type { ProgressCallback } from './orchestrator'
import type { MediaService } from '../medias/medias.class'

interface TextOverlayInput {
  briefing: CreativeBriefing
  slides: CarouselSlide[]
  // Proporcao alvo para esta geracao (padrao: 1:1 para carrossel)
  targetAspectRatio?: AspectRatio
}

export class TextOverlayAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'textOverlay', 'gpt-image-1')
  }

  async execute(
    context: AgentContext,
    input: TextOverlayInput,
    onProgress?: ProgressCallback
  ): Promise<{
    result: { slides: CarouselSlide[] }
    executions: AgentExecution[]
  }> {
    console.log('[TextOverlayAgent] Iniciando adicao de texto nas imagens em PARALELO')
    console.log('[TextOverlayAgent] Slides recebidos:', input.slides.length)

    // Obtem modelo preferido da configuracao
    const model = this.getModel(context)
    console.log('[TextOverlayAgent] Modelo preferido:', model)

    // Obtem servico de medias para salvar imagens
    const mediaService = this.app.service('medias') as MediaService

    // Fallback de estilos de tipografia por proposito do slide
    // Usado apenas quando o briefing nao define overlayConfig
    const fallbackTypography: Record<SlidePurpose, Partial<TypographyConfig>> = {
      hook: {
        fontStyle: 'bold',
        fontFamily: 'sans-serif',
        position: 'center',
        size: 'xlarge',
        backgroundStyle: 'gradient',
        shadow: true
      },
      features: {
        fontStyle: 'regular',
        fontFamily: 'sans-serif',
        position: 'bottom-left',
        size: 'medium',
        backgroundStyle: 'blur',
        alignment: 'left'
      },
      summary: {
        fontStyle: 'light',
        fontFamily: 'sans-serif',
        position: 'center',
        size: 'large',
        backgroundStyle: 'solid',
        alignment: 'center'
      },
      cta: {
        fontStyle: 'bold',
        fontFamily: 'sans-serif',
        position: 'bottom',
        size: 'large',
        backgroundStyle: 'solid',
        shadow: true
      }
    }

    const totalSlides = input.slides.length
    let completedCount = 0

    // Proporcao alvo (padrao 1:1 para carrossel Instagram)
    const targetAspectRatio: AspectRatio = input.targetAspectRatio || '1:1'
    const aspectRatioSizes: Record<AspectRatio, string> = {
      '1:1': '1024x1024',
      '4:5': '1024x1280', // Aproximacao - API nao suporta exato
      '9:16': '1024x1792',
      '16:9': '1792x1024'
    }

    // Funcao para processar um slide individual
    const processSlide = async (
      slide: CarouselSlide,
      slideIdx: number
    ): Promise<{ slide: CarouselSlide; execution: AgentExecution | null }> => {
      // Pula slides sem imagem (verifica masterImageUrl primeiro, depois imageUrl)
      const sourceImageUrl = slide.masterImageUrl || slide.imageUrl
      if (!sourceImageUrl) {
        console.log(`[TextOverlayAgent] Slide ${slide.index} sem imagem, pulando...`)
        return { slide, execution: null }
      }

      // Pula slides sem texto
      const textContent = slide.text || input.briefing.slides[slide.index]?.keyMessage
      if (!textContent) {
        console.log(`[TextOverlayAgent] Slide ${slide.index} sem texto, pulando...`)
        return { slide, execution: null }
      }

      const purpose = slide.purpose as SlidePurpose

      // Obtem configuracao de overlay do briefing criativo (definida pelo diretor)
      const briefingSlide = input.briefing.slides[slide.index]
      const slideOverlayConfig = briefingSlide?.overlayConfig

      const typography = this.buildTypographyConfig(
        textContent,
        purpose,
        fallbackTypography[purpose],
        input.briefing,
        slideOverlayConfig
      )

      console.log(`[TextOverlayAgent] Processando slide ${slide.index} (${purpose})`)
      console.log(`[TextOverlayAgent] Texto: "${textContent.substring(0, 50)}..."`)

      const startedAt = new Date().toISOString()

      // Constroi prompt para adicionar texto na imagem
      const overlayPrompt = this.buildOverlayPrompt(slide, typography, input.briefing, context)

      try {
        console.log(
          `[TextOverlayAgent] Gerando imagem com texto para slide ${slide.index} com modelo: ${model}`
        )
        console.log(`[TextOverlayAgent] Usando imagem source: ${sourceImageUrl}`)
        console.log(`[TextOverlayAgent] Proporcao alvo: ${targetAspectRatio}`)

        // Obtem o provider correto para este modelo de imagem
        const provider = await this.getProviderForImage(model)
        console.log(`[TextOverlayAgent] Provider para modelo ${model}: ${provider.name}`)

        if (!provider.generateImage) {
          throw new Error(`Provider ${provider.name} nao suporta geracao de imagens`)
        }

        // Envia imagem master como referencia para manter o estilo
        const result = await provider.generateImage({
          prompt: overlayPrompt,
          model,
          size: aspectRatioSizes[targetAspectRatio] as '1024x1024' | '1792x1024' | '1024x1792',
          quality: 'hd',
          style: 'natural',
          referenceImages: [sourceImageUrl]
        })

        console.log(`[TextOverlayAgent] Resultado recebido para slide ${slide.index}:`, {
          imagesCount: result.images?.length || 0,
          model: result.model,
          provider: result.provider
        })

        // Extrai e salva imagem
        const imageData = result.images[0]
        let localImageUrl: string | undefined

        if (imageData?.url && imageData.url.startsWith('http')) {
          console.log(`[TextOverlayAgent] Salvando imagem de URL...`)
          const savedMedia = await mediaService.saveFromUrl(
            imageData.url,
            `ai-overlay-${purpose}-${Date.now()}-${slideIdx}.png`,
            context.userId,
            'ai-generated'
          )
          localImageUrl = savedMedia.url
        } else if (imageData?.base64) {
          console.log(`[TextOverlayAgent] Salvando imagem de base64...`)
          const savedMedia = await mediaService.saveFromBase64(
            imageData.base64,
            `ai-overlay-${purpose}-${Date.now()}-${slideIdx}.png`,
            context.userId,
            'ai-generated'
          )
          localImageUrl = savedMedia.url
        } else {
          throw new Error('Nenhuma imagem retornada pelo provider')
        }

        console.log(`[TextOverlayAgent] Imagem com texto salva: ${localImageUrl}`)

        // Emite progresso apos conclusao
        completedCount++
        if (onProgress) {
          await onProgress({
            current: completedCount,
            total: totalSlides,
            itemName: purpose
          })
        }

        // Cria objeto ImageVersion para esta proporcao
        const imageVersion: ImageVersion = {
          aspectRatio: targetAspectRatio,
          imageUrl: localImageUrl!,
          size: aspectRatioSizes[targetAspectRatio],
          hasText: true,
          generatedAt: new Date().toISOString()
        }

        // Preserva versoes existentes e adiciona a nova
        const updatedVersions = {
          ...(slide.versions || {}),
          [targetAspectRatio]: imageVersion
        }

        console.log(`[TextOverlayAgent] Versao ${targetAspectRatio} adicionada com texto`)

        // Sucesso - retorna resultado preservando masterImageUrl
        return {
          slide: {
            ...slide,
            masterImageUrl: slide.masterImageUrl,
            imageUrl: localImageUrl,
            typography,
            versions: updatedVersions
          },
          execution: {
            agentType: this.agentType,
            provider: provider.name,
            model: result.model,
            startedAt,
            completedAt: new Date().toISOString(),
            systemPrompt: 'Text overlay generation',
            userPrompt: overlayPrompt,
            imageUrl: localImageUrl,
            status: 'success'
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        console.error(`[TextOverlayAgent] ERRO no slide ${slide.index}: ${errorMessage}`)

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
            typography
          },
          execution: {
            agentType: this.agentType,
            provider: providerName,
            model,
            startedAt,
            completedAt: new Date().toISOString(),
            systemPrompt: 'Text overlay generation',
            userPrompt: overlayPrompt,
            error: errorMessage,
            status: 'failed'
          }
        }
      }
    }

    // Executa todos os overlays em PARALELO
    console.log(`[TextOverlayAgent] Iniciando processamento paralelo de ${totalSlides} slides`)
    const startTime = Date.now()

    const results = await Promise.all(input.slides.map((slide, idx) => processSlide(slide, idx)))

    const elapsedTime = Date.now() - startTime
    console.log(`[TextOverlayAgent] Processamento paralelo concluido em ${elapsedTime}ms`)

    // Extrai slides e execucoes dos resultados (mantendo ordem original)
    const updatedSlides = results.map(r => r.slide)
    const executions = results.filter(r => r.execution !== null).map(r => r.execution!)

    console.log(`[TextOverlayAgent] Concluido. ${updatedSlides.length} slides processados.`)

    return {
      result: { slides: updatedSlides },
      executions
    }
  }

  // Constroi configuracao completa de tipografia
  // Prioriza configuracoes do briefing criativo (definidas pelo diretor)
  private buildTypographyConfig(
    text: string,
    purpose: SlidePurpose,
    fallbackDefaults: Partial<TypographyConfig>,
    briefing: CreativeBriefing,
    slideOverlayConfig?: SlideOverlayConfig
  ): TypographyConfig {
    // Cor primaria do texto baseada na paleta (contraste com fundo)
    const primaryColor = briefing.typography?.primaryColor || '#FFFFFF'
    const backgroundColor = briefing.colorPalette[0] || '#000000'

    // Prioridade: slideOverlayConfig > overlayStyle > fallbackDefaults
    const overlayStyle = briefing.overlayStyle
    const defaultOverlayType: OverlayType = overlayStyle?.defaultType || 'gradient'

    // Determina backgroundStyle: slide especifico > global > fallback
    const backgroundStyle: OverlayType =
      slideOverlayConfig?.type || defaultOverlayType || fallbackDefaults.backgroundStyle || 'gradient'

    // Determina position: slide especifico > fallback
    const position = slideOverlayConfig?.position || fallbackDefaults.position || 'center'

    return {
      text,
      fontStyle: fallbackDefaults.fontStyle || 'bold',
      fontFamily: briefing.typography?.fontFamily || fallbackDefaults.fontFamily || 'sans-serif',
      position,
      size: fallbackDefaults.size || 'large',
      color: primaryColor,
      backgroundColor,
      backgroundStyle,
      alignment: fallbackDefaults.alignment || 'center',
      shadow: fallbackDefaults.shadow ?? true,
      outline: false
    }
  }

  // Constroi prompt para geracao de imagem com texto
  // Usa descricoes detalhadas do briefing criativo quando disponiveis
  private buildOverlayPrompt(
    slide: CarouselSlide,
    typography: TypographyConfig,
    briefing: CreativeBriefing,
    context: AgentContext
  ): string {
    const positionDescriptions: Record<string, string> = {
      center: 'centered in the middle of the image',
      top: 'at the top of the image',
      bottom: 'at the bottom of the image',
      'top-left': 'in the top-left corner',
      'top-right': 'in the top-right corner',
      'bottom-left': 'in the bottom-left corner',
      'bottom-right': 'in the bottom-right corner'
    }

    const sizeDescriptions: Record<string, string> = {
      small: 'small font size, subtle',
      medium: 'medium font size, readable',
      large: 'large font size, prominent',
      xlarge: 'extra-large font size, attention-grabbing headline'
    }

    // Descricoes tecnicas detalhadas para cada tipo de overlay
    const technicalBackgroundDescriptions: Record<string, string> = {
      solid: `Clean rectangular text panel with:
        - Solid fill using brand color at 85% opacity
        - Sharp, perfectly straight edges
        - Rounded corners (8-12px radius)
        - Consistent padding: 24px horizontal, 16px vertical
        - Subtle 1px border at 20% opacity for definition
        - Professional, modern UI appearance`,
      gradient: `Professional gradient scrim overlay with:
        - Linear gradient from 80% opacity to 0% transparency
        - Smooth gradient transition over 35-40% of image height
        - No visible banding or color stepping
        - Uses dark neutral (black or brand dark color)
        - Clean, cinematic look like movie posters or Apple presentations`,
      blur: `Modern glassmorphism effect with:
        - Frosted glass panel with 15-20px blur radius
        - Background tint using brand color at 30% opacity
        - Clean rectangular shape with 12px rounded corners
        - 1px white/light border at 10% opacity for depth
        - Consistent padding: 32px all sides
        - Premium, modern UI appearance like iOS or macOS`,
      none: `No background overlay:
        - Text rendered directly on image
        - Enhanced drop shadow for readability (2-4px offset, 50% opacity)
        - Only suitable for simple, non-busy backgrounds`
    }

    // Obtem configuracao de overlay do briefing
    const overlayStyle = briefing.overlayStyle
    const briefingSlide = briefing.slides[slide.index]
    const slideOverlayConfig = briefingSlide?.overlayConfig

    // Usa descricao do diretor criativo se disponivel
    const overlayDescription = slideOverlayConfig?.description || ''
    const designReference = overlayStyle?.designReference || ''
    const gradientDirection = overlayStyle?.gradientDirection || 'bottom-up'
    const cornerRadius = overlayStyle?.cornerRadius || 'subtle'
    const padding = overlayStyle?.padding || 'normal'
    const opacity = overlayStyle?.opacity || 0.75

    // Constroi secao de overlay
    const overlayType = typography.backgroundStyle || 'gradient'
    const technicalDescription = technicalBackgroundDescriptions[overlayType]

    // Adiciona direcao do gradiente se aplicavel
    const gradientDirectionText =
      overlayType === 'gradient'
        ? `
- Gradient direction: ${gradientDirection === 'bottom-up' ? 'from bottom edge upward' : gradientDirection === 'top-down' ? 'from top edge downward' : gradientDirection === 'left-right' ? 'from left to right' : 'radial from center'}`
        : ''

    return `Create a professional social media graphic that is EXACTLY like the reference image, but with TEXT OVERLAY added.

# CRITICAL: TEXT TO RENDER
The following text MUST appear in the image, spelled EXACTLY as shown:
"${typography.text}"

# TEXT STYLING
- Font: ${typography.fontFamily} ${typography.fontStyle}
- Size: ${sizeDescriptions[typography.size]}
- Color: ${typography.color}
- Position: ${positionDescriptions[typography.position]}
- Alignment: ${typography.alignment}
${typography.shadow ? '- Add subtle drop shadow for readability' : ''}
${typography.outline ? '- Add thin outline around text' : ''}

# OVERLAY/SCRIM DESIGN (CRITICAL FOR QUALITY)
${designReference ? `Design Reference: ${designReference}` : ''}
${overlayDescription ? `\nCreative Director's Vision: ${overlayDescription}` : ''}

Technical Specification:
${technicalDescription}
${gradientDirectionText}
- Target opacity: ${Math.round(opacity * 100)}%
- Corner radius: ${cornerRadius === 'none' ? 'sharp corners' : cornerRadius === 'subtle' ? '8px rounded corners' : '16px rounded corners'}
- Padding: ${padding === 'compact' ? 'minimal padding (16px)' : padding === 'normal' ? 'comfortable padding (24-32px)' : 'generous padding (40px+)'}

# OVERLAY QUALITY STANDARDS (MUST FOLLOW)
- Background overlays MUST have clean, geometric shapes (rectangles)
- NO irregular, organic, or amorphous text backgrounds
- Edges must be sharp and well-defined (not fuzzy or bleeding into image)
- Gradient transitions must be perfectly smooth without visible banding
- Blur effects must look like modern UI glassmorphism (iOS/macOS style)
- Opacity must be consistent throughout the overlay area
- Overlay must not distort the underlying image beyond necessary darkening

# VISUAL STYLE
- Maintain the EXACT same visual style as the reference image
- Keep the same color palette: ${briefing.colorPalette.join(', ')}
- Preserve the composition and focal point
- Style: ${briefing.visualStyle}
- Mood: ${briefing.moodKeywords.join(', ')}

# TYPOGRAPHY RULES
- Text MUST be perfectly legible and crisp
- Text MUST be spelled correctly with no errors
- Use professional kerning and letter-spacing
- Ensure high contrast between text and overlay background
- Text should look like professional graphic design from premium brands

# BRAND CONTEXT
- Brand: ${context.brandName}
${context.sector ? `- Industry: ${context.sector}` : ''}
- Platform: ${context.platform}
- Purpose: ${slide.purpose} slide
${context.prompts?.image ? `\n# BRAND CUSTOM IMAGE STYLE GUIDELINES\n${context.prompts.image}` : ''}

# TECHNICAL REQUIREMENTS
- Output: 1024x1024 pixels
- High resolution, sharp text and clean overlay edges
- Professional social media quality (Nike, Apple, Tesla level)
- Ready for ${context.platform} carousel

IMPORTANT: The text "${typography.text}" must be the EXACT text shown in the final image. Do not paraphrase or change it. The overlay must look like it was created by a professional graphic designer, not AI-generated.`
  }
}
