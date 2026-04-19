# Pré-natal (acompanhamento obstétrico completo)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** crítica (núcleo do produto B2B)
> **Depende de:** 01-cadastro-paciente, 02-autenticacao, 03-agendamento

---

## 1. Propósito

**Problema que resolve:** ginecologistas/obstetras brasileiros ainda usam cadernetas de papel ou EMRs genéricos que não entendem Idade Gestacional (IG), DPP, curvas de crescimento fetal, protocolos FEBRASGO/ACOG ou rastreios FMF. Isso gera consultas repetitivas, exames duplicados, vacinas esquecidas, AAS para pré-eclâmpsia não prescrito e HELLP detectada tarde.

**Valor entregue:** um prontuário obstétrico longitudinal que **calcula IG e DPP automaticamente por 3 métodos** (DUM, USG precoce, FIV-transferência), aplica flowsheet SOAP por consulta, plota PA/glicemia em curvas por IG, dispara alertas clínicos (FHR, PBF, edema, HELLP por labs, pré-eclâmpsia por PA+proteinúria, DMG por TTOG), agenda exames e vacinas pelo trimestre, calcula risco FMF para trissomias/PE e mantém linha do tempo unificada (consultas + USG + labs + vacinas + rx + alertas + puerpério).

**Intenção do médico-fundador:**
- Uma gestação é **uma entidade clínica de 40 semanas**, não uma sequência de consultas soltas — por isso existe `pregnancies` como agregado raiz com todas as sub-coleções penduradas (consultas, labs, USG, vacinas, BP/glucose monitoring, postpartum).
- **IG tem que estar certa.** Se o médico errar a datação o resto do prontuário entra em cascata errada (PBF, biometria, rastreios, AAS 12-36s). Por isso há 3 métodos e conversão automática retroativa para DUM equivalente (`resolveInputDates` em `pregnancies.service.ts:508`).
- **Alto risco não é um campo — é um conjunto de flags auto-classificadas.** `completeInitialAssessment` varre `currentPathologies` com regex (`/hipertens/`, `/diabetes|dm[12]|lada|mody/`, `/trombofil/`) e adiciona flags automaticamente (`pregnancies.service.ts:354-364`). O médico não precisa lembrar de marcar.
- Alertas **são do serviço, não do copiloto** — `evaluateAlerts` em cada módulo (consultations, bp-monitoring, glucose-monitoring, lab-results, postpartum) gera alertas clínicos independentes da IA. A IA (copilot) consome esses alertas, não os substitui.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico (obstetra) | Abre gestação, realiza SOAP, prescreve, solicita exames | Paciente grávida chega (1ª consulta ou transferida) |
| Enfermeira | Vacinas, triagem de sintomas, monitorização PA/glicemia | Consulta de enfermagem agendada |
| Paciente | Registra PA/glicemia domiciliares via Portal, upload de exames | Médico ativou monitoramento ou liberou upload |
| Secretária | Agenda consultas ACOG (mensal até 28s, quinzenal 28-36s, semanal 36s+) | Após cadastro da gestante |
| Copiloto IA | Gera checklist pós-consulta, resumo leigo, insights tempo real | Consulta salva / WebSocket ativo |

**Pré-condições:**
- Paciente com CPF cadastrado (ou temporário via `quickCreate` — gera CPF fake em `pregnancies.service.ts:109`).
- Tenant com preset `consultorio`, `ubs` ou `hospital`.
- Pelo menos um dos 3 métodos de datação preenchido (DUM, USG precoce com IG no dia, ou FIV com data/tipo de transferência).

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| `gaMethod` | enum (`LMP`, `ULTRASOUND`, `IVF`) | Médico na abertura | Sim |
| `lmpDate` | date | DUM informada pela paciente | Sim (ou derivada) |
| `usDatingDate` + `usDatingGaDays` | date + int | USG ≤13s6d (mais precisa) | Se `gaMethod=ULTRASOUND` |
| `ivfTransferDate` + `ivfTransferType` | date + enum (`D3`, `D5`, `BLASTOCYST`, `NATURAL_CYCLE`) | FIV | Se `gaMethod=IVF` |
| `gravida`/`para`/`abortus` | int | História obstétrica | Sim |
| `plurality` + `chorionicity` | int + enum | USG | Obrigatório se múltipla |
| `currentPathologies` | text | Anamnese | Não |
| `highRiskFlags` | jsonb[] | Auto + manual | Derivado |
| `weightKg`, `bpSystolic/Diastolic`, `fundalHeightCm`, `fetalHeartRate`, `fhrStatus`, `biophysicalProfile`, `edemaGrade`, `symptoms` | mixtos | Cada consulta | Parcial |
| `subjective`, `objective`, `assessment`, `plan` | text | SOAP | Recomendado |

