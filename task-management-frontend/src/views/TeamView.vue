<script setup>
/**
 * TeamView — danh sách dự án mà user là owner, mỗi dự án là một accordion
 * có thể mở ra để xem danh sách thành viên.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FolderOpened,
  User,
  ArrowRight,
  ArrowDown,
  UserFilled,
  Setting,
} from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

// ── State ─────────────────────────────────────────────────────────────────────
/** Map<projectId, Member[]> — cache members đã fetch */
const membersCache = ref({})
/** Set<projectId> — đang loading members */
const loadingIds = ref(new Set())
/** Set<projectId> — accordion đang mở */
const openIds = ref(new Set())

// ── Computed ──────────────────────────────────────────────────────────────────
const allProjects = computed(() => projectStore.projects)
const isProjectsLoading = computed(() => projectStore.isLoading)
const storeError = computed(() => projectStore.error)

/**
 * Chỉ hiển thị các dự án mà user hiện tại là owner.
 * Backend trả về `owner` object hoặc `owner_id` tùy serializer.
 */
const ownedProjects = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return []
  return allProjects.value.filter((p) => {
    const ownerId = p.owner?.id ?? p.owner_id ?? p.owner
    return String(ownerId) === String(userId)
  })
})

/** Tổng số thành viên trên tất cả dự án owned (không đếm trùng) */
const totalMembersCount = computed(() => {
  return Object.values(membersCache.value).reduce((sum, arr) => sum + arr.length, 0)
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await projectStore.fetchProjects()
})

// ── Handlers ─────────────────────────────────────────────────────────────────

async function toggleProject(projectId) {
  const next = new Set(openIds.value)
  if (next.has(projectId)) {
    next.delete(projectId)
    openIds.value = next
    return
  }

  next.add(projectId)
  openIds.value = next

  // Fetch members nếu chưa có trong cache
  if (!membersCache.value[projectId]) {
    const loading = new Set(loadingIds.value)
    loading.add(projectId)
    loadingIds.value = loading

    const members = await projectStore.fetchMembers(projectId)
    membersCache.value = { ...membersCache.value, [projectId]: members }

    const done = new Set(loadingIds.value)
    done.delete(projectId)
    loadingIds.value = done
  }
}

function goToProject(projectId) {
  router.push(`/projects/${projectId}`)
}

