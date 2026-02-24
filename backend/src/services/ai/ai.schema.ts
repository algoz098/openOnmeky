// Schemas para o servico de IA
import { resolve } from '@feathersjs/schema'
import { Type, getValidator } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator } from '../../validators'
import type { AIService } from './ai.class'

// Tipos de operacao suportados
export const aiOperationTypes = ['generate', 'rewrite', 'adapt', 'suggest-hashtags', 'carousel'] as const
export type AIOperationType = (typeof aiOperationTypes)[number]

// Providers disponiveis
export const aiProviderNames = ['openai', 'google', 'ollama', 'anthropic', 'groq'] as const
export type AIProviderType = (typeof aiProviderNames)[number]

// Plataformas de redes sociais
export const socialPlatforms = ['twitter', 'instagram', 'linkedin', 'threads', 'facebook', 'tiktok'] as const
export type SocialPlatform = (typeof socialPlatforms)[number]

// Schema para imagem enviada ao prompt
export const aiImageSchema = Type.Object({
  url: Type.String({ description: 'URL da imagem' }),
  mimeType: Type.Optional(Type.String({ description: 'Tipo MIME da imagem' }))
})
export type AIImage = Static<typeof aiImageSchema>

// Schema de entrada para geracao de conteudo
export const aiDataSchema = Type.Object(
  {
    brandId: Type.Number({ description: 'ID da marca para contexto' }),
    type: Type.Union(
      aiOperationTypes.map(t => Type.Literal(t)),
      {
        description: 'Tipo de operacao'
      }
    ),
    prompt: Type.Optional(Type.String({ description: 'Prompt ou topico para geracao' })),
    images: Type.Optional(
      Type.Array(aiImageSchema, { description: 'Imagens para incluir no prompt (vision)' })
    ),
    platform: Type.Optional(
      Type.Union(
        socialPlatforms.map(p => Type.Literal(p)),
        {
          description: 'Plataforma de destino'
        }
      )
    ),
    provider: Type.Optional(
      Type.Union(
        aiProviderNames.map(p => Type.Literal(p)),
        {
          description: 'Provider de IA a usar'
        }
      )
    ),
    includeHashtags: Type.Optional(Type.Boolean({ description: 'Incluir hashtags no resultado' })),
    originalContent: Type.Optional(Type.String({ description: 'Conteudo original para reescrita' })),
    originalPlatform: Type.Optional(
      Type.Union(
        socialPlatforms.map(p => Type.Literal(p)),
        {
          description: 'Plataforma original (para adaptacao)'
        }
      )
    ),
    targetPlatform: Type.Optional(
      Type.Union(
        socialPlatforms.map(p => Type.Literal(p)),
        {
          description: 'Plataforma de destino (para adaptacao)'
        }
      )
    ),
    content: Type.Optional(Type.String({ description: 'Conteudo para sugestao de hashtags' })),
    // Opcao para salvar como post automaticamente
    saveAsPost: Type.Optional(Type.Boolean({ description: 'Salvar resultado como post' })),
    // ID do post existente para atualizar (em vez de criar novo)
    postId: Type.Optional(Type.Number({ description: 'ID do post existente para atualizar' })),
    // Proporcao alvo para geracao de imagens do carousel
    targetAspectRatio: Type.Optional(
      Type.Union([Type.Literal('1:1'), Type.Literal('4:5'), Type.Literal('9:16'), Type.Literal('16:9')], {
        description: 'Proporcao da imagem para o carousel'
      })
    ),
    // Flags para testes
    _forceError: Type.Optional(Type.Boolean()),
    _simulateUnavailable: Type.Optional(Type.Boolean()),
    _simulateNotRunning: Type.Optional(Type.Boolean())
  },
  { $id: 'AIData', additionalProperties: false }
)
export type AIData = Static<typeof aiDataSchema>
export const aiDataValidator = getValidator(aiDataSchema, dataValidator)
export const aiDataResolver = resolve<AIData, HookContext<AIService>>({})

// Proporcoes de imagem suportadas
export const validAspectRatios = ['1:1', '4:5', '9:16', '16:9'] as const

// Schema de versao de imagem derivada
export const imageVersionSchema = Type.Object({
  aspectRatio: Type.Union(validAspectRatios.map(r => Type.Literal(r))),
  imageUrl: Type.String(),
  size: Type.String(),
  hasText: Type.Boolean(),
  generatedAt: Type.String()
})

// Schema de metadados de geracao
export const imageGenerationMetadataSchema = Type.Object({
  provider: Type.String(),
  model: Type.String(),
  generatedAt: Type.String()
})

// Schema de tipografia
export const typographyConfigSchema = Type.Object({
  text: Type.String(),
  fontStyle: Type.Union([
    Type.Literal('bold'),
    Type.Literal('regular'),
    Type.Literal('light'),
    Type.Literal('italic')
  ]),
  fontFamily: Type.Union([
    Type.Literal('sans-serif'),
    Type.Literal('serif'),
    Type.Literal('display'),
    Type.Literal('handwritten')
  ]),
  position: Type.Union([
    Type.Literal('center'),
    Type.Literal('top'),
    Type.Literal('bottom'),
    Type.Literal('top-left'),
    Type.Literal('top-right'),
    Type.Literal('bottom-left'),
    Type.Literal('bottom-right')
  ]),
  size: Type.Union([
    Type.Literal('small'),
    Type.Literal('medium'),
    Type.Literal('large'),
    Type.Literal('xlarge')
  ]),
  color: Type.String(),
  backgroundColor: Type.Optional(Type.String()),
  backgroundStyle: Type.Optional(
    Type.Union([Type.Literal('gradient'), Type.Literal('blur'), Type.Literal('solid'), Type.Literal('none')])
  ),
  alignment: Type.Union([Type.Literal('left'), Type.Literal('center'), Type.Literal('right')]),
  shadow: Type.Optional(Type.Boolean()),
  outline: Type.Optional(Type.Boolean())
})

