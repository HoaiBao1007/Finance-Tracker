# Vercel + Neon + Railway Backend Guide

## Kiến trúc áp dụng cho repo hiện tại
- Frontend Next.js trong [frontend](frontend) deploy lên Vercel.
- PostgreSQL dùng Neon.
- Backend Express + Prisma trong [backend](backend) deploy lên Railway.
- Frontend không kết nối Neon trực tiếp; toàn bộ DB access nằm ở backend.

## 1. Chuẩn bị Neon
1. Tạo database mới trên Neon.
2. Lấy 2 connection string:
   - pooled connection string để gán vào `DATABASE_URL`
   - direct connection string để gán vào `DIRECT_URL`
3. Đảm bảo cả hai URL đều có `sslmode=require`.

## 2. Cấu hình Railway cho backend

### Root service
- Service: `api`
- Root directory: `backend`
- Builder: Dockerfile
- Railway config: [backend/railway.json](backend/railway.json)

### Pre-deploy hiện tại
- Railway đã được chỉnh để chạy `npm run db:deploy` trước khi start app.
- Script này sẽ chạy:
  - `prisma generate`
  - `prisma migrate deploy`
  - `prisma seed`

## 3. Biến môi trường cần set trên Railway backend service
Tham chiếu mẫu đầy đủ tại [backend/.env.production.example](backend/.env.production.example).

```env
NODE_ENV="production"
PORT="4000"
DATABASE_URL="<Neon pooled connection string>"
DIRECT_URL="<Neon direct connection string>"
JWT_SECRET="<at-least-32-characters>"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="https://<your-vercel-domain>"
EMAIL_PROVIDER="resend"
MAIL_FROM_EMAIL="<verified-sender-email>"
MAIL_FROM_NAME="Finance Tracker"
RESEND_API_KEY="<resend-api-key>"
RESEND_API_BASE_URL="https://api.resend.com"
ALLOW_LOCAL_SMTP="false"
# Optional SMTP fallback when EMAIL_PROVIDER="smtp"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="<your-smtp-user>"
# SMTP_PASS="<your-smtp-password>"
PASSWORD_RESET_OTP_EXPIRES_MINUTES="15"
```

### Cách set nhanh bằng PowerShell trên Windows
1. Tạo file local `backend/.env.production` từ template `backend/.env.production.example`.
2. Điền giá trị production thật cho toàn bộ key, đặc biệt là `DATABASE_URL`, `DIRECT_URL`, `CLIENT_ORIGIN` và bộ biến email theo `EMAIL_PROVIDER`.
3. Đăng nhập Railway CLI:

```powershell
Set-Location "d:\Finance Tracker"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npx.cmd -y @railway/cli@latest login
```

4. Đồng bộ env lên backend service mà không in secret ra console:

```powershell
Set-Location "d:\Finance Tracker"
.\scripts\sync-railway-backend-env.ps1 -EnvFilePath .\backend\.env.production -ProjectId <railway-project-id> -EnvironmentId <railway-environment-id> -ServiceName api
```

## 4. Chạy migration Neon

### Cách khuyến nghị
Từ local hoặc CI/CD, chạy:

```powershell
Set-Location "d:\Finance Tracker\backend"
npm.cmd run db:deploy
```

### Cách tách lệnh
```powershell
Set-Location "d:\Finance Tracker\backend"
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run prisma:seed
```

### Khi nào dùng `DIRECT_URL`
- `prisma.config.ts` đã ưu tiên `DIRECT_URL` cho migration.
- Nếu `DIRECT_URL` không có, Prisma mới fallback sang `DATABASE_URL`.
- Với Neon production, luôn nên set cả 2 biến để migration ổn định hơn.

## 5. Deploy backend lên Railway
Sau khi env đã được set xong, deploy backend thật bằng path `backend/` từ root workspace:

```powershell
Set-Location "d:\Finance Tracker"
npx.cmd -y @railway/cli@latest up .\backend --path-as-root --project <railway-project-id> --environment <railway-environment-id> --service api
```

## 6. Deploy frontend lên Vercel

### Root project
- Root directory: `frontend`
- Framework preset: Next.js

### Biến môi trường bắt buộc trên Vercel
Tham chiếu mẫu tại [frontend/.env.production.example](frontend/.env.production.example).

```env
NEXT_PUBLIC_API_BASE_URL="https://<your-backend-domain>/api/v1"
```

### Trình tự khuyến nghị
1. Deploy backend Railway trước và lấy domain backend thật.
2. Set `NEXT_PUBLIC_API_BASE_URL` trên Vercel bằng domain backend đó.
3. Deploy frontend Vercel để lấy domain thật của frontend.
4. Quay lại Railway backend, đổi `CLIENT_ORIGIN` sang domain Vercel thật.
5. Redeploy backend Railway thêm một lần để CORS khớp domain production.

Ghi chú:
- Không dùng URL `localhost` trên Vercel.
- Sau khi backend Railway đổi domain, phải cập nhật lại biến này và redeploy frontend.

## 7. Nếu dùng GitHub Actions với Railway
- Workflow Railway hiện vẫn có khả năng deploy cả backend và frontend Railway.
- Nếu bạn dùng Vercel cho frontend, chỉ chạy Railway workflow với `target=backend`.
- Không cần deploy service `web` trên Railway trong flow này.

Checklist GitHub liên quan: [railway-github-checklist.md](railway-github-checklist.md)

## 8. Smoke test sau deploy
1. Mở `https://<railway-backend-domain>/api/v1/health`
2. Mở frontend Vercel `/dashboard`
3. Đăng ký hoặc đăng nhập
4. Tạo một transaction
5. Tạo một budget
6. Thử quên mật khẩu để xác nhận SMTP production hoạt động

## 9. Lỗi hay gặp
- Backend boot fail vì thiếu `DATABASE_URL` hoặc `JWT_SECRET`
- `prisma migrate deploy` fail vì chưa set `DIRECT_URL`
- Frontend trên Vercel vẫn trỏ `NEXT_PUBLIC_API_BASE_URL` về localhost
- Backend CORS fail vì `CLIENT_ORIGIN` chưa đổi sang domain Vercel thật
- Forgot password fail vì SMTP env production chưa được set đủ