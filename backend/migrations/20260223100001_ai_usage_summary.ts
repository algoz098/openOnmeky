// Migration para criar tabela de agregacao de uso de IA
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ai_usage_summary', table => {
    table.increments('id')

    // Referencias
    table.integer('userId').unsigned().references('id').inTable('users').onDelete('CASCADE')
    table.integer('brandId').unsigned().references('id').inTable('brands').onDelete('CASCADE')

    // Periodo de agregacao
    table.string('period').notNullable() // 'daily', 'monthly', 'total'
    table.date('periodStart') // NULL para 'total'

    // Provider e modelo
    table.string('provider').notNullable()
    table.string('model').notNullable()

    // Contadores de uso
    table.integer('requestCount').defaultTo(0)
    table.integer('totalPromptTokens').defaultTo(0)
    table.integer('totalCompletionTokens').defaultTo(0)
    table.integer('totalTokens').defaultTo(0)
    table.integer('imagesGenerated').defaultTo(0)
    table.integer('videosGenerated').defaultTo(0)
    table.decimal('videoSecondsGenerated', 10, 2).defaultTo(0)

    // Custos
    table.decimal('estimatedCostUsd', 10, 6).defaultTo(0)

    // Timestamps
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    // Indices para queries eficientes
    table.index('userId')
    table.index('brandId')
    table.index('period')
    table.index('periodStart')
    table.index('provider')
    table.index(['userId', 'period', 'periodStart'])
    table.index(['brandId', 'period', 'periodStart'])

    // Constraint de unicidade para evitar duplicatas
    table.unique(['userId', 'brandId', 'period', 'periodStart', 'provider', 'model'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('ai_usage_summary')
}
