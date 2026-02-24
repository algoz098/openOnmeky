// Migration: Normalizar campos JSON dos ai_generation_logs
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Execucoes de agentes individuais
  await knex.schema.createTable('log_agent_executions', table => {
    table.increments('id').primary()
    table.integer('logId').notNullable().references('id').inTable('ai_generation_logs').onDelete('CASCADE')
    table.string('agentType').notNullable()
    table.string('provider').notNullable()
    table.string('model').notNullable()
    table.timestamp('startedAt').notNullable()
    table.timestamp('completedAt')
    table.text('systemPrompt').notNullable()
    table.text('userPrompt').notNullable()
    table.text('result')
    table.string('imageUrl')
    table.integer('promptTokens').defaultTo(0)
    table.integer('completionTokens').defaultTo(0)
    table.integer('totalTokens').defaultTo(0)
    table.text('error')
    table.string('status').notNullable() // 'success', 'failed', 'retried'
    table.index('logId')
  })

  // Imagens de referencia do log (snapshot)
  await knex.schema.createTable('log_reference_images', table => {
    table.increments('id').primary()
    table.integer('logId').notNullable().references('id').inTable('ai_generation_logs').onDelete('CASCADE')
    table.string('imageUrl').notNullable()
    table.integer('position').defaultTo(0)
    table.index('logId')
  })

  // Slides gerados no log (snapshot do momento da geracao)
  await knex.schema.createTable('log_slides', table => {
    table.increments('id').primary()
    table.integer('logId').notNullable().references('id').inTable('ai_generation_logs').onDelete('CASCADE')
    table.integer('slideIndex').notNullable()
    table.string('purpose').notNullable()
    table.text('text')
    table.string('imageUrl')
    table.text('imagePrompt')
    table.string('masterImageUrl')
    table.index('logId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('log_slides')
  await knex.schema.dropTableIfExists('log_reference_images')
  await knex.schema.dropTableIfExists('log_agent_executions')
}
