// Servico principal de IA para geracao de conteudo
import type { Params, ServiceInterface } from '@feathersjs/feathers'
import { BadRequest } from '@feathersjs/errors'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { Application } from '../../declarations'
import type { AIData, AIResult, AIImage } from './ai.schema'
import { platformLimits } from './ai.shared'
import {
  AIProviderName,
  AIMessage,
  AIMessageContent,
  AIProvider,
  OpenAIProvider,
  GoogleAIProvider,
  OllamaProvider,
  AnthropicProvider,
  GroqProvider
} from '../ai-providers'
import type { SettingsService, AIProviderSetting } from '../settings/settings.class'
import { AgentOrchestrator } from '../ai-agents'
import { getAICostCalculator, getAIUsageService } from '../ai-usage'
import type { AgentExecution } from '../ai-agents/types'

export interface AIParams extends Params {}

export interface AIServiceOptions {
  app: Application
}

// Interface para usage com informacoes de custo
interface UsageWithCost {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd?: number
  costBreakdown?: {
    inputCost: number
    outputCost: number
    imageCost: number
    videoCost: number
  }
}

export class AIService<ServiceParams extends Params = AIParams> implements ServiceInterface<
  AIResult,
  AIData,
  ServiceParams
> {
  private app: Application

  constructor(options: AIServiceOptions) {
    this.app = options.app
  }

  async create(data: AIData, _params?: ServiceParams): Promise<AIResult> {
    // Validacao de brandId obrigatorio
    if (!data.brandId) {
      throw new BadRequest('brandId e obrigatorio')
    }

    // Obtem informacoes da marca
    const brand = await this.getBrand(data.brandId)

    // Seleciona o provider
    const providerName = this.selectProvider(data, brand)
    const provider = await this.getProvider(providerName)

    // Simula erros para testes
    if (data._forceError) {
      throw new BadRequest('Erro forcado para testes')
    }
    if (data._simulateUnavailable) {
      throw new BadRequest('Servico de IA indisponivel. Tente novamente mais tarde.')
    }
    if (data._simulateNotRunning && providerName === 'ollama') {
      throw new BadRequest('Ollama nao esta rodando. Inicie o servico local.')
    }

    // Executa a operacao baseada no tipo
    switch (data.type) {
      case 'generate':
        return this.generateContent(data, brand, provider, providerName)
      case 'rewrite':
        return this.rewriteContent(data, brand, provider, providerName)
      case 'adapt':
        return this.adaptContent(data, brand, provider, providerName)
      case 'suggest-hashtags':
        return this.suggestHashtags(data, provider, providerName)
      case 'carousel':
        return this.generateCarousel(data, _params)
      default:
        throw new BadRequest(`Tipo de operacao desconhecido: ${data.type}`)
    }
  }

  private async getBrand(brandId: number): Promise<BrandInfo> {
    try {
      const brandsService = this.app.service('brands')
      return (await brandsService.get(brandId)) as unknown as BrandInfo
    } catch {
      throw new BadRequest(`Marca com ID ${brandId} nao encontrada`)
    }
  }

  private selectProvider(data: AIData, brand: BrandInfo): AIProviderName {
    // Prioridade: parametro da requisicao > configuracao da marca > padrao
    if (data.provider) {
      return data.provider
    }

    // Mapeia tipos de operacao para tipos de agente na configuracao da marca
    const operationToAgentType: Record<string, keyof NonNullable<BrandInfo['aiConfig']>> = {
      generate: 'textCreation',
      rewrite: 'textAdaptation',
      adapt: 'textAdaptation',
      'suggest-hashtags': 'analysis',
      carousel: 'creativeDirection'
    }

    const agentType = operationToAgentType[data.type]
    if (agentType) {
      const brandProvider = brand.aiConfig?.[agentType]?.provider
      if (brandProvider) {
        console.log(`[AIService] Usando provider da marca para ${data.type} (${agentType}):`, brandProvider)
        return brandProvider as AIProviderName
      }
    }

    // Fallback: tenta campo legado 'text' para compatibilidade
    const legacyProvider = brand.aiConfig?.text?.provider
    if (legacyProvider) {
      console.log(`[AIService] Usando provider legado da marca:`, legacyProvider)
      return legacyProvider as AIProviderName
    }

    // Provider padrao (sera buscado do settings no getProvider)
    console.log(`[AIService] Nenhum provider configurado na marca, usando fallback`)
    return 'ollama'
  }

  // Obtem uma instancia do provider a partir das configuracoes do settings service
  private async getProvider(providerName: AIProviderName): Promise<AIProvider> {
    const settingsService = this.app.service('settings') as unknown as SettingsService
    const config = await settingsService.getProviderConfig(providerName)

    if (!config?.enabled) {
      // Se o provider solicitado nao esta habilitado, tenta o padrao
      const aiSettings = await settingsService.getAISettings()
      const defaultProvider = aiSettings.defaultProvider as AIProviderName | undefined

      if (defaultProvider && defaultProvider !== providerName) {
        return this.getProvider(defaultProvider)
      }

      throw new BadRequest(`Provider ${providerName} nao esta habilitado. Configure em Configuracoes > IA.`)
    }

    return this.createProviderInstance(providerName, config)
  }

  // Cria uma instancia do provider com as configuracoes
  private createProviderInstance(name: AIProviderName, config: AIProviderSetting): AIProvider {
    switch (name) {
      case 'openai':
        if (!config.apiKey) {
          throw new BadRequest('OpenAI requer API key configurada.')
        }
        return new OpenAIProvider({
          apiKey: config.apiKey,
          organizationId: config.organizationId,
          baseUrl: config.baseUrl
        })
      case 'google':
        if (!config.apiKey) {
          throw new BadRequest('Google AI requer API key configurada.')
        }
        return new GoogleAIProvider({
          apiKey: config.apiKey
        })
      case 'ollama':
        return new OllamaProvider({
          baseUrl: config.baseUrl || 'http://localhost:11434'
        })
      case 'anthropic':
        if (!config.apiKey) {
          throw new BadRequest('Anthropic requer API key configurada.')
        }
        return new AnthropicProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl
        })
      case 'groq':
        if (!config.apiKey) {
          throw new BadRequest('Groq requer API key configurada.')
        }
        return new GroqProvider({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl
        })
      default:
        throw new BadRequest(`Provider ${name} nao suportado.`)
    }
  }

  private async generateContent(
    data: AIData,
    brand: BrandInfo,
    provider: {
      generateText: (opts: { messages: AIMessage[] }) => Promise<{
        content: string
        model?: string
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
      }>
    },
    providerName: AIProviderName
  ): Promise<AIResult> {
    const platform = data.platform || 'instagram'
    const limit = platformLimits[platform] || 2200

    // Monta o prompt do sistema com contexto da marca
    const systemPrompt = this.buildSystemPrompt(brand, platform, limit, data.includeHashtags)

    // Usa prompt customizado da marca se disponivel
    let userPrompt = data.prompt || ''
    const customPrompt = brand.prompts?.text
    if (customPrompt) {
      userPrompt = this.replaceVariables(customPrompt, {
        tema: data.prompt || '',
        plataforma: platform,
        tom_de_voz: brand.toneOfVoice || '',
        valores: (brand.values || []).join(', '),
        palavras_chave: (brand.preferredWords || []).join(', '),
        publico: brand.targetAudience || '',
        limite: limit.toString(),
        nome_marca: brand.name
      })
    }

    // Monta mensagem do usuario (com ou sem imagens)
    const userMessage = await this.buildUserMessage(userPrompt, data.images)

    const messages: AIMessage[] = [{ role: 'system', content: systemPrompt }, userMessage]

    const result = await provider.generateText({ messages })

    // Remove palavras evitadas do resultado
    let content = result.content
    if (brand.avoidedWords && brand.avoidedWords.length > 0) {
      content = this.filterAvoidedWords(content, brand.avoidedWords)
    }

    // Rastreia uso e calcula custo se houver tokens
    let usageWithCost: UsageWithCost | undefined = result.usage
    if (result.usage && result.model) {
      const costInfo = await this.trackSimpleUsage(data.brandId, providerName, result.model, result.usage)
      if (costInfo) {
        usageWithCost = {
          ...result.usage,
          costUsd: costInfo.costUsd,
          costBreakdown: costInfo.costBreakdown
        }
      }
    }

    return {
      content,
      provider: providerName,
      model: result.model,
      brandContextUsed: true,
      promptUsed: customPrompt || systemPrompt,
      usage: usageWithCost
    }
  }

  // Monta mensagem do usuario com suporte a imagens (vision)
  private async buildUserMessage(textPrompt: string, images?: AIImage[]): Promise<AIMessage> {
    // Se nao houver imagens, retorna mensagem simples
    if (!images || images.length === 0) {
      return { role: 'user', content: textPrompt }
    }

    // Com imagens, monta conteudo multimodal
    const content: AIMessageContent[] = [{ type: 'text', text: textPrompt }]

    for (const image of images) {
      // Converte URLs locais para base64 (APIs externas nao conseguem acessar localhost)
      const imageUrl = await this.resolveImageUrl(image.url, image.mimeType)

      content.push({
        type: 'image',
        url: imageUrl,
        mimeType: image.mimeType
      })
    }

    return { role: 'user', content }
  }

  // Converte URLs locais para data URLs base64
  private async resolveImageUrl(url: string, mimeType?: string): Promise<string> {
    // Se ja for uma data URL, retorna como esta
    if (url.startsWith('data:')) {
      return url
    }

    // Verifica se e uma URL local (localhost ou caminho relativo de uploads)
    const isLocalUrl = url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('/uploads/')

    if (!isLocalUrl) {
      // URLs externas podem ser usadas diretamente
      return url
    }

    // Extrai o nome do arquivo da URL
    const filename = url.split('/').pop()
    if (!filename) {
      throw new BadRequest('URL de imagem invalida')
    }

    // Le o arquivo do diretorio de uploads
    const publicDir = this.app.get('public') || 'public'
    const filePath = path.join(publicDir, 'uploads', filename)

    try {
      const fileBuffer = await fs.readFile(filePath)
      const base64 = fileBuffer.toString('base64')

      // Determina o mimeType se nao foi fornecido
      const detectedMimeType = mimeType || this.getMimeTypeFromExtension(filename)

      return `data:${detectedMimeType};base64,${base64}`
    } catch (error) {
      throw new BadRequest(`Nao foi possivel ler a imagem: ${filename}`)
    }
  }

  // Detecta mimeType pela extensao do arquivo
  private getMimeTypeFromExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml'
    }
    return mimeTypes[ext || ''] || 'image/png'
  }

  private buildSystemPrompt(
    brand: BrandInfo,
    platform: string,
    limit: number,
    includeHashtags?: boolean
  ): string {
    let prompt = `You are a senior social media content specialist.
Create a post for ${platform} with a maximum of ${limit} characters.

# COPYWRITING GUIDELINES
- First line must be a HOOK that stops the scroll
- Use short paragraphs for mobile readability
- End with a clear call-to-action
- Write in a conversational, engaging tone`

    if (brand.toneOfVoice) {
      prompt += `\n\n# TONE OF VOICE\n${brand.toneOfVoice}`
    }
    if (brand.values && brand.values.length > 0) {
      prompt += `\n\n# BRAND VALUES\n${brand.values.join(', ')}`
    }
    if (brand.preferredWords && brand.preferredWords.length > 0) {
      prompt += `\n\n# PREFERRED WORDS\nIncorporate these words when relevant: ${brand.preferredWords.join(', ')}`
    }
    if (brand.avoidedWords && brand.avoidedWords.length > 0) {
      prompt += `\n\n# WORDS TO AVOID\nNEVER use: ${brand.avoidedWords.join(', ')}`
    }
    if (brand.targetAudience) {
      prompt += `\n\n# TARGET AUDIENCE\n${brand.targetAudience}`
    }
    if (includeHashtags) {
      prompt +=
        '\n\n# HASHTAGS\nInclude 5-10 relevant hashtags at the end of the post. Mix niche-specific and trending hashtags.'
    }

    return prompt
  }

  private async rewriteContent(
    data: AIData,
    brand: BrandInfo,
    provider: {
      generateText: (opts: { messages: AIMessage[] }) => Promise<{
        content: string
        model?: string
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
      }>
    },
    providerName: AIProviderName
  ): Promise<AIResult> {
    const platform = data.platform || 'instagram'
    const limit = platformLimits[platform] || 2200

    const systemPrompt = `You are a social media content rewriting specialist.

# TASK
Rewrite the following text while maintaining its core meaning, but adapting it to the brand's tone of voice.

# CONSTRAINTS
- Maximum ${limit} characters
- Tone of voice: ${brand.toneOfVoice || 'professional'}
- Improve readability and engagement
- Add a compelling hook at the beginning
${brand.avoidedWords ? `- NEVER use these words: ${brand.avoidedWords.join(', ')}` : ''}

# OUTPUT
Return only the rewritten content, no explanations.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: data.originalContent || '' }
    ]

    const result = await provider.generateText({ messages })

    // Rastreia uso e calcula custo se houver tokens
    let usageWithCost: UsageWithCost | undefined = result.usage
    if (result.usage && result.model) {
      const costInfo = await this.trackSimpleUsage(data.brandId, providerName, result.model, result.usage)
      if (costInfo) {
        usageWithCost = {
          ...result.usage,
          costUsd: costInfo.costUsd,
          costBreakdown: costInfo.costBreakdown
        }
      }
    }

    return {
      content: result.content,
      provider: providerName,
      model: result.model,
      brandContextUsed: true,
      usage: usageWithCost
    }
  }

  private async adaptContent(
    data: AIData,
    brand: BrandInfo,
    provider: {
      generateText: (opts: { messages: AIMessage[] }) => Promise<{
        content: string
        model?: string
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
      }>
    },
    providerName: AIProviderName
  ): Promise<AIResult> {
    const targetPlatform = data.targetPlatform || 'twitter'
    const targetLimit = platformLimits[targetPlatform] || 280

    const platformCharacteristics: Record<string, string> = {
      twitter: 'concise, punchy, conversational. Use threads for longer content.',
      instagram: 'visual-first, storytelling, uses emojis and line breaks for readability.',
      linkedin: 'professional, thought-leadership focused, industry insights.',
      threads: 'casual, conversational, authentic voice.',
      facebook: 'community-focused, shareable, can be longer form.',
      tiktok: 'trendy, uses slang, references current memes and sounds.'
    }

    const systemPrompt = `You are a cross-platform social media adaptation specialist.

# TASK
Adapt the content from ${data.originalPlatform || 'instagram'} to ${targetPlatform}.

# TARGET PLATFORM CHARACTERISTICS
${platformCharacteristics[targetPlatform] || 'General social media best practices.'}

# CONSTRAINTS
- Maximum ${targetLimit} characters
- Maintain the core message and intent
- Adjust format and tone for the new platform
- Brand tone of voice: ${brand.toneOfVoice || 'professional'}

# OUTPUT
Return only the adapted content, optimized for ${targetPlatform}.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: data.originalContent || '' }
    ]

    const result = await provider.generateText({ messages })

    // Rastreia uso e calcula custo se houver tokens
    let usageWithCost: UsageWithCost | undefined = result.usage
    if (result.usage && result.model) {
      const costInfo = await this.trackSimpleUsage(data.brandId, providerName, result.model, result.usage)
      if (costInfo) {
        usageWithCost = {
          ...result.usage,
          costUsd: costInfo.costUsd,
          costBreakdown: costInfo.costBreakdown
        }
      }
    }

    return {
      content: result.content,
      provider: providerName,
      model: result.model,
      brandContextUsed: true,
      usage: usageWithCost
    }
  }

  private async suggestHashtags(
    data: AIData,
    provider: {
      generateText: (opts: { messages: AIMessage[] }) => Promise<{
        content: string
        model?: string
        usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
      }>
    },
    providerName: AIProviderName
  ): Promise<AIResult> {
    const systemPrompt = `You are a hashtag strategy specialist for social media.

# TASK
Analyze the content and suggest relevant hashtags.

# HASHTAG STRATEGY
Categorize your suggestions:
1. **Niche (3-5)**: Specific to the industry/topic, lower volume but high relevance
2. **Trending (2-3)**: Currently popular hashtags related to the topic
3. **Community (2-3)**: Hashtags used by engaged communities

# CRITERIA
- Avoid banned or shadowbanned hashtags
- Prefer hashtags with 10K-500K posts (discovery sweet spot)
- Must be relevant to the content, not generic

# OUTPUT FORMAT
Return ONLY hashtags, one per line, starting with #.
Suggest between 5 and 10 hashtags total.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: data.content || '' }
    ]

    const result = await provider.generateText({ messages })

    // Parse hashtags from result
    const hashtags = result.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('#'))

    // Rastreia uso e calcula custo se houver tokens
    let usageWithCost: UsageWithCost | undefined = result.usage
    if (result.usage && result.model) {
      const costInfo = await this.trackSimpleUsage(data.brandId, providerName, result.model, result.usage)
      if (costInfo) {
        usageWithCost = {
          ...result.usage,
          costUsd: costInfo.costUsd,
          costBreakdown: costInfo.costBreakdown
        }
      }
    }

    return {
      content: hashtags.join(' '),
      provider: providerName,
      model: result.model,
      hashtags,
      usage: usageWithCost
    }
  }

  private replaceVariables(template: string, vars: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    }
    return result
  }

  private filterAvoidedWords(_content: string, _avoidedWords: string[]): string {
    // Por enquanto retorna o conteudo original
    // A IA ja foi instruida a evitar as palavras
    return _content
  }

  /**
   * Rastreia uso de uma operacao simples (sem log detalhado)
   * Usado por generateContent, rewriteContent, adaptContent, suggestHashtags
   * Retorna os custos calculados para incluir no resultado
   */
  private async trackSimpleUsage(
    brandId: number,
    provider: string,
    model: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  ): Promise<{
    costUsd: number
    costBreakdown: { inputCost: number; outputCost: number; imageCost: number; videoCost: number }
  } | null> {
    try {
      const costCalculator = getAICostCalculator(this.app)
      const usageService = getAIUsageService(this.app)

      const costResult = await costCalculator.calculateCost({
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens
      })

      await usageService.addUsage({
        brandId,
        provider,
        model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        costUsd: costResult.costUsd
      })

      return {
        costUsd: costResult.costUsd,
        costBreakdown: {
          inputCost: costResult.breakdown.inputCost,
          outputCost: costResult.breakdown.outputCost,
          imageCost: costResult.breakdown.imageCost,
          videoCost: costResult.breakdown.videoCost
        }
      }
    } catch (error) {
      // Log silencioso - nao interrompe a operacao por falha de tracking
      console.error('Erro ao rastrear uso de IA:', error)
      return null
    }
  }

  /**
   * Calcula e salva custos de uma geracao com multiplas execucoes de agentes
   */
  private async calculateAndSaveCosts(params: {
    logId: number
    brandId: number
    userId?: number
    executions: AgentExecution[]
    feathersParams?: Record<string, unknown>
  }): Promise<{
    costUsd: number
    mainProvider: string
    mainModel: string
    costBreakdown: { inputCost: number; outputCost: number; imageCost: number; videoCost: number }
    agentBreakdown: Array<{
      agentType: string
      provider: string
      model: string
      promptTokens: number
      completionTokens: number
      totalTokens: number
      costUsd: number
      imagesGenerated?: number
    }>
  }> {
    const costCalculator = getAICostCalculator(this.app)
    const usageService = getAIUsageService(this.app)
    const logsService = this.app.service('ai-generation-logs')

    // Calcula custo agregado de todas as execucoes
    const executionsForCost = params.executions.map(exec => ({
      provider: exec.provider,
      model: exec.model,
      promptTokens: exec.promptTokens || 0,
      completionTokens: exec.completionTokens || 0,
      // Imagens sao contabilizadas quando o agente e de geracao de imagem
      imagesGenerated: exec.agentType === 'imageGeneration' && exec.imageUrl ? 1 : 0
    }))

    const costResult = await costCalculator.calculateAggregateCost(executionsForCost)

    // Determina provider e modelo principal (mais tokens usados)
    const tokensByProviderModel = new Map<string, number>()
    for (const exec of params.executions) {
      const key = `${exec.provider}:${exec.model}`
      tokensByProviderModel.set(key, (tokensByProviderModel.get(key) || 0) + (exec.totalTokens || 0))
    }

    let mainProvider = 'unknown'
    let mainModel = 'unknown'
    let maxTokens = 0
    for (const [key, tokens] of tokensByProviderModel.entries()) {
      if (tokens > maxTokens) {
        maxTokens = tokens
        const [provider, model] = key.split(':')
        mainProvider = provider
        mainModel = model
      }
    }

    // Atualiza log com campos de custo
    await logsService.patch(
      params.logId,
      {
        estimatedCostUsd: costResult.costUsd,
        costBreakdown: costResult.breakdown,
        mainProvider,
        mainModel
      },
      params.feathersParams
    )

    // Calcula custo por agente e adiciona uso aos agregados
    const agentBreakdown: Array<{
      agentType: string
      provider: string
      model: string
      promptTokens: number
      completionTokens: number
      totalTokens: number
      costUsd: number
      imagesGenerated?: number
    }> = []

    for (const exec of params.executions) {
      const imagesGenerated = exec.agentType === 'imageGeneration' && exec.imageUrl ? 1 : 0

      const singleCost = await costCalculator.calculateCost({
        provider: exec.provider,
        model: exec.model,
        promptTokens: exec.promptTokens || 0,
        completionTokens: exec.completionTokens || 0,
        imagesGenerated
      })

      // Adiciona ao breakdown por agente
      agentBreakdown.push({
        agentType: exec.agentType,
        provider: exec.provider,
        model: exec.model,
        promptTokens: exec.promptTokens || 0,
        completionTokens: exec.completionTokens || 0,
        totalTokens: exec.totalTokens || 0,
        costUsd: singleCost.costUsd,
        imagesGenerated: imagesGenerated > 0 ? imagesGenerated : undefined
      })

      // Adiciona uso aos agregados (apenas se tiver tokens)
      if (exec.promptTokens || exec.completionTokens) {
        await usageService.addUsage({
          userId: params.userId,
          brandId: params.brandId,
          provider: exec.provider,
          model: exec.model,
          promptTokens: exec.promptTokens || 0,
          completionTokens: exec.completionTokens || 0,
          totalTokens: exec.totalTokens || 0,
          imagesGenerated,
          costUsd: singleCost.costUsd
        })
      }
    }

    return {
      costUsd: costResult.costUsd,
      mainProvider,
      mainModel,
      costBreakdown: costResult.breakdown,
      agentBreakdown
    }
  }

  // Gera carrousel com 4 slides usando sistema de agentes
  private async generateCarousel(data: AIData, params?: AIParams): Promise<AIResult> {
    // Verifica se ja existe geracao em andamento para este post
    if (data.postId) {
      const db = this.app.get('sqliteClient')
      const post = await db('posts').where('id', data.postId).first()
      if (post && post.aiState === 'loading') {
        console.log(`[AI:carousel] Post ${data.postId} ja esta em geracao. Rejeitando nova requisicao.`)
        throw new BadRequest(
          'Ja existe uma geracao em andamento para este post. Aguarde a conclusao antes de iniciar outra.'
        )
      }
    }

    const orchestrator = new AgentOrchestrator(this.app)

    // Converte imagens de referencia para URLs
    const referenceImages = data.images?.map(img => img.url)

    // Obtem userId dos params
    const userId = (params as Record<string, unknown>)?.user
      ? (params as Record<string, { id?: number }>)?.user?.id || 0
      : 0

    // Timestamp de quando o usuario clicou (para tracking de requests)
    const requestedAt = new Date()

    // Cria log inicial
    const logsService = this.app.service('ai-generation-logs')
    const log = await logsService.create(
      {
        brandId: data.brandId,
        generationType: 'carousel',
        originalPrompt: data.prompt,
        platform: data.platform,
        referenceImages,
        postId: data.postId // Ja associa ao post se existir
      },
      params as Record<string, unknown>
    )

    // Se temos postId, marca que a geracao esta em andamento
    // Usa servico do Feathers para garantir execucao de hooks e eventos real-time
    console.log(`[AI:carousel] postId recebido: ${data.postId}, logId: ${log.id}`)
    if (data.postId) {
      console.log(`[AI:carousel] Marcando post ${data.postId} como loading...`)
      try {
        await this.app.service('posts').patch(
          data.postId,
          { aiState: 'loading', activeLogId: log.id },
          { provider: undefined } // Chamada interna - ignora autenticacao externa
        )
        console.log(`[AI:carousel] Post ${data.postId} marcado como loading com sucesso`)
      } catch (patchError) {
        console.error(`[AI:carousel] Erro ao marcar post como loading:`, patchError)
        // Nao lanca o erro para nao interromper a geracao
      }
    } else {
      console.log(`[AI:carousel] postId nao fornecido, nao sera possivel rastrear estado`)
    }

    try {
      // Executa orquestracao com logId para atualizacoes em tempo real
      // Se postId foi passado, passa para o orchestrator para logging de requests
      const result = await orchestrator.orchestrate({
        brandId: data.brandId,
        userId,
        prompt: data.prompt || '',
        platform: data.platform || 'instagram',
        referenceImages,
        logId: log.id,
        targetAspectRatio: data.targetAspectRatio,
        postId: data.postId, // Para logging de ai_requests
        requestedAt // Timestamp original do usuario
      })

      // Atualiza log com resultado
      await logsService.patch(
        log.id,
        {
          status: result.success ? 'completed' : 'failed',
          agentExecutions: result.executions,
          slides: result.slides,
          totalPromptTokens: result.totalTokens.prompt,
          totalCompletionTokens: result.totalTokens.completion,
          totalTokens: result.totalTokens.total,
          executionTimeMs: result.executionTimeMs,
          completedAt: new Date().toISOString(),
          errorMessage: result.error
        },
        params as Record<string, unknown>
      )

      // Calcula e salva custos (apos atualizar tokens)
      const costInfo = await this.calculateAndSaveCosts({
        logId: log.id,
        brandId: data.brandId,
        userId,
        executions: result.executions,
        feathersParams: params as Record<string, unknown>
      })

      if (!result.success) {
        throw new BadRequest(result.error || 'Falha ao gerar carrousel')
      }

      // Usa caption gerado como conteudo principal do post
      const postContent = result.caption || ''

      // Coleta URLs de imagens geradas
      const mediaUrls = result.slides.filter(s => s.imageUrl).map(s => s.imageUrl as string)

      // Prepara slides completos com novos campos (masterImageUrl, versions, etc.)
      const slidesForPost = result.slides.map(s => ({
        index: s.index,
        purpose: s.purpose,
        text: s.text,
        imageUrl: s.imageUrl,
        imagePrompt: s.imagePrompt,
        // Novos campos da arquitetura master + derivadas
        masterImageUrl: s.masterImageUrl,
        typography: s.typography,
        versions: s.versions,
        generationMetadata: s.generationMetadata
      }))

      // Gerencia post e versoes
      let postId: number | undefined = data.postId
      const postsService = this.app.service('posts')
      const postVersionsService = this.app.service('post-versions')

      // Se postId foi passado, o post ja existe (criado como draft pelo frontend)
      // Se nao foi passado e saveAsPost !== false, cria um novo post
      if (!postId && data.saveAsPost !== false) {
        const post = await postsService.create(
          {
            brandId: data.brandId,
            content: postContent,
            platform: data.platform || 'instagram',
            status: 'draft',
            origin: 'ai',
            aiPrompt: data.prompt,
            mediaUrls,
            slides: slidesForPost,
            creativeBriefing: result.briefing
          },
          params as Record<string, unknown>
        )
        postId = post.id

        // Atualiza log com postId
        await logsService.patch(log.id, { postId }, params as Record<string, unknown>)
      }

      // Se temos um postId, criamos uma versao
      if (postId) {
        // Busca numero da proxima versao
        const existingVersions = (await postVersionsService.find({
          query: { postId, $limit: 1, $sort: { version: -1 } },
          paginate: false
        })) as unknown as Array<{ version: number }>

        const nextVersion = (existingVersions[0]?.version || 0) + 1

        // Cria nova versao
        const version = await postVersionsService.create(
          {
            postId,
            logId: log.id,
            version: nextVersion,
            content: postContent,
            caption: result.caption,
            slides: slidesForPost,
            mediaUrls,
            creativeBriefing: result.briefing,
            isActive: true, // Nova versao e sempre ativa
            source: 'ai',
            prompt: data.prompt,
            totalTokens: result.totalTokens.total,
            costUsd: costInfo.costUsd,
            executionTimeMs: result.executionTimeMs
          },
          params as Record<string, unknown>
        )

        // Desativa versoes anteriores usando servico do Feathers
        const previousVersions = await this.app.service('post-versions').find({
          query: {
            postId: postId,
            id: { $ne: version.id },
            isActive: true
          },
          provider: undefined
        })

        // Desativa cada versao anterior
        const versionsArray = Array.isArray(previousVersions) ? previousVersions : previousVersions.data || []
        for (const prevVersion of versionsArray) {
          await this.app
            .service('post-versions')
            .patch(prevVersion.id, { isActive: false }, { provider: undefined })
        }

        // Atualiza post com conteudo da versao ativa e currentVersionId
        // Usa servico do Feathers para garantir execucao de hooks e eventos real-time
        // Inclui aiState: 'idle' para garantir que o estado seja resetado
        await this.app.service('posts').patch(
          postId,
          {
            content: postContent,
            slides: slidesForPost, // Hook de serializacao faz JSON.stringify
            mediaUrls: mediaUrls,
            creativeBriefing: result.briefing,
            currentVersionId: version.id,
            lastUsageTotalTokens: result.totalTokens.total,
            lastUsageCostUsd: costInfo.costUsd,
            lastUsageProvider: costInfo.mainProvider,
            lastUsageModel: costInfo.mainModel,
            lastUsageCostBreakdown: costInfo.costBreakdown,
            aiState: 'idle',
            activeLogId: null
          },
          { provider: undefined }
        )
      }

      return {
        content: postContent,
        caption: result.caption,
        provider: 'multi-agent',
        model: 'orchestrator',
        brandContextUsed: true,
        promptUsed: data.prompt,
        usage: {
          promptTokens: result.totalTokens.prompt,
          completionTokens: result.totalTokens.completion,
          totalTokens: result.totalTokens.total,
          costUsd: costInfo.costUsd,
          costBreakdown: costInfo.costBreakdown,
          agentBreakdown: costInfo.agentBreakdown
        },
        slides: slidesForPost,
        briefing: result.briefing,
        postId,
        logId: log.id
      }
    } catch (error) {
      // Atualiza log com erro
      await logsService.patch(
        log.id,
        {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
          errorStack: error instanceof Error ? error.stack : undefined,
          completedAt: new Date().toISOString()
        },
        params as Record<string, unknown>
      )

      throw error
    } finally {
      // Sempre marca que a geracao terminou (sucesso ou erro)
      // Usa servico do Feathers para garantir execucao de hooks e eventos real-time
      if (data.postId) {
        console.log(`[AI:carousel] Finalizando - marcando post ${data.postId} como idle...`)
        try {
          await this.app
            .service('posts')
            .patch(data.postId, { aiState: 'idle', activeLogId: null }, { provider: undefined })
          console.log(`[AI:carousel] Post ${data.postId} marcado como idle com sucesso`)
        } catch (patchError) {
          console.error(`[AI:carousel] Erro ao marcar post como idle:`, patchError)
        }
      }
    }
  }
}

// Configuracao de agente por tipo
interface AIAgentConfig {
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

// Interface para informacoes da marca
interface BrandInfo {
  id: number
  name: string
  description?: string
  toneOfVoice?: string
  values?: string[]
  preferredWords?: string[]
  avoidedWords?: string[]
  targetAudience?: string
  prompts?: {
    text?: string
    image?: string
    video?: string
  }
  aiConfig?: {
    // Tipos de agente modernos
    reasoning?: AIAgentConfig
    textCreation?: AIAgentConfig
    textAdaptation?: AIAgentConfig
    analysis?: AIAgentConfig
    imageGeneration?: AIAgentConfig
    videoGeneration?: AIAgentConfig
    creativeDirection?: AIAgentConfig
    compliance?: AIAgentConfig
    // Campos legados mantidos para compatibilidade
    text?: AIAgentConfig
    image?: AIAgentConfig
    video?: AIAgentConfig
  }
}

export const getOptions = (app: Application): AIServiceOptions => {
  return { app }
}
