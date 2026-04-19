# Modo Recepção (Dashboard da Secretária)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** alta
> **Depende de:** autenticação com role RECEPTIONIST (01), agendamento (11), cadastro paciente (03), multi-tenant (20)

---

## 1. Propósito

**Problema que resolve:** A secretária é a pessoa que mais usa o sistema em termos de tempo/tela, mas tradicionalmente recebe a pior UX: telas feitas para médico com campos clínicos embutidos, e ela teria acesso involuntário a dados sensíveis (diagnósticos, medicações). Além disso, em clínicas multi-médico, a secretária opera para um subconjunto de médicos, não para todos.

**Valor entregue:**
- Dashboard dedicado (`/reception`) com 3 abas: **Hoje** (agenda operacional), **Gestantes** (lista de gestantes dos médicos vinculados, filtro por trimestre e alto risco), **Ginecologia** (pacientes + calendário de procedimentos).
- **Vínculo secretária-médico N:N** via `secretary_assignments` — secretária só vê gestantes/pacientes dos médicos a quem está vinculada.
- Agendamento com **coleta obrigatória de documentação** (CPF, CEP, convênio via modal dedicado) que reduz retrabalho.
- Calendário de partos/procedimentos (incluindo coletas FIV, transferências, IIUs) para planejamento logístico.
- **Sem acesso a prontuário clínico** (SOAP, prescrições, laudos) — guardas no backend por role.

**Intenção do médico-fundador:** Separar o "operacional" do "clínico" com uma linha sólida por conformidade LGPD (minimização) e por UX. Clínica não é hospital — a secretária é braço-direito do médico e deveria ver "quem está grávida e em qual semana", mas nunca "qual contraceptivo a paciente usa".

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Secretária (RECEPTIONIST) | Dona do dashboard | Login → redirect a `/reception` |
| Admin (ADMIN) | Cria vínculos secretária-médico | `POST /appointments/assignments` |
| Médico | Pode ver suas secretárias vinculadas | `GET /appointments/assignments/my-secretaries` |

**Pré-condições:**
- Usuário com `role=RECEPTIONIST`.
- Pelo menos um `SecretaryAssignment` ativo (senão exibe aviso "voce ainda nao foi vinculada a nenhum medico").

---

## 3. Dados de entrada

**Via vínculo:** `secretaryId` (JWT), `doctorIds[]` (derivado de `getDoctorIdsForSecretary`).

**Agendamento (modal):**
- `patientId` (ou criar paciente novo com CPF/nome/phone)
- `doctorId` (dentre os vinculados)
- `date`, `startTime`, `endTime`
- `type`, `category` (primeira_consulta, retorno, particular, convenio, urgencia, encaixe)
- `insuranceType?`, `insuranceProvider?`, `insuranceMemberId?`, `insurancePlan?`, `insuranceCardUrl?` (upload)
- `examRequestUrl?` (upload de pedido médico)
- `patientCpf?`, `patientCep?` (capturáveis no momento)
- `documentsConfirmed` (bool — checkpoint explícito)
- `notes?`

---

## 4. Fluxo principal (happy path)

1. **Login secretária** — role RECEPTIONIST → redirect `/reception`.
2. **Fetch vínculos** — `useQuery(['my-doctors'])` chama `GET /appointments/assignments/my-doctors` → retorna `[{ doctorId, doctorName, doctorEmail, specialty }]`.
3. **Sem vínculos** — banner amarelo "Você ainda não foi vinculada a nenhum médico" com instrução de solicitar ao admin.
4. **Com vínculos, aba Hoje** — cards de resumo (`fetchAppointmentSummary`): total, confirmadas, aguardando, canceladas/faltas.
5. **Lista do dia** — `fetchAppointments({ date: today })` mostra appointments dos médicos vinculados, agrupados por médico ou em lista única com chip de cor por `category`. Cada linha: paciente, hora, tipo, status, botões "Confirmar / Cancelar / Marcar chegada".
6. **Mudar status** — `updateAppointment(id, { status })` → invalidate query → toast "Status atualizado".
7. **Nova paciente + agendamento** — botão "+ Agendar" abre `NewAppointmentModal`:
   - Escolhe paciente existente (search) OU cria novo (nome + CPF + phone mínimos).
   - Escolhe médico (dropdown entre `doctorIds` vinculados).
   - Escolhe data → `GET /appointments/slots?doctorId&date` → mostra slots livres.
   - Escolhe categoria (pill colorida).
   - Preenche docs: convênio (se `particular` ou `convenio`) + upload do cartão + pedido de exame.
   - Marca `documentsConfirmed` quando revisou.
   - `POST /appointments` → overlap check → cria.
