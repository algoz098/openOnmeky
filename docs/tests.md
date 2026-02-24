# Plano de Testes - Backend OpenOnmeky

## Visao Geral

Este documento descreve a estrategia de testes para o backend, visando cobertura proxima a 100% das linhas de codigo usando um banco SQLite isolado para testes.

## Arquitetura de Testes

### Banco de Dados de Testes

- **Tipo**: SQLite em memoria (`:memory:`) ou arquivo isolado (`test.sqlite`)
- **Configuracao**: `backend/config/test.json`
- **Migrations**: Executadas automaticamente antes dos testes
- **Seed**: Dados base populados via servico `seed`
- **Limpeza**: Reset entre suites de teste para isolamento

### Estrutura de Diretorios

```
backend/test/
├── setup.ts                    # Configuracao global (migrate, seed, teardown)
├── fixtures/                   # Dados de teste reutilizaveis
│   ├── users.fixture.ts
│   ├── brands.fixture.ts
│   ├── posts.fixture.ts
│   └── index.ts
├── mocks/                      # Mocks de dependencias externas
│   ├── ai-providers.mock.ts    # Mock de todos os providers de IA
│   └── file-system.mock.ts     # Mock para upload de arquivos
├── helpers/                    # Utilitarios para testes
│   ├── auth.helper.ts          # Criar usuarios autenticados com JWT
│   └── db.helper.ts            # Funcoes de limpeza de banco
├── unit/                       # Testes unitarios (sem dependencias externas)
│   ├── services/
│   ├── ai-providers/
│   └── ai-agents/
├── integration/                # Testes de integracao (multiplos servicos)
└── e2e/                        # Testes end-to-end (fluxos completos)
```

### Ferramentas

| Ferramenta | Uso |
|------------|-----|
| Mocha | Test runner |
| Assert (Node.js) | Assertions |
| Sinon | Mocks, stubs, spies |
| nyc (Istanbul) | Cobertura de codigo |

---

## O Que Testar

### 1. Servicos CRUD (Camada de Dados)

#### 1.1 Users Service
- [x] Registrar servico
- [x] Criar usuario com email/password
- [x] Hash de password automatico
- [x] Nao expor password em respostas
- [x] Listar usuarios (autenticado)
- [x] Buscar usuario por ID
- [x] Atualizar usuario (nome, role)
- [x] Atualizar password (re-hash)
- [x] Deletar usuario
- [x] Validar email unico
- [x] Validar roles permitidos (super-admin, admin, editor, viewer)
- [x] Rejeitar criacao sem email
- [ ] Rejeitar criacao sem password (password e opcional no schema)

#### 1.2 Brands Service
- [x] Registrar servico
- [x] Criar brand vinculada a usuario
- [x] Setar userId automaticamente do contexto
- [x] Serializar campos JSON (values, brandColors, prompts, aiConfig)
- [x] Deserializar campos JSON na leitura
- [x] Listar brands do usuario
- [x] Buscar brand por ID
- [x] Atualizar brand (todos os campos)
- [x] Setar prompts default na criacao
- [x] Deletar brand (cascade em posts)
- [x] Validar nome obrigatorio

#### 1.3 Posts Service
- [x] Registrar servico
- [x] Criar post vinculado a brand
- [x] Calcular charCount automaticamente
- [x] Calcular charLimit baseado na plataforma
- [x] Gerar warnings quando excede limite
- [x] Status default "draft"
- [x] Origin default "manual"
- [ ] Serializar mediaUrls, warnings, slides como JSON
- [ ] Deserializar campos JSON na leitura
- [x] Listar posts por brand
- [x] Buscar post por ID
- [x] Atualizar conteudo
- [x] Atualizar status (draft -> approved -> scheduled -> published)
- [x] Setar publishedAt quando status = published
- [x] Deletar post
- [ ] Limpar medias orfas apos patch
- [x] Validar brandId obrigatorio
- [ ] Validar platform obrigatorio

#### 1.4 Roles Service
- [x] Registrar servico
- [x] CRUD basico
- [x] Serializar permissions como JSON
- [ ] Nome unico

