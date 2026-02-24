// Arquivo compartilhado para o servico de brands
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Brand, BrandData, BrandPatch, BrandQuery, BrandService } from './brands.class'

export type { Brand, BrandData, BrandPatch, BrandQuery }

export type BrandClientService = Pick<BrandService<Params<BrandQuery>>, (typeof brandMethods)[number]>

export const brandPath = 'brands'

export const brandMethods = ['find', 'get', 'create', 'patch', 'remove', 'getPromptPreview'] as const

export const brandClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(brandPath, connection.service(brandPath), {
    methods: brandMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [brandPath]: BrandClientService
  }
}
