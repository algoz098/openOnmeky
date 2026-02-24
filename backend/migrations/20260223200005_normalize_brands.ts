// Migration: Normalizar campos JSON das brands
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Valores da marca (array normalizado)
  await knex.schema.createTable('brand_values', table => {
    table.increments('id').primary()
    table.integer('brandId').notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.string('value').notNullable()
    table.integer('position').defaultTo(0)
    table.index('brandId')
  })

  // Palavras preferidas (array normalizado)
  await knex.schema.createTable('brand_preferred_words', table => {
    table.increments('id').primary()
    table.integer('brandId').notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.string('word').notNullable()
    table.integer('position').defaultTo(0)
    table.index('brandId')
  })

  // Palavras a evitar (array normalizado)
  await knex.schema.createTable('brand_avoided_words', table => {
    table.increments('id').primary()
    table.integer('brandId').notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.string('word').notNullable()
    table.integer('position').defaultTo(0)
    table.index('brandId')
  })

  // Concorrentes (array normalizado)
  await knex.schema.createTable('brand_competitors', table => {
    table.increments('id').primary()
    table.integer('brandId').notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.string('name').notNullable()
    table.integer('position').defaultTo(0)
    table.index('brandId')
  })

  // Cores da marca (array normalizado)
  await knex.schema.createTable('brand_colors', table => {
    table.increments('id').primary()
    table.integer('brandId').notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.string('color').notNullable() // hex
    table.boolean('isPrimary').defaultTo(false)
    table.integer('position').defaultTo(0)
    table.index('brandId')
  })

  // Configuracao de IA por tipo de agente
  await knex.schema.createTable('brand_ai_configs', table => {
    table.increments('id').primary()
    table.integer('brandId').notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.string('agentType').notNullable() // 'reasoning', 'textCreation', etc
    table.string('provider')
    table.string('model')
    table.decimal('temperature', 3, 2)
    table.integer('maxTokens')
    // Constraint: uma marca so pode ter uma config por tipo de agente
    table.unique(['brandId', 'agentType'])
  })

  // Adicionar colunas de prompts diretamente na tabela brands
  // (sao apenas 3 campos, nao precisa de tabela separada)
  await knex.schema.alterTable('brands', table => {
    table.text('promptText')
    table.text('promptImage')
    table.text('promptVideo')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('brands', table => {
    table.dropColumn('promptText')
    table.dropColumn('promptImage')
    table.dropColumn('promptVideo')
  })
  await knex.schema.dropTableIfExists('brand_ai_configs')
  await knex.schema.dropTableIfExists('brand_colors')
  await knex.schema.dropTableIfExists('brand_competitors')
  await knex.schema.dropTableIfExists('brand_avoided_words')
  await knex.schema.dropTableIfExists('brand_preferred_words')
  await knex.schema.dropTableIfExists('brand_values')
}
