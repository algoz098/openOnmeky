<template>
  <div class="onboarding-container">
    <!-- Header com logo e indicador de etapa -->
    <div class="onboarding-header">
      <div class="text-h4 text-weight-bold text-primary">OpenOnmeky</div>
      <div class="text-subtitle1 text-grey-7">Configuracao Inicial</div>
    </div>

    <!-- Stepper visual -->
    <div class="stepper-container q-mb-lg">
      <q-stepper v-model="step" flat animated header-nav alternative-labels>
        <q-step :name="1" title="Boas-vindas" icon="celebration" :done="step > 1" />
        <q-step :name="2" title="Administrador" icon="admin_panel_settings" :done="step > 2" />
        <q-step :name="3" title="IA" icon="auto_awesome" :done="step > 3" />
        <q-step :name="4" title="Marca" icon="business" :done="step > 4" />
        <q-step :name="5" title="Concluido" icon="check_circle" :done="step > 5" />
      </q-stepper>
    </div>

    <!-- Conteudo das etapas -->
    <q-card class="onboarding-card">
      <OnboardingWelcome v-if="step === 1" @next="step = 2" />

      <OnboardingAdmin
        v-if="step === 2"
        :initial-data="adminData"
        :error="error"
        @next="handleAdminNext"
        @back="step = 1"
      />

      <OnboardingAIProvider v-if="step === 3" @next="handleAIProviderNext" @back="step = 2" />

      <OnboardingBrand v-if="step === 4" @next="handleBrandNext" @back="step = 3" />

      <OnboardingComplete
        v-if="step === 5"
        :result="onboardingResult"
        :loading="loading"
        @finish="goToDashboard"
        @action="handleAction"
      />
    </q-card>

    <!-- Footer -->
    <div class="onboarding-footer text-grey-6 text-caption">
      OpenOnmeky - Open Source Social Media Management
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFeathers } from 'src/composables/use-feathers'
import { useAuthApi } from 'src/composables/use-auth-api'
import { resetOnboardingCache } from 'src/router'
import OnboardingWelcome from 'src/components/onboarding/OnboardingWelcome.vue'
import OnboardingAdmin from 'src/components/onboarding/OnboardingAdmin.vue'
import OnboardingAIProvider from 'src/components/onboarding/OnboardingAIProvider.vue'
import OnboardingBrand from 'src/components/onboarding/OnboardingBrand.vue'
import OnboardingComplete from 'src/components/onboarding/OnboardingComplete.vue'
import type { AdminData, AIProvidersData, BrandData, OnboardingResultData } from 'src/components/onboarding/types'

const router = useRouter()
const { api } = useFeathers()
const { login } = useAuthApi()

const step = ref(1)
const loading = ref(false)
const error = ref('')

// Dados coletados em cada etapa
const adminData = reactive<AdminData>({ name: '', email: '', password: '' })
const aiProvidersData = ref<AIProvidersData>([])
const brandData = ref<BrandData | undefined>(undefined)
const onboardingResult = ref<OnboardingResultData | undefined>(undefined)

const handleAdminNext = (data: AdminData) => {
  Object.assign(adminData, data)
  error.value = ''
  step.value = 3
}

const handleAIProviderNext = (data: AIProvidersData) => {
  aiProvidersData.value = data
  step.value = 4
}

const handleBrandNext = async (data: BrandData | undefined) => {
  brandData.value = data
  await submitOnboarding()
}

const submitOnboarding = async () => {
  loading.value = true
  error.value = ''

  try {
    const payload: Record<string, unknown> = {
      name: adminData.name,
      email: adminData.email,
      password: adminData.password
    }

    if (aiProvidersData.value.length > 0) {
      payload.aiProviders = aiProvidersData.value
    }

    if (brandData.value) {
      payload.brand = brandData.value
    }

    const result = await api.service('onboarding').create(payload)
    onboardingResult.value = result as OnboardingResultData
    resetOnboardingCache()
    step.value = 5
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao completar onboarding'
    step.value = 2
  } finally {
    loading.value = false
  }
}

const goToDashboard = async () => {
  loading.value = true
  try {
    await login(adminData.email, adminData.password)
    await router.push('/dashboard')
  } catch {
    await router.push('/login')
  }
}

const handleAction = async (action: 'create-post' | 'settings' | 'create-brand') => {
  loading.value = true
  try {
    await login(adminData.email, adminData.password)
    switch (action) {
      case 'create-post':
        await router.push('/posts/create')
        break
      case 'settings':
        await router.push('/admin/settings')
        break
      case 'create-brand':
        await router.push('/brands/create')
        break
    }
  } catch {
    await router.push('/login')
  }
}
</script>

<style scoped>
.onboarding-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.onboarding-header {
  text-align: center;
  margin-bottom: 24px;
}

.stepper-container {
  width: 100%;
  max-width: 750px;
}

.stepper-container :deep(.q-stepper) {
  background: transparent;
}

.stepper-container :deep(.q-stepper__header) {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.onboarding-card {
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.features-list {
  max-width: 320px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
}

.setup-summary {
  max-width: 280px;
  margin: 0 auto;
}

.onboarding-footer {
  margin-top: auto;
  padding-top: 40px;
}
</style>

