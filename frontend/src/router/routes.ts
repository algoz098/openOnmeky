import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Rotas publicas (autenticacao)
  {
    path: '/login',
    component: () => import('pages/auth/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/onboarding',
    component: () => import('pages/auth/OnboardingPage.vue'),
    meta: { public: true }
  },

  // Rotas protegidas (app)
  {
    path: '/',
    component: () => import('layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('pages/DashboardPage.vue') },

      // Brands
      { path: 'brands', component: () => import('pages/brands/BrandsListPage.vue') },
      { path: 'brands/create', component: () => import('pages/brands/BrandFormPage.vue') },
      { path: 'brands/:id', component: () => import('pages/brands/BrandDetailPage.vue') },
      { path: 'brands/:id/edit', component: () => import('pages/brands/BrandFormPage.vue') },

      // Posts
      { path: 'posts', component: () => import('pages/posts/PostsListPage.vue') },
      { path: 'posts/create', component: () => import('pages/posts/PostEditorPage.vue') },
      { path: 'posts/:id', component: () => import('pages/posts/PostEditorPage.vue') },
      { path: 'posts/:id/edit', component: () => import('pages/posts/PostEditorPage.vue') },

      // Calendario
      { path: 'calendar', component: () => import('pages/CalendarPage.vue') },

      // Admin
      { path: 'admin/users', component: () => import('pages/DashboardPage.vue') },
      { path: 'admin/settings', component: () => import('pages/admin/SettingsPage.vue') }
    ]
  },

  // Pagina de erro 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
