import { feathers } from '@feathersjs/feathers'
import socketioClient from '@feathersjs/socketio-client'
import io from 'socket.io-client'
import authenticationClient from '@feathersjs/authentication-client'
import { createPiniaClient } from 'feathers-pinia'
import { pinia } from './stores'

export const host = import.meta.env.VITE_API_URL || 'http://localhost:3030'

const authConfiguration = {
  storage: window.localStorage,
  storageKey: 'feathers-jwt'
}

const socket = io(host, {
  autoConnect: true,
  reconnection: true,
  path: '/socket.io/',
  transports: ['websocket'],
  withCredentials: true
})

// Cliente Feathers base
const feathersClient = feathers()
  .configure(socketioClient(socket))
  .configure(authenticationClient(authConfiguration))

// Cliente com Pinia integrado
export const api = createPiniaClient(feathersClient, {
  pinia,
  idField: 'id',
  whitelist: ['$eager', '$limit', '$skip', '$sort', '$select'],
  paramsForServer: ['$eager'],
  services: {
    users: { idField: 'id' },
    brands: { idField: 'id' },
    posts: { idField: 'id' },
    roles: { idField: 'id' },
    platforms: { idField: 'id' },
    'prompt-templates': { idField: 'id' },
    'ai-providers': { idField: 'name' },
    'ai-models': { idField: 'id' },
    medias: { idField: 'id' }
  }
})

// Cliente Feathers base e socket exportados para chamadas diretas
export { feathersClient, socket }
