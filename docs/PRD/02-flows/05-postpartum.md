# Puerpério (pós-parto)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** alta
> **Depende de:** 04-prenatal, 01-cadastro-paciente

---

## 1. Propósito

**Problema que resolve:** o puerpério é o período de maior risco materno (hemorragia tardia, endometrite, TEV, pré-eclâmpsia pós-parto, psicose e depressão pós-parto) e é sistematicamente negligenciado por EMRs genéricos — a "6 semanas pós" da caderneta SUS virou consulta única, quando deveriam ser **três contatos** (1ª semana, 30-42 dias, 6 meses).

**Valor entregue:** consulta puerperal estruturada (`postpartum_consultations`) com avaliação de involução uterina, lóquios, cicatrização (episio/cesárea), amamentação, rastreio de humor (EPDS — Edinburgh Postnatal Depression Scale 0-30), contracepção pós-parto (WHO-MEC lactação), sinais vitais e dados do RN na 1ª consulta (icterícia, coto umbilical, teste do pezinho/orelhinha/olhinho, ganho ponderal). Alertas automáticos para hemorragia tardia, endometrite, eclâmpsia tardia, mastite/abscesso e depressão pós-parto.

**Intenção do médico-fundador:**
- O puerpério estende a gestação como um agregado — não cria "nova paciente". `postpartum_consultations.pregnancy_id` mantém continuidade clínica e timeline unificada (`pregnancies.service.ts:210-216` já inclui postpartum em `getTimeline`).
- **Saúde mental é obrigatória, não opcional.** `moodScreening` enum (normal/mild/moderate/severe) + `epdsScore` explícito no schema (`postpartum-consultation.entity.ts:130`). `evaluateAlerts` grava alerta `critical` se EPDS ≥13 ou screening severe (`postpartum.service.ts:134-138`).
- Cálculo de `daysPostpartum`: usa `deliveryDate` real de `pregnancy_outcomes` se disponível; senão cai em DPP. Isso permite abrir consulta puerperal antes de fechar `pregnancy_outcome` sem dados incorretos.
- Alertas de puerpério são separados dos alertas da gestação (loquios, ferida operatória, mastite) — não reaproveitam `consultations.evaluateAlerts`.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Obstetra | Consulta puerperal médica, contracepção | 7-10 dias, 30-42 dias, 6 meses pós-parto |
| Enfermeira | Consulta de enfermagem, orientação amamentação, pesagem RN | 1ª semana |
| Paciente | Autorrelato EPDS via portal, chat com médico | A qualquer momento pós-alta |
| Pediatra (parceiro) | Dados do RN compartilhados (visível mas não editado aqui) | 1ª consulta |

**Pré-condições:**
- `pregnancy.status` mudou para `COMPLETED` OU `pregnancy_outcome.deliveryDate` preenchido.
- Para cálculo de `daysPostpartum` é necessário pelo menos DPP (fallback) ou deliveryDate.

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| `date` + `daysPostpartum` (calculado) | date + int | Consulta | Sim |
| `weightKg`, `bpSystolic/Diastolic`, `temperature`, `heartRate` | sinais vitais | Exame | Recomendado |
| `uterineInvolution` (normal/subinvolution/not_palpable), `fundalHeightCm` | enum + dec | Exame bimanual | Recomendado |
| `lochiaType` (rubra/serosa/alba/absent), `lochiaAmount` (scant/moderate/heavy), `lochiaOdor` | enum + bool | Inspeção | Sim |
| `woundStatus` (good/dehiscence/infection/hematoma/na) | enum | Inspeção episiotomia/cesárea | Se aplicável |
| `breastfeedingStatus` (exclusive/predominant/complemented/not), `breastCondition` (normal/engorgement/fissure/mastitis/abscess) | enum | Inspeção mamas | Sim |
| `moodScreening` + `epdsScore` (0-30) | enum + int | EPDS 10 itens | Obrigatório na 6ª sem |
| `contraceptionDiscussed` + `contraceptionMethod` | bool + text | Aconselhamento | Obrigatório 6ª sem |
| `newbornData` (jsonb: peso, icterícia, coto umbilical, testes neonatais) | jsonb | 1ª consulta | Sim na 1ª |
| SOAP + `confidentialNotes` | text | Livre | Recomendado |

