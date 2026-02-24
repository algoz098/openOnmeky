// Migration para tabela de medias (arquivos de midia)
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('medias', table => {
    table.increments('id')
    table.integer('userId').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('originalName').notNullable() // Nome original do arquivo
    table.string('storedName').notNullable().unique() // Nome unico no storage
    table.string('mimeType').notNullable() // Tipo MIME (image/jpeg, image/png, etc)
    table.integer('size').unsigned().notNullable() // Tamanho em bytes
    table.string('path').notNullable() // Caminho relativo no storage
    table.string('url').notNullable() // URL para acesso
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    // Indices para buscas
    table.index('userId')
    table.index('mimeType')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('medias')
}
