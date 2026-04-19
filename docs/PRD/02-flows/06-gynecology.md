# Ginecologia (consulta raiz + 7 sub-fluxos)

> **Status atual no EliaHealth:** implementado (7 sub-módulos)
> **Prioridade na migração:** crítica (segundo pilar B2B)
> **Depende de:** 01-cadastro-paciente, 02-autenticacao

---

## 1. Propósito

**Problema que resolve:** EMRs genéricos não modelam a ginecologia como **problema longitudinal por fase de vida** (menarca → reprodutiva → transição → menopausa → senilidade). Tudo vira "consulta avulsa", sem histórico estruturado de ciclo menstrual (PALM-COEIN), contracepção em uso (com critérios WHO-MEC), investigação de infertilidade, reprodução assistida, transição menopausal e rastreios preventivos (Papanicolau, HPV-DNA, mamografia, DEXA, colonoscopia). O médico passa 40% da consulta folheando caderneta.

**Valor entregue:** sete sub-módulos especializados que **plugam em uma consulta ginecológica raiz** (`gynecology-consultations`) e mantêm registros longitudinais por paciente:
1. `menstrual-cycle-assessments` — SUA classificada PALM-COEIN + critérios Rotterdam SOP + HOMA-IR + PBAC.
2. `contraception-records` — critérios WHO-MEC codificados, rastreamento de validade de DIU/implante, alertas de incompatibilidade (fumo+CHC+35a=MEC4, enxaqueca com aura=MEC4, VTE=MEC4).
3. `infertility-workups` — definição ACOG CO 781 (tempo+idade+expedited), fator ovulatório (WHO groups I-III), fator tubário (HSG/HyCoSy/LPS), fator masculino (espermograma + fragmentação DNA), diagnóstico primário.
4. `assisted-reproduction` — OI + IIU + FIV com ciclos, monitorização folicular, desfecho.
5. `menopause-assessments` — STRAW+10, MRS 11-item autocalculado, DEXA com classificação automática de osteoporose, FRAX, decisão de TRH com alertas.
6. `preventive-exam-schedule` — agenda de rastreios por fase de vida.
7. `gynecology-consultations` — consulta raiz com BI-RADS, PHQ-2/GAD-2, IMC automático, alertas de rastreios atrasados.

**Intenção do médico-fundador:**
- Cada "problema ginecológico" é uma **entidade clínica separada que persiste**, não um campo de texto em consulta. SUA/PALM-COEIN é uma entidade (`menstrual_cycle_assessments`), contracepção é uma entidade (`contraception_records`), porque o médico precisa ver evolução temporal.
- **Guidelines internacionais são regras codificadas, não listas de PDF.** Todos os 7 módulos têm `evaluateAlerts` privado que implementa FIGO/WHO-MEC/NAMS/ACOG/Rotterdam etc.
- Consulta ginecológica raiz (`gynecology-consultations`) **não duplica** dados dos sub-módulos — referencia por `patientId` + data. O médico abre a consulta e sistema sugere "você tem ciclo em SUA classificada, contracepção DIU vence em 3m, mamografia há 26 meses → atualizar?".

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Ginecologista | Realiza consulta raiz + registra sub-fluxos | Paciente chega com queixa ou rotina anual |
| Paciente | Registra ciclo via portal (sangramento diário), chat | Rastreio proativo pelo ginecologista |
| Copiloto | Detecta rastreios atrasados (Pap >36m, mamografia >24m) e sugere pedidos | `evaluateAlerts` da consulta raiz |

**Pré-condições:**
- Paciente cadastrada com `dateOfBirth` (necessário p/ fase de vida e idade) e `phase` (menarche/reprodutive/perimenopause/menopause/senility).

---

## 3. Dados de entrada (consulta raiz)

