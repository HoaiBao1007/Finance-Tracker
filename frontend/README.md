# Personal Finance Tracker Frontend

Frontend cho ứng dụng Personal Finance Tracker, xây bằng Next.js 14 App Router, TypeScript và Tailwind CSS.

## Trạng thái hiện tại
- Frontend đã được scaffold trong thư mục `frontend/`.
- Route `/` tự động chuyển sang `/dashboard`.
- Đã có dashboard shell với bộ lọc tháng/năm, summary cards, charts, bảng giao dịch và transaction modal.
- Đã có API client, type models, helper format, `.env.example` và auth UI login/register để kết nối backend.
- Dashboard hỗ trợ 2 chế độ: mock mode để dựng UI và live mode để gọi backend thật.
- Tạo, sửa, xóa transaction đã được nối vào backend và refresh lại dashboard ngay sau submit.
- Tạo, sửa, xóa budget theo tháng/năm đang xem đã được nối vào backend ngay trong dashboard.

## Tech stack
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Recharts
- React Hook Form
- Zod
- Fetch API

## Tính năng đã có trong frontend foundation
- Dashboard shell với hero section và filter tháng/năm.
- Summary cards cho balance, income, expense.
- Pie chart chi tiêu theo category.
- Bar chart xu hướng thu/chi 6 tháng.
- Budget section để quản lý ngân sách theo category chi tiêu của kỳ đang xem.
- Budget section hiển thị thêm so sánh `đã chi / hạn mức`, phần còn lại và cảnh báo vượt ngưỡng.
- Transactions table cho giao dịch gần đây.
- Transaction modal dùng React Hook Form + Zod.
- Budget modal dùng React Hook Form + Zod.
- Nút create, edit, delete transaction cùng confirm delete.
- Auth UI trực tiếp trên dashboard để đăng nhập, tạo tài khoản, lưu phiên và bật live mode.
- Dashboard live mode dùng `GET /reports/dashboard` để lấy dữ liệu bundle chỉ trong một request.
- Loading state, empty state và error state ở route dashboard.
- API layer đã sẵn sàng cho auth, categories, transactions, budgets và reports.

## Cấu trúc thư mục hiện tại
```text
frontend/
├── src/
│   ├── app/
│   │   └── dashboard/
│   ├── components/
│   │   ├── dashboard/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── schemas/
│   └── types/
├── .env.example
├── package.json
└── tsconfig.json
```

## Cài dependencies
```bash
npm install
```

## Cấu hình môi trường
Tạo `.env.local` từ `.env.example` và cấu hình backend URL:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api/v1"
```

### Production trên Vercel
- Tạo env production theo mẫu [./.env.production.example](./.env.production.example)
- Bắt buộc phải set:

```env
NEXT_PUBLIC_API_BASE_URL="https://<your-backend-domain>/api/v1"
```

Ghi chú:
- Frontend hiện không truy cập Neon trực tiếp.
- Vercel chỉ cần biết URL backend thật; Prisma và database chỉ nằm ở backend service.
- Checklist triển khai đầy đủ: [../deploy-vercel-neon-checklist.md](../deploy-vercel-neon-checklist.md)

## Cách bật live mode
1. Chạy backend ở `http://localhost:4000`.
2. Mở dashboard frontend.
3. Đăng nhập bằng tài khoản có sẵn hoặc tạo tài khoản mới ngay trong card trạng thái dashboard.
4. Sau khi đăng nhập thành công, frontend sẽ tự lưu `accessToken` vào `localStorage` và chuyển sang live mode.

Lưu ý:
- Token hiện được lưu ở `localStorage` để thuận tiện cho quá trình dev.
- Nếu token không hợp lệ hoặc backend lỗi, dashboard sẽ tự quay về mock mode.

## Chạy frontend

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
npm run lint
```

## Deploy staging
- Stack đề xuất: Vercel cho frontend dashboard.
- Hướng dẫn triển khai đầy đủ: [../deploy-staging.md](../deploy-staging.md)

## API backend mà frontend đã chuẩn bị sẵn
- `GET /reports/summary`
- `GET /reports/by-category`
- `GET /reports/monthly-trend`
- `GET /transactions`
- `POST /transactions`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`
- `GET /categories`
- `POST /categories`
- `GET /budgets`
- `POST /budgets`
- `PATCH /budgets/:id`
- `DELETE /budgets/:id`

## Contract dữ liệu quan trọng
- Các trường tiền như `amount`, `limitAmount`, `totalIncome`, `totalExpense`, `balance` đều là string trong response backend.
- `Budget` trong live mode còn có `spentAmount` và `remainingAmount` để UI hiển thị cảnh báo ngân sách.
- Frontend đã có helper format để hiển thị tiền tệ theo `vi-VN`.
- Các trường ngày giờ được xử lý như UTC ISO string.

## Tài liệu backend liên quan
- Core APIs: [../backend/docs/core-api-examples.md](../backend/docs/core-api-examples.md)
- Report APIs: [../backend/docs/report-api-examples.md](../backend/docs/report-api-examples.md)

## Hướng phát triển tiếp theo
- Bổ sung toast/feedback tốt hơn cho create, update, delete.
- Thực hiện manual test live mode với backend thật và staging.

## Ghi chú
- Backend hiện dùng base URL mặc định `http://localhost:4000/api/v1`.
- Dashboard shell đã có cấu trúc live refresh sẵn nên không cần reload toàn trang sau CRUD transaction.
