<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">Posts</h4>
        <p class="text-grey-7 q-ma-none">Gerencie seus posts e conteudos</p>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Novo Post" to="/posts/create" />
      </div>
    </div>

    <div class="row q-mb-md q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          placeholder="Buscar posts..."
          debounce="300"
          clearable
          @update:model-value="handleSearch"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col">
        <q-tabs v-model="statusFilter" dense align="left" class="text-grey-7" @update:model-value="handleFilterChange">
          <q-tab name="all" label="Todos" />
          <q-tab name="draft" label="Rascunhos" />
          <q-tab name="approved" label="Aprovados" />
          <q-tab name="scheduled" label="Agendados" />
          <q-tab name="published" label="Publicados" />
        </q-tabs>
      </div>
    </div>

    <q-card v-if="loading" flat bordered>
      <q-card-section class="text-center q-pa-xl">
        <q-spinner size="50px" color="primary" />
      </q-card-section>
    </q-card>

    <div v-else-if="filteredPosts.length === 0" class="text-center q-pa-xl">
      <q-icon name="article" size="80px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">Nenhum post encontrado</div>
      <q-btn color="primary" icon="add" label="Criar Post" to="/posts/create" class="q-mt-lg" />
    </div>

    <q-list v-else bordered separator class="rounded-borders">
      <q-item v-for="post in filteredPosts" :key="post.id" clickable :to="`/posts/${post.id}`" class="q-py-md">
        <!-- Thumbnail de midia ou icone de status -->
        <q-item-section avatar>
          <div v-if="hasMedia(post) && getFirstMediaUrl(post)" class="relative-position">
            <img :src="getFirstMediaUrl(post) ?? ''" class="post-thumbnail" />
            <q-badge
              v-if="post.slides && post.slides.length > 1"
              color="dark"
              floating
              class="text-caption"
            >
              {{ post.slides.length }}
            </q-badge>
          </div>
          <div v-else class="post-thumbnail-placeholder">
            <q-icon :name="getContentTypeIcon(post)" size="24px" color="grey-5" />
          </div>
        </q-item-section>

        <!-- Conteudo principal -->
        <q-item-section>
          <!-- Linha 1: Brand + Badges -->
          <q-item-label class="row items-center q-gutter-xs q-mb-xs">
            <span class="text-weight-medium text-grey-8">{{ getBrandName(post.brandId) }}</span>
            <q-icon
              :name="getPlatformIcon(post.platform)"
              :color="getPlatformColor(post.platform)"
              size="16px"
            >
              <q-tooltip>{{ post.platform }}</q-tooltip>
            </q-icon>
            <q-badge
              v-if="post.origin === 'ai' || post.origin === 'rewritten'"
              :color="getOriginColor(post.origin)"
              outline
              class="text-caption"
            >
              <q-icon :name="getOriginIcon(post.origin)" size="12px" class="q-mr-xs" />
              {{ post.origin === 'ai' ? 'IA' : 'Reescrito' }}
            </q-badge>
            <q-badge
              v-if="post.aiMode === 'carousel' || (post.slides && post.slides.length > 0)"
              color="teal"
              outline
              class="text-caption"
            >
              <q-icon name="view_carousel" size="12px" class="q-mr-xs" />
              {{ getContentTypeLabel(post) }}
            </q-badge>
            <q-icon
              v-if="post.warnings && post.warnings.length > 0"
              name="warning"
              color="warning"
              size="16px"
            >
              <q-tooltip>{{ post.warnings.length }} aviso(s)</q-tooltip>
            </q-icon>
          </q-item-label>

          <!-- Linha 2: Conteudo do post -->
          <q-item-label lines="2" class="text-body2">{{ post.content }}</q-item-label>

          <!-- Linha 3: Metadados -->
          <q-item-label caption class="row items-center q-gutter-sm q-mt-xs">
            <span>{{ post.charCount || 0 }}/{{ post.charLimit || '?' }} chars</span>
            <span class="text-grey-5">|</span>
            <span>{{ formatRelativeDate(post.createdAt) }}</span>
            <template v-if="post.status === 'scheduled' && post.scheduledAt">
              <span class="text-grey-5">|</span>
              <span class="text-info">
                <q-icon name="schedule" size="14px" class="q-mr-xs" />
                {{ formatDateTime(post.scheduledAt) }}
              </span>
            </template>
            <template v-if="post.status === 'published' && post.publishedAt">
              <span class="text-grey-5">|</span>
              <span class="text-positive">
                <q-icon name="check_circle" size="14px" class="q-mr-xs" />
                {{ formatDateTime(post.publishedAt) }}
              </span>
            </template>
          </q-item-label>
        </q-item-section>

        <!-- Status -->
        <q-item-section side top>
          <q-chip
            dense
            :color="getStatusColor(post.status)"
            text-color="white"
            size="sm"
            :icon="getStatusIcon(post.status)"
          >
            {{ getStatusLabel(post.status) }}
          </q-chip>
        </q-item-section>

        <!-- Acoes -->
        <q-item-section side>
          <q-btn
            flat
            round
            icon="more_vert"
            color="grey-7"
            size="md"
            class="action-btn"
            @click.stop.prevent
          >
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 180px">
                <q-item clickable v-close-popup :to="`/posts/${post.id}/edit`">
                  <q-item-section avatar><q-icon name="edit" color="primary" /></q-item-section>
                  <q-item-section>Editar</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="duplicatePost(post)">
                  <q-item-section avatar><q-icon name="content_copy" color="secondary" /></q-item-section>
                  <q-item-section>Duplicar</q-item-section>
                </q-item>
                <q-separator />
                <q-item
                  v-if="post.status === 'draft' || post.status === 'approved'"
                  clickable
                  v-close-popup
                  @click="quickSchedule(post)"
                >
                  <q-item-section avatar><q-icon name="schedule" color="info" /></q-item-section>
                  <q-item-section>Agendar</q-item-section>
                </q-item>
                <q-item
                  v-if="post.status === 'draft' || post.status === 'approved' || post.status === 'scheduled'"
                  clickable
                  v-close-popup
                  @click="quickPublish(post)"
                >
                  <q-item-section avatar><q-icon name="send" color="positive" /></q-item-section>
                  <q-item-section>Publicar Agora</q-item-section>
                </q-item>
                <q-separator v-if="post.status === 'draft' || post.status === 'approved' || post.status === 'scheduled'" />
                <q-item clickable v-close-popup @click="confirmDelete(post)">
                  <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
                  <q-item-section class="text-negative">Excluir</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Carregar Mais -->
    <div v-if="!loading && hasMore" class="text-center q-mt-lg">
      <q-btn
        outline
        color="primary"
        label="Carregar Mais"
        icon="expand_more"
        :loading="loadingMore"
        @click="handleLoadMore"
      />
      <div class="text-caption text-grey-6 q-mt-sm">
        Exibindo {{ posts.length }} de {{ pagination.total }} posts
      </div>
    </div>

    <q-dialog v-model="deleteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Excluir Post</div>
        </q-card-section>
        <q-card-section>Tem certeza que deseja excluir este post?</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Excluir" color="negative" @click="handleDelete" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogo de Publicacao Manual -->
    <q-dialog v-model="publishDialog" persistent>
      <q-card style="min-width: 450px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="send" color="primary" class="q-mr-sm" />
            Publicar Post
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="postToPublish">
          <q-banner class="bg-blue-1 text-blue-9 q-mb-md" rounded>
            <template #avatar>
              <q-icon name="info" color="blue" />
            </template>
            <div class="text-body2">
              <strong>Publicacao Manual</strong><br />
              A publicacao automatica no {{ postToPublish.platform }} ainda nao esta disponivel.
              Copie o conteudo abaixo e publique diretamente na plataforma.
            </div>
          </q-banner>

          <div class="text-subtitle2 q-mb-xs">Conteudo do Post:</div>
          <q-card flat bordered class="bg-grey-1 q-pa-md q-mb-md">
            <pre class="text-body2" style="white-space: pre-wrap; word-wrap: break-word; margin: 0;">{{ postToPublish.content }}</pre>
          </q-card>

          <div class="row q-gutter-sm q-mb-md">
            <q-btn
              color="primary"
              icon="content_copy"
              label="Copiar Conteudo"
              @click="copyPostContent"
              class="col"
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-sm">Instrucoes:</div>
          <ol class="text-body2 q-pl-md q-ma-none">
            <li>Clique em "Copiar Conteudo" acima</li>
            <li>Abra o {{ postToPublish.platform }} em outra janela ou no celular</li>
            <li>Cole o conteudo e publique</li>
            <li>Volte aqui e clique em "Confirmar Publicacao"</li>
          </ol>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="positive"
            icon="check_circle"
            label="Confirmar Publicacao"
            @click="confirmPublish"
            :loading="publishing"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePosts } from 'src/composables/use-posts'