| Campo | Tipo | Obrigatório? |
|---|---|---|
| `consultationDate`, `chiefComplaint` | date + text | Sim |
| `weight`, `height` (IMC auto), `bloodPressureSystolic/Diastolic` | dec | Recomendado |
| `phq2Score` (0-6), `gad2Score` (0-6) | int | Rotina anual |
| `biradsClassification` (0,1,2,3,4A,4B,4C,5,6) | enum | Se exame mamas |
| `smokingStatus`, `alcoholUse`, `physicalActivity` | enum | Sim |
| `lastPapSmear`, `lastMammography`, `lastDexa`, `lastColonoscopy` | date | Sim |
| `familyHistoryBreastCancer`, `familyHistoryOvarianCancer`, `familyHistoryColorectalCancer` | bool | Sim |
| SOAP | text | Recomendado |

---

## 4. Fluxo principal (raiz)

1. **Abrir consulta** — `POST /patients/:id/gynecology-consultations`. IMC auto-calculado.
2. **Anamnese guiada** — médico escolhe queixa principal. Se menstrual → abre submódulo (a); se contracepção → (b); se desejo gestacional → (c); se climatério → (e); rotina → (f)+(g).
3. **Exame físico** — PA, IMC, mamas (BI-RADS), exame especular, bimanual.
4. **`evaluateAlerts` da raiz** — PA, IMC (obesidade/baixo peso), BI-RADS ≥3, PHQ-2 ≥3, GAD-2 ≥3, Pap >36m, mamografia >24m, histórico familiar câncer.
5. **Sub-módulo(s)** — abre um ou mais dos 7 sub-fluxos conforme queixa.
6. **Conduta unificada** — prescrição, exames, retornos.

---

## H2 (a) — Ciclo menstrual / SUA (PALM-COEIN)

### Gatilho e dados
Queixa: menorragia, hipermenorreia, polimenorreia, oligomenorreia, amenorreia (primária/secundária), intermenstrual, pós-coital.

### Dados coletados
- `cycleIntervalDays`, `cycleDurationDays`, `pictorialBloodChart` (PBAC), `estimatedBloodVolumeMl`.
- **PALM:** `palmPolyp`, `palmAdenomyosis`, `palmLeiomyoma` (+ `palmLeiomyomaLocation` FIGO 0-8), `palmMalignancyOrHyperplasia`.
- **COEIN:** `coeinCoagulopathy` (+ tipo vW/hemofilia), `coeinOvulatory`, `coeinEndometrial`, `coeinIatrogenic`, `coeinNotClassified`.
- **SOP/PCOS Rotterdam:** 3 critérios (oligo-ovulação, hiperandrogenismo clínico/lab, ovários policísticos USG) — score `criteriaCount` 0-3.
- HOMA-IR, androgens (testosterona total/livre, SHBG, DHEA-S).

### Regras (RB-MC)
| ID | Regra |
|---|---|
| MC-01 | Ciclo normal FIGO 24-38d; <24d=curto; >38d=longo/oligo-ovulação |
| MC-02 | Duração >8d = menstruação prolongada |
| MC-03 | PBAC >100 = menorragia objetiva |
| MC-04 | Volume estimado >80mL/ciclo = menorragia |
| MC-05 | Mioma submucoso FIGO 0/1/2 → histeroscopia (ressecção) |
| MC-06 | Malignidade/hiperplasia suspeita = `urgent` encaminhar |
| MC-07 | Rotterdam ≥2/3 critérios = SOP compatível |
| MC-08 | HOMA-IR >2.7 = resistência insulínica (ajustar metformina) |
| MC-09 | Coagulopatia = investigar vW (FvW ag + cofator ristocetina) + AF/TTPA |
| MC-10 | Sangramento pós-coital = colposcopia + biópsia |
| MC-11 | Amenorreia primária (≥15 anos sem menarca) = cariótipo, hormonal, anatomia |
| MC-12 | Amenorreia secundária 3m = β-hCG, TSH, prolactina, FSH/LH/E2 |

Ref: FIGO 2018 / Rotterdam 2003 / `menstrual-cycle-assessments.service.ts:80-203`.

---

