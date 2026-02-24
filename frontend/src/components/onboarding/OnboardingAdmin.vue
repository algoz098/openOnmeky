<template>
  <q-card-section class="text-center">
    <q-icon name="admin_panel_settings" size="48px" color="primary" class="q-mb-sm" />
    <div class="text-h6 text-weight-bold">Criar Super Administrador</div>
    <div class="text-body2 text-grey-7">Esta conta tera acesso total ao sistema</div>
  </q-card-section>
  <q-card-section>
    <q-form @submit="handleSubmit" class="q-gutter-md">
      <q-input
        v-model="form.name"
        label="Nome completo"
        outlined
        :rules="[(v) => !!v || 'Nome obrigatorio']"
      >
        <template v-slot:prepend>
          <q-icon name="person" />
        </template>
      </q-input>
      <q-input
        v-model="form.email"
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
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        label="Senha"
        outlined
        :rules="[(v) => !!v || 'Senha obrigatoria', (v) => v.length >= 8 || 'Minimo 8 caracteres']"
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
      <q-input
        v-model="form.confirmPassword"
        :type="showPassword ? 'text' : 'password'"
        label="Confirmar Senha"
        outlined
        :rules="[(v) => !!v || 'Confirmacao obrigatoria', (v) => v === form.password || 'Senhas nao conferem']"
      >
        <template v-slot:prepend>
          <q-icon name="lock_outline" />
        </template>
      </q-input>
      <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded dense>
        {{ error }}
      </q-banner>
      <div class="row q-gutter-sm">
        <q-btn flat color="grey-7" label="Voltar" @click="$emit('back')" class="col" />
        <q-btn type="submit" color="primary" class="col" size="lg" label="Continuar" />
      </div>
    </q-form>
  </q-card-section>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { AdminData } from './types'

const props = defineProps<{
  initialData?: AdminData
  error?: string
}>()

const emit = defineEmits<{
  next: [data: AdminData]
  back: []
}>()

const form = reactive({
  name: props.initialData?.name || '',
  email: props.initialData?.email || '',
  password: props.initialData?.password || '',
  confirmPassword: ''
})

const showPassword = ref(false)
const error = ref(props.error || '')

watch(() => props.error, (val) => {
  error.value = val || ''
})

const handleSubmit = () => {
  if (form.password !== form.confirmPassword) {
    error.value = 'Senhas nao conferem'
    return
  }
  emit('next', {
    name: form.name,
    email: form.email,
    password: form.password
  })
}
</script>

