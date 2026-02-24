// Migration para adicionar campo aiState na tabela posts
// aiState substitui o campo booleano aiGenerating por um campo string mais explicito
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    // Estado da geracao de IA: 'idle' | 'loading' | 'error'
    // - idle: sem geracao em andamento (padrao)
    // - loading: geracao de IA em andamento
    // - error: ultima geracao falhou
    table.string('aiState').defaultTo('idle')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('aiState')
  })
}
