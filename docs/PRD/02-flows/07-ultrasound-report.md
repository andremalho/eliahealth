# Laudos de ultrassonografia (17 templates)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** crítica (diferenciador competitivo)
> **Depende de:** 01-cadastro-paciente, 04-prenatal (para obstétricos)

---

## 1. Propósito

**Problema que resolve:** ginecologistas/obstetras que fazem USG no consultório dependem de software proprietário de máquina (Samsung, GE, Mindray, Philips) para laudos, ou escrevem em Word. Nenhum aplica **estrutura ISUOG/ACR/ACOG de verdade** nem salva biometria estruturada, nem calcula percentis ao vivo, nem aplica BI-RADS/TI-RADS consistente, nem gera PDF A4 com imagens profissional, nem integra com prontuário.

**Valor entregue:** 17 templates estruturados baseados em guidelines internacionais (arquivo único `frontend/src/data/report-templates.ts` com ~1000 linhas), formulário dinâmico (`ReportFormRenderer.tsx`), cálculo automático de percentis (`ReferenceTableService`), assinatura digital SHA256 (`UltrasoundReportsService.sign`), exportação PDF A4 com imagens em grid 2×3 (`generatePdf` com PDFKit), envio por WhatsApp e email, integração com `pregnancies.timeline` e uploads.

**17 Templates (`report-templates.ts`):**
1. `obs_inicial` — Obstétrico Inicial (Precoce, <11sem)
2. `dados_gestacao` — Obstétrico 2º e 3º Trimestres
3. `doppler_obs` — Dopplervelocimetria Obstétrica
4. `morfo_1tri` — Morfológico 1º Trimestre (11-14s) com FMF
5. `morfo_2tri` — Morfológico 2º Trimestre (18-24s)
6. `avaliacao_cervical` — Cervicometria transvaginal
7. `eco_fetal` — Ecocardiografia Fetal
8. `neuro_fetal` — Neurossonografia Fetal
9. `pbf` — Perfil Biofísico Fetal (Manning 1980)
10. `pelvico_tv` — Pélvico Transvaginal
11. `pelvico_endometriose` — Pélvico TV Endometriose (mapping)
12. `mamas` — Mamas + Axilas (BI-RADS 5ª ed.)
13. `tireoide` — Tireoide (TI-RADS ACR 2017)
14. `abdome_total` — Abdome Total
15. `rins_vu` — Rins e Vias Urinárias
16. `abdome_inferior` — Abdome Inferior
17. `doppler_gine` — Dopplervelocimetria Ginecológica

**Intenção do médico-fundador:**
- Um laudo é **dado estruturado, não texto**. `data` é jsonb por `templateId` — permite buscar "todos os EFW p<10" ou "BI-RADS ≥4 em 90 dias" em SQL. Texto livre fica no campo `conclusion`.
- **Assinatura digital é hash imutável do conteúdo**, não só "clique de aprovação". `sign()` serializa todo o objeto (data + conclusion + templateId + médico + timestamp) e gera SHA256; laudo assinado **não pode ser editado** (`BadRequestException` em `update/delete`).
- PDF deve sempre caber em **A4 profissional** — layout já implementado: cabeçalho (logo + tagline), dados paciente, campos estruturados, conclusão, imagens em grid 2×3 por página, página de assinatura com linha + nome + CRM + data + hash truncado.
- Auxílio de IA para gerar interpretação (`generateReport` com Claude + `US_REPORT_SYSTEM_PROMPT`), mas **não substitui o médico** — `aiInterpretation` é campo separado de `conclusion` (médico revisa antes de assinar).

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Médico ultrassonografista | Escolhe template, preenche, revisa IA, assina, exporta | Paciente chega para exame |
| Secretária | Agenda exame, vincula à paciente/gestação | Solicitação médica |
| Paciente | Recebe PDF via WhatsApp/email + portal | Após envio |
| Claude | Gera `aiInterpretation` | `POST /ultrasound/:id/generate-report` |

