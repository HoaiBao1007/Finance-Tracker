# Report API Examples

## Mục đích
- Tài liệu này mô tả ví dụ request và response cho 4 endpoint reports dùng bởi dashboard frontend.
- Tất cả trường tiền tệ như `totalIncome`, `totalExpense`, `balance`, `amount` đều trả về dạng string để tránh sai số số thực.

## Base URL
```text
http://localhost:4000/api/v1
```

## Authentication
- Tất cả endpoint trong tài liệu này yêu cầu header:

```http
Authorization: Bearer <access_token>
```

## 1. Summary Report

### Endpoint
```http
GET /reports/summary
```

### Query hỗ trợ
- `month`: số tháng từ `1` đến `12`
- `year`: năm, ví dụ `2026`
- `from`: ngày bắt đầu, hỗ trợ `YYYY-MM-DD` hoặc ISO datetime
- `to`: ngày kết thúc, hỗ trợ `YYYY-MM-DD` hoặc ISO datetime

Lưu ý:
- Dùng `month` và `year` cùng nhau.
- Hoặc dùng `from` và `to`.
- Không dùng đồng thời `month/year` với `from/to`.

### Request mẫu
```http
GET /api/v1/reports/summary?month=5&year=2026 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

### Response mẫu
```json
{
  "success": true,
  "message": "Summary report fetched successfully",
  "data": {
    "period": {
      "from": "2026-05-01T00:00:00.000Z",
      "to": "2026-05-31T23:59:59.999Z"
    },
    "totalIncome": "5000000",
    "totalExpense": "1250000",
    "balance": "3750000"
  }
}
```

### Dùng cho frontend
- Summary cards: Tổng số dư, Tổng thu, Tổng chi.

## 2. Expense By Category Report

### Endpoint
```http
GET /reports/by-category
```

### Query hỗ trợ
- `month`
- `year`
- `from`
- `to`

Quy tắc filter giống `summary`.

### Request mẫu
```http
GET /api/v1/reports/by-category?month=5&year=2026 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

### Response mẫu
```json
{
  "success": true,
  "message": "Category expense report fetched successfully",
  "data": {
    "period": {
      "from": "2026-05-01T00:00:00.000Z",
      "to": "2026-05-31T23:59:59.999Z"
    },
    "totalExpense": "1250000",
    "categories": [
      {
        "categoryId": "cmexamplebills123",
        "categoryName": "Hóa đơn",
        "amount": "1250000"
      }
    ]
  }
}
```

### Dùng cho frontend
- Pie chart phân tích chi tiêu theo hạng mục.
- Có thể map trực tiếp `categoryName` và `amount` sang chart data.

## 3. Monthly Trend Report

### Endpoint
```http
GET /reports/monthly-trend
```

### Query hỗ trợ
- `months`: số tháng muốn lấy, mặc định `6`
- `month`: tháng neo cuối kỳ
- `year`: năm neo cuối kỳ

Lưu ý:
- Nếu truyền `month` thì phải truyền `year`.
- Nếu không truyền `month/year`, endpoint sẽ lấy neo theo tháng hiện tại của hệ thống.

### Request mẫu
```http
GET /api/v1/reports/monthly-trend?months=2&month=5&year=2026 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

### Response mẫu
```json
{
  "success": true,
  "message": "Monthly trend report fetched successfully",
  "data": {
    "period": {
      "from": "2026-04-01T00:00:00.000Z",
      "to": "2026-05-31T23:59:59.999Z"
    },
    "months": [
      {
        "key": "2026-04",
        "label": "2026-04",
        "year": 2026,
        "month": 4,
        "income": "500000",
        "expense": "400000",
        "balance": "100000"
      },
      {
        "key": "2026-05",
        "label": "2026-05",
        "year": 2026,
        "month": 5,
        "income": "5000000",
        "expense": "1250000",
        "balance": "3750000"
      }
    ]
  }
}
```

### Dùng cho frontend
- Bar chart so sánh thu và chi theo từng tháng.
- Có thể dùng trực tiếp `label`, `income`, `expense`.

## 4. Dashboard Bundle Report

### Endpoint
```http
GET /reports/dashboard
```

### Query hỗ trợ
- `month`: tháng neo hiện tại của dashboard
- `year`: năm neo hiện tại của dashboard
- `months`: số tháng muốn lấy cho biểu đồ xu hướng, mặc định `6`

Lưu ý:
- Nếu truyền `month` thì phải truyền `year`.
- Endpoint này gom các phần dữ liệu cần cho dashboard vào một response duy nhất: user hiện tại, categories, summary, by-category, monthly-trend, budgets và recent transactions.

### Request mẫu
```http
GET /api/v1/reports/dashboard?month=5&year=2026&months=6 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

