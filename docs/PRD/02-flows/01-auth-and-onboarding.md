# Autenticação e Onboarding do Médico

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** crítica
> **Depende de:** multi-tenant (fluxo 20) para isolamento por tenant e configuração de providers

---

## 1. Propósito

**Problema que resolve:** Médicos brasileiros precisam autenticar em sistemas clínicos de forma compatível com ICP-Brasil (CFM exige assinatura digital para prescrição e prontuário), mas a maioria das soluções obriga o uso de smart card físico ou app desktop antigo. Simultaneamente, a onboarding de um prontuário complexo (8+ módulos) costuma ser traumática — o médico abandona antes de entender o valor.

**Valor entregue:**
- Login em 3 modalidades: senha, certificado digital A1/A3 (via Web PKI) e token temporário de providers cloud (Bird ID, VIDaaS, SafeID, Certisign, Valid).
- Rotação agressiva de refresh tokens com detecção de roubo: se um token revogado é reapresentado, **todos** os tokens do usuário são invalidados.
- Onboarding guiado por tooltip com spotlight — 6 passos no dashboard e 2 passos na consulta — nunca bloqueante.

**Intenção do médico-fundador:** O fundador é obstetra e entende que o gargalo para adoção de EHR no Brasil é o certificado digital (muitos médicos já têm, mas cada sistema integra de jeito diferente). Ao suportar Web PKI + token cloud na mesma tela, elimina a principal objeção. A onboarding curta (max 60s) é porque "médico não lê manual — descobre usando".

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico (PHYSICIAN) | Profissional clínico titular | Acessa `/login`, primeira vez no sistema |
| Administrador (ADMIN) | Admin do tenant | Mesmo login; ganha acesso a config de tenant |
| Enfermeiro/Secretária (NURSE, RECEPTIONIST) | Equipe | Mesmo login; roles limitadas |
| Superadmin (SUPERADMIN) | Suporte interno EliaHealth | Acessa para provisionar tenants |
| Web PKI (Lacuna) | Provider de leitura de certificado no navegador | Detectado via `window.LacunaWebPKI` |

**Pré-condições:**
- Usuário previamente cadastrado (via `POST /auth/register` ou seed de migration).
- Se login por certificado: certificado instalado no browser/smart card.
- Tenant configurado com lista de providers permitidos (`tenant_configs.certificate_providers`, JSONB).

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| email | string (email válido) | formulário | sim |
| password | string (min 8, maiúsc+minúsc+dígito+especial) | formulário | sim para login senha |
| certificate.thumbprint | string (64 hex) | Web PKI | sim para login cert |
| certificate.subject | string (CN=..., max 500) | Web PKI | sim para login cert |
| certificate.issuer | string (max 500) | Web PKI | sim para login cert |
| certificate.notAfter | ISO timestamp | Web PKI | sim para login cert |
| certificate.provider | enum `icp_brasil \| bird_id \| certisign \| valid \| safeid \| vidaas \| other` | Web PKI (inferido do issuer) | sim |
| token | string (max 500) | provider cloud (Bird ID etc.) | sim para login token |
| flowName | string (`doctor_main` \| `copilot_consultation`) | rota/página | sim para onboarding |
| currentStep / completed / skipped | número / bool / bool | ações do usuário no walkthrough | sim |

---

## 4. Fluxo principal (happy path)

