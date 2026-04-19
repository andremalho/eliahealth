# Hospitalização (admissão, evolução, alta)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** alta (obrigatório em unidades hospitalares)
> **Depende de:** 01-cadastro-paciente, opcional 04-prenatal (gestantes internadas)

---

## 1. Propósito

**Problema que resolve:** hospitais-maternidade e casas de parto usam sistemas fragmentados (MV, Tasy, Soul MV) que não falam com o ambulatorial — gestante internada para pré-eclâmpsia grave perde o fio da história ambulatorial, e a equipe hospitalar não vê o histórico do pré-natal. Evoluções em papel, sem alerta automático de PA crítica, febre, oligúria ou hipoxemia.

**Valor entregue:** módulo `hospitalization` com admissão vinculada ao mesmo `patient_id` do ambulatorial (preserva longitudinal), evolução diária com 4 tipos (`medical`, `nursing`, `puerperal`, `surgical`), alta com resumo/diagnóstico/orientações estruturados, alertas automáticos de PA crítica, febre, hipoxemia e oligúria em cada evolução salva.

**Intenção do médico-fundador:**
- Internação **herda** o prontuário ambulatorial — mesma `patient_id`, mesma timeline. `findByPatient` lista hospitalizações por paciente (`hospitalization.service.ts:31-37`).
- Evolução NÃO é campo de texto único — é `authorId` + tipo + SOAP + sinais vitais. Permite 3 autores diferentes no mesmo dia (médico + enfermagem + fisio).
- `evaluateAlerts` roda a cada evolução salva e grava em `alerts` jsonb; a IA (copiloto) consome via `findActive` ou queries agregadas.
- Alta só existe se `status=ACTIVE` — tenta alta de paciente já desligado retorna `BadRequestException`.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Médico plantonista / atendente | Admissão + evoluções médicas + alta | Paciente chega (TPP, PE grave, cesárea eletiva, laparoscopia etc.) |
| Enfermeira | Evoluções de enfermagem (sinais vitais de hora/hora, balanço hídrico, curativos) | Durante plantão |
| Anestesista / cirurgião | Evolução cirúrgica (pré e pós-operatória) | Em procedimento |
| Médico gestante (responsável) | Evolução puerperal pós-parto | Diária até alta |

**Pré-condições:**
- Paciente cadastrada.
- Unidade configurada como `hospital` ou `hospital+consultorio` no tenant preset.

---

## 3. Dados de entrada

### Admissão
| Campo | Tipo | Obrigatório |
|---|---|---|
| `patientId`, `attendingDoctorId` | uuid | Sim |
| `admissionDate` | timestamp | Sim |
| `admissionReason`, `admissionDiagnosis` | text | Sim |
| `admissionType` | enum (planned/emergency/referred) | Sim |
| `bedNumber`, `wardName` | text | Recomendado |
| `pregnancyId` | uuid | Se gestante |

### Evolução (4 tipos)
| Campo | Tipo | Obrigatório |
|---|---|---|
| `hospitalizationId`, `authorId`, `evolutionType` | uuid + enum (medical/nursing/puerperal/surgical) | Sim |
| `evolutionDate` | timestamp | Sim |
| SOAP (`subjective`, `objective`, `assessment`, `plan`) | text | Recomendado |
| `bpSystolic/Diastolic`, `temperature`, `heartRate`, `respiratoryRate`, `spo2` | sinais vitais | Sim |
| `painScore` (0-10) | int | Sim |
| `diuresisMl` (mL/h), `intakeMl` (mL/h) | int | Em UTI/pós-op |
| Campos puerperais: `uterineInvolution`, `lochiaType/Amount`, `breastCondition` | enums | Tipo puerperal |
| Campos cirúrgicos: `procedure`, `anesthesia`, `complications`, `drains` | text | Tipo surgical |

### Alta
| Campo | Tipo | Obrigatório |
|---|---|---|
| `dischargeSummary` | text | Sim |
| `dischargeDiagnosis` | text | Recomendado |
| `dischargeInstructions` | text | Recomendado |

---

## 4. Fluxo principal

1. **Admissão** — `POST /hospitalizations` com motivo, diagnóstico inicial, leito, médico atendente. Status=`ACTIVE`. Se paciente com gestação ativa, vincular `pregnancyId`.
2. **Evoluções diárias (N)** — `POST /hospitalizations/:id/evolutions` com `evolutionType`. `authorId` do usuário autenticado. `evaluateAlerts` roda e preenche `alerts` jsonb:
   - PA ≥160/110 → `critical` emergência hipertensiva.
   - PA ≥140/90 → `urgent` monitorar.
   - Temperatura ≥38 → `urgent` investigar foco infeccioso.
   - SpO2 <92 → `critical` hipoxemia.
   - Diurese <30mL/h → `urgent` oligúria, avaliar função renal.
