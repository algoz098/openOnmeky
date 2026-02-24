# Agentes de IA e Tecnologias para Social Media

## Visao Geral

Este documento detalha as tecnologias de IA e agentes utilizados pelas plataformas de gerenciamento de redes sociais, e como podemos implementar equivalentes open-source.

## Como as Plataformas Usam IA

### 1. Geracao de Conteudo
As plataformas utilizam LLMs (Large Language Models) para:
- Gerar posts a partir de prompts ou topicos
- Reescrever conteudo para diferentes plataformas
- Criar variacoes de um mesmo post
- Sugerir hashtags relevantes
- Gerar legendas para imagens

**Implementacao tipica**:
- Integracao com OpenAI GPT-4/GPT-4o via API
- Prompts customizados por tipo de conteudo
- Fine-tuning para voz da marca (raro, mas possivel)

### 2. Analise de Sentimento
Analise de comentarios e mencoes para:
- Classificar como positivo, negativo ou neutro
- Detectar urgencia ou crises
- Priorizar respostas

### 3. Melhor Horario para Postar
Analise de dados historicos para:
- Identificar horarios de maior engajamento
- Sugerir dias da semana ideais
- Adaptar por plataforma e audiencia

### 4. Otimizacao de Campanhas Pagas
IA para campanhas de anuncios:
- Geracao de copys de anuncios
- Sugestao de segmentacao
- Otimizacao automatica de lances
- A/B testing automatizado

## Arquitetura de Agentes Proposta

### Agente de Criacao de Conteudo
```
Entrada: Topico, plataforma alvo, tom de voz
Processamento:
  1. Contexto da marca (prompts customizados)
  2. Restricoes da plataforma (limites de caracteres, formatos)
  3. Geracao via LLM
  4. Pos-processamento (hashtags, emojis, links)
Saida: Post pronto para revisao/publicacao
```

### Agente de Analytics
```
Entrada: Metricas de posts, dados historicos
Processamento:
  1. Agregacao de dados por periodo
  2. Calculo de KPIs (engagement rate, reach, impressions)
  3. Identificacao de tendencias
  4. Geracao de insights via LLM
Saida: Dashboard e relatorios
```

### Agente de Campanhas
```
Entrada: Objetivo, orcamento, publico alvo
Processamento:
  1. Analise de campanhas anteriores
  2. Geracao de copys e criativos
  3. Configuracao de segmentacao
  4. Monitoramento e otimizacao
Saida: Campanha ativa e otimizada
```

## Tecnologias Open-Source para IA

### LLMs e Frameworks (Atualizado: Fevereiro 2026)

| Tecnologia | Tipo | Uso | Custo | Status |
|------------|------|-----|-------|--------|
| OpenAI GPT-4o/o3/o4-mini | API Cloud | Texto de alta qualidade, raciocinio | ~$0.03/1K tokens | Implementado |
| OpenAI GPT-5.3 Codex | API Cloud | Coding agentico, direcao criativa | ~$0.05/1K tokens | Implementado |
| OpenAI DALL-E 3 | API Cloud | Geracao de imagens | ~$0.04/imagem | Implementado |
| Claude Opus 4 (claude-opus-4-6) | API Cloud | Modelo mais capaz Anthropic | ~$0.015/1K tokens | Implementado |
| Claude Sonnet 4 (claude-sonnet-4-6) | API Cloud | Equilibrio qualidade/custo | ~$0.003/1K tokens | Implementado |
| Google Gemini 3.1 Pro (gemini-3.1-pro-preview) | API Cloud | Modelo mais recente Google | ~$0.002/1K tokens | Implementado |
| Google Imagen 4 (imagen-4.0-ultra-generate-001) | API Cloud | Geracao de imagens avancada | ~$0.03/imagem | Implementado |
| Google Veo 3 (veo-3.0-generate-preview) | API Cloud | Geracao de video | ~$0.10/video | Implementado |
| Groq (Llama 3.3/4 Scout) | API Cloud | Inferencia ultra-rapida | Gratis (limites) | Implementado |
| Ollama + Llama 3.3 | Local | Privacidade total | Custo de hardware | Implementado |
| LangChain | Framework | Orquestracao de LLMs | Gratis | Planejado |
| LlamaIndex | Framework | RAG e busca | Gratis | Planejado |

### Modelos Recomendados por Agente (Fevereiro 2026)

> Os IDs de modelo abaixo correspondem aos valores usados no codigo (`ai-provider.interface.ts` e `frontend/src/types/index.ts`)

