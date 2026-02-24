// Migration para adicionar campos de IA na tabela posts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.text('aiContext') // Contexto adicional para geracao
    table.string('aiMode') // 'text' ou 'carousel'
    table.string('aiType') // 'post', 'story', 'reels', 'article'
    table.string('aiTone') // 'formal', 'casual', 'humoristico', 'inspirador'
    table.text('aiReferenceImages') // JSON array de URLs de imagens de referencia
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('aiContext')
    table.dropColumn('aiMode')
    table.dropColumn('aiType')
    table.dropColumn('aiTone')
    table.dropColumn('aiReferenceImages')
  })
}
