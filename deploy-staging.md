# Staging Deploy Guide

## Stack được chốt
- Backend API: Railway
- PostgreSQL: Railway PostgreSQL
- Frontend dashboard: Railway

## URL staging hiện tại
- Backend: https://api-production-9dae.up.railway.app/api/v1/health
- Frontend healthcheck: https://web-production-f4dc6.up.railway.app/healthz
- Frontend dashboard: https://web-production-f4dc6.up.railway.app/dashboard

## CI/CD với GitHub Actions
- Workflow staging nằm ở `.github/workflows/railway-staging.yml`.
- Workflow production nằm ở `.github/workflows/railway-production.yml` và chỉ chạy thủ công.
- Logic deploy dùng chung nằm ở `.github/workflows/railway-deploy-reusable.yml`.
- Checklist bật CI/CD nhanh nằm ở `railway-github-checklist.md`.
- Workflow staging tự chạy khi push lên `main` hoặc `master` có thay đổi trong `backend/**`, `frontend/**`, hoặc khi bạn bấm `workflow_dispatch` thủ công.
- Backend deploy trực tiếp từ thư mục `backend/`.
- Frontend luôn được đóng gói qua bundle sạch bằng `scripts/prepare-frontend-railway-bundle.sh` để tránh lỗi Railway code snapshot khi deploy monorepo từ root.

### Secrets và variables cần khai báo trên GitHub
```env
RAILWAY_TOKEN="<project token cua Railway staging project>"
RAILWAY_ENVIRONMENT_ID="<environment id cua Railway, vi du 8d376051-7350-40f5-8806-9013f49c6fb3>"
RAILWAY_PRODUCTION_TOKEN="<project token cua Railway production project khi san sang>"
RAILWAY_PRODUCTION_ENVIRONMENT_ID="<environment id cua production khi san sang>"
```

Ghi chú:
- `RAILWAY_TOKEN` nên là project token để quyền CI chỉ gói trong đúng staging project.
- `RAILWAY_PRODUCTION_TOKEN` và `RAILWAY_PRODUCTION_ENVIRONMENT_ID` chỉ cần thêm khi bạn bắt đầu bật production workflow.
- Workflow mặc định deploy vào service `api` và `web`. Nếu bạn đổi tên service trên Railway thì sửa trực tiếp trong workflow staging hoặc production tương ứng.
- Biến runtime như `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL` vẫn nên được quản lý trực tiếp trên Railway service, không chuyển sang GitHub Secrets nếu không cần thiết.
- Nếu bạn bật workflow này, nên tắt Railway GitHub autodeploy cho `api` và `web` để tránh deploy trùng trên cùng một commit.

## Vì sao chọn stack này
- Railway phù hợp cho Node.js API và PostgreSQL, setup ngắn và không cần dựng hạ tầng riêng cho staging.
- Railway cũng chạy ổn với Next.js 14 khi đóng gói bằng Dockerfile, giúp giữ backend và frontend trong cùng một luồng deploy staging.
- Monorepo vẫn có thể deploy tách service theo từng thư mục app.

## Nếu dashboard login bị kẹt

### Railway CLI fallback
Railway CLI hỗ trợ login không cần mở browser automation.

```bash
npm exec --yes --package @railway/cli -- railway login --browserless
npm exec --yes --package @railway/cli -- railway whoami
```

Luồng này sẽ trả về pairing code. Mở URL được in ra trong terminal, nhập code, rồi quay lại terminal để xác nhận đã login thành công.

- Với Railway, có thể dùng `RAILWAY_TOKEN` hoặc `RAILWAY_API_TOKEN` nếu bạn đã tạo token sẵn.

## Thứ tự triển khai khuyến nghị
1. Deploy PostgreSQL trên Railway.
2. Deploy backend từ thư mục `backend/` lên Railway.
3. Kiểm tra `GET /api/v1/health` trên domain backend.
4. Deploy frontend lên Railway, ưu tiên bundle sạch từ `scripts/prepare-frontend-railway-bundle.sh` hoặc `.deploy/frontend-railway`.
5. Đồng bộ `CLIENT_ORIGIN` trên backend theo domain frontend thật.
6. Chạy smoke test staging end-to-end.

