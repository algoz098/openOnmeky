# Unknowns - O Que Nao Sabemos

> Lista de incertezas, lacunas de conhecimento e itens que precisam de pesquisa ou teste.

---

## Indice

1. [APIs e Integracoes](#1-apis-e-integracoes)
2. [Arquitetura e Infraestrutura](#2-arquitetura-e-infraestrutura)
3. [IA e Machine Learning](#3-ia-e-machine-learning)
4. [Campanhas Pagas](#4-campanhas-pagas)
5. [Legal e Compliance](#5-legal-e-compliance)
6. [UX e Produto](#6-ux-e-produto)
7. [Testes Necessarios](#7-testes-necessarios)

---

## 1. APIs e Integracoes

### Desconhecido

| Item | Pergunta | Impacto |
|------|----------|---------|
| Meta App Review | Quanto tempo demora aprovacao? Quais permissoes sao negadas? | Alto |
| X/Twitter API | Qual tier precisamos? $100/mes (Basic) e suficiente? | Alto |
| LinkedIn API | Precisa de parceria formal? Quais restricoes existem? | Alto |
| TikTok API | Content Posting API esta disponivel para devs independentes? | Medio |
| YouTube Shorts | Quota de 10k unidades/dia e suficiente para uso real? | Medio |
| Rate Limits | Quais sao os limites reais de cada API em producao? | Alto |
| Webhooks | Quais plataformas suportam webhooks para notificacoes? | Medio |

### Pesquisar

- [ ] Documentacao oficial de cada API (requisitos de aprovacao)
- [ ] Casos de rejeicao de apps no Meta App Review
- [ ] Alternativas para APIs restritas (scraping? proxies?)
- [ ] Custo real mensal de APIs pagas (X, LinkedIn)

### Testar

- [ ] Criar app de teste no Meta for Developers
- [ ] Solicitar acesso ao X API Basic tier
- [ ] Testar limites de rate limit com conta de desenvolvimento

---

## 2. Arquitetura e Infraestrutura

### Desconhecido

| Item | Pergunta | Impacto |
|------|----------|---------|
| Stack Tecnologica | Next.js + Supabase ou Laravel + Postgres? | Critico |
| Filas/Workers | BullMQ, Temporal, ou Laravel Queues? | Alto |
| Multi-tenancy | Schema separation ou row-level security? | Alto |
| Armazenamento | S3, Cloudflare R2, ou self-hosted MinIO? | Medio |
| Escalabilidade | Quantos usuarios/posts por instancia? | Medio |
| Deploy | Docker Compose, Kubernetes, ou plataforma gerenciada? | Medio |

### Pesquisar

- [ ] Como Postiz implementa filas com Temporal
- [ ] Como Mixpost implementa multi-tenancy no Laravel
- [ ] Benchmarks de performance de Next.js vs Laravel
- [ ] Custos de infraestrutura para diferentes escalas

### Testar

- [ ] Prototipo de agendamento com BullMQ
- [ ] Prototipo de agendamento com Temporal
- [ ] Teste de carga com diferentes stacks

---

## 3. IA e Machine Learning

### Desconhecido

| Item | Pergunta | Impacto |
|------|----------|---------|
| Custos OpenAI | Quanto custa gerar 1000 posts/mes com GPT-4o? | Alto |
| Ollama Performance | Llama 3.2 roda bem em servidor de 8GB RAM? | Alto |
| Fine-tuning | Vale a pena fazer fine-tuning para tom de voz? | Medio |
| Visao Computacional | Precisamos de YOLO/CLIP para analise de criativos? | Medio |
| Embeddings | Qual modelo de embedding usar para RAG? | Medio |
| Latencia | Tempo de resposta aceitavel para geracao de posts? | Alto |

### Pesquisar

- [ ] Pricing detalhado de OpenAI, Anthropic, Google
- [ ] Requisitos de hardware para Ollama + Llama 3.2
- [ ] Tecnicas de prompt engineering para social media
- [ ] Alternativas open-source para CLIP (OpenCLIP)

### Testar

- [ ] Gerar 100 posts com GPT-4o e medir custo
- [ ] Rodar Ollama em diferentes configuracoes de hardware
- [ ] Comparar qualidade de posts: GPT-4 vs Claude vs Llama
- [ ] Implementar RAG basico com LangChain

---

## 4. Campanhas Pagas

### Desconhecido

| Item | Pergunta | Impacto |
|------|----------|---------|
| Meta Ads API | Quais permissoes sao necessarias? | Critico |
| Google Ads API | Precisa de certificacao MCC? | Alto |
| Atribuicao | Como implementar atribuicao de receita como Omneky? | Alto |
| Creative Scoring | Precisamos de ML proprio para pontuar criativos? | Medio |
| Otimizacao de Lances | E possivel automatizar bidding via API? | Alto |
| Aprovacao de Anuncios | Quanto tempo demora? Quais sao as regras? | Medio |

### Pesquisar

- [ ] Fluxo completo de criacao de campanha via Meta Ads API
- [ ] Requisitos para Google Ads API Developer Token
- [ ] Metricas disponiveis via API (ROAS, CTR, CPC, etc)
- [ ] Como plataformas terceiras (AdCreative.ai) acessam estas APIs

### Testar

- [ ] Criar campanha de teste via Meta Ads API
- [ ] Puxar metricas de campanha existente
- [ ] Automatizar pausa/ativacao de anuncios

---

## 5. Legal e Compliance

### Desconhecido

| Item | Pergunta | Impacto |
|------|----------|---------|
| LGPD/GDPR | Quais dados podemos armazenar? | Critico |
| Termos de Servico | Podemos armazenar tokens OAuth indefinidamente? | Alto |
| Data Residency | Precisamos de servidores na UE? | Medio |
| Conteudo Gerado | Quem e responsavel por conteudo gerado por IA? | Medio |
| Licencas | MIT, GPL, ou Apache 2.0 para o projeto? | Medio |

### Pesquisar

- [ ] Termos de uso de cada API (armazenamento de dados)
- [ ] Requisitos LGPD para plataformas SaaS
- [ ] Licencas de dependencias que usaremos
- [ ] Disclaimers necessarios para conteudo gerado por IA

### Testar

- [ ] Consulta juridica sobre termos de uso
- [ ] Implementar fluxo de consentimento LGPD

---

## 6. UX e Produto

### Desconhecido

| Item | Pergunta | Impacto |
|------|----------|---------|
| Onboarding | Qual e o fluxo ideal de primeira conexao? | Alto |
| Editor de Posts | WYSIWYG ou preview separado? | Medio |
| Calendario | Qual biblioteca de calendario usar? | Baixo |
| Mobile | Precisamos de app mobile ou PWA? | Medio |
| Notificacoes | Push, email, ou ambos? | Baixo |

### Pesquisar

- [ ] UX de concorrentes (Buffer, Postiz, Mixpost)
- [ ] Bibliotecas de calendario (FullCalendar, react-big-calendar)
- [ ] Padroes de design para ferramentas de social media

### Testar

- [ ] Prototipo de fluxo de conexao de conta
- [ ] Teste de usabilidade com usuarios reais
- [ ] PWA vs app nativo (React Native)

---

## 7. Testes Necessarios

### Prioridade Alta

| Teste | Objetivo | Prazo Sugerido |
|-------|----------|----------------|
| API Meta | Validar fluxo OAuth e publicacao | Semana 1 |
| Stack Tecnologica | Decidir entre Next.js e Laravel | Semana 1 |
| Custo IA | Estimar custo mensal real | Semana 2 |
| Filas | Escolher sistema de filas | Semana 2 |

### Prioridade Media

| Teste | Objetivo | Prazo Sugerido |
|-------|----------|----------------|
| Ollama Local | Validar viabilidade de IA local | Semana 3 |
| Multi-tenancy | Testar abordagens de isolamento | Semana 3 |
| Creative Scoring | Prototipo de analise de imagem | Semana 4 |

### Prioridade Baixa

| Teste | Objetivo | Prazo Sugerido |
|-------|----------|----------------|
| Mobile PWA | Testar experiencia mobile | Futuro |
| White-label | Validar customizacao de marca | Futuro |
| Marketplace | Modelo de negocio para posts | Futuro |

---

## Proximos Passos

1. **Priorizar** - Ordenar unknowns por impacto e urgencia
2. **Atribuir** - Definir responsaveis por cada pesquisa/teste
3. **Documentar** - Criar arquivos separados para resultados de pesquisa
4. **Atualizar** - Mover itens resolvidos para documentacao principal

---

*Ultima atualizacao: 2026-02-19*

