import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.string('musicAiState').defaultTo('idle')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('musicAiState')
  })
}
