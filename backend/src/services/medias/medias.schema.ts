// Schemas para o servico de Medias (arquivos de midia)
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MediaService } from './medias.class'

// Valores validos para source
export const validSources = ['upload', 'ai-generated'] as const

// Schema principal de media
export const mediaSchema = Type.Object(
  {
    id: Type.Number(),
    userId: Type.Number({ description: 'ID do usuario dono do arquivo' }),
    originalName: Type.String({ description: 'Nome original do arquivo' }),
    storedName: Type.String({ description: 'Nome unico no storage' }),
    mimeType: Type.String({ description: 'Tipo MIME do arquivo' }),
    size: Type.Number({ description: 'Tamanho em bytes' }),
    path: Type.String({ description: 'Caminho relativo no storage' }),
    url: Type.String({ description: 'URL para acesso ao arquivo' }),
    source: Type.Optional(
      Type.Union(
        validSources.map(s => Type.Literal(s)),
        { default: 'upload', description: 'Origem da midia: upload manual ou gerada por IA' }
      )
    ),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Media', additionalProperties: false }
)
export type Media = Static<typeof mediaSchema>
export const mediaValidator = getValidator(mediaSchema, dataValidator)
export const mediaResolver = resolve<Media, HookContext<MediaService>>({})

export const mediaExternalResolver = resolve<Media, HookContext<MediaService>>({})

// Schema para criacao de novas medias (via upload)
// O upload real sera tratado pelo middleware multer
export const mediaDataSchema = Type.Object(
  {
    originalName: Type.String({ description: 'Nome original do arquivo' }),
    mimeType: Type.String({ description: 'Tipo MIME do arquivo' }),
    size: Type.Number({ description: 'Tamanho em bytes' }),
    buffer: Type.Optional(Type.Any({ description: 'Buffer do arquivo (interno)' })),
    source: Type.Optional(
      Type.Union(
        validSources.map(s => Type.Literal(s)),
        { default: 'upload', description: 'Origem da midia' }
      )
    )
  },
  { $id: 'MediaData', additionalProperties: false }
)
export type MediaData = Static<typeof mediaDataSchema>
export const mediaDataValidator = getValidator(mediaDataSchema, dataValidator)
export const mediaDataResolver = resolve<MediaData, HookContext<MediaService>>({})

// Schema para queries
export const mediaQueryProperties = Type.Pick(mediaSchema, [
  'id',
  'userId',
  'mimeType',
  'originalName',
  'source',
  'createdAt',
  'url',
  'path',
  'storedName'
])
export const mediaQuerySchema = Type.Intersect(
  [querySyntax(mediaQueryProperties), Type.Object({}, { additionalProperties: false })],
  { additionalProperties: false }
)
export type MediaQuery = Static<typeof mediaQuerySchema>
export const mediaQueryValidator = getValidator(mediaQuerySchema, queryValidator)
export const mediaQueryResolver = resolve<MediaQuery, HookContext<MediaService>>({
  // Usuario so ve seus proprios arquivos
  userId: async (_value, _user, context) => {
    if (context.params.user) {
      return context.params.user.id
    }
    return _value
  }
})
