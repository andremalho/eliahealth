# EliaHealth — Documentação Técnica

**Versão 1.0 | Abril 2026**

---

## 1. VISÃO GERAL DA ARQUITETURA

### Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React + TypeScript + Vite | 19.2 / 5.9 / 8.0 |
| **Estilização** | Tailwind CSS | 4.2 |
| **State Management** | Zustand + TanStack React Query | 5.x / 5.96 |
| **Gráficos** | Recharts | 3.8 |
| **Backend** | NestJS + TypeScript | 11.0 / 5.7 |
| **Banco de Dados** | PostgreSQL | 16 (Alpine) |
| **ORM** | TypeORM | 0.3.28 |
| **IA** | Anthropic Claude API (Sonnet 4) | SDK 0.81 |
| **Vídeo** | Daily.co | SDK latest |
| **Email** | Nodemailer (SMTP) | latest |
| **WhatsApp** | Meta Business API | REST |
| **PDF** | PDFKit | 0.18 |
| **Containerização** | Docker Compose | latest |

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Médico   │ │Secretária│ │ Paciente │ │ Check-in │      │
│  │Dashboard │ │ Recepção │ │  Portal  │ │   QR     │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       └─────────────┴────────────┴─────────────┘            │
│                         │ Axios + JWT                       │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    BACKEND (NestJS)                          │
│  ┌──────────────────────┼──────────────────────┐            │
│  │              API REST (57 módulos)          │            │
│  │  ┌─────┐ ┌──────┐ ┌──────┐ ┌───────┐      │            │
│  │  │Auth │ │Clínic│ │Portal│ │Appoint│      │            │
│  │  │Guard│ │Móduls│ │ OTP  │ │ments  │      │            │
│  │  └─────┘ └──────┘ └──────┘ └───────┘      │            │
│  │  ┌─────┐ ┌──────┐ ┌──────┐ ┌───────┐      │            │
│  │  │USG  │ │Hospit│ │Telem │ │Billing│      │            │
│  │  │Lauds│ │ aliz │ │ edia │ │ TISS  │      │            │
│  │  └─────┘ └──────┘ └──────┘ └───────┘      │            │
│  └────────────────────────────────────────────┘            │
│       │              │              │                       │
│  ┌────┴────┐  ┌──────┴─────┐  ┌────┴────┐                 │
│  │PostgreSQL│  │Claude API  │  │Daily.co │                 │
│  │   16    │  │(IA Clínica)│  │ (Vídeo) │                 │
│  └─────────┘  └────────────┘  └─────────┘                 │
│       │                                                     │
│  ┌────┴────┐  ┌────────────┐  ┌─────────┐                 │
│  │WhatsApp │  │   SMTP     │  │  FHIR   │                 │
│  │Meta API │  │ Nodemailer │  │RNDS/HL7 │                 │
│  └─────────┘  └────────────┘  └─────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. MÓDULOS DO SISTEMA

### 2.1 Módulos Clínicos (22)

| Módulo | Entity | Endpoints | Descrição |
|--------|--------|-----------|-----------|
| Consultations | Consultation | 5 | Consultas pré-natal (SOAP + vitais) |
| GynecologyConsultations | GynecologyConsultation | 5 | Consultas ginecológicas (6 tipos) |
| MenstrualCycleAssessments | MenstrualCycleAssessment | 5 | Ciclo menstrual / SUA (PALM-COEIN) |
| ContraceptionRecords | ContraceptionRecord | 5 | Contracepção (WHO MEC) |
| InfertilityWorkups | InfertilityWorkup | 5 | Pesquisa de infertilidade (ACOG) |
| AssistedReproduction | IvfCycle + OICycle + IuiCycle | 15 | Reprodução assistida (OI/IIU/FIV) |
| MenopauseAssessments | MenopauseAssessment | 5 | Menopausa (STRAW+10, MRS, HRT) |
| PreventiveExamSchedule | ExamSchedule | 4 | Rastreios preventivos por fase |
| Postpartum | PostpartumConsultation | 5 | Puerpério (involução, lóquios, EPDS) |
| ClinicalConsultation | ClinicalConsultation | 5 | Consulta clínica geral (SOAP) |
| Hospitalization | Hospitalization + Evolution | 8 | Internação + evolução diária |
| UltrasoundReports | UltrasoundReport | 8 | Laudos USG (17 templates) |
| ScreeningRisk | — | 2 | Cálculo FMF (T21/PE) |
| BpMonitoring | BpReading | 4 | Monitoramento de PA |
| GlucoseMonitoring | GlucoseReading | 4 | Monitoramento de glicemia |
| Vaccines | Vaccine | 4 | Vacinas |
| LabResults | LabResult | 4 | Exames laboratoriais |
| Ultrasound | Ultrasound + FetalBiometry | 8 | USG (biometria, Doppler, PBF) |
| VaginalSwabs | VaginalSwab | 4 | Coletas vaginais |
| Prescriptions | Prescription | 4 | Prescrições |
| PregnancyOutcome | PregnancyOutcome | 3 | Desfecho da gestação |
| ClinicalProtocols | ExamSchedule | 3 | Protocolos clínicos |

