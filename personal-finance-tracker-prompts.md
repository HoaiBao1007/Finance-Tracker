# Personal Finance Tracker - Copilot Prompt Pack

## Prompt Backend

Tôi muốn bạn xây dựng backend cho ứng dụng Personal Finance Tracker bằng Node.js, Express, TypeScript, PostgreSQL và Prisma ORM.

### Mục tiêu
- Xây dựng backend đủ tốt cho MVP nhưng có tư duy production-ready.
- Code rõ ràng, dễ mở rộng, dễ bảo trì.
- Tổ chức theo hướng controller, service, route, validator, middleware.

### Yêu cầu kỹ thuật
- Dùng TypeScript ở strict mode.
- Dùng Express làm web framework.
- Dùng PostgreSQL với Prisma ORM.
- Dùng Zod để validate body, params và query.
- Dùng middleware xử lý lỗi tập trung.
- Dùng JWT auth cơ bản để đảm bảo mỗi user chỉ truy cập dữ liệu của chính họ.
- Dùng dotenv hoặc tương đương để quản lý biến môi trường.
- Không dùng float cho dữ liệu tiền tệ.

### Quy ước xử lý tiền
- Lưu tiền bằng BIGINT trong PostgreSQL theo đơn vị nhỏ nhất.
- Với VND, lưu trực tiếp số nguyên.
- Tuyệt đối không dùng JavaScript float để tính toán tiền.
- Trong API response, trả amount và limitAmount dưới dạng string để tránh lỗi serialize BigInt và tránh mất chính xác.
- Tạo helper parse/format amount nếu cần.

### Thiết kế cơ sở dữ liệu
- User:
  - id
  - email
  - passwordHash
  - fullName
  - createdAt
  - updatedAt

- Category:
  - id
  - userId nullable nếu là danh mục hệ thống
  - name
  - type enum: income | expense
  - isDefault
  - createdAt
  - updatedAt

- Transaction:
  - id
  - userId
  - categoryId
  - amount
  - type enum: income | expense
  - date
  - note
  - createdAt
  - updatedAt

- Budget:
  - id
  - userId
  - categoryId
  - limitAmount
  - month
  - year
  - createdAt
  - updatedAt

### Ràng buộc dữ liệu
- User.email là unique.
- Category unique theo userId + name + type.
- Budget unique theo userId + categoryId + month + year.
- Tạo index cho Transaction theo userId + date.
- Tạo index cho Transaction theo categoryId.
- amount và limitAmount phải lớn hơn 0.
- Budget chỉ áp dụng cho category có type là expense.
- Category dùng trong transaction phải thuộc user hiện tại hoặc là category hệ thống.

### Cấu trúc thư mục mong muốn
src/
- app.ts
- server.ts
- config/env.ts
- lib/prisma.ts
- middlewares/auth.middleware.ts
- middlewares/error.middleware.ts
- middlewares/validate.middleware.ts
- validators/auth.validator.ts
- validators/transaction.validator.ts
- validators/budget.validator.ts
- validators/category.validator.ts
- controllers/auth.controller.ts
- controllers/transaction.controller.ts
- controllers/budget.controller.ts
- controllers/category.controller.ts
- controllers/report.controller.ts
- services/auth.service.ts
- services/transaction.service.ts
- services/budget.service.ts
- services/category.service.ts
- services/report.service.ts
- routes/auth.route.ts
- routes/transaction.route.ts
- routes/budget.route.ts
- routes/category.route.ts
- routes/report.route.ts
- routes/index.ts
- utils/amount.ts
- utils/pagination.ts
- utils/date.ts
- types/express.d.ts

### API cần xây dựng
- Auth
  - POST /auth/register
  - POST /auth/login
  - GET /auth/me

- Categories
  - GET /categories
  - POST /categories

- Transactions
  - POST /transactions
  - GET /transactions
  - GET /transactions/:id
  - PATCH /transactions/:id
  - DELETE /transactions/:id