**Pré-condições:**
- Paciente cadastrada. Para obstétrico: `pregnancy_id` existente com IG calculável.
- Médico autenticado com CRM cadastrado (necessário para assinatura).

---

## 3. Dados de entrada

| Campo | Tipo | Obrigatório |
|---|---|---|
| `templateId` | enum 17 opções | Sim |
| `patientId` | uuid | Sim |
| `pregnancyId` | uuid (se obstétrico) | Parcial |
| `reportDate` | date | Sim |
| `data` | jsonb (estrutura depende do template) | Sim |
| `conclusion` | text | Sim antes de assinar |
| `images[]` | array (url, filename, order) | Recomendado |
| `imageQuality` | enum (boa/média/ruim) | Opcional |
| `voiceTranscript` | text | Opcional (para ai-fill de laudo) |
| `biometries[]`, `dopplers[]`, `biophysicalProfiles[]` | sub-entidades (obstétricos) | Se aplicável |

### Biometria (obstétrico)
`bpd`, `hc`, `ac`, `fl`, `efw`, `efwPercentile`, `crownRumpLength` (CCN), `nuchalTranslucency` (TN), `nasalBone`, `amnioticFluidIndex` (ILA), `placentaLocation`, `placentaGrade`, `cervicalLength`, `fetusNumber` (1/2/3 em gemelar).

### Doppler
`umbilicalArteryPI/RI/SD/EDF`, `mcaPSV`, `mcaPI`, `uterineArteryPI`, `uterineArteryNotch`, `ductusVenosusPI`, `ductusVenosusAwave`.

### PBF (Manning — 5 parâmetros × 2 pontos cada = 0-10)
`fetalBreathing`, `fetalMovement`, `fetalTone`, `amnioticFluid`, `nstResult`, `totalScore`.

---

## 4. Fluxo principal

1. **Escolher template** — `UltrasoundPage.tsx` lista 17 opções. Filtragem por categoria (obstétrica/ginecológica).
2. **Abrir formulário dinâmico** — `ReportFormRenderer.tsx` lê `ReportTemplate.sections[].fields[]` e renderiza inputs: text, number, select, multiselect, textarea, boolean, group, table, date, calculated. Campos `apenasMultipla` só aparecem se gestação múltipla; `replicatePorFeto` replicam bloco por número de fetos.
3. **Preencher biometria** — para obstétricos, `POST /ultrasounds/:id/biometry` salva + `ReferenceTableService.calculateBiometryPercentiles(gaWeeks, measures)` retorna percentis (BPD/HC/AC/FL/EFW — tabelas Intergrowth-21st, Hadlock, Nicolaides); `efwPercentile` é gravado automaticamente.
4. **Preencher Doppler e PBF** (quando aplicável) — sub-endpoints separados com validações (ex: PBF total 0-10).
5. **Inserir imagens** — upload em `uploads` (multer), referência em `images[]` com ordem.
6. **Gerar laudo IA (opcional)** — `POST /ultrasound/:id/generate-report` envia contexto para Claude com `US_REPORT_SYSTEM_PROMPT` (9 seções: dados, biometria, anatomia, LA, placenta, Doppler, colo, conclusão, recomendações). Resposta fica em `aiInterpretation` — médico revisa.
7. **Escrever conclusão** — médico edita campo `conclusion` (pode partir da `aiInterpretation`).
8. **Assinar** — `POST /ultrasound-reports/:id/sign` com `doctorName` + `doctorCrm`. Gera SHA256 do payload (id, templateId, data, conclusion, reportDate, doctorName, doctorCrm, timestamp ISO). Status vira `SIGNED`, `signedAt`, `signatureHash`.
9. **Exportar PDF** — `GET /ultrasound-reports/:id/pdf` usa PDFKit: cabeçalho Elia + tagline, paciente + data, campos do `data` jsonb iterados (label humanizado), conclusão, **imagens** em grid 2×3 por página (A4, 180px altura), página final com **linha + nome + CRM + timestamp + hash truncado**. Status vira `EXPORTED`.
10. **Enviar paciente** — `POST /ultrasound-reports/:id/send` com `via` (whatsapp/email) + `to`. `sentAt`, `sentVia`, `sentTo` gravados.
11. **Timeline** — aparece em `pregnancies.getTimeline` como `type=ultrasound`.

