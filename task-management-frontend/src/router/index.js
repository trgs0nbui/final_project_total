import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Route definitions for the Project Management App.
 *
 * meta fields:
 *   requiresAuth {boolean} — navigation guard will redirect unauthenticated users to /login
 *   title        {string}  — used by afterEach to update document.title
 */
const routes = [
  // ── Auth routes (no auth required) ──────────────────────────────────────
  {
    path: '/login',
    name: 'login',
    // Login is loaded eagerly so the first paint is fast
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: 'Đăng nhập' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: 'Đăng ký' },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('@/views/auth/VerifyEmailView.vue'),
    meta: { title: 'Xác thực email' },
  },
  {
    path: '/verify-email/pending',
    name: 'verify-email-pending',
    component: () => import('@/views/auth/PendingVerificationView.vue'),
    meta: { title: 'Kiểm tra email của bạn' },
  },

  // ── Protected routes ─────────────────────────────────────────────────────
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Tổng quan' },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { requiresAuth: true, title: 'Dự án' },
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    meta: { requiresAuth: true, title: 'Công việc' },
  },
  {
    path: '/team',
    name: 'team',
    component: () => import('@/views/TeamView.vue'),
    meta: { requiresAuth: true, title: 'Nhóm' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true, title: 'Cài đặt' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Hồ sơ cá nhân' },
  },
  {
    path: '/projects/:id',
    name: 'project-detail',
    component: () => import('@/views/ProjectDetailView.vue'),
    meta: { requiresAuth: true, title: 'Chi tiết dự án' },
    children: [
      {
        path: 'tasks/:taskId',
        name: 'task-detail',
        component: () => import('@/views/ProjectDetailView.vue'),
        meta: { requiresAuth: true, title: 'Chi tiết công việc' },
      },
    ],
  },
  {
    path: '/projects/:id/members',
    name: 'project-members',
    component: () => import('@/views/ProjectMembersView.vue'),
    meta: { requiresAuth: true, title: 'Quản lý thành viên' },
  },

  // ── Error / fallback routes ───────────────────────────────────────────────
  {
    path: '/404',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Không tìm thấy trang' },
  },
  {
    // Catch-all: redirect any unknown path to the named not-found route
    path: '/:pathMatch(.*)*',
    redirect: { name: 'not-found' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ── Navigation Guards ────────────────────────────────────────────────────────

/**
 * beforeEach — authentication guard.
 *
 * Rules:
 *  1. Route requires auth + user NOT authenticated  → redirect to /login
 *  2. Route is /login or /register + user IS authenticated → redirect to /dashboard
 *  3. All other cases → allow navigation
 *
 * NOTE: useAuthStore() is called inside the guard (not at module level) so
 * that Pinia is guaranteed to be initialized before the store is accessed.
 * The top-level import is fine here — it only registers the store definition,
 * not the Pinia instance, so there is no circular-initialization problem.
 */
router.beforeEach((to) => {
  const authStore = useAuthStore()

  const isAuthenticated = authStore.isAuthenticated

  // 1. Protected route — user not logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }

  // 2. Auth-only pages (login / register / verify) — user already logged in
  if (
    (to.name === 'login' || to.name === 'register') &&
    isAuthenticated
  ) {
    return { name: 'dashboard' }
  }

  // 3. Allow navigation
  return true
})

/**
 * afterEach — document title updater.
 *
 * Sets document.title to the route's meta.title value, falling back to a
 * default app name when the route does not define one.
 */
router.afterEach((to) => {
  document.title = to.meta.title ?? 'Project Manager'
})

export default router
