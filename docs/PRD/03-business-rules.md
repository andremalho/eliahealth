# Regras de Negócio Clínicas — Catálogo Consolidado

> Catálogo extraído do código-fonte do EliaHealth (abril/2026). Cada regra aponta para a fonte (arquivo + guideline quando explícito) e traz threshold, ação esperada e severidade.
>
> **Severidades:** `info` · `attention/warning` · `urgent` · `critical` (emergência).
>
> **Guidelines mais citados:** FEBRASGO, ACOG, NICE, WHO, FIGO, ISUOG, ACR (BI-RADS/TI-RADS), FMF (Fetal Medicine Foundation), NAMS, IOF, OMS 2021 (sêmen), PALM-COEIN (FIGO 2011/2018).

---

## Índice

1. [Pré-natal — sinais vitais e laboratório](#1-pré-natal--sinais-vitais-e-laboratório)
2. [Pré-natal — exames e condutas por IG](#2-pré-natal--exames-e-condutas-por-ig)
3. [HELLP / pré-eclâmpsia (lab e clínica)](#3-hellp--pré-eclâmpsia-lab-e-clínica)
4. [Monitoramento glicêmico / DMG](#4-monitoramento-glicêmico--dmg)
5. [Monitoramento de PA](#5-monitoramento-de-pa)
6. [Ultrassom — achados e alertas](#6-ultrassom--achados-e-alertas)
7. [FMF — rastreio T21/T18/T13 e PE](#7-fmf--rastreio-t21t18t13-e-pe)
8. [Coletas vaginais e rastreio de GBS/ISTs](#8-coletas-vaginais-e-rastreio-de-gbsists)
9. [Vacinas na gestação](#9-vacinas-na-gestação)
10. [Puerpério](#10-puerpério)
11. [Hospitalização / internação](#11-hospitalização--internação)
12. [Ginecologia — BI-RADS, rastreios, saúde mental](#12-ginecologia--bi-rads-rastreios-saúde-mental)
13. [Ciclo menstrual / SUA / PALM-COEIN](#13-ciclo-menstrual--sua--palm-coein)
14. [Infertilidade / TRA](#14-infertilidade--tra)
15. [Menopausa — STRAW+10, MRS, DEXA, FRAX, THM](#15-menopausa--straw10-mrs-dexa-frax-thm)
16. [Preventivos por fase da vida](#16-preventivos-por-fase-da-vida)
17. [Metadados das regras](#17-metadados-das-regras)

---

## 1. Pré-natal — sinais vitais e laboratório

| ID | Domínio | Regra | Threshold | Ação esperada | Severidade | Fonte |
|---|---|---|---|---|---|---|
| BR-PN-01 | Pré-natal | PA elevada em gestante | sistólica ≥ 140 OU diastólica ≥ 90 mmHg | Alerta "PA elevada — monitorar de perto"; conduta registrada obrigatória; checar pré-eclâmpsia | attention | `consultations.service.ts`, `clinical-rules.prompt.ts`; ACOG/FEBRASGO |
| BR-PN-02 | Pré-natal | Hipertensão grave / emergência hipertensiva | sistólica ≥ 160 OU diastólica ≥ 110 mmHg | Alerta CRÍTICO, sinais de alarme (cefaleia, escotomas, epigastralgia), considerar hospitalização urgente | critical | `bp-monitoring.service.ts#evaluateAlert`; ACOG 222 |
| BR-PN-03 | Pré-natal | Hipotensão materna | sistólica < 90 mmHg | Avaliar hipotensão (atenção) | attention | `bp-monitoring.service.ts` |
| BR-PN-04 | Pré-natal | Sinais de alarme de PE | cefaleia, escotomas ou epigastralgia com PA grave | Hospitalização urgente sugerida | critical | `bp-monitoring.enums.ts#BP_ALARM_SYMPTOMS` |
| BR-PN-05 | Pré-natal | Edema importante | grau `3+` ou `4+` | Investigar pré-eclâmpsia | urgent | `consultations.service.ts#evaluateAlerts` |
| BR-PN-06 | Pré-natal | Glicemia de jejum suspeita de DMG | ≥ 92 mg/dL sem TOTG solicitado | Ação requerida: solicitar TOTG 75g | action_required | `clinical-rules.prompt.ts`; WHO/FEBRASGO |
| BR-PN-07 | Pré-natal | Rh negativo sem Coombs ou anti-D registrado | paciente Rh-; ausência de Coombs indireto ou anti-D | Ação requerida: solicitar Coombs + programar Rhogam 28–34s | action_required | `clinical-rules.prompt.ts`; `vaccines.service.ts#createRhogamForPregnancy` |
| BR-PN-08 | Pré-natal | Perda de líquido / sangramento | qualquer relato sem encaminhamento | Encaminhar à maternidade | urgent | `clinical-rules.prompt.ts` |
| BR-PN-09 | Pré-natal | Redução de movimentação fetal (≥ 28s) | queixa sem CTG/PBF | Ação requerida: CTG ou perfil biofísico | action_required | `clinical-rules.prompt.ts` |

---

## 2. Pré-natal — exames e condutas por IG

| ID | IG | Regra / checklist | Ação esperada | Fonte |
|---|---|---|---|---|
| BR-PN-IG-01 | < 14 sem | Tipagem sanguínea + Coombs indireto + sorologias (HIV, sífilis, HBsAg, toxo IgG/IgM, rubéola IgG/IgM) + hemograma + glicemia jejum + urina tipo 1 + urocultura + USG 1T com TN | Solicitar bloco inicial completo | `clinical-rules.prompt.ts`; FEBRASGO 2024 |
| BR-PN-IG-02 | 11–13+6 sem | Morfológico 1T com TN, osso nasal, ducto venoso, tricúspide + PAPP-A + β-hCG livre | Rastreio combinado FMF T21 | FMF / ISUOG |
| BR-PN-IG-03 | 14–20 sem | Rastreio de colo curto se fator de risco | USG TV se indicado | ISUOG |
| BR-PN-IG-04 | 20–24 sem | USG morfológico 2T; ecocardiografia fetal se indicação | Agendar exames | ISUOG/ACOG |
| BR-PN-IG-05 | 24–28 sem | TOTG 75g (rastreio DMG universal); Coombs se Rh-; hemograma | Solicitar TOTG | WHO / FEBRASGO |
| BR-PN-IG-06 | 28 sem | anti-D profilático (Rhogam) se Rh- e Coombs- | Administrar Imunoglobulina anti-D 300mcg IM | FEBRASGO 2023 |
| BR-PN-IG-07 | 28–36 sem | Repetir sorologias (HIV, sífilis, HBsAg); hemograma | Solicitar | FEBRASGO |
| BR-PN-IG-08 | 35–37 sem | Cultura para estreptococo do grupo B (GBS) | Coleta vaginal/retal | FEBRASGO / ACOG |
| BR-PN-IG-09 | > 36 sem | Avaliação de bem-estar fetal; orientações de trabalho de parto | Programar rotina | FEBRASGO |
| BR-PN-IG-10 | Qualquer IG | Ácido fólico até 12 sem (no mínimo), ferro ≥ 20 sem | Prescrever se ausente | FEBRASGO |
| BR-PN-IG-11 | 28 sem+ | Perguntar sobre movimentação fetal | Registrar obrigatoriamente | ACOG |

---

## 3. HELLP / pré-eclâmpsia (lab e clínica)

| ID | Domínio | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|---|
| BR-HELLP-01 | Lab | TGO/AST elevada | > 70 U/L | Investigar HELLP | attention | `lab-results.service.ts#evaluateHellpAlerts` |
| BR-HELLP-02 | Lab | TGO/AST gravemente elevada | > 150 U/L | HELLP provável — crítico | critical | idem |
| BR-HELLP-03 | Lab | TGP/ALT elevada | > 70 U/L | Investigar HELLP | attention | idem |
| BR-HELLP-04 | Lab | TGP/ALT gravemente elevada | > 150 U/L | HELLP provável — crítico | critical | idem |
| BR-HELLP-05 | Lab | DHL/LDH elevada | > 600 U/L | Hemólise — investigar HELLP | critical | idem |
| BR-HELLP-06 | Lab | Plaquetopenia | < 150.000 /mm³ | Monitorar HELLP | attention | idem |
| BR-HELLP-07 | Lab | Plaquetopenia grave | < 100.000 /mm³ | HELLP síndrome crítico | critical | idem |
| BR-HELLP-08 | Lab | Bilirrubina total elevada | > 1,2 mg/dL | Investigar hemólise | attention | idem |
| BR-HELLP-09 | Lab | Hiperuricemia | ácido úrico > 5,5 mg/dL | Risco aumentado de PE/HELLP | attention | idem |
| BR-HELLP-10 | Clínica | Edema importante + PA elevada | ver BR-PN-05 + BR-PN-01 | Investigar PE | urgent | `consultations.service.ts` |
| BR-HELLP-11 | Lab geral | Desvio de referência | > 20% acima/abaixo do intervalo | `critical`; < 20% → `attention` | variable | `lab-results.service.ts#evaluateLabStatus` |

---

## 4. Monitoramento glicêmico / DMG

| ID | Contexto | Regra | Threshold | Ação | Fonte |
|---|---|---|---|---|---|
| BR-GLI-01 | Glicemia | Hipoglicemia grave | < 60 mg/dL | Crítico; tratamento imediato | `glucose-monitoring.service.ts#evaluateAlert` |
| BR-GLI-02 | Glicemia | Hipoglicemia leve | < 70 mg/dL | Atenção; ingerir carboidrato | idem |
| BR-GLI-03 | Glicemia | Hiperglicemia grave | > `criticalThreshold` (default 200 mg/dL) | Crítico; avaliar cetoacidose | idem |
| BR-GLI-04 | Jejum | Meta de glicemia jejum | > `targetFasting` (default 95 mg/dL) | Atenção; glicemia elevada | idem |
| BR-GLI-05 | Pós-prandial 1h | Meta 1h pós-refeição | > `target1hPostMeal` (default 140 mg/dL) | Atenção | idem |
| BR-GLI-06 | Pós-prandial 2h | Meta 2h pós-refeição | > `target2hPostMeal` (default 120 mg/dL) | Atenção | idem |
| BR-GLI-07 | Rastreio | Diagnóstico DMG por TOTG 75g | jejum ≥ 92 OU 1h ≥ 180 OU 2h ≥ 153 mg/dL | Cadastrar DMG; ativar monitoramento glicêmico | WHO/IADPSG; `clinical-rules.prompt.ts` |

---

## 5. Monitoramento de PA

| ID | Regra | Threshold | Ação | Fonte |
|---|---|---|---|---|
| BR-PA-01 | Hipotensão | sist < 90 | Atenção | `bp-monitoring.service.ts` |
| BR-PA-02 | HAS gestacional leve | sist ≥ `targetSystolicMax` (140) OU diast ≥ `targetDiastolicMax` (90) | Atenção; monitoramento próximo | idem |
| BR-PA-03 | HAS grave | sist ≥ `criticalSystolic` (160) OU diast ≥ `criticalDiastolic` (110) | Crítico; emergência hipertensiva; considerar internação | idem |
| BR-PA-04 | Sinais de alarme | cefaleia / escotoma / epigastralgia associados | Hospitalização urgente | `bp-monitoring.enums.ts#BP_ALARM_SYMPTOMS` |

---

## 6. Ultrassom — achados e alertas

| ID | Tipo | Regra | Threshold | Ação | Fonte |
|---|---|---|---|---|---|
| BR-USG-01 | Biometria | PFE < p10 | percentil fetal < 10 | Alerta: RCF/FGR, reavaliação Doppler | `ultrasound-summary.service.ts#evaluateAlerts` |
| BR-USG-02 | Morfológico 2T | Colo curto | ≤ 25 mm | Alerta colo curto; considerar progesterona/cerclagem | ISUOG |
| BR-USG-03 | Morfológico 2T | Afunilamento cervical (funneling) | presente | Alerta: risco de parto prematuro | ISUOG |
| BR-USG-04 | Morfológico 1T | Morfologia 1T alterada | achado descritivo | Alerta | ISUOG |
| BR-USG-05 | Morfológico 2T | Morfologia 2T alterada | achado descritivo | Alerta + encaminhar | ISUOG |
| BR-USG-06 | Ecodoppler / ecocardio fetal | Resultado alterado | `echoResult=altered` | Alerta: ecocardiografia fetal alterada | ISUOG |
| BR-USG-07 | BCF | Taquicardia fetal | > 160 bpm (FhrStatus.TACHYCARDIA) | Atenção: avaliar causas | `consultations.service.ts` |
| BR-USG-08 | BCF | Bradicardia fetal | < 110 bpm (FhrStatus.BRADYCARDIA) | Urgente: avaliação imediata | idem |
| BR-USG-09 | BCF | BCF ausente | FhrStatus.ABSENT | Crítico: emergência obstétrica | idem |
| BR-USG-10 | BCF | Arritmia fetal | FhrStatus.ARRHYTHMIA | Atenção: ecocardiografia fetal | idem |
| BR-USG-11 | PBF | Perfil biofísico | ≤ 4 | Crítico: comprometimento fetal grave | idem |
| BR-USG-12 | PBF | Perfil biofísico limítrofe | = 6 | Atenção: repetir em 24h | idem |
| BR-USG-13 | BI-RADS | Categoria 4A/4B/4C/5/6 | categoria ≥ 4A | Urgente: encaminhar mastologia | `gynecology-consultations.service.ts` |
| BR-USG-14 | BI-RADS | Categoria 3 | categoria = 3 | Controle em 6 meses | idem |
| BR-USG-15 | TI-RADS | Pontuação | TR1..TR5 (ACR 2017) | Condutas variáveis: TR3/4/5 exigem seguimento/PAAF | `data/report-templates.ts` (template tireoide) |

---

## 7. FMF — rastreio T21/T18/T13 e PE

| ID | Algoritmo | Regra | Threshold | Ação | Fonte |
|---|---|---|---|---|---|
| BR-FMF-01 | T21 por idade | Risco a priori por idade materna | tabela FMF `T21_AGE_RISK` (20 anos: 1:1527; 40 anos: 1:115) | Base do cálculo combinado | `screening-risk.service.ts` (Kagan UOG 2008) |
| BR-FMF-02 | T21 combinado | LR por delta-NT | ΔNT > 0.5/1.5/2.5 → LR 2.5/6/18 | Multiplica risco a priori | idem |
| BR-FMF-03 | T21 combinado | LR por osso nasal | ausente LR 6.6; hipoplásico 2.8; presente 0.4 | idem | idem |
| BR-FMF-04 | T21 combinado | LR por ducto venoso onda A | revertida 3.2; ausente 2.0; positiva 0.7 | idem | idem |
| BR-FMF-05 | T21 combinado | LR por regurgitação tricúspide | presente 4.5; ausente 0.7 | idem | idem |
| BR-FMF-06 | T21 combinado | LR bioquímico (PAPP-A / β-hCG MoM) | PAPP-A<0.4 + β-hCG>2.0 → LR 8 | idem | idem |
| BR-FMF-07 | Classificação T21 | `risco ≤ 1:100` | alto_risco | Oferecer DPNI ou teste invasivo | idem |
| BR-FMF-08 | Classificação T21 | `101–1000` | intermediário | DPNI | idem |
| BR-FMF-09 | Classificação T21 | `> 1:1000` | baixo_risco | Seguimento rotina | idem |
| BR-FMF-10 | T18 | NT MoM > 2 / PAPP-A MoM < 0.3 / β-hCG MoM < 0.3 | Multiplicadores 5× / 3× / 4× | Classificação análoga | idem (Wright UOG 2015) |
| BR-FMF-11 | PE multiparamétrico | Fatores maternos (idade, IMC, nulípara, PE prévia, HAS, DM, LES, FH) + MAP + UtA-PI + PAPP-A + PlGF | logistic regression | Classificar alto/baixo risco PE precoce | `screening-risk.service.ts#calculatePERisk` (Akolekar 2013) |
| BR-FMF-12 | PE | AAS profilaxia | alto risco (denom ≤ 100) | Prescrever AAS 100–150 mg/dia a partir de 12–16 sem até 36 sem | ASPRE / FIGO 2019 |

---

## 8. Coletas vaginais e rastreio de GBS/ISTs

| ID | Exame | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|---|
| BR-SWAB-01 | Streptococcus B (cultura ou PCR) | Positivo | resultado positivo/reagente/presente | Profilaxia intraparto obrigatória | critical | `vaginal-swabs.service.ts` |
| BR-SWAB-02 | IST (clamídia, gonococo, trichomonas, sífilis, HIV, HBV, HCV) | Positivo | qualquer | Tratamento imediato + rastreio parceiro | critical | idem |
| BR-SWAB-03 | Citologia oncótica | ASC-US/ASC-H/LSIL/HSIL/alterado | achado textual | Encaminhar colposcopia | warning | idem |
| BR-SWAB-04 | PCR HPV | Alto risco (HR) | dropdown HIGH_RISK | Encaminhar colposcopia | critical | idem |
| BR-SWAB-05 | PCR HPV | Baixo risco / positivo geral | dropdown LOW_RISK/POSITIVE | Acompanhamento recomendado | altered | idem |

---

## 9. Vacinas na gestação

| ID | Vacina | Regra | IG ideal | Ação | Fonte |
|---|---|---|---|---|---|
| BR-VAC-01 | dTpa | Indicação universal por gestação | 20–36 sem (preferência após 20) | Agendar; alertar se pendente | FEBRASGO; migration `SeedGestationalVaccineSchedule` |
| BR-VAC-02 | Influenza | Qualquer IG, todas as gestantes | sazonal | Agendar | FEBRASGO |
| BR-VAC-03 | COVID-19 | Esquema conforme protocolo vigente | qualquer IG | Agendar | PNI/Ministério Saúde |
| BR-VAC-04 | Hepatite B | Esquema se suscetível | qualquer IG | Agendar | PNI |
| BR-VAC-05 | Rhogam (anti-D) | Rh- com Coombs- | 28–34 sem; 300 mcg IM | Criar automaticamente via `createRhogamForPregnancy` | FEBRASGO 2023 |
| BR-VAC-06 | VSR (RSVpreF) | Conforme janela recomendada | ~32–36 sem | Agendar se disponível | ACIP 2023; migration `AddVsrVaccine` |
| BR-VAC-07 | HPV | Até 45 anos, fora da gestação | — | Verificar status pré-concepção/pós-parto | FEBRASGO |
| BR-VAC-08 | Status vacinal | Dose `scheduled/pending/overdue` | data passada | Alerta "pendente" ou "atrasada" | `vaccines.service.ts#getVaccineCard` |

---

## 10. Puerpério

| ID | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|
| BR-PP-01 | PA severamente elevada pós-parto | sist ≥ 160 OU diast ≥ 110 | Risco de eclâmpsia pós-parto | critical | `postpartum.service.ts#evaluateAlerts` |
| BR-PP-02 | Hipertensão pós-parto | sist ≥ 140 OU diast ≥ 90 | Monitorar de perto | urgent | idem |
| BR-PP-03 | Febre puerperal | T ≥ 38 °C | Investigar foco infeccioso | urgent | idem |
| BR-PP-04 | Lóquios fétidos | `lochiaOdor=true` | Investigar endometrite | urgent | idem |
| BR-PP-05 | Lóquios rubra tardios | tipo=rubra E `daysPostpartum > 14` | Avaliar subinvolução uterina | attention | idem |
| BR-PP-06 | Sangramento puerperal abundante | `lochiaAmount=heavy` | Avaliar hemorragia tardia | urgent | idem |
| BR-PP-07 | Infecção de ferida operatória | `woundStatus=infection` | Antibioticoterapia | urgent | idem |
| BR-PP-08 | EPDS sugestiva de depressão | ≥ 10 ou `moodScreening=moderate` | Acompanhamento próximo | attention | idem |
| BR-PP-09 | EPDS risco elevado / grave | ≥ 13 ou `moodScreening=severe` | Encaminhar avaliação psiquiátrica | critical | idem |
| BR-PP-10 | Mastite | `breastCondition=mastitis` | Antibioticoterapia | urgent | idem |
| BR-PP-11 | Abscesso mamário | `breastCondition=abscess` | Drenagem + ATB | urgent | idem |

---

## 11. Hospitalização / internação

| ID | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|
| BR-HOSP-01 | PA severa na evolução | sist ≥ 160 OU diast ≥ 110 | Emergência hipertensiva | critical | `hospitalization.service.ts#evaluateAlerts` |
| BR-HOSP-02 | PA elevada na evolução | sist ≥ 140 OU diast ≥ 90 | Monitorar | urgent | idem |
| BR-HOSP-03 | Febre | T ≥ 38 °C | Investigar foco infeccioso | urgent | idem |
| BR-HOSP-04 | Hipoxemia | SpO₂ < 92% | Crítico | critical | idem |
| BR-HOSP-05 | Oligúria | diurese < 30 mL/h | Avaliar função renal | urgent | idem |

---

## 12. Ginecologia — BI-RADS, rastreios, saúde mental

| ID | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|
| BR-GIN-01 | IMC obesidade | IMC ≥ 30 | Risco metabólico; orientar | attention | `gynecology-consultations.service.ts` |
| BR-GIN-02 | IMC baixo peso | IMC < 18.5 | Investigar | attention | idem |
| BR-GIN-03 | BI-RADS 3 | categoria 3 | Controle em 6 meses | info | idem |
| BR-GIN-04 | BI-RADS ≥ 4A | 4A/4B/4C/5/6 | Encaminhar mastologia | urgent | idem |
| BR-GIN-05 | PHQ-2 positivo | ≥ 3 | Rastreio positivo depressão | attention | idem |
| BR-GIN-06 | GAD-2 positivo | ≥ 3 | Rastreio positivo ansiedade | attention | idem |
| BR-GIN-07 | Tabagismo ativo | `smokingStatus=current` | Orientar cessação | attention | idem |
| BR-GIN-08 | Papanicolau em atraso | > 36 meses desde o último | Solicitar | attention | idem |
| BR-GIN-09 | Mamografia em atraso | > 24 meses (depende da idade) | Solicitar | attention | idem + menopause module |
| BR-GIN-10 | Rastreio de violência doméstica | sempre | Registrar abordagem | info | `clinical-rules.prompt.ts` (FEBRASGO) |
| BR-GIN-11 | WHO MEC para contracepção | combinados + tabagismo + idade ≥ 35, HAS, enxaqueca com aura | Contraindicar ou reavaliar | warning | `clinical-rules.prompt.ts` (WHO-MEC 2015) |

---

## 13. Ciclo menstrual / SUA / PALM-COEIN

| ID | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|
| BR-SUA-01 | PBAC elevado | > 100 | Menorragia objetiva | warning | `menstrual-cycle-assessments.service.ts` |
| BR-SUA-02 | Volume menstrual alto | > 80 mL/ciclo | Menorragia | warning | idem |
| BR-SUA-03 | Ciclo curto | intervalo < 24 dias | Investigar | info | idem (FIGO 2018) |
| BR-SUA-04 | Ciclo longo | intervalo > 38 dias | Investigar oligo-ovulação | warning | idem |
| BR-SUA-05 | Menstruação prolongada | duração > 8 dias | Investigar | warning | idem |
| BR-SUA-06 | PALM — malignidade/hiperplasia | flag presente | Encaminhamento urgente | urgent | idem |
| BR-SUA-07 | PALM — mioma submucoso | FIGO tipo 0/1/2 | Considerar histeroscopia | warning | idem |
| BR-SUA-08 | SOP Rotterdam | ≥ 2 de 3 critérios | Compatível com SOP | info | idem (Rotterdam 2003) |
| BR-SUA-09 | Resistência insulínica | HOMA-IR > 2.7 | Intervenção metabólica | warning | idem |
| BR-SUA-10 | COEIN — coagulopatia | flag `coeinCoagulopathy` | Investigar vWD / AF | warning | idem |
| BR-SUA-11 | Sangramento pós-coital | `chiefComplaint=postcoital_bleeding` | Colposcopia/biópsia | warning | idem |
| BR-SUA-12 | Amenorreia primária ≥ 15 anos | flag | Investigação completa (cariótipo, hormônios, anatomia) | urgent | idem |

---

## 14. Infertilidade / TRA

| ID | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|
| BR-FERT-01 | Idade materna avançada | ≥ 40 anos | Avaliação imediata, considerar TRA precoce | urgent | `infertility-workups.service.ts` |
| BR-FERT-02 | Idade materna 35+ | ≥ 35 anos | Avaliação em 6 meses (ao invés de 12) | warning | idem; ACOG |
| BR-FERT-03 | AMH muito baixo | < 0.5 ng/mL | Reserva ovariana muito reduzida | urgent | idem |
| BR-FERT-04 | AMH baixo | < 1.1 ng/mL | Reserva ovariana baixa | warning | idem |
| BR-FERT-05 | CFA baixo | < 5 | Reserva ovariana baixa | warning | idem |
| BR-FERT-06 | FSH basal elevado | > 10 mUI/mL | Reserva reduzida | warning | idem |
| BR-FERT-07 | Oligozoospermia | concentração < 16 M/mL | Alterado | warning | OMS 2021 |
| BR-FERT-08 | Astenozoospermia | motilidade progressiva < 30% | Alterado | warning | OMS 2021 |
| BR-FERT-09 | Teratozoospermia | morfologia Kruger < 4% | Alterado | warning | OMS 2021 |
| BR-FERT-10 | DFI elevado | fragmentação DNA > 30% | Considerar ICSI | warning | idem |
| BR-FERT-11 | Rastreio de infertilidade | mínimo: FSH, LH, E2, prolactina, TSH, AMH + espermograma + HSG/HSN + USG CFA + sorologias + ácido fólico | Programar | `clinical-rules.prompt.ts` |

---

## 15. Menopausa — STRAW+10, MRS, DEXA, FRAX, THM

| ID | Regra | Threshold | Ação | Severidade | Fonte |
|---|---|---|---|---|---|
| BR-MEN-01 | MRS sintomas severos | score total ≥ 17 | Considerar tratamento | warning | `menopause-assessments.service.ts` |
| BR-MEN-02 | MRS sintomas moderados | score 9–16 | Atenção | info | idem |
| BR-MEN-03 | Insuficiência ovariana prematura (POI) | `menopauseType=POI` | THM até ~51 anos (idade fisiológica) | warning | idem (NAMS/FEBRASGO) |
| BR-MEN-04 | Menopausa precoce | idade < 45 anos | Risco CV e ósseo aumentado | warning | idem |
| BR-MEN-05 | Osteopenia (DEXA T-score) | -2.5 < T ≤ -1 | Otimizar Ca/VitD, exercício, repetir DEXA 2 anos | info | idem (ISCD/WHO) |
| BR-MEN-06 | Osteoporose densitométrica | T ≤ -2.5 | Iniciar bisfosfonato/denosumabe | urgent | idem |
| BR-MEN-07 | Osteoporose grave | T ≤ -2.5 + fratura prévia | Reumatologia, teriparatida | urgent | idem |
| BR-MEN-08 | FRAX alto — fratura maior | ≥ 20% 10 anos | Alto risco | urgent | idem (IOF) |
| BR-MEN-09 | FRAX alto — quadril | ≥ 3% 10 anos | Alto risco | urgent | idem |
| BR-MEN-10 | Vitamina D deficiente | < 20 ng/mL | Reposição | warning | idem |
| BR-MEN-11 | Vitamina D insuficiente | 20–30 ng/mL | Reposição moderada | info | idem |
| BR-MEN-12 | GSM | diagnóstico clínico | Estrogênio vaginal 1ª linha | info | idem |
| BR-MEN-13 | pH vaginal elevado | > 4.5 | Compatível com atrofia/GSM | info | idem |
| BR-MEN-14 | MMSE baixo | < 24 | Investigar declínio cognitivo | warning | idem |
| BR-MEN-15 | MoCA baixo | < 26 | Investigar CCL | warning | idem |
| BR-MEN-16 | THM oral em alto risco CV | `cardioRiskCategory=high` + `estrogenRoute=oral` | Preferir via transdérmica | warning | idem (NAMS 2022) |
| BR-MEN-17 | THM indicada E contraindicada | conflito | Discutir alternativas não-hormonais | warning | idem |
| BR-MEN-18 | Estrogênio sem progesterona + útero | `hrtScheme=ESTROGEN_ONLY` E não-cirúrgica | Risco hiperplasia/CA endometrial | urgent | idem |
| BR-MEN-19 | Mamografia em atraso | `nextMammographyDate < today` | Solicitar | warning | idem |

---

## 16. Preventivos por fase da vida

| ID | Fase | Regra | Ação | Fonte |
|---|---|---|---|---|
| BR-PREV-01 | Adolescente | HPV até 45 anos, orientação ISTs | Esquema vacinal + aconselhamento | `preventive-exam-schedule.enums.ts` (FEBRASGO) |
| BR-PREV-02 | Reprodutiva 25–64 | Papanicolau (anual até 2 neg, depois trienal) | Agendar | FEBRASGO/MS |
| BR-PREV-03 | ≥ 40 anos | Mamografia anual/bienal conforme risco | Agendar | FEBRASGO |
| BR-PREV-04 | Perimenopausa 40–49 | DEXA basal se risco | Agendar | NAMS |
| BR-PREV-05 | Menopausa precoce 50–59 | DEXA + rastreio cardiovascular (SCORE/Framingham) | Agendar | idem |
| BR-PREV-06 | Menopausa tardia 60+ | Rastreios geriátricos, FRAX | Agendar | idem |
| BR-PREV-07 | Qualquer idade com vida sexual | Rastreio ISTs se fator de risco | Oferecer | FEBRASGO |
| BR-PREV-08 | Cronograma de exames | `ExamSchedule` seeded em `SeedExamSchedules` e `SeedUltrasoundExamSchedules` | Alimenta agenda automática | migrations 1711900004001/002 |

---

## 17. Metadados das regras

- **Onde o catálogo vive no código:**
  - `backend/src/clinical-copilot/prompts/clinical-rules.prompt.ts` — regras em texto injetadas no prompt Claude.
  - `backend/src/clinical-copilot/prompts/post-consultation-check.prompt.ts` — formato JSON (severity, category, title, guideline_reference).
  - Módulos clínicos individuais (`*.service.ts#evaluateAlerts` / `evaluateAlert`) — regras hard-coded executadas no save.
  - Seeds: `backend/src/migrations/1711900004001-SeedExamSchedules.ts`, `1711900014001-SeedGestationalVaccineSchedule.ts`, `1711900014002-AddVsrVaccine.ts`, `1711900010001-SeedOnDemandExams.ts`.
  - Templates de laudo USG com refs de guideline: `frontend/src/data/report-templates.ts` (cada template traz `guideline_refs`).

- **Categorias de checklist copiloto** (10 buckets, cf. `post-consultation-check.prompt.ts`): `exam · prescription · screening · vaccine · referral · monitoring · follow_up · anamnesis_gap · drug_interaction · contraindication`.

- **Severidade no checklist copiloto:** `ok · attention · action_required`. Consulta só pode ser finalizada quando todos os `action_required` estiverem resolvidos (aceitar / já feito / adiar / ignorar-com-justificativa).

- **Guidelines obrigatórios no prompt:** ACOG, FEBRASGO, NICE, WHO, FIGO, ISUOG. Qualquer nova regra deve referenciar fonte.

- **Contexto brasileiro:** priorizar disponibilidade SUS, protocolos FEBRASGO, integração RNDS.

- **Como adicionar nova regra:**
  1. Escolher módulo clínico e implementar em `evaluateAlerts()`.
  2. Se for transversal a IA, adicionar em `clinical-rules.prompt.ts` dentro do bloco de contexto adequado (`getPrenatalRules`, `getGynecologyRules`, `getMenopauseRules`, `getFertilityRules`).
  3. Incluir linha neste catálogo com ID sequencial e fonte.
  4. Migrar threshold para configuração por tenant quando fizer sentido (ex.: metas glicêmicas).

- **Configuráveis por paciente/tenant:**
  - `GlucoseMonitoringConfig`: `targetFasting`, `target1hPostMeal`, `target2hPostMeal`, `criticalThreshold`.
  - `BpMonitoringConfig`: `targetSystolicMax`, `targetDiastolicMax`, `criticalSystolic`, `criticalDiastolic`.
  - Defaults listados acima valem na ausência de config.

- **Total de regras catalogadas nesta versão:** **130+** (contar por ID `BR-*`).
