<template>
  <div class="project-card" @click="handleCardClick">
    <!-- Card body -->
    <div class="project-card__body">
      <!-- Top row: icon + key badge -->
      <div class="project-card__top">
        <div class="project-card__icon-wrap" :style="{ backgroundColor: iconBg }">
          <el-icon :size="22" :color="iconColor">
            <component :is="projectIcon" />
          </el-icon>
        </div>
        <span class="project-card__key">{{ project.key || '—' }}</span>
      </div>

      <!-- Title -->
      <h3 class="project-card__name">{{ project.name }}</h3>

      <!-- Description -->
      <p class="project-card__description">
        {{ project.description || 'Chưa có mô tả.' }}
      </p>

      <!-- Tags -->
      <div class="project-card__tags">
        <span class="project-card__tag project-card__tag--type">
          {{ typeLabel }}
        </span>
        <span v-if="project.category" class="project-card__tag project-card__tag--category">
          {{ project.category }}
        </span>
      </div>
    </div>

    <!-- Footer: meta + actions -->
    <div class="project-card__footer">
      <div class="project-card__meta">
        <span class="project-card__task-count">
          <el-icon :size="13"><Tickets /></el-icon>
          {{ taskCount }} công việc
        </span>
        <span class="project-card__date">{{ formattedDate }}</span>
      </div>

      <div class="project-card__actions">
        <!-- Delete -->
        <button
          class="project-card__action-btn project-card__action-btn--danger"
          title="Xóa dự án"
          aria-label="Xóa dự án"
          @click.stop="handleDelete"
        >
          <el-icon :size="15"><Delete /></el-icon>
        </button>
        <!-- Navigate -->
        <button
          class="project-card__action-btn project-card__action-btn--nav"
          title="Xem chi tiết"
          aria-label="Xem chi tiết dự án"
          @click.stop="handleCardClick"
        >
          <el-icon :size="15"><ArrowRight /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Delete,
  ArrowRight,
  Tickets,
  Monitor,
  Briefcase,
  Service,
  FolderOpened,
} from '@element-plus/icons-vue'

const props = defineProps({
  project: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['click', 'delete'])

// ── Icon & color by project_type ──────────────────────────────────────────────

const TYPE_CONFIG = {
  software: { icon: Monitor, bg: '#DBEAFE', color: '#2563eb' },
  business: { icon: Briefcase, bg: '#DCFCE7', color: '#16a34a' },
  service: { icon: Service, bg: '#FEF3C7', color: '#d97706' },
  default: { icon: FolderOpened, bg: '#F1F5F9', color: '#505f76' },
}

const typeConfig = computed(() => TYPE_CONFIG[props.project.project_type] ?? TYPE_CONFIG.default)

const projectIcon = computed(() => typeConfig.value.icon)
const iconBg = computed(() => typeConfig.value.bg)
const iconColor = computed(() => typeConfig.value.color)

// ── Type label ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  software: 'Phần mềm',
  business: 'Kinh doanh',
  service: 'Dịch vụ',
}

const typeLabel = computed(
  () => TYPE_LABELS[props.project.project_type] ?? props.project.project_type ?? 'Dự án',
)

// ── Task count ────────────────────────────────────────────────────────────────

const taskCount = computed(() => {
  if (typeof props.project.task_count === 'number') return props.project.task_count
  if (Array.isArray(props.project.tasks)) return props.project.tasks.length
  return 0
})

// ── Date ──────────────────────────────────────────────────────────────────────

const formattedDate = computed(() => {
  if (!props.project.created_at) return '—'
  return new Date(props.project.created_at).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

// ── Handlers ─────────────────────────────────────────────────────────────────

function handleCardClick() {
  emit('click', props.project)
}

function handleDelete() {
  emit('delete', props.project)
}
</script>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.project-card {
  --surface-lowest: #ffffff;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --surface-variant: #e1e2ed;
  --secondary-container: #d0e1fb;
  --on-secondary-container: #54647a;
  --primary: #004ac6;
  --error: #ba1a1a;
}

/* ── Card shell ──────────────────────────────────────────────────────────────── */
.project-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.15s;
  height: 100%;
  box-sizing: border-box;
}

.project-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* ── Body ────────────────────────────────────────────────────────────────────── */
.project-card__body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Top row ─────────────────────────────────────────────────────────────────── */
.project-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-card__icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.project-card__key {
  /* label-caps — DESIGN.md */
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  background: var(--surface-variant);
  padding: 2px 8px;
  border-radius: 4px;
}

/* ── Name ────────────────────────────────────────────────────────────────────── */
.project-card__name {
  /* h3 — DESIGN.md */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--on-surface);
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Description ─────────────────────────────────────────────────────────────── */
.project-card__description {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface-variant);
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Tags ────────────────────────────────────────────────────────────────────── */
.project-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.project-card__tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 9999px;
}

.project-card__tag--type {
  background: var(--secondary-container);
  color: var(--on-secondary-container);
}

.project-card__tag--category {
  background: #f3f3fe;
  color: #434655;
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
.project-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.project-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-card__task-count,
.project-card__date {
  display: flex;
  align-items: center;
  gap: 4px;
  /* body-sm — DESIGN.md */
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--outline);
}

/* ── Action buttons ──────────────────────────────────────────────────────────── */
.project-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-card__action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.project-card__action-btn--danger {
  color: var(--outline);
}

.project-card__action-btn--danger:hover {
  background-color: #ffdad6;
  color: var(--error);
}

.project-card__action-btn--nav {
  color: var(--outline);
}

.project-card__action-btn--nav:hover {
  background-color: #f3f3fe;
  color: var(--primary);
}
</style>