1. **Acesso a /login** — `frontend/src/pages/auth/LoginPage.tsx` renderiza dois painéis: branding à esquerda, formulário à direita.
2. **Escolha do método** — usuário vê três opções: e-mail+senha, botão "Entrar com Certificado Digital" (chama Web PKI), link "Entrar com Token" (Bird ID/VIDaaS/SafeID/Certisign/Valid).
3. **Login por senha (A)** — `POST /auth/login` com `{ email, password }`. Backend (`AuthService.login`) busca usuário por email, verifica `isActive`, faz `bcrypt.compare` contra hash (12 rounds).
4. **Login por certificado (B)** — frontend chama `new LacunaWebPKI().listCertificates()`, lê thumbprint/subject/issuer/notAfter, infere `provider` pelo prefixo do issuer (bird/certisign/valid/safeid/vidaas), envia `POST /auth/certificate-login`. Backend valida `notAfter > now()`, busca usuário por `certificateThumbprint` ou por `email`, vincula cert se primeira vez, e emite tokens.
5. **Login por token (C)** — usuário preenche `TokenLoginModal` (provider + email + token). `POST /auth/token-login` salva token em `user.certificateToken` com expiração de 8h (`user.certificateTokenExpiresAt`) e emite JWT.
6. **Geração de tokens** — `AuthService.generateTokens` emite access token (8h) e refresh token (7d), persiste refresh no `refresh_tokens` (com `ipAddress` + `userAgent`), salva hash legacy em `users.refresh_token_hash`, retorna `{ accessToken, refreshToken, role, userId, name }`.
7. **Hidratação do store** — `useAuthStore.login` persiste accessToken em memória + storage; frontend navega para `/dashboard`.
8. **Primeiro login — seed de onboarding** — `OnboardingService.seedForUser` é chamado no registro (cria fila de passos). No dashboard, `useOnboarding` hook busca `GET /doctor-onboarding/progress/doctor_main`; se `completed=false && skipped=false`, inicia walkthrough.
9. **Walkthrough DOCTOR_MAIN_FLOW** — `OnboardingTooltip` renderiza spotlight overlay sobre `#dashboard-header`, `#urgent-actions-bar`, `#copilot-overview-card`, `#pending-summaries-card`, `#patient-attention-card`, e fecha em `#dashboard-header` ("Tudo pronto!"). A cada passo: `PATCH /doctor-onboarding/progress/doctor_main` com `{ currentStep: n }`. Botão "Pular" manda `{ skipped: true }`.
10. **Walkthrough COPILOT_CONSULTATION_FLOW** — disparado na primeira vez que o médico abre uma consulta. 2 passos: painel lateral do copiloto e botão de finalizar.
11. **Refresh automático** — quando access token expira (8h), frontend chama `POST /auth/refresh` com refreshToken. Backend rotaciona: `stored.revokedAt = now()`, emite par novo.
12. **Detecção de roubo** — se refresh token já `revokedAt != null` é reapresentado, backend executa `UPDATE refresh_tokens SET revoked_at=now() WHERE user_id = X` em todos e retorna 401. Usuário é forçado a logar novamente.
13. **Logout** — `POST /auth/logout` revoga todos refresh tokens ativos do usuário e limpa `refresh_token_hash`.
14. **Recuperação de senha (placeholder atual)** — link "Esqueci minha senha" no login; endpoint formal ainda pendente (ver Melhorias).

