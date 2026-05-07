<script setup>
/**
 * TaskDetailDrawer — drawer hiển thị chi tiết task và bình luận.
 *
 * Props:
 *   task        {Task|null}  — task đang xem; null khi đóng
 *   projectId   {string}     — UUID của project
 *   projectName {string}     — tên project (cho breadcrumb)
 *   isOwner     {boolean}    — user có phải owner không (để xóa comment)
 *
 * Emits:
 *   close
 *   edit-task  (task)
 *   delete-task (task)
 */
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Close, MoreFilled } from '@element-plus/icons-vue'
import { useCommentStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  task: { type: Object, default: null },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  isOwner: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'edit-task', 'delete-task'])

const commentStore = useCommentStore()
const authStore = useAuthStore()

// ── Comment input ─────────────────────────────────────────────────────────────

const newCommentText = ref('')
const editingCommentId = ref(null)
const editingContent = ref('')
const commentListRef = ref(null)

// ── Load comments when task changes ──────────────────────────────────────────

watch(
  () => props.task?.id,
  async (taskId) => {
    if (!taskId) {
      commentStore.clearComments()
      return
    }
    await commentStore.fetchComments(props.projectId, taskId)
    await nextTick()
    scrollToBottom()
  },
  { immediate: true },
)

function scrollToBottom() {
  if (commentListRef.value) {
    commentListRef.value.scrollTop = commentListRef.value.scrollHeight
  }
}

// ── Display helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  todo: { label: 'Chờ xử lý', dot: '#737686' },
  in_progress: { label: 'Đang thực hiện', dot: '#2563eb' },
  done: { label: 'Hoàn thành', dot: '#16a34a' },
}

const PRIORITY_CONFIG = {
  high: { label: 'Cao', color: '#EF4444' },
  medium: { label: 'Trung bình', color: '#F97316' },
  low: { label: 'Thấp', color: '#94A3B8' },
}

function getStatus(s) {
  return STATUS_CONFIG[s] ?? { label: s, dot: '#737686' }
}
function getPriority(p) {
  return PRIORITY_CONFIG[p] ?? { label: p, color: '#737686' }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  return `${days} ngày trước`
}

function getInitials(user) {
  return (user?.full_name || user?.username || '').slice(0, 2).toUpperCase() || '?'
}

// ── Comment actions ───────────────────────────────────────────────────────────

async function handleSendComment() {
  const content = newCommentText.value.trim()
  if (!content || !props.task) return

  const result = await commentStore.createComment(props.projectId, props.task.id, content)
  if (result) {
    newCommentText.value = ''
    await nextTick()
    scrollToBottom()
  } else if (commentStore.error) {
    ElMessage.error(commentStore.error)
  }
}

function startEditComment(comment) {
  editingCommentId.value = comment.id
  editingContent.value = comment.content
}

function cancelEditComment() {
  editingCommentId.value = null
  editingContent.value = ''
}

async function saveEditComment(comment) {
  const content = editingContent.value.trim()
  if (!content) return

  const result = await commentStore.updateComment(
    props.projectId,
    props.task.id,
    comment.id,
    content,
  )
  if (result) {
    cancelEditComment()
  } else if (commentStore.error) {
    ElMessage.error(commentStore.error)
  }
}

