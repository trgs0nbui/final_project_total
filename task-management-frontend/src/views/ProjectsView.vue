<script setup>
/**
 * ProjectsView — danh sách tất cả dự án của người dùng.
 * (Nội dung được chuyển từ DashboardView cũ)
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/projects'
import ProjectCard from '@/components/project/ProjectCard.vue'
import ProjectForm from '@/components/project/ProjectForm.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()

// ── State ─────────────────────────────────────────────────────────────────────
const isFormVisible = ref(false)
const editingProject = ref(null)

// ── Computed ──────────────────────────────────────────────────────────────────
const allProjects = computed(() => projectStore.projects)
const isLoading = computed(() => projectStore.isLoading)
const storeError = computed(() => projectStore.error)

/**
 * Client-side search filter — reads ?search= từ URL query param
 * (được set bởi AppTopbar khi người dùng submit tìm kiếm).
 */
const searchQuery = computed(() => (route.query.search ?? '').toString().toLowerCase().trim())

const projects = computed(() => {
  if (!searchQuery.value) return allProjects.value
  return allProjects.value.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.value) ||
      p.key?.toLowerCase().includes(searchQuery.value) ||
      p.description?.toLowerCase().includes(searchQuery.value),
  )
})

const projectCountLabel = computed(() => {
  if (searchQuery.value) {
    return `Tìm thấy ${projects.value.length} dự án cho "${route.query.search}".`
  }
  return projects.value.length > 0
    ? `Bạn có ${projects.value.length} dự án đang hoạt động.`
    : 'Bạn chưa có dự án nào.'
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await projectStore.fetchProjects()
})

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleCardClick(project) {
  router.push(`/projects/${project.id}`)
}

function openCreateForm() {
  editingProject.value = null
  isFormVisible.value = true
}

function clearSearch() {
  router.replace({ query: {} })
}

async function handleFormSubmit(formData) {
  if (editingProject.value) {
    ElMessage.info('Chức năng chỉnh sửa sẽ được triển khai sau.')
    isFormVisible.value = false
    return
  }

  const created = await projectStore.createProject(formData)
  if (created) {
    ElMessage.success('Tạo dự án thành công!')
    isFormVisible.value = false
  } else if (storeError.value) {
    ElMessage.error(storeError.value)
  }
}

async function handleDeleteProject(project) {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa dự án "${project.name}" không? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa dự án',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await projectStore.deleteProject(project.id)
    if (!storeError.value) {
      ElMessage.success('Xóa dự án thành công!')
    } else {
      ElMessage.error(storeError.value)
    }
  } catch {
    // Người dùng nhấn Hủy — không làm gì
  }
}
</script>

<template>
  <div class="projects-view">
    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="projects-view__header">
      <div>
        <h2 class="projects-view__title">Dự án</h2>
        <p class="projects-view__subtitle">
          {{ projectCountLabel }}
          <button v-if="searchQuery" class="projects-view__clear-search" @click="clearSearch">
            Xóa tìm kiếm
          </button>
        </p>
      </div>
      <div class="projects-view__header-actions">
        <button class="projects-view__create-btn" @click="openCreateForm">
          <el-icon :size="16"><Plus /></el-icon>
          <span>Tạo dự án</span>
        </button>
      </div>
    </div>

    <!-- ── API error ────────────────────────────────────────────────────── -->
    <el-alert
      v-if="storeError && !isLoading"
      :title="storeError"
      type="error"
      show-icon
      :closable="false"
      class="projects-view__error"
    />

    <!-- ── Skeleton loading ─────────────────────────────────────────────── -->
    <SkeletonCard v-if="isLoading" :count="6" />

    <!-- ── Project grid ─────────────────────────────────────────────────── -->
    <template v-else-if="projects.length > 0">
      <div class="project-grid">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          @click="handleCardClick"
          @delete="handleDeleteProject"
        />

        <!-- "Create new project" bento tile -->
        <div
          class="project-grid__new-tile"
          role="button"
          tabindex="0"
          @click="openCreateForm"
          @keydown.enter="openCreateForm"
        >
          <div class="new-tile__icon-wrap" aria-hidden="true">
            <el-icon :size="24"><Plus /></el-icon>
          </div>
          <h3 class="new-tile__title">Tạo dự án mới</h3>
          <p class="new-tile__subtitle">Bắt đầu workflow mới hoặc tạo từ template.</p>
        </div>
      </div>
    </template>

    <!-- ── Empty state ──────────────────────────────────────────────────── -->
    <div v-else class="projects-view__empty">
      <div class="empty-state">
        <div class="empty-state__icon" aria-hidden="true">
          <el-icon :size="32"><Plus /></el-icon>
        </div>
        <h3 class="empty-state__title">Chưa có dự án nào</h3>
        <p class="empty-state__subtitle">Tạo dự án đầu tiên để bắt đầu quản lý công việc.</p>
        <el-button type="primary" :icon="Plus" class="empty-state__btn" @click="openCreateForm">
          Tạo dự án mới
        </el-button>
      </div>
    </div>

    <!-- ── Project form dialog ──────────────────────────────────────────── -->
    <ProjectForm
      v-model:visible="isFormVisible"
      :project="editingProject"
      @submit="handleFormSubmit"
    />

    <!-- ── FAB ──────────────────────────────────────────────────────────── -->
    <button class="projects-view__fab" aria-label="Tạo dự án mới" @click="openCreateForm">
      <el-icon :size="26"><Plus /></el-icon>
    </button>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.projects-view {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.projects-view {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 80px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.projects-view__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.projects-view__title {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.projects-view__subtitle {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.projects-view__clear-search {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

.projects-view__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.projects-view__create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background-color 0.15s;
}

.projects-view__create-btn:hover {
  background: var(--surface-container-low);
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.projects-view__error {
  margin-bottom: 24px;
  border-radius: 8px;
}

/* ── Project grid ────────────────────────────────────────────────────────────── */
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* ── "Create new" tile ───────────────────────────────────────────────────────── */
.project-grid__new-tile {
  border: 2px dashed var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;
  min-height: 200px;
  outline: none;
}

.project-grid__new-tile:hover,
.project-grid__new-tile:focus-visible {
  background-color: var(--surface-container-low);
  border-color: var(--outline-variant);
}

.new-tile__icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--surface-container);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--outline);
  margin-bottom: 16px;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.project-grid__new-tile:hover .new-tile__icon-wrap {
  background: rgba(0, 74, 198, 0.1);
  color: var(--primary);
}

.new-tile__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--on-surface-variant);
  margin: 0 0 6px;
}

.new-tile__subtitle {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  margin: 0;
  max-width: 200px;
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.projects-view__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.empty-state__icon {
  width: 64px;
  height: 64px;
  background: var(--surface-container-low);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--outline);
  margin-bottom: 4px;
}

.empty-state__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0;
}

.empty-state__subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
  max-width: 320px;
}

.empty-state__btn {
  margin-top: 8px;
}

/* ── FAB ─────────────────────────────────────────────────────────────────────── */
.projects-view__fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 74, 198, 0.35);
  transition:
    box-shadow 0.2s,
    transform 0.15s,
    background-color 0.15s;
  z-index: 30;
}

.projects-view__fab:hover {
  box-shadow: 0 6px 20px rgba(0, 74, 198, 0.45);
  transform: translateY(-2px);
  background: var(--primary-container);
}

.projects-view__fab:active {
  transform: scale(0.92);
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .project-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .project-grid {
    grid-template-columns: 1fr;
  }

  .projects-view__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
