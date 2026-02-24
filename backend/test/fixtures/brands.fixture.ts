// Fixtures de brands para testes

export interface TestBrandData {
  name: string
  description?: string
  sector?: string
  toneOfVoice?: string
  targetAudience?: string
  values?: string[]
  preferredWords?: string[]
  avoidedWords?: string[]
  competitors?: string[]
  brandColors?: string[]
  logoUrl?: string
}

export const testBrands: Record<string, TestBrandData> = {
  complete: {
    name: 'Brand Completa',
    description: 'Uma marca com todos os campos preenchidos para testes completos',
    sector: 'technology',
    toneOfVoice: 'professional',
    targetAudience: 'Desenvolvedores, CTOs e tech leads entre 25-45 anos',
    values: ['inovacao', 'qualidade', 'transparencia', 'colaboracao'],
    preferredWords: ['solucao', 'eficiencia', 'resultado', 'transformacao'],
    avoidedWords: ['problema', 'dificuldade', 'impossivel', 'complicado'],
    competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
    brandColors: ['#3498db', '#2c3e50', '#ecf0f1', '#e74c3c']
  },
  minimal: {
    name: 'Brand Minima',
    description: 'Marca apenas com campos obrigatorios'
  },
  fashion: {
    name: 'Fashion Brand',
    description: 'Marca de moda e lifestyle',
    sector: 'fashion',
    toneOfVoice: 'casual',
    targetAudience: 'Jovens adultos 18-35 anos interessados em moda',
    values: ['estilo', 'autenticidade', 'sustentabilidade'],
    brandColors: ['#000000', '#ffffff', '#ff6b6b']
  },
  food: {
    name: 'Food & Beverage',
    description: 'Marca de alimentos e bebidas',
    sector: 'food',
    toneOfVoice: 'friendly',
    targetAudience: 'Familias e jovens profissionais',
    values: ['sabor', 'qualidade', 'tradicao'],
    preferredWords: ['delicioso', 'fresco', 'artesanal'],
    avoidedWords: ['artificial', 'processado']
  },
  health: {
    name: 'Health & Wellness',
    description: 'Marca de saude e bem-estar',
    sector: 'health',
    toneOfVoice: 'empathetic',
    targetAudience: 'Pessoas interessadas em saude e qualidade de vida',
    values: ['saude', 'bem-estar', 'equilibrio', 'cuidado']
  }
}

// Dados invalidos para testes de validacao
export const invalidBrands = {
  noName: {
    description: 'Brand sem nome'
  },
  emptyName: {
    name: '',
    description: 'Brand com nome vazio'
  }
}
