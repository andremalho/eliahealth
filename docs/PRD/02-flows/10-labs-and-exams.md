# Laboratórios e exames (solicitação, recebimento, extração IA, alertas)

> **Status atual no EliaHealth:** implementado (alertas HELLP/PE robustos; extração IA e integrações parciais)
> **Prioridade na migração:** crítica
> **Depende de:** 04-prenatal, 06-gynecology, 08-hospitalization

---

## 1. Propósito

**Problema que resolve:** o fluxo de exames (laboratório + imagem + patologia) é o maior gerador de "ruído" no prontuário. Resultados chegam em PDF/imagem do laboratório e o médico precisa: 1) abrir PDF, 2) transcrever manualmente no prontuário, 3) interpretar e comparar com referência, 4) lembrar de guidelines específicas (HELLP, DMG, pré-eclâmpsia, anemia gestacional). Exames "esquecidos" por trimestre são causa de complicações evitáveis.

**Valor entregue:** módulos integrados:
- `lab-results` — exames solicitados e resultados estruturados, com **alertas clínicos codificados por nome do exame** (HELLP via TGO/TGP/DHL/plaquetas/BT/ác.úrico; DMG via TTOG; anemia via Hb; infecciosos via `INFECTIOUS_CATEGORIES`); desvio % de referência calculado automaticamente (`attention` 0-20%, `critical` >20%).
- `lab-documents` — upload de PDF/imagem.
- `lab-integrations` — webhook inbound de laboratórios parceiros (HL7/FHIR) para receber resultados direto do LIS.
- `other-exams` — exames não laboratoriais (EKG, espirometria, densitometria, etc.).
- `ai-fill` — Claude extrai dados estruturados de texto livre (consulta ou PDF OCR'd) em JSON padronizado.

**Intenção do médico-fundador:**
- Exame é **dado estruturado, não anexo**. `lab_results.value` + `unit` + `referenceMin/Max` + `status` permite série temporal, gráficos e alertas.
- Alertas clínicos **não dependem de IA** — `evaluateStatusAndAlerts` em `lab-results.service.ts` usa regex por nome do exame e thresholds codificados (ex: `name.includes('tgo') && value > 150 → CRITICAL HELLP`). IA é para extrair, não para julgar.
- Três fallbacks de match com `exam_schedule` (scheduleId → nome exato/substring → categoria) — permite amarrar resultado com cronograma sem exigir nome idêntico ao do laboratório.
- Upload manual (PDF + imagem) é 1ª classe — muitos laboratórios não têm API. Pipeline OCR + Claude extração é planejado (`// TODO: OCR pipeline` em `lab-results.service.ts:109`).

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Médico | Solicita exames, interpreta, atualiza `status`, adiciona notes | Durante consulta |
| Paciente | Faz upload de PDF/imagem via portal | Após receber do laboratório |
| Laboratório parceiro (DASA, Fleury, SABIN) | Envia resultado via webhook HL7/FHIR | Conforme integração |
| Claude | Extrai nome/valor/unidade/referência do PDF/texto | `ai-fill.parseAndFill` |
| Copiloto | Alerta HELLP, PE, DMG, anemia, infecções, atrasos em rastreio | A cada `create/update` + cron |

**Pré-condições:**
- Paciente cadastrada. Para ex. pré-natal, `pregnancyId` existente.
- Para integração API: laboratório registrado em `lab_integrations` com credenciais.

---

## 3. Dados de entrada

### LabResult
| Campo | Tipo | Obrigatório |
|---|---|---|
| `pregnancyId` (ou `patientId`) | uuid | Sim |
| `examName` | text (ex: "TGO (AST)") | Sim |
| `examCategory` | enum (hematology/biochemistry/endocrinology/urine/infectious/hormonal/tumor_marker/other) | Sim |
| `requestedAt`, `resultDate` | timestamp | `resultDate` ao chegar |
| `value` (texto/numérico) | text | Sim quando houver |
| `unit` | text | Recomendado |
| `referenceMin`, `referenceMax` | numeric | Para cálculo desvio |
| `resultText` | text (ex: "Não reagente") | Para infecciosos |
| `status` | enum (pending/normal/attention/critical) | Auto |
| `alertTriggered`, `alertMessage` | bool + text | Auto |
| `scheduleId` | uuid (FK exam_schedule) | Opcional para match |
| `notes`, `reviewStatus` | text + enum | Pós-revisão |

### LabDocument
| Campo | Tipo |
|---|---|
| `url`, `mimeType`, `fileSize`, `uploadedBy` |
| `extractedText` (OCR) — TODO |
| `extractedData` (Claude) — TODO |

---

## 4. Fluxo principal

1. **Solicitar exames** — durante consulta, médico seleciona (a) exames do `exam_schedule` pendentes para o trimestre, ou (b) customizados. `POST /pregnancies/:id/lab-results` cria registros com `status=pending`.
2. **Impressão / envio** — pedido médico gerado em PDF (ou via sistema do laboratório).
3. **Resultado chega** — 3 caminhos:
   - **a) Upload manual** (médico ou paciente pelo portal) → `POST /lab-documents` → futuramente: OCR + Claude preenche `extractedData` → médico valida → update do `lab_result`.
   - **b) Webhook laboratório** (`POST /webhook/lab/:integrationId`) → HL7 ORU mensagem → parsed → `lab-integrations.service` cria/atualiza `lab_results`.
   - **c) Digitação manual** — médico entra valor direto.
