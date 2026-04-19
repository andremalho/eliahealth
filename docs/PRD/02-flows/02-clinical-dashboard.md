# Dashboard Clínico (Tela-mãe do Médico)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** crítica
> **Depende de:** autenticação (01), copiloto clínico (Fases 1-4), chat paciente, scheduling

---

## 1. Propósito

**Problema que resolve:** Médicos ginecologistas-obstetras operam com dezenas de pacientes simultaneamente em estados diferentes (gestante 28sem, climatério, rastreio anual, puerpério). Sem um ponto único que agregue "o que precisa de mim **agora**", o médico desperdiça tempo navegando entre agendas, inbox, laudos pendentes e chat. Pior: paciente que relatou sangramento no chat escalado fica invisível até o médico abrir o WhatsApp.

**Valor entregue:**
- Uma tela após o login que responde a pergunta: **"o que preciso fazer agora?"**
- 7 queries SQL paralelas no backend (um único round-trip do frontend), refresh a cada 60s.
- Barra vermelha persistente no topo quando há chat escalado (paciente relatou urgência).
- Agrupamentos: ações urgentes, resumos pendentes para aprovar, visão do copiloto (7d), alertas longitudinais (retornos perdidos, exames pendentes), pacientes que precisam de atenção, stats do chatbot.

**Intenção do médico-fundador:** Inspiração declarada em dashboards tipo Linear/Superhuman — "inbox zero clínico". A barra vermelha é explícita: *"se tem urgência, não deixo o médico escolher ignorar, apareço em cima"*. O KPI interno é "tempo de primeira ação clinicamente relevante pós-login" — meta <15s.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico (PHYSICIAN) | Dono do dashboard | Login bem-sucedido → redirect a `/dashboard` |
| Admin (ADMIN) | Acesso read-only ao dashboard do tenant (agregado) | Mesmo endpoint com perfil admin |
| Cron de alertas longitudinais | Popula dados consumidos aqui | `longitudinal_alerts` criadas a 06:00 diárias |

**Pré-condições:**
- Usuário autenticado com role `PHYSICIAN` ou `ADMIN`.
- `tenantId` presente no JWT; queries filtram por tenant.

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| doctorId | UUID | JWT (`sub`) | sim |
| tenantId | UUID \| null | JWT | não (mas recomendado) |
| refreshInterval | ms | frontend (default 60000) | — |
| scope | período | backend hard-coded em 7 dias para stats | — |

Nada é enviado no body — endpoint é `GET /copilot-dashboard`.

---

## 4. Fluxo principal (happy path)

1. **Redirect pós-login** — `LoginPage` navega para `/dashboard` (`DashboardPage.tsx`).
2. **Fetch do dashboard** — `useQuery(['copilot-dashboard'])` com `refetchInterval: 60000` chama `GET /copilot-dashboard`.
3. **Backend executa 7 queries SQL paralelas** via `Promise.all` em `CopilotDashboardService.getDashboardData`:
   - (1) Resumos em draft (status='draft') com nome da paciente — top 10.
   - (2) `COUNT` de `copilot_checks` não revisados.
   - (3) Insights dos últimos 7d: `total`, `accepted`, `dismissed` (com `acceptanceRate` derivado no JS).
   - (4) Alertas longitudinais não lidos (`read_by_doctor=false`) — top 15.
   - (5) Chats escalados (`escalated_to_doctor=true AND status='escalated'`) com `escalation_reason` — top 10.
   - (6) Stats de chat (mensagens do assistant nos últimos 7d + `avg response_time_ms` do metadata).
   - (7) Stats de copilot checks (total 7d + `avg generation_time_ms`).
4. **Resposta estruturada** — backend compõe `{ urgentActions, pendingSummaries, copilotOverview, patientAttention, chatbotStats, longitudinalAlerts }`.
5. **Render no frontend** (`DashboardPage.tsx` + `CopilotDashboardCards.tsx` + `LongitudinalAlertsSection.tsx`):
   - Se `urgentActions.totalCount > 0`: barra vermelha fixa no topo (`#urgent-actions-bar`) listando "paciente X relatou urgencia" com deeplink `/patients/:id`.
   - Card do copiloto (`#copilot-overview-card`): checklists não revisados, taxa de aceitação, tempo médio de geração.
   - Card de resumos pendentes (`#pending-summaries-card`): lista para revisar/aprovar (fluxo Fase 1).
   - Card "Pacientes que precisam de você": chats escalados + retornos perdidos.
   - Seção de alertas longitudinais: ações inline (marcar lido, responder).
