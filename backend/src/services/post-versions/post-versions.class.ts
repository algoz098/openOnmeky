// Classe do servico de Versoes de Posts
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { PostVersion, PostVersionData, PostVersionPatch, PostVersionQuery } from './post-versions.schema'

export type { PostVersion, PostVersionData, PostVersionPatch, PostVersionQuery }

export interface PostVersionsParams extends KnexAdapterParams<PostVersionQuery> {}

export class PostVersionsService extends KnexService<
  PostVersion,
  PostVersionData,
  PostVersionsParams,
  PostVersionPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'post_versions'
  }
}
