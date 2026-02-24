import { useUsersStore } from 'src/stores/users-store'
import type { UserRecord } from 'src/stores/auth-store'
import { useFeathers } from './use-feathers'

export function useUsersApi() {
  const usersStore = useUsersStore()
  const { api } = useFeathers()

  const findUsers = async () => {
    usersStore.setLoading(true)
    usersStore.setError('')
    try {
      const response = await api.service('users').find()
      const data = Array.isArray(response) ? response : response.data
      usersStore.setItems(data as UserRecord[])
      return data
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar usuarios'
      usersStore.setError(message)
      throw error
    } finally {
      usersStore.setLoading(false)
    }
  }

  const getUser = async (id: number) => {
    usersStore.setLoading(true)
    usersStore.setError('')
    try {
      const user = await api.service('users').get(id)
      usersStore.upsertItem(user as UserRecord)
      return user
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar usuario'
      usersStore.setError(message)
      throw error
    } finally {
      usersStore.setLoading(false)
    }
  }

  const createUser = async (data: { email: string; password: string }) => {
    usersStore.setLoading(true)
    usersStore.setError('')
    try {
      const user = await api.service('users').create(data)
      usersStore.upsertItem(user as UserRecord)
      return user
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar usuario'
      usersStore.setError(message)
      throw error
    } finally {
      usersStore.setLoading(false)
    }
  }

  const updateUser = async (id: number, data: Partial<UserRecord>) => {
    usersStore.setLoading(true)
    usersStore.setError('')
    try {
      const user = await api.service('users').patch(id, data)
      usersStore.upsertItem(user as UserRecord)
      return user
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar usuario'
      usersStore.setError(message)
      throw error
    } finally {
      usersStore.setLoading(false)
    }
  }

  const removeUser = async (id: number) => {
    usersStore.setLoading(true)
    usersStore.setError('')
    try {
      await api.service('users').remove(id)
      usersStore.removeItem(id)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao remover usuario'
      usersStore.setError(message)
      throw error
    } finally {
      usersStore.setLoading(false)
    }
  }

  return {
    findUsers,
    getUser,
    createUser,
    updateUser,
    removeUser
  }
}
