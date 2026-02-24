// Agente de Analise
// Responsavel por validar briefings e textos antes de continuar

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type { AgentContext, AgentExecution, AnalysisResult, CreativeBriefing } from './types'

export class AnalysisAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'analysis', 'gpt-4o-mini')
  }

  async execute(
    context: AgentContext,
    input: { briefing: CreativeBriefing }
  ): Promise<{
    result: AnalysisResult
    executions: AgentExecution[]
  }> {
    const provider = await this.getProvider(undefined, context)
    const model = this.getModel(context)

    const systemPrompt = `You are a content analyst with expertise in social media performance.

# EVALUATION CRITERIA (Scoring 0-100)
Evaluate each criterion from 0-20 points:

1. **HOOK Power (20pts)**: Does the first slide stop the scroll?
2. **Message Clarity (20pts)**: Is the value proposition clear?
3. **Brand Alignment (20pts)**: Are tone and values consistent with the brand?
4. **Call-to-Action (20pts)**: Is the CTA clear and actionable?
5. **Originality (20pts)**: Does it avoid cliches and bring something unique?

# BRAND CONTEXT
Name: ${context.brandName}
${context.toneOfVoice ? `Expected Tone: ${context.toneOfVoice}` : ''}
${context.values?.length ? `Values to Convey: ${context.values.join(', ')}` : ''}
${context.preferredWords?.length ? `Preferred Words: ${context.preferredWords.join(', ')}` : ''}
${context.avoidedWords?.length ? `Words to AVOID: ${context.avoidedWords.join(', ')}` : ''}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}
Platform: ${context.platform}

# OUTPUT FORMAT
Respond ONLY with valid JSON:
{
  "approved": boolean (true if score >= 70),
  "score": 0-100,
  "scoreBreakdown": {
    "hookPower": 0-20,
    "messageClarity": 0-20,
    "brandAlignment": 0-20,
    "ctaEffectiveness": 0-20,
    "originality": 0-20
  },
  "feedback": "General analysis in 2-3 sentences",
  "strengths": ["Strength 1", "Strength 2"],
  "suggestions": ["Improvement 1", "Improvement 2"],
  "predictedEngagement": "low|medium|high"
}`

    const userPrompt = `Analyze this creative briefing:
${JSON.stringify(input.briefing, null, 2)}

Original topic requested: ${context.originalPrompt}`

    const { result, execution } = await this.executeText(
      provider,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        maxTokens: 1000
      },
      context,
      systemPrompt,
      userPrompt
    )

    // Parse do JSON
    let analysis: AnalysisResult
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON nao encontrado na resposta')
      analysis = JSON.parse(jsonMatch[0])
    } catch {
      // Se falhar o parse, considera aprovado com score medio
      analysis = {
        approved: true,
        score: 70,
        feedback: 'Analise nao pode ser parseada, prosseguindo com cautela',
        suggestions: []
      }
    }

    return {
      result: analysis,
      executions: [execution]
    }
  }
}
