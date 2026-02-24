<template>
  <div class="media-picker">
    <div class="text-subtitle2 q-mb-sm">{{ label }}</div>

    <div v-if="selectedMedias.length" class="row q-gutter-sm q-mb-md">
      <div v-for="(media, idx) in selectedMedias" :key="media.id || idx" class="relative-position">
        <img v-if="isImageMedia(media)" :src="getPreviewUrl(media)" class="rounded-borders"
          style="width: 80px; height: 80px; object-fit: cover" />
        <div v-else class="bg-grey-3 rounded-borders flex flex-center" style="width: 80px; height: 80px">
          <q-icon name="insert_drive_file" size="32px" color="grey-7" />
        </div>
        <q-btn flat round dense size="xs" icon="close" class="absolute-top-right bg-grey-8 text-white"
          style="margin: 2px" @click="removeSelected(idx)" />
      </div>
    </div>

    <div class="row q-gutter-sm">
      <q-btn outline icon="upload" :label="uploadLabel" @click="triggerUpload" :loading="uploading"
        :disable="maxFiles > 0 && selectedMedias.length >= maxFiles" />
      <q-btn outline icon="photo_library" :label="galleryLabel" @click="openGalleryDialog"
        :disable="maxFiles > 0 && selectedMedias.length >= maxFiles" />
    </div>

    <input ref="fileInput" type="file" :accept="acceptMimeTypes" :multiple="maxFiles !== 1"
      style="display: none" @change="handleFileSelect" />

    <q-dialog v-model="galleryDialogOpen" persistent maximized>
      <q-card class="column full-height">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Selecionar da Galeria</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="row q-gutter-md items-center">
          <q-input v-model="searchQuery" outlined dense placeholder="Buscar por nome..." class="col"
            clearable @update:model-value="debouncedSearch">
            <template v-slot:prepend><q-icon name="search" /></template>
          </q-input>
        </q-card-section>

        <q-card-section class="col q-pt-none" style="overflow-y: auto">
          <div v-if="loadingGallery" class="text-center q-pa-xl">
            <q-spinner size="50px" color="primary" />
            <div class="q-mt-md text-grey-7">Carregando midias...</div>
          </div>

          <div v-else-if="galleryItems.length === 0" class="text-center q-pa-xl text-grey-6">
            <q-icon name="photo_library" size="64px" />
            <div class="q-mt-md">Nenhuma midia encontrada</div>
          </div>

          <div v-else class="row q-gutter-sm">
            <div v-for="media in galleryItems" :key="media.id"
              class="gallery-item cursor-pointer relative-position"
              :class="{ 'gallery-item--selected': isMediaSelected(media) }"
              @click="toggleGallerySelection(media)">
              <img v-if="isImage(media)" :src="getMediaFullUrl(media)" class="rounded-borders"
                style="width: 120px; height: 120px; object-fit: cover" />
              <div v-else class="bg-grey-3 rounded-borders flex flex-center" style="width: 120px; height: 120px">
                <q-icon name="videocam" size="40px" color="grey-7" />
              </div>
              <q-icon v-if="isMediaSelected(media)" name="check_circle" color="primary" size="24px"
                class="absolute-top-right" style="margin: 4px" />
              <div class="text-caption text-center q-mt-xs ellipsis" style="max-width: 120px">
                {{ media.originalName }}
              </div>
            </div>
          </div>

          <div v-if="galleryTotal > galleryItems.length" class="text-center q-mt-lg">
            <q-btn flat color="primary" label="Carregar mais" @click="loadMoreGallery" :loading="loadingGallery" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" :label="selectButtonLabel" :disable="gallerySelection.length === 0"
            @click="confirmGallerySelection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMedia, imageMimeTypes, type MediaFilterType, type MediaSourceType } from 'src/composables/use-media'
import { host } from 'src/api'
import type { Media } from 'src/types'

export interface SelectedMedia {
  id?: number
  url: string
  mimeType: string
  originalName: string
  file?: File
  media?: Media
}

const props = withDefaults(defineProps<{
  modelValue?: SelectedMedia[]
  label?: string
  uploadLabel?: string
  galleryLabel?: string
  filter?: MediaFilterType
  source?: MediaSourceType
  maxFiles?: number
  accept?: string
}>(), {
  modelValue: () => [],
  label: 'Midias',
  uploadLabel: 'Enviar',
  galleryLabel: 'Galeria',
  filter: 'all',
  source: 'all',
  maxFiles: 0,
  accept: ''
})