4. **`evaluateStatusAndAlerts`** ao save:
   - Se só `resultText` em categoria infecciosa e contém "reagente"/"positivo" → `CRITICAL` + alerta.
   - Se numérico: roda `evaluateHellpAlerts` primeiro (TGO/TGP/DHL/plaquetas/BT/ác.úrico). Se bateu → usa esse status/mensagem.
   - Senão: calcula `deviationPercent` vs. `referenceMin/Max`. 0 → normal; ≤20 → attention; >20 → critical.
5. **Match com exam_schedule** — `checkExamSchedule` em clinical-protocols tenta 3 fallbacks para amarrar resultado a agenda.
6. **Copiloto consome alertas** — `copilot` module lê `alertTriggered=true` e gera:
   - Insight tempo real (Fase 3 WS).
   - Item no checklist pós-consulta (Fase 2).
   - Alerta longitudinal se atrasado (Fase 4b cron 6h).
7. **Ações clínicas** — médico vê alerta, prescreve conduta, documenta em SOAP.
8. **`reviewPatientExam`** — quando paciente faz upload, médico marca como "reviewed" com notes.
9. **Timeline** — aparece em `pregnancies.timeline` como `type=lab_result`.

```
[Solicitar lab] → [PDF pedido] → [Laboratório processa]
                                      ↓
                [Upload manual ou Webhook HL7/FHIR ou Digitação]
                                      ↓
                     [evaluateStatusAndAlerts] → HELLP / PE / DMG / anemia
                                      ↓
                      [Copiloto: insight + checklist + longitudinal]
                                      ↓
                              [Conduta + notes]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| PDF sem OCR pipeline ainda | Upload funciona, extractedText vazio, médico digita manual |
| Laboratório envia com nome variante ("TGO-AST", "ALT/SGPT") | Regex case-insensitive pega a maioria; fallback de categoria resolve restante |
| Exame com múltiplos valores (hemograma) | Cria múltiplos `lab_results` — um por item (Hb, Htc, leucócitos, plaquetas, etc.) |
| Resultado fora de sequência (resultDate antes do requestedAt) | Ordem por `resultDate` preferencial, senão `requestedAt` |
| Teste rápido positivo na consulta (HIV, HCG) | Digitar direto com `resultText=Reagente` → CRITICAL automático |
| Exame cancelado | Status `cancelled` (adicionar enum se não houver) |

---

## 6. Regras de negócio

### Alertas HELLP / pré-eclâmpsia (`evaluateHellpAlerts`)

| ID | Regra | Fonte |
|---|---|---|
| LAB-01 | TGO (AST) >150 U/L = `CRITICAL` HELLP provável | `lab-results.service.ts:203-206` |
| LAB-02 | TGO 70-150 = `ATTENTION` investigar HELLP | |
| LAB-03 | TGP (ALT) >150 = `CRITICAL`; 70-150 = `ATTENTION` | `lab-results.service.ts:209-213` |
| LAB-04 | DHL (LDH) >600 = `CRITICAL` hemólise HELLP | `lab-results.service.ts:215-218` |
| LAB-05 | Plaquetas <100.000/mm³ = `CRITICAL` HELLP; 100k-150k = `ATTENTION` | `lab-results.service.ts:220-223` |
| LAB-06 | Bilirrubina total >1.2 = `ATTENTION` investigar hemólise | `lab-results.service.ts:226-228` |
| LAB-07 | Ácido úrico >5.5 mg/dL = `ATTENTION` risco PE/HELLP | `lab-results.service.ts:231-233` |

### Diabetes gestacional (DMG)
| ID | Regra | Fonte |
|---|---|---|
| LAB-08 | Glicemia jejum no 1º tri ≥92 = DMG (novo critério IADPSG/OMS/FEBRASGO) | FEBRASGO Nota Técnica 2023 |
| LAB-09 | TTOG 75g 24-28s: jejum ≥92 OU 1h ≥180 OU 2h ≥153 = DMG | |
| LAB-10 | Glicemia ≥200 em qualquer momento + sintomas = DM tipo 2 prévio à gestação | |
| LAB-11 | HbA1c ≥6.5% pré ou 1º tri = DM prévio (não DMG) | |

### Anemia gestacional
| ID | Regra | Fonte |
|---|---|---|
| LAB-12 | Hb 1º tri <11, 2º tri <10.5, 3º tri <11 = anemia — investigar ferropriva (ferritina, sat. transferrina) | CDC 1998 / FEBRASGO |
| LAB-13 | Ferritina <30 = depleção de estoques mesmo com Hb normal — considerar ferro |  |

### Pré-eclâmpsia laboratorial
| ID | Regra |
|---|---|
| LAB-14 | Proteinúria 24h ≥300mg OU relação proteína/creatinina ≥0.3 OU fita ≥1+ com confirmação = proteinúria significativa |
| LAB-15 | Creatinina ≥1.1 ou dobrou baseline = lesão renal (PE grave) |
| LAB-16 | PE sem proteinúria é permitido (PA ≥140/90 + lesão órgão-alvo: trombocitopenia, transaminases, renal, cerebral, visual) — ACOG 2020 |

### Infecciosos
| ID | Regra | Fonte |
|---|---|---|
| LAB-17 | `resultText` contém "reagente"/"positivo" em categoria `infectious` = `CRITICAL` + alerta encaminhar | `lab-results.service.ts:132-141` |
| LAB-18 | HIV reagente 2 testes diferentes → carga viral + CD4 + referenciamento SAE; profilaxia RN | |
| LAB-19 | Sífilis (VDRL + TP) reagente — penicilina benzatina 2.4 MUI (fazer titulação mensal) | MS 2022 |
| LAB-20 | Toxoplasmose IgM+ IgG+ baixa avidez (<30%) = infecção aguda → espiramicina; amniocentese 18s | FEBRASGO 2023 |
| LAB-21 | Rubéola IgM+ = contraindicação manter gestação em 1º tri (risco síndrome rubéola congênita) — aconselhamento |
| LAB-22 | Hepatite B HBsAg+ = gestante com HBV; vacinar RN <12h + imunoglobulina |
| LAB-23 | Sorologia Zika/Dengue/Chikungunya em áreas endêmicas |
| LAB-24 | Urocultura >100.000 UFC/mL assintomática = bacteriúria → tratar (cefalexina 500mg 6/6h 7d) mesmo sem sintomas |

### Desvio genérico
| ID | Regra | Fonte |
|---|---|---|
| LAB-25 | Se numérico e fora de `[referenceMin, referenceMax]`: desvio ≤20% = `ATTENTION`, >20% = `CRITICAL` | `lab-results.service.ts:160-186` |
| LAB-26 | Resultado textual não reconhecido → `NORMAL` por padrão (e não triggear alerta) | `lab-results.service.ts:190-193` |

### Exam schedule matching (clinical-protocols)
| ID | Regra | Fonte |
|---|---|---|
| LAB-27 | Match prioritário: `scheduleId` explícito; fallback 1: nome exato/substring case-insensitive; fallback 2: mesma `examCategory` | `clinical-protocols.service.ts:108-128` |
| LAB-28 | Se GA atual > `gaWeeksMax` do schedule e sem match → `overdue` |
| LAB-29 | Se GA atual ≥ `gaWeeksMin` e sem match → `pending` |

---

## 7. Saídas e efeitos

- **Cria/altera:** `lab_results`, `lab_documents`, `lab_webhook_logs`, `other_exams`.
- **Notificações:** resultados críticos → copiloto → possivelmente WhatsApp/chat paciente se `alertTriggered` e médico confirma; paciente recebe "Novo resultado disponível".
- **Integrações:** laboratórios (HL7 MLLP ou FHIR R4 via webhook), Claude (extração), OCR (Tesseract/Google Vision futuramente).
- **Eventos:** timeline atualizada; Fase 2 checklist preenche item "resultado crítico não revisado"; Fase 4b gera `longitudinal_alert` para exames pendentes > `gaWeeksMax`.

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa |
|---|---|---|---|
| DASA / Fleury / SABIN / Hermes Pardini | Resultados via webhook | HL7 ORU/ADT ou FHIR DiagnosticReport | Sim — upload manual |
| Claude (ai-fill) | Extração de texto SOAP e PDF | Texto → JSON | Sim — médico digita |
| OCR (Google Vision API / Tesseract) | PDF/imagem upload | Arquivo → texto | Sim — texto manual |
| LabIntegrations (genérico) | Qualquer lab com API REST | Assinatura HMAC | Sim — queue retry |

---

## 9. Critérios de aceitação

- [ ] Dada TGO=180 U/L, `status=CRITICAL` + alertMessage "HELLP síndrome provável".
- [ ] Dadas Plaquetas=85.000, `status=CRITICAL` + HELLP.
- [ ] Dada glicemia jejum 95 em 1º tri, flag DMG copiloto.
- [ ] Dado TTOG (2h=160), alerta DMG.
- [ ] Dado VDRL `reativo 1:16`, `status=CRITICAL` + alerta sífilis.
- [ ] Dado Hb=9.2 em 2º tri, alerta anemia → ferro + ferritina.
- [ ] Dado exame com valor 50 e referência 20-40 (desvio 25%), `status=CRITICAL`.
- [ ] Upload manual de PDF (lab-document) fica acessível ao médico; futuramente extração automática preenche `lab_result` correspondente.
- [ ] Exame pendente com GA 15s cujo schedule era 8-12s aparece em `overdue`.

---

## 10. Métricas de sucesso

- **Cobertura de resultados estruturados:** % de lab_results com `value` ou `resultText` preenchido vs só anexo. **Meta:** >90% após OCR.
- **Taxa de alertas críticos revisados <24h:** tempo entre `alertTriggered=true` e `reviewStatus=reviewed`. **Meta:** >85% <24h.
- **Tempo médio upload → lab_result estruturado:** **Meta:** <5min com OCR+Claude ativo.
- **Taxa de match exame_schedule:** % de resultados que casaram com cronograma. **Meta:** >80%.
- **Alertas HELLP confirmados:** verdadeiros positivos → intervenção clínica documentada.
- **Exames pendentes/overdue resolvidos semanalmente (Fase 4b):** **Meta:** >70%.

---

## 11. Melhorias recomendadas na migração

- **Pipeline OCR + Claude para PDFs** — hoje `LabDocument` tem `extractedText` TODO. Implementar: upload → Google Vision OCR → Claude com prompt estruturado → retorna array de `{ examName, value, unit, referenceMin, referenceMax }` → médico revisa UI de preenchimento em lote → save em bulk.
- **Panel de hemograma expandido** — hemograma gera 15+ itens. Hoje é 1 `lab_result` por item. Criar "super-painel" que trata hemograma como objeto único com visualização lado-a-lado.
- **Gráfico temporal por item** — paciente com 8 gestações, plotar Hb em cada uma + referências por IG.
- **Alertas de combinação** — hoje `evaluateHellpAlerts` só olha 1 exame por vez. Se **simultaneamente** TGO>70 + plaq<150k + DHL>600 = `CRITICAL` HELLP confirmada (e não só "investigar"). Regra combinada em `copilot` module, não em lab-results.
- **Trend alert** — se ferritina caiu 40% em 3 meses, alertar mesmo se valores individuais na faixa (tendência de depleção).
- **Integração real Fleury/DASA** — hoje `lab-integrations` tem entity + service mas endpoints são genéricos. Implementar parsers HL7 ORU para estes labs + FHIR R4 para laboratórios modernos.
- **Solicitação eletrônica de exames** — hoje só registra pedido. Enviar pedido direto ao laboratório via portal (DASA API) com TUSS/SINAPI códigos.
- **Templates de solicitação por IG** — "Pacote 1º tri" (tipagem, Hb, HIV, VDRL, toxo, rubéola, urocultura, glicemia jejum). "Pacote 24-28s" (TTOG 75g, hemograma, urocultura, anti-HIV). Hoje médico seleciona cada item.
- **Correlação com USG e PA** — copiloto cruza: "TGO↑ + Plaq↓ + PA↑ + proteinúria↑ = HELLP iminente, hospitalizar". Hoje alertas são siloed.
- **Painel de exames "pedidos mas não chegaram"** — dashboard cron alerta paciente/secretária após 5d sem resultado: "HIV solicitado em 10/03, sem resultado até 17/03".
- **Validação de referência por laboratório** — hoje `referenceMin/Max` são copiados do exame. Ter `lab_reference_tables` por laboratório e contexto (gestante/não gestante, fase ciclo).
- **Bulk upload** — secretária carrega 20 PDFs da semana; sistema processa + sugere match com pacientes (nome + CPF).
- **Modelo de entidade `exam_panel`** — atualmente hemograma, TTOG, perfil hepático são múltiplos `lab_results`. Modelar painel com subitens preservaria semântica.
- **Alerta para paciente no portal** — resultado crítico liberado direto para paciente com contexto "seu obstetra foi notificado e entrará em contato em até 24h" (balanceando transparência e ansiedade).
- **Comparação inter-laboratórios** — paciente faz TSH no DASA e retrocontrole Fleury; unidades diferentes? Normalizar.

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/lab-results/lab-results.service.ts` (CRUD, `evaluateStatusAndAlerts`, `evaluateHellpAlerts`, `reviewPatientExam`)
  - `backend/src/lab-results/lab-result.entity.ts` + `lab-document.entity.ts`
  - `backend/src/lab-results/lab-result.enums.ts` (`INFECTIOUS_CATEGORIES`, `ExamCategory`, `LabResultStatus`)
  - `backend/src/lab-integrations/` (webhook inbound + logs)
  - `backend/src/other-exams/` (exames não-laboratoriais: EKG, espirometria, DEXA etc.)
  - `backend/src/ai-fill/ai-fill.service.ts` (extração Claude para SOAP; futuramente para PDF)
  - `backend/src/uploads/uploads.controller.ts` (multer para `lab-documents`)
  - `backend/src/clinical-protocols/clinical-protocols.service.ts` (checkExamSchedule 3-fallback)
- **Frontend:**
  - `frontend/src/pages/pregnancy/sections/AddLabResultModal.tsx`, `AddFileModal.tsx`
  - Portal paciente — seção "Meus Exames" com upload
- **Migrations:** `*LabResult*`, `*LabDocument*`, `*LabIntegration*`, `*OtherExam*`