---

## 4. Fluxo principal (happy path)

1. **Abrir gestação** — Médico (ou secretária via `quickCreate`) abre `POST /patients/:id/pregnancies`. Sistema calcula LMP retroativo se só houve DUM/USG/FIV; calcula DPP = `lmpDate + 280d` (ou `usDatingDate + (280 - usDatingGaDays)d`, ou `ivfTransferDate + (280 - IVF_OFFSET)d`).
2. **Avaliação inicial** — Modal `InitialAssessmentModal` coleta patologias atuais, medicamentos, hábitos, histórico ginecológico/obstétrico. `completeInitialAssessment` auto-classifica alto risco e dispara criação de Rhogam se tipagem Rh negativa.
3. **1ª consulta SOAP** — `NewConsultationModal` abre. WebSocket `/copilot` conecta. Médico preenche queixa/sinais vitais/exame físico/conduta. Campo "colar texto" chama `POST /ai-fill` (Claude extrai PA, peso, AU, BCF, edema, sintomas).
4. **Validação automática** — `evaluateAlerts` em `consultations.service.ts` avalia FHR (taquicardia/bradicardia/ausente/arritmia), PBF (≤4 crítico, =6 limítrofe), edema (3+/4+ urgente) e grava em `alerts` jsonb.
5. **Checklist pós-consulta (Fase 2 copiloto)** — antes de finalizar, IA gera itens baseados em IG: se 12-14s sem combinado → item; se 20s sem morfológico → item; se 24-28s sem TTOG → item; se 35-37s sem GBS → item; se Rh- 28s+ sem Rhogam → item. Médico resolve cada um (accept/done/defer/ignore+justificativa).
6. **Resumo paciente (Fase 1)** — após checklist revisado, Claude gera resumo leigo; médico aprova; envia WhatsApp + Portal.
7. **Monitoramento domiciliar** — médico ativa `bp-monitoring` e/ou `glucose-monitoring` com metas. Paciente registra via portal. Cada leitura roda `evaluateAlert` (PA crítica ≥160/110 → CRITICAL; glicemia <60 → CRITICAL; jejum >95 → ATTENTION; 1h pós-refeição >140 → ATTENTION).
8. **Exames e USG** — Flowsheet `clinical-protocols.checkExamSchedule` cruza `exam_schedules` (com IG ideal) contra `lab_results` e separa em `completed/pending/overdue` (3 fallbacks de match: `scheduleId` → nome → categoria).
9. **Morfológico 1º tri + FMF** — USG 11-14s preenche CCN, TN, osso nasal, ducto venoso, regurg tricúspide + PAPP-A + β-hCG + MAP + UtA PI. `ScreeningRiskService.calculateCombinedRiskT21` e `.calculatePERisk` retornam denominador e classificação. Se PE `earlyPE.riskDenominator ≤100` ou IMC≥30/HAS/DM/PE prévia → indicar **AAS 100-150mg/d de 12 a 36 semanas** + cálcio 1g/d.
10. **Vacinas** — `vaccines.getVaccineCard` agrupa por tipo e gera alertas de doses pendentes/atrasadas. dTpa 20-36s (preferência 27-32s), influenza em qualquer IG na estação, COVID conforme calendário atual, hepatite B se suscetível.
11. **GBS** — swab vaginal+anal 35-37s (módulo `vaginal-swabs`). Positivo → intraparto penicilina G.
12. **Evolução e desfecho** — última consulta antes do parto, `pregnancy-outcome` grava parto (tipo, data, RN, Apgar, complicações). Status `ACTIVE` → `COMPLETED`.
13. **Puerpério** — dispara fluxo `05-postpartum`.