## H2 (b) — Contracepção (WHO-MEC)

### Dados coletados
- Método atual, método prescrito, data início, validade DIU/implante (lembretes automáticos).
- Condições: VTE prévia, trombofilia, enxaqueca com aura, HAS não controlada, tabagismo (+idade), amamentação, câncer de mama prévio/atual, diabetes com vasculopatia, SAAF, LES.
- Desejo gestacional: `desires_now` / `future` / `no`.
- `whomecCategory` 1/2/3/4 atribuída pelo médico após anamnese.

### Regras (RB-CO)
| ID | Regra | MEC |
|---|---|---|
| CO-01 | MEC 4 = contraindicação absoluta (`urgent` alerta) | OMS MEC 2015 |
| CO-02 | MEC 3 = riscos superam vantagens, considerar alternativa | |
| CO-03 | CHC (oral/injetável/patch/anel) + tabagismo ≥35a = MEC 4 | |
| CO-04 | CHC + VTE prévia ou trombofilia = MEC 4 | |
| CO-05 | CHC + enxaqueca com aura = MEC 4 (risco AVC) | |
| CO-06 | CHC + HAS não controlada = MEC 4 | |
| CO-07 | Câncer de mama atual ou prévio → hormonais MEC 3-4, preferir **DIU-Cu** | |
| CO-08 | Amamentação <6m + CHC = MEC 4 (0-42d) / MEC 3 (42d-6m) | |
| CO-09 | DIU vence em ≤3m = alerta `warning` agendar troca | `contraception-records.service.ts:185-205` |
| CO-10 | DIU já vencido = alerta `urgent` | |
| CO-11 | Implante vencido = alerta `urgent` | |
| CO-12 | `desires_now` + método ativo = orientar suspensão + pré-concepcional (ác. fólico, rubéola, tireoide) | |
| CO-13 | Pílula de emergência: levonorgestrel 1,5mg até 72h; ulipristal 30mg até 120h; DIU-Cu até 5d | FEBRASGO |

Ref: OMS MEC 2015 / `contraception-records.service.ts`.

---

## H2 (c) — Infertilidade

### Definições
- **Infertilidade:** 12m sem concepção (mulher <35 anos); **6m** se ≥35a (ACOG CO 781 → `expedited_evaluation=true`); imediato (`immediate_evaluation=true`) se oligo-amenorreia conhecida, histórico DIP, quimioterapia/radioterapia prévia, cirurgia pélvica, endometriose estágio III/IV, varicocele conhecida, azoospermia.

### Investigação (propedêutica básica ACOG/ASRM)
| Domínio | Exames |
|---|---|
| Ovulatório | Progesterona em fase lútea (21º dia ou 7d antes menstruação), USG TV seriado, curva de temperatura basal |
| Reserva ovariana | AMH, FSH basal (D2-4), CAF (contagem folículos antrais) USG TV |
| Tubário | HSG (1ª linha), HyCoSy, laparoscopia diagnóstica (se suspeita endometriose/aderências) |
| Uterino | USG TV, histeroscopia diagnóstica, RM pélvica |
| Masculino | Espermograma (OMS 2021: volume ≥1.4mL, concentração ≥16M/mL, motilidade total ≥42%, morfologia ≥4%), fragmentação de DNA, encaminhamento urologista |
| Cervical/peritoneal | Clamídia/gonorreia PCR, anticorpos antiespermatozoides (obsoleto) |

### Classificação WHO (ovulação)
- **Grupo I:** hipogonadismo hipogonadotrófico (FSH baixo, E2 baixo) — hipotálamo/hipófise.
- **Grupo II:** normogonadotrófico (SOP típico) — 70-85% dos casos.
- **Grupo III:** hipergonadotrófico (FSH alto, E2 baixo) — IOP/falência ovariana.
- **Grupo IV:** hiperprolactinemia.