const emit = defineEmits<{ 'update:modelValue': [value: SelectedMedia[]] }>()
const { uploadFile, fetchGallery, getMediaUrl, isImage } = useMedia()

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const galleryDialogOpen = ref(false)
const loadingGallery = ref(false)
const galleryItems = ref<Media[]>([])
const galleryTotal = ref(0)
const gallerySelection = ref<Media[]>([])
const searchQuery = ref('')
const gallerySkip = ref(0)
const galleryLimit = 20
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const selectedMedias = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const acceptMimeTypes = computed(() => {
  if (props.accept) return props.accept
  if (props.filter === 'image') return 'image/*'
  if (props.filter === 'video') return 'video/*'
  return 'image/*,video/*'
})

const selectButtonLabel = computed(() => `Selecionar (${gallerySelection.value.length})`)

const isImageMedia = (media: SelectedMedia): boolean => {
  return imageMimeTypes.includes(media.mimeType as (typeof imageMimeTypes)[number])
}

const getPreviewUrl = (media: SelectedMedia): string => {
  if (media.file) return URL.createObjectURL(media.file)
  if (media.url.startsWith('http') || media.url.startsWith('data:')) return media.url
  return `${host}${media.url}`
}

const getMediaFullUrl = (media: Media): string => getMediaUrl(media)

const removeSelected = (idx: number) => {
  const newValue = [...selectedMedias.value]
  newValue.splice(idx, 1)
  selectedMedias.value = newValue
}

const triggerUpload = () => fileInput.value?.click()

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  uploading.value = true
  const newMedias: SelectedMedia[] = []

  for (const file of Array.from(files)) {
    const uploadedMedia = await uploadFile(file)
    if (uploadedMedia) {
      newMedias.push({
        id: uploadedMedia.id,
        url: uploadedMedia.url,
        mimeType: uploadedMedia.mimeType,
        originalName: uploadedMedia.originalName,
        media: uploadedMedia
      })
    }
  }

  if (newMedias.length > 0) {
    const maxToAdd = props.maxFiles > 0 ? props.maxFiles - selectedMedias.value.length : newMedias.length
    selectedMedias.value = [...selectedMedias.value, ...newMedias.slice(0, maxToAdd)]
  }

  uploading.value = false
  input.value = ''
}

const openGalleryDialog = async () => {
  galleryDialogOpen.value = true
  gallerySelection.value = []
  gallerySkip.value = 0
  searchQuery.value = ''
  await loadGallery()
}

const loadGallery = async () => {
  loadingGallery.value = true
  const options: { filter: MediaFilterType; source: MediaSourceType; search?: string; limit: number; skip: number } = {
    filter: props.filter,
    source: props.source,
    limit: galleryLimit,
    skip: gallerySkip.value
  }
  if (searchQuery.value) {
    options.search = searchQuery.value
  }
  const result = await fetchGallery(options)
  if (gallerySkip.value === 0) {
    galleryItems.value = result.data
  } else {
    galleryItems.value = [...galleryItems.value, ...result.data]
  }
  galleryTotal.value = result.total
  loadingGallery.value = false
}

const loadMoreGallery = async () => {
  gallerySkip.value += galleryLimit
  await loadGallery()
}

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    gallerySkip.value = 0
    void loadGallery()
  }, 300)
}

const isMediaSelected = (media: Media): boolean => {
  return gallerySelection.value.some((m) => m.id === media.id)
}

const toggleGallerySelection = (media: Media) => {
  const idx = gallerySelection.value.findIndex((m) => m.id === media.id)
  if (idx >= 0) {
    gallerySelection.value.splice(idx, 1)
  } else {
    if (props.maxFiles > 0 && selectedMedias.value.length + gallerySelection.value.length >= props.maxFiles) return
    gallerySelection.value.push(media)
  }
}

const confirmGallerySelection = () => {
  const newMedias: SelectedMedia[] = gallerySelection.value.map((m) => ({
    id: m.id,
    url: m.url,
    mimeType: m.mimeType,
    originalName: m.originalName,
    media: m
  }))
  selectedMedias.value = [...selectedMedias.value, ...newMedias]
  galleryDialogOpen.value = false
}
</script>

<style scoped>
.gallery-item {
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 4px;
}

.gallery-item--selected {
  border-color: var(--q-primary);
  background-color: rgba(25, 118, 210, 0.1);
}
</style>