### 2.2 Módulos de Gestão (10)

| Módulo | Descrição |
|--------|-----------|
| Appointments | Agendamento com slots, auto-schedule pré-natal, check-in QR |
| SecretaryAssignment | Vínculo secretária-médico (N:N) |
| DoctorSchedule | Grade horária + datas bloqueadas |
| AppointmentAlert | Alertas de agendamento (profissional → paciente) |
| AppointmentReminder | Cron job lembretes 48h/24h (WhatsApp + email) |
| Billing | Faturamento TISS (guias, procedimentos TUSS, glosas) |
| Chat | Mensagens assíncronas médico-paciente |
| Teams | Gestão de equipe (convite, roles, compartilhamento) |
| TenantConfig | Multi-tenancy (consultório/UBS/hospital) |
| BirthCalendar | Calendário de partos |

### 2.3 Módulos de Infraestrutura (12)

| Módulo | Descrição |
|--------|-----------|
| Auth | JWT + roles (7 roles) + Google OAuth |
| Mail | SMTP via nodemailer |
| WhatsApp | Meta Business API |
| Telemedicine | Daily.co (videoconsulta) |
| Portal | Portal da paciente (OTP login) |
| Research | Dashboard analítico + query IA |
| Uploads | Upload de ficheiros + extração IA |
| Export | Exportação PDF (pdfkit) |
| Copilot | IA clínica (Claude API) |
| Audit | Log de auditoria |
| LGPD | Consentimento + anonimização |
| Content | Conteúdo educativo |

### 2.4 Interoperabilidade (6)

| Módulo | Descrição |
|--------|-----------|
| FHIR | FHIR R4 com perfis RNDS |
| HL7 | HL7 v2 mensagens |
| CDA | CDA R2 documentos clínicos |
| LOINC | Terminologia laboratorial |
| CNES | Cadastro Nacional de Estabelecimentos de Saúde |
| LabIntegrations | Integração com laboratórios |

---

## 3. SEGURANÇA

### 3.1 Autenticação e Autorização

- **JWT** com expiração de 8 horas (access token)
- **Refresh tokens** com rotação
- **7 roles**: PHYSICIAN, ADMIN, NURSE, RECEPTIONIST, PATIENT, RESEARCHER, SUPERADMIN
- **Role-based guards** em todos os endpoints
- **OTP** para portal da paciente (6 dígitos, 10 min expiry, 5 tentativas)

### 3.2 Proteção de Dados

- **Helmet.js** headers de segurança
- **CORS** whitelist configurável
- **Rate limiting**: 100 req/min global, 5 req/min OTP, 10 req/min login
- **ValidationPipe** com whitelist + forbidNonWhitelisted
- **Auditoria** completa (AuditInterceptor em todos os endpoints)

### 3.3 LGPD

- Consentimento explícito (lgpdConsentAt)
- Dados de pesquisa 100% anonimizados (ResearchRecord)
- Hash SHA256 para integridade
- Exportação de dados pessoais (direito de portabilidade)
- Módulo LGPD dedicado

---

## 4. BANCO DE DADOS

### 4.1 Estatísticas

- **70+ entities** TypeORM
- **65+ migrations** versionadas
- **Índices** otimizados para queries frequentes
- **JSONB** para dados semi-estruturados (alertas, neonatal, procedimentos)

### 4.2 Principais Tabelas

```
patients (cadastro)
pregnancies (gestações)
consultations (consultas pré-natal)
postpartum_consultations (puerpério)
clinical_consultations (clínica geral)
hospitalizations + evolutions (internação)
ultrasound_reports (laudos USG)
appointments (agendamento)
doctor_schedules (grade horária)
appointment_alerts (alertas de agendamento)
chat_messages (mensagens)
billing_records (faturamento)
research_records (dados anonimizados)
telemedicine_sessions (teleconsulta)
educational_content (conteúdo educativo)
tenant_configs (multi-tenancy)
```

---

## 5. FRONTEND

### 5.1 Component Library (15 componentes)

Button, Input, Select, Textarea, Modal, Card, CardHeader, Badge, Avatar, EmptyState, Tabs, Stat, SearchInput, Skeleton, SkeletonCard, SkeletonRow, VisuallyHidden, SkipLink

