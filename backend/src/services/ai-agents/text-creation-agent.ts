// Agente de Criacao de Texto
// Responsavel por criar caption geral e textos opcionais para cada slide

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type { AgentContext, AgentExecution, CreativeBriefing, CarouselSlide, SlidePurpose } from './types'

interface SlideTextResult {
  slides: CarouselSlide[]
  caption: string
}

export class TextCreationAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'textCreation', 'gpt-4o')
  }

  async execute(
    context: AgentContext,
    input: { briefing: CreativeBriefing }
  ): Promise<{
    result: SlideTextResult
    executions: AgentExecution[]
  }> {
    const provider = await this.getProvider(undefined, context)
    const model = this.getModel(context)
    const executions: AgentExecution[] = []

    // First: generate general caption + decide which slides need text
    const systemPrompt = `You are a senior copywriter specialized in ${context.platform}.

# BRAND CONTEXT
Name: ${context.brandName}
Tone: ${context.toneOfVoice || 'Professional but approachable'}
Audience: ${context.targetAudience || 'General'}
${context.preferredWords?.length ? `Preferred Words: ${context.preferredWords.join(', ')}` : ''}
${context.avoidedWords?.length ? `NEVER USE: ${context.avoidedWords.join(', ')}` : ''}

# CREATIVE BRIEFING
Concept: ${input.briefing.concept}
Narrative: ${input.briefing.narrative}
Mood: ${input.briefing.moodKeywords.join(', ')}

# COPYWRITING GUIDELINES
1. Use AIDA framework (Attention, Interest, Desire, Action) for the caption
2. First line of caption MUST be a HOOK (80% of people only read this)
3. Use line breaks for mobile readability
4. Emojis: use sparingly and only if appropriate for the brand
5. CTAs must be specific ("Comment 'YES' to learn more" > "Follow me")

# CHARACTER LIMITS
- ${context.platform === 'twitter' ? 'Twitter/X: max 280 characters' : context.platform === 'linkedin' ? 'LinkedIn: max 3000 characters (ideal: 150-300 for engagement)' : 'Instagram Caption: max 2200 characters (ideal: 125-150 for engagement)'}
- Slide text overlay: max 50-100 characters (mobile legibility)

# SLIDE STRUCTURE
For each slide, create text content based on the briefing:

Planned slides:
${input.briefing.slides.map((s, i) => `${i + 1}. ${s.purpose}: ${s.keyMessage}`).join('\n')}

# YOUR TASK
Create the following content:

1. "caption": General post description (appears below the carousel on ${context.platform}).
   - Include relevant hashtags (5-10 for Instagram, 2-3 for Twitter)
   - Make it engaging with a clear call-to-action
   - Use line breaks for readability

2. "slides": Array with 4 objects, one for each slide.
   - "purpose": the slide's purpose (hook, features, summary, cta)
   - "text": SHORT text to overlay on image (max 50 chars) OR null if image should be clean

DECIDE for each slide if it needs text overlay or not. Product images usually look better WITHOUT text.

# OUTPUT FORMAT
Respond ONLY with valid JSON:
{"caption":"HOOK line\\n\\nBody content...\\n\\nCTA\\n\\n#hashtag1 #hashtag2", "slides":[{"purpose":"hook","text":"..." or null},{"purpose":"features","text":"..." or null},{"purpose":"summary","text":"..." or null},{"purpose":"cta","text":"..." or null}]}`

    const userPrompt = `Create textual content for a carousel about: ${context.originalPrompt}`

    const maxTokens = await this.getMaxTokens(context)

    const { result, execution } = await this.executeText(
      provider,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens
      },
      context,
      systemPrompt,
      userPrompt
    )

    executions.push(execution)

    // Parse do JSON
    let textContent: { caption: string; slides: Array<{ purpose: SlidePurpose; text: string | null }> }
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON nao encontrado na resposta')
      textContent = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error(`Falha ao parsear conteudo textual: ${result.content}`)
    }

    // Mapeia slides com texto
    const slides: CarouselSlide[] = textContent.slides.map((slideText, i) => ({
      index: i,
      purpose: slideText.purpose,
      text: slideText.text || undefined
    }))

    return {
      result: {
        slides,
        caption: textContent.caption
      },
      executions
    }
  }
}
