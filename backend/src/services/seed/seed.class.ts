// Classe do servico de Seed
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'
import type { SeedStatus, SeedData, SeedResult } from './seed.schema'
import { DEFAULT_PLATFORMS } from '../platforms/platforms.class'
import { DEFAULT_ROLES } from '../roles/roles.class'
import { DEFAULT_PROMPT_TEMPLATES } from '../prompt-templates/prompt-templates.class'

export type { SeedStatus, SeedData, SeedResult }

export interface SeedParams extends Params {}

export class SeedService implements ServiceInterface<SeedStatus | SeedResult, SeedData> {
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  async find(_params?: SeedParams): Promise<SeedStatus> {
    const platformsCount = await this.countPlatforms()
    const rolesCount = await this.countRoles()
    const promptsCount = await this.countPrompts()

    return {
      seeded: platformsCount > 0 && rolesCount > 0 && promptsCount > 0,
      platforms: platformsCount,
      roles: rolesCount,
      prompts: promptsCount
    }
  }

  async create(data: SeedData, _params?: SeedParams): Promise<SeedResult> {
    const force = data.force || false

    // Seed platforms
    const platformsCreated = await this.seedPlatforms(force)

    // Seed roles
    const rolesCreated = await this.seedRoles(force)

    // Seed prompt templates
    const promptsCreated = await this.seedPromptTemplates(force)

    return {
      seeded: true,
      platforms: platformsCreated,
      roles: rolesCreated,
      prompts: promptsCreated
    }
  }

  private async countPlatforms(): Promise<number> {
    const db = this.app.get('sqliteClient')
    const result = await db('platforms').count('id as count').first()
    return Number(result?.count) || 0
  }

  private async countRoles(): Promise<number> {
    const db = this.app.get('sqliteClient')
    const result = await db('roles').count('id as count').first()
    return Number(result?.count) || 0
  }

  private async countPrompts(): Promise<number> {
    const db = this.app.get('sqliteClient')
    const result = await db('prompt_templates').count('id as count').first()
    return Number(result?.count) || 0
  }

  private async seedPlatforms(force: boolean): Promise<number> {
    const db = this.app.get('sqliteClient')
    let created = 0

    for (const platform of DEFAULT_PLATFORMS) {
      const existing = await db('platforms').where('name', platform.name).first()
      if (!existing || force) {
        if (existing && force) {
          await db('platforms').where('name', platform.name).delete()
        }
        await db('platforms').insert({
          ...platform,
          features: JSON.stringify(platform.features),
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        created++
      }
    }

    return created
  }

  private async seedRoles(force: boolean): Promise<number> {
    const db = this.app.get('sqliteClient')
    let created = 0

    for (const role of DEFAULT_ROLES) {
      const existing = await db('roles').where('name', role.name).first()
      if (!existing || force) {
        if (existing && force) {
          await db('roles').where('name', role.name).delete()
        }
        await db('roles').insert({
          ...role,
          permissions: JSON.stringify(role.permissions),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        created++
      }
    }

    return created
  }

  private async seedPromptTemplates(force: boolean): Promise<number> {
    const db = this.app.get('sqliteClient')
    let created = 0

    for (const prompt of DEFAULT_PROMPT_TEMPLATES) {
      const existing = await db('prompt_templates').where('name', prompt.name).first()
      if (!existing || force) {
        if (existing && force) {
          await db('prompt_templates').where('name', prompt.name).delete()
        }
        await db('prompt_templates').insert({
          ...prompt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        created++
      }
    }

    return created
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
