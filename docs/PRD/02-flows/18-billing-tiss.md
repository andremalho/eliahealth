# Faturamento TISS

> **Status atual no EliaHealth:** implementado (MVP funcional, sem geração de XML TISS real)
> **Prioridade na migração:** alta (obrigatório para monetização B2B em clínica particular e hospital)
> **Depende de:** cadastro de pacientes (com convênio), módulo de procedimentos/consultas, tenant multi-unidade, RBAC (médico/admin)

---

## 1. Propósito

**Problema que resolve:** o faturamento de convênios no Brasil é lento, manual e erros de guia geram glosas que comprometem 10–25% da receita das clínicas. Hoje o médico/secretária preenchem guias TISS em PDFs externos, perdem o rastreio do ciclo (enviado → pago) e não têm visibilidade agregada do que está preso na operadora.

**Valor entregue:**
- **Para a clínica:** ciclo completo da guia dentro do prontuário, com dashboard financeiro (faturado × recebido × glosado) e alertas de guias paradas.
- **Para o médico:** abre uma consulta/procedimento e o sistema já pré-preenche a guia com TUSS esperado.
- **Para o financeiro:** fluxo draft → enviada → aprovada/glosada → paga, com razão de glosa registrada para recurso.

**Intenção do médico-fundador:** dar a clínicas pequenas e consultórios o mesmo nível de controle financeiro que operadoras e hospitais de grande porte têm, sem depender de sistemas de gestão separados (HiDoctor + sistema de faturamento). Integrar o faturamento ao ato clínico reduz perdas por procedimento não lançado.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico | Cria e revisa a guia com procedimentos TUSS executados | Salva uma consulta / laudo USG / alta hospitalar |
| Admin / financeiro | Envia para convênio, marca pago, registra glosa, exporta relatórios | Aba "Faturamento" no dashboard |
| Secretária (receptionist) | Confere dados do convênio no check-in (number of the card, autorização) | Fluxo de check-in QR |
| Sistema (cron) | Alerta guias há > 30d sem retorno do convênio | Job diário (futuro) |

**Pré-condições:**
- Paciente com convênio cadastrado (ou marcado como particular).
- Procedimentos TUSS disponíveis (tabela interna — hoje manual, ver Melhorias).
- Usuário com role `PHYSICIAN` ou `ADMIN` (único endpoint guardado hoje).
- `tenantId` presente no JWT — todas as guias são isoladas por tenant.

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| `patientId` | UUID | Contexto da consulta/procedimento | Sim |
| `guideType` | enum {`sadt`, `consultation`, `hospitalization`, `honor`} | Seleção do usuário ou inferido pelo tipo de atendimento | Sim |
| `guideNumber` | string | Gerado pela operadora após envio (preenchido manualmente) | Não (pós-envio) |
| `insuranceProvider` | string | Cadastro da paciente | Não (particular permitido) |
| `insuranceMemberId` | string | Cadastro da paciente | Se convênio |
| `authorizationNumber` | string | Secretária após pré-autorização | Depende do procedimento |
| `procedures[]` | jsonb `{ tussCode, description, quantity, unitValue, totalValue }` | Preenchido pelo médico | Sim (≥ 1) |
| `serviceDate` | date | Data da execução | Sim |
| `notes` | text | Observações livres | Não |
| `paidValue` | decimal | Repasse efetivo do convênio | No momento do pagamento |
| `denialReason` | text | Código/descrição da glosa | Só se glosada |

`totalValue` é recalculado sempre no backend a partir de `procedures[]` (soma de `totalValue` por item) — nunca confiar no valor enviado pelo cliente.

---

## 4. Fluxo principal (happy path)

