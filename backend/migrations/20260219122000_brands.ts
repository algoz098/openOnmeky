// Migration para tabela de brands (marcas)
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('brands', table => {
    table.increments('id')
    table.integer('userId').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('name').notNullable()
    table.text('description')
    table.string('sector')
    table.string('toneOfVoice')
    table.text('values') // JSON array
    table.text('preferredWords') // JSON array
    table.text('avoidedWords') // JSON array
    table.text('targetAudience')
    table.text('competitors') // JSON array
    table.text('brandColors') // JSON array
    table.string('logoUrl')
    table.text('prompts') // JSON object
    table.text('aiConfig') // JSON object
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    // Indice para buscas por usuario
    table.index('userId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('brands')
}
