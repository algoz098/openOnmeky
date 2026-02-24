<template>
  <q-page padding>
    <!-- Loading inicial da pagina -->
    <div v-if="loadingPage" class="text-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
      <div class="q-mt-md text-grey-7">Carregando...</div>
    </div>

    <template v-else>
      <!-- Overlay de loading durante operacoes -->
      <q-inner-loading :showing="saving || generating || rewriting || suggestingTags" label="Processando..." />

      <div class="row items-center q-mb-lg">
        <q-btn flat round icon="arrow_back" @click="router.back()" class="q-mr-md" :disable="saving || generating" />
        <div class="col">
          <h4 class="q-ma-none">{{ isEdit ? 'Editar Post' : 'Novo Post' }}</h4>
          <p class="text-grey-7 q-ma-none">Crie posts manualmente ou usando inteligencia artificial</p>
        </div>
        <AIUsageBadge :usage="lastUsage" :provider="lastProvider" :model="lastModel" :execution-count="executionCount" />
      </div>

      <div class="row q-col-gutter-lg" :class="{ 'disabled-form': saving || generating || rewriting || suggestingTags }">
      <div class="col-12 col-md-7">
        <!-- Configuracoes Basicas -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-select v-model="form.brandId" :options="brandOptions" label="Marca *" outlined emit-value map-options @update:model-value="loadBrand" />
              </div>
              <div class="col-6">
                <q-select v-model="form.platform" :options="platformOptions" label="Plataforma *" outlined emit-value map-options @update:model-value="updateCharLimit" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Geracao com IA -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="auto_awesome" class="q-mr-sm" color="purple" />
              Gerar com IA
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-select v-model="aiMode" :options="modeOptions" label="Modo de Geracao" outlined emit-value map-options />
              </div>
              <div class="col-6">
                <q-select v-if="aiMode === 'text'" v-model="aiType" :options="typeOptions" label="Tipo de Conteudo" outlined emit-value map-options />
                <q-select v-else v-model="targetFormat" :options="formatOptions" label="Formato de Destino" outlined emit-value map-options />
              </div>
            </div>
            <q-input v-model="aiPrompt" label="Topico / Assunto *" outlined placeholder="Ex: Lancamento de novo produto, Dicas de produtividade" class="q-mt-md" />
            <q-input v-model="aiContext" label="Contexto Adicional" outlined type="textarea" rows="2" placeholder="Informacoes extras para a IA considerar" class="q-mt-md" />
            <MediaPicker v-model="selectedImages" label="Imagens de referencia (opcional)" upload-label="Enviar imagem" gallery-label="Selecionar da galeria" filter="image" source="upload" :max-files="5" class="q-mt-md" />
            <q-select v-if="aiMode === 'text'" v-model="aiTone" :options="toneOptions" label="Tom (sobrescrever marca)" outlined emit-value map-options clearable class="q-mt-md" />

            <!-- Progresso de Geracao -->
            <div v-if="generating" class="q-mt-md">
              <div v-if="aiMode === 'carousel' && progress" class="q-mb-md">
                <div class="row items-center q-mb-sm">
                  <q-icon :name="getStepIcon(progress.step)" :color="getStepColor(progress.step)" size="24px" class="q-mr-sm" />
                  <div class="text-subtitle2">{{ progress.message }}</div>
                </div>
                <q-linear-progress :value="calculateProgress(progress)" color="primary" class="q-mb-sm" />
                <div class="row justify-between text-caption text-grey-7">
                  <span>{{ getStepLabel(progress.step) }}</span>
                  <span v-if="progress.subStep">Slide {{ progress.subStep.current }}/{{ progress.subStep.total }}</span>
                  <span v-else>Etapa {{ progress.stepIndex + 1 }}/{{ progress.totalSteps }}</span>
                </div>
              </div>
              <div v-if="!progress" class="text-center q-pa-md">
                <q-spinner size="40px" color="primary" />
                <div class="q-mt-sm text-grey-7">{{ aiMode === 'carousel' ? 'Iniciando geracao...' : 'Gerando conteudo...' }}</div>
              </div>
            </div>

            <div class="q-mt-md">
              <q-btn color="purple" icon="auto_awesome" label="Gerar Conteudo" @click="generateContent" :loading="generating" :disable="!canGenerate" />
            </div>
          </q-card-section>
        </q-card>

        <!-- Conteudo do Post -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Conteudo do Post</div>
            <q-input v-model="form.content" label="Conteudo *" outlined type="textarea" rows="8" :rules="[v => !!v || 'Conteudo obrigatorio']" counter :maxlength="charLimit">
              <template v-slot:hint>
                <span :class="charCount > charLimit ? 'text-negative' : ''">{{ charCount }}/{{ charLimit }} caracteres</span>
                <span v-if="charCount > charLimit" class="text-negative q-ml-sm">Limite excedido!</span>
              </template>
            </q-input>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn flat icon="autorenew" label="Reescrever" color="secondary" @click="rewriteContent" :disable="!form.content || !form.brandId" :loading="rewriting" />
              <q-btn flat icon="tag" label="Sugerir Hashtags" color="info" @click="suggestTags" :disable="!form.content" :loading="suggestingTags" />
            </div>
          </q-card-section>
        </q-card>

        <!-- Carousel Preview (quando gerado) -->
        <q-card v-if="carouselSlides.length > 0" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h6">Carousel ({{ carouselSlides.length }} slides)</div>
              <q-space />
              <q-chip dense color="purple" text-color="white" icon="aspect_ratio">
                {{ currentFormatLabel }}
              </q-chip>
              <q-btn flat dense icon="close" @click="clearCarousel" class="q-ml-sm" />
            </div>
            <div class="row q-col-gutter-md justify-center">
              <div v-for="slide in carouselSlides" :key="slide.index" :class="getSlideColClass">
                <q-card bordered class="slide-card">
                  <q-img v-if="slide.imageUrl" :src="getFullMediaUrl(slide.imageUrl)" :ratio="previewImageRatio" class="slide-image">
                    <div class="absolute-bottom text-caption bg-dark">{{ getPurposeLabel(slide.purpose) }}</div>
                    <!-- Badge de master image disponivel -->
                    <q-badge v-if="slide.masterImageUrl" color="purple" floating class="master-badge">
                      <q-icon name="star" size="12px" class="q-mr-xs" />
                      Master
                    </q-badge>
                  </q-img>
                  <div v-else class="slide-placeholder bg-grey-3 flex flex-center" :style="{ aspectRatio: previewImageRatio }">
                    <q-icon name="image" size="48px" color="grey-5" />
                  </div>
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-grey-7">{{ getPurposeLabel(slide.purpose) }}</div>
                    <div class="text-body2">{{ slide.text }}</div>
                    <!-- Botoes de acao do slide -->
                    <div class="row items-center q-mt-sm q-gutter-xs">
                      <!-- Botao de refazer imagem -->
                      <q-btn
                        flat
                        dense
                        size="sm"
                        icon="refresh"
                        :color="postId ? 'purple' : 'grey'"
                        :loading="regeneratingSlideIndex === slide.index"
                        :disable="!postId || regeneratingSlideIndex !== null"
                        @click="handleRegenerateSlide(slide.index)"
                      >
                        Refazer foto
                        <q-tooltip>{{ postId ? 'Regenerar imagem deste slide' : 'Salve o post para refazer imagens' }}</q-tooltip>
                      </q-btn>
                    </div>
                    <!-- Versoes disponiveis e botao para gerar mais -->
                    <div v-if="slide.masterImageUrl || slide.versions" class="q-mt-sm">
                      <div class="row items-center q-gutter-xs">
                        <q-badge
                          v-for="opt in aspectRatioOptions"
                          :key="opt.value"
                          :color="hasAspectRatio(slide, opt.value) ? 'positive' : 'grey-4'"
                          :text-color="hasAspectRatio(slide, opt.value) ? 'white' : 'grey-8'"
                          class="cursor-pointer"
                        >
                          <q-icon :name="opt.icon" size="12px" class="q-mr-xs" />
                          {{ opt.value }}
                          <q-tooltip>{{ hasAspectRatio(slide, opt.value) ? 'Versao gerada' : 'Clique para gerar' }}</q-tooltip>
                        </q-badge>
                      </div>
                      <!-- Menu para gerar novas proporcoes -->
                      <q-btn
                        v-if="getMissingAspectRatios(slide).length > 0 && postId"
                        flat dense size="sm" color="purple" icon="add_photo_alternate"
                        class="q-mt-xs"
                        :loading="derivingImage && selectedSlideForDerive === slide.index"
                        :disable="derivingImage"
                      >
                        Gerar nova proporcao
                        <q-menu>
                          <q-list dense>
                            <q-item
                              v-for="ratio in getMissingAspectRatios(slide)"
                              :key="ratio"
                              clickable v-close-popup
                              @click="deriveImageVersion(slide.index, ratio)"
                            >
                              <q-item-section avatar>
                                <q-icon :name="aspectRatioOptions.find(o => o.value === ratio)?.icon" />
                              </q-item-section>
                              <q-item-section>{{ aspectRatioOptions.find(o => o.value === ratio)?.label }}</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                      <div v-else-if="!postId && getMissingAspectRatios(slide).length > 0" class="text-caption text-grey-7 q-mt-xs">
                        Salve o post para gerar outras proporcoes
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Agendamento -->
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Agendamento</div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-select v-model="form.status" :options="statusOptions" label="Status" outlined emit-value map-options />
              </div>
              <div class="col-6" v-if="form.status === 'scheduled'">
                <q-input v-model="form.scheduledAt" label="Agendar para" outlined type="datetime-local" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Preview e Versoes -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="sticky" style="top: 80px">
          <q-tabs v-model="previewTab" dense align="left" class="text-grey-7">
            <q-tab name="preview" label="Preview" icon="preview" />
            <q-tab v-if="isEdit" name="versions" label="Versoes" icon="history" @click="loadVersions" />
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="previewTab" animated>
            <q-tab-panel name="preview" class="q-pa-none">
              <q-card-section>
                <div class="row items-center q-mb-md">
                  <q-space />
                  <q-chip dense :color="getPlatformColor(form.platform)" text-color="white" size="sm">
                    {{ form.platform }}
                  </q-chip>
                </div>
                <SocialPreview
                  :platform="form.platform"
                  :content="form.content"
                  :brand-name="selectedBrand?.name ?? ''"
                  :media="form.mediaUrls"
                  :slides="carouselSlides"
                  :loading="generating || loadingBrand"
                  :aspect-ratio="targetAspectRatio"
                  :target-format="targetFormat"
                />
              </q-card-section>
            </q-tab-panel>
            <q-tab-panel v-if="isEdit" name="versions" class="q-pa-none">
              <q-card-section>
                <div v-if="loadingVersions" class="text-center q-pa-md">
                  <q-spinner size="24px" color="primary" />
                </div>
                <div v-else-if="versions.length === 0" class="text-grey-7 text-caption q-pa-sm">
                  Nenhuma versao encontrada
                </div>
                <q-list v-else dense separator>
                  <q-item v-for="v in versions" :key="v.id" :class="{ 'bg-blue-1': v.isActive }">
                    <q-item-section avatar>
                      <q-avatar :color="v.source === 'ai' ? 'purple' : 'blue-grey'" text-color="white" size="32px">
                        <q-icon :name="v.source === 'ai' ? 'auto_awesome' : 'edit'" size="18px" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        Versao {{ v.version }}
                        <q-badge v-if="v.isActive" color="positive" class="q-ml-sm">Ativa</q-badge>
                      </q-item-label>
                      <q-item-label caption>
                        {{ formatVersionDate(v.createdAt) }}
                        <span v-if="v.totalTokens"> | {{ v.totalTokens }} tokens</span>
                        <span v-if="v.costUsd"> | {{ formatCost(v.costUsd) }}</span>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        v-if="!v.isActive"
                        flat
                        dense
                        size="sm"
                        color="primary"
                        label="Aplicar"
                        :loading="loadingVersions"
                        @click="handleApplyVersion(v)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-tab-panel>
          </q-tab-panels>
          <q-separator />
          <q-card-actions>
            <q-btn flat label="Cancelar" @click="router.back()" />
            <q-space />
            <q-btn flat icon="content_copy" label="Copiar" @click="copyContent" :disable="!form.content" />
            <q-btn flat label="Salvar Rascunho" @click="saveDraft" :loading="saving" />
            <q-btn color="primary" icon="send" label="Publicar" @click="openPublishDialog" :loading="saving" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

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

        <q-card-section>
          <q-banner class="bg-blue-1 text-blue-9 q-mb-md" rounded>
            <template #avatar>
              <q-icon name="info" color="blue" />
            </template>
            <div class="text-body2">
              <strong>Publicacao Manual</strong><br />
              A publicacao automatica no {{ form.platform }} ainda nao esta disponivel.
              Copie o conteudo abaixo e publique diretamente na plataforma.
            </div>
          </q-banner>

          <div class="text-subtitle2 q-mb-xs">Conteudo do Post:</div>
          <q-card flat bordered class="bg-grey-1 q-pa-md q-mb-md">
            <pre class="text-body2" style="white-space: pre-wrap; word-wrap: break-word; margin: 0;">{{ form.content }}</pre>
          </q-card>

          <div class="row q-gutter-sm q-mb-md">
            <q-btn
              color="primary"
              icon="content_copy"
              label="Copiar Conteudo"
              @click="copyContent"
              class="col"
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-subtitle2 q-mb-sm">Instrucoes:</div>
          <ol class="text-body2 q-pl-md q-ma-none">
            <li>Clique em "Copiar Conteudo" acima</li>
            <li>Abra o {{ form.platform }} em outra janela ou no celular</li>
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
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePosts } from 'src/composables/use-posts'
import { useBrands } from 'src/composables/use-brands'
import { usePlatforms } from 'src/composables/use-platforms'
import { useAI } from 'src/composables/use-ai'
import { useMedia } from 'src/composables/use-media'
import { usePostVersions } from 'src/composables/use-post-versions'
import { host, api } from 'src/api'
import MediaPicker, { type SelectedMedia } from 'src/components/MediaPicker.vue'
import SocialPreview from 'src/components/SocialPreview.vue'
import AIUsageBadge from 'src/components/AIUsageBadge.vue'
import type { Brand, Post, AIImage, SlidePurpose, CarouselSlide, AIMode, AIType, AITone, AspectRatio, CreativeBriefing, AIUsageInfo, AIExecution, PostVersion } from 'src/types'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { getPost, createPost, updatePost } = usePosts()
const { brands, fetchBrands, getBrand, currentBrand } = useBrands()
const { platforms, fetchPlatforms, getCharLimit } = usePlatforms()
const { generateText, generateCarousel, rewrite, suggestHashtags, regenerateSlideImage, progress, clearProgress, reconnectToProgress, disconnectProgress } = useAI()
const { fileToAIImage, mediaToAIImage } = useMedia()
const { fetchVersions, getVersionsForPost, applyVersion, loading: loadingVersions } = usePostVersions()