6. **Refresh automático** — a cada 60s a query re-executa; barra vermelha aparece/some sem reload.
7. **Ação inline nos cards** — clicar em um resumo pendente abre `/consultations/:id/review`; clicar em alerta longitudinal navega para paciente/exame; botão "marcar como lido" chama `PATCH /copilot/longitudinal-alerts/:id/read`.
8. **Walkthrough na primeira visita** — `useOnboarding('doctor_main')` dispara tooltips sobre os IDs âncora (ver fluxo 01).

```
  GET /copilot-dashboard ──► Promise.all ─┬─► consultation_summaries
                                          ├─► copilot_checks
                                          ├─► copilot_insights (7d)
                                          ├─► longitudinal_alerts
                                          ├─► chat_sessions (escalated)
                                          ├─► chat_messages (7d)
                                          └─► copilot_checks stats (7d)
                                                        │
                                                        ▼
                                             Dashboard JSON agregado
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Nenhuma pendência | Estado "tudo em dia" com CTA "Abrir próxima consulta da agenda" |
| Sem tenant (superadmin) | `tenantFilter=''`, dashboard cross-tenant (hoje implementado assim — ver Melhorias) |
| Chat escalado reaberto sem médico atribuído | Query filtra por `doctor_id = $1` — se nenhum médico dono, não aparece (GAP) |
| Query SQL falha | Erro 500 — frontend mostra "Erro ao carregar dashboard, tente novamente" (sem retry automático) |
| Tempo de geração do copiloto muito alto | `avgGenerationTimeMs` aparece no card como sinal amarelo (>5000ms = problema) |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Window de stats do copiloto e chatbot: 7 dias rolling | `copilot-dashboard.service.ts:12` `sevenDaysAgo` |
| RB-02 | Refresh no frontend: 60s | Hard-coded em `DashboardPage.tsx` (React Query `refetchInterval`) |
| RB-03 | Barra vermelha quando `urgentActions.totalCount > 0` | `copilot-dashboard.service.ts:94-106` |
| RB-04 | Severity de urgent action: `critical` para chat escalado | `copilot-dashboard.service.ts:101` |
| RB-05 | Top limits: 10 resumos, 15 alertas longitudinais, 10 chats escalados | `copilot-dashboard.service.ts:33,59,71` `LIMIT` |
| RB-06 | Isolamento por tenant em TODAS as queries | tenantFilter injetado em cada query |
| RB-07 | Taxa de aceitação de insights: `round(accepted / total * 100)` | `copilot-dashboard.service.ts:127` |
| RB-08 | Avg response time de chatbot retornado em segundos (ms/1000 arredondado) | `copilot-dashboard.service.ts:144` |
| RB-09 | Insights `dismissed` incluídos no total mas não "boa action" | convenção: dismissed reduz acceptanceRate |
| RB-10 | Resumos em draft = ação pendente (médico deve aprovar ou editar) | convenção Fase 1 |
| RB-11 | Onboarding dispara apenas se `progress.completed=false && skipped=false` | `useOnboarding` hook |
| RB-12 | Card IDs âncora obrigatórios: `#dashboard-header`, `#urgent-actions-bar`, `#copilot-overview-card`, `#pending-summaries-card`, `#patient-attention-card` | `onboarding-steps.ts` |

---

## 7. Saídas e efeitos

- **Cria/altera:** nenhuma escrita no dashboard em si; ações inline disparam `PATCH /copilot/longitudinal-alerts/:id/read`, `PATCH /consultation-summaries/:id/approve`, etc.
- **Notificações disparadas:** nenhuma (leitura apenas).
- **Integrações acionadas:** nenhuma externa.
- **Eventos emitidos:** nenhum; o dashboard consome dados produzidos por outros módulos (copiloto WS Fase 3, cron Fase 4b).

---

## 8. Integrações externas

Nenhuma direta. Este dashboard é agregador puro sobre o banco.

---

## 9. Critérios de aceitação

