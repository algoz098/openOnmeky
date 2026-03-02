// Agente de Geracao de Musica
// Responsavel por gerar trilhas sonoras instrumentais para carousels
// Usa Google Lyria via Vertex AI para geracao de audio

import type { Application } from '../../declarations'
import { BaseAgent } from './base-agent'
import type { AgentContext, AgentExecution, CreativeBriefing } from './types'
import type { GenerateAudioOptions, GenerateAudioResult } from '../ai-providers'
import type { MediaService } from '../medias/medias.class'

export interface MusicGenerationInput {
  briefing?: CreativeBriefing
  // Opcoes customizadas para geracao de musica
  genre?: string
  mood?: string
  tempo?: number // BPM
  customPrompt?: string
  // Contexto do post para geracao contextualizada
  postContent?: string
  slideTexts?: string[]
  slideDescriptions?: string[]
}

export interface MusicGenerationOutput {
  audioUrl: string
  audioBase64?: string
  format: string
  durationSeconds: number
  prompt: string
}

export class MusicGenerationAgent extends BaseAgent {
  constructor(app: Application) {
    super(app, 'musicGeneration', 'lyria-realtime-exp')
  }

  async execute(
    context: AgentContext,
    input: MusicGenerationInput
  ): Promise<{
    result: MusicGenerationOutput
    executions: AgentExecution[]
  }> {
    console.log('[MusicGenerationAgent] Iniciando geracao de musica')
    console.log('[MusicGenerationAgent] Context brand:', context.brandName)

    // Obtem modelo preferido da configuracao
    const model = this.getModel(context)
    console.log('[MusicGenerationAgent] Modelo:', model)

    // Constroi prompt baseado no briefing criativo e contexto da marca
    const musicPrompt = this.buildMusicPrompt(context, input)
    console.log('[MusicGenerationAgent] Prompt:', musicPrompt)

    const startedAt = new Date().toISOString()

    try {
      // Obtem provider para geracao de audio
      const provider = await this.getProviderForAudio(model)
      console.log(`[MusicGenerationAgent] Provider: ${provider.name}`)

      // Verifica se provider suporta geracao de audio
      if (!provider.generateAudio) {
        throw new Error(`Provider ${provider.name} nao suporta geracao de audio`)
      }

      // Opcoes de geracao
      const audioOptions: GenerateAudioOptions = {
        prompt: musicPrompt,
        model,
        genre: input.genre,
        mood: input.mood,
        tempo: input.tempo
      }

      console.log('[MusicGenerationAgent] Chamando generateAudio...')
      const result: GenerateAudioResult = await provider.generateAudio(audioOptions)
      console.log('[MusicGenerationAgent] Audio gerado com sucesso')

      // Salva o audio localmente se tiver base64
      let localAudioUrl: string | undefined
      if (result.audioBase64) {
        const mediaService = this.app.service('medias') as MediaService
        console.log('[MusicGenerationAgent] Salvando audio localmente...')

        const savedMedia = await mediaService.saveFromBase64(
          result.audioBase64,
          `music-${context.brandId}-${Date.now()}.${result.format || 'wav'}`,
          context.userId,
          'ai-generated'
        )
        localAudioUrl = savedMedia.url
        console.log(`[MusicGenerationAgent] Audio salvo: ${localAudioUrl}`)
      }

      const execution: AgentExecution = {
        agentType: this.agentType,
        provider: provider.name,
        model: result.model || model,
        startedAt,
        completedAt: new Date().toISOString(),
        systemPrompt: 'Music generation via Lyria',
        userPrompt: musicPrompt,
        result: `Audio gerado: ${result.durationSeconds}s, formato ${result.format}`,
        status: 'success'
      }

      return {
        result: {
          audioUrl: localAudioUrl || result.audioUrl || '',
          audioBase64: result.audioBase64,
          format: result.format || 'wav',
          durationSeconds: result.durationSeconds || 30,
          prompt: musicPrompt
        },
        executions: [execution]
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error(`[MusicGenerationAgent] ERRO: ${errorMessage}`)

      const execution: AgentExecution = {
        agentType: this.agentType,
        provider: 'google',
        model,
        startedAt,
        completedAt: new Date().toISOString(),
        systemPrompt: 'Music generation via Lyria',
        userPrompt: musicPrompt,
        error: errorMessage,
        status: 'failed'
      }

      throw { error, execution }
    }
  }

  // Constroi prompt otimizado para geracao de musica contextualizada
  private buildMusicPrompt(context: AgentContext, input: MusicGenerationInput): string {
    // Se usuario passou prompt customizado, usa ele
    if (input.customPrompt) {
      return input.customPrompt
    }

    // Componentes do prompt
    const parts: string[] = []

    // 1. Genero musical (prioridade: input > setor)
    if (input.genre) {
      parts.push(input.genre)
    } else {
      parts.push(this.inferGenreFromSector(context.sector))
    }

    parts.push('instrumental music')

    // 2. Mood/atmosfera (prioridade: input > briefing > slide descriptions)
    if (input.mood) {
      parts.push(`with ${input.mood} mood`)
    } else if (input.briefing?.moodKeywords?.length) {
      parts.push(`with ${input.briefing.moodKeywords.slice(0, 3).join(', ')} mood`)
    } else if (input.briefing?.visualStyle) {
      parts.push(`with ${input.briefing.visualStyle} atmosphere`)
    }

    // 3. Contexto do conteudo do post
    if (input.postContent) {
      // Extrai palavras-chave do post
      const keywords = this.extractKeywords(input.postContent)
      if (keywords.length > 0) {
        parts.push(`theme: ${keywords.join(', ')}`)
      }
    }

    // 4. Contexto dos slides do carousel
    if (input.slideTexts?.length) {
      const slideKeywords = input.slideTexts
        .filter(t => t && t.length > 0)
        .slice(0, 3)
        .map(t => this.extractKeywords(t).slice(0, 2))
        .flat()
        .filter((v, i, a) => a.indexOf(v) === i) // unique
        .slice(0, 5)

      if (slideKeywords.length > 0) {
        parts.push(`content about: ${slideKeywords.join(', ')}`)
      }
    }

    // 5. Descricoes visuais das imagens
    if (input.slideDescriptions?.length) {
      const visualContext = input.slideDescriptions
        .filter(d => d && d.length > 0)
        .slice(0, 2)
        .join('; ')
        .slice(0, 100)

      if (visualContext) {
        parts.push(`visual context: ${visualContext}`)
      }
    }

    // 6. Briefing criativo (conceito e narrativa)
    if (input.briefing) {
      if (input.briefing.concept) {
        parts.push(`concept: ${input.briefing.concept.slice(0, 60)}`)
      }
      if (input.briefing.narrative) {
        parts.push(`narrative: ${input.briefing.narrative.slice(0, 60)}`)
      }
    }

    // 6b. Audiencia alvo do contexto
    if (context.targetAudience) {
      parts.push(`for ${context.targetAudience} audience`)
    }

    // 7. Contexto da marca
    if (context.brandDescription) {
      parts.push(`brand: ${context.brandDescription.slice(0, 80)}`)
    }

    // 8. Tom de voz da marca (mapeia para caracteristica musical)
    if (context.toneOfVoice) {
      const toneToMusic = this.mapToneToMusic(context.toneOfVoice)
      if (toneToMusic) {
        parts.push(toneToMusic)
      }
    }

    // 9. Contexto da plataforma
    if (context.platform === 'instagram') {
      parts.push('suitable for Instagram Reels, short and catchy')
    } else if (context.platform === 'tiktok') {
      parts.push('suitable for TikTok, trendy and engaging')
    } else if (context.platform === 'youtube') {
      parts.push('suitable for YouTube Shorts, dynamic')
    }

    return parts.join(', ')
  }

  // Extrai palavras-chave relevantes de um texto
  private extractKeywords(text: string): string[] {
    // Remove pontuacao e converte para minusculas
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ')

    // Palavras a ignorar (stopwords basicas)
    const stopwords = new Set([
      'o',
      'a',
      'os',
      'as',
      'um',
      'uma',
      'de',
      'da',
      'do',
      'em',
      'no',
      'na',
      'para',
      'com',
      'por',
      'que',
      'se',
      'e',
      'ou',
      'mas',
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'and',
      'or',
      'but',
      'if',
      'then',
      'else',
      'when',
      'at',
      'by',
      'for',
      'with',
      'about',
      'against',
      'between',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'to',
      'from',
      'up',
      'down',
      'in',
      'out',
      'on',
      'off',
      'over',
      'under',
      'again',
      'further',
      'then',
      'once',
      'voce',
      'seu',
      'sua',
      'isso',
      'este',
      'esta',
      'esse',
      'essa',
      'aqui',
      'como',
      'mais',
      'muito',
      'tambem',
      'so',
      'ja',
      'ainda',
      'agora',
      'sempre'
    ])

    // Extrai palavras significativas
    const words = cleaned
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w))
      .slice(0, 10)