// Converte URL relativa para absoluta
const getFullMediaUrl = (url: string): string => {
  if (url.startsWith('http')) return url
  return `${host}${url}`
}

const postId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEdit = computed(() => !!postId.value)

const form = reactive({ brandId: null as number | null, platform: 'instagram', content: '', status: 'draft', scheduledAt: '', mediaUrls: [] as string[], aiPrompt: '' })
const selectedBrand = ref<Brand | null>(null)
const loadingPage = ref(true)
const loadingBrand = ref(false)
const saving = ref(false)
const generating = ref(false)
const rewriting = ref(false)
const suggestingTags = ref(false)
const carouselSlides = ref<CarouselSlide[]>([])
const creativeBriefing = ref<CreativeBriefing | undefined>(undefined)
const derivingImage = ref(false)
const selectedSlideForDerive = ref<number | null>(null)
const regeneratingSlideIndex = ref<number | null>(null)

// Estado do post carregado (para verificar aiState)
const postAiState = ref<'idle' | 'loading' | 'error'>('idle')

// Computed para verificar se pode gerar conteudo
const canGenerate = computed(() => {
  return form.brandId && aiPrompt.value && postAiState.value !== 'loading'
})

// Estado para historico de versoes
const versions = computed(() => postId.value ? getVersionsForPost(postId.value).value : [])

