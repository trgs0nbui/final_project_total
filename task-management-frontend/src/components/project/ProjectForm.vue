<script setup>
/**
 * ProjectForm — dialog tạo/chỉnh sửa dự án.
 *
 * Props:
 *   visible  {boolean}        — kiểm soát hiển thị dialog (v-model:visible)
 *   project  {Project | null} — dự án cần chỉnh sửa; null khi tạo mới
 *
 * Emits:
 *   update:visible (boolean)
 *   submit ({ name, key, description, project_type, category })
 */
import { ref, watch, computed } from 'vue'
import { useForm } from 'vee-validate'
import { projectSchema } from '@/utils/validators'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'submit'])

// ── Options ──────────────────────────────────────────────────────────────────

const projectTypeOptions = [
  { value: 'software', label: 'Phần mềm (Software)' },
  { value: 'business', label: 'Kinh doanh (Business)' },
  { value: 'service', label: 'Dịch vụ (Service)' },
]

const categoryOptions = [
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile Development' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'devops', label: 'DevOps & Infrastructure' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'other', label: 'Khác (Other)' },
]

// ── VeeValidate ──────────────────────────────────────────────────────────────

const {
  handleSubmit: veeHandleSubmit,
  errors,
  defineField,
  resetForm,
} = useForm({
  validationSchema: projectSchema,
})

const [nameValue, nameAttrs] = defineField('name')
const [keyValue, keyAttrs] = defineField('key')
const [descriptionValue, descriptionAttrs] = defineField('description')
const [projectTypeValue, projectTypeAttrs] = defineField('project_type')
const [categoryValue, categoryAttrs] = defineField('category')

// ── Auto-generate key from name ──────────────────────────────────────────────

/**
 * When the user types a name and hasn't manually edited the key yet,
 * auto-suggest a key: uppercase, strip non-alphanumeric, max 10 chars.
 */
const keyManuallyEdited = ref(false)

watch(nameValue, (newName) => {
  if (keyManuallyEdited.value || props.project) return
  if (!newName) {
    keyValue.value = ''
    return
  }
  const suggested = newName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
  keyValue.value = suggested
})

function onKeyInput(val) {
  keyManuallyEdited.value = true
  keyValue.value = val.toUpperCase().replace(/[^A-Z0-9\-]/g, '')
}

// ── Sync form when dialog opens ──────────────────────────────────────────────

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      keyManuallyEdited.value = false
      resetForm({
        values: {
          name: props.project?.name ?? '',
          key: props.project?.key ?? '',
          description: props.project?.description ?? '',
          project_type: props.project?.project_type ?? 'software',
          category: props.project?.category ?? 'other',
        },
      })
    }
  },
)

// ── Dialog title ─────────────────────────────────────────────────────────────

const dialogTitle = computed(() => (props.project ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'))

// ── Submit ───────────────────────────────────────────────────────────────────

const isSubmitting = ref(false)

const handleSubmit = veeHandleSubmit(async (values) => {
  isSubmitting.value = true
  try {
    emit('submit', {
      name: values.name,
      key: values.key,
      description: values.description ?? '',
      project_type: values.project_type,
      category: values.category ?? 'other',
    })
  } finally {
    isSubmitting.value = false
  }
})

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form
      label-position="top"
      size="default"
      class="project-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Tên dự án -->
      <el-form-item label="Tên dự án" required>
        <el-input
          v-bind="nameAttrs"
          v-model="nameValue"
          placeholder="Nhập tên dự án"
          maxlength="255"
          show-word-limit
          :disabled="isSubmitting"
        />
        <p v-if="errors.name" class="field-error" role="alert">{{ errors.name }}</p>
      </el-form-item>

      <!-- Project Key -->
      <el-form-item required>
        <template #label>
          Project Key
          <el-tooltip
            content="Mã định danh ngắn, chỉ chữ hoa A–Z, số 0–9 và dấu '-'. Ví dụ: PROJ, MY-APP"
            placement="top"
          >
            <el-icon class="key-hint"><i class="el-icon-question" /></el-icon>
          </el-tooltip>
        </template>
        <el-input
          v-bind="keyAttrs"
          :model-value="keyValue"
          placeholder="VD: PROJ, MY-APP"
          maxlength="10"
          show-word-limit
          :disabled="isSubmitting || !!project"
          style="text-transform: uppercase"
          @input="onKeyInput"
        />
        <p v-if="errors.key" class="field-error" role="alert">{{ errors.key }}</p>
        <p v-if="project" class="field-hint">Project key không thể thay đổi sau khi tạo.</p>
      </el-form-item>

      <!-- Loại dự án + Danh mục (2 cột) -->
      <div class="form-row">
        <el-form-item label="Loại dự án" required class="form-col">
          <el-select
            v-bind="projectTypeAttrs"
            v-model="projectTypeValue"
            placeholder="Chọn loại dự án"
            :disabled="isSubmitting"
            style="width: 100%"
          >
            <el-option
              v-for="opt in projectTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <p v-if="errors.project_type" class="field-error" role="alert">
            {{ errors.project_type }}
          </p>
        </el-form-item>

        <el-form-item label="Danh mục" class="form-col">
          <el-select
            v-bind="categoryAttrs"
            v-model="categoryValue"
            placeholder="Chọn danh mục"
            :disabled="isSubmitting"
            style="width: 100%"
          >
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <p v-if="errors.category" class="field-error" role="alert">{{ errors.category }}</p>
        </el-form-item>
      </div>

      <!-- Mô tả -->
      <el-form-item label="Mô tả">
        <el-input
          v-bind="descriptionAttrs"
          v-model="descriptionValue"
          type="textarea"
          placeholder="Nhập mô tả dự án (tùy chọn)"
          :rows="3"
          :disabled="isSubmitting"
        />
        <p v-if="errors.description" class="field-error" role="alert">{{ errors.description }}</p>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button :disabled="isSubmitting" @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">
          {{ project ? 'Lưu thay đổi' : 'Tạo dự án' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.project-form {
  --on-surface-variant: #434655;
  --outline: #737686;
  --error: #ba1a1a;
  --primary: #004ac6;
}

.project-form {
  padding: 0 4px;
}

/* label-caps token */
.project-form :deep(.el-form-item__label) {
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  padding-bottom: 6px;
}

/* Input border radius */
.project-form :deep(.el-input__wrapper),
.project-form :deep(.el-textarea__inner),
.project-form :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
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
  color: var(--error);
  line-height: 1.4;
}

.field-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--outline);
  line-height: 1.4;
}

.key-hint {
  margin-left: 4px;
  cursor: help;
  color: var(--outline);
  vertical-align: middle;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
