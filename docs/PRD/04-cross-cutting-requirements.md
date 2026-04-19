# Requisitos Não-Funcionais Transversais

> Requisitos que atravessam TODOS os fluxos do EliaHealth e que o produto-sucessor deve implementar desde o dia zero. Organizados por tema, com: **o que é**, **onde está hoje**, **regra específica** e **como tratar na migração**.

---

## Índice

1. [LGPD e privacidade](#1-lgpd-e-privacidade)
2. [Auditoria](#2-auditoria)
3. [Multi-tenancy](#3-multi-tenancy)
4. [RBAC e controle de acesso](#4-rbac-e-controle-de-acesso)
5. [Segurança de aplicação](#5-segurança-de-aplicação)
6. [Criptografia em repouso](#6-criptografia-em-repouso)
7. [Autenticação e sessão](#7-autenticação-e-sessão)
8. [Internacionalização](#8-internacionalização)
9. [Interoperabilidade em saúde](#9-interoperabilidade-em-saúde)
10. [Assinatura digital](#10-assinatura-digital)
11. [Acessibilidade](#11-acessibilidade)
12. [Performance](#12-performance)
13. [Observabilidade](#13-observabilidade)
14. [PWA / mobile](#14-pwa--mobile)
15. [Integração entre módulos (eventos)](#15-integração-entre-módulos-eventos)
16. [Testes](#16-testes)

---

## 1. LGPD e privacidade

**O que é:** conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018): consentimento granular, minimização, finalidade, anonimização para pesquisa, portabilidade e eliminação.

**Onde está hoje:**
- Módulo dedicado `backend/src/lgpd/` (`lgpd-consent.entity.ts`, `lgpd.service.ts`, `lgpd.controller.ts`).
- Campo `lgpdConsentAt` no paciente.
- Flag `consentForResearch` + tabela `research_records` (anonimizada, ver fluxo 19).
- Integridade via `dataHash` SHA-256 em `ResearchRecord`.
- CEP armazenado só como 5 primeiros dígitos (`zipCodePartial`) em pesquisa.

**Regra específica:**
- Consentimento explícito obrigatório antes do primeiro processamento; data registrada.
- Dados de pesquisa **nunca** contêm nome, CPF, endereço completo, contatos, prontuário ID, nome do médico.
- Direito de portabilidade: `Export` module gera CSV/PDF do que existe sobre a paciente.
- Log de auditoria mantém trilha de quem acessou/alterou dado sensível.

**Como tratar na migração:**
- Consentimento **versionado** (`consent_version` + texto aceito); re-pedir quando mudar.
- Implementar endpoints `DELETE /lgpd/me` (direito ao esquecimento) com cascade controlado — fiscais/prontuário devem ficar por 20 anos (CFM) mesmo com revogação LGPD (conflito real; documentar base legal).
- Separar consentimento de finalidade: clínico (obrigatório para atendimento), pesquisa (opt-in), marketing (opt-in).
- Criar "relatório de dados pessoais" (Art. 18 LGPD): o que há sobre a paciente, com quem foi compartilhado.
- Nomear DPO (Data Protection Officer) e expor canal de contato no app.
- Data Processing Agreement com Anthropic/Daily/Meta WhatsApp/SMTP provider.

---

## 2. Auditoria

**O que é:** trilha imutável de todas as operações sensíveis — quem, o quê, quando, contra qual recurso.

**Onde está hoje:**
- `backend/src/audit/audit.interceptor.ts` — interceptor global em NestJS, logga todo request autenticado.
- Entidade `AuditLog` (`audit-log.entity.ts`).
- `backend/src/audit/audit.service.ts` expõe busca; `audit.controller.ts` lê (role admin).

**Regra específica:**
- Toda mutação de dado clínico (POST/PATCH/DELETE) gera registro.
- Campos: `userId`, `tenantId`, `method`, `path`, `statusCode`, `timestamp`, `userAgent`, `ip`, `payload hash`.
- Retenção: enquanto o prontuário existir (CFM: 20 anos mínimo).

**Como tratar na migração:**
- Tornar `audit_logs` **append-only** (sem UPDATE/DELETE), de preferência em schema read-only com role separada.
- Exportar periodicamente para armazenamento imutável (S3 Object Lock, WORM).
- Indexar `(tenantId, userId, createdAt)` e `(tenantId, path, createdAt)`.
- Mascarar payload: nunca logar senha, token, CPF em claro; manter só hash.
- Alertas de anomalia: volumes de acesso fora do padrão, exports em massa.
- Dashboard de auditoria para admin do tenant (quem viu o prontuário da paciente X).

---

## 3. Multi-tenancy

**O que é:** isolamento absoluto de dados entre unidades (clínica A não enxerga clínica B).

**Onde está hoje:**
- Toda entidade clínica relevante tem `tenantId: uuid | null`.
- `backend/src/common/tenant.ts` — helpers `verifyPatientTenant`, `verifySubResourceTenant`.
- Presets: **consultório**, **UBS**, **hospital** — cada um ativa conjunto diferente de 16 module flags.
- `tenant_configs` table criada em migration `1711900059000-CreateTenantConfig.ts` com `mod_*` booleans (incluindo `mod_menopause`, etc.).
- Sidebar do frontend é filtrada dinamicamente pelos flags.
- `CurrentUser('tenantId')` decorator injeta o tenantId em controllers.

**Regra específica:**
- **Toda** query que lista/filtra recursos clínicos deve aplicar `WHERE tenantId = :tenantId`.
- Pacientes pertencem a um tenant; cross-tenant não é permitido via produto (a não ser que haja feature explícita de transferência futura).
- Presets existem como atalho; usuário pode customizar o array de flags.
- Exceção conhecida: `billing.service.ts#findByPatient` hoje **não filtra** por tenant — bug (ver fluxo 18).

**Como tratar na migração:**
- Row Level Security (Postgres RLS) como cinto + suspensório — mesmo se esquecerem no WHERE, o DB bloqueia.
- `@RequireTenant()` decorator que falha o request se `tenantId` não estiver presente no contexto do user.
- Testes E2E cruzados: usuário A não consegue GET de recurso de B (nem listando, nem pelo ID).
- Migração de schema dos 16 flags para tabela normalizada `tenant_modules(tenant_id, module_id, enabled)` para evoluir sem ALTER TABLE.
- Superadmin cross-tenant: caminho separado, logado com flag especial, alertas visuais constantes.
- Tenants "assinam" presets mas mantém histórico de toggles.

---

## 4. RBAC e controle de acesso

**O que é:** 7 roles funcionais com guards nos endpoints.

**Onde está hoje:**
- Roles em `auth/auth.enums.ts`: `PHYSICIAN`, `ADMIN`, `NURSE`, `RECEPTIONIST`, `PATIENT`, `RESEARCHER`, `SUPERADMIN`.
- Decorator `@Roles(UserRole.X, UserRole.Y)` nos controllers.
- `backend/src/auth/guards/` — JwtAuthGuard + RolesGuard aplicados globalmente.
- Usuário pode ter múltiplas roles (array).

**Regra específica:**
- Paciente vê **só seus próprios dados** (portal); guards verificam vínculo `user.patientId === resource.patientId` via subresource.
- Secretária (receptionist) não tem acesso clínico — só agendamento/documentação/convênio.
- Pesquisador só abre analytics/research, nunca prontuário identificado.
- Admin de tenant ≠ superadmin: admin só gerencia seu tenant.

**Como tratar na migração:**
- Matrix de permissões documentada (CSV comitado): para cada endpoint × role, ALLOW/DENY.
- ABAC complementar (atributos): médico só edita consultas dele; secretária só vê agenda do médico vinculado (há `secretary_assignments` N:N).
- Permissões customizadas por tenant — ex.: hospital delega roles clínicas diferentes.
- Nunca retornar dados que o user não poderia ver mesmo por bug de query — combinar com RLS.
- Auditar promoções de role.

---

## 5. Segurança de aplicação

**O que é:** proteções padrão contra ataques comuns (XSS, CSRF, injection, brute force, DoS).

**Onde está hoje:**
- **Helmet.js** configurado no bootstrap (`main.ts`).
- **CORS whitelist** configurável via env.
- **Rate limiting**: 100 req/min global; 5 req/min OTP; 10 req/min login (Nest Throttler).
- **ValidationPipe global** com `whitelist: true` e `forbidNonWhitelisted: true` — campos não declarados no DTO são rejeitados.
- **SQL injection:** TypeORM parametriza; duas exceções a revisar:
  - `billing.service.ts#getSummary` usa template string com tenantId (revisar quoting/UUID validation).
  - `research-query.service.ts` executa SQL gerado pela IA — mitigado por whitelist de SELECT + proibição de DML/DDL por regex.

**Regra específica:**
- Todo DTO de entrada é class-validator.
- Nenhum endpoint aceita propriedade extra (`forbidNonWhitelisted`).
- CORS origin lida do env `FRONTEND_ORIGIN` (+ variantes portal/check-in).
- Rate limits por IP + por user.

**Como tratar na migração:**
- CSP (Content Security Policy) estrita; nunca `unsafe-inline`.
- **Nunca** concatenar strings em SQL: refatorar `getSummary` para parâmetros.
- Role Postgres separada para as queries da IA (read-only em `research_records` apenas).
- WAF (Cloudflare/AWS) na frente, regras OWASP Top 10.
- Secret scanning no CI (gitleaks) — nunca deixar `ANTHROPIC_API_KEY`/`JWT_SECRET` vazarem.
- Dependabot + `npm audit` bloqueante no CI.
- Tests de fuzzing em endpoints críticos (portal OTP, webhook WhatsApp HMAC).

---

## 6. Criptografia em repouso

**O que é:** campos muito sensíveis criptografados no banco, não só TLS em trânsito.

**Onde está hoje:**
- `backend/src/security/encryption.service.ts` — AES-256-GCM com chave do env.
- `backend/src/security/security.module.ts` expõe o service globalmente.
- bcrypt 12 rounds para senhas (`auth.service.ts`).

**Regra específica:**
- AES-256-GCM para campos explicitamente sensíveis (CPF, dados de certificação, tokens de provider externo).
- Nonce único por operação, autenticação de dados inclusa (GCM).
- Chave via env `ENCRYPTION_KEY`; rotação requer migration.

**Como tratar na migração:**
- KMS (AWS KMS / GCP KMS) em vez de chave em env.
- Envelope encryption: chave mestra no KMS + chaves derivadas por tenant.
- Campos criptografados têm sufixo `_enc` + `_iv` + `_tag` (padrão claro).
- Rotatividade: mecanismo de re-criptografia em background com versão de chave.
- TDE (Transparent Data Encryption) do Postgres + FDE no nível do volume.

---

## 7. Autenticação e sessão

**O que é:** login seguro com JWT de curta duração + refresh token rotativo + detecção de roubo.

**Onde está hoje:**
- JWT access 8h, refresh 7d com rotação.
- `refresh-token.entity.ts` armazena tokens emitidos; `password-history.entity.ts` mantém 5 últimas senhas.
- Regex de complexidade na senha; bcrypt 12.
- **Token theft detection:** se refresh token revogado é reusado, revoga TODOS os tokens do usuário (`auth.service.ts`).
- Certificação digital ICP-Brasil: providers `Bird ID`, `Certisign`, `Valid`, `SafeID`, `VIDaaS` — login por token temporário.
- Providers permitidos configuráveis por tenant (JSONB array).
- Validade editável pelo admin (default 365 dias).
- Portal da paciente: OTP 6 dígitos, 10 min expiry, 5 tentativas; rate limit 5/min.
- Master OTP dev only (`PORTAL_MASTER_OTP=123456`).
- **Social login foi removido** — sem Google/Facebook/etc.

**Regra específica:**
- Access token deve ser reemitido via refresh; nunca estender TTL do access.
- Refresh reutilizado (já revogado) = evento de segurança → `revokeAll(userId)` + notificar.
- Histórico de 5 senhas impede reuso.
- Certificado digital tem validade e só providers habilitados por tenant podem logar.

**Como tratar na migração:**
- Considerar WebAuthn/Passkeys como alternativa à senha (primeiro para médicos, depois pacientes).
- MFA obrigatório para admin e superadmin (TOTP).
- Device binding do refresh token (hash do user-agent + IP range).
- Notificar paciente/médico por email+WhatsApp em login de novo device.
- OTP hashado em repouso (nunca em texto puro).
- Fingerprint do dispositivo na sessão para triangular fraude.
- JWT com `kid` (key id) para rotação de chave sem invalidar todos.

---

## 8. Internacionalização

**O que é:** strings em PT-BR, EN-US, ES-ES via módulo i18n dedicado.

**Onde está hoje:**
- `backend/src/i18n/` — `translation.entity.ts`, `i18n.service.ts`, `i18n.controller.ts`.
- Seed `1711900015001-SeedTranslations.ts` com keys como `alert.hellp.tgo_elevated` nas 3 línguas.
- Frontend consome via API ou bundle estático.

**Regra específica:**
- Todas as mensagens de alerta clínico devem existir nas 3 línguas antes de shippar.
- Key = namespace.termo (ex.: `alert.hellp.critical`).
- Default = `pt_BR`; fallback ao default se missing.

**Como tratar na migração:**
- Usar `i18next` ou `react-intl` no frontend (hoje é mistura).
- CI lint: falha se keys usadas no código não existirem nos seeds das 3 línguas.
- Terminologia clínica: manter glossário médico por idioma (ver `06-glossary.md`).
- Interface do paciente com vocabulário leigo; interface do médico com técnico — dois namespaces.

---

## 9. Interoperabilidade em saúde

**O que é:** capacidade de trocar dados clínicos com outros sistemas usando padrões internacionais.

**Onde está hoje:**
- `backend/src/fhir/` — FHIR R4 com perfis RNDS brasileiros.
- `backend/src/hl7/` — mensagens HL7 v2.
- `backend/src/cda/` — documentos CDA R2.
- `backend/src/loinc/` — terminologia laboratorial.
- `backend/src/cnes/` — Cadastro Nacional de Estabelecimentos de Saúde.
- `backend/src/lab-integrations/` — integrações com labs.
- RNDS opcional via env `RNDS_ENABLED`, `RNDS_CERTIFICATE_PATH`, `RNDS_CERTIFICATE_PASSWORD`.

**Regra específica:**
- Recursos FHIR expostos: Patient, Encounter, Observation, Condition, MedicationRequest, Immunization, DiagnosticReport (mínimo).
- Perfis RNDS obrigatórios para envio ao SUS.
- Mapas: LOINC para exames, SNOMED-CT/CID-10 para diagnósticos, TUSS para procedimentos.

**Como tratar na migração:**
- Suportar FHIR R5 quando RNDS adotar.
- Subscription FHIR para eventos pub/sub (novo exame → notifica).
- Implementar `$everything` operation para portabilidade completa.
- Validação automática contra perfis RNDS antes do envio.
- Adoptar OpenAPI/Swagger + `fhir-kit-client` no frontend para acesso direto a outros EHRs.

---

## 10. Assinatura digital

**O que é:** assinatura criptográfica de documentos clínicos com validade jurídica.

**Onde está hoje:**
- Laudos USG assinados com SHA-256 (hash do conteúdo + timestamp + user).
- Prescrições via Memed com ICP-Brasil (Bird ID etc.).
- PDFs gerados por `pdfkit` (`backend/src/export/`).

**Regra específica:**
- Todo laudo USG final tem hash SHA-256 armazenado em `report_hash` ou equivalente.
- Prescrições exigem certificado digital ICP-Brasil para validade jurídica (obrigatório no Brasil pela Lei 14.063/2020).
- Reassinatura necessária se conteúdo for editado após assinatura.

**Como tratar na migração:**
- Timestamp autoridade (RFC 3161) para carimbo de tempo confiável.
- Suporte PAdES (PDF Advanced Electronic Signatures).
- Certificado A3 (token) vs A1 (arquivo) — ambos.
- Assinatura em batch para alta volumetria (hospital).
- QR Code de verificação nos PDFs impressos (público valida hash).

---

## 11. Acessibilidade

**O que é:** WCAG 2.1 AA — produto usável com leitor de tela, teclado, alto contraste.

**Onde está hoje:**
- `frontend/src/components/ui/SkipLink` — pular para conteúdo.
- `frontend/src/components/ui/VisuallyHidden` — labels só para screen reader.
- Foco visível nos componentes (Button, Input, Modal).
- Tailwind 4 com tokens de cor do sistema "Lunar Bloom".

**Regra específica:**
- Todo componente interativo precisa de `aria-label` quando o texto visível for ícone.
- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande.
- Navegação por teclado completa; foco ordenado.
- Modais com trap de foco + retorno ao elemento disparador.

**Como tratar na migração:**
- Auditoria com axe-core no CI.
- Usuárias com deficiência testando.
- Suporte a prefers-reduced-motion (desativar animações).
- Modo alto contraste derivado da paleta Ink/Cream/Terracotta.
- Leitor de tela testado em PT-BR (NVDA, JAWS, VoiceOver).

---

## 12. Performance

**O que é:** responsividade e escalabilidade.

**Onde está hoje:**
- Dashboard do copiloto: 7 queries paralelas, refresh a cada 60s.
- `DashboardStatsService.getOverview()` fez merge de 8 queries em 1 com `COUNT(*) FILTER`.
- Índices compostos (`tenantId`, `patientId`, `createdAt`) nas tabelas principais.
- JSONB para dados semi-estruturados (alertas, procedimentos, `neonatalData`, `highRiskFlags`).
- React Query com `keepPreviousData` para UX suave; Suspense e `Skeleton` para estados de loading.

**Regra específica:**
- Nenhuma query de lista sem paginação (default 50).
- N+1 evitado: `findByPatient` faz single query com `EXISTS`.
- Operações pesadas (anonimização em massa) via `Promise.allSettled` com concorrência controlada.

**Como tratar na migração:**
- Carregar dashboards via queries materializadas (refresh periódico).
- Cache (Redis) para lookups de ricos e configs (tenant_config, translations).
- CDN para assets estáticos.
- Paginação baseada em cursor para listas grandes (dashboard, analytics).
- Monitor de slow queries (pg_stat_statements) — budget de 200ms p95.
- Bundle splitting no frontend por rota; lazy load de Recharts e PDF.
- Service worker mais agressivo para páginas leves.

---

## 13. Observabilidade

**O que é:** capacidade de entender o que o sistema está fazendo em produção.

**Onde está hoje:**
- Swagger UI em `/api` (NestJS Swagger module).
- Logs via Nest Logger padrão.
- Health check endpoint (básico).

**Regra específica:**
- Todo endpoint tem documentação Swagger (decorators + DTOs).
- Logs estruturados (JSON) com `requestId`, `userId`, `tenantId`.

**Como tratar na migração:**
- OpenTelemetry end-to-end: tracing do request no frontend → backend → Claude/Daily/DB.
- Métricas Prometheus: latência por endpoint, erros 5xx, fila de webhook WhatsApp.
- Sentry para exceções do frontend e backend.
- SLO dashboards (Grafana): disponibilidade 99.9%, p95 < 500ms.
- Alertas para: fila de resumo pós-consulta travada, rate de glosa subindo, erros Anthropic > 2%.
- Correlação de request entre serviços via `traceparent`.

---

## 14. PWA / mobile

**O que é:** aplicação instalável no celular, funciona offline em operações essenciais.

**Onde está hoje:**
- `manifest.json` com ícones, cores, nome.
- Service worker via Vite PWA plugin.
- Cache NetworkFirst para API.
- Portal da paciente e check-in QR funcionam em mobile.

**Regra específica:**
- Páginas críticas instaladas no SW: login, dashboard paciente, agenda.
- Cache de API curto (30s NetworkFirst); preferir rede atualizada.
- Ícones 192/512, theme_color Ink ou Cream conforme tema.

**Como tratar na migração:**
- Background sync para envio de leituras (PA/glicemia) quando sem internet.
- Web push para notificações de consulta/resultados.
- Suporte a install prompt customizado.
- Native app (React Native) pode vir depois; PWA cobre LATAM onde Android domina.
- Testar em dispositivos antigos (2018+) — público obstétrico brasileiro tem cauda longa.

---

## 15. Integração entre módulos (eventos)

**O que é:** fluxos complexos que atravessam módulos disparam efeitos em cadeia.

**Onde está hoje:**
- WebSocket `/copilot` (Fase 3) — insights em tempo real durante a consulta.
- Cron diário 6h (Fase 4b) — análise longitudinal, retornos perdidos, exames pendentes.
- Eventos disparados dentro de services (anonimização após consentimento, Rhogam ao identificar Rh-).
- Webhook WhatsApp (POST `/webhook/whatsapp`) com validação HMAC-SHA256.

**Regra específica:**
- Validação HMAC no webhook antes de processar.
- Rate limit 20 mensagens por sessão de chatbot.
- Detecção de urgência por keywords → notifica médico + instrui paciente + escalação.

**Como tratar na migração:**
- Barramento de eventos (NATS/Kafka/Redis Streams) em vez de chamadas síncronas.
- Outbox pattern para garantir que eventos clínicos críticos não se percam.
- Idempotência por `eventId` em todos os consumidores.
- Dead letter queue com alerta.

---

## 16. Testes

**O que é:** cobertura automatizada que garante que regras clínicas não quebrem.

**Onde está hoje:**
- 20 testes de UI (Vitest + React Testing Library) cobrindo Button, Input, Badge, Modal.
- Typecheck strict (TypeScript 5.9) no CI.
- Sem testes backend significativos (lacuna crítica).

**Regra específica:**
- Todo PR passa `typecheck` + `test` no CI.

**Como tratar na migração:**
- Cobertura mínima 80% nos services clínicos — regras de BR-* devem ter test case para cada threshold.
- Snapshot de contrato dos endpoints (Pact ou OpenAPI-derived).
- E2E com Playwright para fluxos críticos: pré-natal (criar → consulta → checklist → resumo → WhatsApp), portal OTP, check-in QR, TISS draft→submit→paid.
- Tests de cross-tenant (isolamento).
- Property-based testing para cálculos (FMF T21, scoring MRS, PBAC).
- Dataset sintético para pesquisa — validar que anonimização não vaza PII via heurística k-anonimato.