// Estado para tabs de preview/versoes
const previewTab = ref('preview')

// Estado para exibir uso/custo da ultima geracao (compatibilidade)
const lastUsage = ref<AIUsageInfo | undefined>(undefined)
const lastProvider = ref<string | undefined>(undefined)
const lastModel = ref<string | undefined>(undefined)

// Estado para multiplas execucoes de IA (acumuladas)
const aiExecutions = ref<AIExecution[]>([])
const totalPromptTokens = ref(0)
const totalCompletionTokens = ref(0)
const totalTokensUsed = ref(0)
const totalCostUsd = ref(0)
const totalImagesGenerated = ref(0)
const executionCount = ref(0)

// AI Dialog state
const aiPrompt = ref('')
const aiContext = ref('')
const aiMode = ref<'text' | 'carousel'>('text')
const aiType = ref('post')
const aiTone = ref('')
const selectedImages = ref<SelectedMedia[]>([])

// Formato de destino e proporcao para carousels
const targetFormat = ref('feed')
const targetAspectRatio = ref<AspectRatio>('1:1')

const formatOptions = [
  { label: 'Feed (Quadrado 1:1)', value: 'feed' },
  { label: 'Feed (Retrato 4:5)', value: 'feed-portrait' },
  { label: 'Stories (9:16)', value: 'stories' },
  { label: 'Reels (9:16)', value: 'reels' },
  { label: 'Paisagem (16:9)', value: 'landscape' }
]

