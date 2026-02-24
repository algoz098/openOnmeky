<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">Configuracoes</h4>
        <p class="text-grey-7 q-ma-none">Gerencie as configuracoes do sistema</p>
      </div>
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Providers de IA</div>
        <p class="text-grey-7">Configure as chaves de API para os providers de inteligencia artificial.</p>
      </q-card-section>

      <q-card-section v-if="loading" class="text-center">
        <q-spinner size="40px" color="primary" />
      </q-card-section>

      <template v-else>
        <q-list separator>
          <q-expansion-item
            v-for="provider in providers"
            :key="provider.name"
            :icon="provider.icon"
            :label="provider.displayName"
            :caption="getProviderCaption(provider.name)"
            header-class="text-weight-medium"
          >
            <q-card>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-toggle
                      v-model="settings[provider.name].enabled"
                      :label="settings[provider.name].enabled ? 'Habilitado' : 'Desabilitado'"
                      @update:model-value="saveProvider(provider.name)"
                    />
                  </div>

                  <div v-if="provider.needsApiKey" class="col-12 col-md-6">
                    <q-input
                      v-model="settings[provider.name].apiKey"
                      :label="'API Key'"
                      :type="showApiKey[provider.name] ? 'text' : 'password'"
                      outlined
                      dense
                      :disable="!settings[provider.name].enabled"
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="showApiKey[provider.name] ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="showApiKey[provider.name] = !showApiKey[provider.name]"
                        />
                      </template>
                    </q-input>
                  </div>

                  <div v-if="provider.hasBaseUrl" class="col-12 col-md-6">
                    <q-input
                      v-model="settings[provider.name].baseUrl"
                      label="URL Base"
                      outlined
                      dense
                      :placeholder="provider.defaultBaseUrl"
                      :disable="!settings[provider.name].enabled"
                    />
                  </div>

                  <div v-if="provider.name === 'openai'" class="col-12 col-md-6">
                    <q-input
                      v-model="settings[provider.name].organizationId"
                      label="Organization ID (opcional)"
                      outlined
                      dense
                      :disable="!settings[provider.name].enabled"
                    />
                  </div>

                  <div class="col-12">
                    <q-btn
                      color="primary"
                      label="Salvar"
                      :loading="saving[provider.name]"
                      :disable="!settings[provider.name].enabled"
                      @click="saveProvider(provider.name)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </template>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Provider Padrao</div>
        <q-select
          v-model="defaultProvider"
          :options="enabledProviders"
          label="Provider padrao para geracao de conteudo"
          outlined
          dense
          emit-value
          map-options
          :disable="enabledProviders.length === 0"
          @update:model-value="setDefaultProvider"
        />
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Configuracoes Globais de IA</div>
        <p class="text-grey-7 q-mb-md">Configuracoes gerais para geracao de conteudo com IA.</p>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model.number="globalSettings.maxTokens"
              label="Limite Maximo de Tokens"
              type="number"
              outlined
              dense
              hint="Maximo de tokens para respostas da IA (padrao: 8000)"
              :rules="[(val) => val >= 1000 || 'Minimo de 1000 tokens']"
            />
          </div>

          <div class="col-12">
            <q-btn
              color="primary"
              label="Salvar Configuracoes Globais"
              :loading="savingGlobal"
              @click="saveGlobalSettings"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-h6">Precos de Modelos de IA</div>
            <p class="text-grey-7 q-ma-none">Configure os precos por modelo para tracking de custos.</p>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              color="warning"
              label="Restaurar Padrao"
              icon="restore"
              :loading="resettingPricing"
              @click="resetPricing"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="loadingPricing" class="text-center">
        <q-spinner size="40px" color="primary" />
      </q-card-section>

      <template v-else>
        <q-list separator>
          <q-expansion-item
            v-for="provider in providers"
            :key="'pricing-' + provider.name"
            :icon="provider.icon"
            :label="provider.displayName"
            :caption="getPricingCaption(provider.name)"
            header-class="text-weight-medium"
          >
            <q-card>
              <q-card-section>
                <div v-if="!pricing.models[provider.name] || Object.keys(pricing.models[provider.name] || {}).length === 0">
                  <p class="text-grey-6">Nenhum modelo configurado para este provider.</p>
                </div>
                <div v-else>
                  <div
                    v-for="(modelPricing, modelName) in pricing.models[provider.name]"
                    :key="modelName"
                    class="row q-col-gutter-sm q-mb-md items-center"
                  >
                    <div class="col-12 col-md-3">
                      <div class="text-weight-medium">{{ modelName }}</div>
                    </div>
                    <div class="col-6 col-md-2">
                      <q-input
                        v-model.number="modelPricing.inputPricePerMillion"
                        label="Input/1M"
                        type="number"
                        outlined
                        dense
                        step="0.001"
                        prefix="$"
                      />
                    </div>
                    <div class="col-6 col-md-2">
                      <q-input
                        v-model.number="modelPricing.outputPricePerMillion"
                        label="Output/1M"
                        type="number"
                        outlined
                        dense
                        step="0.001"
                        prefix="$"
                      />
                    </div>
                    <div class="col-6 col-md-2">
                      <q-input
                        v-model.number="modelPricing.imagePricePerUnit"
                        label="Imagem"
                        type="number"
                        outlined
                        dense
                        step="0.001"
                        prefix="$"
                      />
                    </div>
                    <div class="col-6 col-md-2">
                      <q-input
                        v-model.number="modelPricing.videoPricePerSecond"
                        label="Video/s"
                        type="number"
                        outlined
                        dense
                        step="0.001"
                        prefix="$"
                      />
                    </div>
                  </div>
                  <q-btn
                    color="primary"
                    label="Salvar Precos"
                    :loading="savingPricing[provider.name]"
                    @click="savePricing(provider.name)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </template>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useFeathers } from 'src/composables/use-feathers'