import { useBrands } from 'src/composables/use-brands'
import { host } from 'src/api'
import type { Post, PostStatus, PostOrigin } from 'src/types'

const $q = useQuasar()
const { posts, pagination, hasMore, fetchPosts, loadMore, createPost, updatePost, removePost } = usePosts()
const { brands, fetchBrands } = useBrands()

// Converte URL relativa de midia para URL absoluta do backend
const getMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  // Se ja e URL absoluta, retorna como esta
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Se e URL relativa, adiciona o host do backend
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`
}

const loading = ref(true)
const loadingMore = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const deleteDialog = ref(false)
const deleting = ref(false)
const postToDelete = ref<Post | null>(null)

// Estado para dialogo de publicacao
const publishDialog = ref(false)
const publishing = ref(false)
const postToPublish = ref<Post | null>(null)

// Constroi query de busca atual
const buildQuery = () => {
  const query: Record<string, unknown> = {
    $sort: { createdAt: -1 } // Mais recentes primeiro
  }
  if (statusFilter.value !== 'all') {
    query.status = statusFilter.value
  }
  if (searchQuery.value.trim()) {
    query.content = { $like: `%${searchQuery.value.trim()}%` }
  }
  return query
}

// Handler para busca
const handleSearch = async () => {
  loading.value = true
  await fetchPosts(buildQuery())
  loading.value = false
}

// Handler para mudanca de filtro
const handleFilterChange = async () => {
  loading.value = true
  await fetchPosts(buildQuery())
  loading.value = false
}

// Handler para carregar mais
const handleLoadMore = async () => {
  loadingMore.value = true
  await loadMore(buildQuery())
  loadingMore.value = false
}

const filteredPosts = computed(() => {
  // Com a busca server-side, nao precisamos mais filtrar no cliente
  // mas mantemos para status local quando nao usar server-side
  return posts.value
})

const getStatusColor = (status: PostStatus) => {
  const colors: Record<PostStatus, string> = { draft: 'grey', approved: 'warning', scheduled: 'info', published: 'positive', failed: 'negative' }
  return colors[status] || 'grey'
}
const getStatusIcon = (status: PostStatus) => {
  const icons: Record<PostStatus, string> = { draft: 'edit_note', approved: 'thumb_up', scheduled: 'schedule', published: 'check_circle', failed: 'error' }
  return icons[status] || 'article'
}
const getStatusLabel = (status: PostStatus) => {
  const labels: Record<PostStatus, string> = { draft: 'Rascunho', approved: 'Aprovado', scheduled: 'Agendado', published: 'Publicado', failed: 'Falhou' }
  return labels[status] || status
}
const getPlatformColor = (platform: string) => {
  const colors: Record<string, string> = { instagram: 'pink', facebook: 'blue', twitter: 'light-blue', linkedin: 'indigo', tiktok: 'black' }
  return colors[platform.toLowerCase()] || 'grey'
}
const getPlatformIcon = (platform: string) => {
  // Usando Material Icons (disponiveis no projeto)
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
const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-'
const formatDateTime = (date?: string) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}
const formatRelativeDate = (date?: string) => {
  if (!date) return '-'
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `ha ${diffMins}min`
  if (diffHours < 24) return `ha ${diffHours}h`
  if (diffDays < 7) return `ha ${diffDays}d`
  return formatDate(date)
}

// Buscar nome da brand pelo ID
const getBrandName = (brandId: number) => {
  const brand = brands.value.find(b => b.id === brandId)
  return brand?.name || `Brand #${brandId}`
}

