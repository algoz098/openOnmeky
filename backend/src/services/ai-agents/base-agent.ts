// Agente base que todos os agentes estendem

import type { Application } from '../../declarations'
import type { AIProvider, AIProviderName, GenerateTextOptions, GenerateTextResult } from '../ai-providers'
import type { SettingsService, AIProviderSetting } from '../settings/settings.class'
import {
  OpenAIProvider,
  GoogleAIProvider,
  OllamaProvider,
  AnthropicProvider,
  GroqProvider
} from '../ai-providers'
import type { AgentContext, AgentExecution, AgentType, AIAgentConfig } from './types'

export abstract class BaseAgent {
  protected app: Application
  protected agentType: AgentType
  protected defaultModel: string

  constructor(app: Application, agentType: AgentType, defaultModel: string) {
    this.app = app
    this.agentType = agentType
    this.defaultModel = defaultModel
  }

  // Obtem configuracao especifica do agente a partir do contexto da marca
  protected getAgentConfig(context: AgentContext): AIAgentConfig | undefined {
    if (!context.aiConfig) {
      console.log(`[BaseAgent:${this.agentType}] Sem aiConfig no contexto`)
      return undefined
    }

    // Mapeia tipo de agente para campo de configuracao
    const configKey = this.agentType as keyof typeof context.aiConfig
    const config = context.aiConfig[configKey]
    console.log(`[BaseAgent:${this.agentType}] Config para ${configKey}:`, config)
    return config
  }

  // Obtem provider configurado, priorizando configuracao da marca
  protected async getProvider(providerName?: AIProviderName, context?: AgentContext): Promise<AIProvider> {
    const settingsService = this.app.service('settings') as unknown as SettingsService
    const aiSettings = await settingsService.getAISettings()

    console.log(`[BaseAgent:${this.agentType}] getProvider - providerName passado:`, providerName)
    console.log(
      `[BaseAgent:${this.agentType}] getProvider - defaultProvider do sistema:`,
      aiSettings.defaultProvider
    )

    // Prioridade: 1. providerName passado, 2. config da marca, 3. provider padrao do sistema
    let selectedProvider = providerName
    if (!selectedProvider && context) {
      const agentConfig = this.getAgentConfig(context)
      selectedProvider = agentConfig?.provider as AIProviderName | undefined
      console.log(`[BaseAgent:${this.agentType}] Provider da config da marca:`, selectedProvider)
    }
    if (!selectedProvider) {
      selectedProvider = (aiSettings.defaultProvider as AIProviderName) || 'ollama'
      console.log(`[BaseAgent:${this.agentType}] Usando provider padrao:`, selectedProvider)
    }

    console.log(`[BaseAgent:${this.agentType}] Provider selecionado final:`, selectedProvider)

    const config = await settingsService.getProviderConfig(selectedProvider)

    if (!config?.enabled) {
      console.error(`[BaseAgent:${this.agentType}] Provider ${selectedProvider} nao esta habilitado!`)
      throw new Error(`Provider ${selectedProvider} nao esta habilitado`)
    }

    return this.createProviderInstance(selectedProvider, config)
  }

  // Obtem modelo configurado para este agente
  protected getModel(context?: AgentContext): string {
    if (context) {
      const agentConfig = this.getAgentConfig(context)
      if (agentConfig?.model) {
        console.log(`[BaseAgent:${this.agentType}] Usando modelo da marca:`, agentConfig.model)
        return agentConfig.model
      }
    }
    console.log(`[BaseAgent:${this.agentType}] Usando modelo default:`, this.defaultModel)
    return this.defaultModel
  }

  // Obtem maxTokens da configuracao global do sistema
  protected async getMaxTokens(context?: AgentContext): Promise<number> {
    // Prioridade: 1. config da marca, 2. config global do sistema, 3. default 8000
    if (context) {
      const agentConfig = this.getAgentConfig(context)
      if (agentConfig?.maxTokens) {
        return agentConfig.maxTokens
      }
    }

    const settingsService = this.app.service('settings') as unknown as SettingsService
    const aiSettings = await settingsService.getAISettings()
    return aiSettings.maxTokens || 8000
  }

