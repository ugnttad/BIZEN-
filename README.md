# BIZEN

BIZEN is a SaaS HR, attendance, scheduling, and payroll prototype for SMEs in Da Nang.

## Structure

```text
BE/  Node.js + Express + PostgreSQL/Neon backend
FE/  React + Tailwind SaaS web/mobile prototype
```

Backend code is split by domain under `BE/src/modules`:

```text
attendance/
dashboard/
employees/
leaves/
payroll/
schedules/
settings/
shifts/
notifications/
ai/
```

Frontend API wiring is under `FE/src/modules/api`.

## Environment

Create local env files:

```bash
cp BE/.env.example BE/.env
cp FE/.env.example FE/.env
```

Set `DATABASE_URL` in `BE/.env` to the Neon PostgreSQL connection string.

## Install

```bash
cd BE
npm install

cd ../FE
npm install
```

## Database

```bash
npm run db:migrate --prefix BE
npm run db:seed --prefix BE
```

Run migration again after pulling deploy changes. It creates the database-backed Face ID image table used by Vercel serverless.

## Development

Run backend:

```bash
npm run dev --prefix BE
```

Run frontend:

```bash
npm run dev --prefix FE
```

Default URLs:

```text
Backend:  http://localhost:4000
Frontend: http://localhost:5173
```

## Verification

```bash
npm run build --prefix FE
```

## Vercel deployment

This repo deploys the React app and the Express API together on Vercel.

Set these Vercel environment variables:

```text
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=518331039125-i79o5esjg5v5eiim93rdapvtfp0elk4n.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=518331039125-i79o5esjg5v5eiim93rdapvtfp0elk4n.apps.googleusercontent.com
JWT_SECRET=replace-with-a-long-random-secret
PASSWORD_LOGIN_SECRET=replace-this-login-password
PLATFORM_ADMIN_EMAIL=platform@your-domain.com
PLATFORM_ADMIN_PASSWORD=replace-with-a-strong-platform-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="BIZEN <your-sender@gmail.com>"
```

Leave `VITE_API_URL` empty when frontend and backend are deployed in this same Vercel project. The frontend will call `/api` on the current domain. If the backend is deployed on a separate domain, set `VITE_API_URL` to that full API URL and set `CLIENT_ORIGINS` on the backend to the frontend domain.

After deploy, verify the backend with:

```text
https://your-vercel-domain.vercel.app/api/health
```