1. **Consulta/procedimento finalizado** — médico salva um atendimento; UI oferece "Gerar guia de faturamento" com TUSS pré-selecionado por tipo de consulta.
2. **Rascunho** — `POST /billing` cria registro com `status=draft`, `tenantId` injetado do JWT.
3. **Revisão financeira** — admin/secretária abre aba "Faturamento → Rascunhos", valida procedimentos, autorização e valores.
4. **Envio para operadora** — `POST /billing/:id/submit` → `status=submitted`, `submittedAt=now()`. (Na v1 o envio XML TISS real é manual/fora do sistema.)
5. **Retorno do convênio** — operadora envia aprovação/glosa (manual).
6. **Marcar pago** — `POST /billing/:id/paid { paidValue }` → `status=paid`, `paidAt=now()`.
7. **OU registrar glosa** — `POST /billing/:id/deny { reason }` → `status=denied`, `denialReason` preenchido.
8. **Recurso (opcional)** — admin reclassifica para `appealed` editando o registro (não há endpoint dedicado hoje).
9. **Dashboard** — `GET /billing/summary` agrega `total_billed`, `total_received`, `total_denied`, counts por status; UI `BillingPage.tsx` exibe 4 stat cards + abas (Todas / Rascunhos / Enviadas / Glosadas / Pagas).

```
[Consulta/USG/alta]  →  [Rascunho]
                           │
                    (admin revisa)
                           ↓
                      [Enviada] ──────────┐
                           │              │
                     (aprovada)       (glosada)
                           ↓              ↓
                        [Paga]         [Glosada]
                                          │
                                  (recurso/correção)
                                          ↓
                                      [Enviada]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Paciente particular | `insuranceProvider=null`; guia serve só de controle interno de receita. |
| Autorização pendente na execução | Guia fica `draft`, secretária liga para operadora e preenche `authorizationNumber` antes de enviar. |
| Procedimento sem código TUSS | Hoje digitado livre (campo `description`); deveria bloquear (ver Melhorias). |
| Glosa parcial | `paidValue < totalValue` e `denialReason` preenchido com o item glosado; status fica em `paid` (perda). |
| Paciente sem convênio cadastrado | UI deve alertar antes de criar guia de tipo não-`honor`. |
| Deleção / edição pós-pagamento | Não há guard — admin pode editar. Em produção, `status=paid` deveria bloquear edições (ver Melhorias). |
| Tenant cruzado | `findAll` filtra por `tenantId` do usuário; `findByPatient` hoje **não filtra** por tenant (ver Melhorias). |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | `status` inicial é sempre `draft`, setado no service (ignora valor enviado pelo cliente). | `billing.service.ts#create` |
| RB-02 | `totalValue` é recalculado a partir de `procedures[]` em `create` e `update`. | `billing.service.ts#create,update` |
| RB-03 | `submittedAt` é setado automaticamente em `submit()`, não aceito do cliente. | `billing.service.ts#submit` |
| RB-04 | `paidAt`, `paidValue` setados em `markPaid()`; `denialReason` em `deny()`. | `billing.service.ts#markPaid,deny` |
| RB-05 | Apenas roles `PHYSICIAN` e `ADMIN` acessam o controller. | `billing.controller.ts#@Roles` |
| RB-06 | Listagem é filtrada por `tenantId` do usuário atual. | `billing.service.ts#findAll` |
| RB-07 | Guide types válidos: `sadt`, `consultation`, `hospitalization`, `honor`. | `billing.entity.ts#GuideType` |
| RB-08 | Transições de status válidas (produto): `draft→submitted→{approved,denied}→{paid,appealed}`; `appealed→submitted`. | decisão de produto (não formalizada hoje) |
| RB-09 | Pacientes cascateiam (`onDelete: CASCADE`): ao apagar paciente, as guias vão junto — problemático para auditoria fiscal (ver Melhorias). | `billing.entity.ts` |

---

## 7. Saídas e efeitos

- **Cria/altera:** `billing_records` (1 linha por guia).
- **Notificações disparadas:** nenhuma hoje. Oportunidade: email/in-app quando guia > 30d sem retorno.
- **Integrações acionadas:** campo `tissXml` existe mas não é populado — ponto de integração futura com operadoras via padrão TISS 4.x.
- **Eventos emitidos:** nenhum; não publica em WS nem dispara cron.

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| Operadora (padrão TISS XML) | Não implementado (planejado) | Guia + procedimentos TUSS + beneficiário | N/A |
| Memed / eReceita | Não integrado ao billing hoje | — | — |
| Export PDF (pdfkit) | Futuro: gerar guia impressa em A4 | Payload igual ao `BillingRecord` | N/A |