### Regras (RB-IF)
| ID | Regra |
|---|---|
| IF-01 | ≥35a + 6m tentando → avaliação expedita obrigatória |
| IF-02 | AMH <1.1 ng/mL = baixa reserva ovariana — acelerar para FIV |
| IF-03 | FSH basal >10 mUI/mL = diminuição reserva |
| IF-04 | HSG obstrução bilateral → FIV direto (IIU não funciona) |
| IF-05 | Azoospermia → urologia + biópsia testicular (TESA/TESE) para ICSI |
| IF-06 | Preservação fertilidade: indicar se quimioterapia gonadotóxica, cirurgia ovariana bilateral, RT pélvica |
| IF-07 | Endometriose estágio III/IV → FIV (cirurgia só se dor ou cisto >4cm) |

Ref: ACOG CO 781 / ASRM 2023 / `infertility-workups.entity.ts`.

---

## H2 (d) — Reprodução assistida (OI / IIU / FIV)

### Entidades
- `ovulation_induction_cycles` (OI com letrozol/clomifeno/gonadotrofinas)
- `iui_cycles` (IIU — inseminação intrauterina)
- `ivf_cycles` (FIV — fertilização in vitro com/sem ICSI)

### Dados por ciclo
- Medicação (letrozol 2.5-7.5mg D3-D7; clomifeno 50-150mg D3-D7; FSHr 75-225 UI/d), dose, dias.
- **Monitorização folicular** (USG TV seriada D8, D10, D12): número e tamanho de folículos, espessura endometrial.
- Trigger: hCG 5000-10000 UI ou agonista GnRH (leuprolide) quando folículo ≥18mm.
- OI: relação programada 36h pós-trigger.
- IIU: capacitação + inseminação 36h pós-trigger.
- FIV: captação oocitária 34-36h pós-trigger (anestesia), cultura embrionária 3-5 dias, transferência D3 ou D5 (blastocisto), freezing embriões.
- Desfecho: β-hCG D14, USG saco gestacional D28, BCF D35.

### Regras (RB-AR)
| ID | Regra |
|---|---|
| AR-01 | OI máximo 3-4 ciclos antes de escalar para IIU ou FIV |
| AR-02 | IIU: indicações: fator masculino leve, cervical, inexplicada; contraindicação: trompas obstruídas, azoospermia |
| AR-03 | FIV: reserva baixa, ≥38a, falha IIU, fator tubário, endometriose III/IV, fator masculino grave (ICSI) |
| AR-04 | Transferência eletiva de embrião único (SET) se <35a e bom prognóstico — reduz gestação gemelar |
| AR-05 | Hiperestimulação ovariana (SHO): ≥20 folículos + E2 >3500 → substituir trigger por agonista GnRH, freeze-all |
| AR-06 | Teste β-hCG >25 mUI/mL = gestação; >100 D14 = bom prognóstico |
| AR-07 | Datação: se IVF, `gaMethod=IVF` com `ivfTransferDate` + `ivfTransferType` (D3→offset 17d; D5→19d; ciclo natural→14d) — ver 04-prenatal RB-03 |

Ref: ESHRE 2022 / ASRM 2023 / `assisted-reproduction/` (3 entidades e services).

---

## H2 (e) — Menopausa (STRAW+10)

### Estadiamento STRAW+10
- **Reprodutiva:** -5, -4, -3b, -3a (ciclos regulares).
- **Transição menopausal precoce (-2):** variação cíclica ≥7 dias persistente em ≥10 ciclos.
- **Transição tardia (-1):** amenorreia ≥60 dias.
- **Menopausa:** 12m consecutivos sem menstruação (definição retrospectiva).
- **Pós-menopausa precoce (+1a, +1b, +1c):** 0-6 anos.
- **Pós-menopausa tardia (+2):** ≥6 anos.

### MRS (Menopause Rating Scale) — 11 itens × 0-4 pontos = 0-44 total
Somatomáticos, psicológicos, urogenitais. Calculado automaticamente (`computeMrsTotal` em `menopause-assessments.service.ts:105`).