---

## 4. Fluxo principal

1. **Abrir puerpério** — Após parto (registrado em `pregnancy_outcome` no desfecho) ou após `pregnancy.status=COMPLETED`, botão "Nova consulta puerperal" em `PostpartumSection.tsx` abre `NewPostpartumModal`.
2. **Cálculo automático de `daysPostpartum`** — `calculateDaysPostpartum(deliveryDate ?? edd, date)`; grava dias de puerpério.
3. **Formulário SOAP puerperal** — 5 blocos: sinais vitais, útero/lóquios, ferida, mamas/amamentação, saúde mental. `newbornData` só na 1ª consulta.
4. **EPDS guiado** — 10 perguntas com scoring 0-3 cada (0-30 total). Corte ≥10 suspeita; ≥13 risco alto depressão pós-parto; item 10 (ideação suicida) >0 sempre urgente mesmo com total baixo.
5. **Salvar** → `evaluateAlerts` dispara e grava `alerts` jsonb. Se PA ≥160/110 → alerta `critical` eclâmpsia pós-parto; febre ≥38 → urgente; loquios fétidos → urgente endometrite; lochia rubra >14d → subinvolução; sangramento heavy → hemorragia tardia; ferida infection → antibiótico; mastite/abscesso → avaliar ATB; EPDS ≥13 → encaminhar psiquiatra.
6. **Contracepção** — 6ª sem: aconselhar por amamentação e histórico. Se amamentando < 6 meses e combinado hormonal → MEC 4 nos primeiros 42d, MEC 3 até 6m; progestogênio isolado (DMPA/implante/minipílula) permitido a partir de 42d; DIU-Cu pós-placentário ou 4-6 sem. Persistir em `contraception-records` vinculado à paciente (ver fluxo 06b).
7. **Alta do puerpério** — última consulta (≈6 meses): se tudo normal, encerra acompanhamento obstétrico. Paciente entra no fluxo ginecológico de rotina.

