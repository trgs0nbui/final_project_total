<script setup>
/**
 * MemberSearchDialog — dialog tìm kiếm và thêm thành viên vào dự án.
 *
 * Chỉ hiển thị cho owner của dự án. Gọi API search để tìm user chưa là
 * thành viên, sau đó gọi API add member khi owner xác nhận.
 *
 * Props:
 *   visible    {boolean}  — kiểm soát hiển thị dialog (v-model:visible)
 *   projectId  {string}   — UUID của dự án
 *
 * Emits:
 *   update:visible (boolean)  — đóng dialog
 *   member-added              — khi thêm thành viên thành công (để parent refresh)
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, UserFilled } from '@element-plus/icons-vue'
import apiClient from '@/services/apiClient'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:visible', 'member-added'])

// ── State ─────────────────────────────────────────────────────────────────────

const searchQuery   = ref('')
const searchResults = ref([])
const isSearching   = ref(false)
const addingUserId  = ref(null)  // ID của user đang được thêm (loading state per-row)

// ── Reset khi dialog đóng ─────────────────────────────────────────────────────

watch(() => props.visible, (val) => {
  if (!val) {
    searchQuery.value   = ''
    searchResults.value = []
    isSearching.value   = false
    addingUserId.value  = null
  }
})

// ── Search ────────────────────────────────────────────────────────────────────

let searchTimer = null

/**
 * Debounced search — gọi API sau 400ms kể từ lần gõ cuối.
 * Yêu cầu tối thiểu 2 ký tự (backend cũng validate điều này).
 */
function onSearchInput() {
  clearTimeout(searchTimer)
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(doSearch, 400)
}

async function doSearch() {
  isSearching.value = true
  try {
    const res = await apiClient.get(
      `/api/projects/${props.projectId}/members/search/`,
      { params: { q: searchQuery.value.trim() } },
    )
    searchResults.value = Array.isArray(res.data) ? res.data : (res.data.results ?? [])
  } catch (err) {
    ElMessage.error(err?.message ?? 'Không thể tìm kiếm người dùng.')
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// ── Add member ────────────────────────────────────────────────────────────────

async function addMember(user) {
  addingUserId.value = user.id
  try {
    await apiClient.post(`/api/projects/${props.projectId}/members/`, {
      user_id: user.id,
    })
    ElMessage.success(`Đã thêm @${user.username} vào dự án!`)
    // Xóa user khỏi kết quả tìm kiếm (đã là thành viên rồi)
    searchResults.value = searchResults.value.filter((u) => u.id !== user.id)
    emit('member-added')
  } catch (err) {
    ElMessage.error(err?.message ?? 'Không thể thêm thành viên.')
  } finally {
    addingUserId.value = null
  }
}

function closeDialog() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="Thêm thành viên vào dự án"
    width="480px"
    :close-on-click-modal="true"
    destroy-on-close
    @update:model-value="closeDialog"
  >
    <!-- Search input -->
    <div class="member-search__input-wrap">
      <el-input
        v-model="searchQuery"
        placeholder="Tìm theo username hoặc email (tối thiểu 2 ký tự)"
        :prefix-icon="Search"
        clearable
        @input="onSearchInput"
        @clear="searchResults = []"
      />
    </div>

    <!-- Loading -->
    <div v-if="isSearching" class="member-search__state">
      <el-icon class="is-loading"><i class="el-icon-loading" /></el-icon>
      <span>Đang tìm kiếm...</span>
    </div>

    <!-- Empty hint -->
    <div
      v-else-if="searchQuery.trim().length > 0 && searchQuery.trim().length < 2"
      class="member-search__state member-search__state--hint"
    >
      Nhập ít nhất 2 ký tự để tìm kiếm
    </div>

    <!-- No results -->
    <div
      v-else-if="!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0"
      class="member-search__state"
    >
      Không tìm thấy người dùng nào phù hợp
    </div>

    <!-- Results list -->
    <ul v-else-if="searchResults.length > 0" class="member-search__list">
      <li
        v-for="user in searchResults"
        :key="user.id"
        class="member-search__item"
      >
        <div class="member-search__user-info">
          <el-avatar :size="36" :icon="UserFilled" class="member-search__avatar" />
          <div class="member-search__user-text">
            <span class="member-search__username">@{{ user.username }}</span>
            <span v-if="user.full_name" class="member-search__fullname">{{ user.full_name }}</span>
            <span class="member-search__email">{{ user.email }}</span>
          </div>
        </div>
        <el-button
          type="primary"
          size="small"
          :loading="addingUserId === user.id"
          :disabled="addingUserId !== null && addingUserId !== user.id"
          @click="addMember(user)"
        >
          Thêm
        </el-button>
      </li>
    </ul>

    <template #footer>
      <el-button @click="closeDialog">Đóng</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.member-search__input-wrap {
  margin-bottom: 16px;
}

.member-search__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: #909399;
  font-size: 14px;
}

.member-search__state--hint {
  color: #c0c4cc;
  font-size: 13px;
}

.member-search__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.member-search__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: background 0.15s;
}

.member-search__item:hover {
  background: #f5f7fa;
}

.member-search__user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-search__avatar {
  flex-shrink: 0;
  background: #409eff22;
  color: #409eff;
}

.member-search__user-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.member-search__username {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.member-search__fullname {
  font-size: 12px;
  color: #606266;
}

.member-search__email {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