8. **Aba Gestantes** — `fetchPregnanciesForDoctors(doctorIds, 'active', search?)`. Filtros: "Todas / 1º Tri / 2º Tri / 3º Tri / Alto Risco". Card por gestante mostra: nome, IG (semanas), DPP, flag high-risk, progresso visual (cor por trimestre: emerald <14, amber <28, orange ≥28).
9. **View calendário Gestantes** — toggle list↔calendar; `fetchUpcomingBirths(120)` carrega próximos 120 dias de DPPs; marca no calendário.
10. **Aba Ginecologia** — `fetchGynecologyPatientsForDoctors(doctorIds)` lista pacientes gineco ativas. Toggle **patients↔procedures** abre calendário de procedimentos mensal: coletas FIV, transferências, triggers, beta-HCG, IIUs, triggers IO — com chips coloridos por `PROCEDURE_LABELS`.
11. **Sem acesso clínico** — clicar em nome de paciente abre visão reduzida (nome, DPP, médico, próxima consulta); campos SOAP, receitas, laudos não aparecem. Tentativa de acessar rota `/patients/:id` clínica retorna 403 (guard por role).

```
  Login (RECEPTIONIST) → /reception
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
           Hoje         Gestantes     Ginecologia
       (agenda ops)   (protoc tri)   (+procedures cal)
              │             │             │
              └──────────► Nova consulta (modal com docs)
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Secretária sem vínculos | Banner amarelo; agendar fica desabilitado (ou só cria pacientes sem médico) |
| Admin remove vínculo | `isActive=false`; query `getAssignedDoctors` filtra e secretária deixa de ver pacientes daquele médico no próximo refetch |
| Re-vincular secretária previamente desvinculada | `assignSecretary` reativa `isActive=true` em vez de duplicar linha |
| Tentativa de vincular mesmo par `secretaryId+doctorId` ativo | 409 "Secretaria ja vinculada a este medico" |
| Secretária tenta acessar prontuário clínico | 403 via RolesGuard (convenção) |
| Agendar sem `documentsConfirmed` | Permitido hoje (não enforced). GAP — ver Melhorias. |
| Upload de cartão de convênio falha | Agendamento ainda é salvo sem url — médico verá gap |
| Agendar paciente nova sem CPF | 400 da validação da paciente |
| Busca gestantes com `search` muito curto | Backend decide (prefixo ILIKE) |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Vínculo é N:N via `secretary_assignments(secretary_id, doctor_id, is_active)` | `secretary-assignment.entity.ts` |
| RB-02 | Vincular par já ativo: 409 | `appointments.service.ts:221-227` |
| RB-03 | Desvincular: soft delete via `is_active=false`, não deleta | `appointments.service.ts:233-237` |
| RB-04 | Secretária só vê dados de médicos com `isActive=true` | `getAssignedDoctors` + consumo no frontend |
| RB-05 | Secretária sem acesso clínico (prontuário, receitas) | RolesGuard por endpoint (convenção) |
| RB-06 | 3 abas: `today`, `gestantes`, `ginecologia` | `ReceptionDashboardPage.tsx:23` |
| RB-07 | Cor do trimestre: <14sem emerald, <28sem amber, ≥28sem orange | `ReceptionDashboardPage.tsx:34` |
| RB-08 | Filtros de trimestre: `all`, `1`, `2`, `3`, `high_risk` | `ReceptionDashboardPage.tsx:25-31` |
| RB-09 | Calendário de partos: janela de 120 dias | `fetchUpcomingBirths(120)` |
| RB-10 | Calendário de procedimentos agrega 7 fontes: oocyte_retrieval, transfer, trigger FIV, beta_hcg FIV, stimulation_start FIV, iui, trigger IO | `appointments.service.ts:157-208` |
| RB-11 | Greeting por hora: <12h "Bom dia", <18h "Boa tarde", senão "Boa noite" | `ReceptionDashboardPage.tsx:108` |
| RB-12 | Summary refresh pode usar `refetchInterval` no frontend | convenção React Query |
| RB-13 | Agendamento aceita `insurance*` e anexos; não obriga `documentsConfirmed=true` | `appointment.entity.ts:77-111` (nullable) |

---

## 7. Saídas e efeitos

- **Cria/altera:**
  - `appointments` (create/update) com docs de convênio e CPF/CEP.
  - `patients` quando nova paciente é criada inline.
  - `secretary_assignments.isActive` quando admin gerencia vínculos.
- **Notificações disparadas:** nenhuma própria — agendamento novo dispara reminders via cron (fluxo 11).
- **Integrações acionadas:** upload de imagens (convênio, pedido) para storage.
- **Eventos emitidos:** nenhum formal.

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa? |
|---|---|---|---|
| Storage (S3/minio/local) | Upload de `insuranceCardUrl`, `examRequestUrl` | multipart file | Sim: agendamento salva sem URL se upload falhar |
| WhatsApp (lembretes) | Consequente, pelo cron | — | — |

---

## 9. Critérios de aceitação

- [ ] Dado secretária com 2 médicos vinculados então vê appointments de ambos em "Hoje".
- [ ] Dado 3º médico criado e vinculado então refetch mostra appointments dele sem reload.
- [ ] Dado vínculo removido então appointments daquele médico somem da lista.
- [ ] Dado gestante 10sem de médico vinculado então aparece na aba Gestantes com chip emerald (1º tri).
- [ ] Dado filtro "Alto Risco" então só gestantes com `riskLevel='high'` aparecem.
- [ ] Dado ciclo FIV com `transfer_date` este mês então aparece no calendário de procedimentos com label "Transferencia".
- [ ] Dado secretária acessa `/patients/:id/consultations` então recebe 403.
- [ ] Dado agendamento com `insuranceCardUrl` preenchido então URL é renderizada como imagem clicável na agenda.

---

## 10. Métricas de sucesso

- **% agendamentos com `documentsConfirmed=true`:** meta 80%.
- **Tempo médio de agendamento no modal:** meta <90s para paciente existente, <180s para nova.
- **Redução de consultas sem convênio confirmado que viram glosa:** meta -50% (vs baseline sem coleta obrigatória).
- **NPS da secretária:** pesquisa trimestral. Meta ≥8.
- **% vínculos com `is_active=true`:** saneamento; meta 95%.

---

## 11. Melhorias recomendadas na migração

- **Vínculo secretária-médico precisa passar pelo admin.** Permitir que médico convide direto (fluxo 20) com approval 1-clique da secretária. Reduz gargalo.
- **`documentsConfirmed` não é enforced.** Tornar gate no botão "Confirmar agendamento" se `category in [convenio]`.
- **Agendamento não permite criar paciente com "nome social" separado de nome civil.** Adicionar campo `socialName` no fluxo de criação rápida.
- **Calendário de procedimentos faz 7 queries SQL raw interpoladas.** Risco de SQLi + performance. Criar view materializada `procedures_calendar_vw` com refresh incremental.
- **Aba "Hoje" não mostra check-ins em tempo real.** Depende de polling — evento WS `appointment.arrived` melhoraria (ver fluxo 12).
- **Sem indicador visual de "paciente no consultório há >X minutos".** Adicionar chip "aguardando há 15min" após `checkedInAt`.
- **Upload de cartão de convênio sem OCR.** Integrar Claude Vision para extrair `insuranceProvider`, `memberId`, `plan` automaticamente.
- **Falta "repetir convênio".** Quando paciente já fez convênio antes, preencher automaticamente na próxima consulta.
- **Busca de gestantes sem debouncing explícito.** Backend recebe request a cada tecla — adicionar debounce 300ms client + índice trigram server.
- **Aba ginecologia mistura lista de pacientes com calendário.** UX confusa; separar em rotas ou submenus.
- **Cor por trimestre em apenas 3 faixas.** Obstetras pedem mais granularidade (ex.: 36+ laranja intenso, 39+ vermelho). Parametrizar.
- **Sem fila virtual por médico.** Secretária chama pacientes na ordem; sistema poderia sugerir reordenação (ex.: paciente ARRIVED primeiro + no_show do anterior).
- **Sem exportação da agenda do dia.** PDF imprimível com pacientes e convênios pedido por clínicas tradicionais.
- **Sem visão consolidada de "o que falta" para cada consulta do dia.** Mostrar checklist: convênio OK, cartão SUS OK, pedido de exame OK.
- **Conflito de multiplos vínculos.** Se médico A e médico B compartilham secretária e têm consulta no mesmo slot em salas diferentes, nada indica — assumir `doctor_schedule` é isolado.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/appointments/appointments.service.ts:220-273` (assignSecretary, removeAssignment, getAssignedDoctors, getAssignedSecretaries, getDoctorIdsForSecretary)
  - `backend/src/appointments/appointments.service.ts:150-217` (procedures-calendar com 7 queries)
  - `backend/src/appointments/secretary-assignment.entity.ts` (modelo N:N)
  - `backend/src/appointments/appointments.controller.ts` (endpoints assignments)
  - `backend/src/patients/patients.service.ts` (criar paciente inline)
- Frontend:
  - `frontend/src/pages/reception/ReceptionDashboardPage.tsx` (tela principal — 3 abas, filtros)
  - `frontend/src/pages/reception/AgendaPage.tsx`
  - `frontend/src/pages/reception/ReceptionPatientsPage.tsx`
  - `frontend/src/pages/reception/NewAppointmentModal.tsx`
  - `frontend/src/api/appointments.api.ts` (STATUS_LABELS, CATEGORY_LABELS, PROCEDURE_LABELS com cores)
  - `frontend/src/api/secretary.api.ts` (fetchMyDoctors, fetchPregnanciesForDoctors, fetchGynecologyPatientsForDoctors)
  - `frontend/src/api/pregnancies.api.ts` (fetchUpcomingBirths)
  - `frontend/src/store/auth.store.ts` (role RECEPTIONIST)
  - `frontend/src/utils/formatters.ts` (toTitleCase)
- Migrations: `AddSecretaryAssignment`, `AddInsuranceFieldsToAppointments`, `AddDocumentsConfirmed`.
