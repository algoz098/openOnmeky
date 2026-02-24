<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">Dashboard</h4>
        <p class="text-grey-7 q-ma-none">Visao geral das suas marcas e conteudos</p>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar color="primary" text-color="white" icon="business" />
              <div class="col q-ml-md">
                <div class="text-h4">{{ stats.brands }}</div>
                <div class="text-grey-7">Marcas</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar color="positive" text-color="white" icon="check_circle" />
              <div class="col q-ml-md">
                <div class="text-h4">{{ stats.published }}</div>
                <div class="text-grey-7">Publicados</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar color="info" text-color="white" icon="schedule" />
              <div class="col q-ml-md">
                <div class="text-h4">{{ stats.scheduled }}</div>
                <div class="text-grey-7">Agendados</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar color="grey" text-color="white" icon="edit_note" />
              <div class="col q-ml-md">
                <div class="text-h4">{{ stats.drafts }}</div>
                <div class="text-grey-7">Rascunhos</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h6">Posts Recentes</div>
              <q-space />
              <q-btn flat size="sm" label="Ver todos" to="/posts" />
            </div>

            <q-list v-if="recentPosts.length" separator>
              <q-item v-for="post in recentPosts" :key="post.id" :to="`/posts/${post.id}`">
                <q-item-section avatar>
                  <q-avatar :color="getStatusColor(post.status)" text-color="white" size="32px">
                    <q-icon :name="getStatusIcon(post.status)" size="16px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label lines="1">{{ post.content }}</q-item-label>
                  <q-item-label caption>{{ post.platform }} - {{ formatDate(post.createdAt) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-md text-grey-6">Nenhum post ainda</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h6">Acoes Rapidas</div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-btn class="full-width" color="primary" icon="add" label="Novo Post" to="/posts/create" />
              </div>
              <div class="col-6">
                <q-btn class="full-width" color="secondary" icon="auto_awesome" label="Gerar com IA" to="/ai/generate" />
              </div>
              <div class="col-6">
                <q-btn class="full-width" outline color="primary" icon="business" label="Nova Marca" to="/brands/create" />
              </div>
              <div class="col-6">
                <q-btn class="full-width" outline color="primary" icon="list" label="Ver Marcas" to="/brands" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">Suas Marcas</div>
            <q-list v-if="brands.length" separator>
              <q-item v-for="brand in brands.slice(0, 5)" :key="brand.id" :to="`/brands/${brand.id}`">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">{{ brand.name.substring(0, 2).toUpperCase() }}</q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ brand.name }}</q-item-label>
                  <q-item-label caption>{{ brand.sector || 'Sem setor' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center q-pa-md text-grey-6">Nenhuma marca cadastrada</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useBrands } from 'src/composables/use-brands'
import { usePosts } from 'src/composables/use-posts'
import type { PostStatus } from 'src/types'

const { brands, fetchBrands } = useBrands()
const { posts, fetchPosts } = usePosts()

const stats = reactive({ brands: 0, published: 0, scheduled: 0, drafts: 0 })
const recentPosts = ref<typeof posts.value>([])

const getStatusColor = (status: PostStatus) => ({ draft: 'grey', approved: 'warning', scheduled: 'info', published: 'positive', failed: 'negative' }[status] || 'grey')
const getStatusIcon = (status: PostStatus) => ({ draft: 'edit_note', approved: 'thumb_up', scheduled: 'schedule', published: 'check_circle', failed: 'error' }[status] || 'article')
const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString('pt-BR') : '-')

onMounted(async () => {
  await Promise.all([fetchBrands(), fetchPosts()])
  stats.brands = brands.value.length
  stats.published = posts.value.filter((p) => p.status === 'published').length
  stats.scheduled = posts.value.filter((p) => p.status === 'scheduled').length
  stats.drafts = posts.value.filter((p) => p.status === 'draft').length
  recentPosts.value = posts.value.slice(0, 5)
})
</script>

<style scoped>
.stat-card {
  transition: all 0.2s ease;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

