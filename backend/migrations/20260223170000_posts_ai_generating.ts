// Migration para adicionar campos de controle de geracao em andamento
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Adiciona campos para controle de geracao de IA em andamento
  await knex.schema.alterTable('posts', table => {
    // Indica se ha uma geracao de IA em andamento para este post
    table.boolean('aiGenerating').defaultTo(false)
    // ID do log de geracao ativo (para reconectar ao evento de progresso)
    table.integer('activeLogId').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('aiGenerating')
    table.dropColumn('activeLogId')
  })
}
