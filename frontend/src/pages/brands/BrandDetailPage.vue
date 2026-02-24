<template>
  <q-page padding>
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="50px" color="primary" />
    </div>

    <template v-else-if="brand">
      <div class="row items-center q-mb-lg">
        <q-btn flat round icon="arrow_back" @click="router.back()" class="q-mr-md" />
        <q-avatar :color="avatarColor" text-color="white" size="56px" class="q-mr-md">
          {{ brand.name.substring(0, 2).toUpperCase() }}
        </q-avatar>
        <div class="col">
          <h4 class="q-ma-none">{{ brand.name }}</h4>
          <p class="text-grey-7 q-ma-none">{{ brand.sector || 'Sem setor definido' }}</p>
        </div>
        <div class="col-auto">
          <q-btn flat icon="edit" label="Editar" :to="`/brands/${brand.id}/edit`" class="q-mr-sm" />
          <q-btn color="primary" icon="add" label="Novo Post" :to="`/posts/create?brandId=${brand.id}`" />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-8">
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Descricao</div>
              <p class="text-grey-8">{{ brand.description || 'Sem descricao' }}</p>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Tom de Voz e Comunicacao</div>
              <div class="row q-col-gutter-md">
                <div class="col-6">
                  <div class="text-caption text-grey-7">Tom de Voz</div>
                  <div class="text-body1">{{ brand.toneOfVoice || '-' }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">Publico-Alvo</div>
                  <div class="text-body1">{{ brand.targetAudience || '-' }}</div>
                </div>
                <div class="col-12" v-if="brand.values?.length">
                  <div class="text-caption text-grey-7 q-mb-xs">Valores</div>
                  <q-chip v-for="v in brand.values" :key="v" dense color="blue-1" text-color="blue-8">{{ v }}</q-chip>
                </div>
                <div class="col-6" v-if="brand.preferredWords?.length">
                  <div class="text-caption text-grey-7 q-mb-xs">Palavras Preferidas</div>
                  <q-chip v-for="w in brand.preferredWords" :key="w" dense color="green-1" text-color="green-8">{{ w }}</q-chip>
                </div>
                <div class="col-6" v-if="brand.avoidedWords?.length">
                  <div class="text-caption text-grey-7 q-mb-xs">Palavras a Evitar</div>
                  <q-chip v-for="w in brand.avoidedWords" :key="w" dense color="red-1" text-color="red-8">{{ w }}</q-chip>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered>
            <q-card-section>
              <div class="text-h6 q-mb-md">Prompts de IA</div>
              <q-tabs v-model="promptTab" dense align="left" class="text-grey-7">
                <q-tab name="text" label="Texto" />
                <q-tab name="image" label="Imagem" />
                <q-tab name="video" label="Video" />
              </q-tabs>
              <q-separator />
              <q-tab-panels v-model="promptTab" animated>
                <q-tab-panel name="text">
                  <pre class="text-body2 bg-grey-2 q-pa-md rounded-borders">{{ brand.prompts?.text || 'Prompt padrao' }}</pre>
                </q-tab-panel>
                <q-tab-panel name="image">
                  <pre class="text-body2 bg-grey-2 q-pa-md rounded-borders">{{ brand.prompts?.image || 'Prompt padrao' }}</pre>
                </q-tab-panel>
                <q-tab-panel name="video">
                  <pre class="text-body2 bg-grey-2 q-pa-md rounded-borders">{{ brand.prompts?.video || 'Prompt padrao' }}</pre>
                </q-tab-panel>
              </q-tab-panels>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Identidade Visual</div>
              <div v-if="brand.logoUrl" class="q-mb-md">
                <img :src="brand.logoUrl" alt="Logo" style="max-width: 100%; max-height: 100px" />
              </div>
              <div class="text-caption text-grey-7 q-mb-xs">Cores da Marca</div>
              <div class="row q-gutter-sm">
                <q-avatar v-for="(color, idx) in brand.brandColors" :key="idx" :style="{ backgroundColor: color }" size="32px">
                  <q-tooltip>{{ color }}</q-tooltip>
                </q-avatar>
                <span v-if="!brand.brandColors?.length" class="text-grey-6">Nenhuma cor definida</span>
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="text-h6 q-mb-md">Configuracao de IA</div>
              <q-list dense>
                <q-item>
                  <q-item-section avatar><q-icon name="text_fields" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Criacao de Texto</q-item-label>
                    <q-item-label caption>
                      {{ brand.aiConfig?.textCreation?.provider || brand.aiConfig?.text?.provider || 'nao configurado' }}
                      <span v-if="brand.aiConfig?.textCreation?.model || brand.aiConfig?.text?.model">
                        ({{ brand.aiConfig?.textCreation?.model || brand.aiConfig?.text?.model }})
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="image" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Geracao de Imagem</q-item-label>
                    <q-item-label caption>
                      {{ brand.aiConfig?.imageGeneration?.provider || brand.aiConfig?.image?.provider || 'nao configurado' }}
                      <span v-if="brand.aiConfig?.imageGeneration?.model || brand.aiConfig?.image?.model">
                        ({{ brand.aiConfig?.imageGeneration?.model || brand.aiConfig?.image?.model }})
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="videocam" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Geracao de Video</q-item-label>
                    <q-item-label caption>
                      {{ brand.aiConfig?.videoGeneration?.provider || brand.aiConfig?.video?.provider || 'nao configurado' }}
                      <span v-if="brand.aiConfig?.videoGeneration?.model || brand.aiConfig?.video?.model">
                        ({{ brand.aiConfig?.videoGeneration?.model || brand.aiConfig?.video?.model }})
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar><q-icon name="psychology" /></q-item-section>
                  <q-item-section>
                    <q-item-label>Direcao Criativa</q-item-label>
                    <q-item-label caption>
                      {{ brand.aiConfig?.creativeDirection?.provider || 'nao configurado' }}
                      <span v-if="brand.aiConfig?.creativeDirection?.model">
                        ({{ brand.aiConfig?.creativeDirection?.model }})
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>

          <q-card flat bordered v-if="brand.competitors?.length">
            <q-card-section>
              <div class="text-h6 q-mb-md">Concorrentes</div>
              <q-chip v-for="c in brand.competitors" :key="c" dense outline>{{ c }}</q-chip>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBrands } from 'src/composables/use-brands'
import type { Brand } from 'src/types'

const route = useRoute()
const router = useRouter()
const { getBrand } = useBrands()

const loading = ref(true)
const brand = ref<Brand | null>(null)
const promptTab = ref('text')

const brandId = computed(() => Number(route.params.id))
const avatarColor = computed(() => {
  const colors = ['primary', 'secondary', 'accent', 'positive', 'info']
  return colors[(brand.value?.id || 0) % colors.length]
})

onMounted(async () => {
  brand.value = await getBrand(brandId.value)
  loading.value = false
})
</script>