// Opcoes de proporcao para derivacao (menu de derivar versoes)
const aspectRatioOptions: { label: string; value: AspectRatio; icon: string }[] = [
  { label: 'Quadrado (1:1)', value: '1:1', icon: 'crop_square' },
  { label: 'Retrato (4:5)', value: '4:5', icon: 'crop_portrait' },
  { label: 'Stories (9:16)', value: '9:16', icon: 'smartphone' },
  { label: 'Paisagem (16:9)', value: '16:9', icon: 'crop_landscape' }
]

// Auto-selecionar proporcao baseado no formato
watch(targetFormat, (newFormat) => {
  if (newFormat === 'stories' || newFormat === 'reels') {
    targetAspectRatio.value = '9:16'
  } else if (newFormat === 'landscape') {
    targetAspectRatio.value = '16:9'
  } else if (newFormat === 'feed-portrait') {
    targetAspectRatio.value = '4:5'
  } else {
    // feed (quadrado)
    targetAspectRatio.value = '1:1'
  }
})

// Watch para detectar quando geracao termina (apos reconexao por refresh)
watch(progress, async (newProgress) => {
  if (newProgress && (newProgress.step === 'completed' || newProgress.step === 'failed')) {
    // Geracao terminou, atualiza dados do post
    generating.value = false
    disconnectProgress()

    if (newProgress.step === 'completed' && isEdit.value && postId.value) {
      // Recarrega o post para obter os novos dados (slides, versao, etc.)
      try {
        const updatedPost = await getPost(postId.value)
        Object.assign(form, updatedPost)

        // Atualiza slides e briefing
        if (updatedPost.slides && updatedPost.slides.length > 0) {
          carouselSlides.value = updatedPost.slides
        }
        if (updatedPost.creativeBriefing) {
          creativeBriefing.value = updatedPost.creativeBriefing
        }

        // Recarrega versoes
        void fetchVersions(postId.value)

        $q.notify({ type: 'positive', message: 'Conteudo gerado com sucesso!' })
      } catch {
        $q.notify({ type: 'negative', message: 'Erro ao recarregar dados do post' })
      }
    } else if (newProgress.step === 'failed') {
      $q.notify({ type: 'negative', message: 'Erro na geracao de conteudo' })
    }
  }
})