    return [...new Set(words)].slice(0, 5)
  }

  // Mapeia tom de voz para caracteristicas musicais
  private mapToneToMusic(tone: string): string | null {
    const toneMap: Record<string, string> = {
      formal: 'sophisticated and elegant',
      informal: 'relaxed and friendly',
      professional: 'confident and polished',
      casual: 'laid-back and approachable',
      energetic: 'upbeat and dynamic',
      calm: 'peaceful and serene',
      playful: 'fun and lighthearted',
      serious: 'dramatic and intense',
      inspirational: 'uplifting and motivating',
      luxurious: 'refined and premium'
    }

    const lowerTone = tone.toLowerCase()
    for (const [key, value] of Object.entries(toneMap)) {
      if (lowerTone.includes(key)) {
        return value
      }
    }
    return null
  }

  // Infere genero musical baseado no setor da marca
  private inferGenreFromSector(sector?: string): string {
    if (!sector) return 'modern pop'

    const sectorToGenre: Record<string, string> = {
      tech: 'electronic ambient',
      technology: 'electronic ambient',
      fashion: 'modern pop',
      moda: 'modern pop',
      food: 'upbeat acoustic',
      alimentos: 'upbeat acoustic',
      restaurant: 'jazz lounge',
      restaurante: 'jazz lounge',
      fitness: 'energetic EDM',
      sports: 'energetic EDM',
      esportes: 'energetic EDM',
      beauty: 'soft R&B',
      beleza: 'soft R&B',
      cosmetics: 'soft R&B',
      travel: 'world music',
      viagem: 'world music',
      finance: 'corporate ambient',
      financas: 'corporate ambient',
      education: 'inspiring orchestral',
      educacao: 'inspiring orchestral',
      health: 'calm wellness',
      saude: 'calm wellness',
      luxury: 'elegant classical',
      luxo: 'elegant classical',
      gaming: 'cinematic electronic',
      entertainment: 'upbeat pop'
    }

    const lowerSector = sector.toLowerCase()
    return sectorToGenre[lowerSector] || 'modern pop'
  }
}