3. **Consulta evoluções** — `GET /hospitalizations/:id/evolutions` ordenado por `evolutionDate DESC` com `author` incluído.
4. **Atualizar evolução** — permitido, re-executa `evaluateAlerts`.
5. **Alta** — `POST /hospitalizations/:id/discharge` com `dischargeSummary` + opcional diagnóstico/instruções. Status=`DISCHARGED`, `dischargeDate=now()`. Tentar alta de paciente já desligado → 400.
6. **Integração com ambulatorial** — timeline do paciente mostra internação; se gestante, puerpério pode ser continuado ambulatorialmente via fluxo 05.
7. **Faturamento TISS** — admissão dispara guia de internação, procedimentos TUSS, diária por dia (módulo `billing` separado).

```
[Admissão ACTIVE]
   ↓
[Evolução médica] ← [Evolução enfermagem] ← [Evolução puerperal] ← [Evolução cirúrgica]
   (cada uma roda evaluateAlerts e preenche alerts jsonb)
   ↓
[Alta DISCHARGED + resumo + orientações]
   ↓
[Continua no ambulatorial via timeline do paciente]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Transferência inter-hospitalar | Alta com `dischargeSummary=Transferência para...`; nova hospitalização em outro tenant (via FHIR/RNDS se integrado) |
| Óbito | Status deveria ter valor `DIED` — **hoje só há `ACTIVE`/`DISCHARGED`**, gap |
| Internação <24h (observação) | Mesmo fluxo, admissão + alta no mesmo dia |
| Alta contra parecer médico | Registrar no `dischargeSummary` + anotar recusa |
| PA 165/115 persistente por 3 evoluções | Copiloto deveria sugerir escalada (não implementado) |
| Cesárea de emergência | Admissão `admissionType=emergency`, evolução cirúrgica + evolução puerperal + alta com orientações pós-op |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | PA ≥160/110 em evolução = `critical` emergência hipertensiva | `hospitalization.service.ts:101-102` |
| RB-02 | PA ≥140/90 = `urgent` monitorar | `hospitalization.service.ts:103-104` |
| RB-03 | Temperatura ≥38°C = `urgent` investigar foco infeccioso | `hospitalization.service.ts:106-107` |
| RB-04 | SpO2 <92% = `critical` hipoxemia | `hospitalization.service.ts:108-109` |
| RB-05 | Diurese <30 mL/h = `urgent` oligúria | `hospitalization.service.ts:110-111` |
| RB-06 | Alta só de hospitalização `ACTIVE`; tentativa duplicada → 400 | `hospitalization.service.ts:47` |
| RB-07 | Pré-eclâmpsia grave internada: sulfato de Mg 4-6g ataque + 1-2g/h manutenção; anti-hipertensivo (hidralazina, nifedipina, labetalol); avaliação fetal | FEBRASGO 2023 / ACOG PB 222 |
| RB-08 | HELLP confirmada: internar em UTI, corticoide se plaq <50k, avaliar interrupção >34s | FEBRASGO 2023 |
| RB-09 | TPP 24-34s: corticoide (betametasona 12mg IM 2 doses), tocolítico (atosiban/nifedipina) | |
| RB-10 | RPMO <34s: conduta expectante + ATB (ampi+azitro); >34s interrupção ativa | ACOG |
| RB-11 | Sepse puerperal: ATB amplo espectro <1h do diagnóstico (ampi+genta+clinda), controle foco | |
| RB-12 | Tromboprofilaxia pós-cesárea: HBPM 40mg/dia se fatores de risco (obesidade, imobilização, trombofilia, cesárea de emergência) | RCOG 37a |
| RB-13 | Cesárea: antibiótico profilático (cefazolina 2g) até 60min pré-incisão | |
| RB-14 | Perda hemática pós-parto >500mL vaginal ou >1000mL cesárea = hemorragia; ocitocina 10 UI + massagem; escalonar: misoprostol, metilergometrina, balão intrauterino, histerectomia | FIGO 2022 |

---

## 7. Saídas e efeitos

- **Cria/altera:** `hospitalizations`, `evolutions`, `prescriptions` (medicações internas), `lab_results` (exames internos), `ultrasound_reports` (USG à beira leito).
- **Notificações:** alta gera resumo paciente via WhatsApp/email; durante internação pode-se acionar chat médico-paciente.
- **Integrações:** billing TISS (guias), FHIR/RNDS (opcional), Memed (rx alta).

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa |
|---|---|---|---|
| Billing TISS | Admissão + alta + procedimentos | Guia XML | Sim — fatura manual |
| FHIR/RNDS | Registro de internação | Encounter resource | Sim — local só |
| Claude | Resumo de alta leigo para paciente (Fase 1) | Texto da alta | Sim |

---

## 9. Critérios de aceitação

- [ ] Dada evolução com PA 165/112, alerta `critical` "PA severamente elevada — emergencia hipertensiva".
- [ ] Dada evolução com SpO2=89, alerta `critical` hipoxemia.
- [ ] Dada diurese 20mL/h, alerta `urgent` oligúria.
- [ ] Tentar alta de paciente já desligado retorna 400 "Paciente ja teve alta".
- [ ] Evolução puerperal em gestação-outcome com `lochiaOdor=true` aparece timeline.
- [ ] Admissão com `pregnancyId` aparece no prontuário da gestação (timeline ordenada).

---

## 10. Métricas de sucesso

- **Tempo médio de evolução por paciente:** **Meta:** ≥1 evolução médica + 2 enfermagem/dia.
- **Taxa de alerta crítico resolvido em <1h:** tempo entre alerta em evolução e próxima evolução que documenta conduta. **Meta:** 80% em <1h.
- **Duração média de internação por motivo:** benchmarking (cesárea eletiva <48h; pré-eclâmpsia grave 5-7d; TPP variável).
- **Taxa de reinternação 30d:** **Meta:** <5%.
- **Aderência à tromboprofilaxia pós-cesárea** (quando indicada): **Meta:** >90%.

---

## 11. Melhorias recomendadas na migração

- **Flowsheet hospitalar estilo ICU** — hoje `GET /evolutions` retorna lista. Criar grade horária (linha=hora, coluna=parâmetro) com sinais vitais de enfermagem: PA, FC, FR, SpO2, temp, diurese, dor. Esse é o padrão de UTI/pós-op e hoje não existe.
- **Escores de gravidade** — adicionar MEOWS (Modified Early Obstetric Warning Score), qSOFA, NEWS2 calculados automaticamente a cada evolução. Hoje só há alertas isolados.
- **Status `DIED`** — gap. Adicionar ao enum `AdmissionStatus`.
- **Prescrição hospitalar estruturada** — módulo `prescriptions` é ambulatorial. Hospitalar precisa de dose/via/frequência estruturados + prescrição diária obrigatória (revalidar 24h).
- **Balanço hídrico visual** — campo `intakeMl` e `diuresisMl` existem mas sem gráfico. Adicionar resumo 24h (entrada − saída) com alerta de balanço positivo em PE.
- **Evolução multi-autor na mesma tela** — hoje cada evolução é um POST separado. Permitir 3 autores editarem o mesmo documento por turno (médico+enfermagem+fisio) com seções distintas.
- **Templates de evolução por contexto** — "Evolução pós-cesárea D1", "Evolução pré-eclâmpsia em uso de sulfato", "Evolução TPP em tocólise" com campos obrigatórios + valores de referência. Hoje é texto livre.
- **Resumo de alta gerado por IA** — atual `dischargeSummary` é texto livre do médico. Usar Claude para compilar a partir das evoluções + admissão + exames + prescrições, e médico revisa.
- **Integração com bombas de infusão / monitores** — CFTV / sinais vitais por Bluetooth para alimentar evoluções automaticamente.
- **Dashboard de leitos** — visão agregada de admissões ativas por ward/bed com alertas destacados. Hoje `findActive` retorna lista.
- **Gatilho de sulfato de Mg** — quando admissão por PE grave + PA ≥160/110, sugerir protocolo completo (dose, controle de reflexos, diurese, antidoto gluconato cálcio).
- **Notificação equipe via WhatsApp interno** — alerta `critical` → mensagem ao atendente, backup, coord.
- **Auditoria imutável de evoluções** — hoje `update` substitui conteúdo. Implementar append-only com versões.

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/hospitalization/hospitalization.service.ts` (CRUD + `evaluateAlerts` + alta)
  - `backend/src/hospitalization/hospitalization.entity.ts` (`AdmissionStatus` enum: `ACTIVE`, `DISCHARGED`)
  - `backend/src/hospitalization/evolution.entity.ts` (evolutionType, author, alerts jsonb)
  - `backend/src/hospitalization/hospitalization.controller.ts`
- **Frontend:**
  - `frontend/src/pages/hospitalization/`
- **Migrations:** `*Hospitalization*`, `*Evolution*`
