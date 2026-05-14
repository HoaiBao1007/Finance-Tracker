# Personal Finance Tracker - Weekly Task Board

## Cách dùng
- Mỗi tuần chỉ tập trung vào một nhóm kết quả chính.
- Chỉ chuyển sang tuần tiếp theo khi đầu ra của tuần hiện tại đã đạt.
- Nếu làm nhanh hơn, có thể kéo sớm một phần công việc của tuần sau, nhưng không bỏ qua phần kiểm thử của tuần hiện tại.

## Week 1 - Scope và nền tảng backend

### Mục tiêu
- Chốt scope MVP.
- Khởi tạo backend skeleton.

### Công việc
- [x] Tạo thư mục `backend/` và `frontend/`.
- [x] Khởi tạo `backend` với Node.js + Express + TypeScript strict.
- [x] Cài Prisma, dotenv, Zod, JWT, bcrypt, công cụ dev cần thiết.
- [x] Thiết lập cấu trúc thư mục controller, service, route, validator, middleware, lib, utils.
- [x] Tạo `app.ts`, `server.ts`, Prisma client, error handler, validate middleware.
- [x] Chốt response JSON format.
- [x] Tạo `.env.example` cho backend.

### Đầu ra tuần
- Backend chạy được bằng lệnh dev.
- Có kiến trúc thư mục chuẩn để viết module.

### Exit criteria
- [x] Server khởi động thành công.
- [x] Prisma client load được.
- [x] Middleware lỗi và validate hoạt động.

## Week 2 - Database và auth

### Mục tiêu
- Hoàn thiện data model và user boundary.

### Công việc
- [x] Thiết kế schema User, Category, Transaction, Budget.
- [x] Thêm enum, relation, unique constraint, index.
- [x] Tạo migration SQL đầu tiên và apply schema vào DB local.
- [x] Seed category mặc định.
- [x] Xây API register.
- [x] Xây API login.
- [x] Xây API me.
- [x] Tạo JWT auth middleware.
- [x] Kiểm tra user chỉ truy cập dữ liệu của chính họ.

### Đầu ra tuần
- Database schema ổn định.
- User có thể đăng ký và đăng nhập.

### Exit criteria
- [x] Schema DB được apply thành công trên PostgreSQL local.
- [x] Seed chạy thành công.
- [x] Register và login trả token hợp lệ.
- [x] `GET /auth/me` hoạt động.

Ghi chú:
- Local PostgreSQL đang chạy qua `prisma dev`.
- Với môi trường này, schema được apply bằng `prisma db push` và SQL migration được lưu tại `backend/prisma/migrations/20260508_init/migration.sql`.

## Week 3 - Category, Transaction, Budget

### Mục tiêu
- Hoàn thiện nghiệp vụ cốt lõi.

### Công việc
- [x] Xây API lấy categories.
- [x] Xây API tạo category cá nhân.
- [x] Xây CRUD transaction.
- [x] Hỗ trợ filter theo `month`, `year`, `from`, `to`, `categoryId`, `type`.
- [x] Hỗ trợ pagination cho transaction list.
- [x] Xây CRUD budget.
- [x] Validate amount > 0.
- [x] Validate category hợp lệ.
- [x] Validate budget chỉ áp dụng cho expense category.

### Đầu ra tuần
- Core finance flow đã chạy được bằng API.

### Exit criteria
- [x] CRUD transaction chạy đủ.
- [x] CRUD budget chạy đủ.
- [x] Filter và pagination chạy đúng.

## Week 4 - Reports và ổn định API contract

### Mục tiêu
- Chuẩn bị dữ liệu sạch cho dashboard frontend.

### Công việc
- [x] Xây `GET /reports/summary`.
- [x] Xây `GET /reports/by-category`.
- [x] Xây `GET /reports/monthly-trend`.
- [x] Kiểm tra amount trả về dạng string.
- [x] Kiểm tra số liệu income, expense, balance.
- [x] Chốt shape JSON cho dashboard.
- [x] Viết ví dụ request/response cho endpoint chính.

### Đầu ra tuần
- API contract ổn định để frontend tích hợp.

### Exit criteria
- [x] Dashboard endpoints đủ dữ liệu.
- [x] Frontend không cần tự tổng hợp dữ liệu tài chính phức tạp.

## Week 5 - Frontend foundation và dashboard shell

### Mục tiêu
- Dựng nền frontend để tích hợp nhanh.

