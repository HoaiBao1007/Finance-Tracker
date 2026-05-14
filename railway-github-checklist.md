# Railway GitHub Checklist

## 1. GitHub repo
- Tạo secret `RAILWAY_TOKEN` cho staging project nếu bạn đã có project token.
- Hoặc tạo secret `RAILWAY_API_TOKEN` nếu muốn tái dùng account token từ Railway CLI/login hiện tại.
- Nếu dùng `RAILWAY_API_TOKEN`, tạo thêm variable `RAILWAY_PROJECT_ID` cho project backend.
- Tạo variable `RAILWAY_ENVIRONMENT_ID` cho staging environment.
- Khi production sẵn sàng, tạo thêm secret `RAILWAY_PRODUCTION_TOKEN` hoặc `RAILWAY_PRODUCTION_API_TOKEN`.
- Nếu production dùng `RAILWAY_PRODUCTION_API_TOKEN`, tạo thêm variable `RAILWAY_PRODUCTION_PROJECT_ID`.
- Khi production sẵn sàng, tạo thêm variable `RAILWAY_PRODUCTION_ENVIRONMENT_ID`.

## 2. Railway dashboard
- Nếu frontend đã chuyển sang Vercel, chỉ cần service backend `api` trên Railway.
- Nếu vẫn giữ service `web` cho mục đích khác, đừng chạy workflow với `target=both`.
- Nếu production dùng tên khác `api`, sửa trực tiếp trong `.github/workflows/railway-production.yml`.
- Tắt GitHub autodeploy trên Railway cho các service đã giao cho GitHub Actions.
- Giữ các biến runtime backend như `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `EMAIL_PROVIDER`, `MAIL_FROM_*`, `RESEND_API_KEY` hoặc `SMTP_*` trên Railway service `api`.
- `NEXT_PUBLIC_API_BASE_URL` phải được set trên Vercel, không phải Railway backend.

## 3. Chạy lần đầu
- Với kiến trúc `Vercel + Neon + Railway backend`, chạy workflow Railway với `target=backend`.
- Xác nhận backend health `GET /api/v1/health` lên sau deploy.
- Deploy frontend riêng trên Vercel sau khi backend Railway đã có domain thật.
- Khi đã có production thật, chạy `Railway Production Deploy` thủ công với `target=backend`.

Guide triển khai đầy đủ: [deploy-vercel-neon-railway.md](deploy-vercel-neon-railway.md)