function goToMembers(projectId) {
  router.push(`/projects/${projectId}/members`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner: { label: 'Owner', bg: 'rgba(0,74,198,0.1)', color: '#004ac6' },
  member: { label: 'Member', bg: '#f3f3fe', color: '#434655' },
}

function getRoleConfig(role) {
  return ROLE_CONFIG[role] ?? ROLE_CONFIG.member
}

function getInitials(user) {
  return (user?.full_name || user?.username || '').slice(0, 2).toUpperCase() || '?'
}

function projectInitials(project) {
  return (project.key ?? project.name).slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="team-view">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="team-view__header">
      <div>
        <h2 class="team-view__title">Nhóm</h2>
        <p class="team-view__subtitle">Danh sách thành viên trong các dự án bạn đang quản lý.</p>
      </div>
    </div>

    <!-- ── Stats bar ────────────────────────────────────────────────────── -->
    <div class="team-view__stats">
      <div class="tv-stat">
        <div class="tv-stat__icon" style="background: rgba(0, 74, 198, 0.08); color: #004ac6">
          <el-icon :size="20"><FolderOpened /></el-icon>
        </div>
        <div>
          <p class="tv-stat__label">Dự án đang quản lý</p>
          <p class="tv-stat__value">
            {{ isProjectsLoading ? '…' : ownedProjects.length }}
          </p>
        </div>
      </div>
      <div class="tv-stat">
        <div class="tv-stat__icon" style="background: rgba(5, 150, 105, 0.08); color: #059669">
          <el-icon :size="20"><UserFilled /></el-icon>
        </div>
        <div>
          <p class="tv-stat__label">Tổng thành viên</p>
          <p class="tv-stat__value">{{ totalMembersCount || '—' }}</p>
        </div>
      </div>
    </div>

    <!-- ── Error ────────────────────────────────────────────────────────── -->
    <el-alert
      v-if="storeError && !isProjectsLoading"
      :title="storeError"
      type="error"
      show-icon
      :closable="false"
      class="team-view__error"
    />

    <!-- ── Loading skeleton ─────────────────────────────────────────────── -->
    <div v-if="isProjectsLoading" class="team-view__skeleton">
      <div v-for="i in 3" :key="i" class="tv-skeleton-row"></div>
    </div>

    <!-- ── Empty state ──────────────────────────────────────────────────── -->
    <div v-else-if="ownedProjects.length === 0" class="team-view__empty">
      <div class="tv-empty__icon" aria-hidden="true">
        <el-icon :size="36"><User /></el-icon>
      </div>
      <h3 class="tv-empty__title">Bạn chưa quản lý dự án nào</h3>
      <p class="tv-empty__desc">
        Chỉ hiển thị các dự án mà bạn là owner. Hãy tạo dự án mới hoặc được cấp quyền owner.
      </p>
      <router-link to="/projects" class="tv-empty__link"> Đi đến danh sách dự án → </router-link>
    </div>

    <!-- ── Project accordion list ───────────────────────────────────────── -->
    <div v-else class="team-view__list">
      <div
        v-for="project in ownedProjects"
        :key="project.id"
        class="tv-project-card"
        :class="{ 'tv-project-card--open': openIds.has(project.id) }"
      >
        <!-- ── Accordion header ──────────────────────────────────────── -->
        <button
          class="tv-project-header"
          :aria-expanded="openIds.has(project.id)"
          @click="toggleProject(project.id)"
        >
          <!-- Left: avatar + info -->
          <div class="tv-project-header__left">
            <div class="tv-project-avatar" aria-hidden="true">
              {{ projectInitials(project) }}
            </div>
            <div class="tv-project-info">
              <span class="tv-project-name">{{ project.name }}</span>
              <span class="tv-project-key">{{ project.key ?? '—' }}</span>
            </div>
          </div>

          <!-- Right: member count + chevron -->
          <div class="tv-project-header__right">
            <span v-if="membersCache[project.id]" class="tv-member-count">
              <el-icon :size="13"><User /></el-icon>
              {{ membersCache[project.id].length }} thành viên
            </span>
            <span
              v-else-if="loadingIds.has(project.id)"
              class="tv-member-count tv-member-count--loading"
            >
              <span class="tv-spinner" aria-hidden="true"></span>
              Đang tải...
            </span>
            <el-icon
              class="tv-chevron"
              :class="{ 'tv-chevron--open': openIds.has(project.id) }"
              :size="16"
            >
              <ArrowDown />
            </el-icon>
          </div>
        </button>

        <!-- ── Accordion body ────────────────────────────────────────── -->
        <transition name="tv-collapse">
          <div v-if="openIds.has(project.id)" class="tv-project-body">
            <!-- Loading members -->
            <div v-if="loadingIds.has(project.id)" class="tv-body-loading">
              <span class="tv-spinner" aria-hidden="true"></span>
              Đang tải thành viên...
            </div>

            <!-- Members table -->
            <template v-else-if="membersCache[project.id]?.length > 0">
              <div class="tv-members-table-wrap">
                <table class="tv-members-table">
                  <thead>
                    <tr class="tv-members-thead">
                      <th class="tv-members-th">Thành viên</th>
                      <th class="tv-members-th">Vai trò</th>
                      <th class="tv-members-th tv-members-th--email">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="membership in membersCache[project.id]"
                      :key="membership.id"
                      class="tv-members-row"
                    >
                      <!-- Avatar + name -->
                      <td class="tv-members-td">
                        <div class="tv-member-cell">
                          <div class="tv-avatar">
                            <img
                              v-if="membership.user.avatar_url"
                              :src="membership.user.avatar_url"
                              :alt="membership.user.username"
                              class="tv-avatar__img"
                            />
                            <span v-else class="tv-avatar__initials">
                              {{ getInitials(membership.user) }}
                            </span>
                          </div>
                          <div class="tv-member-info">
                            <span class="tv-member-name">
                              {{ membership.user.full_name || membership.user.username }}
                            </span>
                            <span class="tv-member-username">
                              @{{ membership.user.username }}
                            </span>
                          </div>
                        </div>
                      </td>

                      <!-- Role badge -->
                      <td class="tv-members-td">
                        <span
                          class="tv-role-badge"
                          :style="{
                            background: getRoleConfig(membership.role).bg,
                            color: getRoleConfig(membership.role).color,
                          }"
                        >
                          {{ getRoleConfig(membership.role).label }}
                        </span>
                      </td>

                      <!-- Email -->
                      <td class="tv-members-td tv-members-td--email">
                        {{ membership.user.email }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Footer actions -->
              <div class="tv-body-footer">
                <button
                  class="tv-action-btn tv-action-btn--outline"
                  @click="goToProject(project.id)"
                >
                  <el-icon :size="14"><FolderOpened /></el-icon>
                  Xem dự án
                </button>
                <button
                  class="tv-action-btn tv-action-btn--primary"
                  @click="goToMembers(project.id)"
                >
                  <el-icon :size="14"><Setting /></el-icon>
                  Quản lý thành viên
                  <el-icon :size="13"><ArrowRight /></el-icon>
                </button>
              </div>
            </template>

            <!-- Empty members -->
            <div v-else class="tv-body-empty">
              <el-icon :size="24" color="#c3c6d7"><User /></el-icon>
              <p>Dự án chưa có thành viên nào.</p>
              <button class="tv-action-btn tv-action-btn--primary" @click="goToMembers(project.id)">
                Thêm thành viên
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.team-view {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;

  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 48px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.team-view__title {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.team-view__subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
}

/* ── Stats bar ───────────────────────────────────────────────────────────────── */
.team-view__stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.tv-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 24px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  flex: 1;
  min-width: 200px;
}

.tv-stat__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tv-stat__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  margin: 0 0 4px;
}

.tv-stat__value {
  font-size: 24px;
  font-weight: 900;
  color: var(--on-surface);
  margin: 0;
  line-height: 1;
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.team-view__error {
  border-radius: 8px;
}

/* ── Skeleton ────────────────────────────────────────────────────────────────── */
.team-view__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tv-skeleton-row {
  height: 68px;
  background: var(--surface-container-low);
  border-radius: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.team-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 320px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 48px 32px;
  gap: 12px;
}

.tv-empty__icon {
  width: 72px;
  height: 72px;
  background: var(--surface-container-low);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--outline);
  margin-bottom: 4px;
}

.tv-empty__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.tv-empty__desc {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
}

.tv-empty__link {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  margin-top: 4px;
}

.tv-empty__link:hover {
  text-decoration: underline;
}

/* ── Project accordion list ──────────────────────────────────────────────────── */
.team-view__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Project card ────────────────────────────────────────────────────────────── */
.tv-project-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.tv-project-card--open {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-color: #c3c6d7;
}

/* ── Accordion header ────────────────────────────────────────────────────────── */
.tv-project-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background-color 0.15s;
  gap: 12px;
}

