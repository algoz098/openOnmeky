<template>
  <div class="flex flex-center bg-grey-2" style="min-height: 100vh">
    <q-card class="login-card q-pa-lg" style="min-width: 350px">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold">OpenOnmeky</div>
        <div class="text-grey-7 q-mt-sm">Gerenciamento de Social Media com IA</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            label="Email"
            outlined
            :rules="[(v) => !!v || 'Email obrigatorio', (v) => /.+@.+\..+/.test(v) || 'Email invalido']"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="Senha"
            outlined
            :rules="[(v) => !!v || 'Senha obrigatoria']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            color="primary"
            class="full-width"
            size="lg"
            :loading="loading"
            label="Entrar"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthApi } from 'src/composables/use-auth-api'

const router = useRouter()
const { login } = useAuthApi()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await login(email.value, password.value)
    await router.push('/dashboard')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  border-radius: 12px;
}
</style>

