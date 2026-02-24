// Classe do servico de Posts
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { Post, PostData, PostPatch, PostQuery } from './posts.schema'

export type { Post, PostData, PostPatch, PostQuery }

export interface PostsParams extends KnexAdapterParams<PostQuery> {}

// Limites de caracteres por plataforma (fallback se platforms service nao disponivel)
export const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  linkedin: 3000,
  threads: 500,
  facebook: 63206,
  tiktok: 2200
}

export class PostsService extends KnexService<Post, PostData, PostsParams, PostPatch> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'posts'
  }
}