async function handleDeleteComment(comment) {
  try {
    await ElMessageBox.confirm('Bạn có chắc chắn muốn xóa bình luận này không?', 'Xác nhận xóa', {
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    const ok = await commentStore.deleteComment(props.projectId, props.task.id, comment.id)
    if (!ok && commentStore.error) ElMessage.error(commentStore.error)
  } catch {
    // Người dùng nhấn Hủy
  }
}

/** Kiểm tra user hiện tại có phải tác giả comment không */
function isCommentAuthor(comment) {
  return String(comment.author?.id) === String(authStore.user?.id)
}

// ── Keyboard shortcut: Ctrl+Enter gửi comment ────────────────────────────────

function handleTextareaKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSendComment()
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="drawer-slide">
      <div v-if="task" class="tdd-overlay" @click.self="emit('close')">
        <div class="tdd" role="dialog" :aria-label="task.title" aria-modal="true">
          <!-- ── Header ──────────────────────────────────────────────────── -->
          <div class="tdd__header">
            <div class="tdd__header-top">
              <!-- Breadcrumb -->
              <nav class="tdd__breadcrumb" aria-label="Điều hướng">
                <span class="tdd__breadcrumb-link">Dự án</span>
                <span class="tdd__breadcrumb-sep">›</span>
                <span class="tdd__breadcrumb-link">{{ projectName }}</span>
                <span class="tdd__breadcrumb-sep">›</span>
                <span class="tdd__breadcrumb-current">{{ task.project }}</span>
              </nav>

              <!-- Actions -->
              <div class="tdd__header-actions">
                <button
                  class="tdd__icon-btn"
                  title="Chỉnh sửa công việc"
                  @click="emit('edit-task', task)"
                >
                  <el-icon :size="18"><Edit /></el-icon>
                </button>
                <button
                  class="tdd__icon-btn tdd__icon-btn--danger"
                  title="Xóa công việc"
                  @click="emit('delete-task', task)"
                >
                  <el-icon :size="18"><Delete /></el-icon>
                </button>
                <button class="tdd__icon-btn" title="Đóng" @click="emit('close')">
                  <el-icon :size="20"><Close /></el-icon>
                </button>
              </div>
            </div>

            <h1 class="tdd__title">{{ task.title }}</h1>
          </div>

          <!-- ── Scrollable content ──────────────────────────────────────── -->
          <div ref="commentListRef" class="tdd__body">
            <!-- Metadata grid -->
            <div class="tdd__meta-grid">
              <!-- Status -->
              <div class="tdd__meta-item">
                <span class="tdd__meta-label">Trạng thái</span>
                <div class="tdd__meta-value">
                  <span
                    class="tdd__status-dot"
                    :style="{ backgroundColor: getStatus(task.status).dot }"
                  ></span>
                  <span class="tdd__meta-text">{{ getStatus(task.status).label }}</span>
                </div>
              </div>

              <!-- Priority -->
              <div class="tdd__meta-item">
                <span class="tdd__meta-label">Độ ưu tiên</span>
                <div class="tdd__meta-value" :style="{ color: getPriority(task.priority).color }">
                  <span class="tdd__meta-text tdd__meta-text--bold">
                    {{ getPriority(task.priority).label }}
                  </span>
                </div>
              </div>

              <!-- Assignee -->
              <div class="tdd__meta-item">
                <span class="tdd__meta-label">Người thực hiện</span>
                <div class="tdd__meta-value">
                  <div v-if="task.assignee" class="tdd__assignee">
                    <div class="tdd__assignee-avatar">
                      <img
                        v-if="task.assignee.avatar_url"
                        :src="task.assignee.avatar_url"
                        :alt="task.assignee.username"
                        class="tdd__assignee-img"
                      />
                      <span v-else class="tdd__assignee-initials">
                        {{ getInitials(task.assignee) }}
                      </span>
                    </div>
                    <span class="tdd__meta-text">
                      {{ task.assignee.full_name || task.assignee.username }}
                    </span>
                  </div>
                  <span v-else class="tdd__meta-text tdd__meta-text--muted">Chưa giao</span>
                </div>
              </div>

              <!-- Due date -->
              <div class="tdd__meta-item">
                <span class="tdd__meta-label">Hạn hoàn thành</span>
                <div
                  class="tdd__meta-value"
                  :class="{
                    'tdd__meta-value--overdue':
                      task.due_date &&
                      task.status !== 'done' &&
                      new Date(task.due_date) < new Date(),
                  }"
                >
                  <span class="tdd__meta-text">{{ formatDate(task.due_date) }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="tdd__section">
              <h3 class="tdd__section-title">Mô tả</h3>
              <p v-if="task.description" class="tdd__description">{{ task.description }}</p>
              <p v-else class="tdd__description tdd__description--empty">Chưa có mô tả.</p>
            </div>

            <!-- Activity / Comments -->
            <div class="tdd__section">
              <div class="tdd__activity-header">
                <h3 class="tdd__section-title">Hoạt động</h3>
                <div class="tdd__tab-group">
                  <button class="tdd__tab tdd__tab--active">Bình luận</button>
                </div>
              </div>

              <!-- Loading -->
              <div v-if="commentStore.isLoading" class="tdd__comments-loading">
                <span class="tdd__spinner" aria-hidden="true"></span>
                Đang tải bình luận...
              </div>

              <!-- Empty -->
              <div v-else-if="commentStore.comments.length === 0" class="tdd__comments-empty">
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </div>

              <!-- Comment list -->
              <div v-else class="tdd__comment-list">
                <div
                  v-for="comment in commentStore.comments"
                  :key="comment.id"
                  class="tdd__comment"
                >
                  <!-- Avatar -->
                  <div class="tdd__comment-avatar">
                    <img
                      v-if="comment.author?.avatar_url"
                      :src="comment.author.avatar_url"
                      :alt="comment.author.username"
                      class="tdd__comment-avatar-img"
                    />
                    <span v-else class="tdd__comment-avatar-initials">
                      {{ getInitials(comment.author) }}
                    </span>
                  </div>

                  <!-- Body -->
                  <div class="tdd__comment-body">
                    <div class="tdd__comment-meta">
                      <span class="tdd__comment-author">
                        {{ comment.author?.full_name || comment.author?.username }}
                      </span>
                      <span class="tdd__comment-time">· {{ timeAgo(comment.created_at) }}</span>
                    </div>

                    <!-- Edit mode -->
                    <div v-if="editingCommentId === comment.id" class="tdd__comment-edit">
                      <textarea
                        v-model="editingContent"
                        class="tdd__comment-edit-input"
                        rows="3"
                        @keydown.escape="cancelEditComment"
                      ></textarea>
                      <div class="tdd__comment-edit-actions">
                        <button
                          class="tdd__comment-action-btn tdd__comment-action-btn--primary"
                          :disabled="commentStore.isSubmitting"
                          @click="saveEditComment(comment)"
                        >
                          Lưu
                        </button>
                        <button class="tdd__comment-action-btn" @click="cancelEditComment">
                          Hủy
                        </button>
                      </div>
                    </div>

                    <!-- View mode -->
                    <div v-else>
                      <div class="tdd__comment-content">{{ comment.content }}</div>
                      <div class="tdd__comment-actions">
                        <button
                          v-if="isCommentAuthor(comment)"
                          class="tdd__comment-action-link"
                          @click="startEditComment(comment)"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          v-if="isCommentAuthor(comment) || isOwner"
                          class="tdd__comment-action-link tdd__comment-action-link--danger"
                          @click="handleDeleteComment(comment)"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Comment input footer ────────────────────────────────────── -->
          <div class="tdd__footer">
            <div class="tdd__input-box">
              <textarea
                v-model="newCommentText"
                class="tdd__input-textarea"
                placeholder="Thêm bình luận... (Ctrl+Enter để gửi)"
                rows="3"
                :disabled="commentStore.isSubmitting"
                @keydown="handleTextareaKeydown"
              ></textarea>
              <div class="tdd__input-footer">
                <span class="tdd__input-hint">Ctrl+Enter để gửi</span>
                <button
                  class="tdd__send-btn"
                  :disabled="!newCommentText.trim() || commentStore.isSubmitting"
                  @click="handleSendComment"
                >
                  <span
                    v-if="commentStore.isSubmitting"
                    class="tdd__spinner tdd__spinner--white"
                    aria-hidden="true"
                  ></span>
                  {{ commentStore.isSubmitting ? 'Đang gửi...' : 'Gửi bình luận' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.tdd {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
}

/* ── Overlay ─────────────────────────────────────────────────────────────────── */
.tdd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

/* ── Drawer shell ────────────────────────────────────────────────────────────── */
.tdd {
  width: 600px;
  max-width: 100vw;
  height: 100%;
  background: var(--surface-lowest);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Slide transition ────────────────────────────────────────────────────────── */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.tdd__header {
  padding: 24px 32px 20px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.tdd__header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tdd__breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--outline);
  flex-wrap: wrap;
}

.tdd__breadcrumb-link {
  cursor: default;
  transition: color 0.15s;
}

.tdd__breadcrumb-sep {
  color: var(--outline-variant);
}

.tdd__breadcrumb-current {
  font-weight: 600;
  color: var(--on-surface);
}

.tdd__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.tdd__icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--outline);
  transition:
    background-color 0.15s,
    color 0.15s;
}

.tdd__icon-btn:hover {
  background: var(--surface-container-low);
  color: var(--on-surface);
}
.tdd__icon-btn--danger:hover {
  background: #fff0f0;
  color: var(--error);
}

.tdd__title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.01em;
  color: var(--on-surface);
  margin: 0;
}

/* ── Scrollable body ─────────────────────────────────────────────────────────── */
.tdd__body {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ── Metadata grid ───────────────────────────────────────────────────────────── */
.tdd__meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 24px;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
}

.tdd__meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tdd__meta-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
}

