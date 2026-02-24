// Agente de Direcao Criativa
// Responsavel por definir briefing, conceito e narrativa do carrousel

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type { AgentContext, AgentExecution, CreativeBriefing } from './types'
import type { AIMessageContent } from '../ai-providers/ai-provider.interface'

export class CreativeDirectionAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'creativeDirection', 'gpt-4o')
  }

  async execute(context: AgentContext): Promise<{
    result: CreativeBriefing
    executions: AgentExecution[]
  }> {
    const provider = await this.getProvider(undefined, context)
    const model = this.getModel(context)

    const hasReferenceImages = context.referenceImages && context.referenceImages.length > 0

    // Determina referencias de design baseado no setor
    const sectorDesignHints = this.getSectorDesignHints(context.sector)

    const systemPrompt = `You are a senior creative director specialized in social media content and visual design.

# BRAND CONTEXT
Name: ${context.brandName}
${context.brandDescription ? `Description: ${context.brandDescription}` : ''}
${context.sector ? `Industry/Sector: ${context.sector}` : ''}
${context.toneOfVoice ? `Tone of Voice: ${context.toneOfVoice}` : ''}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}
${context.values?.length ? `Brand Values: ${context.values.join(', ')}` : ''}
${context.brandColors?.length ? `Brand Colors: ${context.brandColors.join(', ')}` : ''}
${context.competitors?.length ? `Competitors (design benchmark): ${context.competitors.join(', ')}` : ''}

# PLATFORM: ${context.platform.toUpperCase()}

# CAROUSEL STRUCTURE (4 SLIDES)
1. HOOK: First slide must capture attention in 1-2 seconds. Use provocative question, surprising statistic, or bold statement.
2. FEATURES: Present 2-3 main benefits/features. Use visual bullet points.
3. SUMMARY: Summarize the value proposition. Create urgency or desire.
4. CTA: Clear and specific call-to-action. Use action verbs.

# CREATIVE RULES
- Each slide must work independently but create a cohesive narrative
- Use language that resonates with the target audience
- Avoid technical jargon unless relevant to the niche
- The concept should be replicable for future campaigns
- Be CONCISE: max 50 words per "direction" and 15 words per "keyMessage"

# TEXT OVERLAY & SCRIM DESIGN (CRITICAL)
You MUST define professional text overlay styling. Think like a graphic designer creating premium social media content.
${sectorDesignHints}

## OVERLAY TYPES:
- "gradient": Smooth gradient scrim (dark to transparent) - best for cinematic, editorial looks
- "blur": Frosted glass/glassmorphism effect - best for modern, tech, premium brands
- "solid": Clean solid color panel with transparency - best for bold, corporate, minimalist
- "none": No overlay, text directly on image with strong shadow - only for simple backgrounds

## OVERLAY QUALITY STANDARDS:
- Overlays must have clean geometric shapes (rectangles with rounded corners)
- Gradients must be smooth without visible banding (like CSS linear-gradient)
- Blur effects must look like modern UI glassmorphism (iOS/macOS style)
- Opacity should ensure text is perfectly readable (0.65-0.85 range)
- Consistent padding and positioning across all slides
- Edges must be sharp and well-defined, NOT fuzzy or irregular

## OVERLAY TECHNICAL SPECIFICATIONS (USE IN DESCRIPTIONS):
When describing overlays, include these specific details:
- Coverage area: "covering X% of image height/width"
- Gradient transition: "smooth transition from X% opacity to Y% opacity over Z% of the area"
- Shape: "rectangular panel with Xpx rounded corners"
- Padding: "Xpx padding around text"
- Position anchor: "anchored to bottom/top/center edge"
- Color: "using brand color #HEX at X% opacity" or "dark neutral (black) at X% opacity"

${
  hasReferenceImages
    ? `# REFERENCE IMAGES
Analyze the attached images and extract:
- Predominant visual style
- Color palette
- Composition and framing
- Mood/atmosphere
- How text overlays should complement the imagery
Use these references to inform your briefing.
`
    : ''
}

# OUTPUT FORMAT
Respond ONLY with valid JSON, no markdown:
{
  "concept": "Brief creative concept description",
  "narrative": "Story arc across the 4 slides",
  "visualStyle": "Visual style description",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "moodKeywords": ["keyword1", "keyword2", "keyword3"],
  "typography": {
    "fontFamily": "sans-serif|serif|display|handwritten",
    "primaryColor": "#FFFFFF",
    "secondaryColor": "#hex",
    "style": "modern|classic|playful|elegant|bold"
  },
  "overlayStyle": {
    "designReference": "Description of visual reference style (e.g., 'Apple keynote minimalism with clean gradients', 'luxury editorial with subtle frosted panels')",
    "defaultType": "gradient|blur|solid|none",
    "gradientDirection": "bottom-up|top-down|left-right|radial",
    "opacity": 0.75,
    "cornerRadius": "none|subtle|rounded",
    "padding": "compact|normal|spacious"
  },
  "slides": [
    {
      "purpose": "hook",
      "direction": "Visual and content direction for this slide",
      "keyMessage": "Short text for overlay (max 15 words)",
      "overlayConfig": {
        "type": "gradient|blur|solid|none",
        "position": "center|top|bottom|top-left|top-right|bottom-left|bottom-right",
        "description": "Detailed description: e.g., 'Cinematic dark gradient rising from bottom edge, covering 35% of image height, smooth transition from 80% opacity black to fully transparent, creating dramatic movie-poster effect'"
      }
    },
    {
      "purpose": "features",
      "direction": "...",
      "keyMessage": "...",
      "overlayConfig": {
        "type": "...",
        "position": "...",
        "description": "Detailed visual description of overlay for this slide"
      }
    },
    {
      "purpose": "summary",
      "direction": "...",
      "keyMessage": "...",
      "overlayConfig": {
        "type": "...",
        "position": "...",
        "description": "Detailed visual description of overlay for this slide"
      }
    },
    {
      "purpose": "cta",
      "direction": "...",
      "keyMessage": "...",
      "overlayConfig": {
        "type": "...",
        "position": "...",
        "description": "Detailed visual description of overlay for this slide"
      }
    }
  ]
}`

    const userPromptText = `Create a creative briefing for a carousel about: ${context.originalPrompt}${hasReferenceImages ? ' (analyze the attached reference images to extract visual style)' : ''}`

    // Constroi mensagem do usuario com imagens de referencia se disponiveis
    let userContent: string | AIMessageContent[]

    if (hasReferenceImages) {
      // Envia imagens para analise visual em modelos multimodais
      const imageContents: AIMessageContent[] = context.referenceImages!.map(url => ({
        type: 'image' as const,
        url
      }))

      userContent = [{ type: 'text' as const, text: userPromptText }, ...imageContents]

      console.log(
        `[CreativeDirectionAgent] Enviando ${context.referenceImages!.length} imagens de referencia para analise visual`
      )
    } else {
      userContent = userPromptText
    }

    const maxTokens = await this.getMaxTokens(context)

    const { result, execution } = await this.executeText(
      provider,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
        maxTokens
      },
      context,
      systemPrompt,
      userPromptText
    )

    // Parse do JSON
    let briefing: CreativeBriefing
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON nao encontrado na resposta')
      briefing = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error(`Falha ao parsear briefing: ${result.content}`)
    }

    return {
      result: briefing,
      executions: [execution]
    }
  }

  /**
   * Returns sector-specific design hints to guide overlay/scrim styling decisions
   */
  private getSectorDesignHints(sector?: string): string {
    if (!sector) {
      return `## DEFAULT DESIGN REFERENCES:
- Apple keynote presentations (clean, minimal, premium)
- Premium Instagram carousels (consistent, professional)
- Modern editorial layouts (sophisticated, balanced)`
    }

    const sectorLower = sector.toLowerCase()

    // Tech / SaaS / Software
    if (
      sectorLower.includes('tech') ||
      sectorLower.includes('saas') ||
      sectorLower.includes('software') ||
      sectorLower.includes('tecnologia')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (TECH/SAAS):
- Use GLASSMORPHISM (blur) overlays like iOS/macOS interfaces
- Clean, minimal aesthetic like Apple or Stripe presentations
- Subtle gradients with low opacity (0.6-0.75)
- Sans-serif typography, modern and geometric
- Reference: Apple WWDC slides, Linear app UI, Vercel website`
    }

    // Luxury / Fashion / Beauty
    if (
      sectorLower.includes('luxo') ||
      sectorLower.includes('luxury') ||
      sectorLower.includes('moda') ||
      sectorLower.includes('fashion') ||
      sectorLower.includes('beleza') ||
      sectorLower.includes('beauty') ||
      sectorLower.includes('joias') ||
      sectorLower.includes('jewelry')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (LUXURY/FASHION):
- Use sophisticated GRADIENT overlays (cinematic, editorial)
- Elegant serif or thin sans-serif typography
- High contrast with deep blacks and crisp whites
- Subtle gold or brand accent colors in overlays
- Reference: Vogue editorials, Chanel campaigns, luxury hotel branding`
    }

    // Food / Restaurant / Beverage
    if (
      sectorLower.includes('food') ||
      sectorLower.includes('aliment') ||
      sectorLower.includes('restaurante') ||
      sectorLower.includes('restaurant') ||
      sectorLower.includes('bebida') ||
      sectorLower.includes('beverage') ||
      sectorLower.includes('cafe') ||
      sectorLower.includes('coffee')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (FOOD/BEVERAGE):
- Use SOLID color panels with vibrant but not overwhelming colors
- Warm, appetizing color palette (avoid cold blues)
- Bold, friendly typography that pops
- Clean panels that don't obscure food imagery
- Reference: Starbucks campaigns, premium restaurant menus, food magazines`
    }

    // Fitness / Sports / Health
    if (
      sectorLower.includes('fitness') ||
      sectorLower.includes('sport') ||
      sectorLower.includes('esport') ||
      sectorLower.includes('saude') ||
      sectorLower.includes('health') ||
      sectorLower.includes('academia') ||
      sectorLower.includes('gym')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (FITNESS/SPORTS):
- Use bold GRADIENT overlays with high energy feel
- Dynamic, impactful typography (bold, condensed)
- High contrast, dramatic lighting effects
- Energetic color accents (neon, electric)
- Reference: Nike campaigns, Under Armour, Peloton marketing`
    }

    // Finance / Insurance / Consulting
    if (
      sectorLower.includes('financ') ||
      sectorLower.includes('banco') ||
      sectorLower.includes('bank') ||
      sectorLower.includes('seguro') ||
      sectorLower.includes('insurance') ||
      sectorLower.includes('consult')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (FINANCE/CONSULTING):
- Use clean SOLID or subtle GRADIENT overlays
- Professional, trustworthy aesthetic
- Conservative color palette (blues, greens, neutrals)
- Clear hierarchy and structured layouts
- Reference: Bloomberg design, McKinsey reports, premium fintech apps`
    }

    // Education / Courses / Training
    if (
      sectorLower.includes('educa') ||
      sectorLower.includes('curso') ||
      sectorLower.includes('course') ||
      sectorLower.includes('treinamento') ||
      sectorLower.includes('training')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (EDUCATION):
- Use friendly SOLID panels with accessible colors
- Clear, readable typography (avoid overly decorative)
- Welcoming, approachable aesthetic
- Good contrast for readability
- Reference: Coursera, Masterclass, modern university branding`
    }

    // Real Estate / Architecture / Interior
    if (
      sectorLower.includes('imobil') ||
      sectorLower.includes('real estate') ||
      sectorLower.includes('arquitetura') ||
      sectorLower.includes('architecture') ||
      sectorLower.includes('interior')
    ) {
      return `## SECTOR-SPECIFIC DESIGN (REAL ESTATE/ARCHITECTURE):
- Use elegant GRADIENT overlays that enhance property imagery
- Sophisticated, premium aesthetic
- Minimal text interference with visuals
- Clean lines and geometric precision
- Reference: Architectural Digest, luxury real estate brochures`
    }

    // Default fallback for unknown sectors
    return `## DESIGN REFERENCES FOR ${sector.toUpperCase()}:
- Study top competitors in this sector for design cues
- Use professional, clean overlays appropriate for the industry
- Prioritize readability and brand consistency
- Reference: Premium brands in the ${sector} sector`
  }
}
