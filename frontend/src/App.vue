<template>
  <router-view v-if="ready" />
  <div v-else class="flex flex-center" style="min-height: 100vh">
    <q-spinner-dots size="50px" color="primary" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthApi } from 'src/composables/use-auth-api'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const authStore = useAuthStore()
const { initAuth, checkBootstrap } = useAuthApi()
const ready = ref(false)

onMounted(async () => {
  const currentPath = router.currentRoute.value.path

  // Verifica se o sistema precisa de onboarding (nenhum admin criado)
  const hasAdmin = await checkBootstrap()

  if (!hasAdmin) {
    ready.value = true
    if (currentPath !== '/onboarding') {
      void router.push('/onboarding')
    }
    return
  }

  // Sistema ja tem admin, verifica autenticacao
  await initAuth()
  ready.value = true

  if (!authStore.isAuthenticated) {
    const isPublicRoute = router.currentRoute.value.meta.public === true

    if (!isPublicRoute && currentPath !== '/login' && currentPath !== '/onboarding') {
      void router.push('/login')
    }
  }
})
</script>
