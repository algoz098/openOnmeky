// Migration: Normalizar briefings criativos dos posts
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Briefing criativo principal
  await knex.schema.createTable('post_creative_briefings', table => {
    table.increments('id').primary()
    table.integer('postId').notNullable().unique().references('id').inTable('posts').onDelete('CASCADE')
    table.text('concept').notNullable()
    table.text('narrative').notNullable()
    table.text('visualStyle').notNullable()
    // Typography inline
    table.string('typographyFontFamily')
    table.string('typographyPrimaryColor')
    table.string('typographySecondaryColor')
    table.string('typographyStyle')
    // Overlay style inline
    table.text('overlayDesignReference')
    table.string('overlayDefaultType')
    table.string('overlayGradientDirection')
    table.decimal('overlayOpacity', 3, 2)
    table.string('overlayCornerRadius')
    table.string('overlayPadding')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })

  // Color palette do briefing (array normalizado)
  await knex.schema.createTable('post_briefing_colors', table => {
    table.increments('id').primary()
    table
      .integer('briefingId')
      .notNullable()
      .references('id')
      .inTable('post_creative_briefings')
      .onDelete('CASCADE')
    table.string('color').notNullable()
    table.integer('position').defaultTo(0)
    table.index('briefingId')
  })

  // Mood keywords do briefing (array normalizado)
  await knex.schema.createTable('post_briefing_mood_keywords', table => {
    table.increments('id').primary()
    table
      .integer('briefingId')
      .notNullable()
      .references('id')
      .inTable('post_creative_briefings')
      .onDelete('CASCADE')
    table.string('keyword').notNullable()
    table.integer('position').defaultTo(0)
    table.index('briefingId')
  })

  // Slides do briefing (direcoes criativas por slide)
  await knex.schema.createTable('post_briefing_slides', table => {
    table.increments('id').primary()
    table
      .integer('briefingId')
      .notNullable()
      .references('id')
      .inTable('post_creative_briefings')
      .onDelete('CASCADE')
    table.integer('slideIndex').notNullable()
    table.string('purpose').notNullable()
    table.text('direction').notNullable()
    table.text('keyMessage').notNullable()
    // Overlay config inline
    table.string('overlayType')
    table.string('overlayPosition')
    table.text('overlayDescription')
    table.index('briefingId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_briefing_slides')
  await knex.schema.dropTableIfExists('post_briefing_mood_keywords')
  await knex.schema.dropTableIfExists('post_briefing_colors')
  await knex.schema.dropTableIfExists('post_creative_briefings')
}
