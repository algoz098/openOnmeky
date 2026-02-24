// Migration para adicionar campo source na tabela medias
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('medias', table => {
    // Campo para identificar origem da midia: 'upload' (padrao) ou 'ai-generated'
    table.string('source').defaultTo('upload')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('medias', table => {
    table.dropColumn('source')
  })
}
