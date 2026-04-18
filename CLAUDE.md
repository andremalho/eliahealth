# elia·health

Prontuário eletrônico exclusivo da mulher — plataforma B2B de ginecologia/
obstetrícia com IA clínica. Parte da suíte **elia** ao lado do projeto irmão
`elia·mov` em `../eliamov/` (B2C).

## Stack

- **Backend:** NestJS 11 + TypeORM + PostgreSQL 16 · porta `3000`
- **Frontend:** React 19 + Vite 8 + **Tailwind CSS 4** + TypeScript 5.9 · porta `5173`
- **IA:** Anthropic Claude Sonnet (copiloto clínico, extração de documentos, query natural)
- **Vídeo:** Daily.co (teleconsulta)
- **Email:** Nodemailer (SMTP)
- **WhatsApp:** Meta Business API

## Comandos

```bash
# Docker (recomendado)
docker compose up -d              # db + backend + frontend
docker compose logs -f backend
docker compose down -v            # reset completo

# Local
cd backend && npm run start:dev          # :3000
cd backend && npm run build
cd backend && npx tsc --noEmit           # type check

cd frontend && npm run dev               # :5173
cd frontend && npm run build
cd frontend && npm run test              # Vitest
cd frontend && npm run typecheck
```

## Estrutura

- `backend/src/` — **54 módulos NestJS**, 67 entities, 90 migrations
- `frontend/src/components/ui/` — 15 componentes reutilizáveis
- `frontend/src/data/report-templates.ts` — 17 templates de laudo USG
- `frontend/src/pages/` — 18 páginas

## Variáveis de ambiente

`.env` (na raiz):

```
# DB
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME

# Core
JWT_SECRET
ANTHROPIC_API_KEY              # 11 serviços dependem; sem chave -> HTTP 400 em endpoints de IA

# Portal paciente (dev)
PORTAL_MASTER_OTP=123456

# Telemedicina / comunicação (opcionais)
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
WHATSAPP_ENABLED, WHATSAPP_API_URL, WHATSAPP_ACCESS_TOKEN
DAILY_API_KEY
PUBLIC_APP_URL
```

## Credenciais de dev

Admin seedado automaticamente via migration `1711900006001-SeedAdminUser.ts`:

```
admin@eliahealth.com / Admin@2025
```

OTP master do portal da paciente (dev): `123456` (env `PORTAL_MASTER_OTP`).
Seed adicional: `seed-140-pacientes.sql` na raiz (140 pacientes + 60 gestações + 213 consultas).

## Multi-tenant

3 presets: **consultório**, **UBS**, **hospital**. Cada um ativa módulos diferentes.
Config via `GET/PATCH /tenants/my/config`.

## Roles

`PHYSICIAN`, `ADMIN`, `NURSE`, `RECEPTIONIST`, `PATIENT`, `RESEARCHER`, `SUPERADMIN`.

## API docs

Swagger UI: `http://localhost:3000/api`.

## Correções técnicas já aplicadas (não reverter)

### Migration `chat_messages` collision

`backend/src/migrations/1712000003000-CreateCopilotInsightsAndChat.ts` começa com
`DROP TABLE IF EXISTS "chat_messages" CASCADE` porque colide com a migration anterior
`1711900063000-CreateChatMessages.ts` (dois módulos criam tabelas com o mesmo nome
mas schemas diferentes). O schema **novo** (com `session_id`, `role`, `metadata`)
prevalece porque é o usado por `patient-chat`, `analytics` e `copilot-dashboard`.
O módulo `chat/` (schema legado) quebra em runtime mas não impede o boot.

### Dockerfiles

`backend/Dockerfile` e `frontend/Dockerfile` usam `npm ci --legacy-peer-deps` para
contornar um falso conflict entre `vite@8` e `vite-plugin-pwa@1.2`.

## Integração com elia·mov

Endpoints esperados por `eliamov/backend/src/modules/eliahealth-integration/`:

- `GET /api/patients/:id` — leitura de prontuário
- `POST /api/sync` — sincronização bidirecional

Dependem de LGPD consent do usuário no app B2C.

## Identidade visual

**Sistema canônico:** ver `../eliamov/docs/BRAND.md` (Lunar Bloom) — compartilhado entre os dois projetos da suíte.

**Status (2026-04-17):** ✅ **Fundação Lunar Bloom aplicada.** Zero resíduos hardcoded no código `.tsx/.ts`.

### O que foi aplicado

**Rodada 3.a — Fundação (2026-04-17)**