---

## 9. Critérios de aceitação

- [ ] Dado um médico autenticado em tenant A, quando cria uma guia, então ela nasce em `draft` com `tenantId=A`.
- [ ] Dada uma guia com 3 procedimentos de 100/200/50, então `totalValue=350` no banco, mesmo que o cliente envie 999.
- [ ] Dado uma guia em `draft`, quando médico chama `/submit`, então status vira `submitted` e `submittedAt` é setado ao momento atual.
- [ ] Dado uma guia `submitted`, quando `/paid { paidValue: 300 }` é chamado, então status vira `paid`, `paidAt=now()`, `paidValue=300`.
- [ ] Dado uma guia qualquer, quando `/deny { reason: "código X" }`, então status vira `denied` com `denialReason` armazenado.
- [ ] Dado admin do tenant A, quando lista guias, então só vê guias do tenant A (não vaza B).
- [ ] Summary retorna corretamente `total_billed`, `total_received`, `total_denied` e counts por status.

---

## 10. Métricas de sucesso

- **Taxa de glosa:** `denied / submitted` — meta ≤ 8% (benchmark ANS).
- **Tempo médio enviada→paga:** (média `paidAt - submittedAt`) — meta ≤ 45 dias.
- **Cobertura de lançamento:** % de consultas/USG com guia gerada — meta 95% em convênio.
- **Valor preso (DSO):** `total_billed - total_received` em aberto há > 60d.

---

## 11. Melhorias recomendadas na migração

- **Tabela TUSS oficial** — hoje `tussCode` é string livre. Importar `TUSS 22` (procedimentos e eventos em saúde da ANS) como tabela seedada e virar FK/autocomplete no frontend.
- **Geração de XML TISS real** — implementar schema XSD TISS 4.x (atualmente `tissXml` é campo vazio). Enviar via API de operadora ou gerar arquivo para upload manual.
- **Máquina de estados explícita** — hoje qualquer status pode ir para qualquer outro via `PATCH`. Implementar guard nas transições (`draft→submitted→paid|denied→appealed→submitted`).
- **Imutabilidade pós-pagamento** — bloquear `PATCH` quando `status=paid` (exigir estorno formal).
- **Isolamento tenant em `findByPatient`** — hoje não filtra (vazamento potencial entre unidades).
- **Soft delete + preservação fiscal** — LGPD + Receita: guia paga não pode ser apagada em cascata com paciente.
- **Recorrência** — pré-natal tem ~10 consultas; gerar guias recorrentes a partir do schedule obstétrico.
- **Glosa estruturada** — `denialReason` vira enum de códigos ANS + campo livre. Facilita dashboard de "top motivos de glosa" e automação de recurso.
- **Webhooks de operadora** — receber aprovação/glosa automaticamente via integração.
- **Conciliação financeira** — cruzar `paidValue` com extrato bancário/boletos da operadora.
- **Audit log dedicado** — toda mudança de status precisa logar quem fez (hoje `AuditInterceptor` global pega, mas não linka à linha).
- **Relatório por prestador/procedimento** — hoje só `summary` global; faltam dashboards de produtividade individual.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/billing/billing.entity.ts` — entidade + enums `BillingStatus`, `GuideType`.
  - `backend/src/billing/billing.service.ts` — CRUD, transições de status, `getSummary` raw SQL.
  - `backend/src/billing/billing.controller.ts` — endpoints REST.
  - `backend/src/billing/billing.module.ts` — wiring NestJS.
- Frontend:
  - `frontend/src/pages/billing/BillingPage.tsx` — dashboard com stats + abas por status.
  - `frontend/src/api/billing.api.ts` — axios client, `STATUS_LABELS`, `STATUS_COLORS`.
- Endpoints: `POST /billing`, `GET /billing`, `GET /billing/summary`, `GET /billing/patient/:patientId`, `GET /billing/:id`, `PATCH /billing/:id`, `POST /billing/:id/submit`, `POST /billing/:id/paid`, `POST /billing/:id/deny`.
- Migration: a tabela `billing_records` nasce junto ao núcleo — checar `backend/src/migrations/` por `Billing` ou `billing_records`.
