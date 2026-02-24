// Hooks para filtragem de dados por usuario (multi-tenancy)
import { Forbidden } from '@feathersjs/errors'
import type { HookContext } from '../declarations'

/**
 * Hook para filtrar queries por userId do usuario autenticado
 * Garante que usuarios so vejam seus proprios dados
 */
export const filterByUserId = async (context: HookContext) => {
  if (context.params.user) {
    context.params.query = {
      ...context.params.query,
      userId: context.params.user.id
    }
  }
  return context
}

/**
 * Hook para filtrar queries por brandId, garantindo que o usuario
 * so acesse dados de brands que pertencem a ele
 */
export const filterByUserBrands = async (context: HookContext) => {
  if (!context.params.user) {
    return context
  }

  const userId = context.params.user.id
  const db = context.app.get('sqliteClient')

  // Buscar todas as brands do usuario
  const userBrands = await db('brands').where('userId', userId).select('id')
  const brandIds = userBrands.map((b: { id: number }) => b.id)

  if (brandIds.length === 0) {
    // Usuario nao tem brands, retorna array vazio
    context.params.query = {
      ...context.params.query,
      brandId: -1 // ID impossivel, garante resultado vazio
    }
    return context
  }

  // Se ja tem um brandId na query, verificar se pertence ao usuario
  const queryBrandId = context.params.query?.brandId
  if (queryBrandId !== undefined) {
    if (!brandIds.includes(Number(queryBrandId))) {
      throw new Forbidden('Acesso negado a esta marca')
    }
  } else {
    // Se nao tem brandId na query, filtrar por todas as brands do usuario
    context.params.query = {
      ...context.params.query,
      brandId: { $in: brandIds }
    }
  }

  return context
}

/**
 * Hook para verificar se o usuario tem acesso a um recurso especifico
 * baseado no brandId do recurso
 * IMPORTANTE: Usa query direta ao banco para evitar loop infinito de hooks
 */
export const verifyBrandAccess = async (context: HookContext) => {
  if (!context.params.user || !context.id) {
    return context
  }

  const userId = context.params.user.id
  const db = context.app.get('sqliteClient')

  // Buscar o recurso diretamente no banco (evita loop infinito de hooks)
  // context.path contem o nome do servico (ex: 'posts', 'ai-generation-logs')
  // O nome da tabela usa underscores em vez de hyphens
  const tableName = context.path.replace(/-/g, '_')
  const resource = await db(tableName).where('id', context.id).first()

  if (!resource) {
    // Recurso nao encontrado - deixar o servico lidar com isso
    return context
  }

  if (resource.brandId) {
    // Verificar se a brand pertence ao usuario
    const brand = await db('brands').where('id', resource.brandId).where('userId', userId).first()

    if (!brand) {
      throw new Forbidden('Acesso negado a este recurso')
    }
  } else if (resource.userId) {
    // Se tem userId direto, verificar
    if (resource.userId !== userId) {
      throw new Forbidden('Acesso negado a este recurso')
    }
  }

  return context
}

/**
 * Hook para definir userId automaticamente na criacao
 */
export const setUserIdOnCreate = async (context: HookContext) => {
  if (context.params.user && context.data) {
    context.data.userId = context.params.user.id
  }
  return context
}

/**
 * Hook para verificar se o brandId fornecido pertence ao usuario
 * antes de criar recursos associados a uma brand
 */
export const verifyBrandOwnership = async (context: HookContext) => {
  if (!context.params.user || !context.data?.brandId) {
    return context
  }

  const userId = context.params.user.id
  const brandId = context.data.brandId
  const db = context.app.get('sqliteClient')

  const brand = await db('brands').where('id', brandId).where('userId', userId).first()

  if (!brand) {
    throw new Forbidden('Voce nao tem permissao para criar recursos nesta marca')
  }

  return context
}

/**
 * Hook para filtrar queries por postId, garantindo que o usuario
 * so acesse dados de posts que pertencem a brands dele
 */
export const filterByUserPosts = async (context: HookContext) => {
  if (!context.params.user) {
    return context
  }

  const userId = context.params.user.id
  const db = context.app.get('sqliteClient')

  // Buscar todas as brands do usuario
  const userBrands = await db('brands').where('userId', userId).select('id')
  const brandIds = userBrands.map((b: { id: number }) => b.id)

  if (brandIds.length === 0) {
    context.params.query = {
      ...context.params.query,
      postId: -1
    }
    return context
  }

  // Buscar todos os posts das brands do usuario
  const userPosts = await db('posts').whereIn('brandId', brandIds).select('id')
  const postIds = userPosts.map((p: { id: number }) => p.id)

  if (postIds.length === 0) {
    context.params.query = {
      ...context.params.query,
      postId: -1
    }
    return context
  }

  // Se ja tem um postId na query, verificar se pertence ao usuario
  const queryPostId = context.params.query?.postId
  if (queryPostId !== undefined) {
    if (!postIds.includes(Number(queryPostId))) {
      throw new Forbidden('Acesso negado a este post')
    }
  } else {
    context.params.query = {
      ...context.params.query,
      postId: { $in: postIds }
    }
  }

  return context
}

/**
 * Hook para verificar acesso a recursos que tem postId
 * IMPORTANTE: Usa query direta ao banco para evitar loop infinito de hooks
 */
export const verifyPostAccess = async (context: HookContext) => {
  if (!context.params.user || !context.id) {
    return context
  }

  const userId = context.params.user.id
  const db = context.app.get('sqliteClient')

  // Buscar o recurso diretamente no banco (evita loop infinito de hooks)
  // O nome da tabela usa underscores em vez de hyphens
  const tableName = context.path.replace(/-/g, '_')
  const resource = await db(tableName).where('id', context.id).first()

  if (!resource) {
    // Recurso nao encontrado - deixar o servico lidar com isso
    return context
  }

  if (resource.postId) {
    // Buscar o post e verificar se a brand pertence ao usuario
    const post = await db('posts').where('id', resource.postId).first()

    if (post) {
      const brand = await db('brands').where('id', post.brandId).where('userId', userId).first()

      if (!brand) {
        throw new Forbidden('Acesso negado a este recurso')
      }
    }
  }

  return context
}

/**
 * Hook para verificar se o postId fornecido pertence ao usuario
 */
export const verifyPostOwnership = async (context: HookContext) => {
  if (!context.params.user || !context.data?.postId) {
    return context
  }

  const userId = context.params.user.id
  const postId = context.data.postId
  const db = context.app.get('sqliteClient')

  const post = await db('posts').where('id', postId).first()

  if (!post) {
    throw new Forbidden('Post nao encontrado')
  }

  const brand = await db('brands').where('id', post.brandId).where('userId', userId).first()

  if (!brand) {
    throw new Forbidden('Voce nao tem permissao para criar recursos neste post')
  }

  return context
}

