// Migration: Normalizar warnings e imagens de referencia dos posts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Warnings do post (array normalizado)
  await knex.schema.createTable('post_warnings', table => {
    table.increments('id').primary()
    table.integer('postId').notNullable().references('id').inTable('posts').onDelete('CASCADE')
    table.text('message').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.index('postId')
  })

  // Imagens de referencia para IA (array normalizado)
  await knex.schema.createTable('post_reference_images', table => {
    table.increments('id').primary()
    table.integer('postId').notNullable().references('id').inTable('posts').onDelete('CASCADE')
    table.string('imageUrl').notNullable()
    table.integer('position').defaultTo(0)
    table.index('postId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_reference_images')
  await knex.schema.dropTableIfExists('post_warnings')
}