### Dados coletados
- `menopauseType` (natural/surgical/induced/POI), `ageAtMenopause`.
- Sintomas vasomotores (fogachos, sudorese), GSM (atrofia vulvovaginal, pH >4.5, dispareunia).
- DEXA lombar/colo femoral/quadril total → T-score (menor), classificação automática.
- FRAX (10y major/hip).
- Risco CV (categorias low/moderate/high).
- TRH: esquema (nenhum, estrogênio isolado, E+P cíclica, E+P contínua, tibolona), rota (oral/transdérmica), dose.
- Cognitivo: MMSE, MoCA.

### Regras (RB-MP)
| ID | Regra |
|---|---|
| MP-01 | MRS ≥17 = sintomas severos, considerar tratamento; 9-16 = moderados | `menopause-assessments.service.ts:149-163` |
| MP-02 | POI (<40a) = THM até idade fisiológica (~51a) por custo-benefício ósseo/CV | |
| MP-03 | Menopausa precoce (<45a) = risco CV e ósseo aumentado | |
| MP-04 | T-score > -1 normal; -1 a -2.5 osteopenia; ≤ -2.5 osteoporose; ≤ -2.5 + fratura = osteoporose grave | OMS / `classifyOsteoporosis` |
| MP-05 | FRAX fratura major ≥20% ou quadril ≥3% = alto risco, tratar | NOF 2022 |
| MP-06 | Vitamina D <20 deficiência; 20-30 insuficiência; repor | |
| MP-07 | GSM → estrogênio vaginal local é 1ª linha (não tem contraindicação oncológica absoluta para maioria); sistêmico se sintomas vasomotores | NAMS 2022 |
| MP-08 | pH vaginal >4.5 na pós-menopausa = atrofia | |
| MP-09 | THM oral em alto risco CV → preferir transdérmica (bypass hepático, menor risco VTE) | |
| MP-10 | Útero presente + estrogênio isolado = `urgent` hiperplasia/câncer endometrial — adicionar progesterona | `menopause-assessments.service.ts:292-301` |
| MP-11 | MMSE <24 ou MoCA <26 = investigar declínio cognitivo | |
| MP-12 | Mamografia anual ≥40a, ou bienal 50-69 (FEBRASGO); em atraso se >24m | |
| MP-13 | THM contraindicada em: câncer mama/endométrio atual, VTE recente, IAM/AVC recente, hepatopatia grave, sangramento não-diagnosticado | |

Ref: NAMS 2022 / FEBRASGO 2018 / STRAW+10 2012.

---

## H2 (f) — Rastreios preventivos por fase de vida

Entidade `preventive-exam-schedule` define cronograma.

| Rastreio | Início | Frequência | Fonte |
|---|---|---|---|
| Papanicolau (citologia) | 25 anos OU 3 anos após 1ª relação (INCA) | Anual × 2, depois 3/3 anos se ambas normais; parar 64a se histórico negativo | INCA 2016 |
| HPV-DNA (co-teste) | 30 anos | 5/5 anos se negativo | ACS 2020 |
| Mamografia | 40 anos (FEBRASGO/SBM — divergente do INCA que é 50a) | Anual 40-69; individualizar 70+ | FEBRASGO 2018 |
| Mamografia alto risco (BRCA+, história familiar) | 25-30 anos | Anual + RM anual | NCCN |
| USG mamas | Complementar se mama densa | Anual | |
| DEXA | 65a (pós-menopausa) ou antes se FRAX alto, corticoide crônico, menopausa precoce | 2/2 anos | |
| Colonoscopia | 45a (USPSTF 2021) | 10/10 anos se normal | |
| Teste HIV/sífilis/hep B e C | Ao menos 1x adulta | Anual se sexualmente ativa com múltiplos parceiros | |
| TSH | Individualizar (se sintomas, autoimune, ≥35a feminino) | | |

