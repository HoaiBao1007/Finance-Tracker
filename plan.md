# Personal Finance Tracker - Main Plan

## Mục tiêu chính
- Xây dựng MVP theo hướng backend-first.
- Khóa data model, business rule và API contract trước khi dựng dashboard frontend.
- Hoàn thành một bản có thể demo hoặc deploy staging với đầy đủ auth, category, transaction, budget, reports và dashboard.

## Phạm vi MVP
- Auth: register, login, me.
- Category: category hệ thống và category cá nhân.
- Transaction: CRUD, filter theo tháng/năm/khoảng thời gian, pagination.
- Budget: CRUD theo category và theo tháng.
- Reports: summary, by-category, monthly-trend.
- Frontend dashboard: summary cards, pie chart, bar chart, transactions table, modal form.
- Deploy backend và frontend.

## Quyết định kỹ thuật cần khóa từ đầu
- Backend dùng Node.js, Express, TypeScript strict, PostgreSQL, Prisma, Zod.
- Frontend dùng Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts, React Hook Form, Zod.
- Tiền tệ dùng BIGINT trong database, trả về dạng string qua API.
- Không dùng float cho logic tài chính.
- Lưu thời gian theo UTC trong database, chỉ format local time ở frontend.
- Cấu trúc workspace khuyến nghị gồm hai thư mục `backend/` và `frontend/` trong cùng workspace.

## Thứ tự thực hiện
1. Khởi tạo workspace và khóa scope.
2. Dựng backend foundation.
3. Thiết kế database, migration và seed.
4. Hoàn thiện auth và category.
5. Hoàn thiện transaction và budget.
6. Hoàn thiện reports API.
7. Dựng frontend foundation.
8. Hoàn thiện dashboard UI và tích hợp API.
9. Test, polish và deploy.

## Kế hoạch triển khai chi tiết

### 1. Khởi tạo workspace và khóa scope
- Tạo hai thư mục ứng dụng: `backend/` và `frontend/`.
- Giữ `personal-finance-tracker-prompts.md` làm tài liệu chuẩn về stack, schema, API và cấu trúc thư mục.
- Giữ `personal-finance-tracker-roadmap-checklist.md` làm checklist tổng theo giai đoạn.
- Chốt danh sách category mặc định, response format và quy ước tiền tệ.

Kết quả cần có:
- Phạm vi MVP rõ ràng.
- Có cấu trúc thư mục dự án để bắt đầu code.

### 2. Backend foundation
- Khởi tạo Express + TypeScript strict.
- Thiết lập env, Prisma client, error handler, validate middleware, auth middleware.
- Thiết lập base response JSON để mọi API cùng format.

Kết quả cần có:
- Server chạy được.
- Kiến trúc backend đủ nền để phát triển business modules.

### 3. Database, migration và seed
- Thiết kế schema User, Category, Transaction, Budget.
- Tạo enum, relation, unique constraint, index.
- Tạo migration đầu tiên.
- Seed category mặc định như Ăn uống, Hóa đơn, Di chuyển, Giải trí, Lương, Thưởng.

Kết quả cần có:
- Database schema ổn định cho MVP.
- Seed chạy đúng và dữ liệu mẫu sẵn sàng.

### 4. Auth và category
- Xây register, login, me.
- Áp JWT middleware cho các route cần bảo vệ.
- Hoàn thiện API categories cho category hệ thống và category cá nhân.
- Kiểm tra phân quyền để user chỉ thấy dữ liệu của mình.

Kết quả cần có:
- User có thể đăng nhập.
- Hệ thống đã có user boundary rõ ràng.

### 5. Transaction và budget
- Hoàn thiện CRUD transaction.
- Hỗ trợ filter `month`, `year`, `from`, `to`, `categoryId`, `type`, `page`, `limit`.
- Hoàn thiện CRUD budget theo category và kỳ tháng/năm.
- Validate amount > 0, category hợp lệ, budget chỉ áp dụng cho expense.

Kết quả cần có:
- Toàn bộ nghiệp vụ cốt lõi của finance tracker đã hoạt động.

### 6. Reports API
- Làm `GET /reports/summary`.
- Làm `GET /reports/by-category`.
- Làm `GET /reports/monthly-trend`.
- Chuẩn hóa response để frontend dùng trực tiếp cho cards và charts.

Kết quả cần có:
- Frontend có thể tích hợp dashboard mà không cần logic chuyển đổi phức tạp.

### 7. Frontend foundation
- Khởi tạo Next.js 14 App Router + Tailwind + TypeScript.
- Tạo API client, type models, format helpers.
- Tạo layout dashboard và các state loading, empty, error.

Kết quả cần có:
- Có khung frontend sẵn sàng gắn dữ liệu thật.

### 8. Dashboard UI và tích hợp API
- Dựng Summary Cards.
- Dựng Expense Pie Chart.
- Dựng Income vs Expense Bar Chart.
- Dựng Transactions Table.
- Dựng Transaction Modal với React Hook Form + Zod.
- Nối API thật và tự refresh dữ liệu sau create, update, delete.

Kết quả cần có:
- Dashboard usable trên mobile và desktop.

### 9. Test, polish và deploy
- Test auth, CRUD transaction, budget, reports, dashboard.
- Kiểm tra BigInt serialization, timezone, token expiry.
- Hoàn thiện README, `.env.example`, deploy backend và frontend.

Kết quả cần có:
- Bản MVP có thể chạy và demo.

## Nguyên tắc kiểm thử theo mốc
1. Sau database: migration và seed phải chạy được.
2. Sau auth/category: test register, login, me, list category, create category.
3. Sau transaction/budget: test create, update, delete, list, filter, pagination.
4. Sau reports: test số liệu income, expense, balance và shape dữ liệu cho chart.
5. Sau frontend: test mobile, desktop, form modal, refresh data, error states.
6. Trước deploy: rà lại checklist MVP và test staging end-to-end.

## Ngoài phạm vi MVP
- Giao dịch định kỳ.
- Nhiều ví hoặc nhiều tài khoản.
- Mục tiêu tiết kiệm.
- Import CSV hoặc Excel.
- Export PDF hoặc Excel.
- Soft delete, audit log, analytics nâng cao.

## Backlog sau MVP

### Ưu tiên 1
- Giao dịch định kỳ để giảm thao tác nhập tay cho chi tiêu cố định.
- Nhiều ví hoặc nhiều tài khoản để tách dòng tiền theo ngân hàng, tiền mặt hoặc ví điện tử.
- Mục tiêu tiết kiệm để theo dõi tiến độ cho các khoản tích lũy cá nhân.

### Ưu tiên 2
- Import CSV hoặc Excel để migrate dữ liệu từ ứng dụng khác hoặc file sao kê.
- Export PDF hoặc Excel để phục vụ báo cáo cá nhân và chia sẻ.
- Soft delete và audit log để tăng khả năng truy vết thay đổi dữ liệu.

### Ưu tiên 3
- Analytics nâng cao như so sánh theo kỳ, top category theo biến động, và cảnh báo vượt ngân sách.
- Test tự động cho backend API và dashboard UI để giảm rủi ro khi mở rộng tính năng.
- CI/CD cho staging và production để rút ngắn vòng lặp deploy sau MVP.

## Tài liệu liên quan trong workspace
- `personal-finance-tracker-prompts.md`
- `personal-finance-tracker-roadmap-checklist.md`
- `task-board-weekly.md`
- `backend-checklist.md`
- `frontend-checklist.md`