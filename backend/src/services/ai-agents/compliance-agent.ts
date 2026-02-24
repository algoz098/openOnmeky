// Agente de Compliance
// Responsavel por validar se o conteudo gerado segue as diretrizes da marca

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type { AgentContext, AgentExecution, CarouselSlide, ComplianceResult } from './types'

interface ComplianceInput {
  slides: CarouselSlide[]
}

export class ComplianceAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'compliance', 'gpt-4o')
  }

  async execute(
    context: AgentContext,
    input: ComplianceInput
  ): Promise<{
    result: ComplianceResult
    executions: AgentExecution[]
  }> {
    const provider = await this.getProvider(undefined, context)
    const model = this.getModel(context)

    const systemPrompt = `You are a brand compliance and content marketing specialist.

# BRAND GUIDELINES
Name: ${context.brandName}
${context.toneOfVoice ? `Required Tone of Voice: ${context.toneOfVoice}` : ''}
${context.values?.length ? `Core Values: ${context.values.join(', ')}` : ''}
${context.preferredWords?.length ? `Preferred Words: ${context.preferredWords.join(', ')}` : ''}
${context.avoidedWords?.length ? `PROHIBITED Words: ${context.avoidedWords.join(', ')}` : ''}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}
Platform: ${context.platform}

# VALIDATION CHECKLIST
1. **Tone of Voice**: Does the content reflect the brand's tone?
2. **Prohibited Words**: Were any words from the blacklist used? (severity: high)
3. **Brand Values**: Are the messages aligned with brand values?
4. **Audience Appropriateness**: Is the language appropriate for the target demographic?
5. **Legal Compliance**:
   - Exaggerated or misleading promises? (severity: high)
   - Unverifiable claims? (e.g., "best in the market")
   - Information that requires disclaimer?
6. **Sensitivity**:
   - Could the content be offensive to any group?
   - Are stereotypes present?
7. **Accessibility**:
   - Is text readable on small images?
   - Is adequate contrast mentioned?

# SEVERITY SCALE
- low: Improvement suggestion, does not block publication
- medium: Should be corrected before publishing
- high: Serious violation, blocks publication

# OUTPUT FORMAT
Respond ONLY with valid JSON:
{
  "approved": boolean,
  "violations": [
    {"type": "prohibited_word|tone_mismatch|misleading_claim|sensitivity|accessibility", "description": "...", "severity": "low|medium|high", "location": "slide X or caption"}
  ],
  "suggestions": ["Specific correction suggestion"],
  "accessibilityNotes": ["Check contrast", "Font too small in slide 2"]
}`

    // Filter only slides that have text to validate
    const slidesWithText = input.slides.filter(s => s.text)
    const slidesContent = slidesWithText.map((s, i) => `Slide ${i + 1} (${s.purpose}): ${s.text}`).join('\n')

    // If no slide has text, automatically approve
    if (slidesWithText.length === 0) {
      return {
        result: {
          approved: true,
          violations: [],
          suggestions: []
        },
        executions: []
      }
    }

    const userPrompt = `Validate this carousel content:

${slidesContent}

Original topic: ${context.originalPrompt}`

    const { result, execution } = await this.executeText(
      provider,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        maxTokens: 1500
      },
      context,
      systemPrompt,
      userPrompt
    )

    // Parse do JSON
    let compliance: ComplianceResult
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('JSON nao encontrado na resposta')
      compliance = JSON.parse(jsonMatch[0])
    } catch {
      // Se falhar o parse, considera aprovado
      compliance = {
        approved: true,
        violations: [],
        suggestions: []
      }
    }

    return {
      result: compliance,
      executions: [execution]
    }
  }

  // Verifica se precisa corrigir e retorna feedback para o agente de texto
  getCorrectionFeedback(compliance: ComplianceResult): string | null {
    if (compliance.approved) return null

    const feedback = ['Correcoes necessarias:']

    for (const violation of compliance.violations) {
      feedback.push(`- [${violation.severity.toUpperCase()}] ${violation.type}: ${violation.description}`)
    }

    if (compliance.suggestions.length > 0) {
      feedback.push('\nSugestoes:')
      for (const suggestion of compliance.suggestions) {
        feedback.push(`- ${suggestion}`)
      }
    }

    return feedback.join('\n')
  }
}