```
[Template (17)] → [Form dinâmico] → [Biometria + Doppler + PBF + Imagens]
       ↓
[Claude → aiInterpretation] → [Médico edita conclusion]
       ↓
[sign SHA256] → [PDF A4] → [WhatsApp/email] → [Timeline + Portal paciente]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Laudo já assinado — tentativa de edição | `BadRequestException` "Laudo assinado nao pode ser editado" (`ultrasound-reports.service.ts:67-68`) |
| Exportar sem assinar | `BadRequestException` "Exportacao permitida apenas apos assinatura" |
| Claude API falha | `aiInterpretation` recebe mensagem de erro; médico escreve conclusão manualmente |
| Gemelar | Templates com `replicatePorFeto` geram blocos para feto A/B; biometria/Doppler/PBF são salvos com `fetusNumber` |
| Paciente sem gestação (pélvico/mamas/tireoide) | `pregnancyId=null`, templates ginecológicos |
| BI-RADS 4/5/6 | Template `mamas` exige conclusão compatível + notifica gynecology-consultation do alerta |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Laudo assinado é imutável (no update, no delete) | `ultrasound-reports.service.ts:67, 123` |
| RB-02 | Hash SHA256 do payload `(id+templateId+data+conclusion+reportDate+doctorName+doctorCrm+timestamp)` | `ultrasound-reports.service.ts:79-90` |
| RB-03 | Morfológico 1º tri: CCN deve estar 45-84mm (equivale 11s0d-13s6d) | ISUOG 2013 / FMF |
| RB-04 | NT medida em plano sagital, feto em posição neutra, calipers `+` na linha interna a interna | ISUOG / FMF 2014 |
| RB-05 | Biometria 2º tri: BPD+HC plano transtalâmico; AC plano estômago+vasos porta; FL eixo completo | ISUOG 2022 |
| RB-06 | EFW Hadlock IV (BPD+HC+AC+FL) ou Intergrowth-21st; percentil <3 = RCIU grave, <10 = PIG | FIGO 2020 |
| RB-07 | Doppler artéria umbilical: PI/RI elevados + fluxo diastólico ausente (EDF absent) = classe II insuficiência placentária; reverso = grave | ISUOG 2022 |
| RB-08 | Doppler cerebral média (ACM): PSV >1.5 MoM = anemia fetal (aloimunização) | |
| RB-09 | Cerebroplacental ratio CPR = MCA_PI / UA_PI; <1 anormal em >34s | |
| RB-10 | Ducto venoso onda-a reversa = aneuploidia ou cardiopatia | |
| RB-11 | Artérias uterinas PI médio >1.5 MoM em 1º tri ou notch bilateral = risco PE | |
| RB-12 | PBF Manning: respiração+movimento+tônus+LA+NST, cada 0 ou 2 → total 0-10. ≤4 grave, 6 limítrofe, 8/10 normal | |
| RB-13 | ILA (índice líquido amniótico): normal 8-25cm; <5 oligohidrâmnio; >25 polihidrâmnio | |
| RB-14 | Cervicometria TV 16-24s: <25mm = colo curto → progesterona vaginal 200mg/d |  FIGO 2021 |
| RB-15 | Placenta prévia: marginal (beirda orificio), parcial (cobre parcial), total. USG TV é padrão ouro após 28s | |
| RB-16 | Mamas BI-RADS 5ª ed.: 0 (incompleto), 1 (normal), 2 (benigno), 3 (provavelmente benigno — 6m), 4A/4B/4C (suspeita baixa/média/alta), 5 (altamente suspeita ≥95%), 6 (biopsia confirmada) | ACR 2013 |
| RB-17 | Mamas categoria de densidade: A (adiposa), B (dispersa), C (heterogeneamente densa), D (extremamente densa) | |
| RB-18 | Tireoide TI-RADS: TR1 (0pts), TR2 (2pts), TR3 (3pts), TR4 (4-6pts), TR5 (≥7pts); recomendação PAAF por tamanho | ACR 2017 |
| RB-19 | Endometriose mapping (SRU/RSNA 2024): deep infiltrating (DIE) em bexiga, retossigmoide, septo retovaginal, ureter; medir lesões | |
| RB-20 | Endométrio pós-menopausa: >4mm sem sangramento investigar; >5mm com sangramento biópsia | ACOG 2018 |
| RB-21 | Ovários pós-menopausa: volume >10mL anormal | |
| RB-22 | Translucência nucal (NT): >3.0mm ou >p99 = risco aumentado aneuploidia/cardiopatia; osso nasal ausente aumenta risco T21 (LR 6.6) | FMF |
| RB-23 | Biometria registrada obrigatoriamente vincula `ultrasoundId`; `calculateBiometryPercentiles` roda automaticamente | `ultrasound.service.ts:112-139` |
| RB-24 | Laudo sem `conclusion` não assina (boa prática, implementar validação) | **gap** |
| RB-25 | Envio PDF por WhatsApp requer template aprovado pela Meta se for >24h da última interação com paciente | |

---

## 7. Saídas e efeitos

- **Cria/altera:** `ultrasound_reports` (jsonb por template), `ultrasounds` + `fetal_biometries` + `doppler_data` + `biophysical_profiles` (sub-entidades obstétricas), `uploads` (imagens).
- **Notificações:** WhatsApp + email com PDF.
- **Integrações:** Claude (gera laudo), PDFKit (geração), WhatsApp, SMTP.
- **Eventos:** timeline da gestação atualizada; se IG recente diverge DUM >7d pode sugerir atualizar datação; se detectado NT aumentado, dispara item no copiloto checklist sugerindo combinado+screening T21.

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa |
|---|---|---|---|
| Claude | Gerar interpretação | JSON contexto (biometrias+Dopplers+PBF+IG) | Sim — médico escreve manual |
| PDFKit (local) | PDF A4 | Report completo | N/A |
| WhatsApp Business | Envio | Template + PDF URL | Fallback email |
| SMTP | Envio | PDF anexo | |
| FMF (certificado) | Risco definitivo T21/PE | — | Sistema calcula aproximado |

---

## 9. Critérios de aceitação

- [ ] Dado template `morfo_1tri`, campo CCN=60mm, então permite preencher NT e calcular risco FMF.
- [ ] Dado laudo assinado, ao tentar editar retorna 400 "Laudo assinado nao pode ser editado".
- [ ] Dado laudo gemelar MCDA, seção biometria replica para feto A e feto B.
- [ ] Dado BPD=75mm em 29s, biometria.efwPercentile calculada e persistida.
- [ ] Dado laudo com 6 imagens, PDF monta em 2 colunas × 3 linhas (página de imagens única).
- [ ] Dado laudo assinado, PDF exibe hash truncado "Hash: a1b2c3d4e5f6..." na página de assinatura.
- [ ] Dado PBF total=4, alerta crítico no prontuário e comunicação com obstetra atendente.
- [ ] Dado laudo enviado por WhatsApp, `sentAt`, `sentVia=whatsapp`, `sentTo=+5511...` são gravados.

---

## 10. Métricas de sucesso

- **Tempo médio laudo** (abrir → assinar): **Meta:** <8 min para obstétrico 2º tri de rotina.
- **Taxa de uso de IA:** % de laudos que usaram `aiInterpretation` como rascunho. **Meta:** >60%.
- **Taxa de edição pós-IA:** % de `conclusion` que divergem substancialmente do `aiInterpretation` (sinal de qualidade da IA).
- **Entrega de PDF ao paciente:** % de laudos assinados que foram enviados em <24h. **Meta:** >80%.
- **Taxa de laudos estruturados vs texto livre:** % de laudos usando templates (não "outros"). **Meta:** >95%.

---

## 11. Melhorias recomendadas na migração

- **Fragmentar modal monolítico em wizard de 4 passos** — hoje `ReportFormRenderer` renderiza todas as seções em um scroll único. Quebrar em: passo 1 (dados do exame + paciente) → passo 2 (biometria/achados) → passo 3 (conclusão + imagens) → passo 4 (assinar + enviar). Reduz sobrecarga cognitiva.
- **Preview PDF ao vivo** — painel lateral direita mostra PDF sendo gerado à medida que médico digita. Hoje só gera após assinatura.
- **Assinatura via certificado digital ICP-Brasil real** — hoje `signatureHash` é só SHA256 simples. Integrar Bird ID / SafeID / VIDaaS (mesmo mecanismo do fluxo 09-prescription) para assinar com e-CPF real.
- **Tabelas de referência atualizadas** — `ReferenceTableService` deve confirmar se usa Intergrowth-21st (padrão internacional pós-2014) ou Hadlock 1991; permitir selecionar por paciente (etnia/contexto).
- **Cálculo ao vivo de risco FMF no morfológico 1º tri** — hoje preenche formulário e calcula via POST separado. Calcular on-blur para feedback imediato (alto/intermediário/baixo risco).
- **Comparador temporal entre USG** — "BPD aumentou 20mm em 4 semanas" com gráfico de curva de crescimento sobreposta; biometria em gráfico percentil (p3-p10-p50-p90-p97) por parâmetro.
- **BI-RADS com seletor visual** — mostrar imagens-exemplo de cada categoria (0-6) para padronizar decisão; hoje é dropdown textual.
- **TI-RADS com calculador** — pontuação automática a partir dos checkboxes (composição, ecogenicidade, formato, margem, focos ecogênicos) ao invés de o médico escolher TR1-TR5 direto.
- **Rastreamento de laudo no contexto obstétrico** — ao abrir consulta pré-natal, últimos USG aparecem no painel lateral com percentis.
- **Voice-to-report** — `voiceTranscript` já existe; ativar recorder embutido + Claude para preencher campos do template. Fluxo dita-e-revisa.
- **Versão em outro idioma** — hoje layout/labels em português. Modelar i18n para PT/EN/ES (já tem `i18n` module mas templates estão hardcoded).
- **Assinatura em lote** — médico com 15 laudos do dia deve poder assinar em sequência com 1 senha.
- **Disclaimer de IA no PDF** — quando usado `aiInterpretation`, adicionar rodapé "Laudo auxiliado por IA e revisado pelo médico" para compliance.
- **Imagens com anotação** — permitir desenhar sobre imagens (setas, medidas) antes de anexar ao laudo. Hoje só upload.
- **Layout PDF customizável por tenant** — hoje cabeçalho é hardcoded "eliahealth". Permitir upload de logo da clínica + dados de registro.

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/ultrasound/ultrasound.service.ts` (CRUD + biometria + Doppler + PBF + `generateReport` com Claude)
  - `backend/src/ultrasound/reference-table.service.ts` (percentis)
  - `backend/src/ultrasound/biometry-parameter.enum.ts` (BPD, HC, AC, FL, EFW, CRL, NT, CERVICAL_LENGTH)
  - `backend/src/ultrasound-reports/ultrasound-reports.service.ts` (`create`, `update`, `sign` com SHA256, `markExported`, `markSent`, `generatePdf` com PDFKit)
  - `backend/src/ultrasound-reports/ultrasound-report.entity.ts` (status DRAFT/SIGNED/EXPORTED, images, signatureHash)
  - `backend/src/ultrasound-reports/screening-risk.service.ts` (FMF T21/T18/PE)
- **Frontend:**
  - `frontend/src/data/report-templates.ts` (17 templates, ~1000 linhas)
  - `frontend/src/pages/ultrasound/UltrasoundPage.tsx` (listagem, filtro por categoria)
  - `frontend/src/pages/ultrasound/ReportFormRenderer.tsx` (renderizador de campos dinâmicos)
- **Migrations:** `*UltrasoundReport*`, `*FetalBiometry*`, `*DopplerData*`, `*BiophysicalProfile*`
