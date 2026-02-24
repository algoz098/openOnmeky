// Migration: Normalizar relacao entre posts e medias - tabela de juncao
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Tabela de juncao N:M entre posts e medias
  await knex.schema.createTable('post_medias', table => {
    table.increments('id').primary()
    table.integer('postId').notNullable().references('id').inTable('posts').onDelete('CASCADE')
    table.integer('mediaId').notNullable().references('id').inTable('medias').onDelete('CASCADE')
    table.integer('position').defaultTo(0) // Ordem das midias no post
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    // Constraint: uma midia so pode estar associada a um post uma vez
    table.unique(['postId', 'mediaId'])
    // Indice para buscar midias de um post
    table.index('postId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_medias')
}
