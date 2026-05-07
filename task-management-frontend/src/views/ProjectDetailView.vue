<script setup>
/**
 * ProjectDetailView — trang chi tiết dự án.
 *
 * Hiển thị thông tin dự án và danh sách công việc dưới dạng KanbanBoard hoặc TaskTable.
 * Hỗ trợ tạo, chỉnh sửa, xóa task và kéo thả để thay đổi trạng thái.
 */
import { ref, computed, onMounted, watch, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Grid, List, UserFilled } from '@element-plus/icons-vue'
import { useTaskStore } from '@/stores/tasks'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { handleApiError } from '@/utils/errorHandler'
import KanbanBoard from '@/components/task/KanbanBoard.vue'
import TaskTable from '@/components/task/TaskTable.vue'
import TaskForm from '@/components/task/TaskForm.vue'
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer.vue'
import MemberSearchDialog from '@/components/project/MemberSearchDialog.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const authStore = useAuthStore()

// ── provide/inject: chia sẻ projectId với deeply nested components ────────────
const projectId = computed(() => route.params.id)
provide('projectId', projectId)

// ── State ─────────────────────────────────────────────────────────────────────
const viewMode = ref('kanban')
const isTaskFormVisible = ref(false)
const editingTask = ref(null)
const formMode = ref('create')
const isSubmitting = ref(false)

/** Task đang được xem trong drawer chi tiết */
const viewingTask = ref(null)

// ── Computed ──────────────────────────────────────────────────────────────────
const tasks = computed(() => taskStore.tasks)
const isTaskLoading = computed(() => taskStore.isLoading)
const isProjectLoading = computed(() => projectStore.isLoading)
const currentProject = computed(() => projectStore.currentProject)

const isOwner = computed(() =>
  currentProject.value && authStore.user
    ? String(currentProject.value.owner?.id) === String(authStore.user.id)
    : false,
)

const isMemberDialogVisible = ref(false)

const pageTitle = computed(() =>
  currentProject.value ? currentProject.value.name : 'Chi tiết dự án',
)

const dialogTitle = computed(() =>
  formMode.value === 'edit' ? 'Chỉnh sửa công việc' : 'Tạo công việc mới',
)

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchProjectData(id) {
  if (!id) return
  try {
    await Promise.all([projectStore.fetchProjectById(id), taskStore.fetchTasks(id)])
    if (projectStore.error) handleApiError({ message: projectStore.error }, true)
    if (taskStore.error) handleApiError({ message: taskStore.error }, true)
  } catch (err) {
    handleApiError(err, true)
  }
}

onMounted(async () => {
  await fetchProjectData(route.params.id)
})

watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) await fetchProjectData(newId)
  },
)

// ── Handlers ──────────────────────────────────────────────────────────────────
function setViewMode(mode) {
  viewMode.value = mode
}

async function handleTaskMoved(taskId, newStatus) {
  try {
    const updated = await taskStore.patchTask(taskId, { status: newStatus })
    if (updated) {
      ElMessage.success('Cập nhật trạng thái thành công!')
    } else if (taskStore.error) {
      ElMessage.error(taskStore.error)
    }
  } catch (err) {
    handleApiError(err, true)
  }
}

function openCreateTask() {
  editingTask.value = null
  formMode.value = 'create'
  isTaskFormVisible.value = true
}

/**
 * Mở drawer xem chi tiết task.
 * @param {Object} task
 */
function openViewTask(task) {
  viewingTask.value = task
}

function closeViewTask() {
  viewingTask.value = null
}

/**
 * Mở form tạo task với status được chọn sẵn (từ nút + trong cột Kanban).
 * @param {string} status
 */
function openCreateTaskWithStatus(status) {
  editingTask.value = { status } // TaskForm sẽ dùng giá trị này làm default
  formMode.value = 'create'
  isTaskFormVisible.value = true
}

function openEditTask(task) {
  editingTask.value = task
  formMode.value = 'edit'
  isTaskFormVisible.value = true
}

function closeTaskForm() {
  isTaskFormVisible.value = false
  editingTask.value = null
}