#### 1.5 Platforms Service
- [ ] Registrar servico
- [ ] CRUD basico
- [ ] Serializar features como JSON
- [ ] Nome unico
- [ ] Retornar charLimit por plataforma

#### 1.6 Prompt Templates Service
- [ ] Registrar servico
- [ ] CRUD basico
- [ ] Filtrar por tipo (text, image, video)
- [ ] Templates default (isDefault)

#### 1.7 Medias Service
- [ ] Registrar servico
- [ ] Processar upload de arquivo
- [ ] Validar tipos MIME permitidos
- [ ] Validar tamanho maximo por tipo
- [ ] Gerar nome unico para storage
- [ ] Salvar arquivo no disco
- [ ] Retornar URL de acesso
- [ ] Listar medias do usuario
- [ ] Deletar media (remover arquivo fisico)
- [ ] Rejeitar upload sem arquivo
- [ ] Rejeitar tipo nao permitido
- [ ] Rejeitar arquivo muito grande

#### 1.8 AI Generation Logs Service
- [ ] Registrar servico
- [ ] Criar log de geracao
- [ ] Atualizar status (started -> in_progress -> completed/failed)
- [ ] Registrar tokens usados
- [ ] Registrar custo estimado
- [ ] Registrar tempo de execucao
- [ ] Listar logs por brand
- [ ] Buscar log por ID

#### 1.9 Settings Service
- [ ] Registrar servico
- [ ] Retornar configuracoes de IA
- [ ] Atualizar provider especifico
- [ ] Definir provider padrao
- [ ] Atualizar maxTokens global
- [ ] Verificar se provider esta habilitado
- [ ] Listar providers habilitados
- [ ] Retornar pricing de modelos
- [ ] Atualizar pricing de modelo
- [ ] Resetar pricing para defaults

### 2. Servicos de Logica de Negocio

#### 2.1 AI Service (Geracao de Conteudo)
- [x] Registrar servico
- [x] Rejeitar sem brandId
- [x] Selecionar provider padrao quando nao especificado
- [x] Selecionar provider especificado
- [x] Rejeitar provider invalido
- [x] Operacao "generate": gerar conteudo com contexto da marca
- [x] Operacao "generate": usar prompt customizado da marca
- [x] Operacao "generate": incluir hashtags quando solicitado
- [x] Operacao "rewrite": reescrever conteudo mantendo tom
- [x] Operacao "adapt": adaptar para diferentes plataformas
- [x] Operacao "suggest-hashtags": sugerir hashtags relevantes
- [ ] Operacao "carousel": executar orquestracao completa
- [ ] Operacao "carousel": criar log de geracao
- [ ] Operacao "carousel": atualizar log com progresso
- [ ] Operacao "carousel": criar post automaticamente
- [x] Tratar erros de API graciosamente
- [x] Nao expor API keys em erros
- [x] Mensagens de erro amigaveis

#### 2.2 Onboarding Service
- [x] Registrar servico
- [x] Retornar needsOnboarding=true quando sem usuarios
- [x] Retornar needsOnboarding=false quando ja tem usuarios
- [x] Criar super-admin no primeiro onboarding
- [x] Executar seed apos criar admin
- [x] Marcar sistema como inicializado
- [x] Rejeitar segundo onboarding (Forbidden)

#### 2.3 Seed Service
- [x] Registrar servico
- [x] Popular roles padrao
- [x] Popular plataformas padrao
- [x] Popular templates de prompt padrao
- [x] Nao duplicar dados existentes
- [x] Forcar re-seed quando force=true

#### 2.4 System Service
- [x] Registrar servico
- [x] Retornar status de inicializacao
- [ ] Setar sistema como inicializado
- [ ] Persistir status no banco

### 3. AI Providers (Mocks Necessarios)

#### 3.1 Interface Base (AIProvider)
- [x] Todos providers implementam generateText
- [x] Todos providers implementam generateImage (ou throw NotImplemented)
- [x] Todos providers retornam usage (tokens)
- [x] Todos providers retornam model usado

#### 3.2 OpenAI Provider
- [x] Inicializar com API key
- [x] generateText com mensagens
- [ ] generateText com visao (imagens)
- [x] generateImage com DALL-E
- [x] Retornar tokens usados
- [x] Tratar erro de rate limit
- [x] Tratar erro de API key invalida
- [ ] Tratar erro de modelo nao encontrado

