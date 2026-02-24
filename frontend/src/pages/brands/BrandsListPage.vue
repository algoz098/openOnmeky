<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">Marcas</h4>
        <p class="text-grey-7 q-ma-none">Gerencie suas marcas e guidelines</p>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Nova Marca" to="/brands/create" />
      </div>
    </div>

    <q-card v-if="loading" flat bordered>
      <q-card-section class="text-center q-pa-xl">
        <q-spinner size="50px" color="primary" />
        <div class="q-mt-md text-grey-7">Carregando marcas...</div>
      </q-card-section>
    </q-card>

    <div v-else-if="brands.length === 0" class="text-center q-pa-xl">
      <q-icon name="business" size="80px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">Nenhuma marca cadastrada</div>
      <div class="text-grey-7 q-mb-lg">Crie sua primeira marca para comecar</div>
      <q-btn color="primary" icon="add" label="Criar Marca" to="/brands/create" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div v-for="brand in brands" :key="brand.id" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="brand-card">
          <q-card-section>
            <div class="row items-center">
              <q-avatar
                :color="getBrandColor(brand)"
                text-color="white"
                size="48px"
                class="q-mr-md"
              >
                {{ brand.name.substring(0, 2).toUpperCase() }}
              </q-avatar>
              <div class="col">
                <div class="text-h6">{{ brand.name }}</div>
                <div class="text-grey-7 text-caption">{{ brand.sector || 'Sem setor' }}</div>
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="brand.description" class="q-pt-none">
            <p class="text-grey-8 q-ma-none ellipsis-2-lines">{{ brand.description }}</p>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="row q-gutter-xs">
              <q-chip
                v-if="brand.toneOfVoice"
                dense
                color="blue-1"
                text-color="blue-8"
                icon="record_voice_over"
              >
                {{ brand.toneOfVoice }}
              </q-chip>
              <q-chip
                v-if="brand.aiConfig?.textCreation?.provider || brand.aiConfig?.text?.provider"
                dense
                color="purple-1"
                text-color="purple-8"
                icon="auto_awesome"
              >
                {{ brand.aiConfig?.textCreation?.provider || brand.aiConfig?.text?.provider }}
              </q-chip>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions>
            <q-btn flat color="primary" icon="visibility" label="Ver" :to="`/brands/${brand.id}`" />
            <q-btn flat color="grey" icon="edit" label="Editar" :to="`/brands/${brand.id}/edit`" />
            <q-space />
            <q-btn flat round icon="more_vert">
              <q-menu>
                <q-list>
                  <q-item clickable v-close-popup @click="handleSelect(brand.id)">
                    <q-item-section avatar>
                      <q-icon name="check_circle" />
                    </q-item-section>
                    <q-item-section>Selecionar</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="confirmDelete(brand)">
                    <q-item-section avatar>
                      <q-icon name="delete" color="negative" />
                    </q-item-section>
                    <q-item-section class="text-negative">Excluir</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog de confirmacao de exclusao -->
    <q-dialog v-model="deleteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Excluir Marca</div>
        </q-card-section>
        <q-card-section>
          Tem certeza que deseja excluir a marca <strong>{{ brandToDelete?.name }}</strong>?
          Esta acao nao pode ser desfeita.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Excluir" color="negative" @click="handleDelete" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBrands } from 'src/composables/use-brands'
import type { Brand } from 'src/types'

const { brands, fetchBrands, removeBrand, selectBrand } = useBrands()

const loading = ref(true)
const deleteDialog = ref(false)
const deleting = ref(false)
const brandToDelete = ref<Brand | null>(null)

const brandColors = ['primary', 'secondary', 'accent', 'positive', 'info', 'warning']

const getBrandColor = (brand: Brand) => {
  return brandColors[brand.id % brandColors.length]
}

const handleSelect = (id: number) => {
  selectBrand(id)
}

const confirmDelete = (brand: Brand) => {
  brandToDelete.value = brand
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!brandToDelete.value) return
  deleting.value = true
  try {
    await removeBrand(brandToDelete.value.id)
    deleteDialog.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await fetchBrands()
  loading.value = false
})
</script>

<style scoped>
.brand-card {
  transition: all 0.2s ease;
}
.brand-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

