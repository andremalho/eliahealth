# Agendamento e Grade Horária

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** crítica
> **Depende de:** autenticação (01), cadastro de paciente (03), gestações (para auto-schedule pré-natal)

---

## 1. Propósito

**Problema que resolve:** Agendamento em consultórios GO é caótico: grade horária do médico em papel, overbooking por engano, paciente gestante esquecida entre consultas de pré-natal (que deveriam seguir o ACOG: a cada 4 sem até 28, a cada 2 sem até 36, semanal depois). Lembretes manuais via WhatsApp tomam horas de secretária.

**Valor entregue:**
- Grade horária por médico (dia da semana, janela horária, duração de slot default 30min, ativo/inativo) + bloqueios por data.
- Geração automática de slots disponíveis, pronta para portal da paciente e para a secretária.
- **Auto-agendamento pré-natal**: ao criar gestação com DUM, sistema agenda consultas em 8, 12, 16, 20, 24, 28, 30, 32, 34, 36, 37, 38, 39, 40 semanas — 14 consultas automáticas ao próximo slot mais próximo, pulando conflitos (janela de ±7d).
- 6 categorias (com cor) para triagem visual: 1ª consulta, retorno, particular, convênio, urgência, encaixe.
- Lembretes cron diário (08:00) para 48h e 24h antes — via WhatsApp + email (idempotente via flags `reminder48hSent`/`reminder24hSent`).
- Check-in QR automático (fluxo 12) sem passar pela recepção.
- Detecção de overlap impede confirmação se horário já ocupado.

**Intenção do médico-fundador:** O protocolo pré-natal ACOG/FEBRASGO é universal mas sempre mal-seguido. Automatizar isso reduz perdas de seguimento e dá ao médico confiança de que a paciente "está na agenda até o parto". O esquema de 6 cores é pedido direto de obstetras: "preciso ver de longe se é 1ª consulta, encaixe ou urgência".

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico | Configura própria grade | Settings → `DoctorScheduleSettings` |
| Secretária | Agenda manualmente | Modo recepção → `NewAppointmentModal` |
| Paciente (portal) | Auto-agenda via slots livres | Portal → slots → confirma |
| Sistema (auto-schedule) | Cria consultas pré-natais | Criação de gestação com DUM |
| Cron reminders | Envia WhatsApp+email 48h/24h | `0 8 * * *` diário |

**Pré-condições:**
- Médico com `doctor_schedules` ativo (pelo menos um `dayOfWeek` com janela).
- Para auto-agendamento: `pregnancy.lmpDate` (DUM) preenchida.
- Para lembretes WhatsApp: `WHATSAPP_ENABLED=true` + paciente com `phone`.

---

## 3. Dados de entrada

**Grade (`doctor_schedules`):** `doctorId`, `dayOfWeek` (0=Dom..6=Sáb), `startTime` (HH:mm:ss), `endTime`, `slotDurationMin` (int, default 30), `isActive`.

**Bloqueios (`doctor_blocked_dates`):** `doctorId`, `blockedDate` (ISO date), `reason?`.

**Agendamento (`appointments`):** `tenantId`, `patientId`, `doctorId`, `createdById?`, `date`, `startTime`, `endTime`, `type` (`consultation`/`follow_up`/`exam`/`procedure`/`other`), `status` (`scheduled`/`confirmed`/`arrived`/`in_progress`/`completed`/`cancelled`/`no_show`), `category?` (enum 6 valores), `notes?`, `pregnancyId?`, `bookedByPatient`, `autoScheduled`, `reminder48hSent`, `reminder24hSent`, `insuranceType?`, `insuranceProvider?`, `insuranceMemberId?`, `insurancePlan?`, `insuranceCardUrl?`, `examRequestUrl?`, `patientCpf?`, `patientCep?`, `isCheckedIn`, `checkedInAt?`, `checkinToken?` (unique), `documentsConfirmed`, `cancellationReason?`.

---