  // Cria instancia do provider
  protected createProviderInstance(name: AIProviderName, config: AIProviderSetting): AIProvider {
    switch (name) {
      case 'openai':
        if (!config.apiKey) throw new Error('OpenAI requer API key')
        return new OpenAIProvider({
          apiKey: config.apiKey,
          organizationId: config.organizationId,
          baseUrl: config.baseUrl
        })
      case 'google':
        if (!config.apiKey) throw new Error('Google AI requer API key')
        return new GoogleAIProvider({ apiKey: config.apiKey })
      case 'ollama':
        return new OllamaProvider({ baseUrl: config.baseUrl || 'http://localhost:11434' })
      case 'anthropic':
        if (!config.apiKey) throw new Error('Anthropic requer API key')
        return new AnthropicProvider({ apiKey: config.apiKey, baseUrl: config.baseUrl })
      case 'groq':
        if (!config.apiKey) throw new Error('Groq requer API key')
        return new GroqProvider({ apiKey: config.apiKey, baseUrl: config.baseUrl })
      default:
        throw new Error(`Provider ${name} nao suportado`)
    }
  }

  // Mapeia modelos de imagem para seus respectivos providers
  // IMPORTANTE: Nao ha fallback - modelos desconhecidos lancam erro
  protected getProviderForImageModel(model: string): AIProviderName {
    // Modelos OpenAI
    if (model.startsWith('gpt-image') || model.startsWith('dall-e')) {
      return 'openai'
    }
    // Modelos Google (Gemini, Imagen e Nano Banana)
    if (
      model.includes('gemini') ||
      model.includes('imagen') ||
      model.includes('flash') ||
      model.includes('nano-banana')
    ) {
      return 'google'
    }
    // Ollama pode ter modelos de imagem (ex: stable-diffusion)
    if (model.includes('stable-diffusion') || model.includes('sd-')) {
      return 'ollama'
    }
    // Erro: modelo nao reconhecido - nao ha fallback
    throw new Error(
      `Modelo de imagem desconhecido: "${model}". ` +
        `Modelos suportados: dall-e-2, dall-e-3, gpt-image-1, imagen-*, gemini-*, nano-banana-*, stable-diffusion`
    )
  }

  // Obtem provider especifico para um modelo de imagem
  protected async getProviderForImage(model: string): Promise<AIProvider> {
    const providerName = this.getProviderForImageModel(model)
    const settingsService = this.app.service('settings') as unknown as SettingsService
    const config = await settingsService.getProviderConfig(providerName)

    if (!config?.enabled) {
      throw new Error(`Provider ${providerName} nao esta habilitado para modelo de imagem ${model}`)
    }

    console.log(`[BaseAgent:${this.agentType}] Modelo ${model} -> Provider ${providerName}`)
    return this.createProviderInstance(providerName, config)
  }

  // Executa geracao de texto com logging
  protected async executeText(
    provider: AIProvider,
    options: GenerateTextOptions,
    context: AgentContext,
    systemPrompt: string,
    userPrompt: string
  ): Promise<{ result: GenerateTextResult; execution: AgentExecution }> {
    const startedAt = new Date().toISOString()

    try {
      const result = await provider.generateText(options)

      const execution: AgentExecution = {
        agentType: this.agentType,
        provider: provider.name,
        model: result.model,
        startedAt,
        completedAt: new Date().toISOString(),
        systemPrompt,
        userPrompt,
        result: result.content,
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
        totalTokens: result.usage?.totalTokens,
        status: 'success'
      }

      return { result, execution }
    } catch (error) {
      const execution: AgentExecution = {
        agentType: this.agentType,
        provider: provider.name,
        model: options.model || this.defaultModel,
        startedAt,
        completedAt: new Date().toISOString(),
        systemPrompt,
        userPrompt,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'failed'
      }

      throw { error, execution }
    }
  }

  // Metodo abstrato que cada agente implementa
  abstract execute(
    context: AgentContext,
    input: unknown
  ): Promise<{
    result: unknown
    executions: AgentExecution[]
  }>
}
