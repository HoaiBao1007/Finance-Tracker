# Railway GitHub Checklist

## 1. GitHub repo
- Tạo secret `RAILWAY_TOKEN` cho staging project.
- Tạo variable `RAILWAY_ENVIRONMENT_ID` cho staging environment.
- Khi production sẵn sàng, tạo thêm secret `RAILWAY_PRODUCTION_TOKEN`.
- Khi production sẵn sàng, tạo thêm variable `RAILWAY_PRODUCTION_ENVIRONMENT_ID`.

## 2. Railway dashboard
- Xác nhận service staging dùng đúng tên `api` và `web`.
- Nếu production dùng tên khác `api` hoặc `web`, sửa trực tiếp trong `.github/workflows/railway-production.yml`.
- Tắt GitHub autodeploy trên Railway cho các service đã giao cho GitHub Actions.
- Giữ các biến runtime như `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL` trên Railway service.

## 3. Chạy lần đầu
- Chạy workflow `Railway Staging Deploy` với `target=both`.
- Xác nhận backend health và frontend `/healthz` đều lên sau deploy.
- Khi đã có production thật, chạy `Railway Production Deploy` thủ công với `target=both`.