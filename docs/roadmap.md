# OpenOnmeky - Roadmap

> Status do projeto e planejamento de implementacao

**Ultima atualizacao**: 2026-02-24

---

## Indice

1. [O Que Ja Implementamos](#1-o-que-ja-implementamos)
2. [O Que Iremos Implementar](#2-o-que-iremos-implementar)
3. [O Que Queremos Implementar](#3-o-que-queremos-implementar)
4. [Stack Tecnologica Definida](#4-stack-tecnologica-definida)

---

## 1. O Que Ja Implementamos

### Backend (FeathersJS)

| Componente | Status | Descricao |
|------------|--------|-----------|
| Estrutura do Projeto | Concluido | Monorepo com pastas `backend/` e `frontend/` |
| Framework FeathersJS | Concluido | Koa + REST + Socket.io |
| Banco de Dados | Concluido | SQLite com Knex.js |
| Sistema de Migrations | Concluido | Knex migrations configurado |
| Servico de Usuarios | Concluido | CRUD completo com validacao e roles |
| Autenticacao JWT | Concluido | Login com email/senha |
| Autenticacao Local | Concluido | Estrategia local configurada |
| Validacao com TypeBox | Concluido | Schemas tipados |
| Logging | Concluido | Winston configurado |
| Testes | Concluido | Mocha + 154 testes passando |
| **Servico de Brands** | Concluido | CRUD completo com guidelines, prompts, normalizacao |
| **Servico de Posts** | Concluido | CRUD com carrossel, versoes, slides |
| **Modulo de IA** | Concluido | 5 providers, 6+ agentes especializados |
| **Sistema de Onboarding** | Concluido | Wizard de configuracao inicial |
| **Servico de Medias** | Concluido | Upload e gerenciamento de arquivos |
| **Sistema de Roles** | Concluido | 4 roles com permissoes granulares |
| **Servico de Plataformas** | Concluido | 6 plataformas com limites de caracteres |
| **Servico de Settings** | Concluido | Configuracoes de sistema e IA |

### Frontend (Vue 3 + Quasar)

| Componente | Status | Descricao |
|------------|--------|-----------|
| Estrutura Quasar | Concluido | Vue 3 + Composition API |
| Pagina de Login | Concluido | Autenticacao JWT |
| Pagina de Onboarding | Concluido | Wizard de 3 passos |
| Dashboard | Concluido | Visao geral com metricas |
| CRUD de Brands | Concluido | Lista, criacao, edicao, detalhes |
| CRUD de Posts | Concluido | Editor com preview e carrossel |
| Pagina de Settings | Concluido | Configuracoes de IA e sistema |
| Roteamento | Concluido | Guards de autenticacao |
| Stores (Pinia) | Concluido | Gerenciamento de estado |

### Documentacao

| Documento | Status | Descricao |
|-----------|--------|-----------|
| README.md | Concluido | Visao geral do projeto |
| docs/README.md | Concluido | Documentacao e roadmap inicial |
| docs/roadmap.md | Concluido | Progresso detalhado |
| docs/specs.md | Concluido | Especificacoes de features |
| docs/postiz.md | Concluido | Analise do Postiz + decisoes tecnicas |
| docs/mixpost.md | Concluido | Analise do Mixpost |
| docs/buffer.md | Concluido | Analise do Buffer |
| docs/omneky.md | Concluido | Analise do Omneky |
| docs/deep_research.md | Concluido | Pesquisa tecnica avancada |
| docs/unknowns.md | Concluido | Lacunas de conhecimento |
| AGENTS.md | Concluido | Tecnologias de IA e agentes |

---

## 2. O Que Iremos Implementar

### Fase 1: MVP - Criacao de Conteudo com IA (CONCLUIDA)

> O usuario pode criar conteudo com IA alinhado com a marca. Publicacao manual nas redes sociais.

| Tarefa | Status | Prioridade |
|--------|--------|------------|
| **Servico de Marcas (Brands)** | Concluido | Critica |
| Cadastro de marca | Concluido | Critica |
| Guidelines de marca (tom de voz, valores, palavras-chave) | Concluido | Critica |
| Paleta de cores e identidade visual | Concluido | Alta |
| Personas/publico-alvo | Concluido | Alta |
| Tabelas normalizadas (brand_colors, brand_values, brand_ai_configs) | Concluido | Alta |
| **Servico de Posts** | Concluido | Critica |
| CRUD de posts | Concluido | Critica |
| Vinculo post-marca | Concluido | Critica |
| Status de post (draft, approved, scheduled, published) | Concluido | Alta |
| Posts em carrossel com slides | Concluido | Alta |
| Versoes de posts | Concluido | Alta |
| **Modulo de IA** | Concluido | Critica |
| Integracao OpenAI (GPT-4o, DALL-E 3) | Concluido | Critica |
| Integracao Anthropic (Claude Sonnet 4, Opus 4) | Concluido | Alta |
| Integracao Google (Gemini, Imagen) | Concluido | Alta |
| Integracao Groq (Llama 3.3) | Concluido | Media |
| Suporte a Ollama (local) | Concluido | Media |
| Geracao de posts baseada em guidelines da marca | Concluido | Critica |
| Sugestao de hashtags | Concluido | Alta |
| Reescrita para diferentes plataformas | Concluido | Alta |
| Templates de prompts por tipo de conteudo | Concluido | Alta |
| **Sistema de Agentes de IA** | Concluido | Alta |
| Agente de Criacao de Texto | Concluido | Alta |
| Agente de Geracao de Imagem | Concluido | Alta |
| Agente de Direcao Criativa | Concluido | Alta |
| Agente de Analise | Concluido | Alta |
| Agente de Compliance | Concluido | Alta |
| Agente de Text Overlay | Concluido | Alta |
| Orquestrador de Agentes | Concluido | Alta |

### Fase 2: Midias e Preview (CONCLUIDA)

| Tarefa | Status | Prioridade |
|--------|--------|------------|
| Upload de imagens | Concluido | Alta |
| Servico de medias com tipos (image, video, document) | Concluido | Alta |
| Geracao de imagens com IA (DALL-E, Imagen) | Concluido | Media |
| Derivacao de imagens em diferentes proporcoes | Concluido | Media |
| Regeneracao de slides individuais | Concluido | Media |
| Logs de geracao de IA | Concluido | Media |
| Auditoria de requests de IA | Concluido | Media |

### Fase 3: Integracoes e Agendamento (Secundario)

> Publicacao automatica - usuario ja pode postar manualmente ate aqui.

| Tarefa | Status | Prioridade |
|--------|--------|------------|
| OAuth com Meta (Instagram/Facebook) | Pendente | Media |
| Integracao X/Twitter | Pendente | Media |
| Integracao LinkedIn | Pendente | Media |
| Agendamento basico de posts | Pendente | Media |
| Sistema de filas | Pendente | Media |
| Worker de publicacao | Pendente | Media |
| Calendario de publicacoes | Pendente | Baixa |

### Fase 4: Analytics e Otimizacao

| Tarefa | Status | Prioridade |
|--------|--------|------------|
| Dashboard de analytics | Pendente | Baixa |
| Sugestao de melhores horarios | Pendente | Baixa |
| Metricas de engajamento | Pendente | Baixa |

---

## 3. O Que Queremos Implementar

### Funcionalidades Core (Visao Completa)

#### Brand Guidelines (Mapeamento de Marca) - PRIORIDADE 1
- [ ] Cadastro de marcas/empresas
- [ ] Tom de voz (formal, casual, tecnico, amigavel)
- [ ] Valores da marca
- [ ] Palavras-chave e terminologia preferida
- [ ] Palavras e temas a evitar
- [ ] Paleta de cores
- [ ] Logos e assets visuais
- [ ] Personas/publico-alvo
- [ ] Exemplos de posts anteriores (para contexto)
- [ ] Concorrentes (para diferenciacao)
- [ ] Objetivos de comunicacao

#### Criacao de Posts com IA - PRIORIDADE 1
- [ ] Geracao de posts baseada nas guidelines da marca
- [ ] Selecao de plataforma alvo (adapta formato)
- [ ] Reescrita para diferentes plataformas
- [ ] Sugestao de hashtags contextuais
- [ ] Variacao de tom (mais formal, mais casual)
- [ ] Templates de tipos de post (promocional, educativo, engajamento)
- [ ] Historico de posts gerados
- [ ] Edicao e refinamento de posts

#### Geracao de Midias - PRIORIDADE 2
- [ ] Geracao de imagens com IA (DALL-E/Stable Diffusion)
- [ ] Templates visuais por plataforma
- [ ] Redimensionamento automatico
- [ ] Biblioteca de midias
- [ ] Upload de imagens proprias

#### Agendamento e Publicacao - PRIORIDADE 3
- [ ] Calendario visual interativo
- [ ] Fila de publicacoes
- [ ] Agendamento em massa (CSV/Excel)
- [ ] Rascunhos e templates
- [ ] Reciclagem de conteudo (republish)
- [ ] Publicacao em multiplas plataformas

#### Plataformas Suportadas - PRIORIDADE 3
- [ ] Instagram (posts, stories, reels)
- [ ] Facebook (paginas, grupos)
- [ ] X/Twitter
- [ ] LinkedIn (perfil e paginas)
- [ ] TikTok
- [ ] YouTube Shorts
- [ ] Pinterest
- [ ] Threads
- [ ] Bluesky
- [ ] Mastodon

#### Analytics - PRIORIDADE 4
- [ ] Metricas de engajamento
- [ ] Crescimento de seguidores
- [ ] Performance por post
- [ ] Comparativo entre plataformas
- [ ] Relatorios exportaveis (PDF/Excel)
- [ ] Melhores horarios para postar

#### Campanhas Pagas - PRIORIDADE 5
- [ ] Integracao Meta Ads API
- [ ] Integracao Google Ads API
- [ ] Integracao TikTok Ads API
- [ ] Dashboard de campanhas
- [ ] Otimizacao automatica de lances
- [ ] Creative scoring com ML
- [ ] A/B testing automatizado

#### Colaboracao e Enterprise - PRIORIDADE 5
- [ ] Multi-usuarios
- [ ] Workflows de aprovacao
- [ ] Roles e permissoes
- [ ] Audit log
- [ ] White-label
- [ ] API publica
- [ ] SSO (SAML/OIDC)

---

## 4. Stack Tecnologica Definida

### Backend
| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| Node.js | >= 24.7.0 | Runtime |
| FeathersJS | 5.0.40 | Framework API |
| Koa | - | Servidor HTTP |
| Knex.js | 3.1.0 | Query Builder |
| SQLite | 5.1.7 | Banco (dev) |
| PostgreSQL | - | Banco (prod) - futuro |
| TypeBox | 5.0.40 | Validacao |
| Winston | 3.19.0 | Logging |
| Socket.io | - | Tempo real |

### Ferramentas de Desenvolvimento
| Tecnologia | Funcao |
|------------|--------|
| TypeScript | Tipagem |
| Mocha | Testes |
| Nodemon | Hot reload |
| Prettier | Formatacao |

### IA (Implementado)
| Tecnologia | Funcao | Status |
|------------|--------|--------|
| OpenAI API | GPT-4o, DALL-E | Implementado |
| Anthropic | Claude Sonnet/Opus | Implementado |
| Google AI | Gemini, Imagen | Implementado |
| Groq | Inferencia rapida | Implementado |
| Ollama | Modelos locais | Implementado |
| LangChain | Orquestracao de LLMs | Planejado |

---

## 5. Cronograma Estimado

| Fase | Duracao Estimada | Status | Entregaveis |
|------|------------------|--------|-------------|
| Fase 1: Criacao de Conteudo | 6-8 semanas | CONCLUIDA | Marcas, Guidelines, Posts, IA |
| Fase 2: Midias e Preview | 3-4 semanas | CONCLUIDA | Upload, Geracao de imagens, Preview |
| Fase 3: Integracoes | 6-8 semanas | Pendente | OAuth, X, LinkedIn, Agendamento |
| Fase 4: Analytics | 4-6 semanas | Pendente | Dashboard, Metricas |
| Fase 5: Campanhas Pagas | 8-10 semanas | Pendente | Meta Ads, Google Ads |
| Fase 6: Enterprise | 6-8 semanas | Pendente | Multi-usuario, Aprovacao, API |

---

## 6. Metricas de Progresso

### Fase 1: Criacao de Conteudo com IA - CONCLUIDA

```
Servico de Marcas (Brands): 100% - Concluido
  - [x] CRUD completo
  - [x] Guidelines (tom de voz, valores, palavras)
  - [x] Tabelas normalizadas (brand_colors, brand_values, brand_ai_configs)
  - [x] Prompts customizados por marca
  - [x] Integracao com IA

Servico de Posts: 100% - Concluido
  - [x] CRUD completo
  - [x] Posts em carrossel com slides
  - [x] Versoes de posts
  - [x] Validacao de limites por plataforma
  - [x] Status (draft, approved, scheduled, published)

Modulo de IA: 100% - Concluido
  - [x] Interface abstrata AIProvider
  - [x] Provider OpenAI (GPT-4o, GPT-4o-mini, DALL-E 3)
  - [x] Provider Anthropic (Claude Sonnet 4, Opus 4, Haiku)
  - [x] Provider Google (Gemini 2.0, Imagen 3)
  - [x] Provider Groq (Llama 3.3, Mixtral)
  - [x] Provider Ollama (local)
  - [x] Sistema de templates de prompts
  - [x] 6 agentes especializados + orquestrador
```

### Fase 2: Midias e Preview - CONCLUIDA

```
Servico de Medias: 100% - Concluido
  - [x] Upload de arquivos
  - [x] Tipos: image, video, document
  - [x] Limpeza de midias orfas
  - [x] Integracao com posts

Geracao de Imagens: 100% - Concluido
  - [x] DALL-E 3 (OpenAI)
  - [x] Imagen 3 (Google)
  - [x] Stable Diffusion (Ollama)
  - [x] Derivacao de proporcoes
  - [x] Regeneracao de slides
```

### Backend - Servicos Implementados

```
Total de Servicos: 24 modulos

Servicos Core:
- [x] users (autenticacao, roles)
- [x] brands (com normalizacao)
- [x] posts (com carrossel e versoes)
- [x] medias (upload e gerenciamento)

Servicos de IA:
- [x] ai (geracao de conteudo)
- [x] ai-providers (5 providers)
- [x] ai-models (gerenciamento de modelos)
- [x] ai-generation-logs (logs de geracao)
- [x] ai-requests (auditoria)
- [x] ai-usage (calculo de custos)
- [x] ai-agents (6 agentes especializados)

Servicos de Sistema:
- [x] onboarding (wizard inicial)
- [x] system (status do sistema)
- [x] seed (dados iniciais)
- [x] settings (configuracoes)
- [x] roles (permissoes)
- [x] platforms (redes sociais)
- [x] prompt-templates (templates de prompt)

Servicos Normalizados:
- [x] brand-colors
- [x] brand-values
- [x] brand-ai-configs
- [x] post-versions
- [x] post-slides
```

### Frontend - Paginas Implementadas

```
Total de Paginas: 10

Autenticacao:
- [x] LoginPage
- [x] OnboardingPage

Dashboard:
- [x] DashboardPage

Brands:
- [x] BrandsListPage
- [x] BrandFormPage
- [x] BrandDetailPage

Posts:
- [x] PostsListPage
- [x] PostEditorPage

Admin:
- [x] SettingsPage
```

### Documentacao

```
Documentos Completos: 9/9
Pesquisa de Mercado: Concluida
Stack Definida: Concluida
Prioridades Definidas: Concluida
```

---

## 7. Referencias

- [docs/postiz.md](postiz.md) - Stack do Postiz e decisoes tecnicas
- [docs/unknowns.md](unknowns.md) - Pesquisas e testes pendentes
- [docs/deep_research.md](deep_research.md) - Pesquisa sobre IA para ads
- [AGENTS.md](../AGENTS.md) - Arquitetura de agentes de IA

---

*Documento vivo - atualizar conforme o projeto evolui*

