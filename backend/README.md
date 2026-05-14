# Personal Finance Tracker Backend

Backend API cho ứng dụng Personal Finance Tracker, xây bằng Node.js, Express, TypeScript, PostgreSQL và Prisma.

## Tech stack
- Node.js + Express 5
- TypeScript strict mode
- PostgreSQL
- Prisma 7 + `@prisma/adapter-pg`
- Zod validation
- JWT authentication

## Tính năng hiện có
- Auth: register, login, get current user, update profile, change password, forgot/reset password with email OTP
- Categories: lấy danh sách category, tạo category cá nhân
- Transactions: CRUD, filter theo tháng/năm hoặc khoảng ngày, pagination
- Budgets: CRUD theo category và kỳ tháng/năm
- Reports: summary, by-category, monthly-trend
- Chuẩn response JSON thống nhất
- Xử lý tiền bằng số nguyên, trả về dạng string qua API

## Cấu trúc thư mục
```text
backend/
├── docs/
├── prisma/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── lib/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── validators/
├── .env.example
├── package.json
└── tsconfig.json
```

## Yêu cầu môi trường
- Node.js 20+
- npm
- PostgreSQL

## Cài dependencies
```bash
npm install
```

## Cấu hình môi trường
Tạo file `.env` từ `.env.example`.

```env
NODE_ENV="development"
PORT="4000"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_tracker?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/finance_tracker?schema=public"
JWT_SECRET="replace-this-with-at-least-32-characters"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:3000"
EMAIL_PROVIDER="resend"
MAIL_FROM_EMAIL="no-reply@example.com"
MAIL_FROM_NAME="Finance Tracker"
RESEND_API_KEY="re_placeholder_api_key"
RESEND_API_BASE_URL="https://api.resend.com"
ALLOW_LOCAL_SMTP="false"
# Optional SMTP fallback when EMAIL_PROVIDER="smtp"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="your-account@gmail.com"
# SMTP_PASS="your-app-password"
PASSWORD_RESET_OTP_EXPIRES_MINUTES="15"
```

### Cấu hình email OTP
- Backend hỗ trợ `EMAIL_PROVIDER=resend` qua HTTPS API và `EMAIL_PROVIDER=smtp` như fallback tương thích ngược.
- Trên Railway nên ưu tiên `EMAIL_PROVIDER=resend` để tránh lỗi outbound SMTP tới Gmail.
- `MAIL_FROM_EMAIL` và `MAIL_FROM_NAME` là địa chỉ gửi chung cho mọi provider.
- Với Resend, điền `RESEND_API_KEY` và dùng sender/domain đã verify cho `MAIL_FROM_EMAIL`.
- Với SMTP, điền `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, và nếu provider yêu cầu auth thì điền cả `SMTP_USER` lẫn `SMTP_PASS`.
- Nếu dùng Gmail qua SMTP, hãy bật 2FA, tạo App Password cho `SMTP_PASS`, và nên dùng cổng `587` với STARTTLS.
- Nếu bạn copy nguyên giá trị mẫu như `re_placeholder_api_key` hoặc `no-reply@example.com`, backend sẽ tự coi là chưa cấu hình xong để tránh gửi mail bằng dữ liệu giả.
- `ALLOW_LOCAL_SMTP=false` sẽ chặn cấu hình `localhost` để tránh OTP vô tình đi vào MailDev thay vì hộp thư thật.
- Chỉ bật `ALLOW_LOCAL_SMTP=true` khi bạn thật sự muốn debug local mail server trong máy của mình.

## Chạy database local

### Cách 1: PostgreSQL cài sẵn trên máy
- Dùng `DATABASE_URL` như trong `.env.example`
- Tạo database `finance_tracker`
- Apply schema
- Seed category mặc định

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Cách 2: Prisma dev local Postgres
Workflow này đã được dùng trong workspace hiện tại.

1. Khởi động PostgreSQL local bằng Prisma:
```bash
npx prisma dev -d -n finance-tracker
```

2. Lấy TCP connection string từ output của lệnh trên và cập nhật `DATABASE_URL` trong `.env`.

Ví dụ:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:51214/finance_tracker?schema=public&sslmode=disable"
```

3. Apply schema cục bộ:
```bash
npx prisma db push
```

4. Seed category mặc định:
```bash
npm run prisma:seed
```

### Ghi chú về migration local
- Trong workspace này, schema local đã được apply bằng `prisma db push`.
- SQL migration đầu tiên đã được lưu tại `prisma/migrations/20260508_init/migration.sql`.
- Nếu bạn dùng PostgreSQL cài sẵn hoặc Docker Postgres ổn định, có thể tiếp tục theo luồng `prisma migrate dev` bình thường.

## Deploy production với Neon

### Chuẩn Prisma cho production
- Với Prisma 7 trong repo này, `schema.prisma` chỉ giữ `provider = "postgresql"`; connection URL được quản lý ở `prisma.config.ts`.
- `prisma.config.ts` hiện ưu tiên `DIRECT_URL` cho Prisma CLI và fallback về `DATABASE_URL` nếu chưa khai báo.
- Với Neon, nên dùng:
	- `DATABASE_URL` = pooled connection string cho runtime backend
	- `DIRECT_URL` = direct connection string cho migration

### Mẫu env production
- Mẫu sẵn có tại [./.env.production.example](./.env.production.example)

### Lệnh migrate production
```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

Hoặc dùng script gói gọn:
```bash
npm run db:deploy
```

### Ghi chú kiến trúc deploy
- Frontend Next.js hiện chỉ gọi backend qua `NEXT_PUBLIC_API_BASE_URL`, không chạy Prisma trực tiếp.
- Nếu dùng Vercel + Neon với repo hiện tại, frontend deploy lên Vercel còn backend vẫn cần deploy trên Node host riêng.
- Checklist chi tiết: [../deploy-vercel-neon-checklist.md](../deploy-vercel-neon-checklist.md)

## Chạy backend

### Dev mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start từ bản build
```bash
npm run start
```

## Scripts có sẵn
```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run db:deploy
npm run prisma:seed
```

## Deploy staging
- Stack đề xuất: Railway cho backend API và PostgreSQL.
- Backend đã có `Dockerfile` và script `npm run db:setup` để chuẩn hóa luồng staging.
- Hướng dẫn triển khai đầy đủ: [../deploy-staging.md](../deploy-staging.md)

## API docs
- Core APIs: [docs/core-api-examples.md](./docs/core-api-examples.md)
- Report APIs: [docs/report-api-examples.md](./docs/report-api-examples.md)

## Base URL
```text
http://localhost:4000/api/v1
```

## Endpoint chính
- `/auth`
- `/categories`
- `/transactions`
- `/budgets`
- `/reports`

## Quy ước kỹ thuật quan trọng
- Tiền được lưu bằng `BigInt` trong database.
- Tiền luôn trả về dạng string trong API response.
- `req.query` không được gán lại trực tiếp trong Express 5; query đã validate được chuyển qua `res.locals.validatedQuery`.
- Prisma runtime dùng `PrismaPg` adapter qua `@prisma/adapter-pg`.

## Health check
```http
GET /api/v1/health
```

## Trạng thái hiện tại
- Backend core APIs đã hoạt động.
- Reports API đã hoạt động và có docs ví dụ request/response.
- Frontend đã được scaffold trong thư mục `frontend/` và có thể gọi backend ở live mode.