<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">Calendario de Posts</h4>
        <p class="text-grey-7 q-ma-none">Visualize e gerencie seus posts agendados - arraste posts para agendar</p>
      </div>
      <div class="col-auto q-gutter-sm">
        <q-btn outline color="primary" icon="today" label="Hoje" @click="goToToday" />
        <q-btn color="primary" icon="add" label="Novo Post" to="/posts/create" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Painel lateral: Posts nao agendados -->
      <div class="col-12 col-md-3">
        <q-card flat bordered class="unscheduled-panel">
          <q-card-section class="q-pb-sm">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon name="schedule" class="q-mr-sm" />
              Posts Nao Agendados
            </div>
            <div class="text-caption text-grey-6">
              Arraste para o calendario
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-sm unscheduled-list">
            <div v-if="loadingUnscheduled" class="text-center q-pa-md">
              <q-spinner size="24px" color="primary" />
            </div>
            <div v-else-if="unscheduledPosts.length === 0" class="text-center q-pa-md text-grey-6">
              <q-icon name="check_circle" size="32px" class="q-mb-sm" />
              <div class="text-caption">Todos os posts estao agendados</div>
            </div>
            <div
              v-for="post in unscheduledPosts"
              v-else
              :key="post.id"
              class="unscheduled-post-item q-mb-sm"
              draggable="true"
              @dragstart="onDragStart($event, post)"
              @dragend="onDragEnd"
            >
              <q-chip
                :color="getStatusColor(post.status)"
                text-color="white"
                dense
                class="full-width cursor-grab"
                size="sm"
              >
                <q-icon
                  :name="getPlatformIcon(post.platform)"
                  size="14px"
                  class="q-mr-xs"
                />
                <span class="ellipsis" style="max-width: 120px;">
                  {{ getPostPreview(post) }}
                </span>
              </q-chip>
              <q-tooltip>
                <div class="text-bold">{{ post.platform }} - {{ getStatusLabel(post.status) }}</div>
                <div>{{ post.content.substring(0, 150) }}...</div>
              </q-tooltip>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Coluna principal: Calendario -->
      <div class="col-12 col-md-9">
        <!-- Navegacao do Calendario -->
        <div class="row items-center q-mb-md">
          <q-btn flat round icon="chevron_left" @click="prevMonth" />
          <div class="text-h6 q-mx-md" style="min-width: 200px; text-align: center;">
            {{ currentMonthLabel }}
          </div>
          <q-btn flat round icon="chevron_right" @click="nextMonth" />
          <q-space />
          <q-select
            v-model="selectedPlatform"
            :options="platformOptions"
            label="Plataforma"
            outlined
            dense
            clearable
            style="min-width: 150px"
            @update:model-value="handleFilterChange"
          />
          <q-select
            v-model="selectedStatus"
            :options="statusOptions"
            label="Status"
            outlined
            dense
            clearable
            class="q-ml-sm"
            style="min-width: 150px"
            @update:model-value="handleFilterChange"
          />
        </div>

        <!-- Calendario -->
        <q-card flat bordered>
          <q-calendar-month
            ref="calendarRef"
            v-model="selectedDate"
            :weekdays="[0, 1, 2, 3, 4, 5, 6]"
            locale="pt-BR"
            animated
            bordered
            :day-min-height="100"
            @change="onCalendarChange"
          >
            <template #day="{ scope: { timestamp } }">
              <div
                class="calendar-day-content"
                :class="{
                  'drop-target': draggedPost && isValidDropTarget(timestamp.date),
                  'drop-target-invalid': draggedPost && !isValidDropTarget(timestamp.date)
                }"
                @dragover.prevent
                @dragenter.prevent="onDragEnter"
                @dragleave="onDragLeave"
                @drop="onDrop($event, timestamp.date)"
              >
                <template v-for="post in getPostsForDay(timestamp.date)" :key="post.id">
                  <q-chip
                    :color="getStatusColor(post.status)"
                    text-color="white"
                    dense
                    clickable
                    class="calendar-post-chip q-ma-xs"
                    :class="{ 'cursor-grab': canDragPost(post), 'dragging': draggedPost?.id === post.id }"
                    size="sm"
                    :draggable="canDragPost(post)"
                    @click="openPost(post)"
                    @dragstart="onDragStart($event, post)"
                    @dragend="onDragEnd"
                  >
                    <q-icon
                      :name="getPlatformIcon(post.platform)"
                      size="14px"
                      class="q-mr-xs"
                    />
                    <span class="ellipsis" style="max-width: 80px;">
                      {{ getPostPreview(post) }}
                    </span>
                    <q-tooltip>
                      <div class="text-bold">{{ post.platform }}</div>
                      <div>{{ post.content.substring(0, 100) }}...</div>
                      <div class="text-caption">
                        {{ formatTime(post.scheduledAt) }}
                      </div>
                      <div v-if="canDragPost(post)" class="text-caption text-info">
                        Arraste para reagendar
                      </div>
                    </q-tooltip>
                  </q-chip>
                </template>
              </div>
            </template>
          </q-calendar-month>
        </q-card>
      </div>
    </div>

    <!-- Legenda -->
    <div class="row q-mt-md q-gutter-sm items-center">
      <span class="text-caption text-grey-7">Legenda:</span>
      <q-chip dense color="grey" text-color="white" size="sm">Rascunho</q-chip>
      <q-chip dense color="warning" text-color="white" size="sm">Aprovado</q-chip>
      <q-chip dense color="info" text-color="white" size="sm">Agendado</q-chip>
      <q-chip dense color="positive" text-color="white" size="sm">Publicado</q-chip>
    </div>

    <!-- Posts do dia selecionado -->
    <q-card v-if="selectedDayPosts.length > 0" flat bordered class="q-mt-lg">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="event" class="q-mr-sm" />
          Posts para {{ formatSelectedDate }}
        </div>
      </q-card-section>
      <q-separator />
      <q-list separator>
        <q-item
          v-for="post in selectedDayPosts"
          :key="post.id"
          clickable
          :to="`/posts/${post.id}`"
        >
          <q-item-section avatar>
            <q-icon
              :name="getPlatformIcon(post.platform)"
              :color="getPlatformColor(post.platform)"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ getPostPreview(post) }}</q-item-label>
            <q-item-label caption>
              {{ formatTime(post.scheduledAt) }} - {{ post.platform }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              :color="getStatusColor(post.status)"
              text-color="white"
              dense
              size="sm"
            >
              {{ getStatusLabel(post.status) }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Dialog para agendar post -->
    <ScheduleDialog
      v-model="scheduleDialogOpen"
      :post="postToSchedule"
      @scheduled="onPostScheduled"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePosts } from 'src/composables/use-posts'
import ScheduleDialog from 'src/components/ScheduleDialog.vue'
import type { Post, PostStatus } from 'src/types'

const router = useRouter()
const $q = useQuasar()
const { posts, fetchPostsByDateRange, fetchUnscheduledPosts, schedulePost, updatePost } = usePosts()

const calendarRef = ref()
const selectedDate = ref(formatDateToString(new Date()))
const selectedPlatform = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const scheduleDialogOpen = ref(false)
const postToSchedule = ref<Post | null>(null)

// Estado para drag-and-drop
const draggedPost = ref<Post | null>(null)
const unscheduledPosts = ref<Post[]>([])
const loadingUnscheduled = ref(false)

// Opcoes de filtro
const platformOptions = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'threads']
const statusOptions = [
  { label: 'Rascunho', value: 'draft' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Agendado', value: 'scheduled' },
  { label: 'Publicado', value: 'published' }
]

// Computed para o label do mes atual
const currentMonthLabel = computed(() => {
  const { year, month } = parseDateString(selectedDate.value)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

// Posts filtrados
const filteredPosts = computed(() => {
  let result = posts.value
  if (selectedPlatform.value) {
    result = result.filter(p => p.platform === selectedPlatform.value)
  }
  if (selectedStatus.value) {
    const statusValue = typeof selectedStatus.value === 'object'
      ? (selectedStatus.value as { value: string }).value
      : selectedStatus.value
    result = result.filter(p => p.status === statusValue)
  }
  return result
})

// Posts do dia selecionado
const selectedDayPosts = computed(() => {
  return getPostsForDay(selectedDate.value)
})

// Formato da data selecionada
const formatSelectedDate = computed(() => {
  const { year, month, day } = parseDateString(selectedDate.value)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
})

// Funcoes auxiliares
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number)
  return {
    year: parts[0] ?? new Date().getFullYear(),
    month: parts[1] ?? 1,
    day: parts[2] ?? 1
  }
}

function getPostsForDay(dateStr: string): Post[] {
  return filteredPosts.value.filter(post => {
    const postDate = post.scheduledAt || post.publishedAt || post.createdAt
    if (!postDate) return false
    const postDateStr = postDate.substring(0, 10)
    return postDateStr === dateStr
  })
}

function getPostPreview(post: Post): string {
  const maxLen = 30
  if (post.content.length <= maxLen) return post.content
  return post.content.substring(0, maxLen) + '...'
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
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

// Navegacao
function goToToday(): void {
  selectedDate.value = formatDateToString(new Date())
}

function prevMonth(): void {
  const { year, month, day } = parseDateString(selectedDate.value)
  const newDate = new Date(year, month - 2, day)
  selectedDate.value = formatDateToString(newDate)
}

function nextMonth(): void {
  const { year, month, day } = parseDateString(selectedDate.value)
  const newDate = new Date(year, month, day)
  selectedDate.value = formatDateToString(newDate)
}

function openPost(post: Post): void {
  void router.push(`/posts/${post.id}`)
}

// Funcoes de drag-and-drop
function canDragPost(post: Post): boolean {
  // Permite arrastar posts que nao estao publicados
  return post.status !== 'published'
}

function isValidDropTarget(dateStr: string): boolean {
  // Nao permite agendar para datas passadas
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(dateStr)
  return targetDate >= today
}

function onDragStart(event: DragEvent, post: Post): void {
  draggedPost.value = post
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', post.id.toString())
  }
}

function onDragEnd(): void {
  draggedPost.value = null
}

function onDragEnter(event: DragEvent): void {
  event.preventDefault()
}

function onDragLeave(): void {
  // Placeholder para logica futura se necessario
}

async function onDrop(event: DragEvent, targetDate: string): Promise<void> {
  event.preventDefault()

  if (!draggedPost.value) return

  const post = draggedPost.value

  // Validar data
  if (!isValidDropTarget(targetDate)) {
    $q.notify({
      type: 'warning',
      message: 'Nao e possivel agendar para datas passadas',
      icon: 'warning'
    })
    draggedPost.value = null
    return
  }

  // Manter o horario original se existir, ou usar 09:00 como padrao
  let scheduledAt: string
  if (post.scheduledAt) {
    const oldDate = new Date(post.scheduledAt)
    const hours = String(oldDate.getHours()).padStart(2, '0')
    const minutes = String(oldDate.getMinutes()).padStart(2, '0')
    scheduledAt = `${targetDate}T${hours}:${minutes}:00.000Z`
  } else {
    scheduledAt = `${targetDate}T09:00:00.000Z`
  }

  try {
    if (post.scheduledAt) {
      // Reagendar post existente
      await updatePost(post.id, { scheduledAt })
      $q.notify({
        type: 'positive',
        message: 'Post reagendado com sucesso',
        icon: 'event'
      })
    } else {
      // Agendar novo post
      await schedulePost(post.id, scheduledAt)
      $q.notify({
        type: 'positive',
        message: 'Post agendado com sucesso',
        icon: 'schedule'
      })
    }

    // Recarregar dados
    await reloadCalendarData()
    await loadUnscheduledPosts()
  } catch (error) {
    console.error('Erro ao agendar post:', error)
    $q.notify({
      type: 'negative',
      message: 'Erro ao agendar post',
      icon: 'error'
    })
  } finally {
    draggedPost.value = null
  }
}

async function loadUnscheduledPosts(): Promise<void> {
  loadingUnscheduled.value = true
  try {
    unscheduledPosts.value = await fetchUnscheduledPosts()
  } catch (error) {
    console.error('Erro ao carregar posts nao agendados:', error)
  } finally {
    loadingUnscheduled.value = false
  }
}

async function reloadCalendarData(): Promise<void> {
  const { year, month } = parseDateString(selectedDate.value)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  await fetchPostsByDateRange(startDate, endDate)
}

// Event handlers
async function onCalendarChange(data: { start: string; end: string }): Promise<void> {
  await fetchPostsByDateRange(data.start, data.end)
}

function handleFilterChange(): void {
  // Filtro e reativo, nao precisa fazer nada
}

function onPostScheduled(): void {
  scheduleDialogOpen.value = false
  void reloadCalendarData()
  void loadUnscheduledPosts()
}

// Watch para carregar posts quando mudar de mes
watch(selectedDate, async (newDate) => {
  const { year, month } = parseDateString(newDate)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  await fetchPostsByDateRange(startDate, endDate)
}, { immediate: false })

// Carregar posts do mes atual e posts nao agendados no mount
onMounted(async () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  await Promise.all([
    fetchPostsByDateRange(startDate, endDate),
    loadUnscheduledPosts()
  ])
})
</script>

