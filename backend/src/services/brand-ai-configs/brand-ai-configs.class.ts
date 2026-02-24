// Classe do servico de Brand AI Configs
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type {
  BrandAiConfig,
  BrandAiConfigData,
  BrandAiConfigPatch,
  BrandAiConfigQuery
} from './brand-ai-configs.schema'

export type { BrandAiConfig, BrandAiConfigData, BrandAiConfigPatch, BrandAiConfigQuery }

export interface BrandAiConfigsParams extends KnexAdapterParams<BrandAiConfigQuery> {}

export class BrandAiConfigsService extends KnexService<
  BrandAiConfig,
  BrandAiConfigData,
  BrandAiConfigsParams,
  BrandAiConfigPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'brand_ai_configs'
  }
}
