// Helper para configurar mocks de AI providers nos testes
// Completamente isolado do codigo de producao - usa Sinon para stub

import * as sinon from 'sinon'
import type { Application } from '../../src/declarations'
import { MockAIProvider, createMockProvider, defaultTextResponse } from '../mocks/ai-providers.mock'
import type { AIProviderName, GenerateTextResult } from '../../src/services/ai-providers/ai-provider.interface'

// Armazena os stubs ativos para limpeza
let activeStubs: sinon.SinonStub[] = []
let mockProviders: Map<AIProviderName, MockAIProvider> = new Map()

/**
 * Configura mocks para todos os AI providers
 * Deve ser chamado no before() ou beforeEach() dos testes
 */
export function setupAIMocks(app: Application): Map<AIProviderName, MockAIProvider> {
  // Limpa mocks anteriores
  cleanupAIMocks()

  // Cria mock providers para cada tipo
  const providers: AIProviderName[] = ['openai', 'ollama', 'anthropic', 'google', 'groq']

  for (const name of providers) {
    const mockProvider = createMockProvider(name, {
      textResponse: {
        ...defaultTextResponse,
        provider: name,
        content: `Conteudo mockado gerado pelo provider ${name} para testes.`,
        model: `${name}-mock-model`
      }
    })
    mockProviders.set(name, mockProvider)
  }

  // Faz stub do servico de settings para retornar providers habilitados
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settingsService = app.service('settings') as any

  // Stub getProviderConfig - retorna config habilitado
  const getProviderConfigStub = sinon.stub(settingsService, 'getProviderConfig').callsFake(async (name: unknown) => {
    const providerName = name as string
    return {
      enabled: true,
      apiKey: `mock-api-key-${providerName}`,
      baseUrl: providerName === 'ollama' ? 'http://localhost:11434' : undefined
    }
  })
  activeStubs.push(getProviderConfigStub)

  // Stub getAISettings - retorna configuracao padrao
  const getAISettingsStub = sinon.stub(settingsService, 'getAISettings').callsFake(async () => {
    return {
      defaultProvider: 'openai',
      enabledProviders: providers
    }
  })
  activeStubs.push(getAISettingsStub)

  // Stub getEnabledProviders
  if (typeof settingsService.getEnabledProviders === 'function') {
    const getEnabledProvidersStub = sinon.stub(settingsService, 'getEnabledProviders').callsFake(async () => {
      return providers
    })
    activeStubs.push(getEnabledProvidersStub)
  }

  // Faz stub do AIService para usar mock providers
  // Acessa o servico e faz stub do metodo privado via prototype
  const aiService = app.service('ai')
  const aiServicePrototype = Object.getPrototypeOf(aiService)

  // Stub createProviderInstance para retornar mock
  const createProviderStub = sinon.stub(aiServicePrototype, 'createProviderInstance').callsFake(
    (name: unknown) => {
      const providerName = name as AIProviderName
      return mockProviders.get(providerName) || createMockProvider(providerName)
    }
  )
  activeStubs.push(createProviderStub)

  return mockProviders
}

/**
 * Limpa todos os mocks de AI
 * Deve ser chamado no after() ou afterEach() dos testes
 */
export function cleanupAIMocks(): void {
  for (const stub of activeStubs) {
    if (stub.restore) {
      stub.restore()
    }
  }
  activeStubs = []

  // Reseta contadores dos mock providers
  for (const provider of mockProviders.values()) {
    provider.reset()
  }
  mockProviders.clear()
}

/**
 * Obtem um mock provider especifico para configuracao ou assertions
 */
export function getMockProvider(name: AIProviderName): MockAIProvider | undefined {
  return mockProviders.get(name)
}

/**
 * Configura resposta customizada para um provider
 */
export function setMockResponse(
  name: AIProviderName,
  response: Partial<GenerateTextResult>
): void {
  const provider = mockProviders.get(name)
  if (provider) {
    provider.setTextResponse(response)
  }
}

/**
 * Configura todos os providers para retornar a mesma resposta
 */
export function setAllMockResponses(response: Partial<GenerateTextResult>): void {
  for (const provider of mockProviders.values()) {
    provider.setTextResponse(response)
  }
}

/**
 * Verifica quantas vezes um provider foi chamado
 */
export function getCallCount(name: AIProviderName): number {
  const provider = mockProviders.get(name)
  return provider?.generateTextCalls.length || 0
}

/**
 * Obtem as chamadas feitas a um provider (para assertions)
 */
export function getCalls(name: AIProviderName): unknown[] {
  const provider = mockProviders.get(name)
  return provider?.generateTextCalls || []
}

/**
 * Reseta contadores de chamadas sem remover os mocks
 */
export function resetCallCounters(): void {
  for (const provider of mockProviders.values()) {
    provider.reset()
  }
}

