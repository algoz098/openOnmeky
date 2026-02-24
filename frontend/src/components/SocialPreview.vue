<template>
  <div class="social-preview">
    <!-- Loading State -->
    <div v-if="loading" class="preview-loading">
      <q-skeleton type="QAvatar" size="32px" class="q-mb-sm" />
      <q-skeleton type="text" width="60%" class="q-mb-md" />
      <q-skeleton type="rect" height="200px" class="q-mb-sm" />
      <q-skeleton type="text" width="100%" />
      <q-skeleton type="text" width="80%" />
      <q-skeleton type="text" width="40%" />
    </div>

    <!-- Instagram Preview - Stories/Reels (vertical 9:16) -->
    <div v-else-if="platform === 'instagram' && isVerticalFormat" class="instagram-stories-preview">
      <div class="stories-container" :style="storiesContainerStyle">
        <!-- Header do Stories -->
        <div class="stories-header">
          <q-avatar size="28px" :color="avatarColor" text-color="white">{{ brandInitials }}</q-avatar>
          <span class="stories-username">{{ brandName || 'marca' }}</span>
          <span class="stories-time">Agora</span>
          <q-space />
          <q-icon name="close" size="20px" color="white" />
        </div>
        <!-- Conteudo do Stories -->
        <div v-if="hasMedia" class="stories-media">
          <q-carousel v-if="hasSlides" v-model="slideIndex" animated arrows navigation :height="storiesMediaHeight">
            <q-carousel-slide v-for="(slide, idx) in slides" :key="idx" :name="idx" class="q-pa-none">
              <CarouselSlidePreview
                :image-url="slide.imageUrl ?? ''"
                :text="slide.text ?? ''"
                :aspect-ratio="aspectRatio"
                :max-height="storiesMediaHeightNumber"
              />
            </q-carousel-slide>
          </q-carousel>
          <CarouselSlidePreview
            v-else-if="hasMediaUrls"
            :image-url="firstMediaUrl"
            :aspect-ratio="aspectRatio"
            :max-height="storiesMediaHeightNumber"
          />
        </div>
        <div v-else class="stories-placeholder flex flex-center" :style="{ height: storiesMediaHeight }">
          <q-icon name="image" size="48px" color="grey-5" />
        </div>
        <!-- Footer do Stories -->
        <div class="stories-footer">
          <q-input v-model="dummyInput" dense dark borderless placeholder="Enviar mensagem" class="stories-input" />
          <q-icon name="favorite_border" size="24px" color="white" class="q-ml-sm" />
          <q-icon name="send" size="24px" color="white" class="q-ml-sm" />
        </div>
      </div>
      <div class="stories-format-label">
        <q-chip dense size="sm" color="purple" text-color="white">
          {{ formatLabel }}
        </q-chip>
      </div>
    </div>

    <!-- Instagram Preview - Feed (1:1, 4:5, 16:9) -->
    <div v-else-if="platform === 'instagram'" class="instagram-preview">
      <div class="instagram-header">
        <q-avatar size="32px" :color="avatarColor" text-color="white">{{ brandInitials }}</q-avatar>
        <span class="instagram-username">{{ brandName || 'marca' }}</span>
        <q-space />
        <q-icon name="more_horiz" size="20px" />
      </div>
      <div v-if="hasMedia" class="instagram-media">
        <q-carousel v-if="hasSlides" v-model="slideIndex" animated arrows navigation :height="feedMediaHeight">
          <q-carousel-slide v-for="(slide, idx) in slides" :key="idx" :name="idx" class="q-pa-none">
            <CarouselSlidePreview
              :image-url="slide.imageUrl ?? ''"
              :text="slide.text ?? ''"
              :aspect-ratio="aspectRatio"
              :max-height="feedMediaHeightNumber"
            />
          </q-carousel-slide>
        </q-carousel>
        <CarouselSlidePreview
          v-else-if="hasMediaUrls"
          :image-url="firstMediaUrl"
          :aspect-ratio="aspectRatio"
          :max-height="feedMediaHeightNumber"
        />
      </div>
      <div class="instagram-actions">
        <q-icon name="favorite_border" size="24px" />
        <q-icon name="chat_bubble_outline" size="24px" class="q-ml-md" />
        <q-icon name="send" size="24px" class="q-ml-md" />
        <q-space />
        <q-icon name="bookmark_border" size="24px" />
      </div>
      <div class="instagram-content">
        <span class="text-weight-bold">{{ brandName || 'marca' }}</span>
        <span class="q-ml-xs">{{ displayContent }}</span>
      </div>
      <div class="instagram-format-label">
        <q-chip dense size="sm" color="grey-7" text-color="white">
          {{ aspectRatio }}
        </q-chip>
      </div>
    </div>

    <!-- Twitter/X Preview -->
    <div v-else-if="platform === 'twitter' || platform === 'x'" class="twitter-preview">
      <div class="twitter-header">
        <q-avatar size="40px" :color="avatarColor" text-color="white">{{ brandInitials }}</q-avatar>
        <div class="twitter-user-info q-ml-sm">
          <div class="text-weight-bold">{{ brandName || 'Marca' }}</div>
          <div class="text-grey-6 text-caption">@{{ brandHandle }}</div>
        </div>
        <q-space />
        <q-icon name="sym_o_more_horiz" size="20px" color="grey-6" />
      </div>
      <div class="twitter-content">{{ displayContent }}</div>
      <div v-if="hasMedia" class="twitter-media q-mt-sm">
        <q-img v-for="(url, idx) in mediaPreview" :key="idx" :src="getMediaUrl(url)" fit="cover" class="rounded-borders" style="max-height: 200px" />
      </div>
      <div class="twitter-actions q-mt-sm">
        <span><q-icon name="chat_bubble_outline" size="18px" /> 0</span>
        <span><q-icon name="repeat" size="18px" /> 0</span>
        <span><q-icon name="favorite_border" size="18px" /> 0</span>
        <span><q-icon name="share" size="18px" /></span>
      </div>
    </div>

    <!-- LinkedIn Preview -->
    <div v-else-if="platform === 'linkedin'" class="linkedin-preview">
      <div class="linkedin-header">
        <q-avatar size="48px" :color="avatarColor" text-color="white">{{ brandInitials }}</q-avatar>
        <div class="linkedin-user-info q-ml-sm">
          <div class="text-weight-bold">{{ brandName || 'Marca' }}</div>
          <div class="text-grey-6 text-caption">Empresa</div>
          <div class="text-grey-6 text-caption">Agora</div>
        </div>
      </div>
      <div class="linkedin-content q-mt-sm">{{ displayContent }}</div>
      <div v-if="hasMedia" class="linkedin-media q-mt-sm">
        <q-img v-for="(url, idx) in mediaPreview" :key="idx" :src="getMediaUrl(url)" fit="cover" />
      </div>
      <q-separator class="q-my-sm" />
      <div class="linkedin-actions">
        <q-btn flat dense no-caps size="sm"><q-icon name="thumb_up" class="q-mr-xs" /> Gostei</q-btn>
        <q-btn flat dense no-caps size="sm"><q-icon name="chat_bubble_outline" class="q-mr-xs" /> Comentar</q-btn>
        <q-btn flat dense no-caps size="sm"><q-icon name="repeat" class="q-mr-xs" /> Compartilhar</q-btn>
        <q-btn flat dense no-caps size="sm"><q-icon name="send" class="q-mr-xs" /> Enviar</q-btn>
      </div>
    </div>

    <!-- Facebook Preview -->
    <div v-else-if="platform === 'facebook'" class="facebook-preview">
      <div class="facebook-header">
        <q-avatar size="40px" :color="avatarColor" text-color="white">{{ brandInitials }}</q-avatar>
        <div class="facebook-user-info q-ml-sm">
          <div class="text-weight-bold">{{ brandName || 'Marca' }}</div>
          <div class="text-grey-6 text-caption">Agora · <q-icon name="public" size="12px" /></div>
        </div>
        <q-space />
        <q-icon name="more_horiz" size="20px" />
      </div>
      <div class="facebook-content q-mt-sm">{{ displayContent }}</div>
      <div v-if="hasMedia" class="facebook-media q-mt-sm">
        <q-img v-for="(url, idx) in mediaPreview" :key="idx" :src="getMediaUrl(url)" fit="cover" />
      </div>
      <q-separator class="q-my-sm" />
      <div class="facebook-actions">
        <q-btn flat dense no-caps><q-icon name="thumb_up" class="q-mr-xs" /> Curtir</q-btn>
        <q-btn flat dense no-caps><q-icon name="chat_bubble_outline" class="q-mr-xs" /> Comentar</q-btn>
        <q-btn flat dense no-caps><q-icon name="share" class="q-mr-xs" /> Compartilhar</q-btn>
      </div>
    </div>

    <!-- TikTok Preview -->
    <div v-else-if="platform === 'tiktok'" class="tiktok-preview">
      <div class="tiktok-container">
        <div v-if="hasMedia" class="tiktok-media">
          <q-img :src="getMediaUrl(media[0])" fit="cover" height="400px" />
        </div>
        <div v-else class="tiktok-placeholder" style="height: 400px; background: linear-gradient(180deg, #010101 0%, #161823 100%)"></div>
        <div class="tiktok-overlay">
          <div class="tiktok-sidebar">
            <q-avatar size="40px" :color="avatarColor" text-color="white" class="q-mb-md">{{ brandInitials }}</q-avatar>
            <q-icon name="favorite" size="32px" color="white" /><div class="text-white text-caption">0</div>
            <q-icon name="chat_bubble" size="32px" color="white" class="q-mt-sm" /><div class="text-white text-caption">0</div>
            <q-icon name="share" size="32px" color="white" class="q-mt-sm" /><div class="text-white text-caption">0</div>
          </div>
          <div class="tiktok-info">
            <div class="text-weight-bold text-white">@{{ brandHandle }}</div>
            <div class="text-white text-caption" style="max-width: 200px">{{ truncatedContent }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Default/Generic Preview -->
    <div v-else class="generic-preview">
      <div class="generic-header">
        <q-avatar size="32px" :color="avatarColor" text-color="white">{{ brandInitials }}</q-avatar>
        <span class="q-ml-sm text-weight-bold">{{ brandName || 'Marca' }}</span>
      </div>
      <div class="generic-content q-mt-sm">{{ displayContent }}</div>
      <div v-if="hasMedia" class="generic-media q-mt-sm">
        <q-img v-for="(url, idx) in mediaPreview" :key="idx" :src="getMediaUrl(url)" fit="cover" class="rounded-borders" style="max-height: 150px" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { host } from 'src/api'
import type { CarouselSlide, AspectRatio } from 'src/types'
import CarouselSlidePreview from './CarouselSlidePreview.vue'

interface Props {
  platform: string
  content: string
  brandName?: string
  brandAvatar?: string
  media?: string[]
  slides?: CarouselSlide[]
  loading?: boolean
  aspectRatio?: AspectRatio
  targetFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
  brandName: '',
  brandAvatar: '',
  media: () => [],
  slides: () => [],
  loading: false,
  aspectRatio: '1:1',
  targetFormat: 'feed'
})