### Response mẫu
```json
{
  "success": true,
  "message": "Dashboard bundle fetched successfully",
  "data": {
    "currentUser": {
      "id": "cmexampleuser123",
      "email": "demo.frontend@example.com",
      "fullName": "Demo Frontend",
      "createdAt": "2026-05-01T09:00:00.000Z",
      "updatedAt": "2026-05-01T09:00:00.000Z"
    },
    "categories": [
      {
        "id": "cmexamplefood123",
        "userId": null,
        "name": "Ăn uống",
        "type": "expense",
        "isDefault": true,
        "createdAt": "2026-05-01T09:00:00.000Z",
        "updatedAt": "2026-05-01T09:00:00.000Z"
      }
    ],
    "snapshot": {
      "filters": {
        "month": 5,
        "year": 2026
      },
      "source": "api",
      "summary": {
        "period": {
          "from": "2026-05-01T00:00:00.000Z",
          "to": "2026-05-31T23:59:59.999Z"
        },
        "totalIncome": "5000000",
        "totalExpense": "1250000",
        "balance": "3750000"
      },
      "expenseByCategory": {
        "period": {
          "from": "2026-05-01T00:00:00.000Z",
          "to": "2026-05-31T23:59:59.999Z"
        },
        "totalExpense": "1250000",
        "categories": [
          {
            "categoryId": "cmexamplefood123",
            "categoryName": "Ăn uống",
            "amount": "1250000"
          }
        ]
      },
      "monthlyTrend": {
        "period": {
          "from": "2025-12-01T00:00:00.000Z",
          "to": "2026-05-31T23:59:59.999Z"
        },
        "months": [
          {
            "key": "2026-05",
            "label": "2026-05",
            "year": 2026,
            "month": 5,
            "income": "5000000",
            "expense": "1250000",
            "balance": "3750000"
          }
        ]
      },
      "budgets": [
        {
          "id": "cmexamplebudget123",
          "userId": "cmexampleuser123",
          "categoryId": "cmexamplefood123",
          "limitAmount": "2500000",
          "spentAmount": "1250000",
          "remainingAmount": "1250000",
          "month": 5,
          "year": 2026,
          "createdAt": "2026-05-01T09:00:00.000Z",
          "updatedAt": "2026-05-03T09:00:00.000Z",
          "category": {
            "id": "cmexamplefood123",
            "name": "Ăn uống",
            "type": "expense",
            "isDefault": true
          }
        }
      ],
      "recentTransactions": [
        {
          "id": "cmexampletxn123",
          "userId": "cmexampleuser123",
          "categoryId": "cmexamplefood123",
          "amount": "1250000",
          "type": "expense",
          "date": "2026-05-02T07:00:00.000Z",
          "note": "Ăn ngoài cuối tuần",
          "createdAt": "2026-05-02T07:00:00.000Z",
          "updatedAt": "2026-05-02T07:00:00.000Z",
          "category": {
            "id": "cmexamplefood123",
            "name": "Ăn uống",
            "type": "expense",
            "isDefault": true
          }
        }
      ]
    }
  }
}
```

### Dùng cho frontend
- Dashboard live mode có thể lấy toàn bộ dữ liệu cần thiết chỉ bằng một request.
- Giảm số lần gọi đồng thời từ frontend trong lúc khởi tạo dashboard.
- Budget section có thể hiển thị trực tiếp `spentAmount` và `remainingAmount` để tính trạng thái vượt mức.

## Gợi ý mapping cho frontend

### Dashboard bundle
```ts
const bundle = response.data;

setCurrentUser(bundle.currentUser);
setCategories(bundle.categories);
setDashboardData(bundle.snapshot);
```

### Summary cards
```ts
const summary = response.data;

const cards = [
  { label: "Tong so du", value: summary.balance },
  { label: "Tong thu", value: summary.totalIncome },
  { label: "Tong chi", value: summary.totalExpense },
];
```

### Pie chart
```ts
const pieData = response.data.categories.map((item) => ({
  name: item.categoryName,
  value: Number(item.amount),
}));
```

### Bar chart
```ts
const barData = response.data.months.map((item) => ({
  label: item.label,
  income: Number(item.income),
  expense: Number(item.expense),
}));
```

## Ghi chú contract
- Backend trả tiền dưới dạng string, frontend chỉ nên convert sang number để hiển thị chart nếu giá trị vẫn nằm trong phạm vi an toàn.
- Nếu cần xử lý tài chính chính xác ở frontend, nên giữ nguyên string hoặc dùng thư viện decimal/bigint-safe.
- `period.from` và `period.to` luôn là UTC ISO string.