const charLimit = ref(2200)
const charCount = computed(() => form.content.length)
const brandOptions = computed(() => brands.value.map(b => ({ label: b.name, value: b.id })))
const platformOptions = computed(() => platforms.value.map(p => ({ label: p.displayName, value: p.name })))
const statusOptions = [
  { label: 'Rascunho', value: 'draft' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Agendado', value: 'scheduled' },
  { label: 'Publicado', value: 'published' }
]

// Estado do dialogo de publicacao
const publishDialog = ref(false)
const publishing = ref(false)

// Funcao para copiar conteudo para o clipboard
const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(form.content)
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

// Funcao para abrir dialogo de publicacao
const openPublishDialog = () => {
  if (!form.content.trim()) {
    $q.notify({
      type: 'warning',
      message: 'O post precisa ter conteudo antes de ser publicado',
      icon: 'warning'
    })
    return
  }
  publishDialog.value = true
}

// Funcao para confirmar publicacao manual
const confirmPublish = async () => {
  publishing.value = true
  try {
    form.status = 'published'
    await savePost()
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

const modeOptions = [
  { label: 'Texto simples', value: 'text' },
  { label: 'Carousel (4 slides)', value: 'carousel' }
]
const typeOptions = [
  { label: 'Post', value: 'post' },
  { label: 'Story', value: 'story' },
  { label: 'Reels/Short', value: 'reels' },
  { label: 'Artigo', value: 'article' }
]
const toneOptions = [
  { label: 'Formal', value: 'formal' },
  { label: 'Casual', value: 'casual' },
  { label: 'Humoristico', value: 'humoristico' },
  { label: 'Inspirador', value: 'inspirador' }
]

// Ratio da imagem baseado na proporcao selecionada (largura/altura)
const previewImageRatio = computed(() => {
  switch (targetAspectRatio.value) {
    case '1:1': return 1
    case '4:5': return 4 / 5
    case '9:16': return 9 / 16
    case '16:9': return 16 / 9
    default: return 1
  }
})

// Label do formato atual para exibicao
const currentFormatLabel = computed(() => {
  const option = formatOptions.find(f => f.value === targetFormat.value)
  return option?.label || 'Feed (Quadrado 1:1)'
})

// Classe da coluna baseada no formato (formatos verticais ficam menores)
const getSlideColClass = computed(() => {
  if (targetAspectRatio.value === '9:16') {
    return 'col-4 col-md-3' // Vertical: colunas menores
  } else if (targetAspectRatio.value === '16:9') {
    return 'col-12 col-md-6' // Paisagem: colunas maiores
  } else {
    return 'col-6 col-md-6' // Quadrado e 4:5: tamanho medio
  }
})

const purposeLabels: Record<SlidePurpose, string> = {
  hook: '1. Chamada',
  features: '2. Caracteristicas',
  summary: '3. Resumo',
  cta: '4. CTA'
}

const getPurposeLabel = (purpose: string): string => purposeLabels[purpose as SlidePurpose] || purpose

// Mapeamento de icones e labels para etapas de geracao
const stepConfig: Record<string, { icon: string; label: string; color: string }> = {
  loading_brand: { icon: 'storefront', label: 'Carregando marca', color: 'primary' },
  creative_direction: { icon: 'palette', label: 'Direcao criativa', color: 'purple' },
  analysis: { icon: 'analytics', label: 'Analise', color: 'blue' },
  text_creation: { icon: 'edit_note', label: 'Criacao de textos', color: 'teal' },
  compliance: { icon: 'verified', label: 'Validacao', color: 'green' },
  image_generation: { icon: 'image', label: 'Geracao de imagens', color: 'orange' },
  text_overlay: { icon: 'text_fields', label: 'Adicionando textos', color: 'deep-purple' },
  completed: { icon: 'check_circle', label: 'Concluido', color: 'positive' },
  failed: { icon: 'error', label: 'Erro', color: 'negative' }
}

const getStepIcon = (step: string): string => stepConfig[step]?.icon || 'pending'
const getStepLabel = (step: string): string => stepConfig[step]?.label || step
const getStepColor = (step: string): string => stepConfig[step]?.color || 'grey'

// Calcula progresso considerando sub-etapas
const calculateProgress = (prog: { stepIndex: number; totalSteps: number; subStep?: { current: number; total: number } }): number => {
  const baseProgress = prog.stepIndex / prog.totalSteps
  if (prog.subStep) {
    const stepWeight = 1 / prog.totalSteps
    const subProgress = (prog.subStep.current / prog.subStep.total) * stepWeight
    return baseProgress + subProgress
  }
  return (prog.stepIndex + 1) / prog.totalSteps
}

const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    instagram: 'pink',
    facebook: 'blue',
    twitter: 'light-blue',
    x: 'grey-9',
    linkedin: 'indigo',
    tiktok: 'black',
    youtube: 'red'
  }
  return colors[platform.toLowerCase()] || 'grey'
}

const loadBrand = async () => {
  if (!form.brandId) return
  loadingBrand.value = true
  try {
    selectedBrand.value = await getBrand(form.brandId)
  } finally {
    loadingBrand.value = false
  }
}
const updateCharLimit = () => { charLimit.value = getCharLimit(form.platform) || 2200 }
const clearCarousel = () => {
  carouselSlides.value = []
  creativeBriefing.value = undefined
}

// Adiciona uma nova execucao de IA e atualiza os totais acumulados
const addAIExecution = (
  type: string,
  provider: string,
  model: string,
  usage: AIUsageInfo | undefined,
  imagesGenerated = 0
) => {
  if (!usage) return

  // Cria a execucao com UUID unico
  const execution: AIExecution = {
    id: crypto.randomUUID(),
    type,
    provider,
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    costUsd: usage.costUsd || 0,
    costBreakdown: usage.costBreakdown || {
      inputCost: 0,
      outputCost: 0,
      imageCost: 0,
      videoCost: 0
    },
    timestamp: new Date().toISOString()
  }

  // Adiciona agentBreakdown apenas se existir
  if (usage.agentBreakdown && usage.agentBreakdown.length > 0) {
    execution.agentBreakdown = usage.agentBreakdown
  }

  // Adiciona imagesGenerated apenas se tiver imagens
  if (imagesGenerated > 0) {
    execution.imagesGenerated = imagesGenerated
  }

  // Adiciona ao array de execucoes
  aiExecutions.value.push(execution)

  // Atualiza totais acumulados
  totalPromptTokens.value += usage.promptTokens
  totalCompletionTokens.value += usage.completionTokens
  totalTokensUsed.value += usage.totalTokens
  totalCostUsd.value += usage.costUsd || 0
  totalImagesGenerated.value += imagesGenerated
  executionCount.value++

  // Atualiza lastUsage para compatibilidade (com totais acumulados para o badge)
  // Combina todos os agentBreakdown de todas as execucoes
  const allAgentBreakdown = aiExecutions.value
    .filter(e => e.agentBreakdown && e.agentBreakdown.length > 0)
    .flatMap(e => e.agentBreakdown || [])

  const usageData: AIUsageInfo = {
    promptTokens: totalPromptTokens.value,
    completionTokens: totalCompletionTokens.value,
    totalTokens: totalTokensUsed.value,
    costUsd: totalCostUsd.value,
    costBreakdown: {
      inputCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.inputCost, 0),
      outputCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.outputCost, 0),
      imageCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.imageCost, 0),
      videoCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.videoCost, 0)
    }
  }
  if (allAgentBreakdown.length > 0) {
    usageData.agentBreakdown = allAgentBreakdown
  }
  lastUsage.value = usageData
  lastProvider.value = provider
  lastModel.value = model
}

// Verifica se um slide tem determinada proporcao gerada
const hasAspectRatio = (slide: CarouselSlide, ratio: AspectRatio): boolean => {
  return !!slide.versions?.[ratio]
}

// Retorna a lista de proporcoes faltantes para um slide
const getMissingAspectRatios = (slide: CarouselSlide): AspectRatio[] => {
  return aspectRatioOptions
    .map(opt => opt.value)
    .filter(ratio => !hasAspectRatio(slide, ratio))
}