// Calcula dimensoes baseado no aspect ratio
const previewDimensions = computed(() => {
  const baseWidth = 300
  switch (props.aspectRatio) {
    case '1:1':
      return { width: baseWidth, height: baseWidth }
    case '4:5':
      return { width: baseWidth, height: Math.round(baseWidth * (5 / 4)) }
    case '9:16':
      return { width: Math.round(baseWidth * 0.7), height: Math.round((baseWidth * 0.7) * (16 / 9)) }
    case '16:9':
      return { width: baseWidth, height: Math.round(baseWidth * (9 / 16)) }
    default:
      return { width: baseWidth, height: baseWidth }
  }
})

// Verifica se e formato vertical (Stories/Reels)
const isVerticalFormat = computed(() => props.aspectRatio === '9:16')

// Computed properties para o template
const hasSlides = computed(() => props.slides.length > 0)
const hasMediaUrls = computed(() => props.media.length > 0)
const firstMediaUrl = computed(() => props.media[0] || '')

// Estilos e dimensoes do Stories
const storiesContainerStyle = computed(() => ({
  width: previewDimensions.value.width + 'px',
  height: previewDimensions.value.height + 'px'
}))
const storiesMediaHeightNumber = computed(() => previewDimensions.value.height - 60)
const storiesMediaHeight = computed(() => storiesMediaHeightNumber.value + 'px')

