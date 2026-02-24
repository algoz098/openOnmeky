<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <q-btn flat round icon="arrow_back" @click="router.back()" class="q-mr-md" />
      <div class="col">
        <h4 class="q-ma-none">{{ isEdit ? 'Editar Marca' : 'Nova Marca' }}</h4>
        <p class="text-grey-7 q-ma-none">{{ isEdit ? 'Atualize os dados da marca' : 'Configure sua nova marca' }}</p>
      </div>
    </div>

    <q-form @submit="handleSubmit" class="q-gutter-md" ref="formRef">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">Informacoes Basicas</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.name" label="Nome da Marca *" outlined :rules="[v => !!v || 'Nome obrigatorio']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.sector" label="Setor" outlined placeholder="Ex: Tecnologia, Moda, Alimentacao" />
            </div>
            <div class="col-12">
              <q-input v-model="form.description" label="Descricao" outlined type="textarea" rows="3" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">Tom de Voz e Comunicacao</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-select v-model="form.toneOfVoice" :options="toneOptions" label="Tom de Voz" outlined emit-value map-options />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.targetAudience" label="Publico-Alvo" outlined placeholder="Ex: Jovens 18-35 anos" />
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="form.values" :options="valueOptions" label="Valores da Marca" outlined multiple use-chips emit-value map-options />
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="form.preferredWords" label="Palavras Preferidas" outlined multiple use-chips use-input new-value-mode="add" />
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="form.avoidedWords" label="Palavras a Evitar" outlined multiple use-chips use-input new-value-mode="add" />
            </div>
            <div class="col-12 col-md-6">
              <q-select v-model="form.competitors" label="Concorrentes" outlined multiple use-chips use-input new-value-mode="add" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-h6 q-mb-md">Identidade Visual</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.logoUrl" label="URL do Logo" outlined placeholder="https://..." />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption q-mb-sm">Cores da Marca</div>
              <div class="row q-gutter-sm items-center">
                <div v-for="(color, idx) in form.brandColors" :key="idx" class="row items-center">
                  <q-input
                    :model-value="color"
                    @update:model-value="(val: string | number | null) => updateColor(idx, typeof val === 'string' ? val : null)"
                    outlined
                    dense
                    style="width: 120px"
                  >
                    <template v-slot:prepend>
                      <q-icon name="palette" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-color
                            :model-value="color"
                            @update:model-value="(val: string | number | null) => updateColor(idx, typeof val === 'string' ? val : null)"
                            format-model="hex"
                          />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                    <template v-slot:append>
                      <q-btn flat round dense icon="close" size="sm" @click="removeColor(idx)" />
                    </template>
                  </q-input>
                </div>
                <q-btn flat icon="add" label="Cor" @click="addColor" />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="text-h6">Configuracao de Agentes de IA</div>
            <q-space />
            <q-btn
              flat
              dense
              :icon="showAllAgents ? 'expand_less' : 'expand_more'"
              :label="showAllAgents ? 'Ocultar Detalhes' : 'Mostrar Todos'"
              @click="showAllAgents = !showAllAgents"
            />
          </div>
          <p class="text-grey-7 q-mt-none q-mb-md">Selecione um preset ou configure manualmente cada agente</p>

          <!-- Preset Selection -->
          <div class="row q-col-gutter-md q-mb-lg">
            <div
              v-for="preset in aiConfigPresets"
              :key="preset.type"
              class="col-12 col-md-4"
            >
              <q-card
                flat
                bordered
                :class="['preset-card cursor-pointer', { 'preset-selected': selectedPreset === preset.type }]"
                @click="applyPreset(preset)"
              >
                <q-card-section class="text-center q-py-md">
                  <q-icon :name="preset.icon" size="md" :color="selectedPreset === preset.type ? 'primary' : 'grey-6'" />
                  <div class="text-subtitle1 text-weight-medium q-mt-sm">{{ preset.label }}</div>
                  <div class="text-caption text-grey-7">{{ preset.description }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <template v-for="agent in aiAgents" :key="agent.key">
              <div
                v-if="showAllAgents || isPrimaryAgent(agent.key)"
                class="col-12 col-md-6"
              >
                <q-card flat bordered class="agent-card">
                  <q-card-section class="q-pb-sm">
                    <div class="row items-center q-mb-sm">
                      <q-icon :name="agent.icon" size="sm" color="primary" class="q-mr-sm" />
                      <div class="text-subtitle1 text-weight-medium">{{ agent.label }}</div>
                    </div>
                    <div class="text-caption text-grey-7 q-mb-md">{{ agent.description }}</div>

                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <AIProviderSelect
                          :model-value="getAgentProvider(agent.key)"
                          @update:model-value="(val: string) => setAgentProvider(agent.key, val as AIProviderName)"
                          :agent="agent"
                          dense
                        />
                      </div>
                      <div class="col-6">
                        <q-select
                          :model-value="getAgentModel(agent.key)"
                          @update:model-value="(val) => setAgentModel(agent.key, val)"
                          :options="getModelOptionsForAgent(agent.key)"
                          label="Modelo"
                          outlined
                          dense
                          emit-value
                          map-options
                          :disable="!getAgentProvider(agent.key)"
                          :loading="isAgentModelsLoading(agent.key)"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </template>
          </div>
        </q-card-section>
      </q-card>

      <div class="row justify-end q-gutter-sm">
        <q-btn flat label="Cancelar" @click="router.back()" />
        <q-btn type="submit" color="primary" :label="isEdit ? 'Salvar' : 'Criar Marca'" :loading="saving" />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBrands } from 'src/composables/use-brands'
