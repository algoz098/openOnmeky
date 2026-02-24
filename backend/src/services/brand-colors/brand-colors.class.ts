// Classe do servico de Brand Colors
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { BrandColor, BrandColorData, BrandColorPatch, BrandColorQuery } from './brand-colors.schema'

export type { BrandColor, BrandColorData, BrandColorPatch, BrandColorQuery }

export interface BrandColorsParams extends KnexAdapterParams<BrandColorQuery> {}

export class BrandColorsService extends KnexService<
  BrandColor,
  BrandColorData,
  BrandColorsParams,
  BrandColorPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'brand_colors'
  }
}