#### 3.3 Anthropic Provider
- [x] Inicializar com API key
- [x] generateText com Claude
- [ ] generateText com visao
- [x] Retornar tokens usados
- [ ] Tratar erros especificos Anthropic

#### 3.4 Google Provider
- [x] Inicializar com API key
- [x] generateText com Gemini
- [x] generateImage com Imagen
- [x] Retornar tokens usados
- [ ] Tratar erros especificos Google

#### 3.5 Groq Provider
- [x] Inicializar com API key
- [x] generateText com Llama/Mixtral
- [x] Retornar tokens usados
- [ ] Tratar erros especificos Groq

#### 3.6 Ollama Provider
- [x] Inicializar com baseUrl
- [x] generateText com modelo local
- [x] generateImage com stable-diffusion
- [x] Tratar erro "Ollama nao esta rodando"
- [x] Funcionar sem API key

### 4. AI Agents (Orquestracao)

#### 4.1 Base Agent
- [ ] Obter provider configurado
- [ ] Obter modelo para o agente
- [ ] Estrutura base de execucao
- [ ] Retornar AgentExecution com metricas

#### 4.2 Creative Direction Agent
- [ ] Gerar briefing criativo
- [ ] Incluir contexto da marca
- [ ] Definir conceito e narrativa
- [ ] Especificar overlay de texto
- [ ] Respeitar plataforma alvo
- [ ] Retornar CreativeBriefing tipado

#### 4.3 Analysis Agent
- [ ] Analisar imagens de referencia
- [ ] Extrair cores dominantes
- [ ] Identificar estilo visual
- [ ] Funcionar sem imagens de referencia

#### 4.4 Text Creation Agent
- [ ] Gerar textos para cada slide
- [ ] Respeitar tom de voz
- [ ] Respeitar limite de caracteres
- [ ] Usar palavras preferidas
- [ ] Evitar palavras proibidas

#### 4.5 Image Generation Agent
- [ ] Gerar prompts de imagem
- [ ] Incluir especificacoes de overlay
- [ ] Chamar provider de imagem
- [ ] Salvar imagens geradas como media

#### 4.6 Text Overlay Agent
- [ ] Sobrepor texto nas imagens
- [ ] Aplicar estilos de overlay
- [ ] Gerar imagem final

#### 4.7 Compliance Agent
- [ ] Validar conteudo gerado
- [ ] Verificar palavras proibidas
- [ ] Verificar limites de plataforma
- [ ] Retornar warnings/errors

#### 4.8 Orchestrator
- [ ] Executar todos os agentes em sequencia
- [ ] Passar contexto entre agentes
- [ ] Coletar execucoes de todos agentes
- [ ] Calcular tokens totais
- [ ] Calcular tempo de execucao
- [ ] Tratar falha em qualquer agente
- [ ] Retornar OrchestrationResult completo

### 5. Hooks e Middleware

#### 5.1 Authentication Hooks
- [x] Rejeitar requisicao sem token
- [ ] Rejeitar token invalido
- [ ] Rejeitar token expirado
- [x] Permitir com token valido
- [x] Setar user no contexto

#### 5.2 Validation Hooks
- [x] Validar schema de criacao
- [x] Validar schema de patch
- [ ] Validar query parameters
- [x] Retornar erro detalhado de validacao

#### 5.3 Hooks Especificos de Posts
- [x] calculateCharLimits: calcular antes de criar
- [x] setPublishedAt: setar data ao publicar
- [ ] deserializeJsonFields: converter JSON apos leitura
- [ ] cleanupOrphanedMedia: limpar medias orfas

#### 5.4 Hooks Especificos de Brands
- [x] setUserId: setar userId do contexto
- [x] setDefaultPrompts: prompts padrao na criacao
- [ ] serializeJsonFields: converter para JSON antes de salvar
- [ ] deserializeJsonFields: converter apos leitura

### 6. Integracao e Fluxos E2E

#### 6.1 Fluxo de Onboarding
- [x] Sistema inicia sem usuarios
- [x] Onboarding cria super-admin
- [x] Seed popula dados base
- [x] Sistema marcado como inicializado
- [x] Login funciona apos onboarding

