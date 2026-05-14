# Vercel + Neon Deploy Checklist

## Kiến trúc cần chốt
- Frontend `frontend/` deploy lên Vercel.
- Database PostgreSQL dùng Neon.
- Backend `backend/` hiện là Express + Prisma riêng, nên cần deploy trên Railway, Render, Fly.io hoặc Node host khác.
- Nếu muốn toàn bộ đều ở Vercel, cần refactor backend sang Next.js Route Handlers hoặc Server Actions trước.

Guide từng bước: [deploy-vercel-neon-railway.md](deploy-vercel-neon-railway.md)

## Checklist triển khai
- [frontend/.env.production.example](frontend/.env.production.example): mẫu env frontend cho Vercel.

npm run prisma:seed
```

Hoặc dùng script gói gọn:
```bash
cd backend
npm run db:deploy
```

## Biến môi trường bắt buộc

### Backend
```env
NODE_ENV="production"
DATABASE_URL="<Neon pooled connection string>"
DIRECT_URL="<Neon direct connection string>"
JWT_SECRET="<at-least-32-characters>"
JWT_EXPIRES_IN="7d"
CLIENT_ORIGIN="https://<your-vercel-domain>"
EMAIL_PROVIDER="resend"
MAIL_FROM_EMAIL="<verified-sender-email>"
MAIL_FROM_NAME="Finance Tracker"
RESEND_API_KEY="<resend-api-key>"
RESEND_API_BASE_URL="https://api.resend.com"
ALLOW_LOCAL_SMTP="false"
# Optional SMTP fallback when EMAIL_PROVIDER="smtp"
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_SECURE="false"
# SMTP_USER="<smtp username>"
# SMTP_PASS="<smtp password or app password>"
PASSWORD_RESET_OTP_EXPIRES_MINUTES="15"
```

### Frontend trên Vercel
```env
NEXT_PUBLIC_API_BASE_URL="https://<your-backend-domain>/api/v1"
```

## Lỗi hay gặp gây Internal Server Error
- Thiếu `DATABASE_URL` hoặc `JWT_SECRET` nên backend không boot được.
- `NEXT_PUBLIC_API_BASE_URL` vẫn trỏ về `localhost`.
- `CLIENT_ORIGIN` không khớp domain Vercel nên CORS chặn request.
- `EMAIL_PROVIDER=resend` nhưng thiếu `RESEND_API_KEY` hoặc `MAIL_FROM_EMAIL`, hoặc `EMAIL_PROVIDER=smtp` nhưng thiếu `SMTP_HOST`/`SMTP_PORT`.
- Chạy migration bằng pooled URL thay vì `DIRECT_URL`.
- Quên seed category mặc định sau khi tạo database mới.