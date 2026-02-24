// Migration: Normalizar slides de posts - criar tabelas relacionadas
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Tabela principal de slides
  await knex.schema.createTable('post_slides', table => {
    table.increments('id').primary()
    table.integer('postId').references('id').inTable('posts').onDelete('CASCADE')
    table.integer('versionId').references('id').inTable('post_versions').onDelete('CASCADE')
    table.integer('slideIndex').notNullable()
    table.string('purpose').notNullable() // 'hook', 'features', 'summary', 'cta'
    table.text('text')
    table.string('imageUrl')
    table.text('imagePrompt')
    table.string('masterImageUrl')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
    // Indice para buscar slides de um post ou versao
    table.index(['postId', 'versionId'])
  })

  // Versoes de imagem por aspect ratio (derivadas da master image)
  await knex.schema.createTable('post_slide_versions', table => {
    table.increments('id').primary()
    table.integer('slideId').notNullable().references('id').inTable('post_slides').onDelete('CASCADE')
    table.string('aspectRatio').notNullable() // '1:1', '4:5', '9:16', '16:9'
    table.string('imageUrl').notNullable()
    table.string('size')
    table.boolean('hasText').defaultTo(false)
    table.timestamp('generatedAt')
    // Constraint: um slide so pode ter uma versao por aspect ratio
    table.unique(['slideId', 'aspectRatio'])
  })

  // Configuracao de tipografia do slide
  await knex.schema.createTable('post_slide_typography', table => {
    table.increments('id').primary()
    table
      .integer('slideId')
      .notNullable()
      .unique()
      .references('id')
      .inTable('post_slides')
      .onDelete('CASCADE')
    table.text('text').notNullable()
    table.string('fontStyle') // 'bold', 'regular', 'light', 'italic'
    table.string('fontFamily') // 'sans-serif', 'serif', 'display', 'handwritten'
    table.string('position') // 'center', 'top', 'bottom', etc
    table.string('size') // 'small', 'medium', 'large', 'xlarge'
    table.string('color')
    table.string('backgroundColor')
    table.string('backgroundStyle')
    table.string('alignment')
    table.boolean('shadow').defaultTo(false)
    table.boolean('outline').defaultTo(false)
  })

  // Metadados de geracao de imagem do slide
  await knex.schema.createTable('post_slide_generation_metadata', table => {
    table.increments('id').primary()
    table
      .integer('slideId')
      .notNullable()
      .unique()
      .references('id')
      .inTable('post_slides')
      .onDelete('CASCADE')
    table.string('provider').notNullable()
    table.string('model').notNullable()
    table.timestamp('generatedAt').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_slide_generation_metadata')
  await knex.schema.dropTableIfExists('post_slide_typography')
  await knex.schema.dropTableIfExists('post_slide_versions')
  await knex.schema.dropTableIfExists('post_slides')
}
