// Classe do servico de Platforms
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { Platform, PlatformData, PlatformPatch, PlatformQuery } from './platforms.schema'

export type { Platform, PlatformData, PlatformPatch, PlatformQuery }

export interface PlatformsParams extends KnexAdapterParams<PlatformQuery> {}

// Definicao das plataformas padrao
export const DEFAULT_PLATFORMS: Array<{
  name: string
  displayName: string
  charLimit: number
  features: string[]
}> = [
  { name: 'twitter', displayName: 'Twitter/X', charLimit: 280, features: ['text', 'image', 'video'] },
  {
    name: 'instagram',
    displayName: 'Instagram',
    charLimit: 2200,
    features: ['text', 'image', 'video', 'reels']
  },
  {
    name: 'linkedin',
    displayName: 'LinkedIn',
    charLimit: 3000,
    features: ['text', 'image', 'video', 'article']
  },
  { name: 'threads', displayName: 'Threads', charLimit: 500, features: ['text', 'image'] },
  {
    name: 'facebook',
    displayName: 'Facebook',
    charLimit: 63206,
    features: ['text', 'image', 'video', 'story']
  },
  { name: 'tiktok', displayName: 'TikTok', charLimit: 2200, features: ['text', 'video'] }
]

export class PlatformsService extends KnexService<Platform, PlatformData, PlatformsParams, PlatformPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'platforms'
  }
}
