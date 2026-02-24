// Classe do servico de System
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type { SystemStatus } from './system.schema'

export type { SystemStatus }

export interface SystemParams extends Params {}

export class SystemService implements ServiceInterface<SystemStatus> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(_params?: SystemParams): Promise<SystemStatus> {
    const initialized = await this.isInitialized()
    return { initialized }
  }

  async isInitialized(): Promise<boolean> {
    try {
      const db = this.app.get('sqliteClient')
      const config = await db('system_config').where('key', 'initialized').first()
      return config?.value === 'true'
    } catch {
      return false
    }
  }

  async setInitialized(value: boolean): Promise<void> {
    const db = this.app.get('sqliteClient')
    const existing = await db('system_config').where('key', 'initialized').first()

    if (existing) {
      await db('system_config')
        .where('key', 'initialized')
        .update({
          value: value ? 'true' : 'false',
          updatedAt: new Date().toISOString()
        })
    } else {
      await db('system_config').insert({
        key: 'initialized',
        value: value ? 'true' : 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