- Budgets
  - POST /budgets
  - GET /budgets
  - PATCH /budgets/:id
  - DELETE /budgets/:id

- Reports
  - GET /reports/summary
  - GET /reports/by-category
  - GET /reports/monthly-trend

### Yêu cầu filter cho danh sách giao dịch
- Hỗ trợ query:
  - month
  - year
  - from
  - to
  - categoryId
  - type
  - page
  - limit
- Cho phép lọc theo month/year hoặc from/to.
- Có phân trang cho danh sách transaction.
- Sort mặc định theo date giảm dần, sau đó createdAt giảm dần.

### Yêu cầu cho báo cáo
- GET /reports/summary?from=&to=
  - Trả totalIncome, totalExpense, balance trong khoảng thời gian.
- GET /reports/by-category?month=&year=
  - Trả tổng expense theo category để vẽ pie chart.
- GET /reports/monthly-trend?months=6
  - Trả dữ liệu 6 tháng gần nhất, mỗi tháng gồm income và expense để vẽ bar chart.

### Quy tắc nghiệp vụ
- Mỗi user chỉ xem, sửa, xóa dữ liệu của chính họ.
- amount luôn lớn hơn 0.
- Không cho tạo transaction với category không thuộc user hiện tại hoặc category hệ thống.
- Budget chỉ dành cho expense category.
- Nếu query filter không hợp lệ, trả lỗi validation rõ ràng.
- Timezone cần thống nhất, ưu tiên lưu UTC trong DB.

### Yêu cầu code
- Viết Prisma schema hoàn chỉnh với enum, relation, index, unique constraint.
- Viết migration và seed dữ liệu cho category mặc định:
  - Ăn uống
  - Hóa đơn
  - Di chuyển
  - Giải trí
  - Lương
  - Thưởng
- Viết route, controller, service, validator cho các module chính.
- Tách logic Prisma query vào service.
- Có middleware auth, validate request và error handler.
- Có chuẩn response JSON nhất quán.
- Có ví dụ request/response cho các endpoint chính.
- Có file .env.example.
- Có hướng dẫn chạy dự án bằng npm scripts.
- Nếu hợp lý, thêm script:
  - dev
  - build
  - start
  - prisma:generate
  - prisma:migrate
  - prisma:seed

### Định dạng response mong muốn
- Thành công:
  - success: true
  - message
  - data
  - meta nếu có pagination

- Thất bại:
  - success: false
  - message
  - errors nếu có validation details

### Kỳ vọng đầu ra từ bạn
- Cây thư mục backend hoàn chỉnh.
- File Prisma schema đầy đủ.
- Mã nguồn chính cho middleware, validators, services, controllers, routes.
- Ví dụ request/response cho:
  - tạo transaction
  - lấy danh sách transaction có filter
  - summary report
  - by-category report
  - monthly-trend report
- Giải thích ngắn các quyết định quan trọng như:
  - vì sao dùng BIGINT
  - vì sao trả amount dạng string
  - cách bảo vệ dữ liệu theo user

---

## Prompt Frontend

Tôi đang làm frontend cho ứng dụng Personal Finance Tracker bằng Next.js 14, App Router, TypeScript và Tailwind CSS.

### Mục tiêu
- Xây dựng giao diện dashboard hiện đại, sạch, responsive.
- Kết nối với backend REST API đã có.
- Code dễ mở rộng, tách component rõ ràng.
- Ưu tiên trải nghiệm người dùng tốt trên mobile và desktop.

### Yêu cầu thư viện
- Next.js 14 với App Router
- TypeScript
- Tailwind CSS
- Recharts
- React Hook Form
- Zod

### Yêu cầu giao diện
- Một trang Dashboard hiển thị:
  - Tổng số dư
  - Tổng thu
  - Tổng chi
