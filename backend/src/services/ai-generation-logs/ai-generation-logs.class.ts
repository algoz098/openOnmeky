// Classe do servico de Logs de Geracao de IA
import { KnexService } from '@feathersjs/knex'
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex'
import type { Application } from '../../declarations'
import type {
  AIGenerationLog,
  AIGenerationLogData,
  AIGenerationLogPatch,
  AIGenerationLogQuery
} from './ai-generation-logs.schema'

export type { AIGenerationLog, AIGenerationLogData, AIGenerationLogPatch, AIGenerationLogQuery }

export interface AIGenerationLogsParams extends KnexAdapterParams<AIGenerationLogQuery> {}

export class AIGenerationLogsService extends KnexService<
  AIGenerationLog,
  AIGenerationLogData,
  AIGenerationLogsParams,
  AIGenerationLogPatch
> {}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('sqliteClient'),
    name: 'ai_generation_logs'
  }
}
