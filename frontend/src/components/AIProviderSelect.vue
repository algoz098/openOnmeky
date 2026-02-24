<template>
  <q-select
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :options="filteredOptions"
    :label="label"
    outlined
    :dense="dense"
    emit-value
    map-options
    :loading="loading"
    :disable="disable"
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label caption v-if="!scope.opt.available" class="text-warning">
            Indisponivel
          </q-item-label>
        </q-item-section>
        <q-item-section side v-if="scope.opt.available">
          <q-icon name="check_circle" color="positive" size="xs" />
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAIProviders } from 'src/composables/use-ai-providers'
import { PROVIDER_CAPABILITIES } from 'src/types'
import type { AgentMetadata, AIProviderName } from 'src/types'

interface ProviderOption {
  label: string
  value: string
  available: boolean
}

const props = withDefaults(defineProps<{
  modelValue: string | undefined
  label?: string
  dense?: boolean
  disable?: boolean
  agent?: AgentMetadata
}>(), {
  label: 'Provedor',
  dense: false,
  disable: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const { providers, loadingProviders } = useAIProviders()

const loading = computed(() => loadingProviders.value)

const getProviderLabel = (name: string): string => {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    google: 'Google',
    anthropic: 'Anthropic',
    groq: 'Groq',
    ollama: 'Ollama (Local)'
  }
  return labels[name] || name
}

const providerOptions = computed<ProviderOption[]>(() => {
  return providers.value.map(p => ({
    label: getProviderLabel(p.name),
    value: p.name,
    available: p.enabled
  }))
})

const filteredOptions = computed(() => {
  if (!props.agent) {
    return providerOptions.value
  }

  return providerOptions.value.filter(p => {
    const caps = PROVIDER_CAPABILITIES[p.value as AIProviderName] || { text: true, image: false, video: false }
    if (props.agent?.supportsImage) {
      return caps.image
    }
    if (props.agent?.supportsVideo) {
      return caps.video
    }
    return caps.text
  })
})
</script>

