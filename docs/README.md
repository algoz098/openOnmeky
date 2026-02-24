# OpenOnmeky - Documentacao e Roadmap

## O Que Faremos

Criar uma plataforma open-source de gerenciamento de redes sociais com:

### Funcionalidades Core
1. **Agendamento de Posts** - Calendario visual, fila de publicacoes, agendamento em massa
2. **Multi-plataforma** - Suporte a Facebook, Instagram, X/Twitter, LinkedIn, TikTok, YouTube, Pinterest, Threads, Bluesky, Mastodon
3. **Analytics** - Metricas de engajamento, crescimento de seguidores, performance de posts
4. **Geracao de Conteudo com IA** - Criacao de posts, sugestoes de hashtags, otimizacao de textos
5. **Gerenciamento de Campanhas Pagas** - Integracao com Meta Ads API, Google Ads API, TikTok Ads API
6. **Colaboracao em Equipe** - Multi-usuarios, workflows de aprovacao, permissoes

### Diferenciais
- Self-hosted (sem custos mensais)
- Codigo aberto (personalizavel)
- IA transparente e documentada
- Sem limites artificiais

## O Que Ja Temos

### Pesquisa Concluida
- Analise de competidores (Buffer, Hootsuite, Ocoya, FeedHive, Flick)
- Identificacao de alternativas open-source (Mixpost, Postiz)
- Levantamento de APIs necessarias (Meta, Google, TikTok, LinkedIn, X)
- Mapeamento de tecnologias de IA (OpenAI GPT, modelos locais via Ollama)

### Documentacao
- [AGENTS.md](../AGENTS.md) - Detalhes sobre tecnologias de IA e integracao

### Pesquisa de Competidores
- [docs/omneky.md](omneky.md) - Analise do Omneky (plataforma de ads com IA)
- [docs/postiz.md](postiz.md) - Analise do Postiz (alternativa open-source)
- [docs/mixpost.md](mixpost.md) - Analise do Mixpost (self-hosted em Laravel)
- [docs/buffer.md](buffer.md) - Analise do Buffer (concorrente comercial)
- [docs/deep_research.md](deep_research.md) - Pesquisa tecnica avancada (Omneky, AdCreative.ai, Pencil, Typeface)

### Planejamento
- [docs/roadmap.md](roadmap.md) - O que queremos, iremos e ja implementamos
- [docs/specs.md](specs.md) - Especificacoes detalhadas das features
- [docs/unknowns.md](unknowns.md) - Lacunas de conhecimento, pesquisas e testes pendentes

## Como Iremos Dar Sequencia

### Fase 1: Arquitetura (Proxima)
- [ ] Definir stack tecnologica (sugestao: Next.js + Supabase ou Laravel + Postgres)
- [ ] Desenhar arquitetura de microservicos
- [ ] Planejar estrutura de banco de dados
- [ ] Definir APIs internas

### Fase 2: MVP - Agendamento
- [ ] Autenticacao e multi-tenant
- [ ] Integracao com 3 plataformas (Instagram, X, LinkedIn)
- [ ] Sistema de agendamento basico
- [ ] UI/UX do calendario

### Fase 3: IA e Analytics
- [x] Integracao com OpenAI API (GPT-4o, DALL-E)
- [x] Integracao com Anthropic (Claude)
- [x] Integracao com Google AI (Gemini)
- [x] Integracao com Groq
- [x] Integracao com Ollama (modelos locais)
- [ ] Geracao automatica de posts
- [ ] Dashboard de analytics basico
- [ ] Sugestao de melhores horarios

### Fase 4: Campanhas Pagas
- [ ] Integracao Meta Ads API
- [ ] Integracao Google Ads API
- [ ] Dashboard de campanhas
- [ ] Otimizacao com IA

### Fase 5: Enterprise
- [ ] Sistema de aprovacao
- [ ] Roles e permissoes avancadas
- [ ] White-label
- [ ] API publica

## Competidores e Precos

| Plataforma | Preco Inicial | Modelo | Destaques |
|------------|---------------|--------|-----------|
| Buffer | $5/canal/mes | SaaS | Simples, bom para pequenos |
| Hootsuite | $99/mes | SaaS | Enterprise, muitas integrações |
| Ocoya | $19/mes | SaaS | Forte em IA, copywriting |
| FeedHive | $15/mes | SaaS | Reciclagem de conteudo |
| Flick | $14/mes | SaaS | Foco em hashtags e Instagram |
| Mixpost | $99 unico | Self-hosted | Open-source, Laravel |
| Postiz | Gratis | Self-hosted | Open-source, Node.js |

## Tecnologias Identificadas

### Backend
- **Laravel** (Mixpost usa) - PHP, robusto, boa documentacao
- **Node.js/Next.js** (Postiz usa) - JavaScript, moderno, escalavel
- **Python/FastAPI** - Bom para IA, mas menos comum neste dominio

### Frontend
- **React/Next.js** - Moderno, boa DX
- **Vue.js/Nuxt** - Alternativa solida
- **Livewire** (Mixpost usa) - Full-stack com Laravel

### Database
- **PostgreSQL** - Robusto, suporte a JSON, escalavel
- **MySQL** - Amplamente suportado
- **Redis** - Cache e filas

### IA (Implementado)
- **OpenAI API** - GPT-4o, GPT-5, o3, o4-mini, DALL-E 3 (implementado)
- **Anthropic** - Claude Sonnet 4, Claude Opus 4, Claude 3.5 Haiku (implementado)
- **Google AI** - Gemini 3.1 Pro, Gemini 2.0 Flash, Imagen 4, Veo 3 (implementado)
- **Groq** - Llama 3.3, Llama 4 Scout, inferencia ultra-rapida (implementado)
- **Ollama** - Llama 3.2/3.3, Mistral, Mixtral, privacidade total (implementado)
- **LangChain** - Framework para aplicacoes LLM (planejado)

### Integrações
- **Meta Graph API** - Facebook, Instagram
- **Twitter/X API** - Posts e analytics
- **LinkedIn Marketing API** - Posts e paginas
- **YouTube Data API** - Shorts e videos
- **TikTok API** - Posts e analytics
- **Meta Ads API** - Campanhas pagas
- **Google Ads API** - Campanhas pagas

## Proximos Passos Imediatos

1. Escolher stack tecnologica definitiva
2. Criar repositorio estruturado
3. Implementar autenticacao basica
4. Primeira integracao com rede social (Instagram recomendado)