#### 6.2 Fluxo de Criacao de Conteudo Manual
- [x] Criar brand
- [x] Criar post manual
- [ ] Upload de media
- [ ] Associar media ao post
- [x] Atualizar post
- [x] Publicar post

#### 6.3 Fluxo de Geracao com IA
- [ ] Configurar provider de IA
- [x] Criar brand com contexto completo
- [x] Gerar post de texto simples
- [ ] Gerar carrossel completo
- [ ] Log de geracao criado
- [ ] Post criado automaticamente
- [ ] Medias geradas e associadas

#### 6.4 Fluxo de Versionamento
- [ ] Criar post
- [ ] Editar post (cria versao)
- [ ] Listar versoes
- [ ] Restaurar versao anterior

---

## Como Testar

### Configuracao do Ambiente de Testes

**1. Configuracao do banco de testes** (`backend/config/test.json`):
```json
{
  "port": 8998,
  "sqlite": {
    "client": "sqlite3",
    "connection": ":memory:",
    "useNullAsDefault": true
  },
  "authentication": {
    "secret": "test-secret-key-for-jwt-tokens",
    "jwtOptions": {
      "expiresIn": "1h"
    }
  }
}
```

**2. Setup global** (`backend/test/setup.ts`):
```typescript
import { app } from '../src/app'

// Executa antes de todos os testes
before(async function() {
  this.timeout(30000)
  const knex = app.get('sqliteClient')
  await knex.migrate.latest()
})

// Executa apos todos os testes
after(async () => {
  await app.teardown()
})

// Helper para limpar banco entre suites
export async function cleanDatabase() {
  const knex = app.get('sqliteClient')
  await knex.raw('PRAGMA foreign_keys = OFF')

  const tables = [
    'log_slides', 'log_reference_images', 'log_agent_executions',
    'post_slides', 'post_versions', 'post_medias', 'post_warnings',
    'ai_generation_logs', 'medias', 'posts',
    'brand_values', 'brand_colors', 'brand_ai_configs', 'brands',
    'users', 'system_config'
  ]

  for (const table of tables) {
    try { await knex(table).del() } catch {}
  }

  await knex.raw('PRAGMA foreign_keys = ON')
}

// Helper para criar usuario autenticado
export async function createAuthenticatedUser(role = 'super-admin') {
  const user = await app.service('users').create({
    email: `test-${Date.now()}@test.com`,
    password: 'Test123!',
    name: 'Test User',
    role
  })

  const auth = await app.service('authentication').create({
    strategy: 'local',
    email: user.email,
    password: 'Test123!'
  })

  return { user, token: auth.accessToken }
}
```

### Estrategia de Mocks

**Mock de AI Providers** (`backend/test/mocks/ai-providers.mock.ts`):
```typescript
import sinon from 'sinon'
import type { AIProvider, AITextResult, AIImageResult } from '../../src/services/ai-providers'

export function createMockProvider(name = 'mock'): AIProvider {
  return {
    name: name as any,
    generateText: sinon.stub().resolves({
      content: 'Conteudo gerado pelo mock para testes',
      model: `${name}-model`,
      usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 }
    } as AITextResult),
    generateImage: sinon.stub().resolves({
      url: 'http://localhost:3030/uploads/mock-image.png',
      model: `${name}-image-model`,
      revisedPrompt: 'mock revised prompt'
    } as AIImageResult),
    capabilities: {
      textModels: [`${name}-model`],
      imageModels: [`${name}-image-model`],
      supportsVision: true
    }
  }
}

// Substitui provider no servico de AI
export function mockAIProvider(mockProvider: AIProvider) {
  const aiService = app.service('ai') as any
  const original = aiService.getProvider.bind(aiService)
  aiService.getProvider = sinon.stub().resolves(mockProvider)
  return () => { aiService.getProvider = original }
}
```

### Fixtures de Dados

