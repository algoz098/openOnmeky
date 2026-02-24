// Migration para adicionar coluna creativeBriefing na tabela posts
// Permite persistir o briefing criativo completo para regeneracao de imagens
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    // JSON contendo o briefing criativo completo (concept, narrative, visualStyle, etc.)
    table.text('creativeBriefing')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('creativeBriefing')
  })
}