## 4. Fluxo principal (happy path)

1. **Configuração de grade** — médico abre `/settings/schedule` (`DoctorScheduleSettings.tsx`). Preenche dias/horários/duração. `POST /appointments/schedule` com array. Backend (`SlotGenerationService.setSchedule`) desativa esquema anterior e persiste novo.
2. **Bloqueio de data** — `POST /appointments/blocked-dates` com `{ date, reason? }` (férias, evento).
3. **Listagem de slots** — frontend (secretária/portal) chama `GET /appointments/slots?doctorId=X&date=YYYY-MM-DD`. `getAvailableSlots`:
   - Checa `doctor_blocked_dates` — se bloqueado, retorna `[]`.
   - Busca schedule do `dayOfWeek`; se inativo, `[]`.
   - Gera todos slots da janela (passo de `slotDurationMin`).
   - Marca `available: false` em slots com overlap contra appointments `NOT IN (cancelled, no_show)`.
4. **Agendamento manual (secretária/médico)** — `NewAppointmentModal` preenche paciente, tipo, categoria, docs (CPF/CEP/convênio). `POST /appointments` → `checkOverlap()` (overlap detection SQL: `start < endTime AND end > startTime`) — se ocupado, 409.
5. **Agendamento auto pré-natal** — ao criar gestação com `lmpDate`, `AutoScheduleService.generatePrenatalSchedule(pregnancyId, doctorId)` itera `PRENATAL_SCHEDULE_WEEKS = [8,12,16,20,24,28,30,32,34,36,37,38,39,40]`:
   - Calcula `idealDate = lmp + week*7 dias`.
   - Se data no passado, skip.
   - Se já existe appointment dessa gestação com data ±7d (não cancelada), skip.
   - `findNextAvailableSlot(doctorId, idealDate, daysToSearch=14)` busca próximo slot livre nos 14 dias seguintes.
   - Se encontrado, cria appointment com `autoScheduled=true`, `notes='Consulta pre-natal — Nsem (auto-agendada)'`, `type=CONSULTATION` só na primeira semana (8sem), demais `FOLLOW_UP`.
6. **Categoria e cor** — médico/secretária escolhe `AppointmentCategory` (primeira_consulta, retorno, particular, convenio, urgencia, encaixe). Frontend mapeia `CATEGORY_COLORS`/`CATEGORY_DOT_COLORS` na agenda.
7. **Edição/Reschedule** — `PATCH /appointments/:id` com novo date/startTime/endTime → re-executa `checkOverlap` excluindo o próprio id.
8. **Cancelamento** — `PATCH /appointments/:id/cancel` com `reason?` → `status=CANCELLED`.
9. **Cron de lembretes** — `AppointmentReminderService.handleReminders` roda `0 8 * * *`:
   - `date48h = today+2`, `date24h = today+1`.
   - Para cada data: busca appointments `status IN (SCHEDULED, CONFIRMED)` e `reminder_{48h|24h}_sent=false`.
   - Envia WhatsApp: "Ola <nomeCurto>! Lembrete: sua consulta com Dr(a) <nome> esta agendada para <data> as <hora>. EliaHealth" (via `whatsAppService.sendOTP` — hack atual, ver Melhorias).
   - Envia email (hoje usa `sendOtpEmail` como fallback, também hack).
   - Marca flag `reminder48hSent` ou `reminder24hSent = true`.
10. **Resumo do dia** — `GET /appointments/summary?date=` retorna `{ total, scheduled, confirmed, arrived, inProgress, completed, cancelled, noShow }` para cards do dashboard da recepção (fluxo 13).
11. **Calendário de procedimentos** — `GET /appointments/procedures-calendar?month=&year=` agrega datas de ciclos FIV/IIU/IO (oocyte_retrieval_date, transfer_date, trigger_date, beta_hcg_date, stimulation_start_date, iui_date) — fluxo transversal com módulo reprodução assistida.

