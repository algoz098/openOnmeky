<template>
  <div class="carousel-slide-preview" :style="containerStyle">
    <q-img
      v-if="imageUrl"
      :src="fullImageUrl"
      fit="cover"
      :style="imageStyle"
      class="full-width"
    />
    <div
      v-else
      class="slide-text-only flex flex-center full-width"
      :style="{ height: maxHeight + 'px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }"
    >
      <div class="text-white text-center q-pa-md">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { host } from 'src/api'
import type { AspectRatio } from 'src/types'

interface Props {
  imageUrl?: string | undefined
  text?: string | undefined
  aspectRatio: AspectRatio
  maxHeight: number
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: undefined,
  text: undefined
})

// Converte URL relativa para absoluta
const fullImageUrl = computed(() => {
  if (!props.imageUrl) return ''
  if (props.imageUrl.startsWith('http')) return props.imageUrl
  return `${host}${props.imageUrl}`
})

// Calcula altura baseada no aspect ratio e maxHeight
const calculatedHeight = computed(() => {
  // Para ratio vertical (9:16), a altura e maior que a largura
  // Para ratio horizontal (16:9), a altura e menor que a largura
  // Usamos maxHeight como referencia
  return props.maxHeight
})

// Estilo do container
const containerStyle = computed(() => ({
  width: '100%',
  height: calculatedHeight.value + 'px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
}))

// Estilo da imagem
const imageStyle = computed(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const
}))
</script>

<style scoped>
.carousel-slide-preview {
  width: 100%;
  height: 100%;
}

.slide-text-only {
  font-size: 16px;
  font-weight: 500;
}
</style>

