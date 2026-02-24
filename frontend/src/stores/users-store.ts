import { defineStore, acceptHMRUpdate } from 'pinia'
import type { UserRecord } from './auth-store'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [] as UserRecord[],
    loading: false,
    error: ''
  }),
  getters: {
    getById: state => (id: number) => state.items.find(item => item.id === id)
  },
  actions: {
    setItems(items: UserRecord[]) {
      this.items = items
    },

    setLoading(value: boolean) {
      this.loading = value
    },

    setError(value: string) {
      this.error = value
    },

    upsertItem(item: UserRecord) {
      const idx = this.items.findIndex(i => i.id === item.id)
      if (idx === -1) {
        this.items.push(item)
        return
      }
      this.items[idx] = { ...this.items[idx], ...item }
    },

    removeItem(id: number) {
      const idx = this.items.findIndex(i => i.id === id)
      if (idx !== -1) {
        this.items.splice(idx, 1)
      }
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot))
}
