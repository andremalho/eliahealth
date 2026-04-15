# PROMPT — Gerar Memorando Executivo do Projeto EliaHealth

Cole este documento inteiro no Claude e peça: "Gere o memorando executivo com base neste briefing."

---

## INSTRUCAO

Voce e um consultor de tecnologia em saude digital. Com base nas informacoes abaixo, gere um **memorando executivo** do projeto EliaHealth, cobrindo:

1. Visao geral do produto e proposta de valor
2. Arquitetura tecnica (stack, modulos, infraestrutura)
3. Funcionalidades implementadas (por fase)
4. Fluxo clinico completo (da consulta ate a paciente)
5. Diferenciais competitivos
6. Metricas de impacto que o sistema gera
7. Status atual e proximos passos
8. Requisitos de infraestrutura para deploy

Formato: profissional, objetivo, pronto para apresentar a investidores ou parceiros estrategicos. Em portugues brasileiro.

---

## DADOS DO PROJETO

### Identidade

- **Nome:** EliaHealth
- **Tagline:** Prontuario exclusivo da mulher
- **Dominio:** Saude digital feminina — obstetricia, ginecologia, fertilidade, menopausa
- **Publico:** Clinicas privadas, UBS (SUS), hospitais-maternidade
- **Identidade visual:** Navy (#0F1F3D) e Lilac (#7C5CBF)

### Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11 + TypeScript 5.9 + TypeORM |
| Banco de dados | PostgreSQL 16 |
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| IA Clinica | Anthropic Claude API (claude-sonnet-4) |
| Video | Daily.co (teleconsulta) |
| Mensageria | Meta WhatsApp Business API |
| Email | Nodemailer (SMTP) |
| Infra | Docker Compose |
| Autenticacao | JWT + Refresh Token Rotation + Certificacao Digital ICP-Brasil |

### Numeros do Codebase

- **67 entities** TypeORM
- **60+ modulos** NestJS
- **18 paginas** frontend
- **20 migrations** ordenadas
- **15 componentes UI** reutilizaveis
- **17 templates** de laudo USG
- **7 roles** de usuario (physician, admin, nurse, patient, researcher, receptionist, superadmin)

### Multi-tenant

3 presets: consultorio, UBS, hospital. Cada preset ativa modulos diferentes automaticamente. Configuracao via API (`PATCH /tenants/my/config`).

---

## MODULOS ORIGINAIS (pre-IA)

| Modulo | Descricao |
|--------|-----------|
| Patients | Cadastro completo com dados demograficos, fase de vida, perfil de saude, LGPD |
| Pregnancies | Gestacoes com calculo de IG, DPP, alto risco, metodo de datacao |
| Consultations | Consultas pre-natais SOAP, sinais vitais, exame fisico, alertas automaticos |
| Lab Results | Resultados laboratoriais com alertas (HELLP, pre-eclampsia) |
| Prescriptions | Prescricoes com integracao Memed + assinatura digital Bird ID |
| Vaccines | Controle vacinal com esquema por IG (dTpa, influenza, COVID) |
| Ultrasound | Laudos USG com 17 templates + relatorios |
| Clinical Protocols | Protocolos clinicos + agenda de exames por IG |
| Glucose Monitoring | Monitoramento glicemico com alertas, integração com devices |
| BP Monitoring | Monitoramento de PA com alertas de pre-eclampsia |
| Gynecology | Consultas ginecologicas completas |
| Menstrual Cycle | Avaliacao de ciclo menstrual |
| Contraception | Registros de contracepcao com criterios WHO/MEC |
| Infertility | Investigacao de infertilidade |
| Assisted Reproduction | Reproducao assistida |
| Menopause | Avaliacao de climaterio/menopausa |
| Preventive Screening | Agenda de rastreios preventivos por idade |
| Postpartum | Consultas puerperais |
| Hospitalization | Internacoes hospitalares |
| Portal da Paciente | 12 secoes: dashboard, consultas, PA, glicemia, vacinas, exames, USG, agendamento, compartilhamento QR |
| Telemedicine | Teleconsulta via Daily.co com tokens por participante |
| Appointments | Agendamento com slots, auto-schedule, alertas |
| Teams | Equipes multidisciplinares |
| Research | Dashboard de pesquisa com query natural via IA |
| Billing | Faturamento TISS |
| FHIR/RNDS | Integracao com Rede Nacional de Dados em Saude |
| HL7/CDA | Interoperabilidade HL7 e CDA |
| LOINC/CNES | Terminologias padrao |
| Chat | Mensagens internas |
| Content | Conteudo educativo personalizado por IG |
| Mail | Notificacoes por email |
| Security | Criptografia AES-256-GCM para campos sensiveis |
| Audit | Log de auditoria com interceptor global |
| LGPD | Compliance com Lei Geral de Protecao de Dados |
| i18n | Internacionalizacao PT/EN/ES |
| Export | Exportacao de dados (CSV, PDF) |

---

## FUNCIONALIDADES DE IA (Fases 1-5)

### FASE 1 — Ponte de Comunicacao (Resumo Pos-Consulta)

**Problema:** Pacientes saem da consulta sem entender o que foi discutido.

**Solucao:**
- Apos o medico salvar a consulta, a IA (Claude) gera automaticamente um resumo em linguagem leiga
- O medico revisa, pode editar, e aprova
- O resumo e enviado via WhatsApp e disponibilizado no Portal da Paciente
- Secao "Minhas Consultas Explicadas" no portal com marcacao de leitura

**Fluxo:** Consulta salva → IA gera resumo → Medico aprova → WhatsApp + Portal → Paciente le

**Entidades:** `consultation_summaries` (status: generating → draft → approved → sent → delivered → read)

### FASE 2 — Copiloto de Decisao Clinica (Checklist Pos-Consulta)

**Problema:** Medicos podem esquecer exames, vacinas ou condutas recomendadas por guidelines.

**Solucao:**
- Ao finalizar a consulta, antes de fechar, o sistema gera um checklist de validacao clinica
- Baseado em guidelines reais: FEBRASGO, ACOG, NICE, WHO, FIGO
- Regras clinicas detalhadas por contexto: pre-natal (por IG), ginecologia, menopausa, fertilidade
- Cada item tem severity: OK / ATENCAO / ACAO RECOMENDADA
- Medico resolve cada item: aceitar, ja feito, adiar, ignorar (com justificativa obrigatoria)
- So permite finalizar quando todos os itens ACTION_REQUIRED estao resolvidos

**Fluxo:** Medico clica Finalizar → Checklist aparece → Medico resolve itens → Consulta finalizada → Resumo gerado (Fase 1)

**Entidades:** `copilot_checks` + `copilot_check_items` (10 categorias: exam, prescription, screening, vaccine, referral, monitoring, follow_up, anamnesis_gap, drug_interaction, contraindication)

### FASE 3 — Copiloto em Tempo Real (WebSocket)

**Problema:** Insights so no final da consulta e tarde — melhor durante o atendimento.

**Solucao:**
- WebSocket gateway (/copilot) conecta quando medico abre uma consulta
- A cada bloco semantico preenchido (queixa, sinais vitais, diagnostico, prescricao), a IA analisa incrementalmente
- Painel lateral discreto mostra insights em tempo real (max 3 por trigger)
- Tipos: gaps na anamnese, diagnosticos diferenciais, interacoes medicamentosas, contraindicacoes, alertas contextuais, sugestoes de exames, lembretes de guidelines, alertas de tendencia
- Nao repete insights ja apresentados na sessao
- Contexto da paciente pre-carregado em memoria (nao re-busca a cada trigger)

**Entidades:** `copilot_insights` (com doctor_action tracking: accepted/dismissed)

### FASE 4a — Chatbot Contextual (WhatsApp)

**Problema:** Paciente recebe o resumo mas tem duvidas — ligar pro consultorio nem sempre e viavel.

**Solucao:**
- Paciente responde no WhatsApp apos receber o resumo
- Chatbot responde usando contexto da consulta especifica + guidelines
- Nao e generico — sabe exatamente o que foi discutido naquela consulta
- Deteccao de urgencia por keywords (sangramento, dor intensa, perda de liquido, etc.)
- Escalation automatica: notifica medico + instrui paciente a ir ao PS + liga SAMU
- Rate limit: 20 mensagens por sessao
- Webhook: POST /webhook/whatsapp com validacao HMAC-SHA256

**Entidades:** `chat_sessions` + `chat_messages` (roles: patient, assistant, system)

### FASE 4b — Inteligencia Longitudinal

**Problema:** Medico nao tem visibilidade de padroes ao longo do tempo.

**Solucao:**
- Cron diario (6h) analisa por tenant: retornos perdidos, exames pendentes, tendencias do copiloto
- Queries SQL puras (sem IA) para deteccao objetiva
- Alerta se medico ignora >50% dos alertas de uma categoria
- Dashboard com alertas nao lidos e acoes inline

**Entidades:** `longitudinal_alerts` (tipos: missed_followup, pending_exam, copilot_trend, pattern_detected)

### FASE 5 — Dashboard Unificado + Analytics + Onboarding

**Dashboard:**
- Tela unica pos-login: acoes urgentes, resumos pendentes, visao do copiloto, pacientes que precisam de atencao, stats do chatbot, alertas longitudinais
- 7 queries paralelas, refresh a cada 60s
- Barra vermelha no topo quando ha chats escalados

**Analytics de Impacto:**
- 8 queries SQL raw otimizadas
- Metricas: ponte de comunicacao (taxa de leitura), copiloto (taxa de aceitacao), chatbot (tempo de resposta), longitudinal (taxa de acao)
- Secao "Impacto Clinico" — os numeros que vendem: "O copiloto detectou X gaps e o medico corrigiu Y (Z%)"
- Filtros por periodo e medico

**Onboarding:**
- Walkthrough guiado no primeiro login (tooltip com spotlight overlay)
- 2 flows: doctor_main (dashboard), copilot_consultation (tela de consulta)
- Nao bloqueia uso — "Pular" sempre disponivel
- Progress persistido no banco (nao repete apos completar)

**Entidades:** `onboarding_progress` (unique: user_id + flow_name)

---

## AUTENTICACAO E SEGURANCA

| Feature | Detalhe |
|---------|---------|
| JWT | Access token 8h + Refresh token 7d com rotacao |
| Token theft detection | Se refresh token revogado e reutilizado, revoga TODOS os tokens do usuario |
| Senha | bcrypt 12 rounds, historico de 5 senhas, regex de complexidade |
| Certificacao digital | ICP-Brasil (e-CPF/e-CNPJ), Bird ID, Certisign, Valid, SafeID, VIDaaS |
| Login por token | Token temporario de providers (Bird ID, VIDaaS, SafeID) |
| Validade certificado | Editavel pelo admin (default 365 dias) |
| Providers permitidos | Configuravel por tenant (JSONB array) |
| Social login | **REMOVIDO** — sem Google, sem Facebook, sem nenhum |
| Multi-tenant | Isolamento por tenant_id em TODAS as queries |
| Criptografia | AES-256-GCM para campos sensiveis |
| Auditoria | Interceptor global registra todas as operacoes |
| LGPD | Modulo dedicado para compliance |

---

## FLUXO CLINICO COMPLETO (todas as fases integradas)

```
1. Medico faz login (email+senha ou certificado digital)
   ↓
2. Dashboard unificado mostra: acoes urgentes, resumos pendentes, alertas
   ↓
3. Medico abre consulta de uma paciente
   ↓
4. WebSocket conecta → Copiloto em tempo real ativa (Fase 3)
   ↓
5. Enquanto preenche: insights aparecem no painel lateral
   ↓
6. Medico clica "Finalizar"
   ↓
7. Checklist pos-consulta aparece (Fase 2) com itens baseados em guidelines
   ↓
8. Medico resolve itens obrigatorios → confirma revisao
   ↓
9. IA gera resumo em linguagem leiga (Fase 1)
   ↓
10. Medico ve preview → pode editar → aprova → envia
    ↓
11. Paciente recebe no WhatsApp + Portal da Paciente
    ↓
12. Paciente le e pode conversar com chatbot contextualizado (Fase 4a)
    ↓
13. Se relatar urgencia → chatbot escala para medico automaticamente
    ↓
14. Diariamente: cron analisa retornos perdidos, exames pendentes (Fase 4b)
    ↓
15. Analytics agregam metricas de impacto clinico (Fase 5)
```

---

## ENDPOINTS DA API (novos, por fase)

### Fase 1 — Resumo Pos-Consulta
- `POST /consultation-summaries/generate/:consultationId`
- `GET /consultation-summaries/consultation/:consultationId`
- `GET /consultation-summaries/patient/:patientId`
- `GET /consultation-summaries/:id`
- `PATCH /consultation-summaries/:id/approve`
- `POST /consultation-summaries/:id/send`
- `PATCH /consultation-summaries/:id/read`
- `GET /portal/consultation-summaries`
- `PATCH /portal/consultation-summaries/:id/read`

### Fase 2 — Checklist Pos-Consulta
- `POST /copilot/post-consultation-check/:consultationId`
- `GET /copilot/check/:consultationId`
- `PATCH /copilot/check-item/:itemId/resolve`
- `PATCH /copilot/check/:checkId/reviewed`
- `GET /copilot/stats`

### Fase 3 — Tempo Real (WebSocket)
- `WS /copilot` (namespace)
- Eventos: `consultation:field_updated`, `consultation:request_analysis`, `copilot:insight_action`, `copilot:insights`, `copilot:connected`

### Fase 4a — Chatbot
- `POST /webhook/whatsapp` (webhook Meta)
- `GET /webhook/whatsapp` (verificacao)

### Fase 4b — Longitudinal
- `GET /copilot/longitudinal-alerts`
- `PATCH /copilot/longitudinal-alerts/:id/read`
- `PATCH /copilot/longitudinal-alerts/:id/respond`

### Fase 5 — Dashboard + Analytics + Onboarding
- `GET /copilot-dashboard`
- `GET /analytics`
- `GET /doctor-onboarding/progress/:flowName`
- `PATCH /doctor-onboarding/progress/:flowName`
- `POST /doctor-onboarding/restart/:flowName`

### Autenticacao (atualizado)
- `POST /auth/certificate-login`
- `POST /auth/token-login`
- `POST /auth/register-certificate`

---

## VARIAVEIS DE AMBIENTE

```env
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=eliahealth

# Autenticacao
JWT_SECRET=

# IA
ANTHROPIC_API_KEY=

# WhatsApp
WHATSAPP_ENABLED=false
WHATSAPP_API_URL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_OTP_TEMPLATE=otp_verification
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

# Telemedicina
DAILY_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Portal
PUBLIC_APP_URL=
PORTAL_MASTER_OTP= (dev only)

# RNDS (opcional)
RNDS_ENABLED=false
RNDS_CERTIFICATE_PATH=
RNDS_CERTIFICATE_PASSWORD=
```

---

## METRICAS DE IMPACTO (geradas pelo sistema)

O modulo Analytics calcula automaticamente:

- **Gaps clinicos detectados** pelo copiloto e **taxa de correcao** pelo medico
- **Pacientes alcancadas** pelo resumo pos-consulta
- **Taxa de leitura** dos resumos
- **Pacientes que interagiram** com o chatbot
- **Tempo medio de resposta** do chatbot
- **Taxa de escalacao** (urgencias detectadas)
- **Retornos perdidos** detectados e resolvidos
- **Exames pendentes** detectados e resolvidos
- **Taxa de aceitacao** dos insights do copiloto
- **Top categorias** de alertas por medico

---

## PARA RODAR O PROJETO

```bash
# Subir banco
docker compose up db -d

# Backend
cd backend && npm install && npm run build && node dist/main.js

# Frontend
cd frontend && npm install && npm run dev

# Acessar
# Backend: http://localhost:3000/api (Swagger)
# Frontend: http://localhost:5173
```