async function handleTaskFormSubmit(formData) {
  isSubmitting.value = true
  try {
    if (formMode.value === 'edit' && editingTask.value) {
      const updated = await taskStore.updateTask(editingTask.value.id, formData)
      if (updated) {
        ElMessage.success('Cập nhật công việc thành công!')
        closeTaskForm()
      } else if (taskStore.error) {
        ElMessage.error(taskStore.error)
      }
    } else {
      const created = await taskStore.createTask(route.params.id, formData)
      if (created) {
        ElMessage.success('Tạo công việc thành công!')
        closeTaskForm()
      } else if (taskStore.error) {
        ElMessage.error(taskStore.error)
      }
    }
  } catch (err) {
    handleApiError(err, true)
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteTask(task) {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa công việc "${task.title}" không? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa công việc',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await taskStore.deleteTask(task.id)
    if (!taskStore.error) {
      ElMessage.success('Xóa công việc thành công!')
    } else {
      ElMessage.error(taskStore.error)
    }
  } catch {
    // Người dùng nhấn Hủy — không làm gì
  }
}
</script>

<template>
  <div class="project-detail">
    <!-- Toàn trang loading khi fetch project lần đầu -->
    <div v-if="isProjectLoading && !currentProject" class="project-detail__page-loading">
      <LoadingSpinner size="large" />
    </div>

    <template v-else>
      <!-- ── Project header ──────────────────────────────────────────────── -->
      <section class="project-detail__header">
        <div class="project-detail__header-top">
          <!-- Breadcrumb -->
          <nav class="project-detail__breadcrumb" aria-label="Điều hướng">
            <button class="breadcrumb__link" @click="router.push('/dashboard')">Dự án</button>
            <span class="breadcrumb__sep" aria-hidden="true">›</span>
            <span class="breadcrumb__current">{{ pageTitle }}</span>
          </nav>

          <!-- Title row -->
          <div class="project-detail__title-row">
            <div class="project-detail__title-group">
              <h2 class="project-detail__title">
                {{ pageTitle }}
                <span v-if="currentProject?.key" class="project-detail__key-badge">
                  {{ currentProject.key }}
                </span>
              </h2>
              <p v-if="currentProject?.description" class="project-detail__description">
                {{ currentProject.description }}
              </p>
            </div>

            <!-- Right: members + actions -->
            <div class="project-detail__header-actions">
              <!-- Member avatars -->
              <div v-if="currentProject?.members?.length" class="member-stack">
                <div
                  v-for="(member, i) in currentProject.members.slice(0, 4)"
                  :key="member.id"
                  class="member-stack__avatar"
                  :title="member.username"
                  :style="{ zIndex: 10 - i }"
                >
                  {{ member.username?.slice(0, 2).toUpperCase() }}
                </div>
                <div
                  v-if="currentProject.members.length > 4"
                  class="member-stack__avatar member-stack__avatar--more"
                >
                  +{{ currentProject.members.length - 4 }}
                </div>
              </div>

              <!-- Thêm thành viên (chỉ owner) -->
              <button
                v-if="isOwner"
                class="project-detail__btn project-detail__btn--outline"
                @click="isMemberDialogVisible = true"
              >
                <el-icon :size="16"><UserFilled /></el-icon>
                <span>Thêm thành viên</span>
              </button>

              <!-- Quản lý thành viên -->
              <button
                class="project-detail__btn project-detail__btn--outline"
                @click="router.push(`/projects/${route.params.id}/members`)"
              >
                <el-icon :size="16"><UserFilled /></el-icon>
                <span>Thành viên</span>
              </button>

              <!-- Tạo công việc -->
              <button
                class="project-detail__btn project-detail__btn--primary"
                @click="openCreateTask"
              >
                <el-icon :size="16"><Plus /></el-icon>
                <span>Tạo công việc</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── View switcher ──────────────────────────────────────────────── -->
        <div class="project-detail__toolbar">
          <div class="view-toggle" role="group" aria-label="Chế độ xem">
            <button
              class="view-toggle__btn"
              :class="{ 'view-toggle__btn--active': viewMode === 'kanban' }"
              @click="setViewMode('kanban')"
            >
              <el-icon :size="16"><Grid /></el-icon>
              <span>Kanban</span>
            </button>
            <button
              class="view-toggle__btn"
              :class="{ 'view-toggle__btn--active': viewMode === 'table' }"
              @click="setViewMode('table')"
            >
              <el-icon :size="16"><List /></el-icon>
              <span>Bảng</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── API error ───────────────────────────────────────────────────── -->
      <el-alert
        v-if="taskStore.error && !isTaskLoading"
        :title="taskStore.error"
        type="error"
        show-icon
        :closable="false"
        class="project-detail__error"
      />

      <!-- ── Kanban view ─────────────────────────────────────────────────── -->
      <KanbanBoard
        v-if="viewMode === 'kanban'"
        :tasks="tasks"
        :is-loading="isTaskLoading"
        :project-id="String(route.params.id)"
        @task-moved="handleTaskMoved"
        @edit-task="openEditTask"
        @delete-task="handleDeleteTask"
        @add-task="openCreateTaskWithStatus"
        @view-task="openViewTask"
      />

      <!-- ── Table view ──────────────────────────────────────────────────── -->
      <TaskTable
        v-else
        :tasks="tasks"
        :is-loading="isTaskLoading"
        :project-id="String(route.params.id)"
        @edit-task="openEditTask"
        @delete-task="handleDeleteTask"
        @view-task="openViewTask"
      />
    </template>

    <!-- ── TaskForm dialog ─────────────────────────────────────────────── -->
    <el-dialog
      v-model="isTaskFormVisible"
      :title="dialogTitle"
      width="560px"
      :close-on-click-modal="false"
      :close-on-press-escape="!isSubmitting"
      destroy-on-close
      @close="closeTaskForm"
    >
      <TaskForm
        v-if="isTaskFormVisible"
        :task="editingTask"
        :project-id="String(route.params.id)"
        :mode="formMode"
        @submit="handleTaskFormSubmit"
        @cancel="closeTaskForm"
      />
    </el-dialog>

    <!-- ── Thêm thành viên dialog (chỉ owner) ─────────────────────────── -->
    <MemberSearchDialog
      v-if="isOwner"
      v-model:visible="isMemberDialogVisible"
      :project-id="String(route.params.id)"
      @member-added="() => {}"
    />

    <!-- ── FAB ────────────────────────────────────────────────────────── -->
    <button class="project-detail__fab" aria-label="Tạo công việc mới" @click="openCreateTask">
      <el-icon :size="26"><Plus /></el-icon>
    </button>

    <!-- ── Task detail drawer ─────────────────────────────────────────── -->
    <TaskDetailDrawer
      :task="viewingTask"
      :project-id="String(route.params.id)"
      :project-name="currentProject?.name ?? ''"
      :is-owner="isOwner"
      @close="closeViewTask"
      @edit-task="
        (task) => {
          closeViewTask()
          openEditTask(task)
        }
      "
      @delete-task="
        (task) => {
          closeViewTask()
          handleDeleteTask(task)
        }
      "
    />
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.project-detail {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --surface-container-high: #e7e7f3;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.project-detail {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 80px;
}

/* ── Page loading ────────────────────────────────────────────────────────────── */
.project-detail__page-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* ── Header section ──────────────────────────────────────────────────────────── */
.project-detail__header {
  margin-bottom: 0;
}

.project-detail__header-top {
  padding-bottom: 24px;
}

/* ── Breadcrumb ──────────────────────────────────────────────────────────────── */
.project-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.breadcrumb__link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  transition: color 0.15s;
}

