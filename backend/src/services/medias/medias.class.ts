// Servico de Medias para gerenciamento de arquivos
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { Media, MediaData, MediaQuery } from './medias.schema'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { uploadDir } from './medias.shared'

export type MediaParams = KnexAdapterParams<MediaQuery>

// Opcoes estendidas do servico
export interface MediaServiceOptions extends KnexAdapterOptions {
  uploadPath: string
  baseUrl: string
}

export class MediaService<ServiceParams extends MediaParams = MediaParams> extends KnexService<
  Media,
  MediaData,
  ServiceParams
> {
  uploadPath: string
  baseUrl: string

  constructor(options: MediaServiceOptions) {
    super(options)
    this.uploadPath = options.uploadPath
    this.baseUrl = options.baseUrl
    // Garante que o diretorio existe
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true })
    }
  }

  // Gera nome unico e salva arquivo no disco
  processFileUpload(
    data: {
      buffer?: Buffer
      originalName: string
      mimeType: string
      size: number
      source?: 'upload' | 'ai-generated'
    },
    userId?: number
  ): Omit<Media, 'id' | 'createdAt' | 'updatedAt'> {
    const buffer = data.buffer
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Buffer do arquivo nao fornecido')
    }

    // Gera nome unico para o arquivo
    const ext = path.extname(data.originalName) || this.getExtensionFromMime(data.mimeType)
    const storedName = `${randomUUID()}${ext}`
    const filePath = path.join(uploadDir, storedName)
    const fullPath = path.join(this.uploadPath, storedName)

    // Salva o arquivo
    fs.writeFileSync(fullPath, buffer)

    // Monta URL de acesso
    const url = `/${uploadDir}/${storedName}`

    return {
      userId: userId || 0,
      originalName: data.originalName,
      storedName,
      mimeType: data.mimeType,
      size: data.size,
      path: filePath,
      url,
      source: data.source || 'upload'
    }
  }

  // Baixa imagem de URL externa e salva localmente
  async saveFromUrl(
    imageUrl: string,
    originalName: string,
    userId: number,
    source: 'upload' | 'ai-generated' = 'ai-generated'
  ): Promise<Media> {
    // Baixa a imagem da URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Detecta o tipo MIME
    const contentType = response.headers.get('content-type') || 'image/png'
    const mimeType = contentType.split(';')[0].trim()

    // Processa e salva o arquivo
    const fileData = this.processFileUpload(
      {
        buffer,
        originalName,
        mimeType,
        size: buffer.length,
        source
      },
      userId
    )

    // Cria registro no banco usando o Model diretamente
    const result = await this.createQuery({} as ServiceParams).insert(fileData)
    const id = Array.isArray(result) ? result[0] : result

    return {
      id: id as number,
      ...fileData
    } as Media
  }

  // Salva imagem a partir de dados base64
  async saveFromBase64(
    base64Data: string,
    originalName: string,
    userId: number,
    source: 'upload' | 'ai-generated' = 'ai-generated'
  ): Promise<Media> {
    // Remove prefixo data:image/xxx;base64, se presente
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Clean, 'base64')

    // Detecta tipo MIME do base64 ou usa padrao
    let mimeType = 'image/png'
    const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/)
    if (mimeMatch) {
      mimeType = mimeMatch[1]
    }

    // Processa e salva o arquivo
    const fileData = this.processFileUpload(
      {
        buffer,
        originalName,
        mimeType,
        size: buffer.length,
        source
      },
      userId
    )

    // Cria registro no banco
    const result = await this.createQuery({} as ServiceParams).insert(fileData)
    const id = Array.isArray(result) ? result[0] : result

    return {
      id: id as number,
      ...fileData
    } as Media
  }

  // Remove arquivo fisico do disco
  removeFile(storedName: string): void {
    const fullPath = path.join(this.uploadPath, storedName)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  // Remove arquivo fisico do disco baseado na URL
  removeFileByUrl(url: string): boolean {
    // Extrai o nome do arquivo da URL (ex: /uploads/abc123.png -> abc123.png)
    const storedName = url.split('/').pop()
    if (!storedName) return false

    const fullPath = path.join(this.uploadPath, storedName)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      console.log(`[MediaService] Arquivo removido: ${fullPath}`)
      return true
    }
    return false
  }

  // Remove arquivo e registro do banco baseado na URL
  async removeByUrl(url: string): Promise<boolean> {
    try {
      // Busca o registro no banco pela URL
      const results = await this.find({ query: { url } } as unknown as ServiceParams)
      const media = Array.isArray(results) ? results[0] : (results as { data?: Media[] }).data?.[0]

      if (media) {
        // Remove o registro do banco (o hook after:remove cuida do arquivo)
        await this.remove(media.id, {} as unknown as ServiceParams)
        return true
      } else {
        // Se nao encontrou no banco, tenta remover so o arquivo fisico
        return this.removeFileByUrl(url)
      }
    } catch (error) {
      console.error(`[MediaService] Erro ao remover midia por URL ${url}:`, error)
      // Tenta remover so o arquivo fisico como fallback
      return this.removeFileByUrl(url)
    }
  }

  private getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg'
    }
    return mimeToExt[mimeType] || ''
  }
}

export const getOptions = (app: Application): MediaServiceOptions => {
  const publicPath = path.resolve(app.get('public') || 'public')
  const uploadPath = path.join(publicPath, uploadDir)
  const host = app.get('host') || 'localhost'
  const port = app.get('port') || 3030
  const baseUrl = process.env.BASE_URL || `http://${host}:${port}`

  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'medias',
    uploadPath,
    baseUrl
  }
}
