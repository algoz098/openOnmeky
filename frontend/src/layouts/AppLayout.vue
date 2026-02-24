<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleDrawer" />

        <q-toolbar-title>
          <span class="text-weight-bold">OpenOnmeky</span>
        </q-toolbar-title>

        <!-- Seletor de Marca -->
        <q-select
          v-if="brands.length > 0"
          v-model="selectedBrandId"
          :options="brandOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          dense
          outlined
          dark
          class="q-mr-md"
          style="min-width: 200px"
          label="Marca"
          @update:model-value="onBrandChange"
        />

        <!-- Menu do usuario -->
        <q-btn flat round>
          <q-avatar color="white" text-color="primary" size="36px">
            {{ userInitials }}
          </q-avatar>
          <q-menu>
            <q-list style="min-width: 180px">
              <q-item>
                <q-item-section>
                  <q-item-label>{{ user?.email }}</q-item-label>
                  <q-item-label caption>{{ user?.role }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Sair</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-grey-8">Menu Principal</q-item-label>

        <q-item clickable v-ripple to="/dashboard" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/brands">
          <q-item-section avatar>
            <q-icon name="business" />
          </q-item-section>
          <q-item-section>Marcas</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/posts">
          <q-item-section avatar>
            <q-icon name="article" />
          </q-item-section>
          <q-item-section>Posts</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/calendar">
          <q-item-section avatar>
            <q-icon name="calendar_month" />
          </q-item-section>
          <q-item-section>Calendario</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/posts/create">
          <q-item-section avatar>
            <q-icon name="add_circle" />
          </q-item-section>
          <q-item-section>Novo Post</q-item-section>
        </q-item>

        <q-separator class="q-my-md" v-if="isAdmin" />

        <q-item-label header class="text-grey-8" v-if="isAdmin">Administracao</q-item-label>

        <q-item clickable v-ripple to="/admin/users" v-if="isAdmin">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>Usuarios</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/settings" v-if="isAdmin">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Configuracoes</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'
import { useAuthApi } from 'src/composables/use-auth-api'
import { useBrands } from 'src/composables/use-brands'

const router = useRouter()
const authStore = useAuthStore()
const { logout } = useAuthApi()
const { brands, fetchBrands, selectBrand } = useBrands()

const drawerOpen = ref(false)
const selectedBrandId = ref<number | null>(null)

const user = computed(() => authStore.user)
const userInitials = computed(() => {
  const email = user.value?.email || ''
  return email.substring(0, 2).toUpperCase()
})

const isAdmin = computed(() => {
  const role = user.value?.role
  return role === 'super-admin' || role === 'admin'
})

const brandOptions = computed(() => {
  return brands.value.map((b) => ({ label: b.name, value: b.id }))
})

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

const onBrandChange = (brandId: number) => {
  selectBrand(brandId)
}

const handleLogout = async () => {
  await logout()
  await router.push('/login')
}

onMounted(async () => {
  await fetchBrands()
  const savedBrandId = localStorage.getItem('currentBrandId')
  if (savedBrandId) {
    selectedBrandId.value = Number(savedBrandId)
  } else if (brands.value.length > 0) {
    const firstBrand = brands.value[0]
    if (firstBrand) {
      selectedBrandId.value = firstBrand.id
      selectBrand(firstBrand.id)
    }
  }
})
</script>

