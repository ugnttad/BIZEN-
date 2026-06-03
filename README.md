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
kpis/
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
GOOGLE_MAPS_API_KEY=...
JWT_SECRET=replace-with-a-long-random-secret
PASSWORD_LOGIN_SECRET=replace-this-login-password
PLATFORM_ADMIN_EMAIL=platform@your-domain.com
PLATFORM_ADMIN_PASSWORD=replace-with-a-strong-platform-password
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5-mini
AWS_REGION=ap-southeast-1
AWS_REKOGNITION_ENABLED=true
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REKOGNITION_COLLECTION_ID=bizen-employees
AWS_REKOGNITION_MIN_SIMILARITY=90
AWS_REKOGNITION_FACE_MIN_CONFIDENCE=90
FACE_ID_ALLOW_DEMO_MODE=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="BIZEN <your-sender@gmail.com>"
```

Leave `VITE_API_URL` empty when frontend and backend are deployed in this same Vercel project. The frontend will call `/api` on the current domain. If the backend is deployed on a separate domain, set `VITE_API_URL` to that full API URL and set `CLIENT_ORIGINS` on the backend to the frontend domain.

For SMTP, keep the real values in `BE/.env` locally, link the project once, then sync them to Vercel:

```bash
npx vercel link
npm run vercel:env:smtp
```

The sync script sends `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM` to Vercel `production` without printing secret values. Redeploy after syncing.

For real store address autocomplete in Settings, create a Google Maps Platform key with Places API enabled, keep `GOOGLE_MAPS_API_KEY` in `BE/.env`, then sync it to Vercel:

```bash
npm run vercel:env:maps
```

The backend proxies Google Places Autocomplete and Place Details requests, so the Maps key is not exposed in the React bundle. Without `GOOGLE_MAPS_API_KEY`, owners can still enter the address manually or use browser GPS.

For the paid AI demo, keep `OPENAI_*` and `AWS_REKOGNITION_*` in `BE/.env`, then sync them to Vercel:

```bash
npm run vercel:env:ai
```

The AI sync script sends OpenAI and AWS Rekognition credentials to Vercel `production`, sets `AWS_REKOGNITION_ENABLED=true`, and keeps `FACE_ID_ALLOW_DEMO_MODE=false` unless overridden in `BE/.env`. Redeploy after syncing.

To verify paid AI providers before a store demo:

```bash
npm run ai:check
```

If the AWS collection has not been created yet, run:

```bash
npm run ai:check -- --create-aws-collection
```

After deploy, verify the backend with:

```text
https://your-vercel-domain.vercel.app/api/health
```

## AI integrations

BIZEN uses OpenAI for realtime assistant responses and structured schedule planning. `POST /api/ai/chat/stream` streams chat tokens to the dashboard, while `POST /api/schedules/ai-suggest` returns a full week schedule proposal with reasons and warnings.

When a company registers, the requested employee count is stored with the tenant request. After Platform Admin approval, BIZEN scales the default department targets and shift required counts from that number, so AI Schedule Suggest starts from the company's real team size instead of the 20-person demo template.

Face ID uses AWS Rekognition for face quality checks, enrollment indexing, and check-in matching. Demo Face ID is disabled by default; set `FACE_ID_ALLOW_DEMO_MODE=true` only for local demos without AWS credentials.

## Shift KPI

Admins can create KPI tasks for a specific employee, date, shift, and deadline. Employees see assigned KPI tasks in the mobile app, mark work in progress, upload photo proof, and submit notes. BIZEN records the submit time, computes on-time/late/missed status, and lets the owner approve or reject the proof.

The working requirement is kept in `docs/kpi-shift-tasks-requirements.md`.

## Location integrations

Store attendance location uses latitude/longitude saved in Settings and enforces the configured geofence radius during check-in. Settings can call Google Places Autocomplete and Place Details through the backend to suggest real map places and fill coordinates automatically.
