// Arquivo compartilhado para o servico de AI
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { AIService } from './ai.class'
import type { AIData, AIResult } from './ai.schema'

export type { AIData, AIResult }

export const aiPath = 'ai'

export const aiMethods: Array<keyof AIService> = ['create']

export type AIClientService = Pick<AIService<Params>, (typeof aiMethods)[number]>

export const aiClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(aiPath, connection.service(aiPath), {
    methods: aiMethods
  })
}

// Limites de caracteres por plataforma
export const platformLimits: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  linkedin: 3000,
  threads: 500,
  facebook: 63206,
  tiktok: 2200
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [aiPath]: AIClientService
  }
}
