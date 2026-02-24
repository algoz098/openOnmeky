// Classe do servico de Post Slides
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { PostSlide, PostSlideData, PostSlidePatch, PostSlideQuery } from './post-slides.schema'

export type { PostSlide, PostSlideData, PostSlidePatch, PostSlideQuery }

export interface PostSlidesParams extends KnexAdapterParams<PostSlideQuery> {}

export class PostSlidesService extends KnexService<
  PostSlide,
  PostSlideData,
  PostSlidesParams,
  PostSlidePatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'post_slides'
  }
}
