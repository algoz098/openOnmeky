// Classe do servico de Brand Values
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { BrandValue, BrandValueData, BrandValuePatch, BrandValueQuery } from './brand-values.schema'

export type { BrandValue, BrandValueData, BrandValuePatch, BrandValueQuery }

export interface BrandValuesParams extends KnexAdapterParams<BrandValueQuery> {}

export class BrandValuesService extends KnexService<
  BrandValue,
  BrandValueData,
  BrandValuesParams,
  BrandValuePatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'brand_values'
  }
}
