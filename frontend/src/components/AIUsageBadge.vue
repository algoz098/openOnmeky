<template>
  <q-chip
    v-if="usage"
    dense
    outline
    color="primary"
    icon="attach_money"
    class="cursor-pointer"
  >
    <template v-if="usage.costUsd !== undefined">
      <span class="text-weight-bold">${{ formatCost(usage.costUsd) }}</span>
      <span class="q-ml-xs text-grey-6">({{ formatTokens(usage.totalTokens) }} tokens)</span>
      <span v-if="executionCount && executionCount > 1" class="q-ml-xs text-grey-6">
        [{{ executionCount }}x]
      </span>
    </template>
    <template v-else>
      {{ formatTokens(usage.totalTokens) }} tokens
      <span v-if="executionCount && executionCount > 1" class="q-ml-xs">[{{ executionCount }}x]</span>
    </template>

    <q-tooltip anchor="bottom middle" self="top middle" :offset="[0, 8]" max-width="350px">
      <div class="text-body2" style="min-width: 200px">
        <div class="text-weight-bold q-mb-sm">
          Detalhes de Uso
          <span v-if="executionCount && executionCount > 1" class="text-grey-5 text-weight-regular">
            ({{ executionCount }} execucoes)
          </span>
        </div>

        <table class="usage-table">
          <tr>
            <td class="text-grey-4">Input tokens:</td>
            <td class="text-right">{{ formatTokens(usage.promptTokens) }}</td>
          </tr>
          <tr>
            <td class="text-grey-4">Output tokens:</td>
            <td class="text-right">{{ formatTokens(usage.completionTokens) }}</td>
          </tr>
          <tr class="text-weight-medium">
            <td>Total tokens:</td>
            <td class="text-right">{{ formatTokens(usage.totalTokens) }}</td>
          </tr>
        </table>

        <q-separator dark class="q-my-sm" />

        <table v-if="usage.costBreakdown" class="usage-table">
          <tr>
            <td class="text-grey-4">Custo input:</td>
            <td class="text-right">${{ formatCost(usage.costBreakdown.inputCost) }}</td>
          </tr>
          <tr>
            <td class="text-grey-4">Custo output:</td>
            <td class="text-right">${{ formatCost(usage.costBreakdown.outputCost) }}</td>
          </tr>
          <tr v-if="usage.costBreakdown.imageCost > 0">
            <td class="text-grey-4">Custo imagens:</td>
            <td class="text-right">${{ formatCost(usage.costBreakdown.imageCost) }}</td>
          </tr>
          <tr v-if="usage.costBreakdown.videoCost > 0">
            <td class="text-grey-4">Custo video:</td>
            <td class="text-right">${{ formatCost(usage.costBreakdown.videoCost) }}</td>
          </tr>
          <tr class="text-weight-medium text-positive">
            <td>Custo total:</td>
            <td class="text-right">${{ formatCost(usage.costUsd || 0) }}</td>
          </tr>
        </table>

        <div v-else-if="usage.costUsd !== undefined" class="text-positive text-weight-medium">
          Custo total: ${{ formatCost(usage.costUsd) }}
        </div>

        <!-- Breakdown por agente (para carousels) -->
        <template v-if="usage.agentBreakdown && usage.agentBreakdown.length > 0">
          <q-separator dark class="q-my-sm" />
          <div class="text-weight-bold q-mb-xs text-caption">Por Agente:</div>
          <div
            v-for="(agent, idx) in usage.agentBreakdown"
            :key="idx"
            class="agent-row text-caption q-mb-xs"
          >
            <div class="row justify-between">
              <span class="text-grey-4">{{ formatAgentType(agent.agentType) }}</span>
              <span>${{ formatCost(agent.costUsd) }}</span>
            </div>
            <div class="text-grey-6 text-caption">
              {{ agent.provider }}/{{ truncateModel(agent.model) }}
              <span class="q-ml-xs">{{ formatTokens(agent.totalTokens) }} tokens</span>
              <span v-if="agent.imagesGenerated" class="q-ml-xs">{{ agent.imagesGenerated }} img</span>
            </div>
          </div>
        </template>

        <div v-if="provider || model" class="q-mt-sm text-caption text-grey-5">
          {{ provider }}{{ model ? ` / ${model}` : '' }}
        </div>
      </div>
    </q-tooltip>
  </q-chip>
</template>

<script setup lang="ts">
import type { AIUsageInfo } from 'src/types'

defineProps<{
  usage?: AIUsageInfo | undefined
  provider?: string | undefined
  model?: string | undefined
  executionCount?: number | undefined
}>()

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return tokens.toString()
}

const formatCost = (cost: number): string => {
  if (cost < 0.0001) return '0.0000'
  if (cost < 0.01) return cost.toFixed(4)
  if (cost < 1) return cost.toFixed(3)
  return cost.toFixed(2)
}

const formatAgentType = (agentType: string): string => {
  const labels: Record<string, string> = {
    creativeDirection: 'Direcao Criativa',
    analysis: 'Analise',
    textCreation: 'Criacao de Texto',
    imageGeneration: 'Geracao de Imagem',
    textOverlay: 'Overlay de Texto',
    compliance: 'Validacao'
  }
  return labels[agentType] || agentType
}

const truncateModel = (model: string): string => {
  if (model.length > 20) return model.substring(0, 17) + '...'
  return model
}
</script>

<style scoped>
.usage-table {
  width: 100%;
  border-collapse: collapse;
}
.usage-table td {
  padding: 2px 0;
}
.usage-table td:first-child {
  padding-right: 16px;
}
</style>