.breadcrumb__link:hover {
  color: var(--primary);
}

.breadcrumb__sep {
  font-size: 13px;
  color: var(--outline-variant);
}

.breadcrumb__current {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
}

/* ── Title row ───────────────────────────────────────────────────────────────── */
.project-detail__title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.project-detail__title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-detail__title {
  /* h1 — DESIGN.md */
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-detail__key-badge {
  /* ui-table-header — DESIGN.md */
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--outline);
  background: var(--surface-container-high);
  padding: 2px 8px;
  border-radius: 4px;
}

.project-detail__description {
  /* body-base — DESIGN.md */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0;
  max-width: 600px;
}

/* ── Header actions ──────────────────────────────────────────────────────────── */
.project-detail__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* ── Member avatar stack ─────────────────────────────────────────────────────── */
.member-stack {
  display: flex;
  margin-right: 4px;
}

.member-stack__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: #ffffff;
  border: 2px solid var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  margin-left: -8px;
  cursor: default;
  transition: transform 0.15s;
}

.member-stack__avatar:first-child {
  margin-left: 0;
}

.member-stack__avatar:hover {
  transform: translateY(-2px);
}

.member-stack__avatar--more {
  background: var(--surface-container-high);
  color: var(--outline);
}

/* ── Action buttons ──────────────────────────────────────────────────────────── */
.project-detail__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: inherit;
  /* body-sm semibold */
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    transform 0.1s;
  border: none;
}

.project-detail__btn:active {
  transform: scale(0.97);
}

.project-detail__btn--outline {
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  color: var(--on-surface-variant);
}

.project-detail__btn--outline:hover {
  background: var(--surface-container-low);
}

.project-detail__btn--primary {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 74, 198, 0.25);
}

.project-detail__btn--primary:hover {
  background: var(--primary-container);
}

/* ── Toolbar (view switcher + filters) ───────────────────────────────────────── */
.project-detail__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 24px;
  gap: 16px;
}

/* ── View toggle ─────────────────────────────────────────────────────────────── */
.view-toggle {
  display: flex;
  padding: 4px;
  background: var(--surface-container-low);
  border-radius: 8px;
  gap: 2px;
}

.view-toggle__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: var(--outline);
  background: transparent;
  transition:
    background-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.view-toggle__btn--active {
  background: var(--surface-container-lowest);
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.view-toggle__btn:not(.view-toggle__btn--active):hover {
  color: var(--on-surface);
}

/* ── Filter chips ────────────────────────────────────────────────────────────── */
.project-detail__filter-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 400;
  color: var(--outline);
}

.filter-chip strong {
  color: var(--on-surface);
  font-weight: 700;
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.project-detail__error {
  margin-bottom: 20px;
  border-radius: 8px;
}

/* ── FAB ─────────────────────────────────────────────────────────────────────── */
.project-detail__fab {
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

.project-detail__fab:hover {
  box-shadow: 0 6px 20px rgba(0, 74, 198, 0.45);
  transform: translateY(-2px);
  background: var(--primary-container);
}

.project-detail__fab:active {
  transform: scale(0.92);
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .project-detail__title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-detail__header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .project-detail__filter-info {
    display: none;
  }
}
</style>
