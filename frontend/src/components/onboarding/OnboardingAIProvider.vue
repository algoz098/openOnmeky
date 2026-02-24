<template>
  <q-card-section class="text-center">
    <q-icon name="auto_awesome" size="48px" color="primary" class="q-mb-sm" />
    <div class="text-h6 text-weight-bold">Configurar Inteligencia Artificial</div>
    <div class="text-body2 text-grey-7">Configure os providers de IA que deseja usar</div>
  </q-card-section>
  <q-card-section>
    <div class="providers-list q-mb-md">
      <q-expansion-item
        v-for="provider in providers"
        :key="provider.name"
        :label="provider.displayName"
        :icon="provider.icon"
        :caption="provider.description"
        :header-class="getProviderHeaderClass(provider.name)"
        expand-icon-toggle
        dense
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-checkbox
              :model-value="isProviderConfigured(provider.name)"
              @update:model-value="(val) => toggleProvider(provider.name, val)"
              @click.stop
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ provider.displayName }}</q-item-label>
            <q-item-label caption>{{ provider.description }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge v-if="provider.free" color="positive">Gratuito</q-badge>
            <q-badge v-else color="warning">Pago</q-badge>
          </q-item-section>
        </template>

        <q-card class="q-ml-lg q-mr-sm q-mb-sm">
          <q-card-section class="q-pa-sm">
            <q-input
              v-if="provider.needsApiKey"
              :model-value="getProviderConfig(provider.name)?.apiKey || ''"
              @update:model-value="(val) => updateProviderField(provider.name, 'apiKey', String(val ?? ''))"
              :label="`API Key ${provider.displayName}`"
              :type="showApiKeys[provider.name] ? 'text' : 'password'"
              outlined
              dense
              class="q-mb-sm"
            >
              <template v-slot:append>
                <q-icon
                  :name="showApiKeys[provider.name] ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showApiKeys[provider.name] = !showApiKeys[provider.name]"
                />
              </template>
            </q-input>

            <q-input
              v-if="provider.hasBaseUrl"
              :model-value="getProviderConfig(provider.name)?.baseUrl || ''"
              @update:model-value="(val) => updateProviderField(provider.name, 'baseUrl', String(val ?? ''))"
              label="URL Base"
              outlined
              dense
              :placeholder="provider.defaultBaseUrl"
            />

            <div v-if="!provider.needsApiKey && !provider.hasBaseUrl" class="text-caption text-grey-6">
              Este provider nao requer configuracao adicional.
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>

    <div v-if="configuredProviders.length > 0" class="q-mb-md">
      <div class="text-caption text-grey-7">
        {{ configuredProviders.length }} provider(s) configurado(s): {{ configuredProviderNames }}
      </div>
    </div>

    <div class="row q-gutter-sm">
      <q-btn flat color="grey-7" label="Voltar" @click="$emit('back')" class="col" />
      <q-btn flat color="grey-7" label="Pular" @click="handleSkip" class="col" />
      <q-btn color="primary" class="col" size="lg" label="Continuar" @click="handleNext" />
    </div>
  </q-card-section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { ProviderName, AIProviderConfig, AIProvidersData } from './types'

interface ProviderInfo {
  name: ProviderName
  displayName: string
  icon: string
  needsApiKey: boolean
  hasBaseUrl: boolean
  defaultBaseUrl?: string
  free: boolean
  description: string
}

const emit = defineEmits<{
  next: [data: AIProvidersData]
  back: []
}>()

const providers: ProviderInfo[] = [
  { name: 'groq', displayName: 'Groq', icon: 'bolt', needsApiKey: true, hasBaseUrl: false, free: true, description: 'Inferencia ultra-rapida com Llama. Gratuito.' },
  { name: 'ollama', displayName: 'Ollama', icon: 'memory', needsApiKey: false, hasBaseUrl: true, defaultBaseUrl: 'http://localhost:11434', free: true, description: 'Modelos locais. Privacidade total.' },
  { name: 'openai', displayName: 'OpenAI', icon: 'auto_awesome', needsApiKey: true, hasBaseUrl: false, free: false, description: 'GPT-4, DALL-E. Alta qualidade.' },
  { name: 'anthropic', displayName: 'Claude', icon: 'psychology', needsApiKey: true, hasBaseUrl: false, free: false, description: 'Claude Sonnet/Opus. Excelente para texto.' },
  { name: 'google', displayName: 'Google AI', icon: 'smart_toy', needsApiKey: true, hasBaseUrl: false, free: false, description: 'Gemini, Imagen, Veo. Multimodal.' }
]

// Estado para multiplos providers
const configuredProviders = reactive<AIProviderConfig[]>([])
const showApiKeys = reactive<Record<string, boolean>>({})

const configuredProviderNames = computed(() => {
  return configuredProviders.map(p => {
    const info = providers.find(pr => pr.name === p.provider)
    return info?.displayName || p.provider
  }).join(', ')
})

const isProviderConfigured = (name: ProviderName): boolean => {
  return configuredProviders.some(p => p.provider === name)
}

const getProviderConfig = (name: ProviderName): AIProviderConfig | undefined => {
  return configuredProviders.find(p => p.provider === name)
}

const getProviderHeaderClass = (name: ProviderName): string => {
  return isProviderConfigured(name) ? 'bg-primary-1' : ''
}

const toggleProvider = (name: ProviderName, enabled: boolean) => {
  if (enabled) {
    if (!isProviderConfigured(name)) {
      const info = providers.find(p => p.name === name)
      configuredProviders.push({
        provider: name,
        apiKey: undefined,
        baseUrl: info?.defaultBaseUrl || undefined
      })
    }
  } else {
    const index = configuredProviders.findIndex(p => p.provider === name)
    if (index !== -1) {
      configuredProviders.splice(index, 1)
    }
  }
}

const updateProviderField = (name: ProviderName, field: 'apiKey' | 'baseUrl', value: string) => {
  let config = configuredProviders.find(p => p.provider === name)
  if (!config) {
    const info = providers.find(p => p.name === name)
    config = {
      provider: name,
      apiKey: undefined,
      baseUrl: info?.defaultBaseUrl || undefined
    }
    configuredProviders.push(config)
  }
  config[field] = value || undefined
}

const handleNext = () => {
  // Filtrar providers que requerem API key mas nao tem
  const validProviders = configuredProviders.filter(config => {
    const info = providers.find(p => p.name === config.provider)
    if (info?.needsApiKey && !config.apiKey) {
      return false
    }
    return true
  })
  emit('next', validProviders)
}

const handleSkip = () => {
  emit('next', [])
}
</script>

<style scoped>
.providers-list {
  max-height: 400px;
  overflow-y: auto;
}

.providers-list :deep(.q-expansion-item) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.providers-list :deep(.q-expansion-item:last-child) {
  border-bottom: none;
}

.bg-primary-1 {
  background-color: rgba(var(--q-primary-rgb), 0.08);
}
</style>

