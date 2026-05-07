<script setup>
/**
 * TaskCard — hiển thị thông tin tóm tắt của một công việc trong Kanban board.
 *
 * Props:
 *   task {Task} — đối tượng công việc cần hiển thị
 *
 * Emits:
 *   edit (task)
 *   delete (task)
 */
import { computed, ref } from 'vue'
import { Edit, Delete, MoreFilled } from '@element-plus/icons-vue'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete', 'view'])

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high: {
    label: 'Ưu tiên cao',
    borderColor: '#EF4444',
    badgeBg: 'rgba(239,68,68,0.1)',
    badgeColor: '#EF4444',
  },
  medium: {
    label: 'Ưu tiên trung',
    borderColor: '#F97316',
    badgeBg: 'rgba(249,115,22,0.1)',
    badgeColor: '#F97316',
  },
  low: {
    label: 'Ưu tiên thấp',
    borderColor: '#94A3B8',
    badgeBg: 'rgba(148,163,184,0.15)',
    badgeColor: '#64748b',
  },
}

const DEFAULT_PRIORITY = {
  label: 'Không rõ',
  borderColor: '#c3c6d7',
  badgeBg: '#f3f3fe',
  badgeColor: '#737686',
}

const priorityConfig = computed(() => PRIORITY_CONFIG[props.task.priority] ?? DEFAULT_PRIORITY)

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo: { label: 'Chờ xử lý', bg: '#F1F5F9', color: '#737686' },
  in_progress: { label: 'Đang thực hiện', bg: '#DBEAFE', color: '#2563eb' },
  done: { label: 'Hoàn thành', bg: '#DCFCE7', color: '#16a34a' },
}

const statusConfig = computed(
  () =>
    STATUS_CONFIG[props.task.status] ?? {
      label: props.task.status,
      bg: '#f3f3fe',
      color: '#737686',
    },
)

// ── Due date ──────────────────────────────────────────────────────────────────

const formattedDueDate = computed(() => {
  if (!props.task.due_date) return null
  return new Date(props.task.due_date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

/** Kiểm tra xem task có quá hạn không */
const isOverdue = computed(() => {
  if (!props.task.due_date || props.task.status === 'done') return false
  return new Date(props.task.due_date) < new Date()
})

// ── Assignee initials ─────────────────────────────────────────────────────────

const assigneeInitials = computed(() => {
  const name = props.task.assignee?.username ?? ''
  return name.slice(0, 2).toUpperCase() || '?'
})

// ── More menu ─────────────────────────────────────────────────────────────────

const menuVisible = ref(false)

function handleEdit(event) {
  event.stopPropagation()
  menuVisible.value = false
  emit('edit', props.task)
}

function handleDelete(event) {
  event.stopPropagation()
  menuVisible.value = false
  emit('delete', props.task)
}
</script>

<template>
  <div
    class="task-card"
    :style="{ borderLeftColor: priorityConfig.borderColor }"
    role="article"
    :aria-label="task.title"
    @click="emit('view', task)"
  >
    <!-- Top row: priority badge + more menu -->
    <div class="task-card__top">
      <span
        class="task-card__priority-badge"
        :style="{ backgroundColor: priorityConfig.badgeBg, color: priorityConfig.badgeColor }"
      >
        {{ priorityConfig.label }}
      </span>

      <el-dropdown
        trigger="click"
        @command="(cmd) => (cmd === 'edit' ? handleEdit($event) : handleDelete($event))"
      >
        <button class="task-card__more-btn" :aria-label="`Tùy chọn cho ${task.title}`" @click.stop>
          <el-icon :size="18"><MoreFilled /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleEdit">
              <el-icon><Edit /></el-icon>
              Chỉnh sửa
            </el-dropdown-item>
            <el-dropdown-item @click="handleDelete">
              <el-icon><Delete /></el-icon>
              Xóa
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Title -->
    <h4 class="task-card__title">{{ task.title }}</h4>

    <!-- Footer: due date + assignee -->
    <div class="task-card__footer">
      <!-- Due date -->
      <div
        v-if="formattedDueDate"
        class="task-card__due"
        :class="{ 'task-card__due--overdue': isOverdue }"
      >
        <svg class="task-card__due-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="1.5"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <path
            d="M5 1.5V4M11 1.5V4M2 6.5h12"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
        <span>{{ isOverdue ? 'Quá hạn' : formattedDueDate }}</span>
      </div>
      <div v-else class="task-card__due task-card__due--empty">
        <svg class="task-card__due-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="1.5"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <path
            d="M5 1.5V4M11 1.5V4M2 6.5h12"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
        <span>Chưa có hạn</span>
      </div>

      <!-- Assignee avatar -->
      <div v-if="task.assignee" class="task-card__assignee" :title="task.assignee.username">
        {{ assigneeInitials }}
      </div>
      <div v-else class="task-card__assignee task-card__assignee--empty" title="Chưa giao">?</div>
    </div>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.task-card {
  --surface: #faf8ff;
  --surface-lowest: #ffffff;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --border-subtle: #e2e8f0;
  --primary: #004ac6;
  --error: #ba1a1a;
}

/* ── Card shell ──────────────────────────────────────────────────────────────── */
.task-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--border-subtle); /* overridden by :style */
  border-radius: 12px;
  padding: 16px;
  cursor: grab;
  user-select: none;
  transition:
    box-shadow 0.2s,
    transform 0.15s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.task-card:active {
  cursor: grabbing;
}

/* ── Top row ─────────────────────────────────────────────────────────────────── */
.task-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-card__priority-badge {
  /* label-caps — DESIGN.md */
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
}

.task-card__more-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--outline);
  transition:
    background-color 0.15s,
    color 0.15s;
  flex-shrink: 0;
}

.task-card__more-btn:hover {
  background: var(--border-subtle);
  color: var(--on-surface);
}

/* ── Title ───────────────────────────────────────────────────────────────────── */
.task-card__title {
  /* body-base — DESIGN.md */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--on-surface);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
.task-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Due date ────────────────────────────────────────────────────────────────── */
.task-card__due {
  display: flex;
  align-items: center;
  gap: 4px;
  /* body-sm — DESIGN.md */
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  color: var(--outline);
}

.task-card__due--overdue {
  color: var(--error);
  font-weight: 700;
}

.task-card__due--empty {
  color: var(--border-subtle);
}

.task-card__due-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── Assignee avatar ─────────────────────────────────────────────────────────── */
.task-card__assignee {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
  cursor: default;
}

.task-card__assignee--empty {
  background: var(--border-subtle);
  color: var(--outline);
}
</style>