.tdd__meta-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tdd__meta-value--overdue {
  color: var(--error);
}

.tdd__meta-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--on-surface);
}

.tdd__meta-text--bold {
  font-weight: 600;
}
.tdd__meta-text--muted {
  color: var(--outline);
  font-style: italic;
}

.tdd__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Assignee */
.tdd__assignee {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tdd__assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tdd__assignee-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tdd__assignee-initials {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
}

/* ── Sections ────────────────────────────────────────────────────────────────── */
.tdd__section {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
}

.tdd__section:last-child {
  border-bottom: none;
}

.tdd__section-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--on-surface);
  margin: 0 0 12px;
}

.tdd__description {
  font-size: 14px;
  line-height: 22px;
  color: var(--on-surface-variant);
  margin: 0;
  white-space: pre-wrap;
}

.tdd__description--empty {
  color: var(--outline);
  font-style: italic;
}

/* ── Activity header ─────────────────────────────────────────────────────────── */
.tdd__activity-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.tdd__tab-group {
  display: flex;
  background: var(--surface-container);
  border-radius: 8px;
  padding: 3px;
}

.tdd__tab {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--outline);
  background: transparent;
  transition:
    background-color 0.15s,
    color 0.15s;
}

.tdd__tab--active {
  background: var(--surface-lowest);
  color: var(--on-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ── Comment states ──────────────────────────────────────────────────────────── */
.tdd__comments-loading,
.tdd__comments-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  font-size: 13px;
  color: var(--outline);
  justify-content: center;
}

/* ── Comment list ────────────────────────────────────────────────────────────── */
.tdd__comment-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tdd__comment {
  display: flex;
  gap: 12px;
}

.tdd__comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
}

