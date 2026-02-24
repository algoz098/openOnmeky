// Schemas para o servico de Brands (Marcas)
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BrandService } from './brands.class'

// Schema para configuracao de agente de IA por tipo
const aiAgentConfigSchema = Type.Object({
  provider: Type.Optional(
    Type.String({ description: 'Provider de IA (openai, google, ollama, anthropic, groq)' })
  ),
  model: Type.Optional(Type.String({ description: 'Modelo especifico a usar' })),
  temperature: Type.Optional(Type.Number({ description: 'Temperatura para geracao (0-1)' })),
  maxTokens: Type.Optional(Type.Number({ description: 'Limite de tokens' }))
})

// Schema para configuracao completa de IA da marca com agentes especializados
const brandAIConfigSchema = Type.Object({
  // Agentes especializados
  reasoning: Type.Optional(aiAgentConfigSchema),
  textCreation: Type.Optional(aiAgentConfigSchema),
  textAdaptation: Type.Optional(aiAgentConfigSchema),
  analysis: Type.Optional(aiAgentConfigSchema),
  imageGeneration: Type.Optional(aiAgentConfigSchema),
  textOverlay: Type.Optional(aiAgentConfigSchema),
  videoGeneration: Type.Optional(aiAgentConfigSchema),
  creativeDirection: Type.Optional(aiAgentConfigSchema),
  compliance: Type.Optional(aiAgentConfigSchema),
  // Campos legados mantidos para compatibilidade
  text: Type.Optional(aiAgentConfigSchema),
  image: Type.Optional(aiAgentConfigSchema),
  video: Type.Optional(aiAgentConfigSchema)
})

// Schema para prompts customizados
const brandPromptsSchema = Type.Object({
  text: Type.Optional(Type.String({ description: 'Template de prompt para geracao de texto' })),
  image: Type.Optional(Type.String({ description: 'Template de prompt para geracao de imagem' })),
  video: Type.Optional(Type.String({ description: 'Template de prompt para geracao de video/roteiro' }))
})

// Schema principal da marca
export const brandSchema = Type.Object(
  {
    id: Type.Number(),
    userId: Type.Number({ description: 'ID do usuario dono da marca' }),
    name: Type.String({ description: 'Nome da marca' }),
    description: Type.Optional(Type.String({ description: 'Descricao da marca' })),
    sector: Type.Optional(Type.String({ description: 'Setor de atuacao' })),
    toneOfVoice: Type.Optional(Type.String({ description: 'Tom de voz da marca' })),
    values: Type.Optional(Type.Array(Type.String(), { description: 'Valores da marca' })),
    preferredWords: Type.Optional(Type.Array(Type.String(), { description: 'Palavras preferidas' })),
    avoidedWords: Type.Optional(Type.Array(Type.String(), { description: 'Palavras a evitar' })),
    targetAudience: Type.Optional(Type.String({ description: 'Publico-alvo' })),
    competitors: Type.Optional(Type.Array(Type.String(), { description: 'Concorrentes' })),
    brandColors: Type.Optional(Type.Array(Type.String(), { description: 'Cores da marca (hex)' })),
    logoUrl: Type.Optional(Type.String({ description: 'URL do logo' })),
    prompts: Type.Optional(brandPromptsSchema),
    aiConfig: Type.Optional(brandAIConfigSchema),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Brand', additionalProperties: false }
)
export type Brand = Static<typeof brandSchema>
export const brandValidator = getValidator(brandSchema, dataValidator)
export const brandResolver = resolve<Brand, HookContext<BrandService>>({})

export const brandExternalResolver = resolve<Brand, HookContext<BrandService>>({})

// Schema para criacao de novas marcas
export const brandDataSchema = Type.Pick(
  brandSchema,
  [
    'name',
    'description',
    'sector',
    'toneOfVoice',
    'values',
    'preferredWords',
    'avoidedWords',
    'targetAudience',
    'competitors',
    'brandColors',
    'logoUrl',
    'prompts',
    'aiConfig'
  ],
  { $id: 'BrandData' }
)
export type BrandData = Static<typeof brandDataSchema>
export const brandDataValidator = getValidator(brandDataSchema, dataValidator)
export const brandDataResolver = resolve<BrandData, HookContext<BrandService>>({})

// Schema para atualizacao de marcas (com campos adicionais para funcionalidades especiais)
export const brandPatchSchema = Type.Intersect(
  [
    Type.Partial(brandDataSchema),
    Type.Object({
      // Alias para brandColors
      colors: Type.Optional(Type.Array(Type.String(), { description: 'Alias para brandColors' })),
      // Array de tipos de prompts a resetar para o padrao
      resetPrompts: Type.Optional(
        Type.Array(Type.Union([Type.Literal('text'), Type.Literal('image'), Type.Literal('video')]))
      )
    })
  ],
  { $id: 'BrandPatch' }
)
export type BrandPatch = Static<typeof brandPatchSchema>
export const brandPatchValidator = getValidator(brandPatchSchema, dataValidator)
export const brandPatchResolver = resolve<BrandPatch, HookContext<BrandService>>({})

// Schema para queries
export const brandQueryProperties = Type.Pick(brandSchema, ['id', 'userId', 'name', 'sector'])
export const brandQuerySchema = Type.Intersect(
  [querySyntax(brandQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type BrandQuery = Static<typeof brandQuerySchema>
export const brandQueryValidator = getValidator(brandQuerySchema, queryValidator)
export const brandQueryResolver = resolve<BrandQuery, HookContext<BrandService>>({
  // Usuario so ve suas proprias marcas
  userId: async (_value, _user, context) => {
    if (context.params.user) {
      return context.params.user.id
    }
    return _value
  }
})

// Prompts padrao para novas marcas
export const defaultPrompts = {
  text: `Crie um post para {plataforma} sobre {tema}.
Use tom {tom_de_voz}. 
Inclua call-to-action.
Limite de {limite} caracteres.
Marca: {nome_marca}`,
  image: `Crie uma imagem para {plataforma} no estilo {estilo}.
Cores predominantes: {cores}.
Tema: {tema}.
Marca: {nome_marca}`,
  video: `Crie um roteiro de video curto ({duracao}s) para {plataforma}.
Estilo: {estilo}.
Tema: {tema}.
Marca: {nome_marca}`
}
