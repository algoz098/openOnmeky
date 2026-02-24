<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="schedule" color="primary" class="q-mr-sm" />
          Agendar Post
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section v-if="post">
        <!-- Preview do post -->
        <q-card flat bordered class="bg-grey-1 q-mb-md">
          <q-card-section class="q-pa-sm">
            <div class="row items-center q-mb-xs">
              <q-icon
                :name="getPlatformIcon(post.platform)"
                :color="getPlatformColor(post.platform)"
                size="20px"
                class="q-mr-sm"
              />
              <span class="text-weight-medium">{{ post.platform }}</span>
              <q-chip
                :color="getStatusColor(post.status)"
                text-color="white"
                dense
                size="sm"
                class="q-ml-sm"
              >
                {{ getStatusLabel(post.status) }}
              </q-chip>
            </div>
            <div class="text-body2 text-grey-8" style="max-height: 60px; overflow: hidden;">
              {{ post.content.substring(0, 150) }}{{ post.content.length > 150 ? '...' : '' }}
            </div>
          </q-card-section>
        </q-card>

        <!-- Seletor de Data -->
        <div class="text-subtitle2 q-mb-sm">Data de Publicacao</div>
        <q-input
          v-model="scheduledDate"
          outlined
          dense
          readonly
          class="q-mb-md"
        >
          <template #prepend>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="scheduledDate"
                  mask="YYYY-MM-DD"
                  :options="dateOptions"
                >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Fechar" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
          <template #append>
            <q-icon name="arrow_drop_down" class="cursor-pointer" />
          </template>
        </q-input>

        <!-- Seletor de Hora -->
        <div class="text-subtitle2 q-mb-sm">Horario</div>
        <q-input
          v-model="scheduledTime"
          outlined
          dense
          readonly
          class="q-mb-md"
        >
          <template #prepend>
            <q-icon name="access_time" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-time
                  v-model="scheduledTime"
                  mask="HH:mm"
                  format24h
                >
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Fechar" color="primary" flat />
                  </div>
                </q-time>
              </q-popup-proxy>
            </q-icon>
          </template>
          <template #append>
            <q-icon name="arrow_drop_down" class="cursor-pointer" />
          </template>
        </q-input>

        <!-- Sugestoes de horarios -->
        <div class="text-caption text-grey-7 q-mb-sm">Sugestoes rapidas:</div>
        <div class="row q-gutter-sm q-mb-md">
          <q-btn
            v-for="suggestion in timeSuggestions"
            :key="suggestion.label"
            outline
            dense
            size="sm"
            :label="suggestion.label"
            @click="applySuggestion(suggestion)"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn
          color="primary"
          icon="schedule"
          label="Agendar"
          :loading="loading"
          :disable="!canSchedule"
          @click="handleSchedule"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { usePosts } from 'src/composables/use-posts'
import type { Post, PostStatus } from 'src/types'

interface TimeSuggestion {
  label: string
  date: Date
}

const props = defineProps<{
  modelValue: boolean
  post: Post | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'scheduled': [post: Post]
}>()

const $q = useQuasar()
const { schedulePost } = usePosts()

const loading = ref(false)
const scheduledDate = ref('')
const scheduledTime = ref('09:00')

// Sugestoes de horarios
const timeSuggestions = computed<TimeSuggestion[]>(() => {
  const now = new Date()
  const suggestions: TimeSuggestion[] = []

  // Em 1 hora
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
  suggestions.push({ label: 'Em 1 hora', date: inOneHour })

  // Amanha as 9h
  const tomorrow9am = new Date(now)
  tomorrow9am.setDate(tomorrow9am.getDate() + 1)
  tomorrow9am.setHours(9, 0, 0, 0)
  suggestions.push({ label: 'Amanha 9h', date: tomorrow9am })

  // Amanha as 12h
  const tomorrow12pm = new Date(now)
  tomorrow12pm.setDate(tomorrow12pm.getDate() + 1)
  tomorrow12pm.setHours(12, 0, 0, 0)
  suggestions.push({ label: 'Amanha 12h', date: tomorrow12pm })

  // Amanha as 18h
  const tomorrow6pm = new Date(now)
  tomorrow6pm.setDate(tomorrow6pm.getDate() + 1)
  tomorrow6pm.setHours(18, 0, 0, 0)
  suggestions.push({ label: 'Amanha 18h', date: tomorrow6pm })

  return suggestions
})

// Verificar se pode agendar
const canSchedule = computed(() => {
  if (!scheduledDate.value || !scheduledTime.value) return false
  const scheduledDateTime = new Date(`${scheduledDate.value}T${scheduledTime.value}:00`)
  return scheduledDateTime > new Date()
})

// Opcoes de data (apenas datas futuras)
function dateOptions(date: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const selectedDate = new Date(date)
  return selectedDate >= today
}

// Funcoes auxiliares
function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    instagram: 'photo_camera',
    facebook: 'facebook',
    twitter: 'tag',
    linkedin: 'work',
    tiktok: 'music_video',
    threads: 'chat',
    youtube: 'play_circle'
  }
  return icons[platform.toLowerCase()] || 'public'
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: 'pink',
    facebook: 'blue',
    twitter: 'light-blue',
    linkedin: 'indigo',
    tiktok: 'black'
  }
  return colors[platform.toLowerCase()] || 'grey'
}

function getStatusColor(status: PostStatus): string {
  const colors: Record<PostStatus, string> = {
    draft: 'grey',
    approved: 'warning',
    scheduled: 'info',
    published: 'positive',
    failed: 'negative'
  }
  return colors[status] || 'grey'
}

function getStatusLabel(status: PostStatus): string {
  const labels: Record<PostStatus, string> = {
    draft: 'Rascunho',
    approved: 'Aprovado',
    scheduled: 'Agendado',
    published: 'Publicado',
    failed: 'Falhou'
  }
  return labels[status] || status
}

function applySuggestion(suggestion: TimeSuggestion): void {
  const date = suggestion.date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  scheduledDate.value = `${year}-${month}-${day}`
  scheduledTime.value = `${hours}:${minutes}`
}

function close(): void {
  emit('update:modelValue', false)
}

async function handleSchedule(): Promise<void> {
  if (!props.post || !canSchedule.value) return

  loading.value = true
  try {
    const scheduledAt = `${scheduledDate.value}T${scheduledTime.value}:00.000Z`
    const updated = await schedulePost(props.post.id, scheduledAt)
    $q.notify({
      type: 'positive',
      message: 'Post agendado com sucesso!',
      icon: 'schedule'
    })
    emit('scheduled', updated)
    close()
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao agendar post',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Inicializar com valores do post ou data atual
watch(() => props.post, (newPost) => {
  if (newPost?.scheduledAt) {
    const date = new Date(newPost.scheduledAt)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    scheduledDate.value = `${year}-${month}-${day}`
    scheduledTime.value = `${hours}:${minutes}`
  } else {
    // Default para amanha as 9h
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    scheduledDate.value = `${year}-${month}-${day}`
    scheduledTime.value = '09:00'
  }
}, { immediate: true })
</script>

