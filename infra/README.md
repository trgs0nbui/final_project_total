# TaskFlow — Hướng Dẫn Infrastructure

Thư mục này chứa toàn bộ cấu hình Docker để chạy hệ thống TaskFlow ở cả môi trường **development** và **production**.

> **Xem thêm:**
> - 🔧 Backend setup → [`task-management-backend/README.md`](../task-management-backend/README.md)
> - 🖥️ Frontend setup → [`task-management-frontend/README.md`](../task-management-frontend/README.md)

---

## Cấu Trúc Thư Mục

```
infra/
├── backend/
│   ├── Dockerfile.dev        # Image backend dev (python:3.12-slim, hot-reload)
│   └── Dockerfile.prod       # Image backend prod (multi-stage, Gunicorn)
├── frontend/
│   ├── Dockerfile.dev        # Image frontend dev (node:22-alpine, Vite)
│   └── Dockerfile.prod       # Image frontend prod (Vite build → Nginx)
├── nginx/
│   ├── nginx.conf            # Cấu hình Nginx chính (worker, gzip, logging)
│   └── default.conf          # Virtual host: proxy → Django, serve static/media
├── docker-compose.dev.yml    # Stack development (6 services)
├── docker-compose.prod.yml   # Stack production (5 services + nginx)
├── .env                      # Biến môi trường cho docker-compose (DB credentials)
└── .env.example              # Template — copy thành .env
```

> **Lưu ý:** Entrypoint scripts nằm trong `task-management-backend/docker/scripts/`
> (phải nằm trong build context của backend).

---

## Yêu Cầu Hệ Thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Docker | 24.x trở lên |
| Docker Compose | v2.x (plugin, không phải `docker-compose` v1) |

Kiểm tra:
```bash
docker --version
docker compose version
```

---

## Cấu Trúc Services

### Development (`docker-compose.dev.yml`)

| Service | Image | Port | Mô tả |
|---|---|---|---|
| `db` | postgres:15-alpine | `5432` | PostgreSQL database |
| `redis` | redis:7-alpine | — | Broker cho Celery, cache backend |
| `backend` | Dockerfile.dev | `8000` | Django dev server (hot-reload) |
| `celery` | Dockerfile.dev | — | Celery Worker — xử lý background tasks |
| `celery-beat` | Dockerfile.dev | — | Celery Beat — periodic tasks (due-soon mỗi giờ) |
| `frontend` | Dockerfile.dev | `5173` | Vite dev server (hot-reload) |

### Production (`docker-compose.prod.yml`)

| Service | Image | Port | Mô tả |
|---|---|---|---|
| `db` | postgres:15-alpine | internal | PostgreSQL database |
| `redis` | redis:7-alpine | internal | Broker cho Celery, cache backend |
| `web` | Dockerfile.prod | internal | Gunicorn WSGI server |
| `celery` | Dockerfile.prod | — | Celery Worker |
| `nginx` | nginx:1.25-alpine | `80`, `443` | Reverse proxy, serve static/media |

> Production không có `celery-beat` service riêng trong compose hiện tại.
> Để chạy periodic tasks trong production, thêm service tương tự `celery-beat` trong dev.

---

## Môi Trường Development

### 1. Chuẩn Bị File `.env`

**`infra/.env`** — credentials cho docker-compose:

```bash
cp infra/.env.example infra/.env
```

```dotenv
POSTGRES_DB=task_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

**`task-management-backend/.env`** — cấu hình Django:

```bash
cp task-management-backend/.env.example task-management-backend/.env
```

Các biến quan trọng cần điền:

```dotenv
SECRET_KEY=<django-secret-key-ngẫu-nhiên-≥50-ký-tự>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database — hostname phải là "db" (tên service trong compose)
DATABASE_URL=postgresql://postgres:postgres@db:5432/task_management
POSTGRES_DB=task_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Email (Gmail SMTP) — dùng để gửi email xác thực và thông báo
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@taskflow.com

# URL frontend — dùng để tạo link xác thực email
# Phải trỏ về cổng frontend (5173), không phải backend (8000)
FRONTEND_URL=http://localhost:5173
```

> **Gmail App Password:** Vào [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), bật 2-Step Verification, tạo App Password cho "Mail".

**`task-management-frontend/.env`** — cấu hình Vite:

```bash
cp task-management-frontend/.env.example task-management-frontend/.env
```

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Khởi Động Stack

```bash
# Từ thư mục gốc của project
docker compose -f infra/docker-compose.dev.yml up --build
```

Lần đầu mất vài phút để pull image và cài dependencies. Các lần sau:

```bash
docker compose -f infra/docker-compose.dev.yml up
```

### 3. Chạy Migration (lần đầu)

```bash
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py migrate
```

### 4. Kiểm Tra

| URL | Mô tả |
|---|---|
| `http://localhost:5173` | Frontend Vue (Vite dev server) |
| `http://localhost:8000/api/` | Backend Django REST API |
| `http://localhost:8000/admin/` | Django Admin |

### 5. Các Lệnh Thường Dùng

```bash
# Xem log tất cả services
docker compose -f infra/docker-compose.dev.yml logs -f

# Xem log service cụ thể
docker compose -f infra/docker-compose.dev.yml logs -f backend
docker compose -f infra/docker-compose.dev.yml logs -f celery
docker compose -f infra/docker-compose.dev.yml logs -f celery-beat

# Chạy lệnh Django
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py <command>

# Tạo migration mới
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py makemigrations

# Tạo superuser
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py createsuperuser

# Mở Django shell
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py shell

# Chạy tests backend
docker compose -f infra/docker-compose.dev.yml exec backend pytest
docker compose -f infra/docker-compose.dev.yml exec backend pytest --cov=apps --cov-report=term-missing

# Dừng stack (giữ volumes/data)
docker compose -f infra/docker-compose.dev.yml down

# Dừng và xóa toàn bộ volumes (reset database + cache)
docker compose -f infra/docker-compose.dev.yml down -v
```

