# Personal Finance Tracker - Frontend Execution Checklist

## Phase 1 - Foundation
- [x] Tạo thư mục `frontend/`.
- [x] Khởi tạo project Next.js 14 App Router + TypeScript.
- [x] Cài Tailwind CSS.
- [x] Cài Recharts.
- [x] Cài React Hook Form.
- [x] Cài Zod.
- [x] Tạo cấu trúc `app`, `components`, `lib`, `schemas`, `types`, `hooks`.
- [x] Tạo file API client.
- [x] Tạo helper format tiền tệ.
- [x] Tạo helper format ngày tháng.
- [x] Tạo layout dashboard cơ bản.

## Phase 2 - API Layer và Types
- [x] Tạo type cho auth response nếu cần.
- [x] Tạo type cho category.
- [x] Tạo type cho transaction.
- [x] Tạo type cho budget nếu cần hiển thị.
- [x] Tạo type cho summary report.
- [x] Tạo type cho by-category report.
- [x] Tạo type cho monthly-trend report.
- [x] Viết function gọi `GET /reports/summary`.
- [x] Viết function gọi `GET /reports/by-category`.
- [x] Viết function gọi `GET /reports/monthly-trend`.
- [x] Viết function gọi `GET /transactions`.
- [x] Viết function gọi `POST /transactions`.
- [x] Viết function gọi `PATCH /transactions/:id`.
- [x] Viết function gọi `DELETE /transactions/:id`.
- [x] Viết function gọi `GET /categories`.

## Phase 3 - Dashboard Shell
- [x] Tạo trang `app/dashboard/page.tsx`.
- [x] Tạo vùng filter tháng và năm.
- [x] Tạo loading state.
- [x] Tạo empty state.
- [x] Tạo error state.
- [x] Tổ chức fetch dữ liệu dashboard theo một flow rõ ràng.

## Phase 4 - Summary Cards
- [x] Tạo component Summary Cards.
- [x] Hiển thị Tổng số dư.
- [x] Hiển thị Tổng thu.
- [x] Hiển thị Tổng chi.
- [x] Format tiền bằng `Intl.NumberFormat`.
- [x] Màu sắc rõ cho balance, income, expense.

## Phase 5 - Charts
- [x] Tạo component Expense Pie Chart.
- [x] Gắn dữ liệu `by-category`.
- [x] Thêm tooltip cho Pie Chart.
- [x] Thêm legend cho Pie Chart.
- [x] Tạo component Income vs Expense Bar Chart.
- [x] Gắn dữ liệu `monthly-trend`.
- [x] Thêm tooltip cho Bar Chart.
- [x] Thêm legend cho Bar Chart.
- [x] Kiểm tra responsive của chart trên mobile.

## Phase 6 - Transactions Table
- [x] Tạo component Transactions Table.
- [x] Hiển thị date.
- [x] Hiển thị category.
- [x] Hiển thị type.
- [x] Hiển thị amount.
- [x] Hiển thị note.
- [x] Tạo nút edit.
- [x] Tạo nút delete.
- [x] Hiển thị empty state khi chưa có transaction.

## Phase 7 - Transaction Modal và Form
- [x] Tạo component modal.
- [x] Tạo form transaction bằng React Hook Form.
- [x] Tạo schema Zod cho form transaction.
- [x] Thêm field amount.
- [x] Thêm field type.
- [x] Thêm field categoryId.
- [x] Thêm field date.
- [x] Thêm field note.
- [x] Validate dữ liệu trước submit.
- [x] Gọi API create transaction.
- [x] Gọi API update transaction.
- [x] Thêm confirm delete trước khi xóa.

## Phase 8 - Tích hợp và refresh data
- [x] Sau create transaction, refresh summary cards.
- [x] Sau create transaction, refresh pie chart.
- [x] Sau create transaction, refresh bar chart nếu cần.
- [x] Sau create transaction, refresh transaction list.
- [x] Sau update transaction, refresh dashboard data.
- [x] Sau delete transaction, refresh dashboard data.
- [x] Đảm bảo UI không cần reload toàn trang.

## Phase 9 - Polish và responsive
- [ ] Kiểm tra layout mobile.
- [ ] Kiểm tra layout desktop.
- [ ] Kiểm tra loading state mượt.
- [ ] Kiểm tra error message dễ hiểu.
- [ ] Kiểm tra empty state rõ ràng.
- [ ] Thêm toast hoặc feedback thành công nếu cần.
- [ ] Kiểm tra filter tháng/năm cập nhật dashboard đúng.

## Definition of Done
- [x] Dashboard page hiển thị đúng dữ liệu thật.
- [x] Summary cards đúng số liệu.
- [x] Pie chart đúng dữ liệu category.
- [x] Bar chart đúng dữ liệu 6 tháng.
- [x] Transactions table hiển thị đúng.
- [x] Modal form create/update chạy ổn định.
- [x] Delete flow chạy ổn định.
- [x] Responsive đạt mức usable trên mobile và desktop.
- [x] Loading, empty, error states đầy đủ.