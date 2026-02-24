// Migration para adicionar campo lastProgress nos logs de geracao
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ai_generation_logs', table => {
    // Campo para persistir o ultimo progresso da geracao (JSON)
    // Permite recuperar o estado apos refresh da pagina
    table.text('lastProgress').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ai_generation_logs', table => {
    table.dropColumn('lastProgress')
  })
}
