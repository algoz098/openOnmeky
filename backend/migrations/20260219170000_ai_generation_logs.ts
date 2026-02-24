// Migration para tabela de logs de geracao de IA
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Tabela de logs de geracao de IA
  await knex.schema.createTable('ai_generation_logs', table => {
    table.increments('id')
    table.integer('brandId').unsigned().notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.integer('userId').unsigned().references('id').inTable('users').onDelete('SET NULL')
    table.integer('postId').unsigned().references('id').inTable('posts').onDelete('SET NULL')

    // Tipo de geracao
    table.string('generationType').notNullable() // 'carousel', 'single', 'text-only'

    // Status da geracao
    table.string('status').defaultTo('started') // started, in_progress, completed, failed

    // Agentes utilizados e suas execucoes
    table.text('agentExecutions') // JSON: array de execucoes por agente

    // Prompt original do usuario
    table.text('originalPrompt')

    // Plataforma alvo
    table.string('platform')

    // Imagens de referencia usadas
    table.text('referenceImages') // JSON: array de URLs

    // Resultado final
    table.text('slides') // JSON: array de slides com texto e imagem

    // Metricas de uso
    table.integer('totalPromptTokens').defaultTo(0)
    table.integer('totalCompletionTokens').defaultTo(0)
    table.integer('totalTokens').defaultTo(0)

    // Tempo de execucao
    table.integer('executionTimeMs')

    // Erro se houver
    table.text('errorMessage')
    table.text('errorStack')

    // Timestamps
    table.timestamp('startedAt').defaultTo(knex.fn.now())
    table.timestamp('completedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    // Indices
    table.index('brandId')
    table.index('userId')
    table.index('postId')
    table.index('status')
    table.index('generationType')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('ai_generation_logs')
}