// Icone e cor para origem do post
const getOriginIcon = (origin?: PostOrigin) => {
  if (origin === 'ai') return 'smart_toy'
  if (origin === 'rewritten') return 'auto_fix_high'
  return 'edit'
}
const getOriginColor = (origin?: PostOrigin) => {
  if (origin === 'ai') return 'purple'
  if (origin === 'rewritten') return 'deep-purple'
  return 'grey'
}

// Icone para tipo de conteudo
const getContentTypeIcon = (post: Post) => {
  if (post.aiMode === 'carousel' || (post.slides && post.slides.length > 0)) return 'view_carousel'
  if (post.aiType === 'story') return 'amp_stories'
  if (post.aiType === 'reels') return 'movie'
  if (post.aiType === 'article') return 'article'
  return 'notes'
}
const getContentTypeLabel = (post: Post) => {
  if (post.aiMode === 'carousel' || (post.slides && post.slides.length > 0)) return 'Carrossel'
  if (post.aiType === 'story') return 'Story'
  if (post.aiType === 'reels') return 'Reels'
  if (post.aiType === 'article') return 'Artigo'
  return 'Post'
}

// Verificar se post tem midia
const hasMedia = (post: Post) => {
  return (post.mediaUrls && post.mediaUrls.length > 0) || (post.slides && post.slides.length > 0)
}
const getFirstMediaUrl = (post: Post): string | null => {
  let url: string | null = null
  if (post.mediaUrls && post.mediaUrls.length > 0) {
    url = post.mediaUrls[0] ?? null
  } else if (post.slides && post.slides.length > 0) {
    const firstSlide = post.slides[0]
    if (firstSlide && firstSlide.imageUrl) {
      url = firstSlide.imageUrl
    }
  }
  return getMediaUrl(url)
}

