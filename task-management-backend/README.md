# Task Management System — Backend

Backend API cho hệ thống quản lý công việc theo nhóm, xây dựng bằng **Django REST Framework** với xác thực JWT, phân quyền theo vai trò, hệ thống thông báo, caching Redis và Celery background tasks.

> **Xem thêm:**
> - 🐳 Hướng dẫn chạy toàn bộ stack bằng Docker → [`infra/README.md`](../infra/README.md)
> - 🖥️ Hướng dẫn setup frontend Vue 3 → [`task-management-frontend/README.md`](../task-management-frontend/README.md)

---

## Mục Lục

- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt Môi Trường](#cài-đặt-môi-trường)
- [Cấu Hình Biến Môi Trường](#cấu-hình-biến-môi-trường)
- [Cài Đặt Database & Migration](#cài-đặt-database--migration)
- [Khởi Động Server](#khởi-động-server)
- [Chạy Celery](#chạy-celery)
- [Chạy Tests](#chạy-tests)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [API Endpoints](#api-endpoints)

---

## Kiến Trúc Hệ Thống

```
┌─────────────────┐
│   Frontend      │  Vue 3 + Vite + Element Plus
│   :5173         │  → task-management-frontend/
└────────┬────────┘
         │ HTTP (CORS)
         ▼
┌─────────────────┐
│   Backend       │  Django REST Framework + JWT
│   :8000         │  → task-management-backend/
└────────┬────────┘
         │
    ┌────┴────┬──────────────────┐
    ▼         ▼                  ▼
┌────────┐ ┌──────┐ ┌──────────────────────┐
│Postgres│ │Redis │ │  Celery              │
│ :5432  │ │:6379 │ │  Worker + Beat       │
└────────┘ └──────┘ └──────────────────────┘
```

**Celery Worker** xử lý:
- Cache invalidation bất đồng bộ (projects, tasks, members)
- Gửi thông báo khi giao task (`task_assigned`)
- Gửi thông báo khi thêm member (`project_member_added`)

**Celery Beat** chạy periodic tasks:
- `check_due_soon_tasks` — mỗi giờ, quét task due trong 24h và tạo thông báo

---

## Yêu Cầu Hệ Thống

| Thành phần | Phiên bản tối thiểu |
|---|---|
| Python | ≥ 3.11 |
| PostgreSQL | ≥ 13 |
| Redis | ≥ 7 |
| pip | ≥ 23 |

```bash
python --version
psql --version
redis-cli --version
```

---

## Cài Đặt Môi Trường

### 1. Tạo và kích hoạt virtual environment

**Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2. Cài đặt dependencies

```bash
# Development (bao gồm pytest, coverage)
pip install -r requirements/dev.txt

# Production
pip install -r requirements/prod.txt
```

---

## Cấu Hình Biến Môi Trường

```bash
cp .env.example .env
```

### Mô tả các biến

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `SECRET_KEY` | ✅ | Django secret key — ngẫu nhiên ≥ 50 ký tự trong production |
| `DEBUG` | ✅ | `True` cho dev, `False` cho production |
| `ALLOWED_HOSTS` | ✅ | Danh sách host, phân cách bằng dấu phẩy |
| `POSTGRES_DB` | ✅ | Tên database PostgreSQL |
| `POSTGRES_USER` | ✅ | Username PostgreSQL |
| `POSTGRES_PASSWORD` | ✅ | Password PostgreSQL |
| `POSTGRES_HOST` | ✅ | Host PostgreSQL (`localhost` local, `db` trong Docker) |
| `POSTGRES_PORT` | ✅ | Port PostgreSQL (mặc định: `5432`) |
| `DATABASE_URL` | ✅ | Connection string đầy đủ (dùng trong Docker) |
| `REDIS_URL` | ✅ | URL Redis cho cache (`redis://localhost:6379/0`) |
| `CELERY_BROKER_URL` | ✅ | URL broker Celery (`redis://localhost:6379/1`) |
| `CELERY_RESULT_BACKEND` | ✅ | URL result backend (`redis://localhost:6379/2`) |
| `EMAIL_HOST_USER` | ❌ | Gmail address gửi email xác thực và thông báo |
| `EMAIL_HOST_PASSWORD` | ❌ | Gmail App Password (không phải password thường) |
| `DEFAULT_FROM_EMAIL` | ❌ | Địa chỉ hiển thị trong email gửi đi |
| `FRONTEND_URL` | ❌ | URL frontend — tạo link xác thực email (mặc định: `http://localhost:5173`) |
| `CACHE_TTL` | ❌ | Thời gian sống cache (giây, mặc định: `300`) |
| `GUNICORN_WORKERS` | ❌ | Số worker Gunicorn (production, mặc định: `3`) |

> **`FRONTEND_URL`** phải trỏ về frontend Vue (`http://localhost:5173` cho dev), không phải backend. Backend dùng giá trị này để tạo link `/verify-email?token=...` trong email xác thực.

> **Gmail App Password:** Vào [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), bật 2-Step Verification, tạo App Password cho "Mail".

---

## Cài Đặt Database & Migration

### Tạo database (local)

```bash
psql -U postgres -c "CREATE DATABASE taskmanager_dev;"
```

### Chạy migration

```bash
python manage.py migrate
```

### Kiểm tra trạng thái migration

```bash
python manage.py showmigrations
```

### Tạo migration mới khi thay đổi model

```bash
python manage.py makemigrations
python manage.py makemigrations <app_name>
```

---

## Khởi Động Server

### Development server

```bash
python manage.py runserver
# Hoặc chỉ định host:port
python manage.py runserver 0.0.0.0:8000
```

### Kiểm tra hoạt động

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123", "confirm_password": "password123"}'
```

Kết quả mong đợi: HTTP 201 + thông báo kiểm tra email.

> Sau khi đăng ký, user phải xác thực email trước khi đăng nhập. Xem luồng chi tiết tại [`task-management-frontend/README.md`](../task-management-frontend/README.md#luồng-xác-thực-email).

### Chạy với Docker

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

Xem hướng dẫn đầy đủ tại [`infra/README.md`](../infra/README.md).

---

## Chạy Celery

Celery cần Redis đang chạy. Mở 2 terminal riêng:

### Celery Worker (xử lý background tasks)

```bash
celery -A config worker --loglevel=info
```

Worker xử lý:
- Cache invalidation sau khi tạo/sửa/xóa project, task, member
- Gửi thông báo `task_assigned` khi giao task
- Gửi thông báo `project_member_added` khi thêm member

### Celery Beat (periodic tasks)

```bash
celery -A config beat --loglevel=info
```

Beat chạy:
- `check_due_soon_tasks` — mỗi giờ, tạo thông báo `task_due_soon` cho task có `due_date = ngày mai`

> Trong Docker, cả Worker và Beat đều được khởi động tự động qua `docker-compose.dev.yml`.

---

## Chạy Tests

```bash
# Toàn bộ test suite
pytest

# Với coverage report
pytest --cov=apps --cov-report=term-missing

# Một app cụ thể
pytest apps/users/tests/
pytest apps/projects/tests/
pytest apps/tasks/tests/

# Một file cụ thể
pytest apps/users/tests/test_user_service.py

# Verbose
pytest -v
```

> Cấu hình pytest trong `pytest.ini`. Mặc định dùng `config.settings.dev`.

---

## Cấu Trúc Dự Án

```
task-management-backend/
├── apps/
│   ├── common/
│   │   └── pagination.py        # CustomPageNumberPagination
│   ├── users/
│   │   ├── models.py            # User (UUID PK, email verification)
│   │   ├── serializers.py       # Register, Login, UserProfile serializers
│   │   ├── services.py          # UserService, EmailService
│   │   ├── views.py             # Register, Login, VerifyEmail, Profile, Avatar
│   │   └── urls.py
│   ├── projects/
│   │   ├── models.py            # Project, ProjectMembership
│   │   ├── enums.py             # ProjectRole, ProjectType, ProjectCategory
│   │   ├── repositories.py      # ProjectRepository, MembershipRepository
│   │   ├── services.py          # ProjectService (CRUD + cache + notifications)
│   │   ├── tasks.py             # Celery tasks: cache invalidation
│   │   ├── views.py             # Project CRUD, Member management, Search
│   │   └── urls.py
│   ├── tasks/
│   │   ├── models.py            # Task (UUID PK, assignee, due_date)
│   │   ├── enums.py             # TaskStatus, TaskPriority
│   │   ├── repositories.py      # TaskRepository, MyTaskRepository
│   │   ├── serializers.py       # TaskSerializer, TaskFilterSerializer
│   │   ├── services.py          # TaskService (CRUD + cache + notifications)
│   │   ├── tasks.py             # Celery tasks: cache invalidation
│   │   ├── views.py             # Task CRUD, MyTasks, Stats
│   │   └── urls.py
│   ├── comments/
│   │   ├── models.py            # Comment
│   │   ├── services.py          # CommentService
│   │   ├── views.py             # Comment CRUD
│   │   └── urls.py
│   └── notifications/
│       ├── models.py            # Notification (type, recipient, actor, is_read)
│       ├── enums.py             # NotificationType
│       ├── repositories.py      # NotificationRepository
│       ├── services.py          # NotificationService
│       ├── serializers.py       # NotificationSerializer
│       ├── tasks.py             # Celery tasks: send notifications, check_due_soon
│       ├── views.py             # List, UnreadCount, MarkRead, MarkAllRead
│       └── urls.py
├── config/
│   ├── settings/
│   │   ├── base.py              # Cấu hình chung (DB, JWT, Redis, Celery, Email)
│   │   ├── dev.py               # Development overrides
│   │   └── prod.py              # Production overrides
│   ├── celery.py                # Celery app configuration
│   ├── urls.py                  # Root URL routing
│   ├── wsgi.py
│   └── asgi.py
├── docker/
│   └── scripts/
│       ├── entrypoint.dev.sh    # Dev entrypoint: wait DB → migrate → exec
│       └── entrypoint.prod.sh   # Prod entrypoint: migrate → collectstatic → gunicorn
├── requirements/
│   ├── base.txt                 # Core dependencies
│   ├── dev.txt                  # Dev + test dependencies
│   └── prod.txt                 # base.txt + gunicorn
├── .env.example
├── manage.py
├── pytest.ini
└── README.md
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register/` | — | Đăng ký — gửi email xác thực |
| POST | `/api/auth/login/` | — | Đăng nhập — yêu cầu email đã xác thực |
| POST | `/api/auth/token/refresh/` | — | Refresh access token |
| GET | `/api/auth/verify-email/?token=` | — | Xác thực email từ link |

### Users

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/users/me/` | ✅ | Xem hồ sơ cá nhân |
| PATCH | `/api/users/me/` | ✅ | Cập nhật `full_name`, `avatar_url` |
| POST | `/api/users/me/avatar/` | ✅ | Upload ảnh đại diện (multipart, max 2MB) |

### Projects

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/projects/` | ✅ | Danh sách dự án (user là member) |
| POST | `/api/projects/` | ✅ | Tạo dự án mới |
| GET | `/api/projects/<id>/` | ✅ | Chi tiết dự án |
| PATCH | `/api/projects/<id>/` | ✅ Owner | Cập nhật dự án |
| DELETE | `/api/projects/<id>/` | ✅ Owner | Xóa dự án (cascade tasks) |
| GET | `/api/projects/<id>/members/` | ✅ Member | Danh sách thành viên |
| POST | `/api/projects/<id>/members/` | ✅ Owner | Thêm thành viên |
| DELETE | `/api/projects/<id>/members/<user_id>/` | ✅ Owner | Xóa thành viên |
| GET | `/api/projects/<id>/members/search/?q=` | ✅ Owner | Tìm user để thêm |
| GET | `/api/projects/member-stats/` | ✅ | Thống kê thành viên |

### Tasks

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/projects/<id>/tasks/` | ✅ Member | Danh sách task (hỗ trợ filter) |
| POST | `/api/projects/<id>/tasks/` | ✅ Member | Tạo task mới |
| GET | `/api/projects/<id>/tasks/<task_id>/` | ✅ Member | Chi tiết task |
| PATCH | `/api/projects/<id>/tasks/<task_id>/` | ✅ Member | Cập nhật task |
| DELETE | `/api/projects/<id>/tasks/<task_id>/` | ✅ Owner | Xóa task |
| GET | `/api/tasks/` | ✅ | Tasks được giao cho tôi |
| GET | `/api/tasks/stats/` | ✅ | Thống kê tasks của tôi |

**Filter params cho tasks:**

| Param | Ví dụ | Mô tả |
|---|---|---|
| `status` | `?status=todo` | `todo` / `in_progress` / `done` |
| `priority` | `?priority=high` | `low` / `medium` / `high` |
| `assignee` | `?assignee=<uuid>` | UUID của user được giao |
| `due_date_from` | `?due_date_from=2025-01-01` | Từ ngày (YYYY-MM-DD) |
| `due_date_to` | `?due_date_to=2025-12-31` | Đến ngày (YYYY-MM-DD) |
| `search` | `?search=keyword` | Tìm trong title và description |

### Comments

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/projects/<id>/tasks/<task_id>/comments/` | ✅ Member | Danh sách comment |
| POST | `/api/projects/<id>/tasks/<task_id>/comments/` | ✅ Member | Tạo comment |
| PATCH | `/api/comments/<id>/` | ✅ Author | Sửa comment |
| DELETE | `/api/comments/<id>/` | ✅ Author/Owner | Xóa comment |

### Notifications

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/notifications/` | ✅ | Danh sách thông báo (`?unread=true` để lọc) |
| GET | `/api/notifications/unread-count/` | ✅ | Số thông báo chưa đọc (dùng cho badge) |
| PATCH | `/api/notifications/<id>/read/` | ✅ | Đánh dấu 1 thông báo đã đọc |
| POST | `/api/notifications/mark-all-read/` | ✅ | Đánh dấu tất cả đã đọc |

**Các loại thông báo (`notification_type`):**

| Loại | Trigger | Actor |
|---|---|---|
| `task_assigned` | Tạo task có assignee / cập nhật assignee mới | Người giao task |
| `project_member_added` | Thêm member vào project | Owner |
| `task_due_soon` | Celery Beat mỗi giờ — task due = ngày mai | System (null) |

---

## Xác Thực JWT

Tất cả endpoints có `✅` yêu cầu header:

```
Authorization: Bearer <access_token>
```

- **Access token:** hiệu lực **60 phút**
- **Refresh token:** hiệu lực **7 ngày**

Token được quản lý tự động bởi frontend (silent refresh khi 401). Xem chi tiết tại [`task-management-frontend/README.md`](../task-management-frontend/README.md).

---

## Caching Strategy

| Cache key | TTL | Invalidate khi |
|---|---|---|
| `v2:user_projects:<user_id>` | 300s | Create/delete project, add/remove member |
| `v2:project_members:<project_id>` | 300s | Add/remove member |
| `v2:project_tasks:<project_id>:<hash>` | 300s | Create/update/delete task |
| `v2:search_users:<project_id>:<query>` | 60s | Add member |

---

## Liên Kết Liên Quan

| Tài liệu | Mô tả |
|---|---|
| [`infra/README.md`](../infra/README.md) | Docker setup (dev & prod), services, entrypoint |
| [`task-management-frontend/README.md`](../task-management-frontend/README.md) | Frontend setup, routing, stores |
