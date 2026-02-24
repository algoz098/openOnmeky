<template>
  <q-card-section class="text-center q-pa-xl">
    <q-icon name="check_circle" size="80px" color="positive" class="q-mb-md" />
    <div class="text-h5 text-weight-bold q-mb-sm">Configuracao Concluida!</div>
    <div class="text-body1 text-grey-7 q-mb-lg">Seu sistema esta pronto para uso.</div>

    <div class="setup-summary text-left q-pa-md bg-grey-2 rounded-borders q-mb-lg">
      <div class="text-subtitle2 text-weight-bold q-mb-sm">Resumo:</div>
      <div class="q-mb-xs">
        <q-icon name="check" color="positive" size="xs" class="q-mr-xs" />
        Super administrador criado
      </div>
      <div class="q-mb-xs">
        <q-icon name="check" color="positive" size="xs" class="q-mr-xs" />
        Plataformas padrao configuradas
      </div>
      <div v-if="result?.aiProvidersConfigured" class="q-mb-xs">
        <q-icon name="check" color="positive" size="xs" class="q-mr-xs" />
        {{ result.aiProvidersConfigured }} provider(s) de IA configurado(s)
      </div>
      <div v-else class="q-mb-xs">
        <q-icon name="info" color="grey" size="xs" class="q-mr-xs" />
        <span class="text-grey-7">Provider de IA: configurar depois em Configuracoes</span>
      </div>
      <div v-if="result?.brandCreated" class="q-mb-xs">
        <q-icon name="check" color="positive" size="xs" class="q-mr-xs" />
        Marca "{{ result.brandCreated.name }}" criada
      </div>
      <div v-else class="q-mb-xs">
        <q-icon name="info" color="grey" size="xs" class="q-mr-xs" />
        <span class="text-grey-7">Marca: criar depois em Marcas</span>
      </div>
    </div>

    <div class="next-steps q-mb-lg">
      <div class="text-subtitle2 text-weight-bold q-mb-sm">Proximos Passos:</div>
      <q-list dense>
        <q-item v-if="result?.brandCreated" clickable @click="$emit('action', 'create-post')">
          <q-item-section avatar>
            <q-icon name="add_circle" color="primary" />
          </q-item-section>
          <q-item-section>Criar seu primeiro post</q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
        <q-item v-if="!result?.aiProvidersConfigured" clickable @click="$emit('action', 'settings')">
          <q-item-section avatar>
            <q-icon name="settings" color="primary" />
          </q-item-section>
          <q-item-section>Configurar providers de IA</q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
        <q-item v-if="!result?.brandCreated" clickable @click="$emit('action', 'create-brand')">
          <q-item-section avatar>
            <q-icon name="business" color="primary" />
          </q-item-section>
          <q-item-section>Criar sua primeira marca</q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-btn
      color="primary"
      size="lg"
      label="Acessar o Sistema"
      icon-right="arrow_forward"
      :loading="loading"
      @click="$emit('finish')"
    />
  </q-card-section>
</template>

<script setup lang="ts">
import type { OnboardingResultData } from './types'

defineProps<{
  result?: OnboardingResultData | undefined
  loading?: boolean | undefined
}>()

defineEmits<{
  finish: []
  action: [action: 'create-post' | 'settings' | 'create-brand']
}>()
</script>

<style scoped>
.setup-summary {
  max-width: 320px;
  margin: 0 auto;
}

.next-steps {
  max-width: 320px;
  margin: 0 auto;
}
</style>

