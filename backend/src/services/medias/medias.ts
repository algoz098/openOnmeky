// Configuracao do servico de Medias
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import type { Application, HookContext } from '../../declarations'
import { MediaService, getOptions } from './medias.class'
import { mediaPath, mediaMethods, allowedMimeTypes, sizeLimits } from './medias.shared'
import {
  mediaQueryValidator,
  mediaResolver,
  mediaExternalResolver,
  mediaQueryResolver
} from './medias.schema'
import { BadRequest } from '@feathersjs/errors'
import fs from 'fs'

export * from './medias.class'
export * from './medias.schema'
export * from './medias.shared'

// Hook para processar arquivo do formidable e preparar dados
const processFormidableUpload = async (context: HookContext) => {
  // O koa-body com multipart coloca arquivos em context.params.files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = (context.params as any).files

  if (!files || !files.file) {
    throw new BadRequest('Nenhum arquivo enviado. Use o campo "file" para enviar o arquivo.')
  }

  const file = Array.isArray(files.file) ? files.file[0] : files.file

  // Le o buffer do arquivo
  const buffer = fs.readFileSync(file.filepath)

  // Prepara dados para os proximos hooks
  context.data = {
    originalName: file.originalFilename || file.newFilename,
    mimeType: file.mimetype,
    size: file.size,
    buffer: buffer
  }

  // Remove arquivo temporario
  fs.unlinkSync(file.filepath)

  return context
}

// Hook para validar arquivo
const validateFile = async (context: HookContext) => {
  const data = context.data

  if (!data || !data.mimeType) {
    throw new BadRequest('Dados do arquivo invalidos')
  }

  // Valida tipo MIME
  if (!allowedMimeTypes.includes(data.mimeType)) {
    throw new BadRequest(
      `Tipo de arquivo nao permitido: ${data.mimeType}. Permitidos: ${allowedMimeTypes.join(', ')}`
    )
  }

  // Valida tamanho
  const type = data.mimeType.split('/')[0] // 'image', 'video', etc
  const maxSize = sizeLimits[type]
  if (maxSize && data.size > maxSize) {
    throw new BadRequest(`Arquivo muito grande. Tamanho maximo para ${type}: ${maxSize / 1024 / 1024}MB`)
  }

  return context
}

// Hook para processar upload do arquivo
const processUpload = async (context: HookContext) => {
  const service = context.service as MediaService
  const data = context.data
  const userId = context.params.user?.id

  // Processa o arquivo e obtem dados para salvar no banco
  const mediaData = service.processFileUpload(data, userId)

  // Substitui data pelo objeto preparado para o banco
  context.data = mediaData as typeof context.data

  return context
}

// Hook para remover arquivo fisico ao deletar registro
const removeFileOnDelete = async (context: HookContext) => {
  const service = context.service as MediaService
  const media = context.result

  if (media && media.storedName) {
    service.removeFile(media.storedName)
  }

  return context
}

export const medias = (app: Application) => {
  // Registra o servico
  app.use(mediaPath, new MediaService(getOptions(app)), {
    methods: mediaMethods,
    events: []
  })

  // Configura hooks
  app.service(mediaPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(mediaExternalResolver),
        schemaHooks.resolveResult(mediaResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(mediaQueryValidator), schemaHooks.resolveQuery(mediaQueryResolver)],
      find: [],
      get: [],
      create: [processFormidableUpload, validateFile, processUpload],
      remove: []
    },
    after: {
      all: [],
      remove: [removeFileOnDelete]
    },
    error: {
      all: []
    }
  })
}

declare module '../../declarations' {
  interface ServiceTypes {
    [mediaPath]: MediaService
  }
}