```
  Criar gestação (lmpDate) ──► AutoScheduleService.generatePrenatalSchedule()
                                       │
                                       ▼
                  PRENATAL_SCHEDULE_WEEKS → findNextAvailableSlot → INSERT appointment (autoScheduled=true)
                                                                                │
                           Cron 08:00 (48h e 24h antes) ─► WhatsApp + email     │
                                                                                ▼
                                                                     Paciente faz check-in QR (fluxo 12)
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Sem slot livre em 14 dias | Consulta pré-natal da semana é pulada, log warn. Médico precisa agendar manual. |
| Médico sem schedule ativo | `getAvailableSlots` retorna `[]`; agendamento manual ainda funciona mas sem checagem de grade (overlap apenas). |
| Overlap com cancelado | Ignorado (`NOT IN (cancelled, no_show)`). |
| Reschedule cria overlap | 409 "Horario ja ocupado". |
| Paciente sem phone | Reminder WhatsApp é skipado (log); tenta email. |
| Paciente sem email | Reminder email é skipado. |
| WhatsApp falha (timeout/erro) | Log `logger.error`, **flag `reminder48hSent=true` ainda é marcada** — impede retry (GAP, ver Melhorias). |
| Cron não rodou (server down) | Lembrete perdido — não há recovery automático. |
| Gestação com DUM no passado (ex.: paciente chega 30sem) | Skip semanas já passadas, agenda só a partir da próxima semana do protocolo. |
| Token de check-in `null` | Appointment existe mas check-in QR não disponível (ver fluxo 12). |
| Secretária tenta agendar médico não vinculado | Backend não enforça, depende de `getDoctorIdsForSecretary` no frontend (GAP). |
| Data bloqueada no meio da semana | Bloqueio tem prioridade — slots vazios mesmo que haja `doctor_schedule` para aquele dia. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Slot duration default: 30min | `doctor-schedule.entity.ts:25` |
| RB-02 | Protocolo ACOG/FEBRASGO — semanas de pré-natal: 8,12,16,20,24,28,30,32,34,36,37,38,39,40 | `auto-schedule.service.ts:15-19` |
| RB-03 | Auto-schedule: busca slot em janela de 14 dias seguintes à data ideal | `auto-schedule.service.ts:65` `daysToSearch=14` |
| RB-04 | Auto-schedule: skip se já existe appointment ±7d na mesma gestação | `auto-schedule.service.ts:53-62` |
| RB-05 | Primeira consulta pré-natal (8sem) = `type=CONSULTATION`; demais `FOLLOW_UP` | `auto-schedule.service.ts:78` |
| RB-06 | Categorias permitidas: primeira_consulta, retorno, particular, convenio, urgencia, encaixe | `appointment.enums.ts:19-26` |
| RB-07 | Status: scheduled, confirmed, arrived, in_progress, completed, cancelled, no_show | `appointment.enums.ts:1-9` |
| RB-08 | Overlap detection: `startTime < :endTime AND endTime > :startTime` no mesmo `doctorId`+`date`, excluindo cancelled/no_show | `appointments.service.ts:120-136` |
| RB-09 | Cron de lembretes: `0 8 * * *` (08:00 todos os dias, tz do servidor) | `appointment-reminder.service.ts:25` |
| RB-10 | Lembretes: 48h antes (`today+2`) e 24h antes (`today+1`) | `appointment-reminder.service.ts:31-35` |
| RB-11 | Idempotência de lembrete: flags `reminder48hSent` e `reminder24hSent` booleanas | `appointment.entity.ts:71-75` |
| RB-12 | Lembrete só dispara se `status IN (SCHEDULED, CONFIRMED)` | `appointment-reminder.service.ts:47` |
| RB-13 | Check-in QR usa `checkinToken` (unique, 8 chars upper-case conforme UI) | `appointment.entity.ts:107-109`, `CheckinPage.tsx:60-64` |
| RB-14 | Check-in idempotente: se `isCheckedIn=true` → 409 | `appointments.service.ts:143` |
| RB-15 | Check-in muda `status=ARRIVED` + `checkedInAt=now()` | `appointments.service.ts:144-147` |
| RB-16 | Documentos anexáveis no agendamento: cartão convênio + pedido de exame | `appointment.entity.ts:89-93` |
| RB-17 | CPF/CEP podem ser capturados no agendamento mesmo antes do cadastro completo | `appointment.entity.ts:95-99` |
| RB-18 | Bloqueios de data bloqueiam todos os slots daquele dia | `slot-generation.service.ts:28-30` |
| RB-19 | `bookedByPatient` é flag para diferenciar portal self-serve | `appointment.entity.ts:65-66` |

---

## 7. Saídas e efeitos

- **Cria/altera:** `doctor_schedules`, `doctor_blocked_dates`, `appointments`; flags de reminder; `isCheckedIn` em check-in.
- **Notificações disparadas:**
  - WhatsApp texto para paciente (lembretes).
  - Email para paciente (lembretes).
- **Integrações acionadas:** Meta WhatsApp API; SMTP.
- **Eventos emitidos:** nenhum formal; cron escreve diretamente.

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| Meta WhatsApp API | Lembretes 48h/24h | phone (dígitos), texto livre via `sendOTP` (hack) | Sim: log e continua (flag ainda é marcada — bug) |
| SMTP | Lembretes 48h/24h | email, subject, body | Sim: log e continua |

---

## 9. Critérios de aceitação

- [ ] Dado `doctor_schedules` segunda 08:00-12:00 slot 30min quando `GET /appointments/slots?date=<segunda>` então retorna 8 slots de 30min.
- [ ] Dado slot 10:00-10:30 ocupado então retorna `available=false` para aquele slot.
- [ ] Dado gestação criada com DUM hoje então auto-schedule cria ~14 appointments (uma para cada semana futura do protocolo).
- [ ] Dado tentar criar appointment sobrepondo existente então 409.
- [ ] Dado appointment amanhã às 14:00 e cron roda hoje 08:00 então WhatsApp é enviado E `reminder24hSent=true`.
- [ ] Dado cron roda duas vezes no mesmo dia (falha/retry) então não duplica mensagem (idempotente via flag).
- [ ] Dado appointment `status=cancelled` então não vira lembrete.
- [ ] Dado data bloqueada quando consulto slots então retorna `[]`.
- [ ] Dado appointment com `checkinToken='ABC12345'` quando `POST /appointments/checkin/ABC12345` então `status=arrived`.

---

## 10. Métricas de sucesso

- **No-show rate:** `no_show / completed+no_show`. Meta: <8% (baseline Brasil ~20%).
- **% gestantes com agenda pré-natal completa:** de DUM até semana atual, todas as consultas do protocolo presentes. Meta 95%.
- **Taxa de entrega de lembretes WhatsApp:** (enviados - falhados) / total. Meta >90%.
- **Slot utilization:** `appointments scheduled+confirmed / slots available` por dia. Meta 70-85%.
- **Tempo médio entre criação e primeira consulta:** meta <48h para primeira gineco, <24h para retornos.

---

## 11. Melhorias recomendadas na migração

- **`whatsAppService.sendOTP` é reusado como "enviar texto livre" — hack.** Criar `sendTemplateMessage(phone, template, vars)` respeitando que WhatsApp Business API só permite templates aprovados fora de 24h session. Criar templates `reminder_48h`, `reminder_24h`.
- **Flag de reminder marcada MESMO em falha.** Se WhatsApp retorna 500, flag vira true e retry nunca acontece. Corrigir: só marca após success explícito; adicionar `reminder_failed_at` + retry com backoff.
- **Cron em horário do servidor, não do tenant.** Multi-tenant com tenants em fusos diferentes (ex.: Manaus vs São Paulo) recebe lembrete fora do comercial. Parametrizar por `tenant.timezone` e usar agendamento por tenant.
- **Email reaproveita `sendOtpEmail`.** Mesmo vício. Criar `sendAppointmentReminderEmail` com template visual.
- **Auto-schedule não avisa se pulou semana.** Se em 14 dias não achou slot, pula silenciosamente. Deveria criar alerta longitudinal "gestante X não tem consulta na semana Y".
- **Janela ±7d pode gerar consultas em intervalos ruins.** Ex.: 28sem no dia D, 30sem em D+21 em vez de D+14. Melhorar com função custo que prefira aproximar do ideal.
- **Categorias hard-coded.** 6 categorias podem não bastar (teleconsulta, procedimento ambulatorial, pré-operatório). Tornar tabela `appointment_categories` por tenant com cor e label.
- **Sem preferências da paciente.** Paciente pode preferir manhã/tarde ou dias específicos. Adicionar `patient_preferences` e usar em `findNextAvailableSlot`.
- **Overlap check não considera buffer entre consultas.** Médico atende 30min mas quer 5min de buffer. Adicionar `schedule.buffer_min`.
- **Sem lista de espera.** Se slot vaga por cancelamento, ninguém é notificado. Criar `appointment_waitlist` e cron para preencher.
- **Check-in token não expira.** Token é unique pero perpétuo — se paciente aparece dias depois, check-in ainda funciona. Expirar 4h antes/depois da data.
- **Modelo de reminder rígido: 48h/24h.** Permitir preferência por paciente ("só 24h") e por tipo ("primeira_consulta manda 72h e 24h").
- **Calendário de procedimentos faz 7 queries raw sem tenant filter explícito.** Ver `procedures-calendar` — string interpolation de `doctorId` sem bind parameter.
- **Sem suporte a consultas recorrentes fora pré-natal.** Rastreio anual, controle de DMG — repetir manualmente. Criar protocolo genérico `RecurrenceRule`.
- **Portal paciente (auto-book) sem regras clínicas.** Paciente em climatério pode agendar "urgencia" ou "encaixe" livremente — deveria ser só retorno.
- **Status `arrived` não dispara ação.** Quando paciente faz check-in, médico não é avisado visualmente em tempo real (requer polling). Emitir evento WS.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/appointments/appointment.entity.ts` (118 linhas — todos os campos)
  - `backend/src/appointments/appointment.enums.ts` (status/type/category)
  - `backend/src/appointments/appointments.service.ts` (292 linhas — CRUD, overlap, checkin, procedures-calendar, secretary assignments)
  - `backend/src/appointments/appointments.controller.ts`
  - `backend/src/appointments/auto-schedule.service.ts` (104 linhas — protocolo ACOG)
  - `backend/src/appointments/appointment-reminder.service.ts` (97 linhas — cron 8am)
  - `backend/src/appointments/slot-generation.service.ts` (142 linhas — slots + bloqueios)
  - `backend/src/appointments/doctor-schedule.entity.ts` (DoctorSchedule + DoctorBlockedDate)
  - `backend/src/appointments/secretary-assignment.entity.ts`
  - `backend/src/appointments/appointment-alert.service.ts`
  - `backend/src/appointments/dto/create-appointment.dto.ts`
- Frontend:
  - `frontend/src/pages/reception/AgendaPage.tsx` (agenda visual por dia)
  - `frontend/src/pages/reception/NewAppointmentModal.tsx` (form com docs/convênio)
  - `frontend/src/pages/reception/ReceptionDashboardPage.tsx` (summary cards por status)
  - `frontend/src/pages/settings/DoctorScheduleSettings.tsx` (config de grade)
  - `frontend/src/api/appointments.api.ts` (CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, PROCEDURE_LABELS)
  - `frontend/src/api/secretary.api.ts`
- Migrations relevantes: `AddDoctorSchedule`, `AddAppointmentCategory`, `AddReminderFlags`, `AddCheckinToken`, `AddInsuranceFields`, `AddSecretaryAssignment`.
