# TaskFlow — Hướng dẫn Infrastructure

Thư mục này chứa toàn bộ cấu hình Docker để chạy hệ thống TaskFlow ở cả môi trường **development** và **production**.

---

## Cấu trúc thư mục

```
infra/
├── backend/
│   ├── Dockerfile.dev        # Image backend cho development
│   └── Dockerfile.prod       # Image backend production (multi-stage)
├── frontend/
│   ├── Dockerfile.dev        # Image frontend cho development (Vite dev server)
│   └── Dockerfile.prod       # Image frontend production (Vite build + Nginx)
├── nginx/
│   ├── nginx.conf            # Cấu hình Nginx chính (worker, gzip, logging)
│   └── default.conf          # Virtual host: proxy → Django, serve static/media
├── scripts/
│   ├── entrypoint.dev.sh     # Entrypoint dev: migrate → runserver
│   └── entrypoint.prod.sh    # Entrypoint prod: migrate → collectstatic → gunicorn
├── docker-compose.dev.yml    # Stack development
├── docker-compose.prod.yml   # Stack production
└── .env                      # Biến môi trường cho docker-compose (DB credentials)
```

---

## Yêu cầu hệ thống

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

## Cấu trúc services

### Development (`docker-compose.dev.yml`)

| Service | Image | Port | Mô tả |
|---|---|---|---|
| `db` | postgres:15-alpine | `5432` | PostgreSQL database |
| `redis` | redis:7-alpine | — | Broker cho Celery, cache |
| `backend` | Dockerfile.dev | `8000` | Django dev server (hot-reload) |
| `celery` | Dockerfile.dev | — | Celery worker |
| `frontend` | Dockerfile.dev | `5173` | Vite dev server (hot-reload) |

### Production (`docker-compose.prod.yml`)

| Service | Image | Port | Mô tả |
|---|---|---|---|
| `db` | postgres:15-alpine | internal | PostgreSQL database |
| `redis` | redis:7-alpine | internal | Broker cho Celery, cache |
| `web` | Dockerfile.prod | internal | Gunicorn WSGI server |
| `celery` | Dockerfile.prod | — | Celery worker |
| `nginx` | nginx:1.25-alpine | `80`, `443` | Reverse proxy, serve static |

---

## Môi trường Development

### 1. Chuẩn bị file `.env`

File `infra/.env` cung cấp biến cho docker-compose (chủ yếu là DB credentials):

