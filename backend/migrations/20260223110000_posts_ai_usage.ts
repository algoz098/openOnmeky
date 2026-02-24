// Migration para adicionar campos de uso de IA na tabela posts
// Permite persistir informacoes de tokens e custos da ultima geracao
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    // Tokens da ultima geracao
    table.integer('lastUsagePromptTokens').nullable()
    table.integer('lastUsageCompletionTokens').nullable()
    table.integer('lastUsageTotalTokens').nullable()

    // Custo da ultima geracao
    table.decimal('lastUsageCostUsd', 10, 6).nullable()

    // Breakdown de custos (JSON)
    table.text('lastUsageCostBreakdown').nullable()

    // Provider e modelo usados
    table.string('lastUsageProvider').nullable()
    table.string('lastUsageModel').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('lastUsagePromptTokens')
    table.dropColumn('lastUsageCompletionTokens')
    table.dropColumn('lastUsageTotalTokens')
    table.dropColumn('lastUsageCostUsd')
    table.dropColumn('lastUsageCostBreakdown')
    table.dropColumn('lastUsageProvider')
    table.dropColumn('lastUsageModel')
  })
}
