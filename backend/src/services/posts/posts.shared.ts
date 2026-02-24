// Shared types and paths for posts service
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Post, PostData, PostPatch, PostQuery } from './posts.schema'

export type { Post, PostData, PostPatch, PostQuery }

export type PostsClientService = {
  find(params?: Params<PostQuery>): Promise<{ data: Post[]; total: number }>
  get(id: number, params?: Params<PostQuery>): Promise<Post>
  create(data: PostData, params?: Params<PostQuery>): Promise<Post>
  patch(id: number, data: PostPatch, params?: Params<PostQuery>): Promise<Post>
  remove(id: number, params?: Params<PostQuery>): Promise<Post>
}

export const postsPath = 'posts'

export const postsMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export const postsClient = (client: ClientApplication) => {
  const connection = client.get('connection')
  client.use(postsPath, connection.service(postsPath) as PostsClientService, {
    methods: postsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [postsPath]: PostsClientService
  }
}