- Có bộ lọc theo tháng và năm.
- Có Pie Chart phân tích chi tiêu theo hạng mục.
- Có Bar Chart so sánh thu và chi 6 tháng gần nhất.
- Có bảng danh sách giao dịch gần đây.
- Có nút Thêm mới mở Modal chứa form nhập liệu.
- Giao diện hiện đại, sạch sẽ, dễ nhìn.
- Responsive tốt trên mobile và desktop.
- Có loading state, empty state và error state.

### Yêu cầu dữ liệu và API
- Gọi các API:
  - GET /reports/summary
  - GET /reports/by-category
  - GET /reports/monthly-trend
  - GET /transactions
  - POST /transactions
  - PATCH /transactions/:id
  - DELETE /transactions/:id
  - GET /categories
- Viết API layer bằng fetch hoặc axios.
- Tạo typed functions cho API.
- Backend trả amount dưới dạng string, frontend phải parse và format an toàn.
- Chỉ dùng parse để hiển thị và so sánh đơn giản trong UI, không dùng float cho logic tài chính quan trọng.

### Yêu cầu component
- SummaryCards
  - Hiển thị balance, income, expense
  - Màu sắc rõ ràng
  - Format tiền tệ VND bằng Intl.NumberFormat

- ExpensePieChart
  - Dữ liệu từ by-category report
  - Có tooltip
  - Có legend
  - Màu sắc dễ phân biệt

- IncomeExpenseBarChart
  - Dữ liệu 6 tháng gần nhất
  - Có tooltip
  - Có legend
  - So sánh income và expense theo tháng

- TransactionsTable
  - Hiển thị date, category, type, amount, note
  - Có nút sửa và xóa
  - Có trạng thái rỗng nếu chưa có dữ liệu

- TransactionModal
  - Form gồm:
    - amount
    - type
    - categoryId
    - date
    - note
  - Dùng React Hook Form + Zod
  - Validate dữ liệu rõ ràng
  - Sau khi submit thành công, tự refresh dashboard và danh sách giao dịch

### Cấu trúc thư mục mong muốn
src/
- app/dashboard/page.tsx
- components/dashboard/summary-cards.tsx
- components/dashboard/expense-pie-chart.tsx
- components/dashboard/income-expense-bar-chart.tsx
- components/dashboard/transactions-table.tsx
- components/dashboard/transaction-modal.tsx
- components/ui/modal.tsx
- lib/api.ts
- lib/format.ts
- lib/fetcher.ts
- schemas/transaction.schema.ts
- types/finance.ts
- hooks/use-dashboard-data.ts nếu cần

### Yêu cầu code
- Dùng Server Components cho page shell khi phù hợp.
- Dùng Client Components cho chart, modal và form.
- Tách component rõ ràng, không nhồi mọi thứ vào một page lớn.
- Viết component mẫu hoàn chỉnh để có thể chạy ngay.
- Form transaction dùng React Hook Form và Zod.
- Có ví dụ gọi API bằng fetch hoặc axios.
- Có ví dụ mock data shape nếu cần.
- Có xử lý loading khi đang gọi API.
- Có thông báo lỗi cơ bản nếu gọi API thất bại.
- Có thể dùng state cục bộ hoặc hook riêng để refresh lại dữ liệu sau khi thêm giao dịch.
- Màu sắc nên trực quan:
  - income: xanh
  - expense: đỏ
  - balance: trung tính hoặc nổi bật
- Mobile nên ưu tiên layout 1 cột, desktop có thể chia grid.

### Kỳ vọng đầu ra từ bạn
- Cây thư mục frontend đề xuất.
- Mã mẫu cho:
  - page dashboard
  - summary cards
  - pie chart
  - bar chart
  - transactions table
  - transaction modal
  - schema Zod cho form
  - API client bằng fetch hoặc axios
- Ví dụ cách gọi API thật.
- Giải thích ngắn cách tổ chức state, fetch dữ liệu, refresh lại dashboard sau khi tạo transaction.
- Nếu có thể, thêm gợi ý UI polish như:
  - skeleton loading
  - empty state
  - confirm delete
  - toast thành công hoặc lỗi