**Usuarios** (`backend/test/fixtures/users.fixture.ts`):
```typescript
export const testUsers = {
  superAdmin: {
    email: 'superadmin@test.com',
    password: 'SuperAdmin123!',
    name: 'Super Admin',
    role: 'super-admin'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin'
  },
  editor: {
    email: 'editor@test.com',
    password: 'Editor123!',
    name: 'Editor User',
    role: 'editor'
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'Viewer123!',
    name: 'Viewer User',
    role: 'viewer'
  }
}
```

**Brands** (`backend/test/fixtures/brands.fixture.ts`):
```typescript
export const testBrands = {
  complete: {
    name: 'Brand Completa',
    description: 'Uma marca com todos os campos preenchidos',
    sector: 'technology',
    toneOfVoice: 'professional',
    targetAudience: 'Desenvolvedores e CTOs',
    values: ['inovacao', 'qualidade', 'transparencia'],
    preferredWords: ['solucao', 'eficiencia', 'resultado'],
    avoidedWords: ['problema', 'dificuldade', 'impossivel'],
    competitors: ['Competitor A', 'Competitor B'],
    brandColors: ['#3498db', '#2c3e50', '#ecf0f1']
  },
  minimal: {
    name: 'Brand Minima',
    description: 'Apenas campos obrigatorios'
  }
}
```

**Posts** (`backend/test/fixtures/posts.fixture.ts`):
```typescript
export const testPosts = {
  instagram: {
    content: 'Post de teste para Instagram com hashtags #teste #dev',
    platform: 'instagram',
    status: 'draft',
    origin: 'manual'
  },
  twitter: {
    content: 'Post curto para Twitter',
    platform: 'twitter',
    status: 'draft'
  },
  aiGenerated: {
    content: 'Conteudo gerado por IA',
    platform: 'instagram',
    status: 'draft',
    origin: 'ai',
    aiPrompt: 'Crie um post sobre produtividade'
  }
}
```

### Padrao de Teste

```typescript
// backend/test/unit/services/[service].unit.test.ts
import assert from 'assert'
import { app } from '../../../src/app'
import { cleanDatabase, createAuthenticatedUser } from '../../setup'
import { testBrands } from '../../fixtures'

describe('[Service] Service - Unit Tests', () => {
  let testUser: { user: any; token: string }

  before(async () => {
    await cleanDatabase()
    testUser = await createAuthenticatedUser()
  })

  after(() => cleanDatabase())

  describe('create', () => {
    it('deve criar com dados validos', async () => {
      // Arrange
      const data = { /* ... */ }

      // Act
      const result = await app.service('[service]').create(
        data,
        { user: testUser.user }
      )

      // Assert
      assert.ok(result.id)
    })

    it('deve rejeitar dados invalidos', async () => {
      // Arrange
      const invalidData = { /* ... */ }

      // Act & Assert
      try {
        await app.service('[service]').create(invalidData, { user: testUser.user })
        assert.fail('Deveria ter lancado erro')
      } catch (error: any) {
        assert.ok(['BadRequest', 'ValidationError'].includes(error.name))
      }
    })
  })
})
```

### Executando Testes

```bash
# Rodar todos os testes
npm test

# Rodar testes com watch
npm run mocha -- --watch

# Rodar teste especifico
npm run mocha -- --grep "posts service"

# Rodar com cobertura
npm run test:coverage

# Gerar relatorio HTML de cobertura
npm run test:coverage:report
```

---

## Checklist de Implementacao

### Fase 1: Infraestrutura (Prioridade Alta) - CONCLUIDA
- [x] Atualizar `backend/config/test.json` com banco em memoria
- [x] Criar `backend/test/setup.ts` com helpers globais
- [x] Criar `backend/test/fixtures/index.ts` com dados de teste
- [x] Criar `backend/test/mocks/ai-providers.mock.ts`
- [x] Criar `backend/test/helpers/auth.helper.ts`
- [x] Criar `backend/test/helpers/db.helper.ts`
- [x] Adicionar `sinon` e `nyc` ao devDependencies
- [ ] Configurar scripts de cobertura no package.json

### Fase 2: Servicos CRUD (Prioridade Alta) - EM PROGRESSO
- [x] Testes completos: users service (18 testes)
- [x] Testes completos: brands service (22 testes)
- [x] Testes completos: posts service (10 testes)
- [ ] Testes completos: medias service (~15 testes)
- [ ] Testes completos: settings service (~10 testes)