// Estilos e dimensoes do Feed
const feedMediaHeightNumber = computed(() => previewDimensions.value.height)
const feedMediaHeight = computed(() => feedMediaHeightNumber.value + 'px')

// Label do formato
const formatLabel = computed(() => {
  if (props.targetFormat === 'reels') return 'Reels (9:16)'
  return 'Stories (9:16)'
})

const slideIndex = ref(0)
const dummyInput = ref('') // Apenas para visual do Stories

const brandInitials = computed(() => props.brandName?.substring(0, 2).toUpperCase() || 'M')
const brandHandle = computed(() => props.brandName?.toLowerCase().replace(/\s+/g, '') || 'marca')
const avatarColor = computed(() => {
  const colors = ['primary', 'secondary', 'accent', 'pink', 'purple', 'deep-purple', 'indigo', 'blue']
  const hash = (props.brandName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
})

const displayContent = computed(() => props.content || 'Seu conteudo aparecera aqui...')
const truncatedContent = computed(() => {
  const max = 100
  return props.content.length > max ? props.content.substring(0, max) + '...' : props.content
})

const hasMedia = computed(() => props.media.length > 0 || props.slides.length > 0)
const mediaPreview = computed(() => props.media.slice(0, 4))

const getMediaUrl = (url: string | undefined): string => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${host}${url}`
}
</script>

<style scoped lang="scss">
.social-preview {
  border-radius: 8px;
  overflow: hidden;
}

.preview-loading {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

/* Instagram Feed Styles */
.instagram-preview {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  position: relative;
}
.instagram-header {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #efefef;
}
.instagram-username {
  margin-left: 10px;
  font-weight: 600;
  font-size: 14px;
}
.instagram-media {
  background: #000;
  display: flex;
  justify-content: center;
  width: 100%;

  :deep(.q-carousel) {
    width: 100%;
  }
  :deep(.q-carousel__slide) {
    width: 100%;
    padding: 0;
  }
}
.instagram-actions {
  display: flex;
  align-items: center;
  padding: 12px;
}
.instagram-content {
  padding: 0 12px 12px;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}
.instagram-format-label {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* Instagram Stories/Reels Styles */
.instagram-stories-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 8px;
}
.stories-container {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.stories-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent);
}
.stories-username {
  margin-left: 8px;
  font-weight: 600;
  font-size: 13px;
  color: white;
}
.stories-time {
  margin-left: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}
.stories-media {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  width: 100%;

  :deep(.q-carousel) {
    width: 100%;
  }
  :deep(.q-carousel__slide) {
    width: 100%;
    padding: 0;
  }
}
.stories-placeholder {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
.stories-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
}
.stories-input {
  flex: 1;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 0 12px;
  :deep(.q-field__native) {
    color: white;
  }
  :deep(.q-field__native::placeholder) {
    color: rgba(255,255,255,0.7);
  }
}
.stories-format-label {
  margin-top: 8px;
}

/* Twitter/X Styles */
.twitter-preview {
  background: white;
  border: 1px solid #cfd9de;
  border-radius: 16px;
  padding: 12px 16px;
}
.twitter-header {
  display: flex;
  align-items: flex-start;
}
.twitter-content {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-wrap;
}
.twitter-actions {
  display: flex;
  justify-content: space-between;
  color: #536471;
  font-size: 13px;
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

/* LinkedIn Styles */
.linkedin-preview {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
}
.linkedin-header {
  display: flex;
  align-items: flex-start;
}
.linkedin-content {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
.linkedin-actions {
  display: flex;
  justify-content: space-around;
}

/* Facebook Styles */
.facebook-preview {
  background: white;
  border: 1px solid #dddfe2;
  border-radius: 8px;
  padding: 12px;
}
.facebook-header {
  display: flex;
  align-items: flex-start;
}
.facebook-content {
  font-size: 15px;
  line-height: 1.4;
  white-space: pre-wrap;
}
.facebook-actions {
  display: flex;
  justify-content: space-around;
}

/* TikTok Styles */
.tiktok-preview {
  border-radius: 8px;
  overflow: hidden;
}
.tiktok-container {
  position: relative;
  background: #000;
}
.tiktok-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.tiktok-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.tiktok-info {
  flex: 1;
  margin-right: 16px;
}

/* Generic Styles */
.generic-preview {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}
.generic-content {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.slide-text-only {
  font-size: 16px;
  font-weight: 500;
}
</style>

