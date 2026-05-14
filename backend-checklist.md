# Personal Finance Tracker - Backend Execution Checklist

## Phase 1 - Foundation
- [x] Tạo thư mục `backend/`.
- [x] Khởi tạo project Node.js + Express + TypeScript strict.
- [x] Cài Prisma, PostgreSQL driver, Zod, JWT, bcrypt, dotenv.
- [x] Cấu hình `tsconfig.json`.
- [x] Cấu hình script `dev`, `build`, `start`, `prisma:generate`, `prisma:migrate`, `prisma:seed`.
- [x] Tạo cấu trúc `controllers`, `services`, `routes`, `validators`, `middlewares`, `lib`, `utils`, `types`.
- [x] Tạo `app.ts` và `server.ts`.
- [x] Tạo Prisma client trong `lib/prisma.ts`.
- [x] Tạo error handler middleware.
- [x] Tạo validate middleware.
- [x] Chuẩn hóa response JSON format.

## Phase 2 - Database Schema
- [x] Tạo Prisma schema cho User.
- [x] Tạo Prisma schema cho Category.
- [x] Tạo Prisma schema cho Transaction.
- [x] Tạo Prisma schema cho Budget.
- [x] Tạo enum `income` và `expense`.
- [x] Thêm relation giữa các bảng.
- [x] Thêm unique constraint cho email.
- [x] Thêm unique constraint cho category theo `userId + name + type`.
- [x] Thêm unique constraint cho budget theo `userId + categoryId + month + year`.
- [x] Thêm index cho `userId + date` trong transaction.
- [x] Thêm index cho `categoryId` trong transaction.
- [x] Đảm bảo tiền dùng BIGINT.
- [x] Tạo migration SQL đầu tiên và apply schema vào DB local.
- [x] Tạo seed category mặc định.

## Phase 3 - Auth Module
- [x] Tạo validator cho register.
- [x] Tạo validator cho login.
- [x] Tạo validator cho update profile, đổi mật khẩu, quên mật khẩu và reset mật khẩu.
- [x] Tạo service register.
- [x] Tạo service login.
- [x] Tạo service update profile, đổi mật khẩu và reset mật khẩu.
- [x] Tạo controller register.
- [x] Tạo controller login.
- [x] Tạo controller me.
- [x] Tạo controller update profile, change password, forgot/reset password.
- [x] Tạo auth route.
- [x] Tạo JWT auth middleware.
- [x] Gắn user vào request type.
- [x] Test `POST /auth/register`.
- [x] Test `POST /auth/login`.
- [x] Test `GET /auth/me`.
- [x] Test `POST /auth/forgot-password`.
- [x] Test `POST /auth/reset-password`.
- [x] Test `PATCH /auth/profile`.
- [x] Test `POST /auth/change-password`.

## Phase 4 - Category Module
- [x] Tạo validator tạo category.
- [x] Tạo service lấy category.
- [x] Tạo service tạo category.
- [x] Tạo controller lấy category.
- [x] Tạo controller tạo category.
- [x] Tạo category route.
- [x] Hỗ trợ category hệ thống và category cá nhân.
- [x] Kiểm tra category trả đúng theo user.

## Phase 5 - Transaction Module
- [x] Tạo validator create transaction.
- [x] Tạo validator update transaction.
- [x] Tạo validator filter transaction query.
- [x] Tạo service create transaction.
- [x] Tạo service get transaction by id.
- [x] Tạo service list transactions.
- [x] Tạo service update transaction.
- [x] Tạo service delete transaction.
- [x] Tạo transaction controller.
- [x] Tạo transaction routes.
- [x] Hỗ trợ filter `month`, `year`, `from`, `to`, `categoryId`, `type`.
- [x] Hỗ trợ pagination `page`, `limit`.
- [x] Sort theo `date DESC`, sau đó `createdAt DESC`.
- [x] Validate `amount > 0`.
- [x] Validate category thuộc user hoặc category hệ thống.
- [x] Trả amount dưới dạng string trong response.

## Phase 6 - Budget Module
- [x] Tạo validator create budget.
- [x] Tạo validator update budget.
- [x] Tạo service create budget.
- [x] Tạo service list budgets.
- [x] Tạo service update budget.
- [x] Tạo service delete budget.
- [x] Tạo budget controller.
- [x] Tạo budget routes.
- [x] Validate `limitAmount > 0`.
- [x] Validate budget chỉ áp dụng cho expense category.
- [x] Trả `limitAmount` dưới dạng string.

## Phase 7 - Reports Module
- [x] Tạo service summary report.
- [x] Tạo service expense by category report.
- [x] Tạo service monthly trend report.
- [x] Tạo report controller.
- [x] Tạo report routes.
- [x] Đảm bảo `GET /reports/summary` trả `totalIncome`, `totalExpense`, `balance`.
- [x] Đảm bảo `GET /reports/by-category` trả dữ liệu dùng được cho pie chart.
- [x] Đảm bảo `GET /reports/monthly-trend` trả dữ liệu dùng được cho bar chart.
- [x] Kiểm tra số liệu không qua float.

## Phase 8 - Hardening và tài liệu
- [x] Tạo `.env.example`.
- [x] Viết README backend.
- [x] Viết ví dụ request/response cho API chính.
- [ ] Test Postman hoặc Thunder Client cho các endpoint chính.
- [ ] Kiểm tra lỗi auth hết hạn token.
- [ ] Kiểm tra lỗi validation query và body.
- [x] Kiểm tra BigInt serialization trong response JSON.
- [ ] Chuẩn bị backend để deploy.

## Phase 9 - Custom Categories
- [x] Thêm `isCustom` field và optional `userId` field vào Category model trong Prisma.
- [x] Cập nhật validator để hỗ trợ `isCustom` field tùy chọn.
- [x] Đảm bảo `POST /categories` tạo category custom cho user.
- [x] Đảm bảo `GET /categories` trả tất cả category (mặc định + custom).
- [x] Kiểm tra custom category chỉ thuộc user sở hữu.
- [x] Kiểm tra unique constraint vẫn hoạt động cho custom categories.

## Definition of Done
- [x] Auth chạy ổn định.
- [x] Category chạy ổn định.
- [x] Transaction CRUD + filter + pagination chạy ổn định.
- [x] Budget CRUD chạy ổn định.
- [x] Reports trả đúng số liệu.
- [x] Không có logic tiền tệ nào dùng float.
- [x] Có tài liệu và env example đủ để chạy project.