const duplicatePost = async (post: Post) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...postData } = post
    await createPost({ ...postData, status: 'draft' })
    $q.notify({
      type: 'positive',
      message: 'Post duplicado com sucesso!',
      icon: 'content_copy'
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao duplicar post',
      icon: 'error'
    })
  }
}

const quickSchedule = async (post: Post) => {
  try {
    // Agenda para 1 hora a partir de agora
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await updatePost(post.id, { status: 'scheduled', scheduledAt })
    $q.notify({
      type: 'info',
      message: 'Post agendado para daqui 1 hora',
      icon: 'schedule',
      actions: [
        { label: 'Editar', color: 'white', handler: () => { window.location.href = `/posts/${post.id}/edit` } }
      ]
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao agendar post',
      icon: 'error'
    })
  }
}

// Abre dialogo de publicacao manual
const quickPublish = (post: Post) => {
  postToPublish.value = post
  publishDialog.value = true
}

// Copia conteudo do post para clipboard
const copyPostContent = async () => {
  if (!postToPublish.value) return
  try {
    await navigator.clipboard.writeText(postToPublish.value.content)
    $q.notify({
      type: 'positive',
      message: 'Conteudo copiado para a area de transferencia!',
      icon: 'content_copy',
      timeout: 2000
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao copiar conteudo',
      icon: 'error'
    })
  }
}

// Confirma publicacao manual
const confirmPublish = async () => {
  if (!postToPublish.value) return
  publishing.value = true
  try {
    await updatePost(postToPublish.value.id, { status: 'published' })
    publishDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Post marcado como publicado!',
      icon: 'check_circle'
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao publicar post',
      icon: 'error'
    })
  } finally {
    publishing.value = false
  }
}

const confirmDelete = (post: Post) => {
  postToDelete.value = post
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!postToDelete.value) return
  deleting.value = true
  try {
    await removePost(postToDelete.value.id)
    deleteDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Post excluido com sucesso!',
      icon: 'delete'
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Erro ao excluir post',
      icon: 'error'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchPosts(buildQuery()), fetchBrands()])
  loading.value = false
})
</script>

<style scoped>
.action-btn {
  opacity: 0.7;
  transition: opacity 0.2s, background-color 0.2s;
}

.action-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.08);
}

.q-item:hover .action-btn {
  opacity: 1;
}

.post-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.post-thumbnail-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