## Backend trên Railway

Railway có thể deploy backend này trực tiếp qua `backend/Dockerfile`, nên build path sẽ ổn định hơn giữa local và staging.
Repo hiện cũng đã có `backend/railway.json`, nên Railway sẽ tự nhặt healthcheck và pre-deploy command từ code.

### Service settings
- Root directory: `backend`
- Nếu dùng Dockerfile: không cần khai báo install/build/start command thủ công.
- Nếu không dùng Dockerfile: `npm install`, `npm run build`, `npm run start`.

### Biến môi trường bắt buộc
```env
NODE_ENV="production"
DATABASE_URL="<Railway Postgres connection string>"
JWT_SECRET="<chuoi-bi-mat-it-nhat-32-ky-tu>"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="https://<railway-frontend-domain>"
```

Ghi chú:
- Không cần set `PORT`; Railway sẽ tự cấp và backend hiện đã đọc `process.env.PORT`.
- Nếu đang trong giai đoạn đầu hoặc domain frontend còn đổi, có thể tạm set `CLIENT_ORIGIN="*"`. Khi frontend Railway đã ổn định, nên siết lại về đúng domain thật.

### Lệnh cần chạy sau khi có database
Nếu bạn chưa dùng `backend/railway.json`, chạy một lần trong Railway service shell hoặc CLI:

```bash
npm run db:setup
```

### Kiểm tra sau deploy
- Mở `https://<railway-backend-domain>/api/v1/health`
- Mở `https://<railway-backend-domain>/api/v1/meta/response-format`
- Xác nhận backend trả JSON thành công thay vì lỗi kết nối database.

## Frontend trên Railway

### Service settings
- Builder: Dockerfile
- Deploy path khuyến nghị trong CI/CD: bundle sạch tạo bởi `scripts/prepare-frontend-railway-bundle.sh`
- Nếu deploy thủ công, có thể dùng lại `.deploy/frontend-railway` để tránh lỗi snapshot từ monorepo root

### Biến môi trường bắt buộc
```env
NEXT_PUBLIC_API_BASE_URL="https://<railway-backend-domain>/api/v1"
```

Ghi chú:
- Route dashboard hiện dùng `dynamic = "force-dynamic"`, nên phù hợp với luồng fetch dữ liệu runtime từ backend staging.
- Sau khi backend domain đổi, cần cập nhật lại `NEXT_PUBLIC_API_BASE_URL` trên Railway service `web` và redeploy frontend.

## Đồng bộ CORS giữa hai app
1. Deploy backend trước để lấy URL thật.
2. Set `NEXT_PUBLIC_API_BASE_URL` trên Railway service `web` theo URL backend.
3. Sau khi frontend có URL staging, cập nhật lại `CLIENT_ORIGIN` trên Railway theo domain frontend.
4. Redeploy backend nếu vừa đổi `CLIENT_ORIGIN`.

## Smoke test staging
1. Truy cập frontend staging.
2. Đăng ký tài khoản mới hoặc đăng nhập tài khoản có sẵn.
3. Xác nhận dashboard chuyển sang live mode.
4. Tạo, sửa, xóa một transaction.
5. Tạo, sửa, xóa một budget.
6. Kiểm tra charts, summary cards và transactions table đổi theo dữ liệu thật.
7. Refresh trang để xác nhận session token vẫn hoạt động đúng.

## Việc còn lại để bật CI/CD thật
1. Tạo GitHub secret `RAILWAY_TOKEN` bằng project token của Railway staging project.
2. Tạo GitHub variable `RAILWAY_ENVIRONMENT_ID` theo environment id của staging.
3. Khi production sẵn sàng, tạo thêm `RAILWAY_PRODUCTION_TOKEN` và `RAILWAY_PRODUCTION_ENVIRONMENT_ID`.
4. Tắt Railway GitHub autodeploy cho service `api` và `web` nếu đang bật.
5. Chạy `workflow_dispatch` của `Railway Staging Deploy` một lần với `target=both` để xác nhận pipeline staging.
6. Khi production đã có environment thật, chạy `workflow_dispatch` của `Railway Production Deploy` với `target=both`.