| Agente | OpenAI | Anthropic | Google | Groq | Ollama |
|--------|--------|-----------|--------|------|--------|
| Reasoning | o3, o4-mini | claude-opus-4-6 | gemini-3.1-pro-preview | llama-3.3-70b-versatile | mixtral |
| Text Creation | gpt-4o | claude-sonnet-4-6 | gemini-3.1-pro-preview | llama-3.3-70b-versatile | llama3.3 |
| Text Adaptation | gpt-4o-mini | claude-3-5-haiku-20241022 | gemini-2.0-flash | llama-3.1-8b-instant | llama3.2 |
| Analysis | o4-mini | claude-3-5-haiku-20241022 | gemini-2.0-flash | llama-3.1-8b-instant | llama3.2 |
| Image Generation | dall-e-3 | - | imagen-4.0-ultra-generate-001 | - | stable-diffusion |
| Video Generation | - | - | veo-3.0-generate-preview | - | - |
| Creative Direction | gpt-5.3-codex | claude-opus-4-6 | gemini-3.1-pro-preview | llama-3.3-70b-versatile | mixtral |
| Compliance | o3 | claude-sonnet-4-6 | gemini-3.1-pro-preview | llama-3.3-70b-versatile | llama3.3 |

### Modelos Implementados nos Providers (Capabilities)

Estes sao os modelos atualmente configurados nas `capabilities` de cada provider:

| Provider | Modelos de Texto | Modelos de Imagem |
|----------|------------------|-------------------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-5-pro, gpt-5 | dall-e-3, dall-e-2 |
| Anthropic | claude-sonnet-4-20250514, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229 | - |
| Google | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash, gemini-1.0-pro | imagen-3 (via API dinamica) |
| Groq | llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it | - |
| Ollama | llama3.2, llama3.1, mistral, mixtral, codellama, llava | stable-diffusion |

### Recomendacao para OpenOnmeky

**Abordagem Hibrida** (Implementada):
1. **Desenvolvimento**: Usar OpenAI API para prototipagem rapida
2. **Producao**: Oferecer opcoes:
   - OpenAI/Claude/Google/Groq para usuarios que preferem cloud
   - Ollama para usuarios que querem privacidade total

**Arquitetura Atual**:
- Interface abstrata `AIProvider` permite trocar providers facilmente
- Factory `createProvider()` instancia qualquer provider configurado
- Suporte a 5 providers: OpenAI, Anthropic, Google, Groq, Ollama

### Exemplo de Integracao com OpenAI

```javascript
// Exemplo conceitual - geracao de post
const generatePost = async (topic, platform, tone) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Voce e um especialista em social media. 
                  Gere posts para ${platform}.
                  Tom: ${tone}.
                  Limite: ${getPlatformLimit(platform)} caracteres.`
      },
      {
        role: "user",
        content: `Crie um post sobre: ${topic}`
      }
    ],
    max_tokens: 500
  });
  return response.choices[0].message.content;
};
```

### Exemplo com Ollama (Local)

```javascript
// Exemplo conceitual - geracao de post local
const generatePostLocal = async (topic, platform, tone) => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2',
      prompt: `Gere um post de ${platform} sobre ${topic}. Tom: ${tone}.`,
      stream: false
    })
  });
  const data = await response.json();
  return data.response;
};
```

## APIs de Redes Sociais

### Meta (Facebook/Instagram)
- **Graph API**: Posts, comentarios, insights
- **Marketing API**: Campanhas pagas
- **Requisitos**: App Review, permissoes especificas

### X/Twitter
- **API v2**: Posts, timeline, analytics
- **Niveis**: Free (limitado), Basic ($100/mes), Pro ($5000/mes)

### LinkedIn
- **Marketing API**: Posts em paginas
- **Ads API**: Campanhas pagas
- **Requisitos**: Parceria com LinkedIn

### TikTok
- **Content Posting API**: Posts de videos
- **Marketing API**: Campanhas pagas

### YouTube
- **Data API v3**: Upload de Shorts, analytics
- **Quota**: 10.000 unidades/dia (gratis)

## Status de Implementacao IA

1. [x] Criar modulo de IA abstrato (suporte a multiplos providers) - `ai-provider.interface.ts`
2. [x] Implementar geracao de posts com OpenAI - `openai.provider.ts`
3. [x] Adicionar suporte a Ollama para uso local - `ollama.provider.ts`
4. [x] Adicionar suporte a Anthropic (Claude) - `anthropic.provider.ts`
5. [x] Adicionar suporte a Google (Gemini) - `google.provider.ts`
6. [x] Adicionar suporte a Groq - `groq.provider.ts`
7. [ ] Desenvolver sistema de templates de prompts
8. [ ] Criar sistema de feedback para melhorar geracoes

