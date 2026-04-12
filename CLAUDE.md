# EliaHealth

Prontuario exclusivo da mulher — plataforma de saude feminina com IA clinica.

## Stack

- **Backend:** NestJS 11 + TypeORM + PostgreSQL 16
- **Frontend:** React 19 + Vite 8 + Tailwind 4 + TypeScript 5.9
- **IA:** Anthropic Claude API (copiloto clinico, extracao de documentos, query natural)
- **Video:** Daily.co (teleconsulta)
- **Email:** Nodemailer (SMTP)
- **WhatsApp:** Meta Business API

## Comandos

```bash
# Backend
cd backend && npm run start:dev      # Dev server (port 3000)
cd backend && npm run build          # Build
cd backend && npx tsc --noEmit       # Type check

# Frontend
cd frontend && npm run dev           # Dev server (port 5173)
cd frontend && npm run build         # Build
cd frontend && npm run test          # Vitest (20 testes)
cd frontend && npm run typecheck     # Type check

# Docker
docker compose up db -d              # Postgres
docker compose up -d                 # Tudo
```

## Estrutura

- `backend/src/` — 54 modulos NestJS, 67 entities
- `frontend/src/components/ui/` — 15 componentes reutilizaveis
- `frontend/src/data/report-templates.ts` — 17 templates de laudo USG
- `frontend/src/pages/` — 18 paginas

## Variaveis de Ambiente

```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
JWT_SECRET
ANTHROPIC_API_KEY
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
WHATSAPP_ENABLED, WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN
DAILY_API_KEY
PORTAL_MASTER_OTP (dev only)
PUBLIC_APP_URL
```

## Multi-tenant

3 presets: consultorio, UBS, hospital. Cada um activa modulos diferentes.
Config via `GET/PATCH /tenants/my/config`.

## Roles

PHYSICIAN, ADMIN, NURSE, RECEPTIONIST, PATIENT, RESEARCHER, SUPERADMIN

## API Docs

Swagger UI: http://localhost:3000/api