// Schema de slide do carrousel com suporte a master image e versoes
export const carouselSlideSchema = Type.Object({
  index: Type.Number(),
  purpose: Type.String(),
  text: Type.Optional(Type.String()), // Texto sobreposto na imagem (opcional - agente decide)
  imageUrl: Type.Optional(Type.String()), // Imagem final com texto (retrocompativel)
  imagePrompt: Type.Optional(Type.String()),
  // Novos campos para arquitetura master + derivadas
  masterImageUrl: Type.Optional(Type.String()), // Imagem base SEM texto
  typography: Type.Optional(typographyConfigSchema),
  versions: Type.Optional(
    Type.Partial(
      Type.Object({
        '1:1': imageVersionSchema,
        '4:5': imageVersionSchema,
        '9:16': imageVersionSchema,
        '16:9': imageVersionSchema
      })
    )
  ),
  generationMetadata: Type.Optional(imageGenerationMetadataSchema)
})
export type CarouselSlide = Static<typeof carouselSlideSchema>

// Schema de briefing criativo
export const creativeBriefingSchema = Type.Object({
  concept: Type.String(),
  narrative: Type.String(),
  visualStyle: Type.String(),
  colorPalette: Type.Array(Type.String()),
  moodKeywords: Type.Array(Type.String()),
  typography: Type.Optional(
    Type.Object({
      fontFamily: Type.Union([
        Type.Literal('sans-serif'),
        Type.Literal('serif'),
        Type.Literal('display'),
        Type.Literal('handwritten')
      ]),
      primaryColor: Type.String(),
      secondaryColor: Type.String(),
      style: Type.Union([
        Type.Literal('modern'),
        Type.Literal('classic'),
        Type.Literal('playful'),
        Type.Literal('elegant'),
        Type.Literal('bold')
      ])
    })
  ),
  slides: Type.Array(
    Type.Object({
      purpose: Type.String(),
      direction: Type.String(),
      keyMessage: Type.String()
    })
  )
})

// Schema de custo por agente (para carousels)
export const agentCostSchema = Type.Object({
  agentType: Type.String({ description: 'Tipo do agente' }),
  provider: Type.String({ description: 'Provider usado' }),
  model: Type.String({ description: 'Modelo usado' }),
  promptTokens: Type.Number({ description: 'Tokens de prompt' }),
  completionTokens: Type.Number({ description: 'Tokens de completion' }),
  totalTokens: Type.Number({ description: 'Total de tokens' }),
  costUsd: Type.Number({ description: 'Custo em USD' }),
  imagesGenerated: Type.Optional(Type.Number({ description: 'Numero de imagens geradas' }))
})
export type AgentCost = Static<typeof agentCostSchema>

// Schema de resultado da geracao
export const aiResultSchema = Type.Object(
  {
    content: Type.String({ description: 'Conteudo gerado' }),
    caption: Type.Optional(Type.String({ description: 'Caption do post (para carrossel)' })),
    provider: Type.String({ description: 'Provider usado' }),
    model: Type.Optional(Type.String({ description: 'Modelo usado' })),
    brandContextUsed: Type.Optional(Type.Boolean({ description: 'Se contexto da marca foi usado' })),
    promptUsed: Type.Optional(Type.String({ description: 'Prompt final usado' })),
    hashtags: Type.Optional(Type.Array(Type.String(), { description: 'Hashtags sugeridas' })),
    usage: Type.Optional(
      Type.Object({
        promptTokens: Type.Number(),
        completionTokens: Type.Number(),
        totalTokens: Type.Number(),
        costUsd: Type.Optional(Type.Number({ description: 'Custo estimado em USD' })),
        costBreakdown: Type.Optional(
          Type.Object({
            inputCost: Type.Number({ description: 'Custo de tokens de input' }),
            outputCost: Type.Number({ description: 'Custo de tokens de output' }),
            imageCost: Type.Number({ description: 'Custo de imagens geradas' }),
            videoCost: Type.Number({ description: 'Custo de video gerado' })
          })
        ),
        agentBreakdown: Type.Optional(
          Type.Array(agentCostSchema, { description: 'Breakdown de custo por agente' })
        )
      })
    ),
    // Campos para carrousel
    slides: Type.Optional(Type.Array(carouselSlideSchema, { description: 'Slides do carrousel' })),
    briefing: Type.Optional(creativeBriefingSchema),
    postId: Type.Optional(Type.Number({ description: 'ID do post criado' })),
    logId: Type.Optional(Type.Number({ description: 'ID do log de geracao' }))
  },
  { $id: 'AIResult', additionalProperties: false }
)
export type AIResult = Static<typeof aiResultSchema>
