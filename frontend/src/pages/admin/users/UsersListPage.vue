<template>
  <q-page padding>
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-ma-none">Usuarios</h4>
        <p class="text-grey-7 q-ma-none">Gerencie os usuarios do sistema</p>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="person_add" label="Novo Usuario" @click="openDialog()" />
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section class="q-pa-none">
        <q-table
          :rows="users"
          :columns="columns"
          :loading="loading"
          row-key="id"
          flat
          :pagination="{ rowsPerPage: 10 }"
        >
          <template #top>
            <div class="row q-gutter-md full-width">
              <q-input
                v-model="searchQuery"
                dense
                outlined
                placeholder="Buscar por nome ou email..."
                class="col-12 col-sm-4"
                clearable
              >
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-select
                v-model="roleFilter"
                :options="roleOptions"
                dense
                outlined
                emit-value
                map-options
                clearable
                label="Filtrar por role"
                class="col-12 col-sm-3"
              />
            </div>
          </template>

          <template #body-cell-role="props">
            <q-td :props="props">
              <q-chip
                :color="getRoleColor(props.row.role)"
                text-color="white"
                dense
                size="sm"
              >
                {{ getRoleLabel(props.row.role) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn flat round dense icon="edit" color="primary" @click="openDialog(props.row)">
                <q-tooltip>Editar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                :disable="props.row.id === currentUser?.id"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>
                  {{ props.row.id === currentUser?.id ? 'Nao pode excluir sua propria conta' : 'Excluir' }}
                </q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <template #no-data>
            <div class="text-center q-pa-xl">
              <q-icon name="people" size="60px" color="grey-4" />
              <div class="text-h6 text-grey-6 q-mt-md">Nenhum usuario encontrado</div>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <UserFormDialog
      v-model="dialogOpen"
      :user="selectedUser"
      @saved="onUserSaved"
    />

    <q-dialog v-model="deleteDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Excluir Usuario</div>
        </q-card-section>
        <q-card-section>
          Tem certeza que deseja excluir o usuario <strong>{{ userToDelete?.email }}</strong>?
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
import { ref, computed, onMounted, watch } from 'vue'
import { useUsersApi } from 'src/composables/use-users-api'
import { useUsersStore } from 'src/stores/users-store'
import { useAuthStore } from 'src/stores/auth-store'
import type { UserRecord } from 'src/stores/auth-store'
import UserFormDialog from './UserFormDialog.vue'

const usersApi = useUsersApi()
const usersStore = useUsersStore()
const authStore = useAuthStore()

const loading = ref(true)
const dialogOpen = ref(false)
const deleteDialog = ref(false)
const deleting = ref(false)
const selectedUser = ref<UserRecord | null>(null)
const userToDelete = ref<UserRecord | null>(null)
const searchQuery = ref('')
const roleFilter = ref<string | null>(null)

const currentUser = computed(() => authStore.user)

const columns = [
  { name: 'name', label: 'Nome', field: 'name', align: 'left' as const, sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' as const, sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'center' as const, sortable: true },
  { name: 'actions', label: 'Acoes', field: 'actions', align: 'center' as const }
]

const roleOptions = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' }
]

const users = computed(() => {
  let filtered = usersStore.items

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        (u.name && u.name.toLowerCase().includes(query))
    )
  }

  if (roleFilter.value) {
    filtered = filtered.filter((u) => u.role === roleFilter.value)
  }

  return filtered
})

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    'super-admin': 'purple',
    admin: 'primary',
    editor: 'positive',
    viewer: 'grey'
  }
  return colors[role] || 'grey'
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    'super-admin': 'Super Admin',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer'
  }
  return labels[role] || role
}

const openDialog = (user?: UserRecord) => {
  selectedUser.value = user || null
  dialogOpen.value = true
}

const confirmDelete = (user: UserRecord) => {
  userToDelete.value = user
  deleteDialog.value = true
}

const handleDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await usersApi.removeUser(userToDelete.value.id)
    deleteDialog.value = false
  } finally {
    deleting.value = false
  }
}

const onUserSaved = () => {
  dialogOpen.value = false
}

const loadUsers = async () => {
  loading.value = true
  try {
    await usersApi.findUsers()
  } finally {
    loading.value = false
  }
}

watch([searchQuery, roleFilter], () => {
  // Filtros sao aplicados no computed, nao precisa recarregar
})

onMounted(async () => {
  await loadUsers()
})
</script>


