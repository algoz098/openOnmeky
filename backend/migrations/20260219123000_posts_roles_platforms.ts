// Migration para tabelas posts, roles, platforms, prompt_templates, system_config
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Tabela de roles
  await knex.schema.createTable('roles', table => {
    table.increments('id')
    table.string('name').unique().notNullable()
    table.string('description')
    table.text('permissions') // JSON array de permissoes
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })

  // Tabela de plataformas
  await knex.schema.createTable('platforms', table => {
    table.increments('id')
    table.string('name').unique().notNullable()
    table.string('displayName').notNullable()
    table.integer('charLimit').notNullable()
    table.text('features') // JSON array de features suportadas
    table.boolean('active').defaultTo(true)
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })

  // Tabela de templates de prompts
  await knex.schema.createTable('prompt_templates', table => {
    table.increments('id')
    table.string('name').notNullable()
    table.string('type').notNullable() // text, image, video
    table.text('template').notNullable()
    table.text('description')
    table.boolean('isDefault').defaultTo(false)
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    table.index('type')
  })

  // Tabela de configuracao do sistema
  await knex.schema.createTable('system_config', table => {
    table.increments('id')
    table.string('key').unique().notNullable()
    table.text('value')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })

  // Tabela de posts
  await knex.schema.createTable('posts', table => {
    table.increments('id')
    table.integer('brandId').unsigned().notNullable().references('id').inTable('brands').onDelete('CASCADE')
    table.integer('userId').unsigned().references('id').inTable('users').onDelete('SET NULL')
    table.text('content').notNullable()
    table.string('platform').notNullable()
    table.string('status').defaultTo('draft') // draft, approved, scheduled, published
    table.string('origin').defaultTo('manual') // manual, ai
    table.text('aiPrompt') // prompt usado se origin=ai
    table.integer('charCount')
    table.integer('charLimit')
    table.text('warnings') // JSON array de avisos
    table.text('mediaUrls') // JSON array de URLs de midia
    table.timestamp('scheduledAt')
    table.timestamp('publishedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    table.index('brandId')
    table.index('status')
    table.index('platform')
  })

  // Adicionar coluna role na tabela de users
  await knex.schema.alterTable('users', table => {
    table.string('role').defaultTo('viewer')
    table.string('name')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table.dropColumn('role')
    table.dropColumn('name')
  })
  await knex.schema.dropTable('posts')
  await knex.schema.dropTable('system_config')
  await knex.schema.dropTable('prompt_templates')
  await knex.schema.dropTable('platforms')
  await knex.schema.dropTable('roles')
}