| Arquivo | Mudança |
|---|---|
| `frontend/index.html` | Fontes Fraunces + Figtree + JetBrains Mono; `theme-color: #14161F`; `<title>` atualizado |
| `frontend/src/index.css` | `@theme` Tailwind com tokens Lunar Bloom completos. **Aliases legados** (`--color-lilac`, `--color-navy`, `--color-primary`) redirecionados — classes `bg-lilac`, `text-navy`, `bg-primary` continuam funcionando e agora renderizam Terracotta/Ink |
| `frontend/src/components/Logo.tsx` | Lockup `elia · health` com prop `product="health" \| "mov"` e variant `dark` \| `light` |
| `frontend/src/pages/auth/LoginPage.tsx` | Split-screen editorial: Ink com aurora Sage+Brass à esquerda (3 stats clínicos), form Parchment à direita. Toda a lógica (login, certificado digital, token Bird ID/VIDaaS/SafeID, TokenLoginModal) preservada intacta |
| `frontend/src/pages/portal/PortalLoginPage.tsx` | Header Ink com aurora terracotta + grain, fluxo de 2 passos (CPF → código OTP) com tipografia editorial |
| `frontend/src/pages/portal/PortalHomePage.tsx` | Header com logo novo, saudação Fraunces, card principal de gestação editorial |
| `frontend/src/pages/dashboard/DashboardPage.tsx` | Header editorial (data em mono, saudação Fraunces italic, CTA "Novo paciente" em caps tracked) |

**Rodada 3.b — Polish (2026-04-17)**

| Arquivo | Mudança |
|---|---|
| `frontend/public/favicon.svg` | Novo: letra "e" Fraunces em quadrado Ink + ponto terracotta signature |
| `frontend/public/manifest.json` | `theme_color` Ink + `background_color` Cream + nome e descrição editoriais |
| `frontend/src/api/research.api.ts` | `INCOME_COLORS` remapeadas de roxos para gradiente Ink → Terracotta (classes A-E) |
| `frontend/src/pages/analytics/AiQueryPanel.tsx` | `CHART_COLORS` Lunar Bloom, barras Ink no chart |
| `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` | Paletas `COLORS` e `WARM` 100% Lunar Bloom; todos `fill` e `stroke` dos charts remapeados |
| `frontend/src/pages/pregnancy/sections/BpSection.tsx` | Chart de PA com sistólica terracotta-deep, diastólica ink, referência brass |

**Auditoria final (zero hexes fora da paleta Lunar Bloom nos `.tsx/.ts`):**
```
✅ #7C5CBF, #0F1F3D, #9B7DD4, #1A2F55     (somente em comentários do index.css)
✅ #6366f1, #8b5cf6, #a78bfa, #c4b5fd      (charts e ícones)
✅ #ddd6fe, #5b21b6, #4f46e5, #818cf8
```

Todas as 16 cores da paleta Lunar Bloom estão em uso (Ink, Ink-2, Terracotta+3 variações, Sage, Brass, Oxide, Cream, Parchment, etc.).

### Por que não precisou varrer todas as páginas

Diferente do `elia·mov` (que usava CSS vanilla com hexes hardcoded), o `elia·health` usa **Tailwind 4 com classes semânticas**. Ao redirecionar os tokens do `@theme` (ex: `--color-lilac: #D97757`), todas as classes espalhadas pelas dezenas de páginas (`bg-lilac`, `text-navy`, `bg-primary`, `hover:bg-primary-dark`) passaram automaticamente a renderizar Lunar Bloom — sem tocar nas páginas.

As páginas não reescritas acima continuam funcionais e já aparecem com a nova paleta por cascata. Qualquer tela com elevação editorial desejada pode ser polida pontualmente no mesmo padrão de Login/Dashboard.

### Regras para novos componentes

- Primário = **Ink** (`#14161F`). Use `bg-primary` ou `bg-navy` (aliases redirecionados) ou hardcode `#14161F`.
- Acento signature = **Terracotta** (`#D97757`). Use `bg-lilac`, `text-lilac` (aliases) ou `bg-accent`.
- Premium clínico = **Brass** (`#C9A977`). Use para insights VIP, alertas FMF alto risco.
- Saúde/calma = **Sage** (`#9CA89A`). Use em success states em vez de verde vivo.
- Alerta grave = **Oxide** (`#8B3A2F`). Use em `text-danger` (alias).
- Headings H1/H2/H3 usam **Fraunces** automaticamente (aplicado em `body h1,h2,h3` no CSS).
- UI body usa **Figtree** automaticamente (aplicado no `body`).
- **Proibido:** reintroduzir `#7C5CBF`, `#0F1F3D`, `#9B7DD4`, Cormorant, DM Sans, Inter.

## Não faça

- ❌ Commitar `.env` com chaves reais
- ❌ Remover o `DROP TABLE IF EXISTS` da migration 1712000003000 sem resolver a colisão de schema
- ❌ Ignorar `--legacy-peer-deps` nos Dockerfiles enquanto `vite-plugin-pwa` não suportar `vite@8`
- ❌ Adotar identidade Lunar Bloom parcialmente (ex: só mudar cor sem trocar fontes) — quebra a consistência visual da suíte
- ❌ Criar arquivos `.md` de documentação sem pedido explícito
