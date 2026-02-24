# OpenOnmeky

Plataforma open-source de gerenciamento de redes sociais e campanhas pagas com IA.

## Visao Geral

OpenOnmeky e um projeto open-source que visa criar uma alternativa acessivel e transparente as plataformas de gerenciamento de redes sociais como Onmkey, Hootsuite, Buffer, Ocoya, FeedHive, e Flick.

## Motivacao

As plataformas existentes possuem:
- Precos elevados (cobranca por canal/usuario)
- Mecanismos de IA proprietarios e desconhecidos
- Limitacoes artificiais de uso
- Dados armazenados em servidores de terceiros

## Objetivos

1. **Transparencia**: Codigo aberto com algoritmos e mecanismos de IA documentados
2. **Acessibilidade**: Self-hosted sem custos mensais recorrentes
3. **Privacidade**: Dados armazenados na infraestrutura do usuario
4. **Escalabilidade**: Sem limites artificiais de usuarios, contas ou posts

## Status do Projeto

**Fase Atual**: MVP Completo (Fases 1 e 2 concluidas)

- Backend FeathersJS com 24 servicos/modulos
- Sistema de autenticacao JWT com roles e permissoes
- Modulo de IA com 5 providers (OpenAI, Anthropic, Google, Groq, Ollama)
- 6 agentes de IA especializados + orquestrador
- Servico de Brands completo (com normalizacao)
- Servico de Posts completo (com carrossel e versoes)
- Servico de Medias (upload de arquivos)
- Sistema de Onboarding funcional
- Frontend Vue 3 + Quasar com 10 paginas

Veja [docs/roadmap.md](docs/roadmap.md) para detalhes sobre o progresso e proximos passos.

## Documentacao

- [docs/README.md](docs/README.md) - Roadmap e planejamento
- [docs/roadmap.md](docs/roadmap.md) - Progresso detalhado
- [docs/specs.md](docs/specs.md) - Especificacoes de features
- [AGENTS.md](AGENTS.md) - Arquitetura de agentes de IA

## Estrutura do Projeto

```
openOnmeky/
├── README.md                 # Este arquivo
├── AGENTS.md                 # Arquitetura de agentes de IA
├── docs/                     # Documentacao
│   ├── README.md             # Visao geral e roadmap
│   ├── roadmap.md            # Progresso detalhado
│   ├── specs.md              # Especificacoes de features
│   └── ...                   # Pesquisa de competidores
├── backend/                  # Backend FeathersJS
│   ├── src/
│   │   ├── services/
│   │   │   ├── ai/           # Servico de geracao de conteudo
│   │   │   ├── ai-providers/ # 5 providers (OpenAI, Anthropic, Google, Groq, Ollama)
│   │   │   ├── ai-agents/    # 6 agentes especializados + orquestrador
│   │   │   ├── ai-models/    # Gerenciamento de modelos
│   │   │   ├── ai-generation-logs/ # Logs de geracao
│   │   │   ├── brands/       # Servico de marcas
│   │   │   ├── brand-colors/ # Cores da marca (normalizado)
│   │   │   ├── brand-values/ # Valores da marca (normalizado)
│   │   │   ├── posts/        # Servico de posts
│   │   │   ├── post-slides/  # Slides de carrossel
│   │   │   ├── post-versions/# Versoes de posts
│   │   │   ├── medias/       # Upload de arquivos
│   │   │   ├── users/        # Servico de usuarios
│   │   │   ├── roles/        # Permissoes
│   │   │   ├── platforms/    # Redes sociais
│   │   │   ├── settings/     # Configuracoes
│   │   │   ├── onboarding/   # Wizard inicial
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── frontend/                 # Frontend Vue 3 + Quasar
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/         # LoginPage, OnboardingPage
│   │   │   ├── brands/       # BrandsListPage, BrandFormPage, BrandDetailPage
│   │   │   ├── posts/        # PostsListPage, PostEditorPage
│   │   │   ├── admin/        # SettingsPage
│   │   │   └── DashboardPage.vue
│   │   ├── stores/           # Pinia stores
│   │   └── ...
│   └── ...
└── ...
```

## Licenca

A definir (provavelmente MIT ou Apache 2.0)

## Como Executar

### Backend

```bash
cd backend
npm install
npm run migrate  # Executar migrations
npm run dev      # Iniciar servidor de desenvolvimento
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Iniciar servidor de desenvolvimento
```

### Testes

```bash
cd backend
npm run test     # Executar todos os testes (154 testes)
```

## Contribuicao

Contribuicoes e ideias sao bem-vindas!

