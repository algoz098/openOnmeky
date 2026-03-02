<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps<{
  audioUrl: string
  format?: string
  durationSeconds?: number
  prompt?: string
}>()

const emit = defineEmits<{
  regenerate: []
}>()

const audio = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(props.durationSeconds || 30)

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  if (!audio.value) return

  if (isPlaying.value) {
    audio.value.pause()
  } else {
    audio.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const onTimeUpdate = () => {
  if (audio.value) {
    currentTime.value = audio.value.currentTime
  }
}

const onLoadedMetadata = () => {
  if (audio.value && audio.value.duration) {
    duration.value = audio.value.duration
  }
}

const onEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
}

const seek = (event: MouseEvent) => {
  if (!audio.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  audio.value.currentTime = percent * duration.value
}

const downloadAudio = () => {
  const link = document.createElement('a')
  link.href = props.audioUrl
  link.download = `music-${Date.now()}.${props.format || 'wav'}`
  link.click()
}

onUnmounted(() => {
  if (audio.value) {
    audio.value.pause()
  }
})
</script>

<template>
  <q-card flat bordered class="audio-player">
    <audio
      ref="audio"
      :src="audioUrl"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    />

    <q-card-section class="q-pa-sm">
      <div class="row items-center q-gutter-sm">
        <!-- Play/Pause Button -->
        <q-btn
          round
          flat
          :icon="isPlaying ? 'pause' : 'play_arrow'"
          color="primary"
          @click="togglePlay"
        />

        <!-- Progress Bar -->
        <div class="col progress-container" @click="seek">
          <q-linear-progress
            :value="progress / 100"
            color="primary"
            track-color="grey-4"
            rounded
            class="cursor-pointer"
          />
        </div>

        <!-- Time Display -->
        <div class="text-caption text-grey-7 q-mx-sm time-display">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>

        <!-- Actions -->
        <q-btn flat round dense icon="refresh" @click="emit('regenerate')">
          <q-tooltip>Gerar nova trilha</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="download" @click="downloadAudio">
          <q-tooltip>Baixar audio</q-tooltip>
        </q-btn>
      </div>

      <!-- Prompt info -->
      <div v-if="prompt" class="text-caption text-grey-6 q-mt-sm ellipsis-2-lines">
        <q-icon name="music_note" size="xs" class="q-mr-xs" />
        {{ prompt }}
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.audio-player {
  max-width: 500px;
}
.progress-container {
  min-width: 150px;
}
.time-display {
  min-width: 70px;
  text-align: center;
}
</style>

