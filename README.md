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