```
[Parto + outcome] → [Consulta 7-10d: sangramento, ferida, amamentação]
        ↓
[Consulta 30-42d: EPDS, contracepção, involução completa]
        ↓
[Consulta 6 meses: status amamentação, retomada ciclo, contracepção LARC]
        ↓
[Alta do puerpério → fluxo ginecologia]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Óbito fetal / aborto tardio | Ainda requer puerpério (involução uterina, saúde mental). EPDS obrigatório + luto perinatal — grava `moodScreening` + `confidentialNotes`. |
| Cesárea com infecção | `woundStatus=infection`, alerta urgente ATB (cefalexina 500mg 6/6h ou cefazolina EV se grave). |
| Mastite com abscesso | Alerta urgente + encaminhar drenagem + ATB (cefalexina/clinda). Manter amamentação. |
| EPDS item 10 (ideação) positivo | Mesmo se total <10, protocolo suicide-risk: notificação imediata + acompanhamento psiquiátrico no mesmo dia. (Hoje não é regra distinta — melhoria!) |
| PA ≥160/110 até 6 sem pós-parto | Eclâmpsia pós-parto possível até 6 sem. Alerta critical, hospitalização + sulfato de Mg. |
| Não conseguiu pesquisar feto (natimorto, perda precoce) | Desfecho já existe mas `newbornData` null; consulta puerperal existe mesmo assim. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | `daysPostpartum = date - (deliveryDate ?? edd)` em dias, mínimo 0 | `postpartum.service.ts:87-93` |
| RB-02 | PA ≥160/110 no puerpério = `critical` risco eclâmpsia pós-parto | `postpartum.service.ts:101-103` |
| RB-03 | PA ≥140/90 no puerpério = `urgent` hipertensão pós-parto | `postpartum.service.ts:103-105` |
| RB-04 | Temperatura ≥38°C = `urgent` febre puerperal — investigar endometrite/mastite/ITU/TEP | `postpartum.service.ts:109-111` |
| RB-05 | Lóquios com odor fétido = `urgent` endometrite (iniciar ampicilina+genta+clinda) | `postpartum.service.ts:114-116` |
| RB-06 | Lóquios rubra após 14 dias = `attention` subinvolução uterina — USG, considerar restos ovulares | `postpartum.service.ts:119-121` |
| RB-07 | Sangramento `heavy` = `urgent` hemorragia puerperal tardia (>24h-12sem pós-parto) | `postpartum.service.ts:124-126` |
| RB-08 | `woundStatus=infection` = `urgent` ATB + avaliação cirúrgica se coleção | `postpartum.service.ts:129-131` |
| RB-09 | EPDS ≥13 OU moodScreening=severe = `critical` encaminhar psiquiatria (depressão pós-parto provável) | `postpartum.service.ts:134-136` |
| RB-10 | EPDS 10-12 OU moodScreening=moderate = `attention` acompanhamento próximo | `postpartum.service.ts:136-138` |
| RB-11 | `breastCondition=mastitis` = `urgent` cefalexina 500mg 6/6h 10d + manter AM; drenagem se abscesso | `postpartum.service.ts:141-144` |
| RB-12 | Amamentação exclusiva + contracepção combinada hormonal = MEC 4 até 42d, MEC 3 até 6m | OMS MEC 2015 |
| RB-13 | Amamentação exclusiva + progestogênio isolado (minipílula/DMPA/implante) = MEC 1-2 a partir de 6 sem | OMS MEC 2015 |
| RB-14 | DIU-Cu pós-placentário (inserção <10min pós-dequitação) ou 4-6 sem pós-parto se preferência LARC | FEBRASGO 2018 |
| RB-15 | Laqueadura tubária pós-parto requer consentimento ≥60 dias antes do parto (Lei 9.263 atualizada) | Lei 9.263/1996 alterada |
| RB-16 | Avaliar cicatrização da episio/perineal aos 7-10d; deiscência pequena → segunda intenção; grande → reaproximação | FEBRASGO |
| RB-17 | Puerpério precoce 0-10d, intermediário 10-42d, tardio 42d-6m. Consulta obrigatória no intermediário | OMS |
| RB-18 | Ideação suicida no EPDS item 10 (valor >0) deve disparar protocolo mesmo com score total <10 | NICE CG192 — **não implementado** |
| RB-19 | Dados do RN na 1ª consulta: peso, icterícia (Kramer), coto umbilical (aderido/caído/infectado), teste do pezinho, teste da orelhinha (EOA/BERA), teste do olhinho (reflexo vermelho), vacinas BCG+Hep B nascimento | Rede Cegonha / PNI |
| RB-20 | TEV até 6 sem pós-parto: risco 20x aumentado. HBPM profilática se fatores de risco (obesidade, cesárea, imobilização, SAAF) | RCOG Green-top 37a |

---

## 7. Saídas e efeitos

- **Cria/altera:** `postpartum_consultations`, opcionalmente cria `contraception_records`, `prescriptions` (ATB, analgesia, contraceptivo), `lab_results` (hemograma, cultura loquios, galactograma).
- **Notificações:** WhatsApp de lembretes das 3 consultas, alerta crítico escalado (depressão/eclâmpsia/hemorragia).
- **Integrações:** Claude (resumo paciente pós-consulta puerperal), WhatsApp, email.
- **Eventos:** timeline unificada em `pregnancies.getTimeline` já inclui postpartum; copiloto pode gerar `longitudinal_alerts` se EPDS elevado e paciente não respondeu.

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa? |
|---|---|---|---|
| Claude | Resumo puerpério + orientações | `consultation_summaries` | Sim |
| WhatsApp | Lembretes D+7, D+30, D+180 | Template | Sim — email fallback |
| Portal paciente | Autoaplica EPDS (10 perguntas) | Score calculado e enviado | N/A |

---

## 9. Critérios de aceitação

- [ ] Dado parto em 2025-01-15 e consulta em 2025-01-25, então `daysPostpartum=10`.
- [ ] Dada PA 162/112 em D+5, então alerta `critical` "risco de eclampsia pos-parto".
- [ ] Dado `lochiaOdor=true`, então alerta `urgent` endometrite.
- [ ] Dado `epdsScore=14`, então alerta `critical` + encaminhamento psiquiatria no plano.
- [ ] Dado `breastCondition=abscess`, então alerta `urgent` "Abscesso mamario — avaliar antibioticoterapia".
- [ ] Dada amamentação exclusiva D+35, contracepção combinada contraindicada no copiloto.
- [ ] Dado RN com icterícia Kramer ≥3 em 1ª consulta, então plano inclui fototerapia + bilirrubina.

---

## 10. Métricas de sucesso

- **Aderência às 3 consultas puerperais:** % gestantes com ≥2 consultas em 6 meses. **Meta:** >70%.
- **EPDS aplicado:** % com EPDS documentado até D+42. **Meta:** >80%.
- **Contracepção definida até D+42:** **Meta:** >85%.
- **Detecção de depressão pós-parto:** # casos com EPDS ≥13 / total com EPDS. Comparar com prevalência (~15%).
- **Tempo entre alerta crítico (hemorragia/eclâmpsia/depressão) e contato clínico:** **Meta:** <24h.

---

## 11. Melhorias recomendadas na migração

- **Auto-agendar trio de consultas puerperais** — ao fechar `pregnancy_outcome` com parto, sistema gera 3 slots (D+7, D+30, D+180) no calendário. Hoje precisa agendar manual.
- **EPDS aplicável pela paciente via portal** — liberar questionário 10-item no Portal D+25. Paciente responde, sistema calcula score e manda pro médico antes da consulta. Hoje EPDS é preenchido na consulta.
- **Protocolo ideação suicida (item 10)** — implementar regra RB-18 que hoje **não existe**: se item 10 do EPDS >0, alerta `critical` independente do total, com escalação imediata (WhatsApp urgente médico + link psiquiatria 24h + orientação 188).
- **Fragmentar `PostpartumSection.tsx`** — hoje é uma única section que abre `NewPostpartumModal`. Migrar para card com 3 abas (RN, mãe, saúde mental) e mini-forms que salvam incrementalmente.
- **Dados do RN vinculados a prontuário pediátrico** — `newbornData` é jsonb solto. Criar entidade `newborns` com FK ao RN (quando pediátrico existir) e compartilhar com parceiro pediatra via `teams`.
- **Gatilho automático para DIU pós-placentário** — ao admitir paciente para parto, se contraceção prévia escolheu DIU, criar check de enfermagem "DIU pós-placentário pronto". Hoje fica no `confidential_notes`.
- **Rastreio de TEV pós-cesárea** — hoje não há regra automática. Adicionar score de risco (obesidade, cesárea, imobilização, SAAF) que sugere HBPM 7-14d.
- **Calendário de amamentação com curva de ganho ponderal do RN** — componente visual para pediatria colaborativa.
- **Timeline cruzada mãe+bebê** — quando há módulo pediátrico, mostrar eventos do RN na mesma linha do tempo da mãe até 6 meses.
- **Educação personalizada no portal** — hoje `content` module não está conectado ao puerpério. Disparar conteúdo por `daysPostpartum` (D+3: ferida; D+10: loquios; D+21: saúde mental; D+42: contracepção; D+120: retomada ciclo).
- **Lembrete proativo 24h antes de consulta puerperal** — hoje usa sistema genérico de appointments; seria bom incluir checklist preparatório ("leve o bebê, traga caderneta vacinal, últimos exames").

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/postpartum/postpartum.service.ts` (CRUD, `evaluateAlerts`, cálculo `daysPostpartum` a partir de outcome/DPP)
  - `backend/src/postpartum/postpartum-consultation.entity.ts` (schema completo, enums LochiaType/WoundStatus/MoodScreening/BreastCondition, `newbornData` jsonb)
  - `backend/src/pregnancy-outcome/pregnancy-outcome.entity.ts` (deliveryDate é fonte primária)
  - `backend/src/pregnancies/pregnancies.service.ts:210-216` (timeline inclui postpartum)
- **Frontend:**
  - `frontend/src/pages/pregnancy/sections/PostpartumSection.tsx`
  - `frontend/src/pages/pregnancy/sections/NewPostpartumModal.tsx`
  - `frontend/src/pages/patients/sections/PostpartumPatientSection.tsx` (visão por paciente, todos puerpérios)
- **Migrations:** `backend/src/migrations/*Postpartum*`