### Công việc
- [x] Khởi tạo `frontend/` bằng Next.js 14 App Router + TypeScript + Tailwind.
- [x] Cài Recharts, React Hook Form, Zod.
- [x] Tạo API client bằng fetch hoặc axios.
- [x] Tạo type models cho finance data.
- [x] Tạo helper format tiền và ngày.
- [x] Tạo layout dashboard.
- [x] Tạo loading, empty, error states.

### Đầu ra tuần
- Frontend có layout và hạ tầng gọi API.

### Exit criteria
- [x] Dashboard page render được.
- [x] API layer hoạt động với dữ liệu thật hoặc mock.

## Week 6 - Dashboard charts, table và modal form

### Mục tiêu
- Hoàn thiện giao diện chính của sản phẩm.

### Công việc
- [x] Tạo Summary Cards.
- [x] Tạo Pie Chart theo category.
- [x] Tạo Bar Chart 6 tháng gần nhất.
- [x] Tạo Transactions Table.
- [x] Tạo bộ lọc tháng và năm.
- [x] Tạo Transaction Modal.
- [x] Dùng React Hook Form + Zod cho form.
- [x] Nối API create transaction.
- [x] Refresh dashboard sau submit.
- [x] Thêm edit và delete transaction.
- [x] Thêm confirm delete.

### Đầu ra tuần
- Có dashboard usable cho demo.

### Exit criteria
- [x] CRUD transaction chạy được từ UI.
- [x] Charts hiển thị đúng dữ liệu thật.
- [x] Responsive cơ bản đạt trên mobile và desktop.

## Week 7 - Kiểm thử và polish

### Mục tiêu
- Nâng độ ổn định trước khi deploy.

### Công việc
- [x] Test manual auth flow.
- [x] Test manual transaction flow.
- [x] Test manual budget flow.
- [x] Test dashboard filters.
- [x] Kiểm tra BigInt serialization.
- [x] Kiểm tra timezone edge cases.
- [x] Kiểm tra loading, empty, error states.
- [x] Rà lại copy UI, label và thông báo lỗi.

### Đầu ra tuần
- Ứng dụng ổn định cho staging.

### Exit criteria
- [x] Không còn blocker ở luồng chính.
- [x] Checklist MVP gần hoàn tất.

## Week 8 - Tài liệu và deploy

### Mục tiêu
- Hoàn tất bản MVP để bàn giao hoặc demo.

### Công việc
- [x] Viết README cho backend.
- [x] Viết README cho frontend.
- [x] Hoàn thiện `.env.example`.
- [x] Deploy backend.
- [x] Deploy frontend.
- [x] Test staging end-to-end.
- [x] Chốt danh sách backlog sau MVP.

### Đầu ra tuần
- Có bản chạy online hoặc staging.

### Exit criteria
- [x] Có URL demo hoặc staging.
- [x] Toàn bộ checklist MVP đã đạt.

## Week 9 - Custom Categories

### Mục tiêu
- Cho phép user tạo danh mục chi tiêu riêng.

### Công việc
- [x] Backend: Thêm `isCustom` và `userId` field vào Category model.
- [x] Backend: Cập nhật validator để hỗ trợ `isCustom`.
- [x] Frontend: Tạo SearchableSelect component.
- [x] Frontend: Tạo NewCategorySection component.
- [x] Frontend: Tạo settings page và route.
- [x] Frontend: Tích hợp NewCategorySection vào Account Settings.
- [x] Frontend: Cập nhật Transaction Modal để dùng SearchableSelect.
- [x] Frontend: Fix Transaction Modal lỗi JSX và type errors.
- [ ] Test category creation end-to-end.
- [ ] Test searchable select với nhiều categories.
- [ ] Test mobile app category feature.

### Đầu ra tuần
- User có thể tạo category custom trong Account Settings.
- User có thể tạo category inline khi tạo transaction.
- Category search hoạt động mượt cho nhiều categories.

### Exit criteria
- [x] Frontend không còn lỗi compilation.
- [ ] Category creation flow chạy end-to-end.
- [ ] Mobile app cũng hỗ trợ custom categories.

## Gợi ý nhịp làm việc theo ngày
- Thứ 2: setup hoặc thiết kế.
- Thứ 3 đến Thứ 5: code tính năng chính.
- Thứ 6: test và sửa lỗi.
- Thứ 7: dọn tài liệu, chốt checklist, chuẩn bị tuần tiếp theo.