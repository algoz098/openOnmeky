// Migration para adicionar coluna slides na tabela posts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.text('slides') // JSON array de slides do carrousel
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('slides')
  })
}
