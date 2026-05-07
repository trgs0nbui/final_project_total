<script setup>
/**
 * KanbanColumn — một cột trong Kanban board.
 *
 * Props:
 *   title  {string}  — tiêu đề hiển thị của cột
 *   status {string}  — giá trị status ('todo' | 'in_progress' | 'done')
 *   tasks  {Task[]}  — danh sách task thuộc cột này
 *
 * Emits:
 *   task-dropped (taskId: string, newStatus: string)
 *   edit-task    (task)
 *   delete-task  (task)
 *   add-task     (status)
 */
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Plus } from '@element-plus/icons-vue'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    validator: (v) => ['todo', 'in_progress', 'done'].includes(v),
  },
  tasks: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['task-dropped', 'edit-task', 'delete-task', 'add-task', 'view-task'])

// ── Column styling ────────────────────────────────────────────────────────────

const COLUMN_CONFIG = {
  todo: { badgeBg: '#F1F5F9', badgeColor: '#737686' },
  in_progress: { badgeBg: '#DBEAFE', badgeColor: '#2563eb' },
  done: { badgeBg: '#DCFCE7', badgeColor: '#16a34a' },
}

const config = COLUMN_CONFIG[props.status] ?? COLUMN_CONFIG.todo

// ── Draggable list ────────────────────────────────────────────────────────────
//
// VueDraggable requires a writable ref — a computed with a no-op setter does
// NOT work because SortableJS mutates the array in-place when items are moved.
// We keep a local ref that mirrors the prop and re-sync it whenever the prop
// changes (e.g. after a successful PATCH response from the server).
//
// The actual status update is handled by the @add event: when a card is
// dragged INTO this column from another column, we emit task-dropped so the
// parent can call TaskStore.patchTask().

const localTasks = ref([...props.tasks])

watch(
  () => props.tasks,
  (newTasks) => {
    localTasks.value = [...newTasks]
  },
  { deep: true },
)

/**
 * Fired by VueDraggable when a task card is dropped INTO this column.
 * event.item is the dragged DOM element; we read the task UUID from its
 * data-task-id attribute (set on the wrapper div below).
 *
 * @param {SortableEvent} event
 */
function onAdd(event) {
  // task IDs are UUIDs — keep them as strings, never coerce with Number()
  const taskId = event.item?.dataset?.taskId
  if (taskId) {
    emit('task-dropped', taskId, props.status)
  }
}
</script>

<template>
  <div class="kanban-column" :aria-label="`Cột ${title}`">
    <!-- Header -->
    <div class="kanban-column__header">
      <div class="kanban-column__header-left">
        <h3 class="kanban-column__title">{{ title }}</h3>
        <span
          class="kanban-column__count"
          :style="{ backgroundColor: config.badgeBg, color: config.badgeColor }"
        >
          {{ tasks.length }}
        </span>
      </div>
      <button
        class="kanban-column__add-btn"
        :title="`Thêm công việc vào ${title}`"
        :aria-label="`Thêm công việc vào ${title}`"
        @click="emit('add-task', status)"
      >
        <el-icon :size="18"><Plus /></el-icon>
      </button>
    </div>

    <!-- Draggable task list -->
    <VueDraggable
      v-model="localTasks"
      :group="{ name: 'kanban', pull: true, put: true }"
      class="kanban-column__list"
      ghost-class="task-card--ghost"
      drag-class="task-card--dragging"
      :animation="200"
      item-key="id"
      @add="onAdd"
    >
      <div
        v-for="task in localTasks"
        :key="task.id"
        :data-task-id="task.id"
        class="kanban-column__item"
      >
        <TaskCard
          :task="task"
          @edit="(t) => emit('edit-task', t)"
          @delete="(t) => emit('delete-task', t)"
          @view="(t) => emit('view-task', t)"
        />
      </div>
    </VueDraggable>

    <!-- Empty placeholder -->
    <div v-if="localTasks.length === 0" class="kanban-column__empty">Kéo thả công việc vào đây</div>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.kanban-column {
  --surface-lowest: #ffffff;
  --surface-container-high: #e7e7f3;
  --on-surface: #191b23;
  --outline: #737686;
  --border-subtle: #e2e8f0;
}

/* ── Column shell ────────────────────────────────────────────────────────────── */
.kanban-column {
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.kanban-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kanban-column__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-column__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--on-surface);
  margin: 0;
}

.kanban-column__count {
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.kanban-column__add-btn {
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
}

.kanban-column__add-btn:hover {
  background: var(--surface-container-high);
  color: var(--on-surface);
}

/* ── Task list ───────────────────────────────────────────────────────────────── */
.kanban-column__list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* min-height ensures SortableJS can detect the drop zone even when empty */
  min-height: 80px;
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.kanban-column__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  font-style: italic;
  border: 2px dashed var(--border-subtle);
  border-radius: 8px;
  margin-top: 4px;
}

/* ── Drag states ─────────────────────────────────────────────────────────────── */
:deep(.task-card--ghost) {
  opacity: 0.35;
  background: #dbeafe;
  border: 1px dashed #004ac6;
  border-radius: 12px;
}

:deep(.task-card--dragging) {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: rotate(1.5deg);
}
</style>
