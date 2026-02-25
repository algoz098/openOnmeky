<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section>
        <div class="text-h6">{{ isEditing ? 'Editar Usuario' : 'Novo Usuario' }}</div>
      </q-card-section>

      <q-form @submit.prevent="handleSubmit">
        <q-card-section class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Nome"
            outlined
            dense
            :rules="[(val) => !!val || 'Nome e obrigatorio']"
          />

          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Email e obrigatorio',
              (val) => isValidEmail(val) || 'Email invalido'
            ]"
            :disable="isEditing"
          />

          <q-input
            v-model="form.password"
            :label="isEditing ? 'Nova Senha (deixe vazio para manter)' : 'Senha'"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="isEditing ? [] : [(val) => !!val || 'Senha e obrigatoria']"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-input
            v-if="form.password"
            v-model="form.confirmPassword"
            label="Confirmar Senha"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[(val) => val === form.password || 'Senhas nao conferem']"
          />

          <q-select
            v-model="form.role"
            :options="availableRoles"
            label="Role"
            outlined
            dense
            emit-value
            map-options
            :rules="[(val) => !!val || 'Role e obrigatoria']"
          />
        </q-card-section>

        <q-card-section v-if="error" class="q-pt-none">
          <q-banner dense class="bg-negative text-white">
            {{ error }}
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            type="submit"
            color="primary"
            :label="isEditing ? 'Salvar' : 'Criar'"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUsersApi } from 'src/composables/use-users-api'
import { useAuthStore } from 'src/stores/auth-store'
import type { UserRecord } from 'src/stores/auth-store'

const props = defineProps<{
  modelValue: boolean
  user: UserRecord | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const usersApi = useUsersApi()
const authStore = useAuthStore()

const saving = ref(false)
const error = ref('')
const showPassword = ref(false)

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'viewer'
})

const isEditing = computed(() => !!props.user)
const currentUserRole = computed(() => authStore.user?.role || 'viewer')

const availableRoles = computed(() => {
  const roles = [
    { label: 'Viewer', value: 'viewer' },
    { label: 'Editor', value: 'editor' },
    { label: 'Admin', value: 'admin' }
  ]
  // Apenas super-admin pode criar/promover para super-admin
  if (currentUserRole.value === 'super-admin') {
    roles.push({ label: 'Super Admin', value: 'super-admin' })
  }
  return roles
})

const isValidEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const resetForm = () => {
  form.value = {
    name: props.user?.name || '',
    email: props.user?.email || '',
    password: '',
    confirmPassword: '',
    role: props.user?.role || 'viewer'
  }
  error.value = ''
  showPassword.value = false
}

const handleSubmit = async () => {
  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    error.value = 'Senhas nao conferem'
    return
  }

  saving.value = true
  error.value = ''

  try {
    if (isEditing.value && props.user) {
      const updateData: Partial<UserRecord> = {
        name: form.value.name,
        role: form.value.role as 'super-admin' | 'admin' | 'editor' | 'viewer'
      }
      if (form.value.password) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(updateData as any).password = form.value.password
      }
      await usersApi.updateUser(props.user.id, updateData)
    } else {
      await usersApi.createUser({
        email: form.value.email,
        password: form.value.password,
        name: form.value.name,
        role: form.value.role as 'super-admin' | 'admin' | 'editor' | 'viewer'
      })
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erro ao salvar usuario'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      resetForm()
    }
  }
)

watch(
  () => props.user,
  () => {
    if (props.modelValue) {
      resetForm()
    }
  }
)
</script>