- [ ] Dado médico com 3 resumos em draft quando abre dashboard então card "Resumos pendentes" mostra 3 itens clicáveis.
- [ ] Dado paciente com chat escalado com `escalation_reason='sangramento'` então barra vermelha aparece com "<nome> relatou urgencia" como severity `critical`.
- [ ] Dado 60s de inatividade então dashboard refaz fetch silenciosamente.
- [ ] Dado 10+ resumos em draft então no máximo 10 aparecem (com indicador "ver todos").
- [ ] Dado médico A e B no mesmo tenant então dashboard de A não mostra dados de B.
- [ ] Dado `copilot_checks.reviewed_by_doctor` muda para true em outro device então refresh atualiza contador.
- [ ] Dado primeira visita do médico então walkthrough `doctor_main` aparece sobre os 5 cards principais.

---

## 10. Métricas de sucesso

- **TTA (time to first action):** ms entre dashboard render e primeiro clique. Meta: mediana <15s.
- **Taxa de approval de resumos via card:** %. Meta: >80% dos resumos draft resolvidos via dashboard (não via tela da paciente).
- **Chats escalados sem resposta em >2h:** count. Meta: 0.
- **Tempo de resposta p95 do endpoint:** meta <1200ms com banco com 1k pacientes/tenant.
- **Frequência de refresh efetivo (dados mudaram):** % de polls que mudam algo. Meta 20% — acima sugere refresh muito rápido ou muito lento.

---

## 11. Melhorias recomendadas na migração

- **Polling 60s é caro.** 7 queries SQL raw a cada 60s por médico logado × N médicos × M abas abertas. Migrar para **WebSocket server-push** (`/dashboard` namespace) com invalidation por evento (`consultation_summary.created`, `chat_session.escalated`) — mesma infra do copiloto Fase 3.
- **Tenant filter por interpolação de string é SQL injection latente.** `AND tenant_id = '${tenantId}'` no `copilot-dashboard.service.ts:15` — tenantId vem do JWT mas é má prática. Usar bind parameter.
- **Sem paginação real — "top 10" é arbitrário.** Adicionar "ver todos" com rota `/dashboard/summaries?status=draft`.
- **Barra vermelha sem som/notificação push.** Se o médico está em outra aba/paciente, não percebe. Adicionar Web Push + alerta sonoro opt-in.
- **Cards estáticos em ordem fixa.** Permitir drag-and-drop para que cada médico priorize (ex.: obstetra prioriza partos próximos; ginecologista prioriza rastreios vencidos).
- **"O que posso fazer agora?" está implícito.** Substituir os 5 cards por uma **única inbox priorizada** tipo Linear: itens ordenados por urgência com ação inline. Cards viram filtros.
- **Sem modo foco.** Quando o médico entra em consulta, o dashboard deveria pausar polling e silenciar (evitar "red bar flashing" durante atendimento).
- **Stats de 7d são rolling sem comparação.** Adicionar delta vs. semana anterior ("taxa aceitação +8pp").
- **Acceptance rate trata `dismissed` e `null` igual.** Um insight ainda não visto não é rejeição. Separar `dismissed` vs `unacted` (total - accepted - dismissed).
- **Cron 06:00 fixo.** Tenants em fuso diferente (ex.: Acre) recebem alertas às 04:00. Parametrizar por `tenant.timezone`.
- **Sem "deep link" do email.** Resumos pendentes poderiam ter URL `/dashboard#summary-:id` para email diário "você tem 3 resumos para aprovar".

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/copilot-dashboard/copilot-dashboard.service.ts` (159 linhas — 7 queries)
  - `backend/src/copilot-dashboard/copilot-dashboard.controller.ts`
  - `backend/src/copilot-dashboard/copilot-dashboard.module.ts`
  - `backend/src/copilot/` (alertas longitudinais, checks, insights consumidos)
  - `backend/src/consultation-summary/` (resumos)
  - `backend/src/chat/` (chat_sessions, chat_messages)
- Frontend:
  - `frontend/src/pages/dashboard/DashboardPage.tsx`
  - `frontend/src/pages/dashboard/CopilotDashboardCards.tsx`
  - `frontend/src/pages/dashboard/LongitudinalAlertsSection.tsx`
  - `frontend/src/pages/dashboard/NewPatientChooserModal.tsx` (CTA "nova paciente" no dashboard)
  - `frontend/src/components/onboarding/onboarding-steps.ts` (âncoras)
- Entidades consumidas (por nome de tabela): `consultation_summaries`, `copilot_checks`, `copilot_insights`, `longitudinal_alerts`, `chat_sessions`, `chat_messages`.