// Deriva uma nova versao da imagem em uma proporcao diferente
const deriveImageVersion = async (slideIndex: number, aspectRatio: AspectRatio) => {
  if (!postId.value) {
    $q.notify({ type: 'warning', message: 'Salve o post antes de gerar novas proporcoes' })
    return
  }

  derivingImage.value = true
  selectedSlideForDerive.value = slideIndex

  try {
    const result = await api.service('posts/derive-image').create({
      postId: postId.value,
      slideIndex,
      aspectRatio
    })

    // Atualiza slide local com nova versao
    carouselSlides.value[slideIndex] = result.slide

    $q.notify({ type: 'positive', message: `Versao ${aspectRatio} gerada com sucesso!` })
  } catch (err) {
    $q.notify({ type: 'negative', message: err instanceof Error ? err.message : 'Erro ao gerar versao' })
  } finally {
    derivingImage.value = false
    selectedSlideForDerive.value = null
  }
}

// Refaz a imagem de um slide especifico do carousel
const handleRegenerateSlide = async (slideIndex: number) => {
  if (!postId.value) {
    $q.notify({
      type: 'warning',
      message: 'Salve o post primeiro para poder refazer imagens individuais'
    })
    return
  }

  regeneratingSlideIndex.value = slideIndex

  try {
    const result = await regenerateSlideImage(postId.value, slideIndex)

    if (result?.slide) {
      // Atualiza o slide no array local
      const updatedSlides = [...carouselSlides.value]
      updatedSlides[slideIndex] = result.slide
      carouselSlides.value = updatedSlides

      // Atualiza mediaUrls se necessario
      form.mediaUrls = updatedSlides
        .filter(s => s.imageUrl)
        .map(s => s.imageUrl!)

      $q.notify({
        type: 'positive',
        message: `Imagem do slide ${slideIndex + 1} regenerada com sucesso!`
      })
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: `Erro ao regenerar imagem: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
    })
  } finally {
    regeneratingSlideIndex.value = null
  }
}

const generateContent = async () => {
  if (!form.brandId || !aiPrompt.value) return

  // Verifica se ja ha uma geracao em andamento para este post
  if (isEdit.value && postId.value) {
    try {
      const post = await getPost(postId.value)
      if (post.aiState === 'loading') {
        $q.notify({
          type: 'warning',
          message: 'Ja existe uma geracao em andamento para este post. Aguarde a conclusao.'
        })
        return
      }
    } catch {
      // Se nao conseguir verificar, continua (sera verificado no backend)
    }
  }

  generating.value = true
  postAiState.value = 'loading'
  clearProgress()

  // Se for post novo (nao e edit), salvar como draft primeiro para obter postId
  // Isso permite rastreabilidade completa de todas as requisicoes de IA
  let currentPostId = postId.value
  if (!isEdit.value) {
    try {
      const draftData: Partial<Post> = {
        brandId: form.brandId,
        platform: form.platform,
        content: '', // Sera preenchido apos geracao
        status: 'draft',
        aiPrompt: aiPrompt.value
      }
      if (aiContext.value) draftData.aiContext = aiContext.value
      if (aiMode.value) draftData.aiMode = aiMode.value as AIMode
      if (aiType.value) draftData.aiType = aiType.value as AIType
      if (aiTone.value) draftData.aiTone = aiTone.value as AITone
      // Salvar imagens de referencia
      if (selectedImages.value.length > 0) {
        draftData.aiReferenceImages = selectedImages.value
          .map(img => img.url)
          .filter((url): url is string => !!url)
      }

      const created = await createPost(draftData)
      currentPostId = created.id

      // Redirecionar para tela de edicao (sem interromper loading)
      await router.replace(`/posts/${currentPostId}/edit`)
    } catch {
      generating.value = false
      $q.notify({ type: 'negative', message: 'Erro ao salvar rascunho' })
      return
    }
  }

  let prompt = aiContext.value ? `${aiPrompt.value}\n\nContexto: ${aiContext.value}` : aiPrompt.value
  if (aiTone.value) prompt = `${prompt}\n\nTom: ${aiTone.value}`

  // Converte imagens selecionadas para formato AIImage
  let images: AIImage[] | undefined
  if (selectedImages.value.length > 0) {
    const imagePromises = selectedImages.value.map(async (media) => {
      if (media.media) return mediaToAIImage(media.media)
      else if (media.file) return fileToAIImage(media.file)
      return { url: media.url, mimeType: media.mimeType }
    })
    images = await Promise.all(imagePromises)
  }

  try {
    if (aiMode.value === 'carousel') {
      // Monta opcoes sem propriedades undefined (exactOptionalPropertyTypes)
      const carouselOptions: { saveAsPost?: boolean; targetAspectRatio?: AspectRatio; postId?: number } = {
        saveAsPost: false,
        targetAspectRatio: targetAspectRatio.value
      }
      if (currentPostId) carouselOptions.postId = currentPostId

      const result = await generateCarousel(
        form.brandId,
        prompt,
        form.platform,
        carouselOptions,
        images
      )
      if (result?.slides) {
        carouselSlides.value = result.slides
        // Salva o briefing criativo para regeneracao futura
        creativeBriefing.value = result.briefing
        // Usa a caption gerada pela IA como conteudo do post (descricao que aparece abaixo do carrossel)
        // Os textos dos slides (slides[].text) sao apenas para overlay nas imagens
        form.content = result.content || ''
        form.aiPrompt = aiPrompt.value
        form.mediaUrls = result.slides.filter(s => s.imageUrl).map(s => s.imageUrl!)
        // Adiciona execucao ao historico (carousels geram 4 imagens)
        const imagesCount = result.slides.filter(s => s.imageUrl).length
        addAIExecution('carousel', result.provider, result.model || 'orchestrator', result.usage, imagesCount)
        $q.notify({ type: 'positive', message: 'Carousel gerado com sucesso!' })
      }
    } else {
      const result = await generateText(form.brandId, prompt, form.platform, undefined, images)
      if (result) {
        form.content = result.content
        form.aiPrompt = aiPrompt.value
        // Adiciona execucao ao historico
        addAIExecution('generate', result.provider, result.model || 'unknown', result.usage)
      }
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: err instanceof Error ? err.message : 'Erro ao gerar conteudo' })
  } finally {
    generating.value = false
    postAiState.value = 'idle'
  }
}

const rewriteContent = async () => {
  if (!form.brandId || !form.content) return
  rewriting.value = true
  const result = await rewrite(form.brandId, form.content, form.platform)
  if (result) {
    form.content = result.content
    // Adiciona execucao ao historico
    addAIExecution('rewrite', result.provider, result.model || 'unknown', result.usage)
  }
  rewriting.value = false
}

const suggestTags = async () => {
  if (!form.brandId || !form.content) return
  suggestingTags.value = true
  const result = await suggestHashtags(form.brandId, form.content, form.platform)
  if (result?.content) {
    form.content += '\n\n' + result.content
    // Adiciona execucao ao historico
    addAIExecution('suggest-hashtags', result.provider, result.model || 'unknown', result.usage)
  }
  suggestingTags.value = false
}

const saveDraft = async () => { form.status = 'draft'; await savePost() }

// Funcao para carregar versoes do post
const loadVersions = async () => {
  if (!postId.value) return
  await fetchVersions(postId.value)
}

// Funcao para aplicar uma versao ao post
const handleApplyVersion = async (version: PostVersion) => {
  try {
    await applyVersion(version.id)
    // Atualiza o formulario com os dados da versao
    form.content = version.content || ''
    if (version.slides) {
      carouselSlides.value = version.slides
      form.mediaUrls = version.slides.filter(s => s.imageUrl).map(s => s.imageUrl!)
    }
    if (version.creativeBriefing) {
      creativeBriefing.value = version.creativeBriefing
    }
    $q.notify({ type: 'positive', message: `Versao ${version.version} aplicada com sucesso` })
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao aplicar versao' })
  }
}

// Formata data para exibicao
const formatVersionDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Formata custo para exibicao
const formatCost = (cost?: number): string => {
  if (cost === undefined || cost === null) return '-'
  return `$${cost.toFixed(4)}`
}

const savePost = async () => {
  if (!form.brandId) return
  saving.value = true
  try {
    const postData: Partial<Post> = {
      platform: form.platform,
      content: form.content,
      status: form.status as Post['status'],
      mediaUrls: form.mediaUrls
    }
    if (form.scheduledAt) postData.scheduledAt = form.scheduledAt

    // Salvar campos de IA
    if (aiPrompt.value) postData.aiPrompt = aiPrompt.value
    if (aiContext.value) postData.aiContext = aiContext.value
    if (aiMode.value) postData.aiMode = aiMode.value as AIMode
    if (aiType.value) postData.aiType = aiType.value as AIType
    if (aiTone.value) postData.aiTone = aiTone.value as AITone

    // Salvar URLs das imagens de referencia
    if (selectedImages.value.length > 0) {
      postData.aiReferenceImages = selectedImages.value
        .map(img => img.url)
        .filter((url): url is string => !!url)
    }

    // Salvar slides do carrossel e briefing criativo se existirem
    if (carouselSlides.value.length > 0) {
      postData.slides = carouselSlides.value
      if (creativeBriefing.value) {
        postData.creativeBriefing = creativeBriefing.value
      }
    }

    // Salvar dados de uso de IA (ultima geracao - compatibilidade)
    if (lastUsage.value) {
      postData.lastUsagePromptTokens = lastUsage.value.promptTokens
      postData.lastUsageCompletionTokens = lastUsage.value.completionTokens
      postData.lastUsageTotalTokens = lastUsage.value.totalTokens
      if (lastUsage.value.costUsd !== undefined) {
        postData.lastUsageCostUsd = lastUsage.value.costUsd
      }
      if (lastUsage.value.costBreakdown) {
        postData.lastUsageCostBreakdown = lastUsage.value.costBreakdown
      }
    }
    if (lastProvider.value) {
      postData.lastUsageProvider = lastProvider.value
    }
    if (lastModel.value) {
      postData.lastUsageModel = lastModel.value
    }

    // Salvar dados de multiplas execucoes de IA (acumuladas)
    if (aiExecutions.value.length > 0) {
      postData.aiExecutions = aiExecutions.value
      postData.totalPromptTokens = totalPromptTokens.value
      postData.totalCompletionTokens = totalCompletionTokens.value
      postData.totalTokensUsed = totalTokensUsed.value
      postData.totalCostUsd = totalCostUsd.value
      postData.totalImagesGenerated = totalImagesGenerated.value
      postData.executionCount = executionCount.value
    }

    if (isEdit.value) {
      await updatePost(postId.value!, postData)
    } else {
      // brandId so e necessario no create
      postData.brandId = form.brandId
      await createPost(postData)
    }
    await router.push('/posts')
  } finally { saving.value = false }
}

onMounted(async () => {
  loadingPage.value = true
  try {
    await Promise.all([fetchBrands(), fetchPlatforms()])
    const brandIdParam = route.query.brandId
    const contentParam = route.query.content
    // Prioridade: query param > post existente > marca selecionada no header
    if (brandIdParam) {
      form.brandId = Number(brandIdParam)
    } else if (currentBrand.value) {
      form.brandId = currentBrand.value.id
    }
    if (contentParam && typeof contentParam === 'string') form.content = contentParam
    if (isEdit.value) {
      const post = await getPost(postId.value!)
      Object.assign(form, post)

      // Restaurar campos de IA
      if (post.aiPrompt) aiPrompt.value = post.aiPrompt
      if (post.aiContext) aiContext.value = post.aiContext
      if (post.aiMode) aiMode.value = post.aiMode
      if (post.aiType) aiType.value = post.aiType
      if (post.aiTone) aiTone.value = post.aiTone

      // Restaurar imagens de referencia
      if (post.aiReferenceImages && post.aiReferenceImages.length > 0) {
        selectedImages.value = post.aiReferenceImages.map(url => ({
          url,
          mimeType: 'image/jpeg',
          originalName: url.split('/').pop() || 'image.jpg'
        }))
      }

      // Restaurar slides do carrossel e briefing criativo se existirem
      if (post.slides && post.slides.length > 0) {
        carouselSlides.value = post.slides
      }
      if (post.creativeBriefing) {
        creativeBriefing.value = post.creativeBriefing
      }

      // Restaurar dados de multiplas execucoes de IA (acumuladas) - novos campos
      // Garante que aiExecutions e um array (pode vir como string JSON do SQLite)
      const executions = Array.isArray(post.aiExecutions) ? post.aiExecutions : []
      if (executions.length > 0) {
        aiExecutions.value = executions
        totalPromptTokens.value = post.totalPromptTokens || 0
        totalCompletionTokens.value = post.totalCompletionTokens || 0
        totalTokensUsed.value = post.totalTokensUsed || 0
        totalCostUsd.value = post.totalCostUsd || 0
        totalImagesGenerated.value = post.totalImagesGenerated || 0
        executionCount.value = post.executionCount || 0

        // Reconstroi lastUsage para o badge
        // Combina todos os agentBreakdown de todas as execucoes
        const allAgentBreakdown = aiExecutions.value
          .filter(e => e.agentBreakdown && e.agentBreakdown.length > 0)
          .flatMap(e => e.agentBreakdown || [])

        const restoredUsage: AIUsageInfo = {
          promptTokens: totalPromptTokens.value,
          completionTokens: totalCompletionTokens.value,
          totalTokens: totalTokensUsed.value,
          costUsd: totalCostUsd.value,
          costBreakdown: {
            inputCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.inputCost, 0),
            outputCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.outputCost, 0),
            imageCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.imageCost, 0),
            videoCost: aiExecutions.value.reduce((sum, e) => sum + e.costBreakdown.videoCost, 0)
          }
        }
        if (allAgentBreakdown.length > 0) {
          restoredUsage.agentBreakdown = allAgentBreakdown
        }
        lastUsage.value = restoredUsage
        // Usa o ultimo provider/model registrado
        const lastExec = aiExecutions.value[aiExecutions.value.length - 1]
        if (lastExec) {
          lastProvider.value = lastExec.provider
          lastModel.value = lastExec.model
        }
      } else if (post.lastUsageTotalTokens) {
        // Fallback para dados legados (compatibilidade)
        const usageData: AIUsageInfo = {
          promptTokens: post.lastUsagePromptTokens || 0,
          completionTokens: post.lastUsageCompletionTokens || 0,
          totalTokens: post.lastUsageTotalTokens
        }
        if (post.lastUsageCostUsd !== undefined) {
          usageData.costUsd = post.lastUsageCostUsd
        }
        if (post.lastUsageCostBreakdown) {
          usageData.costBreakdown = post.lastUsageCostBreakdown
        }
        lastUsage.value = usageData
        if (post.lastUsageProvider) {
          lastProvider.value = post.lastUsageProvider
        }
        if (post.lastUsageModel) {
          lastModel.value = post.lastUsageModel
        }
      }
    }
    if (form.brandId) await loadBrand()
    updateCharLimit()

    // Carrega versoes se for modo de edicao
    if (isEdit.value && postId.value) {
      void fetchVersions(postId.value)

      // Verifica se ha geracao de IA em andamento (apos refresh da pagina)
      // Busca o post novamente para garantir que temos os campos aiState e activeLogId
      const currentPost = await getPost(postId.value)
      console.log('[PostEditor] Verificando estado de IA:', {
        postId: currentPost.id,
        aiState: currentPost.aiState,
        activeLogId: currentPost.activeLogId
      })

      // Atualiza estado reativo do post para desabilitar botao de gerar
      postAiState.value = currentPost.aiState || 'idle'

      if (currentPost.aiState === 'loading' && currentPost.activeLogId) {
        console.log('[PostEditor] Detectado geracao em andamento, reconectando...')
        // Reconecta aos eventos de progresso
        // A funcao reconnectToProgress agora busca o status atual do log
        // e recupera o lastProgress antes de se inscrever nos eventos
        generating.value = true
        aiMode.value = 'carousel' // Assume carousel, pode ser ajustado
        const disconnect = await reconnectToProgress(currentPost.activeLogId)
        console.log('[PostEditor] Resultado da reconexao:', { disconnect: !!disconnect })
        // Se disconnect for null, a geracao ja terminou
        if (!disconnect) {
          generating.value = false
          postAiState.value = 'idle'
        }
      }
    }
  } finally {
    loadingPage.value = false
  }
})

// Limpa conexao de progresso ao desmontar o componente
onUnmounted(() => {
  disconnectProgress()
})
</script>

<style scoped>
.slide-card { height: 100%; }
.slide-placeholder { aspect-ratio: 1; }
.slide-image { aspect-ratio: 1; }
.sticky { position: sticky; }
.disabled-form {
  pointer-events: none;
  opacity: 0.6;
}
.master-badge {
  top: 8px;
  right: 8px;
}
</style>

