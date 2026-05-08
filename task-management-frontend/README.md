# TaskFlow Frontend

Ứng dụng quản lý dự án và công việc, xây dựng bằng **Vue 3** + **Vite** + **Element Plus**.

> **Xem thêm:**
> - 🐳 Hướng dẫn chạy toàn bộ stack bằng Docker → [`infra/README.md`](../infra/README.md)
> - 🔧 Backend API → [`task-management-backend/README.md`](../task-management-backend/README.md)

---

## Tech Stack

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Vue 3 | ^3.5 | Framework UI (Composition API) |
| Vue Router | ^5.0 | Client-side routing |
| Pinia | ^3.0 | State management |
| pinia-plugin-persistedstate | ^4.7 | Persist auth state vào localStorage |
| Element Plus | ^2.13 | Component library |
| Axios | ^1.16 | HTTP client |
| Vite | ^8.0 | Build tool & dev server |
| Vitest | ^4.1 | Unit testing |

---

## Yêu Cầu Hệ Thống

| Công cụ | Phiên bản |
|---|---|
| Node.js | `^20.19.0` hoặc `>=22.12.0` |
| npm | đi kèm Node.js |

```bash
node --version
npm --version
```

---

## Cài Đặt và Chạy Local (Không Docker)

### 1. Cài dependencies

```bash
cd task-management-frontend
npm install
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

```dotenv
# URL của backend Django API
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Khởi động dev server

```bash
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173` với hot-reload.

---

## Chạy Với Docker

```bash
# Từ thư mục gốc của project
docker compose -f infra/docker-compose.dev.yml up --build
```

Frontend chạy tại `http://localhost:5173`. Xem hướng dẫn đầy đủ tại [`infra/README.md`](../infra/README.md).

---

## Cấu Trúc Thư Mục `src/`

```
src/
├── assets/                      # Static assets
├── components/
│   ├── common/
│   │   ├── AppSidebar.vue       # Sidebar navigation
│   │   ├── AppTopbar.vue        # Top bar (search, notifications, user menu)
│   │   ├── NotificationDropdown.vue  # Bell icon + dropdown preview
│   │   ├── LoadingSpinner.vue
│   │   └── SkeletonCard.vue
│   ├── project/
│   │   ├── ProjectCard.vue
│   │   ├── ProjectForm.vue
│   │   └── MemberSearchDialog.vue
│   └── task/
│       ├── KanbanBoard.vue      # Drag & drop kanban
│       ├── TaskTable.vue        # Table view với filter nâng cao
│       ├── TaskForm.vue
│       ├── TaskDetailDrawer.vue
│       └── TaskCard.vue
├── composables/
│   ├── useAuth.js               # Wrapper cho auth store
│   ├── useProjects.js           # Wrapper cho project store
│   └── useTasks.js              # Wrapper cho task store
├── router/
│   └── index.js                 # Routes + navigation guards
├── services/
│   └── apiClient.js             # Axios instance, interceptors, token refresh
├── stores/
│   ├── auth.js                  # Auth state, login/register/logout
│   ├── projects.js              # Projects, members, search
│   ├── tasks.js                 # Tasks, my tasks, stats
│   └── notifications.js         # Notifications, unread count, polling
├── utils/
│   └── errorHandler.js
└── views/
    ├── auth/
    │   ├── LoginView.vue
    │   ├── RegisterView.vue
    │   ├── VerifyEmailView.vue          # Xử lý token từ link email
    │   └── PendingVerificationView.vue  # Hướng dẫn sau đăng ký
    ├── DashboardView.vue
    ├── ProjectsView.vue
    ├── ProjectDetailView.vue            # Kanban + Table view
    ├── ProjectMembersView.vue
    ├── TasksView.vue                    # My tasks
    ├── TeamView.vue
    ├── NotificationsView.vue            # Trang thông báo đầy đủ
    ├── ProfileView.vue
    ├── SettingsView.vue
    └── NotFoundView.vue
```

---

## Biến Môi Trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Base URL của backend API, ví dụ `http://localhost:8000` |

> Tất cả biến Vite phải có prefix `VITE_` để được expose ra client-side code.

---

## Routing

Router dùng navigation guard `beforeEach`:
- Route có `meta.requiresAuth: true` → redirect `/login` nếu chưa đăng nhập
- Route `/login` hoặc `/register` → redirect `/dashboard` nếu đã đăng nhập

### Danh Sách Routes

| Path | Tên | Auth | Mô tả |
|---|---|---|---|
| `/login` | `login` | — | Đăng nhập |
| `/register` | `register` | — | Đăng ký tài khoản |
| `/verify-email` | `verify-email` | — | Xử lý token xác thực email |
| `/verify-email/pending` | `verify-email-pending` | — | Hướng dẫn sau đăng ký |
| `/dashboard` | `dashboard` | ✅ | Tổng quan |
| `/projects` | `projects` | ✅ | Danh sách dự án |
| `/projects/:id` | `project-detail` | ✅ | Chi tiết dự án (Kanban/Table) |
| `/projects/:id/members` | `project-members` | ✅ | Quản lý thành viên |
| `/tasks` | `tasks` | ✅ | Công việc của tôi |
| `/team` | `team` | ✅ | Quản lý nhóm |
| `/notifications` | `notifications` | ✅ | Trang thông báo |
| `/profile` | `profile` | ✅ | Hồ sơ cá nhân |
| `/settings` | `settings` | ✅ | Cài đặt |

