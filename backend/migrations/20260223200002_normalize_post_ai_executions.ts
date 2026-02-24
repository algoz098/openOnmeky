// Migration: Normalizar execucoes de IA dos posts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Execucoes de IA do post
  await knex.schema.createTable('post_ai_executions', table => {
    table.increments('id').primary()
    table.integer('postId').notNullable().references('id').inTable('posts').onDelete('CASCADE')
    table.string('uuid').notNullable().unique() // UUID para identificar a execucao
    table.string('type').notNullable() // 'generate', 'rewrite', 'adapt', 'suggest-hashtags', 'carousel'
    table.string('provider').notNullable()
    table.string('model').notNullable()
    table.integer('promptTokens').defaultTo(0)
    table.integer('completionTokens').defaultTo(0)
    table.integer('totalTokens').defaultTo(0)
    table.decimal('costUsd', 10, 6).defaultTo(0)
    // Cost breakdown inline
    table.decimal('inputCost', 10, 6).defaultTo(0)
    table.decimal('outputCost', 10, 6).defaultTo(0)
    table.decimal('imageCost', 10, 6).defaultTo(0)
    table.decimal('videoCost', 10, 6).defaultTo(0)
    table.integer('imagesGenerated').defaultTo(0)
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    // Indice para buscar execucoes de um post
    table.index('postId')
  })

  // Breakdown por agente (para carousels)
  await knex.schema.createTable('post_ai_agent_costs', table => {
    table.increments('id').primary()
    table
      .integer('executionId')
      .notNullable()
      .references('id')
      .inTable('post_ai_executions')
      .onDelete('CASCADE')
    table.string('agentType').notNullable()
    table.string('provider').notNullable()
    table.string('model').notNullable()
    table.integer('promptTokens').defaultTo(0)
    table.integer('completionTokens').defaultTo(0)
    table.integer('totalTokens').defaultTo(0)
    table.decimal('costUsd', 10, 6).defaultTo(0)
    table.integer('imagesGenerated').defaultTo(0)
    // Indice para buscar custos de uma execucao
    table.index('executionId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_ai_agent_costs')
  await knex.schema.dropTableIfExists('post_ai_executions')
}
