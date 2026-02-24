// Definicoes compartilhadas do servico de Medias

export const mediaPath = 'medias'
export const mediaMethods = ['find', 'get', 'create', 'remove'] as const

// Tipos MIME permitidos para upload
export const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
] as const

export type AllowedMimeType = (typeof allowedMimeTypes)[number]

// Limite de tamanho por tipo (em bytes)
export const sizeLimits: Record<string, number> = {
  image: 10 * 1024 * 1024 // 10MB para imagens
}

// Diretorio de upload
export const uploadDir = 'uploads'
