// Migration para tabela ai_requests - log de cada chamada de API de IA
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_requests', table => {
    table.increments('id')

    // Rastreabilidade obrigatoria
    table.integer('postId').unsigned().notNullable().references('id').inTable('posts').onDelete('CASCADE')
    table.integer('userId').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.integer('brandId').unsigned().notNullable().references('id').inTable('brands').onDelete('CASCADE')

    // Contexto da acao
    table.string('action', 100).notNullable() // "Usuario gerou carousel"
    table.string('actionCode', 50).notNullable() // "carousel_generate"
    table.integer('logId').unsigned().references('id').inTable('ai_generation_logs').onDelete('SET NULL')

    // Detalhes do agente
    table.string('agentType', 50).notNullable() // 'creativeDirection', 'imageGeneration'
    table.string('agentLabel', 100) // "Direcao Criativa", "Geracao de Imagem"

    // Provider e modelo
    table.string('provider', 50).notNullable() // 'openai', 'google'
    table.string('model', 100).notNullable() // 'gpt-4o', 'gemini-3.1-pro'

    // Tokens
    table.integer('promptTokens').defaultTo(0)
    table.integer('completionTokens').defaultTo(0)
    table.integer('totalTokens').defaultTo(0)

    // Custos
    table.decimal('costUsd', 10, 6).defaultTo(0)
    table.decimal('inputCost', 10, 6).defaultTo(0)
    table.decimal('outputCost', 10, 6).defaultTo(0)
    table.decimal('imageCost', 10, 6).defaultTo(0)
    table.decimal('videoCost', 10, 6).defaultTo(0)

    // Media
    table.integer('imagesGenerated').defaultTo(0)
    table.decimal('videoSecondsGenerated', 10, 2).defaultTo(0)

    // Timestamps
    table.timestamp('requestedAt').notNullable() // quando o usuario clicou
    table.timestamp('startedAt') // quando a API foi chamada
    table.timestamp('completedAt') // quando terminou
    table.integer('durationMs')

    // Status
    table.string('status', 20).defaultTo('success')
    table.text('errorMessage')

    table.timestamp('createdAt').defaultTo(knex.fn.now())

    // Indices para queries frequentes
    table.index('postId')
    table.index('userId')
    table.index('brandId')
    table.index('actionCode')
    table.index('agentType')
    table.index('provider')
    table.index('requestedAt')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('ai_requests')
}