```bash
# infra/.env
POSTGRES_DB=task_management
POSTGRES_USER=sonbui
POSTGRES_PASSWORD=sonbui9823
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

File `task-management-backend/.env` cung cấp biến cho Django. Tạo từ example:

```bash
cp task-management-backend/.env.example task-management-backend/.env
```

Các biến quan trọng cần điền:

```dotenv
SECRET_KEY=<django-secret-key-ngẫu-nhiên>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database — phải khớp với infra/.env
DATABASE_URL=postgresql://sonbui:sonbui9823@db:5432/task_management
POSTGRES_DB=task_management
POSTGRES_USER=sonbui
POSTGRES_PASSWORD=sonbui9823
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Email (Gmail SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password   # Gmail App Password, không phải password thường
DEFAULT_FROM_EMAIL=noreply@taskflow.com

# URL frontend — dùng để tạo link xác thực email
FRONTEND_URL=http://localhost:5173
```

> **Lấy Gmail App Password:** Vào [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), bật 2-Step Verification, tạo App Password cho "Mail".

File `task-management-frontend/.env` cho Vite:

```bash
cp task-management-frontend/.env.example task-management-frontend/.env
```

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Khởi động stack

Chạy từ thư mục gốc của project (thư mục chứa `infra/`):

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

Lần đầu sẽ mất vài phút để pull image và cài dependencies. Các lần sau:

```bash
docker compose -f infra/docker-compose.dev.yml up
```

### 3. Kiểm tra

| URL | Mô tả |
|---|---|
| `http://localhost:5173` | Frontend Vue (Vite dev server) |
| `http://localhost:8000/api/` | Backend Django REST API |
| `http://localhost:8000/admin/` | Django Admin |

### 4. Các lệnh thường dùng

```bash
# Xem log của tất cả services
docker compose -f infra/docker-compose.dev.yml logs -f

# Xem log của một service cụ thể
docker compose -f infra/docker-compose.dev.yml logs -f backend

# Chạy lệnh Django trong container
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py <command>

# Tạo migration mới
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py makemigrations

# Tạo superuser
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py createsuperuser

# Mở Django shell
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py shell

# Chạy tests backend
docker compose -f infra/docker-compose.dev.yml exec backend pytest

# Dừng stack (giữ volumes)
docker compose -f infra/docker-compose.dev.yml down

# Dừng và xóa toàn bộ volumes (reset database)
docker compose -f infra/docker-compose.dev.yml down -v
```

---

## Môi trường Production

### 1. Chuẩn bị file `.env`

File `task-management-backend/.env` cho production — **không dùng lại file dev**:

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

File `infra/.env` cho docker-compose:

```dotenv
POSTGRES_DB=task_management_prod
POSTGRES_USER=<db-user>
POSTGRES_PASSWORD=<db-password-mạnh>
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

### 2. Cấu hình Nginx

Mặc định `infra/nginx/default.conf` proxy toàn bộ traffic về Django. Nếu frontend được build thành static files và serve qua Nginx, cập nhật `default.conf` để thêm block phục vụ frontend:

```nginx
# Thêm vào default.conf nếu serve frontend qua Nginx
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

### 3. Build và khởi động

```bash
docker compose -f infra/docker-compose.prod.yml up --build -d
```

### 4. Kiểm tra

```bash
# Xem trạng thái các container
docker compose -f infra/docker-compose.prod.yml ps

# Xem log
docker compose -f infra/docker-compose.prod.yml logs -f

# Xem log Nginx
docker compose -f infra/docker-compose.prod.yml logs -f nginx
```

### 5. Các lệnh thường dùng

```bash
# Chạy migration thủ công (nếu cần)
docker compose -f infra/docker-compose.prod.yml exec web python manage.py migrate

# Collect static files thủ công
docker compose -f infra/docker-compose.prod.yml exec web python manage.py collectstatic --noinput

# Tạo superuser
docker compose -f infra/docker-compose.prod.yml exec web python manage.py createsuperuser

# Restart một service
docker compose -f infra/docker-compose.prod.yml restart web

# Dừng stack
docker compose -f infra/docker-compose.prod.yml down
```

---

## Xử lý sự cố thường gặp

**Backend không kết nối được database**

Kiểm tra `DATABASE_URL` trong `.env` có đúng hostname (`db`, không phải `localhost`) và credentials khớp với `infra/.env`.

```bash
docker compose -f infra/docker-compose.dev.yml logs db
```

**Frontend không gọi được API (CORS error)**

Đảm bảo `VITE_API_BASE_URL` trong `task-management-frontend/.env` trỏ đúng về backend (`http://localhost:8000` cho dev).

**Email xác thực không gửi được**

- Kiểm tra `EMAIL_HOST_USER` và `EMAIL_HOST_PASSWORD` (phải là App Password, không phải password Gmail thường).
- Kiểm tra `FRONTEND_URL` đúng cổng frontend (`http://localhost:5173` cho dev).

```bash
docker compose -f infra/docker-compose.dev.yml logs celery
```

**Port đã bị chiếm**

```bash
# Kiểm tra process đang dùng port
netstat -ano | findstr :8000   # Windows
lsof -i :8000                  # macOS/Linux
```

**Xóa cache Docker và build lại từ đầu**

```bash
docker compose -f infra/docker-compose.dev.yml down -v
docker system prune -f
docker compose -f infra/docker-compose.dev.yml up --build
```