type ProviderName = 'openai' | 'google' | 'ollama' | 'anthropic' | 'groq'

interface ProviderConfig {
  enabled: boolean
  apiKey?: string
  baseUrl?: string
  organizationId?: string
}

interface ProviderInfo {
  name: ProviderName
  displayName: string
  icon: string
  needsApiKey: boolean
  hasBaseUrl: boolean
  defaultBaseUrl?: string
}

const $q = useQuasar()
const { api } = useFeathers()

const loading = ref(true)
const defaultProvider = ref<ProviderName | null>(null)
const showApiKey = reactive<Record<ProviderName, boolean>>({
  openai: false, google: false, ollama: false, anthropic: false, groq: false
})
const saving = reactive<Record<ProviderName, boolean>>({
  openai: false, google: false, ollama: false, anthropic: false, groq: false
})

const settings = reactive<Record<ProviderName, ProviderConfig>>({
  openai: { enabled: false },
  google: { enabled: false },
  ollama: { enabled: true, baseUrl: 'http://localhost:11434' },
  anthropic: { enabled: false },
  groq: { enabled: false }
})

// Configuracoes globais de IA
const globalSettings = reactive({
  maxTokens: 8000
})
const savingGlobal = ref(false)

const providers: ProviderInfo[] = [
  { name: 'openai', displayName: 'OpenAI', icon: 'auto_awesome', needsApiKey: true, hasBaseUrl: false },
  { name: 'google', displayName: 'Google AI (Gemini)', icon: 'smart_toy', needsApiKey: true, hasBaseUrl: false },
  { name: 'ollama', displayName: 'Ollama (Local)', icon: 'memory', needsApiKey: false, hasBaseUrl: true, defaultBaseUrl: 'http://localhost:11434' },
  { name: 'anthropic', displayName: 'Anthropic (Claude)', icon: 'psychology', needsApiKey: true, hasBaseUrl: false },
  { name: 'groq', displayName: 'Groq', icon: 'bolt', needsApiKey: true, hasBaseUrl: false }
]

