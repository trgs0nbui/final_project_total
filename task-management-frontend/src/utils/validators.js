import * as yup from 'yup'

/**
 * Yup validation schema for TaskForm.
 *
 * Fields:
 * - title: required, max 200 characters
 * - description: optional string
 * - status: required, one of 'todo' | 'in_progress' | 'done'
 * - priority: required, one of 'low' | 'medium' | 'high'
 * - assignee: optional, nullable string
 */
export const taskSchema = yup.object({
  title: yup
    .string()
    .required('Tiêu đề không được để trống')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
  description: yup.string().optional(),
  status: yup
    .string()
    .oneOf(['todo', 'in_progress', 'done'], 'Trạng thái không hợp lệ')
    .required('Trạng thái là bắt buộc'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Độ ưu tiên không hợp lệ')
    .required('Độ ưu tiên là bắt buộc'),
  assignee: yup.string().optional().nullable(),
})

/**
 * Yup validation schema for ProjectForm.
 *
 * Fields:
 * - name:         required string (project name, max 255)
 * - key:          required, 2–10 chars, uppercase A-Z / 0-9 / dash, must start with letter or digit
 * - description:  optional string
 * - project_type: required, one of 'software' | 'business' | 'service'
 * - category:     optional, one of the valid category values (defaults to 'other')
 */
export const projectSchema = yup.object({
  name: yup
    .string()
    .required('Tên dự án không được để trống')
    .max(255, 'Tên dự án không được vượt quá 255 ký tự'),
  key: yup
    .string()
    .required('Project key không được để trống')
    .min(2, 'Project key phải có ít nhất 2 ký tự')
    .max(10, 'Project key không được vượt quá 10 ký tự')
    .matches(
      /^[A-Z0-9][A-Z0-9\-]{1,9}$/,
      'Project key chỉ được chứa chữ hoa (A–Z), số (0–9) và dấu gạch ngang (-), bắt đầu bằng chữ hoa hoặc số',
    ),
  description: yup.string().optional(),
  project_type: yup
    .string()
    .oneOf(['software', 'business', 'service'], 'Loại dự án không hợp lệ')
    .required('Loại dự án là bắt buộc'),
  category: yup
    .string()
    .oneOf(
      ['web', 'mobile', 'data', 'devops', 'marketing', 'finance', 'hr', 'other'],
      'Danh mục không hợp lệ',
    )
    .optional(),
})