---

## Pinia Stores

### `auth.js`
- State: `user`, `accessToken`, `refreshToken`, `isAuthenticated`
- Actions: `login`, `register`, `logout`, `fetchProfile`, `updateProfile`, `uploadAvatar`
- Persist: `localStorage` (key `auth`)

### `projects.js`
- State: `projects`, `currentProject`, `pagination`
- Actions: `fetchProjects`, `fetchProjectById`, `createProject`, `deleteProject`, `fetchMembers`, `addMember`, `removeMember`, `searchUsersToAdd`, `fetchMemberStats`
- Persist: `sessionStorage` (chỉ `currentProject`)

### `tasks.js`
- State: `tasks`, `currentTask`, `myTasks`, `myTaskStats`
- Getters: `tasksByStatus` (dùng cho Kanban)
- Actions: `fetchTasks`, `createTask`, `updateTask`, `patchTask` (optimistic), `deleteTask`, `fetchMyTasks`, `fetchMyTaskStats`

### `notifications.js`
- State: `notifications`, `unreadCount`, `pagination`
- Actions: `fetchNotifications`, `fetchUnreadCount`, `markAsRead`, `markAllAsRead`
- Polling: `startPolling()` / `stopPolling()` — poll unread count mỗi 60 giây

---

## Hệ Thống Thông Báo

### `NotificationDropdown` (trong AppTopbar)
- Icon chuông với badge số chưa đọc
- Dropdown hiển thị 8 thông báo gần nhất
- Click item → đánh dấu đã đọc + navigate đến project/task
- Link "Xem tất cả" → `/notifications`
- Polling tự động mỗi 60 giây khi user đăng nhập

### `NotificationsView` (`/notifications`)
- 4 tab: Tất cả / Chưa đọc / Công việc / Dự án
- Group theo ngày: Hôm nay / Hôm qua / N ngày trước
- Card unread có nền xanh nhạt + dot indicator
- Nút "Đánh dấu tất cả đã đọc"

### Các loại thông báo

| Loại | Icon | Màu | Mô tả |
|---|---|---|---|
| `task_assigned` | List | Xanh dương | Được giao task mới |
| `task_due_soon` | Warning | Vàng | Task sắp đến hạn (24h) |
| `project_member_added` | User | Xanh lá | Được thêm vào dự án |

---

## Luồng Xác Thực Email

```
Đăng ký
  → POST /api/auth/register/
  → Backend gửi email: {FRONTEND_URL}/verify-email?token=<token>
  → Redirect /verify-email/pending (hướng dẫn kiểm tra email)

User click link trong email
  → /verify-email?token=<token>
  → GET /api/auth/verify-email/?token=<token>
  → Thành công → hiện nút "Đăng nhập ngay"
  → Thất bại → hiện lỗi + link đăng ký lại

Đăng nhập khi chưa xác thực
  → Backend trả lỗi "Email chưa được xác thực"
  → Frontend hiện link "Xem hướng dẫn xác thực"
```

---

## TaskTable — Filter Nâng Cao

Table view hỗ trợ filter kết hợp, gửi params lên backend:

| Filter | UI | Backend param |
|---|---|---|
| Tìm kiếm | Text input (debounce 300ms) | `search` |
| Trạng thái | Dropdown | `status` |
| Độ ưu tiên | Dropdown | `priority` |
| Người thực hiện | Dropdown (từ members list) | `assignee` |
| Hạn từ ngày | Date input | `due_date_from` |
| Hạn đến ngày | Date input | `due_date_to` |

---

## API Client (`apiClient.js`)

Axios instance với:
- **Request interceptor:** Tự động gắn `Authorization: Bearer <token>`
- **Response interceptor:** Xử lý 401 → silent token refresh → retry request
- **Error normalization:** Chuyển Django REST errors thành `{ status, message, errors }`
- **Queue:** Các request 401 đồng thời được queue, chờ refresh xong rồi retry cùng lúc

---

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Build production
npm run preview      # Preview bản build
npm test             # Unit tests (single run)
npm run test:watch   # Unit tests (watch mode)
npm run format       # Format code với Prettier
```

---

## Build Production

```bash
npm run build
# Output: dist/

# Với API URL production
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

Qua Docker build arg:
```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -f infra/frontend/Dockerfile.prod \
  task-management-frontend/
```

---

## Xử Lý Sự Cố

**`npm install` lỗi Node version**
```bash
nvm install 22 && nvm use 22
```

**CORS error khi gọi API**
- Kiểm tra `VITE_API_BASE_URL=http://localhost:8000`
- Backend phải có `http://localhost:5173` trong `CORS_ALLOWED_ORIGINS`

**Thông báo không hiện / badge không cập nhật**
- Kiểm tra Celery Worker đang chạy: `docker compose logs celery`
- Kiểm tra `notificationStore.startPolling()` được gọi khi mount AppTopbar

**Auth state bị mất sau refresh**
- Persist qua `pinia-plugin-persistedstate` vào localStorage key `auth`
- Kiểm tra browser không ở chế độ private/incognito

**Trang trắng sau khi build**
- Kiểm tra `base` trong `vite.config.js` khớp với đường dẫn deploy