const enabledProviders = computed(() => {
  return providers
    .filter(p => settings[p.name].enabled && (p.name === 'ollama' || settings[p.name].apiKey))
    .map(p => ({ label: p.displayName, value: p.name }))
})

const getProviderCaption = (name: ProviderName) => {
  if (!settings[name].enabled) return 'Desabilitado'
  if (name === 'ollama') return settings[name].baseUrl || 'Local'
  return settings[name].apiKey ? 'Configurado' : 'API Key nao configurada'
}

const fetchSettings = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (api.service('settings') as any).find()
    if (result?.ai) {
      for (const provider of providers) {
        if (result.ai[provider.name]) {
          settings[provider.name] = { ...settings[provider.name], ...result.ai[provider.name] }
        }
      }
      defaultProvider.value = result.ai.defaultProvider || null
      // Configuracoes globais
      globalSettings.maxTokens = result.ai.maxTokens || 8000
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao carregar configuracoes' })
  } finally {
    loading.value = false
  }
}

const saveProvider = async (name: ProviderName) => {
  saving[name] = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (api.service('settings/ai') as any).patch(name, settings[name])
    $q.notify({ type: 'positive', message: `${name} salvo com sucesso` })
  } catch {
    $q.notify({ type: 'negative', message: `Erro ao salvar ${name}` })
  } finally {
    saving[name] = false
  }
}

const setDefaultProvider = async (provider: ProviderName) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (api.service('settings/ai/default') as any).create({ provider })
    $q.notify({ type: 'positive', message: 'Provider padrao atualizado' })
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao definir provider padrao' })
  }
}

const saveGlobalSettings = async () => {
  savingGlobal.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (api.service('settings/ai/global') as any).patch(null, globalSettings)
    $q.notify({ type: 'positive', message: 'Configuracoes globais salvas com sucesso' })
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao salvar configuracoes globais' })
  } finally {
    savingGlobal.value = false
  }
}

// ==================== PRICING ====================

interface ModelPricing {
  inputPricePerMillion: number
  outputPricePerMillion: number
  imagePricePerUnit?: number
  videoPricePerSecond?: number
}

interface PricingSettings {
  currency: string
  lastUpdated?: string
  models: Record<string, Record<string, ModelPricing>>
}

const loadingPricing = ref(true)
const resettingPricing = ref(false)
const savingPricing = reactive<Record<ProviderName, boolean>>({
  openai: false, google: false, ollama: false, anthropic: false, groq: false
})

const pricing = reactive<PricingSettings>({
  currency: 'USD',
  models: {}
})

const getPricingCaption = (name: ProviderName) => {
  const models = pricing.models[name]
  if (!models) return 'Nenhum modelo'
  const count = Object.keys(models).length
  return `${count} modelo${count !== 1 ? 's' : ''} configurado${count !== 1 ? 's' : ''}`
}

const fetchPricing = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (api.service('settings/ai/pricing') as any).find()
    if (result) {
      pricing.currency = result.currency || 'USD'
      pricing.lastUpdated = result.lastUpdated
      pricing.models = result.models || {}
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao carregar precos' })
  } finally {
    loadingPricing.value = false
  }
}

const savePricing = async (provider: ProviderName) => {
  savingPricing[provider] = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (api.service('settings/ai/pricing') as any).patch(provider, pricing.models[provider])
    $q.notify({ type: 'positive', message: `Precos de ${provider} salvos` })
  } catch {
    $q.notify({ type: 'negative', message: `Erro ao salvar precos de ${provider}` })
  } finally {
    savingPricing[provider] = false
  }
}

const resetPricing = async () => {
  resettingPricing.value = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (api.service('settings/ai/pricing') as any).create({ action: 'reset' })
    pricing.models = result.models || {}
    $q.notify({ type: 'positive', message: 'Precos restaurados para padrao' })
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao restaurar precos' })
  } finally {
    resettingPricing.value = false
  }
}

onMounted(() => {
  void fetchSettings()
  void fetchPricing()
})
</script>

