# Postiz - Alternativa Open-Source

## Visao Geral

Postiz e uma plataforma open-source de gerenciamento de redes sociais que permite agendar posts, gerar conteudo com IA e trocar/comprar posts de outros membros em um marketplace.

**Repositorio**: https://github.com/gitroomhq/postiz-app
**Documentacao**: https://docs.postiz.com
**Licenca**: Apache 2.0
**Stars**: 26.7k+ (muito popular)

## Funcionalidades Principais

### 1. Agendamento de Posts
- Calendario visual para agendamento
- Suporte a multiplas contas por plataforma
- Publicacao automatica no horario programado

### 2. Geracao com IA
- Geracao de posts usando IA
- Sugestoes de conteudo
- Geracao de videos com IA

### 3. Marketplace
- Troca de posts entre usuarios
- Compra de posts de outros criadores
- Sistema de creditos

### 4. Analytics
- Metricas por plataforma
- Metricas por post individual
- Dashboard de performance

### 5. API Publica
- REST API completa
- Integracao programatica
- CLI oficial para automacao

## Plataformas Suportadas

### Redes Sociais
- X (Twitter)
- LinkedIn (perfil e paginas)
- Facebook
- Instagram
- Threads
- Bluesky
- Mastodon

### Plataformas de Video
- YouTube
- TikTok

### Outras Plataformas
- Reddit
- Pinterest
- Discord
- Slack
- Telegram
- Dribbble
- Skool
- Whop
- Google My Business

## Stack Tecnologica

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js |
| Backend | NestJS |
| ORM | Prisma |
| Banco de Dados | PostgreSQL |
| Filas/Jobs | Temporal |
| Emails | Resend |
| Gerenciador | pnpm (monorepo) |

## Instalacao

### Opcoes de Deploy
1. **Docker Compose** - Recomendado para a maioria dos usuarios
2. **Docker** - Para configuracoes customizadas
3. **Kubernetes/Helm** - Para escala enterprise
4. **Coolify** - Deploy simplificado
5. **Dev Container** - Para desenvolvimento

### Requisitos
- Dominio publico (para OAuth com redes sociais)
- PostgreSQL
- Redis (opcional, para cache)

## Arquitetura

```
postiz-app/
├── apps/
│   ├── frontend/     # Next.js app
│   └── backend/      # NestJS API
├── libs/             # Bibliotecas compartilhadas
└── packages/         # Pacotes internos
```

## API Publica

### Endpoints Principais
- `GET /integrations` - Listar contas conectadas
- `POST /posts` - Criar novo post
- `GET /posts` - Listar posts
- `DELETE /posts/:id` - Deletar post
- `GET /analytics/:integration` - Analytics da plataforma
- `GET /analytics/post/:id` - Analytics de post especifico
- `POST /upload` - Upload de midia

### Providers com Configuracoes Customizadas
25 providers com configuracoes especificas, incluindo X, LinkedIn, Facebook, Instagram, YouTube, TikTok, Reddit, Pinterest, Discord, Slack, etc.

## Diferenciais

1. **Totalmente Open-Source**: Codigo aberto sob Apache 2.0
2. **Self-Hosted**: Controle total dos dados
3. **Muitas Plataformas**: 20+ plataformas suportadas
4. **API Completa**: Permite automacao total
5. **CLI Oficial**: Postagem via linha de comando
6. **Marketplace**: Modelo de negocio unico

## Limitacoes

1. **Complexidade de Setup**: Requer conhecimento tecnico
2. **Sem Campanhas Pagas**: Foco apenas em conteudo organico
3. **Temporal**: Adiciona complexidade na infraestrutura

## O Que Podemos Aprender

1. Arquitetura monorepo com Next.js + NestJS
2. Sistema de providers para multiplas plataformas
3. API REST bem documentada
4. Sistema de filas com Temporal
5. Suporte a muitas plataformas de forma modular

## Referencias para OpenOnmeky

- Estrutura de providers e como adicionar novos
- Schema de banco de dados para posts agendados
- Sistema de autenticacao OAuth por plataforma
- Arquitetura de jobs para publicacao automatica

## Decisoes Tecnicas do OpenOnmeky

Apos analisar o Postiz e outras alternativas, o OpenOnmeky decidiu usar uma stack diferente:

### Stack do Backend OpenOnmeky

| Componente | Postiz | OpenOnmeky | Justificativa |
|------------|--------|------------|---------------|
| Framework | NestJS | FeathersJS | API em tempo real, simplicidade |
| Banco de Dados | PostgreSQL | SQLite (dev) | Leve para desenvolvimento |
| ORM/Query Builder | Prisma | Knex.js | Flexibilidade, migrations |
| Servidor HTTP | Express | Koa | Middlewares modernos |
| Validacao | class-validator | TypeBox | Type-safe, performante |
| Autenticacao | Custom | @feathersjs/authentication | JWT + Local strategy |
| Tempo Real | WebSockets | Socket.io (via Feathers) | Integrado ao framework |

### Estrutura do Backend

```
backend/
├── config/                    # Configuracoes por ambiente
│   ├── default.json           # Configuracao padrao
│   └── test.json              # Configuracao de testes
├── migrations/                # Migrations do Knex
├── src/
│   ├── app.ts                 # Aplicacao principal
│   ├── authentication.ts      # Estrategias de autenticacao
│   ├── channels.ts            # Canais Socket.io
│   ├── client.ts              # Cliente para consumidores
│   ├── configuration.ts       # Schema de configuracao
│   ├── declarations.ts        # Tipos TypeScript
│   ├── hooks/                 # Hooks globais
│   ├── services/              # Servicos da API
│   │   └── users/             # Servico de usuarios
│   ├── sqlite.ts              # Conexao com banco
│   └── validators.ts          # Validadores globais
└── test/                      # Testes automatizados
```

### Tecnologias Principais

| Pacote | Versao | Funcao |
|--------|--------|--------|
| @feathersjs/feathers | ^5.0.40 | Core do framework |
| @feathersjs/koa | ^5.0.40 | Servidor HTTP Koa |
| @feathersjs/socketio | ^5.0.40 | Tempo real |
| @feathersjs/authentication | ^5.0.40 | Autenticacao JWT/Local |
| @feathersjs/knex | ^5.0.40 | Adapter para Knex |
| @feathersjs/typebox | ^5.0.40 | Validacao de schemas |
| knex | ^3.1.0 | Query builder SQL |
| sqlite3 | ^5.1.7 | Banco SQLite |
| winston | ^3.19.0 | Logging |

### Comandos do Backend

```bash
# Desenvolvimento
npm run dev          # Inicia com nodemon + ts-node

# Producao
npm run compile      # Compila TypeScript
npm start            # Inicia versao compilada

# Migrations
npm run migrate      # Executa migrations
npm run migrate:make # Cria nova migration

# Testes
npm test             # Executa testes com Mocha
```

### Vantagens do FeathersJS para OpenOnmeky

1. **API REST + Tempo Real**: Mesma interface para HTTP e WebSockets
2. **Hooks**: Sistema de hooks para logica transversal
3. **Services**: Arquitetura orientada a servicos
4. **CLI**: Gerador de codigo para services e hooks
5. **TypeScript**: Suporte nativo com tipos
6. **Adapter Pattern**: Facil troca de banco de dados

### Proximos Passos do Backend

- [ ] Servico de posts agendados
- [ ] Servico de integracoes com redes sociais
- [ ] Sistema de filas para publicacao
- [ ] Integracao com APIs das redes sociais
- [ ] Migracao para PostgreSQL em producao

