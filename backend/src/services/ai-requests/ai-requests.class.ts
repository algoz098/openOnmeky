// Classe do servico ai-requests (somente leitura via API)
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type { AIRequest, AIRequestQuery } from './ai-requests.schema'

export type { AIRequest, AIRequestQuery }

export interface AIRequestsParams extends KnexAdapterParams<AIRequestQuery> {}

// Service class - apenas find e get sao expostos via API
// Create/patch/remove sao bloqueados nos hooks
export class AIRequestsService extends KnexService<
  AIRequest,
  never, // Sem Data (nao permite create via API)
  AIRequestsParams,
  never // Sem Patch (nao permite update via API)
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'ai_requests'
  }
}