.tdd__comment-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tdd__comment-avatar-initials {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.tdd__comment-body {
  flex: 1;
  min-width: 0;
}

.tdd__comment-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.tdd__comment-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
}

.tdd__comment-time {
  font-size: 12px;
  color: var(--outline);
}

.tdd__comment-content {
  background: var(--surface-container-low);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 20px;
  color: var(--on-surface-variant);
  white-space: pre-wrap;
  word-break: break-word;
}

.tdd__comment-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  padding-left: 4px;
}

.tdd__comment-action-link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--outline);
  cursor: pointer;
  transition: color 0.15s;
}

.tdd__comment-action-link:hover {
  color: var(--primary);
}
.tdd__comment-action-link--danger:hover {
  color: var(--error);
}

/* Edit mode */
.tdd__comment-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tdd__comment-edit-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--surface-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--on-surface);
  outline: none;
  resize: vertical;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-sizing: border-box;
}

.tdd__comment-edit-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 74, 198, 0.12);
}

.tdd__comment-edit-actions {
  display: flex;
  gap: 8px;
}

.tdd__comment-action-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-subtle);
  background: var(--surface-container-low);
  color: var(--on-surface-variant);
  transition: background-color 0.12s;
}

.tdd__comment-action-btn:hover {
  background: var(--surface-container);
}
.tdd__comment-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tdd__comment-action-btn--primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.tdd__comment-action-btn--primary:hover:not(:disabled) {
  background: var(--primary-container);
}

/* ── Footer / comment input ──────────────────────────────────────────────────── */
.tdd__footer {
  padding: 16px 32px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-lowest);
  flex-shrink: 0;
}

.tdd__input-box {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.tdd__input-box:focus-within {
  box-shadow: 0 0 0 2px rgba(0, 74, 198, 0.2);
  border-color: var(--primary);
}

.tdd__input-textarea {
  width: 100%;
  padding: 14px 16px;
  border: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 20px;
  color: var(--on-surface);
  resize: none;
  outline: none;
  background: var(--surface-lowest);
  box-sizing: border-box;
}

.tdd__input-textarea::placeholder {
  color: var(--outline);
}
.tdd__input-textarea:disabled {
  opacity: 0.6;
}

.tdd__input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--surface-lowest);
  border-top: 1px solid var(--border-subtle);
}

.tdd__input-hint {
  font-size: 11px;
  color: var(--outline);
}

.tdd__send-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s,
    transform 0.1s;
}

.tdd__send-btn:hover:not(:disabled) {
  background: var(--primary-container);
}
.tdd__send-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.tdd__send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ── Spinner ─────────────────────────────────────────────────────────────────── */
.tdd__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 74, 198, 0.3);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.tdd__spinner--white {
  border-color: rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .tdd {
    width: 100vw;
  }
  .tdd__header,
  .tdd__section,
  .tdd__footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  .tdd__meta-grid {
    padding-left: 20px;
    padding-right: 20px;
    grid-template-columns: 1fr;
  }
}
</style>
