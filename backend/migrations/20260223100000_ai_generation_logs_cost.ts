// Migration para adicionar campos de custo na tabela ai_generation_logs
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ai_generation_logs', table => {
    // Custo estimado em USD
    table.decimal('estimatedCostUsd', 10, 6).defaultTo(0)

    // Breakdown do custo (JSON)
    // Estrutura: { inputCost, outputCost, imageCost, videoCost, inputTokens, outputTokens }
    table.text('costBreakdown')

    // Provider e modelo principal usado (para facilitar queries)
    table.string('mainProvider')
    table.string('mainModel')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ai_generation_logs', table => {
    table.dropColumn('estimatedCostUsd')
    table.dropColumn('costBreakdown')
    table.dropColumn('mainProvider')
    table.dropColumn('mainModel')
  })
}
