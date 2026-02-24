// Arquivo compartilhado para o servico de ai-providers
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { AIProvidersService } from './ai-providers.class'

export type AIProviderInfo = {
  name: string
  enabled: boolean
}

export const aiProvidersPath = 'ai-providers'

export const aiProvidersMethods: Array<keyof AIProvidersService> = ['find']

export type AIProvidersClientService = Pick<AIProvidersService<Params>, (typeof aiProvidersMethods)[number]>

export const aiProvidersClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(aiProvidersPath, connection.service(aiProvidersPath), {
    methods: aiProvidersMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [aiProvidersPath]: AIProvidersClientService
  }
}