import { useAIProviders, type AIModelInfo } from 'src/composables/use-ai-providers'
import { api } from 'src/api'
import type { Brand } from 'src/types'
import {
  AI_AGENTS,
  AI_CONFIG_PRESETS,
  type AgentType,
  type AIProviderName,
  type BrandAIConfig,
  type AIConfigPreset,
  type AIConfigPresetType
} from 'src/types'
import AIProviderSelect from 'src/components/AIProviderSelect.vue'

const router = useRouter()
const route = useRoute()
const brandsService = api.service('brands')
const { createBrand, updateBrand } = useBrands()
const { providers, fetchProviders, fetchModels, getModels, getModelsForAgent, isLoadingModels } = useAIProviders()

const brandId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEdit = computed(() => !!brandId.value)

// useGet reativo para buscar brand em edicao (feathers-pinia)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const brand$ = (brandsService as any).useGet(brandId, { immediate: false })

const saving = ref(false)
const formRef = ref()
const showAllAgents = ref(false)
const selectedPreset = ref<AIConfigPresetType | null>('balanced')

// Presets de configuracao de IA
const aiConfigPresets = AI_CONFIG_PRESETS

// Agentes de IA disponiveis
const aiAgents = AI_AGENTS

// Agentes primarios (mostrados por padrao)
const primaryAgents: AgentType[] = ['textCreation', 'imageGeneration', 'reasoning']

const isPrimaryAgent = (key: AgentType) => primaryAgents.includes(key)

// Aplicar preset de configuracao de IA
const applyPreset = (preset: AIConfigPreset) => {
  selectedPreset.value = preset.type
  // Copia profunda do config do preset
  Object.keys(preset.config).forEach((key) => {
    const agentKey = key as keyof BrandAIConfig
    const agentConfig = preset.config[agentKey]
    if (agentConfig && form.aiConfig[agentKey]) {
      form.aiConfig[agentKey] = { ...agentConfig }
    }
  })
}

// Form reativo
const form = reactive({
  name: '',
  description: '',
  sector: '',
  toneOfVoice: '',
  targetAudience: '',
  values: [] as string[],
  preferredWords: [] as string[],
  avoidedWords: [] as string[],
  competitors: [] as string[],
  brandColors: ['#3B82F6'] as string[],
  logoUrl: '',
  // Configuracao de IA padrao (Atualizado: Fevereiro 2026)
  aiConfig: {
    reasoning: { provider: 'openai', model: 'o3' },
    textCreation: { provider: 'openai', model: 'gpt-4o' },
    textAdaptation: { provider: 'openai', model: 'gpt-4o-mini' },
    analysis: { provider: 'openai', model: 'o4-mini' },
    imageGeneration: { provider: 'openai', model: 'dall-e-3' },
    textOverlay: { provider: 'google', model: 'gemini-2.0-flash-exp-image-generation' },
    videoGeneration: { provider: 'google', model: 'veo-3.0-generate-preview' },
    creativeDirection: { provider: 'openai', model: 'gpt-5.3-codex' },
    compliance: { provider: 'openai', model: 'o3' }
  } as BrandAIConfig
})

const toneOptions = [
  { label: 'Formal', value: 'formal' },
  { label: 'Casual', value: 'casual' },
  { label: 'Amigavel', value: 'amigavel' },
  { label: 'Tecnico', value: 'tecnico' },
  { label: 'Inspirador', value: 'inspirador' },
  { label: 'Humoristico', value: 'humoristico' }
]

const valueOptions = [
  { label: 'Inovacao', value: 'inovacao' },
  { label: 'Qualidade', value: 'qualidade' },
  { label: 'Sustentabilidade', value: 'sustentabilidade' },
  { label: 'Transparencia', value: 'transparencia' },
  { label: 'Acessibilidade', value: 'acessibilidade' },
  { label: 'Exclusividade', value: 'exclusividade' }
]