### Fase 3: Servicos de Negocio (Prioridade Alta) - EM PROGRESSO
- [x] Testes completos: ai service (24 testes - ai + ai-providers)
- [x] Testes completos: onboarding service (10 testes)
- [x] Testes completos: seed service (16 testes)
- [ ] Testes completos: system service (~4 testes)

### Fase 4: AI Providers (Prioridade Media) - PARCIAL
- [x] Testes: OpenAI provider (incluido em ai-providers.test.ts)
- [ ] Testes: Anthropic provider (~8 testes)
- [ ] Testes: Google provider (~8 testes)
- [ ] Testes: Groq provider (~8 testes)
- [x] Testes: Ollama provider (incluido em ai-providers.test.ts)

### Fase 5: AI Agents (Prioridade Media)
- [ ] Testes: Base Agent (~5 testes)
- [ ] Testes: Creative Direction Agent (~5 testes)
- [ ] Testes: Analysis Agent (~5 testes)
- [ ] Testes: Text Creation Agent (~5 testes)
- [ ] Testes: Image Generation Agent (~5 testes)
- [ ] Testes: Text Overlay Agent (~5 testes)
- [ ] Testes: Compliance Agent (~5 testes)
- [ ] Testes: Orchestrator (~15 testes)

### Fase 6: Servicos Auxiliares (Prioridade Baixa) - EM PROGRESSO
- [x] Testes: roles service (14 testes)
- [ ] Testes: platforms service (~6 testes)
- [ ] Testes: prompt-templates service (~6 testes)
- [ ] Testes: ai-generation-logs service (~8 testes)

### Fase 7: Integracao e E2E (Prioridade Media) - PARCIAL
- [x] Teste E2E: fluxo de onboarding completo
- [ ] Teste E2E: fluxo de criacao manual de post
- [ ] Teste E2E: fluxo de geracao com IA
- [ ] Teste E2E: fluxo de versionamento

### Fase 8: Cobertura e Qualidade
- [ ] Atingir 80% de cobertura de linhas
- [ ] Atingir 90% de cobertura de linhas
- [ ] Atingir 95%+ de cobertura de linhas
- [ ] Documentar casos de borda testados
- [ ] Revisar e refatorar testes duplicados

---

## Status Atual

**Testes implementados**: 154 testes passando
**Ultima atualizacao**: 2026-02-24

| Categoria | Testes | Status |
|-----------|--------|--------|
| Application tests | 2 | Concluido |
| Users service | 18 | Concluido |
| Brands service | 22 | Concluido |
| Brand prompts | 10 | Concluido |
| Posts service | 10 | Parcial |
| Post validation | 16 | Concluido |
| AI service | 14 | Concluido |
| AI providers | 10 | Parcial |
| Onboarding service | 10 | Concluido |
| Seed service | 16 | Concluido |
| Roles service | 14 | Concluido |
| Client tests | 2 | Concluido |
| **Total** | **154** | **Em progresso** |

---

## Metricas de Sucesso

| Metrica | Meta Minima | Meta Ideal | Atual |
|---------|-------------|------------|-------|
| Cobertura de Linhas | 80% | 95%+ | A medir |
| Cobertura de Branches | 70% | 85%+ | A medir |
| Cobertura de Funcoes | 80% | 95%+ | A medir |
| Testes Passando | 100% | 100% | 100% (154/154) |
| Tempo de Execucao | < 60s | < 30s | ~9s |

---

## Estimativa de Esforco Restante

| Fase | Testes Restantes | Tempo Estimado |
|------|------------------|----------------|
| Fase 2: Servicos CRUD | ~25 testes | 2-3 horas |
| Fase 3: Servicos de Negocio | ~4 testes | 1 hora |
| Fase 4: AI Providers | ~24 testes | 3-4 horas |
| Fase 5: AI Agents | ~50 testes | 5-6 horas |
| Fase 6: Servicos Auxiliares | ~20 testes | 2 horas |
| Fase 7: Integracao E2E | ~3 testes | 2 horas |
| Fase 8: Cobertura | - | 2-3 horas |
| **Total Restante** | **~126 testes** | **~18 horas** |

