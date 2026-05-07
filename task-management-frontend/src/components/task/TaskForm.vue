<script setup>
/**
 * TaskForm — form tạo/chỉnh sửa công việc.
 *
 * Props:
 *   task       {Task | null}       — công việc cần chỉnh sửa; null khi tạo mới
 *   projectId  {string}            — ID của dự án chứa công việc
 *   mode       {'create' | 'edit'} — chế độ form
 *
 * Emits:
 *   submit ({ title, description, status, priority, assignee_id, due_date, project_id })
 *   cancel
 */
import { ref, watch, computed } from 'vue'
import { useForm } from 'vee-validate'
import { taskSchema } from '@/utils/validators'
import apiClient from '@/services/apiClient'

const props = defineProps({
  task: {
    type: Object,
    default: null,
  },
  projectId: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    default: 'create',
    validator: (v) => ['create', 'edit'].includes(v),
  },
})

const emit = defineEmits(['submit', 'cancel'])

// ── Options ──────────────────────────────────────────────────────────────────

const statusOptions = [
  { value: 'todo',        label: 'Chờ xử lý' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'done',        label: 'Hoàn thành' },
]

const priorityOptions = [
  { value: 'low',    label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high',   label: 'Cao' },
]

// ── Assignee search (members of project) ─────────────────────────────────────

/** Danh sách member của project để chọn assignee */
const memberOptions = ref([])
const isMembersLoading = ref(false)

/**
 * Fetch danh sách member của project khi component mount.
 * Dùng GET /api/projects/:id/members/ — trả về ProjectMembership[].
 */
async function fetchMembers() {
  if (!props.projectId) return
  isMembersLoading.value = true
  try {
    const res = await apiClient.get(`/api/projects/${props.projectId}/members/`)
    // API trả về paginated { results: [...] } hoặc plain array
    const memberships = Array.isArray(res.data) ? res.data : (res.data.results ?? [])
    memberOptions.value = memberships.map((m) => ({
      value: m.user.id,
      label: m.user.full_name ? `${m.user.full_name} (@${m.user.username})` : `@${m.user.username}`,
      username: m.user.username,
    }))
  } catch {
    memberOptions.value = []
  } finally {
    isMembersLoading.value = false
  }
}

fetchMembers()

// ── VeeValidate ──────────────────────────────────────────────────────────────

const { handleSubmit: veeHandleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: taskSchema,
})

const [titleValue,       titleAttrs]       = defineField('title')
const [descriptionValue, descriptionAttrs] = defineField('description')
const [statusValue,      statusAttrs]      = defineField('status')
const [priorityValue,    priorityAttrs]    = defineField('priority')

// assignee_id và due_date không qua vee-validate (không có trong taskSchema)
const assigneeId  = ref(null)
const dueDateValue = ref(null)

// ── Sync form when task prop changes ─────────────────────────────────────────

function populateForm() {
  resetForm({
    values: {
      title:       props.task?.title       ?? '',
      description: props.task?.description ?? '',
      status:      props.task?.status      ?? 'todo',
      priority:    props.task?.priority    ?? 'medium',
    },
  })
  // Khi edit: set assignee_id từ task.assignee.id (nested object từ API)
  assigneeId.value  = props.task?.assignee?.id ?? null
  dueDateValue.value = props.task?.due_date ?? null
}

populateForm()

watch(() => props.task, () => {
  populateForm()
})

// ── Computed ─────────────────────────────────────────────────────────────────

const submitLabel = computed(() => (props.mode === 'edit' ? 'Lưu thay đổi' : 'Tạo công việc'))

// ── Submit ───────────────────────────────────────────────────────────────────

const isSubmitting = ref(false)

const handleSubmit = veeHandleSubmit(async (values) => {
  isSubmitting.value = true
  try {
    emit('submit', {
      title:       values.title,
      description: values.description ?? '',
      status:      values.status,
      priority:    values.priority,
      assignee_id: assigneeId.value ?? null,
      due_date:    dueDateValue.value ?? null,
      project_id:  props.projectId,
    })
  } finally {
    isSubmitting.value = false
  }
})

function handleCancel() {
  emit('cancel')
}

// ── Date picker shortcuts ─────────────────────────────────────────────────────

const dateShortcuts = [
  {
    text: 'Hôm nay',
    value: new Date(),
  },
  {
    text: 'Tuần tới',
    value: () => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return d
    },
  },
  {
    text: 'Tháng tới',
    value: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      return d
    },
  },
]
</script>

<template>
  <div class="task-form-wrapper">
    <el-form
      label-position="top"
      size="default"
      class="task-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Tiêu đề -->
      <el-form-item label="Tiêu đề" required>
        <el-input
          v-bind="titleAttrs"
          v-model="titleValue"
          placeholder="Nhập tiêu đề công việc"
          maxlength="200"
          show-word-limit
          :disabled="isSubmitting"
        />
        <p v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</p>
      </el-form-item>

      <!-- Mô tả -->
      <el-form-item label="Mô tả">
        <el-input
          v-bind="descriptionAttrs"
          v-model="descriptionValue"
          type="textarea"
          placeholder="Nhập mô tả công việc (tùy chọn)"
          :rows="3"
          :disabled="isSubmitting"
        />
        <p v-if="errors.description" class="field-error" role="alert">{{ errors.description }}</p>
      </el-form-item>

      <!-- Trạng thái + Độ ưu tiên (2 cột) -->
      <div class="form-row">
        <el-form-item label="Trạng thái" required class="form-col">
          <el-select
            v-bind="statusAttrs"
            v-model="statusValue"
            placeholder="Chọn trạng thái"
            :disabled="isSubmitting"
            style="width: 100%"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <p v-if="errors.status" class="field-error" role="alert">{{ errors.status }}</p>
        </el-form-item>

        <el-form-item label="Độ ưu tiên" required class="form-col">
          <el-select
            v-bind="priorityAttrs"
            v-model="priorityValue"
            placeholder="Chọn độ ưu tiên"
            :disabled="isSubmitting"
            style="width: 100%"
          >
            <el-option
              v-for="opt in priorityOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <p v-if="errors.priority" class="field-error" role="alert">{{ errors.priority }}</p>
        </el-form-item>
      </div>

      <!-- Người được giao + Ngày hết hạn (2 cột) -->
      <div class="form-row">
        <!-- Assignee: dropdown chọn từ danh sách member của project -->
        <el-form-item label="Người được giao" class="form-col">
          <el-select
            v-model="assigneeId"
            placeholder="Chọn thành viên"
            clearable
            filterable
            :loading="isMembersLoading"
            :disabled="isSubmitting"
            style="width: 100%"
            no-data-text="Không có thành viên nào"
          >
            <el-option
              v-for="member in memberOptions"
              :key="member.value"
              :label="member.label"
              :value="member.value"
            />
          </el-select>
        </el-form-item>

        <!-- Due date -->
        <el-form-item label="Ngày hết hạn" class="form-col">
          <el-date-picker
            v-model="dueDateValue"
            type="date"
            placeholder="Chọn ngày hết hạn"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            :disabled="isSubmitting"
            :disabled-date="(d) => d < new Date(new Date().setHours(0,0,0,0))"
            style="width: 100%"
          />
        </el-form-item>
      </div>
    </el-form>

    <!-- Footer actions -->
    <div class="form-footer">
      <el-button :disabled="isSubmitting" @click="handleCancel">Hủy</el-button>
      <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">
        {{ submitLabel }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.task-form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.task-form {
  padding: 0 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-col {
  margin-bottom: 0;
}

.field-error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.4;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}
</style>