### Regras (RB-RA)
| ID | Regra | Fonte |
|---|---|---|
| RA-01 | Pap há >36m → alerta `warning` solicitar | `gynecology-consultations.service.ts:224-236` |
| RA-02 | Mamografia há >24m (mulheres ≥40a) → alerta `warning` | `gynecology-consultations.service.ts:237-249` |
| RA-03 | Histórico familiar câncer mama/ovário → considerar avaliação genética BRCA | `gynecology-consultations.service.ts:252-263` |
| RA-04 | BI-RADS 3 → controle 6m | `gynecology-consultations.service.ts:188-195` |
| RA-05 | BI-RADS 4A/4B/4C/5/6 → encaminhar mastologia `urgent` | `gynecology-consultations.service.ts:174-187` |
| RA-06 | BRCA1/2 positivo: salpingo-ooforectomia bilateral redutora 35-40a (BRCA1) ou 40-45a (BRCA2) | NCCN |

---

## H2 (g) — Consulta ginecológica padrão (raiz)

Já detalhada no fluxo raiz. Adicional:
- PHQ-2 (2 perguntas): ≥3 = depressão provável — aplicar PHQ-9.
- GAD-2: ≥3 = ansiedade — aplicar GAD-7.
- Violência por parceiro íntimo: triagem obrigatória em atenção primária (WAST ou HITS) — **não implementada**.
- Checkup pré-concepcional: ác. fólico 0.4mg (5mg se alto risco NTD), rubéola imune, tireoide, DM, HIV/sífilis, vacinas em dia.

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Paciente transferida de outro serviço | Abrir todos os 7 sub-fluxos opcionalmente na 1ª consulta |
| SUA aguda com instabilidade | Ir direto para hospitalização (fluxo 08) |
| Violência doméstica relatada | Deveria haver protocolo específico — **gap** |
| Suspeita câncer (BI-RADS 5, Pap ASC-H, biópsia positiva) | Alerta urgente + encaminhamento imediato oncologia |

---

## 6. Regras agregadas (raiz)

Ver seções MC-*, CO-*, IF-*, AR-*, MP-*, RA-* acima. Raiz consolida alertas ao salvar consulta.

---

## 7. Saídas e efeitos

- **Cria/altera:** `gynecology_consultations`, e um ou mais de {`menstrual_cycle_assessments`, `contraception_records`, `infertility_workups`, `ovulation_induction_cycles`, `iui_cycles`, `ivf_cycles`, `menopause_assessments`, `preventive_exam_schedules`}.
- **Notificações:** resumo paciente pós-consulta (Fase 1 copiloto), lembretes de rastreios (Pap, mamo, DEXA) via cron longitudinal.
- **Integrações:** Claude, WhatsApp, RNDS (exames), Memed (rx).

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa? |
|---|---|---|---|
| Claude | Resumo, checklist, insights | — | Sim |
| Memed/Bird ID | Rx + assinatura | — | Sim |
| Laboratórios (DASA, Fleury, SABIN) via `lab-integrations` | Resultados hormonais, Pap | Webhook HL7/FHIR | Sim |

---

## 9. Critérios de aceitação

- [ ] Dado ciclo 45d em paciente 30a sem SOP diagnosticado, alerta `cycle_long` investigar oligo-ovulação.
- [ ] Dada Rotterdam 3/3, gerar sugestão de metformina + letrozol se deseja gestar.
- [ ] Dado CHC prescrito + tabagismo ≥35a, alerta `urgent` MEC 4.
- [ ] Dada paciente 37a + 6m tentando + AMH 0.8, copiloto sugere FIV direto.
- [ ] Dado T-score -2.8 lombar, classificação automática `osteoporosis` + alerta urgente.
- [ ] Dada paciente com útero + estrogênio isolado, alerta urgente adicionar progesterona.
- [ ] Dada mamografia 2023 em consulta 2025, alerta mamografia há 24m.

---

## 10. Métricas de sucesso

