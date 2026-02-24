# OpenOnmeky - Especificacoes de Features

> Descricao das funcionalidades, comportamentos esperados e como validar a implementacao

**Ultima atualizacao**: 2026-02-23

---

## Indice

1. [Marcas (Brand Guidelines)](#1-marcas-brand-guidelines)
2. [Posts](#2-posts)
3. [Geracao de Conteudo com IA](#3-geracao-de-conteudo-com-ia)
4. [Sistema de Agentes de IA](#4-sistema-de-agentes-de-ia)
5. [Medias](#5-medias)
6. [Onboarding e Sistema](#6-onboarding-e-sistema)

---

## 1. Marcas (Brand Guidelines)

### O que e

Uma marca representa a identidade de uma empresa ou projeto. O usuario cadastra informacoes sobre sua marca para que a IA possa gerar conteudo alinhado com essa identidade.

Pense como um "briefing" que o usuario da para a IA: "minha marca e assim, fala assim, tem esses valores, evita essas coisas".

### Por que precisamos

Sem contexto da marca, a IA gera conteudo generico. Com as guidelines, a IA consegue:
- Manter consistencia no tom de voz
- Usar vocabulario adequado
- Evitar temas sensiveis para aquela marca
- Falar com o publico certo

### O que o usuario pode cadastrar

**Informacoes basicas:**
- Nome da marca
- Descricao (o que a marca faz, em poucas palavras)
- Setor de atuacao (tecnologia, saude, moda, etc)

**Tom de voz:**
- Como a marca fala? Formal? Descontraida? Tecnica? Amigavel?
- O usuario pode descrever em texto livre ou escolher de opcoes pre-definidas

**Vocabulario:**
- Palavras e termos que a marca gosta de usar
- Palavras e termos que a marca deve evitar
- Temas que nao devem ser abordados

**Publico-alvo:**
- Quem e o publico da marca?
- Pode ser descricao livre ou personas estruturadas (nome, idade, interesses, problemas)

**Contexto adicional:**
- Concorrentes (para saber do que se diferenciar)
- Exemplos de posts anteriores (para a IA aprender o estilo)
- Objetivos de comunicacao (educar, vender, engajar, etc)

**Identidade visual (implementado):**
- Cores da marca (tabela normalizada `brand_colors`)
- Valores da marca (tabela normalizada `brand_values`)
- Configuracoes de IA por marca (tabela `brand_ai_configs`)

**Prompts de geracao:**
- Templates de instrucoes para a IA gerar conteudo
- Usuario pode customizar para cada tipo de conteudo

### Prompts de Geracao

Alem das guidelines, o usuario pode customizar os prompts que a IA usa para gerar conteudo. Sao templates de instrucoes que definem como a IA deve trabalhar.

**O que sao:**

Prompts de geracao sao instrucoes pre-definidas que a IA segue ao criar conteudo. O sistema oferece prompts padrao, mas o usuario pode edita-los para ajustar ao seu estilo.

**Por que sao uteis:**

- Cada marca pode ter necessidades especificas de geracao
- Usuario pode refinar as instrucoes com base nos resultados
- Permite maior controle sobre o output da IA
- Usuario aprende o que funciona e salva para reusar

**Tipos de prompts:**

1. **Prompt para Texto**
   - Usado quando o usuario pede para gerar um post escrito
   - Define como a IA deve estruturar o texto, usar emojis, CTAs, etc
   - Exemplo de prompt padrao: "Crie um post para {plataforma} sobre {tema}. Use tom {tom_de_voz}. Inclua call-to-action. Limite de {limite} caracteres."

2. **Prompt para Imagem**
   - Usado quando o usuario pede para gerar uma imagem (DALL-E, etc)
   - Define estilo visual, elementos obrigatorios, cores da marca
   - Exemplo de prompt padrao: "Crie uma imagem para {plataforma} no estilo {estilo}. Cores predominantes: {cores}. Tema: {tema}."

3. **Prompt para Video**
   - Usado quando o usuario pede para gerar roteiro ou conceito de video
   - Define estrutura do roteiro, duracao, estilo
   - Exemplo de prompt padrao: "Crie um roteiro de video curto ({duracao}s) para {plataforma}. Estilo: {estilo}. Tema: {tema}."

**Como funciona:**

1. Sistema oferece prompts padrao para cada tipo (texto, imagem, video)
2. Usuario pode visualizar e editar esses prompts
3. Ao gerar conteudo, sistema usa o prompt customizado da marca
4. Variaveis como {tema}, {plataforma}, {tom_de_voz} sao substituidas automaticamente
5. Usuario pode resetar para o padrao se quiser

**Variaveis disponiveis nos prompts:**

- `{tema}` - Assunto solicitado pelo usuario
- `{plataforma}` - Rede social de destino
- `{tom_de_voz}` - Tom de voz da marca
- `{valores}` - Valores da marca
- `{palavras_chave}` - Keywords da marca
- `{publico}` - Descricao do publico-alvo
- `{limite}` - Limite de caracteres da plataforma
- `{cores}` - Cores da marca
- `{nome_marca}` - Nome da marca

**Como validar:**

- Marca tem prompts padrao pre-preenchidos ao ser criada
- Usuario consegue editar cada tipo de prompt
- Usuario consegue visualizar preview com variaveis substituidas
- Ao gerar conteudo, sistema usa o prompt customizado
- Usuario consegue resetar prompt para o padrao
- Variaveis sao substituidas corretamente na geracao

### Como funciona

1. Usuario cria uma conta
2. Usuario cadastra uma ou mais marcas
3. Ao criar um post, usuario seleciona qual marca usar
4. A IA usa as guidelines daquela marca para gerar conteudo

### Como validar

- Usuario consegue criar uma marca com nome e descricao
- Usuario consegue editar as guidelines da marca
- Usuario consegue ter mais de uma marca
- Usuario so ve suas proprias marcas
- Ao gerar um post, a IA usa as informacoes da marca selecionada

---

## 2. Posts

### O que e

Um post e o conteudo que sera publicado em uma rede social. Pode ser criado manualmente pelo usuario ou gerado pela IA.

### Por que precisamos

E o produto principal da plataforma. O usuario quer criar posts de qualidade para suas redes sociais, seja escrevendo do zero ou pedindo ajuda da IA.

### Ciclo de vida de um post

1. **Rascunho (draft)**: Post criado mas ainda em edicao
2. **Aprovado (approved)**: Post revisado e pronto para publicar
3. **Agendado (scheduled)**: Post com data/hora de publicacao definida
4. **Publicado (published)**: Usuario marcou que ja publicou manualmente

**Transicoes permitidas:**
- `draft` -> `approved` -> `scheduled` -> `published`
- `draft` -> `approved` -> `published` (publicacao direta)
- `draft` -> `published` (publicacao rapida)
- `draft` -> `scheduled` -> `published`

### Publicacao Manual (v1)

**Por que publicacao manual?**

A integracao automatica com redes sociais (Instagram, Facebook, etc) requer:
- Aprovacao de app pela Meta (processo demorado)
- Conta Business verificada
- Tokens de acesso com escopo de publicacao
- Conformidade com politicas de cada plataforma

Por isso, na versao inicial, optamos pela **publicacao manual assistida**:
1. O sistema prepara o conteudo completo (texto, hashtags, imagens)
2. O usuario copia o conteudo usando o botao "Copiar"
3. O usuario publica diretamente na plataforma
4. O usuario confirma no sistema que publicou

**Fluxo no sistema:**
1. Usuario clica em "Publicar" no post
2. Sistema abre dialogo com:
   - Preview do conteudo
   - Botao "Copiar Conteudo" (copia para clipboard)
   - Instrucoes passo-a-passo
   - Botao "Confirmar Publicacao"
3. Ao confirmar, o post recebe:
   - `status = 'published'`
   - `publishedAt = timestamp atual`

**Futuro: Publicacao Automatica**

Em versoes futuras, planejamos integrar com:
- Instagram Graph API (posts automaticos)
- Facebook Pages API
- Twitter/X API v2
- LinkedIn Marketing API
- TikTok Content Posting API

Isso permitira agendamento e publicacao automatica diretamente do sistema.

### O que um post tem

**Conteudo:**
- Texto do post
- Hashtags (podem ser sugeridas pela IA)
- Plataforma de destino (Instagram, Twitter, LinkedIn, etc)
- Slides (para posts em carrossel)
- Imagens geradas ou anexadas

**Origem:**
- Foi escrito manualmente (`manual`) ou gerado pela IA (`ai`)?
- Se gerado, qual foi o prompt usado?
- Modo de geracao: `text` (simples) ou `carousel` (carrossel)

**Vinculo:**
- Todo post pertence a uma marca
- O conteudo e gerado considerando as guidelines daquela marca

**Versoes:**
- Historico de versoes do post (tabela `post_versions`)
- Cada versao mantem snapshot do conteudo

**Carrossel:**
- Posts podem ter multiplos slides (tabela `post_slides`)
- Cada slide tem: titulo, conteudo, aspectRatio, masterImage
- Suporte a diferentes proporcoes por plataforma

### Plataformas e seus limites

Cada rede social tem limites diferentes de caracteres. O sistema deve:
- Informar ao usuario o limite da plataforma selecionada
- Avisar se o texto excede o limite
- Ao gerar com IA, respeitar o limite automaticamente

Exemplos de limites:
- Twitter: 280 caracteres (conta free)
- Instagram: 2.200 caracteres
- LinkedIn: 3.000 caracteres
- Threads: 500 caracteres

### Como funciona

**Criacao manual:**
1. Usuario seleciona a marca
2. Usuario escolhe a plataforma
3. Usuario escreve o texto
4. Sistema valida o limite de caracteres
5. Usuario pode pedir sugestoes de hashtags
6. Usuario salva como rascunho

**Criacao com IA:**
1. Usuario seleciona a marca
2. Usuario escolhe a plataforma
3. Usuario descreve o que quer (ex: "post sobre produtividade")
4. IA gera o conteudo usando guidelines da marca
5. Usuario pode editar, pedir nova geracao ou aceitar
6. Usuario salva como rascunho

**Publicacao:**
1. Usuario abre o post
2. Usuario copia o texto
3. Usuario posta manualmente na rede social
4. Usuario marca como "publicado" no sistema

### Como validar

- Usuario consegue criar post manual vinculado a uma marca
- Usuario consegue gerar post com IA
- Sistema mostra contador de caracteres
- Sistema avisa quando excede limite da plataforma
- Usuario consegue editar post em rascunho
- Usuario consegue marcar post como publicado
- Posts de uma marca nao aparecem em outra marca

---

## 3. Geracao de Conteudo com IA

### O que e

O modulo de IA e responsavel por gerar textos para posts usando modelos de linguagem (LLMs). Ele recebe um pedido do usuario e as guidelines da marca, e retorna um texto pronto para usar.

### Por que precisamos

E o diferencial da plataforma. Em vez de o usuario pensar no texto do zero, ele descreve o que quer e a IA faz o trabalho pesado, mantendo a identidade da marca.

### Como funciona

1. Usuario faz um pedido (ex: "crie um post sobre nosso novo produto")
2. Sistema monta um prompt combinando:
   - O pedido do usuario
   - As guidelines da marca (tom de voz, valores, palavras)
   - O limite de caracteres da plataforma
   - Instrucoes para incluir hashtags
3. Sistema envia para o modelo de IA (OpenAI GPT-4o inicialmente)
4. IA retorna o texto gerado
5. Sistema apresenta ao usuario para revisao

### Tipos de geracao

**Geracao simples:**
- Usuario descreve o tema
- IA gera um post completo

**Reescrita:**
- Usuario cola um texto existente
- IA reescreve no tom da marca

**Adaptacao de plataforma:**
- Usuario tem um post para Instagram
- IA adapta para Twitter (encurtando) ou LinkedIn (mais profissional)

**Sugestao de hashtags:**
- Usuario tem um texto pronto
- IA sugere hashtags relevantes

### Qualidade da geracao

O conteudo gerado deve:
- Respeitar o tom de voz da marca
- Usar palavras-chave preferidas quando fizer sentido
- Evitar palavras e temas proibidos
- Estar dentro do limite de caracteres
- Incluir hashtags quando apropriado
- Ter call-to-action quando relevante

### Providers de IA

A arquitetura atual suporta multiplos providers de IA atraves de uma interface abstrata `AIProvider`:

**Providers Implementados:**
| Provider | Modelos Disponiveis | Capacidades |
|----------|---------------------|-------------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-5-Pro, DALL-E 3 | Texto, Imagem, Embeddings |
| Anthropic | Claude Sonnet 4, Claude 3.5 Haiku, Claude Opus 4 | Texto |
| Google | Gemini 2.0 Flash, Gemini 3.1 Pro, Imagen 4 | Texto, Imagem, Embeddings |
| Groq | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B | Texto (inferencia rapida) |
| Ollama | Llama 3.2, Llama 3.1, Mistral, Mixtral | Texto, Imagem, Embeddings (local) |

**Arquitetura:**
- Interface `AIProvider` define contrato padrao para todos os providers
- Factory `createProvider()` instancia provider por nome
- Cada provider pode ser configurado independentemente
- Usuario pode escolher qual provider usar por requisicao
- Servicos de suporte: `ai-models`, `ai-generation-logs`, `ai-requests`, `ai-usage`

### Como validar

- Sistema consegue gerar post usando OpenAI
- Post gerado respeita limite de caracteres da plataforma
- Post gerado usa tom de voz da marca (comparar com guidelines)
- Post gerado nao usa palavras proibidas pela marca
- Usuario consegue pedir nova geracao se nao gostar
- Usuario consegue editar texto gerado antes de salvar
- Sistema funciona mesmo se OpenAI estiver fora (mensagem de erro adequada)

---

## 4. Sistema de Agentes de IA

### O que e

Sistema de agentes especializados que trabalham em conjunto para gerar conteudo completo. Cada agente tem uma responsabilidade especifica.

### Agentes Implementados

| Agente | Responsabilidade | Arquivo |
|--------|------------------|---------|
| **TextCreationAgent** | Geracao de textos para posts | `text-creation-agent.ts` |
| **ImageGenerationAgent** | Geracao de imagens com IA | `image-generation-agent.ts` |
| **CreativeDirectionAgent** | Briefing, conceito, narrativa | `creative-direction-agent.ts` |
| **AnalysisAgent** | Analise de conteudo e metricas | `analysis-agent.ts` |
| **ComplianceAgent** | Verificacao de diretrizes da marca | `compliance-agent.ts` |
| **TextOverlayAgent** | Adicionar texto sobre imagens | `text-overlay-agent.ts` |
| **Orchestrator** | Coordenacao entre agentes | `orchestrator.ts` |

### Como funciona

1. Usuario faz solicitacao de conteudo
2. Orchestrator recebe e analisa a solicitacao
3. Orchestrator delega para agentes especializados
4. Agentes processam em paralelo ou sequencialmente
5. Orchestrator combina resultados
6. Conteudo final retornado ao usuario

### Tipos de Agente

```typescript
type AgentType =
  | 'reasoning'        // Analise complexa
  | 'textCreation'     // Geracao de posts
  | 'textAdaptation'   // Reescrita para plataformas
  | 'analysis'         // Analise de sentimento
  | 'imageGeneration'  // Geracao de imagens
  | 'videoGeneration'  // Geracao de videos
  | 'creativeDirection'// Briefing e conceito
  | 'compliance'       // Verificacao de marca
```

---

## 5. Medias

### O que e

Servico para upload, armazenamento e gerenciamento de arquivos de midia (imagens, videos, documentos).

### Funcionalidades

- Upload de arquivos via multipart/form-data
- Tipos suportados: `image`, `video`, `document`
- Vinculo com posts e brands
- Limpeza automatica de midias orfas
- Remocao de arquivos ao deletar registro

### Estrutura

```
backend/uploads/
├── images/
├── videos/
└── documents/
```

### Como validar

- [x] Upload de imagem funciona
- [x] Arquivo salvo em `uploads/images/`
- [x] Registro criado na tabela `medias`
- [x] Vinculo com post ou brand
- [x] Remocao de arquivo ao deletar midia

---

## 6. Onboarding e Sistema

### Onboarding

Wizard de configuracao inicial executado na primeira execucao do sistema.

**Fluxo:**
1. Deteccao automatica (nenhum usuario existe)
2. Wizard de 3 passos no frontend
3. Criacao de super-admin
4. Seed de dados iniciais (roles, platforms, prompt-templates)
5. Marca sistema como inicializado

**Servicos envolvidos:**
- `onboarding` - Logica do wizard
- `seed` - Dados iniciais
- `system` - Status do sistema

### Roles e Permissoes

4 roles com permissoes granulares:

| Role | Descricao | Permissoes |
|------|-----------|------------|
| super-admin | Acesso total | `*` |
| admin | Gerenciamento | `users:manage`, `brands:manage`, `posts:manage` |
| editor | Criacao de conteudo | `brands:read/write`, `posts:read/write` |
| viewer | Somente leitura | `brands:read`, `posts:read` |

### Plataformas

6 plataformas pre-configuradas:

| Plataforma | Limite de Caracteres |
|------------|---------------------|
| Twitter/X | 280 |
| Instagram | 2200 |
| LinkedIn | 3000 |
| Threads | 500 |
| Facebook | 63206 |
| TikTok | 2200 |

---

## Resumo de Validacao

### Feature completa quando:

**Marcas:**
- [x] CRUD de marcas funcionando
- [x] Guidelines salvas e recuperadas corretamente
- [x] Isolamento entre usuarios
- [x] Prompts de geracao pre-preenchidos ao criar marca
- [x] Usuario consegue editar prompts (texto, imagem, video)
- [x] Variaveis substituidas corretamente nos prompts
- [x] Tabelas normalizadas (colors, values, ai_configs)

**Posts:**
- [x] CRUD de posts funcionando
- [x] Vinculo com marca obrigatorio
- [x] Validacao de limite por plataforma
- [x] Ciclo de vida (draft -> approved -> scheduled -> published)
- [x] Posts em carrossel com slides
- [x] Versoes de posts

**IA:**
- [x] Geracao de texto funcionando
- [x] Prompts customizados da marca usados na geracao
- [x] Guidelines da marca injetadas no prompt
- [x] Respeito ao limite de caracteres
- [x] Tratamento de erros do provider
- [x] 5 providers implementados (OpenAI, Anthropic, Google, Groq, Ollama)
- [x] 6 agentes especializados + orquestrador

**Medias:**
- [x] Upload de imagens funcionando
- [x] Tipos: image, video, document
- [x] Vinculo com posts e brands
- [x] Limpeza de midias orfas

**Sistema:**
- [x] Onboarding wizard funcional
- [x] Seed de dados iniciais
- [x] Roles com permissoes granulares
- [x] Plataformas pre-configuradas
- [x] Settings do sistema

---

*Documento vivo - atualizar conforme features evoluem*
