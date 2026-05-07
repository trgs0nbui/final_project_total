import { ElMessage } from 'element-plus'

/**
 * Map of HTTP status codes to Vietnamese error messages.
 */
const STATUS_MESSAGES = {
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy tài nguyên yêu cầu.',
  500: 'Đã xảy ra lỗi server. Vui lòng thử lại sau.',
}

/**
 * Handle an API error by mapping its status code to a Vietnamese message,
 * optionally showing an Element Plus toast notification.
 *
 * @param {object} error - Normalized error object from ApiClient: { status, message, errors }
 * @param {boolean} [showToast=true] - Whether to show an ElMessage toast
 * @returns {string} The resolved error message
 */
export function handleApiError(error, showToast = true) {
  const status = error?.status ?? 0
  const fallbackMessage = error?.message || 'Đã xảy ra lỗi không xác định.'

  // Network error (no status or status 0)
  if (!status) {
    const message = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
    if (showToast) ElMessage.error(message)
    return message
  }

  // HTTP 404 — redirect to /404 page
  if (status === 404) {
    const message = STATUS_MESSAGES[404]
    if (showToast) ElMessage.error(message)
    window.location.href = '/404'
    return message
  }

  // Known status codes with mapped messages
  if (STATUS_MESSAGES[status]) {
    const message = STATUS_MESSAGES[status]
    if (showToast) ElMessage.error(message)
    return message
  }

  // Default: use the error's own message or a generic fallback
  if (showToast) ElMessage.error(fallbackMessage)
  return fallbackMessage
}