- **SUA diagnosticada com PALM-COEIN:** % de consultas de menorragia com classificação estrutural completa. **Meta:** >80%.
- **Contracepção alinhada WHO-MEC:** % com categoria MEC documentada e método compatível. **Meta:** >90%.
- **Infertilidade expedita ≥35a:** tempo entre 1ª consulta e propedêutica completa. **Meta:** <3 meses.
- **Adesão a rastreios:** % de pacientes ≥40a com mamografia ≤24m. **Meta:** >75%.
- **Taxa de DEXA em pós-menopausa precoce:** **Meta:** >60%.
- **% pacientes pós-menopausa com MRS documentado:** **Meta:** >70%.

---

## 11. Melhorias recomendadas na migração

- **Fase de vida no header** — hoje `phase` está no patient mas não é exibida no contexto da consulta. Mostrar "Pré-menopausa, 48a, 15 anos desde menarca" para forçar contextualização.
- **Dashboard temporal do ciclo** — menstrual-cycle-assessments devem gerar gráfico de barras (ciclo × duração) com zona FIGO 24-38/8d. Hoje é lista de assessments.
- **Árvore de decisão WHO-MEC interativa** — transformar tabela em wizard: "escolha método → sistema valida contra condições da paciente → mostra categoria + justificativa". Hoje médico atribui categoria manualmente.
- **Portal da paciente: rastreamento de ciclo diário** — paciente registra sangramento/sintoma e sistema monta PBAC automaticamente, sugerindo assessment ao médico.
- **Painel de infertilidade por casal** — hoje `partnerId` existe mas não há visão consolidada. Construir `couple-view` com ambos cadastros + exames lado a lado.
- **Calendário de reprodução assistida** — ciclo com timeline visual (estímulo D1 → monitorização D8-D12 → trigger → captação/transferência → β-hCG). Hoje é formulário de texto.
- **Alertas de ideação suicida no PHQ-2/9** — se PHQ-9 item 9 (automutilação/suicídio) >0, protocolo urgente. Hoje só score total dispara.
- **Triagem de violência obrigatória** — implementar questionário WAST no portal com notificação confidencial.
- **FRAX integrado ao DEXA** — hoje FRAX é campo manual. Calcular on-the-fly com idade/peso/T-score/fatores.
- **Pré-concepcional estruturado** — módulo separado (ou sub-fluxo dentro de contracepção com `desires_now`) com checklist ác. fólico, rubéola, TSH, HIV/sífilis, vacinas, peso.
- **DEXA com gráfico por região e evolução** — hoje é T-score isolado; plotar lombar+fêmur+quadril em gráfico temporal (DEXA 2-2a).
- **Avaliação genética automática** — histórico familiar + idade + sub-tipo câncer → sugere teste BRCA (critérios NCCN).
- **Gatilho automático menopausa** — paciente com 12m amenorreia documentados em menstrual_cycle_assessments → sugerir transição para `menopause-assessments`.

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/gynecology-consultations/` (raiz + alertas BI-RADS/IMC/PA/rastreios)
  - `backend/src/menstrual-cycle-assessments/` (PALM-COEIN, Rotterdam, FIGO)
  - `backend/src/contraception-records/` (WHO-MEC, validade DIU/implante)
  - `backend/src/infertility-workups/` (definição ACOG, WHO groups, reserva ovariana, fator masculino)
  - `backend/src/assisted-reproduction/` (3 services: OI/IUI/IVF + entities de ciclo)
  - `backend/src/menopause-assessments/` (STRAW+10, MRS, DEXA, FRAX, TRH com alertas)
  - `backend/src/preventive-exam-schedule/` (cronograma por fase)
- **Frontend:**
  - `frontend/src/pages/gynecology/` (página principal)
  - `frontend/src/pages/patients/sections/` (GynecologyPatientSection + sub-sections por tópico)
- **Migrations:** `*GynecologyConsultation*`, `*MenstrualCycle*`, `*Contraception*`, `*Infertility*`, `*AssistedReproduction*`, `*Menopause*`, `*Preventive*`
