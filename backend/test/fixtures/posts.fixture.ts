// Fixtures de posts para testes

export interface TestPostData {
  content: string
  platform: string
  status?: 'draft' | 'approved' | 'scheduled' | 'published'
  origin?: 'manual' | 'ai'
  aiPrompt?: string
  mediaUrls?: string[]
}

export const testPosts: Record<string, TestPostData> = {
  instagramSimple: {
    content: 'Post de teste para Instagram com hashtags #teste #dev #openonmeky',
    platform: 'instagram',
    status: 'draft',
    origin: 'manual'
  },
  twitter: {
    content: 'Post curto para Twitter - testando limites de caracteres',
    platform: 'twitter',
    status: 'draft',
    origin: 'manual'
  },
  twitterLong: {
    content: 'A'.repeat(300), // Excede limite de 280 caracteres
    platform: 'twitter',
    status: 'draft'
  },
  linkedin: {
    content: `Post profissional para LinkedIn.

Este e um post mais longo que demonstra o formato tipico de conteudo profissional.

- Ponto 1: Qualidade
- Ponto 2: Inovacao
- Ponto 3: Resultados

#LinkedIn #Profissional #Carreira`,
    platform: 'linkedin',
    status: 'draft'
  },
  threads: {
    content: 'Post para Threads com conteudo curto e direto',
    platform: 'threads',
    status: 'draft'
  },
  facebook: {
    content: 'Post para Facebook com conteudo mais extenso e informal para engajar a comunidade.',
    platform: 'facebook',
    status: 'draft'
  },
  tiktok: {
    content: 'Descricao para video do TikTok #fyp #viral #trending',
    platform: 'tiktok',
    status: 'draft'
  },
  aiGenerated: {
    content: 'Conteudo gerado por IA sobre produtividade e organizacao no trabalho remoto.',
    platform: 'instagram',
    status: 'draft',
    origin: 'ai',
    aiPrompt: 'Crie um post sobre produtividade no trabalho remoto'
  },
  withMedia: {
    content: 'Post com midias anexadas',
    platform: 'instagram',
    status: 'draft',
    mediaUrls: [
      'http://localhost:3030/uploads/test-image-1.jpg',
      'http://localhost:3030/uploads/test-image-2.jpg'
    ]
  },
  approved: {
    content: 'Post aprovado aguardando agendamento',
    platform: 'instagram',
    status: 'approved'
  },
  scheduled: {
    content: 'Post agendado para publicacao',
    platform: 'instagram',
    status: 'scheduled'
  },
  published: {
    content: 'Post ja publicado',
    platform: 'instagram',
    status: 'published'
  }
}

// Dados invalidos para testes de validacao
export const invalidPosts = {
  noContent: {
    platform: 'instagram'
  },
  noPlatform: {
    content: 'Post sem plataforma definida'
  },
  noBrandId: {
    content: 'Post sem brandId',
    platform: 'instagram'
  },
  invalidPlatform: {
    content: 'Post com plataforma invalida',
    platform: 'invalid_platform'
  },
  invalidStatus: {
    content: 'Post com status invalido',
    platform: 'instagram',
    status: 'invalid_status' as 'draft'
  }
}

// Limites de caracteres por plataforma (para validacao)
export const platformLimits: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  linkedin: 3000,
  threads: 500,
  facebook: 63206,
  tiktok: 2200
}
