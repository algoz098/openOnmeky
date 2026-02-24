<template>
  <q-card-section class="text-center q-pa-lg">
    <q-icon name="rocket_launch" size="80px" color="primary" class="q-mb-md" />
    <div class="text-h5 text-weight-bold q-mb-sm">Bem-vindo ao OpenOnmeky</div>
    <div class="text-body1 text-grey-7 q-mb-lg">
      Sua plataforma open-source para gerenciamento de redes sociais com IA.
    </div>
    <div class="features-list text-left q-mb-lg">
      <div class="feature-item q-mb-sm">
        <q-icon name="auto_awesome" color="primary" size="sm" class="q-mr-sm" />
        <span>Geracao de conteudo com Inteligencia Artificial</span>
      </div>
      <div class="feature-item q-mb-sm">
        <q-icon name="schedule" color="primary" size="sm" class="q-mr-sm" />
        <span>Agendamento de publicacoes</span>
      </div>
      <div class="feature-item q-mb-sm">
        <q-icon name="analytics" color="primary" size="sm" class="q-mr-sm" />
        <span>Analise de metricas e desempenho</span>
      </div>
      <div class="feature-item">
        <q-icon name="groups" color="primary" size="sm" class="q-mr-sm" />
        <span>Gerenciamento de multiplas marcas</span>
      </div>
    </div>
  </q-card-section>
  <q-card-actions class="q-pa-lg q-pt-none">
    <q-btn color="primary" class="full-width" size="lg" label="Comecar Configuracao" @click="$emit('next')" />
  </q-card-actions>
</template>

<script setup lang="ts">
defineEmits<{
  next: []
}>()
</script>

<style scoped>
.features-list {
  max-width: 320px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
}
</style>