// Funcoes para cores
const addColor = () => form.brandColors.push('#000000')
const removeColor = (idx: number) => form.brandColors.splice(idx, 1)
const updateColor = (idx: number, val: string | null) => {
  if (val) {
    form.brandColors[idx] = val
  }
}

// Funcoes para agentes de IA
const getAgentConfig = (agentKey: AgentType) => {
  const existing = form.aiConfig[agentKey]
  if (existing) {
    return existing
  }
  const newConfig = { provider: 'openai' as AIProviderName, model: '' }
  form.aiConfig[agentKey] = newConfig
  return newConfig
}

const getAgentProvider = (agentKey: AgentType): AIProviderName | undefined => {
  return getAgentConfig(agentKey).provider
}

const setAgentProvider = async (agentKey: AgentType, provider: AIProviderName) => {
  const config = getAgentConfig(agentKey)
  config.provider = provider
  // Reset modelo ao trocar provedor
  config.model = ''
  // Limpa preset pois foi modificado manualmente
  selectedPreset.value = null

  // Buscar modelos do provider se ainda nao tiver em cache
  const cachedModels = getModels(provider)
  if (cachedModels.length === 0) {
    await fetchModels(provider)
  }

  // Definir primeiro modelo disponivel
  const models = getModelsForAgent(provider, agentKey)
  const firstModel = models[0]
  if (firstModel) {
    config.model = firstModel.id
  }
}

const getAgentModel = (agentKey: AgentType): string | undefined => {
  return getAgentConfig(agentKey).model
}

const setAgentModel = (agentKey: AgentType, model: string) => {
  getAgentConfig(agentKey).model = model
  // Limpa preset pois foi modificado manualmente
  selectedPreset.value = null
}

const getModelOptionsForAgent = (agentKey: AgentType) => {
  const provider = getAgentProvider(agentKey)
  if (!provider) return []

  const models = getModelsForAgent(provider, agentKey)
  return models.map((m: AIModelInfo) => ({ label: m.name, value: m.id }))
}

// Verificar se esta carregando modelos para um agente
const isAgentModelsLoading = (agentKey: AgentType): boolean => {
  const provider = getAgentProvider(agentKey)
  if (!provider) return false
  return isLoadingModels(provider)
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  saving.value = true
  try {
    if (isEdit.value) await updateBrand(brandId.value!, form)
    else await createBrand(form)
    await router.push('/brands')
  } finally { saving.value = false }
}

// Preencher formulario quando brand for carregada (feathers-pinia reactivo)
const populateFormFromBrand = async (brand: Brand) => {
  Object.assign(form, brand)
  // Garantir que aiConfig tem todos os agentes
  if (!form.aiConfig) {
    form.aiConfig = {}
  }
  for (const agent of aiAgents) {
    if (!form.aiConfig[agent.key]) {
      form.aiConfig[agent.key] = { provider: 'openai', model: '' }
    }
  }

  // Buscar modelos dos providers configurados
  const configuredProviders = new Set<AIProviderName>()
  for (const agent of aiAgents) {
    const config = form.aiConfig[agent.key]
    if (config?.provider) {
      configuredProviders.add(config.provider)
    }
  }
  await Promise.all(
    Array.from(configuredProviders).map(p => fetchModels(p))
  )
}

// Watch para quando brand$ carregar dados (useGet reativo)
watch(
  () => brand$.data,
  async (brand) => {
    if (brand && isEdit.value) {
      await populateFormFromBrand(brand as Brand)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  // Buscar providers disponiveis
  await fetchProviders()

  // Pre-carregar modelos dos providers mais comuns
  const commonProviders: AIProviderName[] = ['openai', 'anthropic', 'google']
  await Promise.all(
    commonProviders
      .filter(p => providers.value.some(prov => prov.name === p))
      .map(p => fetchModels(p))
  )

  // Disparar busca da brand se estiver em modo edicao
  if (isEdit.value && brandId.value) {
    brand$.get()
  }
})
</script>

<style scoped>
.agent-card {
  transition: all 0.2s ease;
}

.agent-card:hover {
  border-color: var(--q-primary);
}

.preset-card {
  transition: all 0.2s ease;
}

.preset-card:hover {
  border-color: var(--q-primary);
  background-color: rgba(var(--q-primary-rgb), 0.05);
}

.preset-selected {
  border-color: var(--q-primary);
  border-width: 2px;
  background-color: rgba(var(--q-primary-rgb), 0.08);
}
</style>
