<template>
  <q-card-section class="text-center">
    <q-icon name="business" size="48px" color="primary" class="q-mb-sm" />
    <div class="text-h6 text-weight-bold">Criar Primeira Marca</div>
    <div class="text-body2 text-grey-7">Configure sua marca para comecar a criar conteudo</div>
  </q-card-section>
  <q-card-section>
    <q-form @submit="handleSubmit" class="q-gutter-md">
      <q-input
        v-model="form.name"
        label="Nome da Marca"
        outlined
        :rules="[(v) => !!v || 'Nome obrigatorio']"
      >
        <template v-slot:prepend>
          <q-icon name="business" />
        </template>
      </q-input>

      <q-select
        v-model="form.sector"
        label="Setor de Atuacao"
        outlined
        :options="sectors"
        emit-value
        map-options
        clearable
      >
        <template v-slot:prepend>
          <q-icon name="category" />
        </template>
      </q-select>

      <q-select
        v-model="form.toneOfVoice"
        label="Tom de Voz"
        outlined
        :options="tones"
        emit-value
        map-options
        clearable
      >
        <template v-slot:prepend>
          <q-icon name="record_voice_over" />
        </template>
      </q-select>

      <q-input v-model="form.targetAudience" label="Publico-Alvo (opcional)" outlined>
        <template v-slot:prepend>
          <q-icon name="groups" />
        </template>
      </q-input>

      <div class="text-subtitle2 q-mt-md q-mb-sm">Preset de IA</div>
      <div class="presets-grid">
        <q-card
          v-for="preset in presets"
          :key="preset.value"
          flat
          bordered
          :class="['preset-card', { 'selected': form.aiConfigPreset === preset.value }]"
          @click="form.aiConfigPreset = preset.value"
        >
          <q-card-section class="text-center q-pa-sm">
            <q-icon :name="preset.icon" size="24px" :color="form.aiConfigPreset === preset.value ? 'primary' : 'grey-7'" />
            <div class="text-subtitle2">{{ preset.label }}</div>
            <div class="text-caption text-grey-6">{{ preset.description }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="row q-gutter-sm q-mt-md">
        <q-btn flat color="grey-7" label="Voltar" @click="$emit('back')" class="col" />
        <q-btn flat color="grey-7" label="Pular" @click="handleSkip" class="col" />
        <q-btn type="submit" color="primary" class="col" size="lg" label="Continuar" />
      </div>
    </q-form>
  </q-card-section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { BrandData } from './types'

const emit = defineEmits<{
  next: [data: BrandData | undefined]
  back: []
}>()

const form = reactive<BrandData>({
  name: '',
  sector: undefined,
  toneOfVoice: undefined,
  targetAudience: undefined,
  aiConfigPreset: 'balanced'
})

const sectors = [
  { label: 'Tecnologia', value: 'tecnologia' },
  { label: 'Varejo', value: 'varejo' },
  { label: 'Servicos', value: 'servicos' },
  { label: 'Saude', value: 'saude' },
  { label: 'Educacao', value: 'educacao' },
  { label: 'Financeiro', value: 'financeiro' },
  { label: 'Alimenticio', value: 'alimenticio' },
  { label: 'Moda', value: 'moda' },
  { label: 'Entretenimento', value: 'entretenimento' },
  { label: 'Outro', value: 'outro' }
]

const tones = [
  { label: 'Formal', value: 'formal' },
  { label: 'Casual', value: 'casual' },
  { label: 'Humoristico', value: 'humoristico' },
  { label: 'Inspirador', value: 'inspirador' },
  { label: 'Tecnico', value: 'tecnico' },
  { label: 'Amigavel', value: 'amigavel' }
]

const presets = [
  { value: 'quality' as const, label: 'Qualidade', icon: 'workspace_premium', description: 'Melhores modelos' },
  { value: 'balanced' as const, label: 'Equilibrado', icon: 'balance', description: 'Custo-beneficio' },
  { value: 'budget' as const, label: 'Economico', icon: 'savings', description: 'Menor custo' }
]

const handleSubmit = () => {
  if (!form.name) return
  emit('next', { ...form })
}

const handleSkip = () => {
  emit('next', undefined)
}
</script>

<style scoped>
.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-card {
  cursor: pointer;
  transition: all 0.2s;
}

.preset-card:hover {
  border-color: var(--q-primary);
}

.preset-card.selected {
  border-color: var(--q-primary);
  background-color: rgba(var(--q-primary-rgb), 0.05);
}
</style>