<style scoped>
/* Painel de posts nao agendados */
.unscheduled-panel {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.unscheduled-list {
  overflow-y: auto;
  max-height: 400px;
}

.unscheduled-post-item {
  cursor: grab;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.unscheduled-post-item:hover {
  transform: translateX(4px);
}

.unscheduled-post-item:active {
  cursor: grabbing;
}

/* Calendario */
.calendar-day-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px;
  max-height: 80px;
  overflow-y: auto;
  min-height: 60px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  border: 2px solid transparent;
  border-radius: 4px;
}

.calendar-post-chip {
  font-size: 11px;
  max-width: 100%;
  transition: opacity 0.2s ease, transform 0.15s ease;
}

/* Drag-and-drop feedback */
.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

.dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

.drop-target {
  background-color: rgba(25, 118, 210, 0.15);
  border-color: #1976d2;
  border-style: dashed;
}

.drop-target-invalid {
  background-color: rgba(244, 67, 54, 0.1);
  border-color: #f44336;
  border-style: dashed;
}

.full-width {
  width: 100%;
  justify-content: flex-start;
}

/* Calendar base styles */
:deep(.q-calendar-month__day) {
  min-height: 100px;
}

:deep(.q-calendar-month__day--current) {
  background-color: rgba(25, 118, 210, 0.1);
}

:deep(.q-calendar-month__day:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>

