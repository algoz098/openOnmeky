// Migration para adicionar campo de audio gerado (trilha sonora) aos posts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Adiciona coluna generatedAudio como JSON (SQLite armazena como TEXT)
  await knex.schema.alterTable('posts', table => {
    table.json('generatedAudio').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  // Remove a coluna generatedAudio
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('generatedAudio')
  })
}
