// Migration para adicionar suporte a multiplas execucoes de IA por post
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    // Array de todas as execucoes de IA (cada geracao adiciona uma entrada)
    table.text('aiExecutions').nullable()

    // Totais acumulados de TODAS as execucoes
    table.integer('totalPromptTokens').nullable()
    table.integer('totalCompletionTokens').nullable()
    table.integer('totalTokensUsed').nullable()
    table.decimal('totalCostUsd', 10, 6).nullable()
    table.integer('totalImagesGenerated').nullable()
    table.integer('executionCount').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('aiExecutions')
    table.dropColumn('totalPromptTokens')
    table.dropColumn('totalCompletionTokens')
    table.dropColumn('totalTokensUsed')
    table.dropColumn('totalCostUsd')
    table.dropColumn('totalImagesGenerated')
    table.dropColumn('executionCount')
  })
}
