// Migration para criar tabela post_versions
// Cada geracao de IA cria uma nova versao do post, permitindo historico e rollback
import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Criar tabela post_versions
  await knex.schema.createTable('post_versions', table => {
    table.increments('id')
    table.integer('postId').unsigned().notNullable().references('id').inTable('posts').onDelete('CASCADE')
    table.integer('logId').unsigned().references('id').inTable('ai_generation_logs').onDelete('SET NULL')
    table.integer('version').unsigned().notNullable()

    // Conteudo da versao
    table.text('content').notNullable()
    table.text('caption') // Caption/descricao para carousels
    table.text('slides') // JSON array de slides
    table.text('mediaUrls') // JSON array de URLs de midia
    table.text('creativeBriefing') // JSON do briefing criativo

    // Metadados
    table.boolean('isActive').defaultTo(false) // Versao atualmente ativa no post
    table.string('source').defaultTo('ai') // 'ai' ou 'manual'
    table.string('prompt') // Prompt usado para gerar (se source=ai)

    // Estatisticas de geracao
    table.integer('totalTokens')
    table.decimal('costUsd', 10, 6)
    table.integer('executionTimeMs')

    // Timestamps
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())

    // Indices
    table.index('postId')
    table.index('logId')
    table.index(['postId', 'isActive'])
    table.unique(['postId', 'version'])
  })

  // Adicionar campo currentVersionId na tabela posts
  await knex.schema.alterTable('posts', table => {
    table
      .integer('currentVersionId')
      .unsigned()
      .references('id')
      .inTable('post_versions')
      .onDelete('SET NULL')
  })

  // Migrar dados existentes: criar versoes a partir de ai_generation_logs
  const logs = await knex('ai_generation_logs')
    .whereNotNull('postId')
    .where('status', 'completed')
    .select('*')

  for (const log of logs) {
    // Buscar o post associado
    const post = await knex('posts').where('id', log.postId).first()
    if (!post) continue

    // Calcular numero da versao
    const existingVersions = await knex('post_versions')
      .where('postId', log.postId)
      .count('id as count')
      .first()
    const versionNumber = ((existingVersions?.count as number) || 0) + 1

    // Criar versao a partir do log
    const [versionId] = await knex('post_versions').insert({
      postId: log.postId,
      logId: log.id,
      version: versionNumber,
      content: post.content || '',
      caption: post.content || '', // Usar content como caption
      slides: log.slides || post.slides,
      mediaUrls: post.mediaUrls,
      creativeBriefing: post.creativeBriefing,
      isActive: true, // Marcar como ativa (ultima versao)
      source: 'ai',
      prompt: log.originalPrompt,
      totalTokens: log.totalTokens,
      costUsd: log.estimatedCostUsd,
      executionTimeMs: log.executionTimeMs,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    })

    // Desativar versoes anteriores deste post
    await knex('post_versions')
      .where('postId', log.postId)
      .where('id', '!=', versionId)
      .update({ isActive: false })

    // Atualizar post com currentVersionId
    await knex('posts').where('id', log.postId).update({ currentVersionId: versionId })
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remover coluna currentVersionId da tabela posts
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('currentVersionId')
  })

  // Remover tabela post_versions
  await knex.schema.dropTable('post_versions')
}