---

## Môi Trường Production

### 1. Chuẩn Bị File `.env`

**`task-management-backend/.env`** cho production — **không dùng lại file dev**:

```dotenv
SECRET_KEY=<secret-key-dài-ngẫu-nhiên-tối-thiểu-50-ký-tự>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

DATABASE_URL=postgresql://<user>:<password>@db:5432/<dbname>
POSTGRES_DB=task_management_prod
POSTGRES_USER=<db-user>
POSTGRES_PASSWORD=<db-password-mạnh>
POSTGRES_HOST=db
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

FRONTEND_URL=https://yourdomain.com

# Gunicorn tuning (tùy chọn)
GUNICORN_WORKERS=3
GUNICORN_TIMEOUT=120
GUNICORN_LOG_LEVEL=info
```

**`infra/.env`** cho docker-compose:

```dotenv
POSTGRES_DB=task_management_prod
POSTGRES_USER=<db-user>
POSTGRES_PASSWORD=<db-password-mạnh>
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

### 2. Build và Khởi Động

```bash
docker compose -f infra/docker-compose.prod.yml up --build -d
```

### 3. Chạy Migration

```bash
docker compose -f infra/docker-compose.prod.yml exec web python manage.py migrate
```

### 4. Kiểm Tra

```bash
# Trạng thái containers
docker compose -f infra/docker-compose.prod.yml ps

# Xem log
docker compose -f infra/docker-compose.prod.yml logs -f

# Xem log Nginx
docker compose -f infra/docker-compose.prod.yml logs -f nginx
```

### 5. Các Lệnh Thường Dùng

```bash
# Tạo superuser
docker compose -f infra/docker-compose.prod.yml exec web python manage.py createsuperuser

# Collect static files thủ công
docker compose -f infra/docker-compose.prod.yml exec web python manage.py collectstatic --noinput

# Restart một service
docker compose -f infra/docker-compose.prod.yml restart web

# Dừng stack
docker compose -f infra/docker-compose.prod.yml down
```

---

## Giải Thích Các File Quan Trọng

### `Dockerfile.dev` (backend)

- Base: `python:3.12-slim`
- Cài `gcc` + `libpq-dev` để compile `psycopg2`
- Copy requirements trước source code → tận dụng Docker layer cache
- Entrypoint: `docker/scripts/entrypoint.dev.sh` (nằm trong build context)
- Source code được **mount qua volume** → hot-reload không cần rebuild

### `Dockerfile.dev` (frontend)

- Base: `node:22-alpine`
- `npm ci` (deterministic, từ lock file)
- `--host 0.0.0.0` để Vite listen trên tất cả interfaces
- `node_modules` dùng anonymous volume riêng → không bị ghi đè bởi host mount

### `entrypoint.dev.sh`

1. Chờ PostgreSQL sẵn sàng (thử kết nối thực sự bằng psycopg2)
2. Chạy `migrate` (trừ khi `SKIP_MIGRATE=1` — dùng cho celery)
3. `exec "$@"` — chạy lệnh được truyền vào (runserver hoặc celery worker)

### `docker-compose.dev.yml` — điểm đáng chú ý

- `depends_on: condition: service_healthy` — backend/celery chỉ start sau khi db/redis healthy
- `celery` service set `SKIP_MIGRATE=1` — tránh race condition khi cả hai cùng migrate
- `celery-beat` chạy `celery beat` — periodic task `check_due_soon_tasks` mỗi giờ
- Frontend có 2 volumes: source mount + anonymous volume cho `node_modules`

### `nginx/default.conf` (production only)

- Serve `/static/` và `/media/` trực tiếp (không qua Django)
- Proxy tất cả request còn lại về Gunicorn (`web:8000`)
- Truyền headers `X-Real-IP`, `X-Forwarded-For` để Django biết IP thực

---

## Xử Lý Sự Cố

**Backend không kết nối được database**
```bash
docker compose -f infra/docker-compose.dev.yml logs db
# Kiểm tra POSTGRES_HOST=db (không phải localhost)
```

**Celery không nhận task / thông báo không gửi**
```bash
docker compose -f infra/docker-compose.dev.yml logs celery
# Kiểm tra CELERY_BROKER_URL=redis://redis:6379/1
```

**Celery Beat không chạy periodic tasks**
```bash
docker compose -f infra/docker-compose.dev.yml logs celery-beat
# Kiểm tra CELERY_BEAT_SCHEDULE trong settings/base.py
```

**Frontend không gọi được API (CORS error)**
```bash
# Kiểm tra VITE_API_BASE_URL=http://localhost:8000
# Backend phải có http://localhost:5173 trong CORS_ALLOWED_ORIGINS
```

**Build lỗi: entrypoint.dev.sh not found**
```bash
# Script phải nằm trong task-management-backend/docker/scripts/
# Không phải infra/scripts/ (nằm ngoài build context)
```

**Port đã bị chiếm**
```bash
netstat -ano | findstr :8000   # Windows
lsof -i :8000                  # macOS/Linux
```

**Reset toàn bộ**
```bash
docker compose -f infra/docker-compose.dev.yml down -v
docker system prune -f
docker compose -f infra/docker-compose.dev.yml up --build
```