.tv-project-header:hover {
  background: var(--surface-container-low);
}

.tv-project-header__left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.tv-project-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 74, 198, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.tv-project-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tv-project-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tv-project-key {
  font-size: 12px;
  color: var(--outline);
}

.tv-project-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.tv-member-count {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface-variant);
  white-space: nowrap;
}

.tv-member-count--loading {
  color: var(--outline);
  font-weight: 400;
}

/* Chevron */
.tv-chevron {
  color: var(--outline);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.tv-chevron--open {
  transform: rotate(180deg);
}

/* ── Accordion body ──────────────────────────────────────────────────────────── */
.tv-project-body {
  border-top: 1px solid var(--border-subtle);
  background: rgba(237, 237, 249, 0.2);
}

/* Collapse transition */
.tv-collapse-enter-active,
.tv-collapse-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: top;
}

.tv-collapse-enter-from,
.tv-collapse-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

/* Loading state */
.tv-body-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  font-size: 13px;
  color: var(--outline);
}

/* Empty members */
.tv-body-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px;
  font-size: 14px;
  color: var(--on-surface-variant);
  text-align: center;
}

.tv-body-empty p {
  margin: 0;
}

/* ── Members table ───────────────────────────────────────────────────────────── */
.tv-members-table-wrap {
  overflow-x: auto;
}

.tv-members-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.tv-members-thead {
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--border-subtle);
}

.tv-members-th {
  padding: 10px 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  white-space: nowrap;
}

.tv-members-th--email {
  /* hide on small screens */
}

.tv-members-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.12s;
}

.tv-members-row:last-child {
  border-bottom: none;
}

.tv-members-row:hover {
  background: rgba(0, 74, 198, 0.02);
}

.tv-members-td {
  padding: 12px 20px;
  vertical-align: middle;
}

.tv-members-td--email {
  font-size: 13px;
  color: var(--outline);
}

/* Member cell */
.tv-member-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tv-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
}

.tv-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tv-avatar__initials {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.tv-member-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tv-member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 18px;
}

.tv-member-username {
  font-size: 12px;
  color: var(--outline);
}

/* Role badge */
.tv-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Body footer ─────────────────────────────────────────────────────────────── */
.tv-body-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-container-low);
}

/* ── Action buttons ──────────────────────────────────────────────────────────── */
.tv-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
  border: none;
  white-space: nowrap;
}

.tv-action-btn--outline {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  color: var(--on-surface-variant);
}

.tv-action-btn--outline:hover {
  background: var(--surface-container-low);
}

.tv-action-btn--primary {
  background: var(--primary);
  color: #fff;
}

.tv-action-btn--primary:hover {
  background: var(--primary-container);
}

/* ── Spinner ─────────────────────────────────────────────────────────────────── */
.tv-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--outline-variant);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .tv-members-th--email,
  .tv-members-td--email {
    display: none;
  }

  .tv-body-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .tv-action-btn {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .team-view__stats {
    flex-direction: column;
  }
}
</style>