```
[Abrir gestação] → [IG/DPP auto] → [Avaliação inicial + alto risco auto]
        ↓
[Consulta SOAP] ← loop (mensal→quinzenal→semanal por IG)
   ↓  ↓  ↓  ↓
 [Copilot WS] [evaluateAlerts] [Checklist] [Resumo paciente]
        ↓
[BP/Glucose monitoring] ←→ [Portal paciente]
        ↓
[Labs + USG] ←→ [FMF risk] ←→ [AAS se PE risk]
        ↓
[Vacinas por IG] ←→ [GBS 35-37s] ←→ [Rhogam se Rh-]
        ↓
[Pregnancy outcome] → [Puerpério]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| DUM incerta | Médico escolhe `ULTRASOUND` como método. USG precoce sobrescreve DUM se diferença >7d no 1º tri, >10d no 2º tri (ACOG CO 700). |
| Gestação gemelar | `plurality=2+`, `chorionicity` obrigatória. Biometria, Doppler e PBF replicam `perFeto`. MCMA → USG quinzenal desde 16s. |
| Transferência de FIV | `IVF_OFFSET`: D3=17d, D5/BLASTOCYST=19d, ciclo natural=14d. DPP é `transferDate + (280 - offset)d`. |
| PA ≥140/90 em consulta | `consultations.evaluateAlerts` + copiloto emite alerta, sugere proteinúria+labs (hemograma, TGO/TGP, DHL, creatinina, ác. úrico). Se +proteinúria → pré-eclâmpsia. |
| PA ≥160/110 | `bp-monitoring.evaluateAlert` grava `CRITICAL` + sugere hospitalização urgente se sintomas de alarme presentes (cefaleia, escotoma, epigastralgia, náuseas — `BP_ALARM_SYMPTOMS`). |
| TTOG 75g 24-28s alterado (jejum ≥92, 1h ≥180, 2h ≥153) | DMG. Inicia glucose-monitoring, metas FEBRASGO 2023 (jejum <95, 1h <140, 2h <120). |
| Isolado alto risco T21 (FMF) | Copiloto sugere NIPT ou biópsia de vilo/amniocentese conforme IG. |
| Rh- + Coombs indireto negativo | `createRhogamForPregnancy` cria entrada de anti-D 300mcg pendente para 28-34s. |
| BCF ausente em consulta | Alerta `CRITICAL`, emergência obstétrica — abre modal de encaminhamento imediato. |
| Evolução para internação (pré-eclâmpsia grave, DPP, TPP) | Cria `Hospitalization` vinculada — ver fluxo 08. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | DPP por DUM = `lmpDate + 280 dias` (regra de Naegele simplificada) | `pregnancies.service.ts:597` |
| RB-02 | DPP por USG precoce = `usDatingDate + (280 - usDatingGaDays) dias` | `pregnancies.service.ts:573-577` |
| RB-03 | DPP por FIV: D3→offset 17d, D5/Blastocisto→19d, ciclo natural→14d | `IVF_OFFSET` em `pregnancies.service.ts:40` |
| RB-04 | USG do 1º tri com diferença >7d da DUM deve sobrescrever datação | ACOG CO 700 |
| RB-05 | Auto-classifica alto risco se `currentPathologies` contém "hipertens", "diabetes/dm1/dm2/lada/mody" ou "trombofil" | `pregnancies.service.ts:354-364` |
| RB-06 | FHR taquicardia >160bpm=atenção; <110bpm=bradicardia URGENTE; ausente=CRÍTICO | FEBRASGO 2023 / `consultations.evaluateAlerts` |
| RB-07 | PBF ≤4=crítico (interrupção); =6=repetir em 24h; =8/10=normal | Manning 1980 / `consultations.service.ts:119-124` |
| RB-08 | Edema 3+/4+ = urgente, investigar pré-eclâmpsia | `consultations.service.ts:128-134` |
| RB-09 | PA ≥140/90 na gestação + proteinúria = pré-eclâmpsia; sem proteinúria = HAS gestacional | ACOG PB 222 |
| RB-10 | PA ≥160/110 = `CRITICAL` hospitalização urgente. Se +alarma (cefaleia, escotoma, epigastralgia) = iminência eclampsia | `bp-monitoring.service.ts:194-209` |
| RB-11 | PA <90 sistólica = hipotensão, alerta attention | `bp-monitoring.service.ts:186-191` |
| RB-12 | DMG: TTOG 75g 24-28s alterado se **jejum ≥92** OU **1h ≥180** OU **2h ≥153** (IADPSG/OMS) | FEBRASGO Nota Técnica 2023 |
| RB-13 | Glicemia metas na gestação: jejum <95, 1h pós-refeição <140, 2h <120 (configuráveis por paciente) | `glucose-monitoring.service.ts:442` |
| RB-14 | Hipoglicemia: <60 `CRITICAL` (tratamento imediato); 60-69 `ATTENTION` (carbo oral) | `glucose-monitoring.service.ts:383-394` |
| RB-15 | Hiperglicemia >200 (configurável) = `CRITICAL` avaliar cetoacidose | `glucose-monitoring.service.ts:397-401` |
| RB-16 | HELLP: TGO/TGP >70=atenção, >150=CRITICAL; DHL >600=CRITICAL; Plaq <150k=atenção, <100k=CRITICAL; BT >1.2=investigar hemólise; Ác.úrico >5.5=risco PE/HELLP | `lab-results.service.ts:195-234` |
| RB-17 | AAS 100-150mg/d de 12 a 36 semanas se **qualquer**: PE prévia, IMC pré-gestacional ≥30, HAS crônica, DM prévia, LES, SAAF, gemelar, nuliparidade +35 anos, **ou** FMF earlyPE risk ≤1:100 | USPSTF 2021 / FMF / `screening-risk.service.ts:155` |
| RB-18 | Cálcio 1-2g/d durante toda a gestação se ingesta dietética baixa (<600mg/d) — adjuvante PE | OMS 2020 |
| RB-19 | Risco FMF T21 ≤1:100 = alto risco; 1:101–1:1000 = intermediário; >1:1000 = baixo | Kagan UOG 2008 / `screening-risk.service.ts:102-105` |
| RB-20 | LR FMF T21: NT delta>2.5mm→LR 18; osso nasal ausente→LR 6.6; DV onda-a reversa→LR 3.2; regurg tricúspide→LR 4.5; PAPPA<0.4 + β-hCG>2.0 MoM→LR 8 | `screening-risk.service.ts:67-97` |
| RB-21 | Idade materna risco a priori T21: 20a=1:1527; 35a=1:422; 40a=1:115; 45a=1:26 | Tabela FMF / `screening-risk.service.ts:20-27` |
| RB-22 | Vacinas: dTpa 20-36s (ideal 27-32s), influenza sempre na estação, COVID conforme PNI vigente, hepatite B se suscetível | PNI / FEBRASGO 2023 |
| RB-23 | Anti-D (Rhogam) 300mcg IM 28-34s se Rh- + Coombs indireto negativo + pai Rh+ (ou desconhecido) | FEBRASGO 2023 / `vaccines.createRhogamForPregnancy` |
| RB-24 | GBS: swab vaginorretal 35-37s. Positivo → penicilina G 5MUI intraparto, reforço 2.5MUI 4/4h | CDC 2019 / FEBRASGO 2022 |
| RB-25 | Cronograma consultas ACOG: mensal até 28s; quinzenal 28-36s; semanal 36s+ até parto | ACOG PB 2018 |
| RB-26 | Morfológico 1º tri: 11s0d–13s6d (CCN 45-84mm). Morfológico 2º tri: 18-24s (ideal 20-22s) | ISUOG 2023 |
| RB-27 | Cervicometria transvaginal 20-24s. Colo curto ≤25mm = progesterona vaginal 200mg/d até 36s | FIGO 2021 |
| RB-28 | Fundo uterino cm ≈ IG semanas entre 20-36s (±2cm); discordância >3cm → USG para CIUR/macrossomia | FEBRASGO |
| RB-29 | Tendência PA calcula média das últimas 5 vs. 5 anteriores; diff>5mmHg = `rising`/`falling` | `bp-monitoring.service.ts:100-113` |
| RB-30 | Perfil infeccioso (HIV, sífilis, hepatites, toxo, rubéola, citomeg) se "reagente"/"positivo" em texto → `CRITICAL` + alerta | `lab-results.service.ts:132-141`, `INFECTIOUS_CATEGORIES` |

---

## 7. Saídas e efeitos

- **Cria/altera:** `pregnancies`, `consultations`, `bp_readings`, `glucose_readings`, `insulin_doses`, `lab_results`, `lab_documents`, `ultrasounds`, `ultrasound_reports`, `vaccines`, `prescriptions`, `exam_schedules` (match), `copilot_alerts`, `copilot_checks/check_items`, `consultation_summaries`.
- **Notificações:** WhatsApp (resumo pós-consulta, lembrete consulta 48h/24h, alerta crítico escalado), email (resumo + lembretes), push in-app (alertas copiloto).
- **Integrações:** Claude API (resumo, checklist, insights tempo real, ai-fill, extração de PDF de lab), WhatsApp Business, SMTP, opcionalmente RNDS, Daily.co (telemedicina), Memed (prescrição — ver fluxo 09).
- **Eventos:** WS `consultation:field_updated`, `copilot:insights`, cron longitudinal diário 6h, `copilot_alerts` criados no save de consulta/lab/bp/glucose.

---

## 8. Integrações externas

| Serviço | Quando | Payload essencial | Falha graciosa? |
|---|---|---|---|
| Claude (Anthropic) | `ai-fill`, resumo, checklist, insights, geração de laudo USG | Texto/JSON do contexto clínico | Sim — alertas do service continuam funcionando sem IA |
| WhatsApp Business (Meta) | Envio de resumo, lembretes, escalação urgente, webhook chatbot | Template `otp_verification` + mensagens livres | Sim — fallback email |
| Daily.co | Telemedicina | Token médico + paciente | N/A — telemed é opcional |
| Glicosímetros (Accu-Chek/OneTouch/Contour/FreeStyle Libre/Dexcom) | `POST /glucose/device-sync` | `deviceReadingId` (dedupe), valor, timestamp | Sim — entrada manual permanece |
| FMF (software certificado) | Recomendado para risco definitivo | N/A — sistema faz cálculo aproximado | Documentado como limitação |

---

## 9. Critérios de aceitação

- [ ] Dado DUM 2025-01-01, quando abro gestação, então IG em 2025-04-01 = 12s6d e DPP = 2025-10-08.
- [ ] Dada transferência D5 em 2025-02-10, então IG em 2025-05-05 = 14s0d (19d + 65d).
- [ ] Dado USG de datação em 2025-03-15 com IG=8s3d, então DPP = 2025-10-20.
- [ ] Dado `currentPathologies="hipertensão arterial crônica"`, quando finalizo avaliação inicial, então `isHighRisk=true` e `highRiskFlags` contém `"hipertensao"`.
- [ ] Dada PA 165/115 com sintoma "cefaleia", então alerta `CRITICAL` + mensagem "SINAIS DE ALARME PRESENTES — considerar hospitalização urgente".
- [ ] Dado TGO=180 U/L, alerta `CRITICAL` "HELLP síndrome provável".
- [ ] Dado morfológico 1º tri com NT=3.5mm + osso nasal ausente + PAPPA 0.3 MoM + β-hCG 2.5 MoM em paciente 38a, então risco T21 ≤1:100.
- [ ] Dada paciente com IMC 34 pré-gestacional nulípara 36a, então copiloto sugere AAS 100mg 12-36s.
- [ ] Dada paciente Rh- com Coombs indireto negativo, então Rhogam criado pendente com nota "28-34s, 300mcg IM".
- [ ] Dado exame schedule "Hemograma 1º tri (8-12s)" pendente em gestação de 14s, então aparece em `overdue`.

---

## 10. Métricas de sucesso

- **Taxa de datação correta:** % de gestações com método de datação documentado (DUM/USG/FIV) e USG de datação ≤13s6d. **Meta:** >85%.
- **Detecção precoce de PE:** % de pacientes com risco FMF earlyPE calculado até 14s. **Meta:** >70%.
- **AAS em alto risco:** % das pacientes com indicação (RB-17) que receberam prescrição de AAS antes de 16s. **Meta:** >90%.
- **Rastreio DMG:** % com TTOG 75g realizado entre 24-28s. **Meta:** >80%.
- **GBS:** % com swab 35-37s. **Meta:** >85%.
- **Alertas HELLP acionáveis:** tempo médio entre lab `CRITICAL` e consulta de avaliação. **Meta:** <24h.
- **Consultas ACOG:** aderência ao cronograma mensal/quinzenal/semanal. **Meta:** >75%.

---

## 11. Melhorias recomendadas na migração

- **IG em tempo real no header global** — hoje IG só aparece no card de gestação e no cabeçalho da consulta. Mover para o topbar persistente com DPP, semanas, dias e marco (ex: "23s4d · DPP 08/10 · 2º tri · morfológico ok"). Evita cliques.
- **Visualização de PA com zona por IG** — hoje `BpSection` é lista + gráfico linha. Trocar para área com zonas cor (verde <135/85, amarelo 135-139/85-89, laranja 140-149/90-99, vermelho ≥150/100) cruzadas com banda de semanas. Deixa a trajetória visual, e crítico vira óbvio.
- **Flowsheet obstétrico estilo planilha** — consultas em linha com colunas IG, peso, PA, AU, BCF, edema, alertas — não em cards. Permite comparar 10 consultas de um relance. Hoje é card vertical que força scroll.
- **Curvas de crescimento fetal inline** — BPD/HC/AC/FL/EFW percentil precisa aparecer ao lado do USG sem clique extra. Hoje o `percentiles` vem do `calculateBiometryPercentiles` mas não é exibido no componente do laudo.
- **Checklist FMF guiado** — transformar o formulário do morfológico 1º tri num wizard com validação de CCN (45-84mm) antes de liberar NT e cálculo FMF ao vivo (enquanto digita). Hoje é formulário livre e cálculo é POST separado.
- **Protocolo AAS sugerido com 1-clique** — quando RB-17 é atendido, exibir botão "Prescrever AAS 100mg 12-36s" que já monta o rx Memed. Hoje é sugestão textual no copiloto.
- **Agenda sincronizada com IG** — agendar consulta aplicando automaticamente o protocolo ACOG (+4s até 28s, +2s até 36s, +1s em diante). Hoje é slots livres.
- **Integração automática Rh-/Coombs** — `createRhogamForPregnancy` só roda manualmente. Deve disparar quando lab_results de "Coombs indireto" retornar "não reagente" em paciente Rh-.
- **Editor SOAP com transcrição de voz** — já existe `voiceTranscript` em Ultrasound; estender para consultations com `ai-fill` aplicado automaticamente no blur do campo. Hoje é colar-e-clicar.
- **Geração automática de plano de cuidados trimestral** — ao virar trimestre, copiloto monta plano: exames pendentes + vacinas + rastreios + próxima USG + metas PA/glicemia. Hoje o plano está implícito no exam_schedule mas sem visualização unificada.
- **Fragmentar `PregnancyPage` (monolítica)** — hoje `pages/pregnancy/` concentra sidebar, timeline, modais. Migrar para camadas: header persistente + tabs (consultas / monitoramento / exames / vacinas / puerpério) + painel copiloto.

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/pregnancies/pregnancies.service.ts` (IG/DPP, alto risco auto, timeline unificada, ownership)
  - `backend/src/pregnancies/pregnancy.entity.ts` (schema jsonb `highRiskFlags`, DiabetesSubtype, Chorionicity)
  - `backend/src/consultations/consultations.service.ts` (SOAP + `evaluateAlerts` FHR/PBF/edema)
  - `backend/src/bp-monitoring/bp-monitoring.service.ts` (PA, tendência, alarma sintomas)
  - `backend/src/glucose-monitoring/glucose-monitoring.service.ts` (TTOG, device sync, insulina, daily table)
  - `backend/src/clinical-protocols/clinical-protocols.service.ts` (exam schedule check com 3 fallbacks)
  - `backend/src/lab-results/lab-results.service.ts` (alertas HELLP + categorias infecciosas)
  - `backend/src/vaccines/vaccines.service.ts` (card agrupado + Rhogam factory)
  - `backend/src/ultrasound-reports/screening-risk.service.ts` (FMF T21/T18/PE)
  - `backend/src/ai-fill/ai-fill.service.ts` (extração de SOAP por Claude)
  - `backend/src/ultrasound/ultrasound.service.ts` (biometria + percentis + Doppler + PBF)
- **Frontend:**
  - `frontend/src/pages/pregnancies/` (listagem)
  - `frontend/src/pages/pregnancy/PregnancyPage.tsx` + `sections/*` (TimelineSection, SidebarCards, BpSection, GlucoseSection, NewConsultationModal, AddPrescriptionModal, AddLabResultModal, AddUltrasoundModal, AddVaccineModal, InitialAssessmentModal, CopilotPanel, CopilotSidePanel, CopilotCheckModal, ConsultationSummaryPanel)
- **Migrations:** `backend/src/migrations/*Pregnancy*`, `*Consultation*`, `*BpMonitoring*`, `*Glucose*`, `*LabResult*`, `*Vaccine*`, `*CopilotAlert*`
