// Migration: Normalizar campos JSON das platforms
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Features das plataformas (array normalizado)
  await knex.schema.createTable('platform_features', table => {
    table.increments('id').primary()
    table.integer('platformId').notNullable().references('id').inTable('platforms').onDelete('CASCADE')
    table.string('feature').notNullable()
    table.index('platformId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('platform_features')
}