```
  /login ─┬─► [senha] ──POST /auth/login─────────────┐
          ├─► [Web PKI] ─POST /auth/certificate-login┼─► generateTokens ─► /dashboard
          └─► [token]   ─POST /auth/token-login──────┘         │
                                                               ▼
                                                  onboarding seed + walkthrough
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Email não cadastrado | 401 "Credenciais invalidas" (mensagem genérica, não revela existência) |
| Senha incorreta | Mesma mensagem 401 |
| `isActive=false` | 401 (bloqueio lógico pelo admin) |
| Certificado expirado (`notAfter < now`) | 401 "Certificado digital expirado" |
| Thumbprint não bate e email não existe | 401 "Usuario nao encontrado para este certificado" |
| Usuário logado sem certificado vinculado → primeiro login cert | Backend vincula automaticamente (`certificateThumbprint`, `certificateSubject`, `certificateIssuer`, `certificateExpiresAt`, `certificateRegisteredAt`, `certificateProvider`) |
| Token temporário do provider expira | Campo `certificateTokenExpiresAt` vira passado; próximo token-login sobrescreve |
| Refresh token reutilizado (revogado) | Revoga TODOS refresh do usuário → login forçado |
| Refresh expirado (>7d) | 401 "Refresh token expirado" |
| Rate limit login | `ThrottlerModule` `auth` bucket: 20 req/60s por IP (app.module.ts:87) |
| OTP paciente incorreto 3x | Nota: flow de paciente tem OTP separado (10min, sem limite explícito — GAP) |
| Onboarding interrompido | `currentStep` persiste; usuário retoma no mesmo passo ao relogar |
| Onboarding já completo | Hook detecta `completed=true`, não renderiza tooltip; opção "rever tour" via `POST /doctor-onboarding/restart/:flowName` |
| Lacuna Web PKI não instalado | Dev fallback: `window.prompt` de email e cert fake (só em dev) |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Senha: bcrypt 12 rounds | `auth.service.ts:23` `SALT_ROUNDS=12` |
| RB-02 | Regex senha: min 8 caracteres, maiúscula + minúscula + dígito + especial | `auth.service.ts:30` `PASSWORD_REGEX` |
| RB-03 | Histórico de senhas: nova senha não pode igualar as últimas 5 | `auth.service.ts:27,316-331` `PASSWORD_HISTORY_LIMIT=5` |
| RB-04 | Expiração de senha: 90 dias (constante, não forçada hoje) | `auth.service.ts:28` `PASSWORD_EXPIRY_DAYS=90` |
| RB-05 | Access token: 8h para médico; 30d para paciente (OTP) | `auth.service.ts:24,26` |
| RB-06 | Refresh token: 7d com rotação obrigatória a cada uso | `auth.service.ts:25,150-154` |
| RB-07 | Token theft detection: refresh revogado reapresentado → revoga todos | `auth.service.ts:131-139` |
| RB-08 | Providers aceitos: `icp_brasil`, `bird_id`, `certisign`, `valid`, `safeid`, `vidaas`, `other` | `auth.enums.ts:11-19` |
| RB-09 | Validade default de certificado aceita: 365 dias (admin pode editar) | `tenant-config.entity.ts:45` `certificateValidityDays=365` |
| RB-10 | Certificado expirado rejeitado no login | `auth.service.ts:212-215` |
| RB-11 | Token temporário de provider expira em 8h (`certificateTokenExpiresAt`) | `auth.service.ts:262` |
| RB-12 | Social login (Google, Facebook) **proibido** por política de LGPD/CFM | `prompt-memorando-projeto.md:214` |
| RB-13 | Mensagem de erro em login deve ser genérica (não revelar se email existe) | `auth.service.ts:74,79` "Credenciais invalidas" |
| RB-14 | Rate limit: bucket `auth` 20 req/min; bucket `default` 100 req/min | `app.module.ts:85-88` |
| RB-15 | OTP paciente (WhatsApp): 6 dígitos numéricos, expira 10min, single-use | `phone-verification.service.ts:17-20,26-34` |
| RB-16 | OTP master em dev: `PORTAL_MASTER_OTP=123456` | `.env`/CLAUDE.md |
| RB-17 | Onboarding unique por (user_id, flow_name) | `doctor-onboarding.service.ts:13,23` |
| RB-18 | Onboarding não bloqueia uso — "Pular" sempre disponível | `onboarding-steps.ts` + UX do `OnboardingTooltip` |
| RB-19 | Flows suportados: `doctor_main` (6 passos), `copilot_consultation` (2 passos) | `onboarding-steps.ts:9,54` |
| RB-20 | Vinculação automática de certificado no primeiro login por email | `auth.service.ts:231-239` |
| RB-21 | Helmet habilitado (CSP básica via defaults) | `main.ts:20` |
| RB-22 | CORS restrito a lista em `CORS_ORIGINS` | `main.ts:23-30` |
| RB-23 | Role default em registro: `PHYSICIAN` | `user.entity.ts:24` |

---

## 7. Saídas e efeitos

- **Cria/altera:**
  - `users.refresh_token_hash`, certificado (thumbprint/subject/issuer/expiresAt/registeredAt/provider/token/tokenExpiresAt).
  - `refresh_tokens` (uma linha por emissão; `revokedAt` preenchido em rotação/logout).
  - `password_history` (uma linha por registro/troca).
  - `onboarding_progress` (uma linha por `userId+flowName`).
- **Notificações disparadas:** nenhuma no login bem-sucedido; tentativa de recuperação de senha dispararia email (fluxo pendente).
- **Integrações acionadas:** Lacuna Web PKI no browser; providers ICP-Brasil (Bird ID, VIDaaS etc.) são responsáveis por emitir o token que o frontend só recebe/repassa.
- **Eventos emitidos:** nenhum WS aqui; audit interceptor registra login em `audit_logs` (via `AuditModule`).

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| Lacuna Web PKI | Login cert A1/A3 | listCertificates → readCertificate(thumbprint) | Sim: fallback `window.prompt` em dev, mensagem "nao instalado" em prod |
| Bird ID / VIDaaS / SafeID / Certisign / Valid | Login por token | Token gerado no app/desktop do provider, colado pelo médico | Se email não existe → 401 |
| WhatsApp Meta API | OTP de paciente (não é médico) | `send template otp_verification` com `{ code }` | Flag `WHATSAPP_ENABLED=false` cai em log |
| SMTP | Futuro: recovery email | — | — |

---

## 9. Critérios de aceitação

- [ ] Dado médico com senha válida quando faz `POST /auth/login` então recebe `accessToken` (exp 8h) + `refreshToken` (exp 7d) + `role`.
- [ ] Dado refresh token válido quando chama `/auth/refresh` então recebe par novo E o anterior é marcado `revokedAt`.
- [ ] Dado refresh token revogado reapresentado então 401 E todos os refresh do usuário viram revogados.
- [ ] Dado certificado com `notAfter` no passado então `/auth/certificate-login` retorna 401.
- [ ] Dado usuário sem certificado vinculado e cert válido com email match então certificado é auto-vinculado.
- [ ] Dado senha nova igual a uma das últimas 5 então troca é rejeitada com 400.
- [ ] Dado primeiro login do médico então walkthrough `doctor_main` abre automaticamente no dashboard.
- [ ] Dado médico clica "Pular" em qualquer passo então `skipped=true` e walkthrough não reaparece.
- [ ] Dado 21 tentativas de login em 60s do mesmo IP então 429 Too Many Requests.

---

## 10. Métricas de sucesso

- **Taxa de ativação de certificado digital:** % de médicos com `certificateThumbprint IS NOT NULL` após 14d de uso. Meta: 60%.
- **Tempo até primeiro login com cert:** mediana em horas após registro. Meta: <48h.
- **Taxa de conclusão do walkthrough:** `onboarding_progress WHERE completed=true / total`. Meta: 70%.
- **Taxa de skip:** `skipped=true / total`. Aceitável até 20%.
- **Eventos de theft detection:** count. Meta: 0; cada caso deve ser investigado.
- **Taxa de refresh bem-sucedido:** % de refresh calls que não retornam 401. Meta: >99%.

---

## 11. Melhorias recomendadas na migração

- **Recuperação de senha está só no UI, sem endpoint backend.** Implementar `POST /auth/forgot-password` → email com token de 1h de uso único; `POST /auth/reset-password` com revalidação da força e do histórico.
- **Mensagens de erro de certificado pouco acionáveis.** Substituir "Usuario nao encontrado para este certificado" por fluxo de self-service: "Seu certificado não está vinculado — deseja vincular ao e-mail X?" (com confirmação por token enviado ao email).
- **Onboarding tooltip bloqueia a tela.** O overlay com spotlight é aversivo para quem já é power-user. Recomenda-se **substituir por checklist lateral persistente** tipo Linear/Stripe: itens "Configurar agenda", "Convidar equipe", "Abrir primeira consulta" que desaparecem quando completados, sem overlay.
- **OTP in-memory (Map) não escala.** `PhoneVerificationService` usa `Map` — perde em restart e não funciona em >1 instância. Migrar para Redis com TTL nativo.
- **Sem MFA para médicos sem certificado.** Login com apenas senha (sem cert) deveria exigir TOTP para cumprir boas práticas CFM/LGPD. Adicionar `users.totp_secret` e fluxo de enrollment.
- **Provider detection frágil.** O pattern-match no issuer (`includes('bird')`) é frágil; providers mudam strings. Recomenda-se tabela de mapeamento versionada + validação por OID do certificado (CPF no campo `otherName`).
- **Refresh token em claim JWT + tabela duplica estado.** Simplificar: refresh token como opaque random (32 bytes) salvo só em DB. JWT apenas para access token.
- **Token theft não notifica usuário.** Quando todos os tokens são revogados, deveria disparar email "Detectamos possível uso indevido — relogue e troque a senha".
- **Audit log de login ausente na tela.** Adicionar `/settings/security` com lista de sessões (derivada de `refresh_tokens` ainda ativos com `ipAddress`+`userAgent`) e botão "revogar".
- **Onboarding hard-coded no frontend.** `DOCTOR_MAIN_FLOW` está no bundle. Mover para tabela `onboarding_flows` editável, permitindo que admin do tenant customize mensagens/ordem.
- **Sem registro diferenciado por role.** Atualmente `POST /auth/register` sempre cria PHYSICIAN. Convite por email com role pré-definida (ver fluxo 20) deve ser a porta de entrada padrão; registro self-service apenas para trial.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/auth/auth.service.ts` (369 linhas — toda a lógica de tokens, PKI, password history)
  - `backend/src/auth/auth.controller.ts` (125 linhas — endpoints REST)
  - `backend/src/auth/auth.enums.ts` (UserRole, CertificateProvider)
  - `backend/src/auth/user.entity.ts` (fields de certificado em users)
  - `backend/src/auth/refresh-token.entity.ts`
  - `backend/src/auth/password-history.entity.ts`
  - `backend/src/auth/guards/` (JwtAuthGuard, RolesGuard, TenantGuard)
  - `backend/src/auth/strategies/jwt.strategy.ts`
  - `backend/src/doctor-onboarding/doctor-onboarding.service.ts`
  - `backend/src/doctor-onboarding/doctor-onboarding.controller.ts`
  - `backend/src/doctor-onboarding/entities/onboarding-progress.entity.ts`
  - `backend/src/shared/whatsapp/phone-verification.service.ts` (OTP)
  - `backend/src/app.module.ts:85-88` (ThrottlerModule)
  - `backend/src/main.ts` (Helmet, CORS)
- Frontend:
  - `frontend/src/pages/auth/LoginPage.tsx` (385 linhas — 3 métodos de login, Web PKI, token modal)
  - `frontend/src/pages/auth/RegisterPage.tsx`
  - `frontend/src/components/onboarding/onboarding-steps.ts` (2 flows hard-coded)
  - `frontend/src/components/onboarding/OnboardingTooltip.tsx`
  - `frontend/src/components/onboarding/useOnboarding.ts`
  - `frontend/src/store/auth.store.ts` (zustand)
  - `frontend/src/api/client.ts` (axios + interceptor refresh)
- Migrations: procurar por `AddCertificateFields`, `AddRefreshTokens`, `AddPasswordHistory`, `AddOnboardingProgress` em `backend/src/migrations/`.
