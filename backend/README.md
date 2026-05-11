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
- Auth: register, login, get current user
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
JWT_SECRET="replace-this-with-at-least-32-characters"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="http://localhost:3000"
```

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