### 5.2 Páginas (24)

| Rota | Página | Role |
|------|--------|------|
| `/dashboard` | Dashboard médico | Clinical |
| `/gynecology` | Ginecologia (7 abas) | Clinical |
| `/pregnancies` | Lista de gestações | Clinical |
| `/pregnancies/:id` | Detalhe da gestação | Clinical |
| `/patients` | Lista de pacientes | Clinical |
| `/patients/:id` | Detalhe paciente (7 abas) | Clinical |
| `/ultrasound` | Laudos USG (17 templates) | Clinical |
| `/clinical` | Consulta clínica geral | Clinical |
| `/hospitalization` | Internações + evoluções | Clinical |
| `/chat` | Mensagens | Clinical |
| `/teleconsulta/:id` | Videoconsulta | Clinical |
| `/birth-calendar` | Calendário de partos | Clinical |
| `/billing` | Faturamento TISS | Clinical |
| `/analytics` | Dashboard de pesquisa | Clinical |
| `/teams` | Equipes | Clinical |
| `/settings` | Configurações + agenda | Clinical |
| `/reception` | Dashboard recepção | Receptionist |
| `/reception/agenda` | Agenda | Receptionist |
| `/reception/patients` | Pacientes (recepção) | Receptionist |
| `/portal/login` | Login paciente (OTP) | Public |
| `/portal` | Dashboard paciente | Patient |
| `/portal/onboarding` | Onboarding perfil | Patient |
| `/checkin` | Check-in QR code | Public |
| `/cartao` | Cartão público | Public |

### 5.3 PWA

- manifest.json com ícones e cores
- Service worker (Vite PWA plugin)
- Instalável no mobile
- Cache API com NetworkFirst

### 5.4 Testes

- **Vitest** + React Testing Library
- **20 testes** (Button, Input, Badge, Modal)
- TypeScript strict mode

---

## 6. IA CLÍNICA

### 6.1 Copiloto

- Análise de risco por consulta
- Detecção de padrões (PA, peso, glicemia, BCF)
- Sugestões baseadas em guidelines (FEBRASGO, ACOG, WHO)
- Screening gaps (DMG, anti-RhD, AAS, GBS, vacinas)

### 6.2 Extração de Documentos

- Laudos de USG → dados estruturados
- Resultados de laboratório → nome, valor, unidade, referência
- Upload PDF/imagem → Claude API → JSON

### 6.3 Geração de Laudos

- 17 templates de laudo USG (ISUOG/ACR/ACOG)
- Relatório formal em português (9 secções)
- Assinatura digital SHA256

### 6.4 Query Natural

- Pergunta em linguagem natural → SQL → gráfico
- Histórico de perguntas
- Dados 100% anonimizados

### 6.5 Cálculo de Risco

- **Trissomia 21**: Teste Combinado FMF (idade + TN + osso nasal + DV + TR + PAPP-A + beta-hCG)
- **Pré-eclâmpsia**: Algoritmo FMF multiparamétrico (12+ factores)

---

## 7. MULTI-TENANCY

### 7.1 Tipos de Unidade

| Tipo | Módulos Activos |
|------|----------------|
| **Consultório** | Pré-natal, ginecologia, USG, puerpério, infertilidade, TRA, menopausa, portal, agendamento |
| **UBS** | Pré-natal, ginecologia, clínica geral, portal, agendamento, FHIR/RNDS |
| **Hospital** | Todos + internação, evolução, TISS, FHIR/RNDS, telemedicina, pesquisa |

### 7.2 Configuração

- 16 module flags booleanos
- Presets automáticos por tipo
- Sidebar dinâmica filtrada por módulos activos

---

## 8. DEPLOY

### 8.1 Docker Compose

```yaml
services:
  db: PostgreSQL 16 Alpine (port 5432)
  backend: NestJS (port 3000)
  frontend: Vite (port 5173)
```

### 8.2 Variáveis de Ambiente

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

### 8.3 API Documentation

Swagger UI disponível em `/api` quando o backend está a correr.

---

## 9. MÉTRICAS DO PROJETO

| Métrica | Valor |
|---------|-------|
| Commits | 127+ |
| Módulos backend | 57 |
| Entities TypeORM | 70+ |
| Migrations | 65+ |
| Templates de laudo USG | 17 |
| Componentes UI | 15 |
| Testes automatizados | 20 |
| Páginas frontend | 24 |
| Roles de utilizador | 7 |
| Endpoints API | 200+ |

---

*Documento gerado em abril de 2026. EliaHealth — Prontuário exclusivo da mulher.*
