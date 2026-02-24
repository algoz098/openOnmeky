// Setup global para testes
// Executado antes de todos os testes para configurar o ambiente

import { app } from '../src/app'

// Timeout aumentado para migrations
const SETUP_TIMEOUT = 30000

// Executa antes de todos os testes
before(async function () {
  this.timeout(SETUP_TIMEOUT)

  // Executa migrations no banco de teste (em memoria)
  const knex = app.get('sqliteClient')
  await knex.migrate.latest()

  // Popula dados basicos (roles, platforms, prompt-templates)
  // Chamada interna sem provider, nao requer autenticacao
  const seedService = app.service('seed') as unknown as {
    create: (data: { force: boolean }) => Promise<{ seeded: boolean }>
  }
  await seedService.create({ force: true })
})

// Executa apos todos os testes
after(async () => {
  try {
    await app.teardown()
  } catch {
    // Servidor ja foi fechado por outro teste
  }
})

// ==================== HELPERS ====================

/**
 * Limpa todas as tabelas do banco de dados e re-executa o seed
 * Use entre suites de teste para garantir isolamento
 * Automaticamente repopula dados basicos (roles, platforms, prompt-templates)
 */
export async function cleanDatabase(): Promise<void> {
  const knex = app.get('sqliteClient')

  // Desabilita foreign keys temporariamente
  await knex.raw('PRAGMA foreign_keys = OFF')

  // Tabelas na ordem correta (dependencias primeiro)
  // NAO inclui tabelas de seed (platforms, roles, prompt_templates, system_config)
  // para evitar re-seed desnecessario quando possivel
  const tables = [
    // Tabelas de logs e relacionamentos
    'log_slides',
    'log_reference_images',
    'log_agent_executions',
    'post_slides',
    'post_versions',
    'post_medias',
    'post_warnings',
    'post_reference_images',
    'post_creative_briefings',
    'post_briefing_slides',
    'post_briefing_mood_keywords',
    'post_briefing_colors',
    'post_ai_executions',
    'post_ai_agent_costs',
    'ai_generation_logs',
    'ai_usage_summary',
    'ai_requests',
    // Tabelas de medias e posts
    'medias',
    'posts',
    // Tabelas de brands
    'brand_values',
    'brand_colors',
    'brand_ai_configs',
    'brand_preferred_words',
    'brand_avoided_words',
    'brand_competitors',
    'brands',
    // Tabelas de usuarios (exceto dados de seed)
    'users'
  ]

  for (const table of tables) {
    try {
      await knex(table).del()
    } catch {
      // Tabela pode nao existir ainda
    }
  }

  await knex.raw('PRAGMA foreign_keys = ON')
}

/**
 * Limpa TODAS as tabelas do banco de dados, incluindo dados de seed
 * Use apenas quando precisar resetar completamente o banco
 * Requer re-execucao manual do seed depois
 */
export async function cleanDatabaseFull(): Promise<void> {
  const knex = app.get('sqliteClient')

  // Desabilita foreign keys temporariamente
  await knex.raw('PRAGMA foreign_keys = OFF')

  // Todas as tabelas, incluindo seed
  const tables = [
    // Tabelas de logs e relacionamentos
    'log_slides',
    'log_reference_images',
    'log_agent_executions',
    'post_slides',
    'post_versions',
    'post_medias',
    'post_warnings',
    'post_reference_images',
    'post_creative_briefings',
    'post_briefing_slides',
    'post_briefing_mood_keywords',
    'post_briefing_colors',
    'post_ai_executions',
    'post_ai_agent_costs',
    'ai_generation_logs',
    'ai_usage_summary',
    'ai_requests',
    // Tabelas de medias e posts
    'medias',
    'posts',
    // Tabelas de brands
    'brand_values',
    'brand_colors',
    'brand_ai_configs',
    'brand_preferred_words',
    'brand_avoided_words',
    'brand_competitors',
    'brands',
    // Tabelas de plataformas (seed)
    'platform_features',
    'platforms',
    // Tabelas base (seed)
    'prompt_templates',
    'roles',
    'users',
    'system_config'
  ]

  for (const table of tables) {
    try {
      await knex(table).del()
    } catch {
      // Tabela pode nao existir ainda
    }
  }

  await knex.raw('PRAGMA foreign_keys = ON')

  // Re-popula dados basicos automaticamente
  const seedService = app.service('seed') as unknown as {
    create: (data: { force: boolean }) => Promise<void>
  }
  await seedService.create({ force: true })
}

/**
 * Cria um usuario autenticado para testes
 * Retorna o usuario e o token JWT
 */
export async function createAuthenticatedUser(
  role: 'super-admin' | 'admin' | 'editor' | 'viewer' = 'super-admin',
  email?: string
): Promise<{ user: { id: number; email: string; name: string; role: string }; token: string }> {
  const uniqueEmail = email || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`

  const user = await app.service('users').create({
    email: uniqueEmail,
    password: 'Test123!',
    name: `Test User ${role}`,
    role
  })

  const auth = await app.service('authentication').create({
    strategy: 'local',
    email: uniqueEmail,
    password: 'Test123!'
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role || 'viewer'
    },
    token: auth.accessToken
  }
}

/**
 * Cria um usuario simples sem autenticar
 * Util para testes que precisam apenas do usuario no contexto
 */
export async function createTestUser(
  role: 'super-admin' | 'admin' | 'editor' | 'viewer' = 'super-admin'
): Promise<{ id: number; email: string; name: string; role: string }> {
  const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`

  const user = await app.service('users').create({
    email: uniqueEmail,
    password: 'Test123!',
    name: `Test User ${role}`,
    role
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    role: user.role || 'viewer'
  }
}

/**
 * Cria params com user para chamadas de servico em testes
 * Usa type casting para evitar erros de TypeScript com tipos parciais
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function userParams(user: { id: number; email?: string; name?: string; role?: string }): any {
  return {
    user: {
      id: user.id,
      email: user.email || `user-${user.id}@test.com`,
      name: user.name || 'Test User',
      role: user.role || 'viewer'
    }
  }
}

/**
 * Executa seed de dados basicos
 * Popula roles, platforms e prompt-templates
 */
export async function seedDatabase(): Promise<void> {
  const seedService = app.service('seed') as unknown as {
    create: (data: { force: boolean }) => Promise<void>
  }
  await seedService.create({ force: true })
}

// Exporta a app para uso nos testes
export { app }
