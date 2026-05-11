# Core API Examples

## Mục đích
- Tài liệu này mô tả ví dụ request và response cho các nhóm API: auth, category, transaction và budget.
- Dùng cùng với [Report API Examples](./report-api-examples.md) để có bộ backend docs đầy đủ hơn.

## Base URL
```text
http://localhost:4000/api/v1
```

## Chuẩn response chung

### Thành công
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {},
  "meta": {}
}
```

### Thất bại
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

## Authentication
- Mọi endpoint trừ `POST /auth/register` và `POST /auth/login` đều yêu cầu:

```http
Authorization: Bearer <access_token>
```

## 1. Auth APIs

### 1.1 Register

#### Endpoint
```http
POST /auth/register
```

#### Request mẫu
```json
{
  "email": "alice@example.com",
  "password": "Password123",
  "fullName": "Alice Nguyen"
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Register successful",
  "data": {
    "user": {
      "id": "cmexampleuser123",
      "email": "alice@example.com",
      "fullName": "Alice Nguyen"
    },
    "accessToken": "<jwt_token>"
  }
}
```

### 1.2 Login

#### Endpoint
```http
POST /auth/login
```

#### Request mẫu
```json
{
  "email": "alice@example.com",
  "password": "Password123"
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "cmexampleuser123",
      "email": "alice@example.com",
      "fullName": "Alice Nguyen"
    },
    "accessToken": "<jwt_token>"
  }
}
```

### 1.3 Get Current User

#### Endpoint
```http
GET /auth/me
```

#### Request mẫu
```http
GET /api/v1/auth/me HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "id": "cmexampleuser123",
    "email": "alice@example.com",
    "fullName": "Alice Nguyen",
    "createdAt": "2026-05-08T10:00:00.000Z",
    "updatedAt": "2026-05-08T10:00:00.000Z"
  }
}
```

## 2. Category APIs

### 2.1 List Categories

#### Endpoint
```http
GET /categories
```

#### Query hỗ trợ
- `type`: `income` hoặc `expense`

#### Request mẫu
```http
GET /api/v1/categories?type=expense HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [
    {
      "id": "cmdefaultfood123",
      "userId": null,
      "name": "Ăn uống",
      "type": "expense",
      "isDefault": true,
      "createdAt": "2026-05-08T09:00:00.000Z",
      "updatedAt": "2026-05-08T09:00:00.000Z"
    },
    {
      "id": "cmusercategory123",
      "userId": "cmexampleuser123",
      "name": "Cafe cá nhân",
      "type": "expense",
      "isDefault": false,
      "createdAt": "2026-05-08T10:30:00.000Z",
      "updatedAt": "2026-05-08T10:30:00.000Z"
    }
  ]
}
```

### 2.2 Create Category

#### Endpoint
```http
POST /categories
```

#### Request mẫu
```json
{
  "name": "Cafe cá nhân",
  "type": "expense"
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "cmusercategory123",
    "userId": "cmexampleuser123",
    "name": "Cafe cá nhân",
    "type": "expense",
    "isDefault": false,
    "createdAt": "2026-05-08T10:30:00.000Z",
    "updatedAt": "2026-05-08T10:30:00.000Z"
  }
}
```

## 3. Transaction APIs

### 3.1 Create Transaction

#### Endpoint
```http
POST /transactions
```

#### Request mẫu
```json
{
  "categoryId": "cmusercategory123",
  "amount": "150000",
  "type": "expense",
  "date": "2026-05-08T09:00:00.000Z",
  "note": "Morning coffee"
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "cmtransaction123",
    "userId": "cmexampleuser123",
    "categoryId": "cmusercategory123",
    "amount": "150000",
    "type": "expense",
    "date": "2026-05-08T09:00:00.000Z",
    "note": "Morning coffee",
    "createdAt": "2026-05-08T10:35:00.000Z",
    "updatedAt": "2026-05-08T10:35:00.000Z",
    "category": {
      "id": "cmusercategory123",
      "name": "Cafe cá nhân",
      "type": "expense",
      "isDefault": false
    }
  }
}
```

### 3.2 List Transactions

#### Endpoint
```http
GET /transactions
```

#### Query hỗ trợ
- `month`, `year`
- `from`, `to`
- `categoryId`
- `type`
- `page`
- `limit`

Lưu ý:
- Dùng `month` và `year` cùng nhau.
- Hoặc dùng `from` và `to`.
- Không dùng đồng thời `month/year` với `from/to`.

#### Request mẫu
```http
GET /api/v1/transactions?month=5&year=2026&page=1&limit=10&type=expense HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Transactions fetched successfully",
  "data": [
    {
      "id": "cmtransaction123",
      "userId": "cmexampleuser123",
      "categoryId": "cmusercategory123",
      "amount": "150000",
      "type": "expense",
      "date": "2026-05-08T09:00:00.000Z",
      "note": "Morning coffee",
      "createdAt": "2026-05-08T10:35:00.000Z",
      "updatedAt": "2026-05-08T10:35:00.000Z",
      "category": {
        "id": "cmusercategory123",
        "name": "Cafe cá nhân",
        "type": "expense",
        "isDefault": false
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3.3 Get Transaction By Id

#### Endpoint
```http
GET /transactions/:id
```

#### Request mẫu
```http
GET /api/v1/transactions/cmtransaction123 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Transaction fetched successfully",
  "data": {
    "id": "cmtransaction123",
    "userId": "cmexampleuser123",
    "categoryId": "cmusercategory123",
    "amount": "150000",
    "type": "expense",
    "date": "2026-05-08T09:00:00.000Z",
    "note": "Morning coffee",
    "createdAt": "2026-05-08T10:35:00.000Z",
    "updatedAt": "2026-05-08T10:35:00.000Z",
    "category": {
      "id": "cmusercategory123",
      "name": "Cafe cá nhân",
      "type": "expense",
      "isDefault": false
    }
  }
}
```

### 3.4 Update Transaction

#### Endpoint
```http
PATCH /transactions/:id
```

#### Request mẫu
```json
{
  "amount": "180000",
  "note": "Morning coffee and snack"
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Transaction updated successfully",
  "data": {
    "id": "cmtransaction123",
    "userId": "cmexampleuser123",
    "categoryId": "cmusercategory123",
    "amount": "180000",
    "type": "expense",
    "date": "2026-05-08T09:00:00.000Z",
    "note": "Morning coffee and snack",
    "createdAt": "2026-05-08T10:35:00.000Z",
    "updatedAt": "2026-05-08T10:45:00.000Z",
    "category": {
      "id": "cmusercategory123",
      "name": "Cafe cá nhân",
      "type": "expense",
      "isDefault": false
    }
  }
}
```

### 3.5 Delete Transaction

#### Endpoint
```http
DELETE /transactions/:id
```

#### Request mẫu
```http
DELETE /api/v1/transactions/cmtransaction123 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": {
    "id": "cmtransaction123"
  }
}
```

## 4. Budget APIs

### 4.1 Create Budget

#### Endpoint
```http
POST /budgets
```

#### Request mẫu
```json
{
  "categoryId": "cmdefaultbills123",
  "limitAmount": "3000000",
  "month": 5,
  "year": 2026
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "id": "cmbudget123",
    "userId": "cmexampleuser123",
    "categoryId": "cmdefaultbills123",
    "limitAmount": "3000000",
    "spentAmount": "1250000",
    "remainingAmount": "1750000",
    "month": 5,
    "year": 2026,
    "createdAt": "2026-05-08T11:00:00.000Z",
    "updatedAt": "2026-05-08T11:00:00.000Z",
    "category": {
      "id": "cmdefaultbills123",
      "name": "Hóa đơn",
      "type": "expense",
      "isDefault": true
    }
  }
}
```

### 4.2 List Budgets

#### Endpoint
```http
GET /budgets
```

#### Query hỗ trợ
- `month`
- `year`

Nếu truyền `month` thì phải truyền `year`.

#### Request mẫu
```http
GET /api/v1/budgets?month=5&year=2026 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Budgets fetched successfully",
  "data": [
    {
      "id": "cmbudget123",
      "userId": "cmexampleuser123",
      "categoryId": "cmdefaultbills123",
      "limitAmount": "3000000",
      "spentAmount": "1250000",
      "remainingAmount": "1750000",
      "month": 5,
      "year": 2026,
      "createdAt": "2026-05-08T11:00:00.000Z",
      "updatedAt": "2026-05-08T11:00:00.000Z",
      "category": {
        "id": "cmdefaultbills123",
        "name": "Hóa đơn",
        "type": "expense",
        "isDefault": true
      }
    }
  ]
}
```

### 4.3 Update Budget

#### Endpoint
```http
PATCH /budgets/:id
```

#### Request mẫu
```json
{
  "limitAmount": "3500000"
}
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Budget updated successfully",
  "data": {
    "id": "cmbudget123",
    "userId": "cmexampleuser123",
    "categoryId": "cmdefaultbills123",
    "limitAmount": "3500000",
    "spentAmount": "1250000",
    "remainingAmount": "2250000",
    "month": 5,
    "year": 2026,
    "createdAt": "2026-05-08T11:00:00.000Z",
    "updatedAt": "2026-05-08T11:10:00.000Z",
    "category": {
      "id": "cmdefaultbills123",
      "name": "Hóa đơn",
      "type": "expense",
      "isDefault": true
    }
  }
}
```

### 4.4 Delete Budget

#### Endpoint
```http
DELETE /budgets/:id
```

#### Request mẫu
```http
DELETE /api/v1/budgets/cmbudget123 HTTP/1.1
Host: localhost:4000
Authorization: Bearer <access_token>
```

#### Response mẫu
```json
{
  "success": true,
  "message": "Budget deleted successfully",
  "data": {
    "id": "cmbudget123"
  }
}
```

## Ghi chú quan trọng
- `amount` và `limitAmount` luôn là string trong response.
- `Budget` còn trả thêm `spentAmount` và `remainingAmount` để frontend hiển thị so sánh đã chi so với hạn mức.
- `Transaction` và `Budget` đều trả thêm object `category` để frontend hiển thị trực tiếp.
- `Category` có thể là category mặc định của hệ thống (`isDefault: true`, `userId: null`) hoặc category cá nhân của user.
- `Budget` chỉ áp dụng cho category có `type = expense`.
- `GET /transactions` trả mảng dữ liệu trong `data` và pagination trong `meta`.
- Các endpoint `GET /categories`, `GET /transactions`, `GET /budgets` chỉ trả dữ liệu user hiện tại được phép truy cập.

## Tài liệu liên quan
- [Report API Examples](./report-api-examples.md)