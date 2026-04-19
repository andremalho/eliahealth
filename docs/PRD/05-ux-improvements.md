# Melhorias recomendadas na migração

> Consolidação de descobertas da varredura do código: bugs latentes, integrações falsas, gaps clínicos, fricções de UX e oportunidades para o produto-sucessor superar o original.
> Cada item tem **diagnóstico** (o que está errado/limitado hoje) e **recomendação** (o que fazer no novo produto).
> Prioridades: 🔴 **crítico** (segurança/legal/clínico) · 🟠 **alto** (funcional quebrado) · 🟡 **médio** (UX/fricção) · 🟢 **oportunidade**.

---

## 1. Segurança crítica — consertar antes de migrar

### 🔴 1.1 SQL injection latente em queries com `tenantId` interpolado

**Diagnóstico:** `copilot-dashboard.service.ts:15` e `billing.service.getSummary` concatenam `tenantId` do JWT direto em SQL via template string (``AND tenant_id = '${tenantId}'``). Mesmo que o dado venha do token, é prática inaceitável — se um dia o JWT passar a aceitar valores externos (por ex. admin impersonation), é SQLi.

**Recomendação:** banir interpolação em SQL. Toda query ORM ou `DataSource.query(sql, [params])`. Adicionar regra de lint que quebra o build em `` ` ... ${ ` `` dentro de strings SQL.

### 🔴 1.2 `billing.service.findByPatient` não filtra `tenantId`

**Diagnóstico:** um médico de um tenant consegue ler faturamento de paciente de outro tenant ao chutar `patientId`.

**Recomendação:** filtro `tenantId` obrigatório em TODO repository query. Implementar `TenantScopedRepository` abstrato que aplica o filtro automaticamente via subscriber TypeORM. Testes automatizados de "cross-tenant read" para cada entity.

### 🔴 1.3 `research-query.service.ts` executa SQL gerado por Claude com whitelist só por regex

**Diagnóstico:** natural-language query → Claude → SQL → `DataSource.query`. Proteção: regex "SELECT-only, bloqueia DDL/DML". Sem role Postgres separada. Regex pode ser burlada com comentários, CTEs, funções. Acesso aos dados completos da base (não só `research_records` anonimizada).

**Recomendação:**
- Role Postgres `elia_research` com `GRANT SELECT` **apenas** em `research_records` + views anonimizadas.
- `DataSource` separado com essa role.
- Parser SQL (node-sql-parser) validando AST — não regex.
- Timeout de query 5s.
- Log de auditoria com hash da query original em linguagem natural + SQL gerado + usuário + tenant.

### 🔴 1.4 `TenantGuard` não bloqueia endpoints quando módulo está desativado

**Diagnóstico:** tenant configura "sem módulo de hospitalização" → frontend esconde menu, mas backend aceita `POST /hospitalizations` normalmente. Fuga de escopo funcional.

**Recomendação:** decorator `@RequiresModule('hospitalization')` no controller que lê `tenant_configs` e retorna 403 quando desligado. Teste automatizado para cada módulo flagável.

---

## 2. Clínico crítico — risco à paciente

### 🔴 2.1 EPDS item 10 (ideação suicida) sem regra isolada

**Diagnóstico:** `05-postpartum` usa Edinburgh Postnatal Depression Scale (EPDS). Hoje o sistema só dispara alerta quando **score total ≥13**. Porém o item 10 pergunta especificamente sobre **ideação suicida** — NICE CG192 exige ação imediata mesmo se a pontuação total for baixa.

**Recomendação:** regra `BR-PP-EPDS-ITEM10`: `epds.item10 > 0 → alerta vermelho imediato + notificação ao médico em <1h + sugestão de encaminhamento psiquiátrico + link SAMU 192`. Independente de score total.

### 🔴 2.2 Rh negativo + Coombs — Rhogam não dispara automaticamente

**Diagnóstico:** `PatientsService` cria vacina Rhogam pendente quando Rh da paciente é negativo. Mas **não considera** o resultado de Coombs indireto. Coombs negativo em Rh- na 28ª semana deveria auto-criar pendência Rhogam. Hoje é manual.

**Recomendação:** listener no event `LabResultCreated` → se `testType === 'coombs_indireto' && result === 'negative' && patient.rhFactor === 'negative' && pregnancy.ig > 26 semanas` → criar `Vaccine { name: 'Anti-RhD (Rhogam)', dueDate: +7d, alert: true }`.

### 🔴 2.3 Rh negativo setado em JSONB sem reversão

**Diagnóstico:** `PatientsService.create/update` adiciona `rh_negative` no JSONB `pregnancies.high_risk_flags` via SQL raw (`@>` idempotente). Se o Rh for corrigido (erro de cadastro, re-teste), o flag permanece — paciente fica marcada como alto risco para sempre.

**Recomendação:** tornar flags derivadas (views ou computed property) em vez de cacheadas. Se precisar materializar, criar recálculo automático via subscriber em update.

### 🔴 2.4 Regex de auto-classificação de alto risco é frágil

**Diagnóstico:** `pregnancies.service.ts:354-364` classifica gestação como alto risco se `currentPathologies` matcha `/hipertens/`, `/diabetes|dm[12]|lada|mody/`, `/trombofil/`. Problema: "hipertensão resolvida", "sem diabetes", "antecedente familiar de trombofilia" todos disparam.

**Recomendação:** substituir regex por taxonomia clínica controlada (ICD-10 ou SNOMED) com checkbox no cadastro. Reservar campo livre para observação, não para inferência.

### 🔴 2.5 Thresholds HELLP são siloed por exame

**Diagnóstico:** HELLP exige combinação (hemólise + enzimas hepáticas + plaquetopenia). Hoje cada lab result dispara alerta isoladamente. Médico vê 3 alertas em horários diferentes mas não há alerta-síndrome.

**Recomendação:** `HellpSyndromeDetector` que escuta `LabResultCreated` e mantém janela móvel de 72h por paciente. Dispara alerta composto quando >=2 dos 3 critérios presentes na janela.

### 🔴 2.6 `AdmissionStatus` não tem `DIED`

**Diagnóstico:** enum de alta hospitalar tem `DISCHARGED` / `TRANSFERRED` / `AMA`. Não tem `DIED`. Alta por óbito registrada como "alta normal". Gap legal (óbito materno deve ser reportado ao MS) e impede cálculo de mortalidade.

**Recomendação:** adicionar `DIED` e, junto, formulário de Declaração de Óbito (DO) integrado — ou ao menos campo "causa do óbito" linkado ao fluxo de notificação SIM (Sistema de Informação sobre Mortalidade).

### 🔴 2.7 AAS para pré-eclâmpsia: sugerido, não auto-prescrito

**Diagnóstico:** ACOG 222 recomenda AAS 100mg/dia 12-36 semanas em pacientes com fatores de risco. O copiloto **sugere** textualmente, mas não cria a prescrição. Vários médicos esquecem.

**Recomendação:** quando `RB-PN-AAS` atende critérios (HAS crônica, DM, IMC>30, nuliparidade + outro fator etc.), criar prescrição em estado `draft` já preenchida, basta médico revisar e assinar. Reduz de N cliques para 1.

---

## 3. Integrações falsas ou parciais — consertar ou remover

### 🟠 3.1 Memed é mock

**Diagnóstico:** `generateMemedToken` retorna string fake `memed_tmp_${id}_${timestamp}`. Nenhuma integração real com API da Memed. Prescrições digitais funcionam, mas não são Memed de verdade — o que implica limitações legais (CFM exige integração ou assinatura ICP-Brasil própria para prescrição digital).

**Recomendação:**
- Opção A: integrar Memed de verdade (contratar, chave API, webhook).
- Opção B: remover menção a Memed, usar apenas ICP-Brasil (Bird ID/VIDaaS/etc.) e gerar PDF assinado próprio.
- Nunca deixar mock em produção — risco regulatório.

### 🟠 3.2 Assinatura SHA256 de laudos não é ICP-Brasil

**Diagnóstico:** `ultrasound-reports` assinam laudo com SHA256 interno. Schema já prevê providers (`BIRD_ID`, `CERTISIGN`, `VALID`, `SAFE_ID`, `VIDAAS`) mas wiring não existe — o campo é só "interno". Não tem valor jurídico forte.

**Recomendação:** implementar provider-pattern real:
- `IcpBrasilSigner` interface
- 1 implementação por provider (Bird ID, VIDaaS etc.)
- Laudo assinado gera PDF com XMP metadata da assinatura + hash SHA256 externo verificável
- Tenant configura quais providers permite

### 🟠 3.3 Lembretes de agendamento quebrados silenciosamente

**Diagnóstico:** `AppointmentReminderService` usa `whatsAppService.sendOTP` como "enviar texto livre" (que provavelmente falha fora da janela 24h do WhatsApp Business). E marca `reminder48hSent=true` mesmo quando o envio falha (try/catch sem rollback). Email usa `sendOtpEmail` como fallback hack. Cron roda no fuso do servidor, não do tenant.

**Recomendação:**
- Template dedicado WhatsApp Business `appointment_reminder_48h` e `appointment_reminder_24h` aprovado na Meta.
- `sendWhatsAppTemplate()` método separado de OTP.
- Estado de reminder com 3 valores: `pending` / `sent` / `failed` + `failureReason`.
- Retry com backoff exponencial.
- Cron em fuso do tenant (`tenant.timezone`).

### 🟠 3.4 FMF algoritmo simplificado

**Diagnóstico:** `screening-risk.service` implementa Kagan 2008 / Akolekar 2013 simplificados com LR multiplicativos. Aproximado. Documentado internamente como "uso assistido".

**Recomendação:** documentar **explicitamente na UI** que o cálculo é auxiliar e não substitui a calculadora oficial FMF (fetalmedicine.org). Adicionar link direto para o risco calculado pelo médico na FMF oficial e campo para colar o resultado final lá. Ou licenciar a FMF Test API (se houver).

### 🟡 3.5 Conteúdo educativo por IG sem fonte visível

**Diagnóstico:** `content/` serve textos por IG para o portal, mas o autor/revisor clínico de cada peça não aparece. Paciente não sabe se é FEBRASGO ou blog.

**Recomendação:** toda peça de conteúdo tem campos `author`, `clinicalReviewer`, `sources[]`, `lastReviewedAt`. Footer do card mostra "Revisado por Dr. X em março/2026. Fonte: FEBRASGO."

---

## 4. UX — fricções e oportunidades

### 🟡 4.1 Onboarding atual é tooltip sobreposto

**Diagnóstico:** flows `doctor_main` e `copilot_consultation` usam spotlight overlay. Médico apressado pula tudo e depois não sabe onde está nada. Não retomável.

**Recomendação:** onboarding em **checklist lateral persistente** (estilo Linear/Notion) com 6-8 itens: "Cadastre sua primeira paciente", "Abra uma gestação", "Receba o primeiro alerta do copiloto". Persiste até 100% concluído, minimizável. Analytics mostra quais itens empacam.

### 🟡 4.2 Fase 2 bloqueia finalização — ansiedade alta

**Diagnóstico:** checklist pós-consulta bloqueia finalização da consulta se houver itens `ACTION_REQUIRED`. É o comportamento correto clinicamente, mas gera ansiedade de "não consigo fechar a ficha".

**Recomendação:** modo "soft-block" com contador visual: botão "Finalizar (2 itens pendentes)" que ao clicar abre o checklist em foco. Permitir finalização com nota obrigatória quando item é justificável. **Preservar** o block real para itens do tipo `contraindication` / `drug_interaction` — nunca relaxar esses.

### 🟡 4.3 Chatbot WhatsApp síncrono sem indicador imediato

**Diagnóstico:** paciente manda dúvida → espera resposta IA → pode demorar 5-15s. Durante a espera, nada acontece no WhatsApp. Paciente duplica mensagem.

**Recomendação:** indicador imediato (<1s) "Seu médico foi notificado. A Elia está preparando uma resposta inicial baseada na sua consulta." Depois vem a resposta IA como complemento. Se paciente responde antes da IA, prioriza humano. Mostra typing indicator se API suportar.

### 🟡 4.4 Fluxo USG é modal monolítico

**Diagnóstico:** escolher template → preencher 40+ campos → assinar → exportar, tudo num modal gigante. Perda de progresso se fechar acidentalmente. Sem preview do laudo final.

**Recomendação:** wizard de 4 passos (Template → Biometria → Achados → Conclusão e assinatura) com preview PDF **ao vivo** na lateral. Auto-save a cada campo. Retomável.

### 🟡 4.5 PA é input numérico cru

**Diagnóstico:** médico digita `145 / 92`. Sem feedback visual. Alerta aparece só após salvar.

**Recomendação:** componente `BloodPressureInput` com zona verde/amarela/vermelha ajustável por IG (limiares diferentes no 3º tri). Feedback inline antes de salvar. Histórico sparkline dos últimos 5 registros na lateral.

### 🟡 4.6 Portal da paciente: OTP sem fallback

**Diagnóstico:** 5 tentativas em 10 min. Paciente digita errado, bloqueia. Não tem opção de trocar canal (email↔WhatsApp) sem recomeçar.

**Recomendação:** botão "Receber código por email em vez de WhatsApp" sempre visível na tela de OTP. Contador regressivo do tempo restante. "Não recebi" → reenvia após 60s + troca de canal. Após 5 tentativas bloqueia só o canal atual, não a tentativa toda.

### 🟡 4.7 Vínculo secretária-médico exige admin

**Diagnóstico:** médico quer adicionar secretária, precisa chamar admin, espera aprovação, secretária recebe email. Três atores, muito tempo.

**Recomendação:** médico convida secretária direto por email/telefone. Secretária entra e vê "Você foi convidada por Dra. X. Aceita?". Admin só precisa aprovar se a secretária nova ainda não existe no tenant (1º convite dela). Nas vezes seguintes, médico convida direto.

### 🟢 4.8 Dashboard é "tudo ao mesmo tempo"

**Diagnóstico:** 7 queries paralelas → 7 blocos visuais. Denso demais para o 1º login do dia.

**Recomendação:** priorizar dinamicamente — **urgências sempre em cima**, resto colapsável. Modo "manhã" (todas as pendências), modo "meio-do-dia" (só urgente), modo "fim-do-dia" (pendências não resolvidas). Preset salvo por usuário.

---

## 5. Oportunidades de produto-sucessor

### 🟢 5.1 Aproveitar a nova identidade (Lunar Bloom) para elevar editorial

Portal da paciente hoje é "dashboard de dados". Na migração, tratar como **produto editorial** (estilo NYT Styles + Aesop) — cada seção tem respiração, headings grandes, Fraunces italic em palavras-chave emocionais. O produto-irmão elia·mov já está assim; elia·health deve espelhar no portal do paciente.

### 🟢 5.2 Conectar ao elia·mov

Paciente do elia·health que também usa elia·mov (B2C) poderia ter: ciclo menstrual sincronizado, treino adaptado ao pós-parto, lembretes de vacina do bebê. O `eliahealth-integration/` no elia·mov já prevê isso (opt-in LGPD). Operacionalizar.

### 🟢 5.3 Anamnese assistida por voz

Médico dita durante a consulta → Whisper transcreve → Claude estrutura em SOAP. Reduz tempo de documentação em 40-60%. Já existe Claude Sonnet com áudio; infra está quase pronta.

### 🟢 5.4 Laudo USG com anotação em imagem

Hoje o laudo é texto + PDF. Oportunidade: DICOM viewer embutido + anotação sobre imagem (setas, medidas) → exportado no PDF final. Gap vs sistemas dedicados de radiologia, mas crítico para BI-RADS/TI-RADS onde a localização da lesão importa.

### 🟢 5.5 Co-piloto preditivo pré-consulta

Hoje copiloto roda **durante** consulta. Oportunidade: **antes** — 1h antes da consulta, analisar histórico da paciente + últimos exames + motivo agendado → pré-briefing de 30s que o médico lê no celular a caminho do consultório. Aumenta qualidade da consulta sem aumentar tempo dela.

### 🟢 5.6 Exportação FHIR para wearables

FHIR R4 já está no backend. Oportunidade: Apple Health / Google Fit / Oura Ring importarem dados do portal da paciente via FHIR. Diferencial de portal ativo real.

---

## 6. Observabilidade — o que falta medir

Hoje `analytics/` mede engajamento paciente e IA. Faltam:

- **Tempo médio de consulta** por médico e por tipo (baseline + meta).
- **% de checklist ACTION_REQUIRED aceito vs ignorado** (se >40% ignorado, regra precisa revisão).
- **Taxa de resposta do chatbot em <30s** (SLA implícito).
- **Taxa de laudo USG re-aberto após assinatura** (proxy de erro).
- **Taxa de no-show** por categoria de agendamento (cor).
- **MTTR de alerta longitudinal** (quanto tempo entre `longitudinal_alert` criado e resolvido).

---

## 7. Roadmap sugerido de migração (ordem)

1. **Fundação segura** — itens 1.1 a 1.4 (SQLi, tenant isolation, research sandbox, module guards). **Não migre dados até isso estar pronto.**
2. **Identidade + acesso** — fluxos 01 (auth), 20 (multi-tenant), 03 (patient registry) com as correções clínicas 2.3/2.4.
3. **Espinha clínica** — 04 (pré-natal), 05 (pós-parto com fix EPDS 2.1), 08 (hospitalização com DIED 2.6), 06 (ginecologia), 10 (labs), 09 (prescrição com ICP real 3.2).
4. **IA** — 16 (copiloto 5 fases). Migrar preservando contexto stateful WS.
5. **Portal paciente** — 15 (OTP com fallback 4.6) + 17 (conteúdo com fonte 3.5).
6. **Procedimentos** — 07 (USG como wizard 4.4), 14 (telemedicina).
7. **Operação** — 11 (agendamento com reminders consertados 3.3), 12 (check-in), 13 (recepção).
8. **Gestão** — 18 (billing com tenant filter 1.2), 19 (research sandboxed 1.3).
9. **Oportunidades** — seção 5, priorizar pelo feedback do beta.

---

## 8. Anti-metas explícitas

Coisas que o produto-sucessor **não deve** fazer mesmo se "parecer melhor":

- ❌ Adicionar social login. Decisão de produto do fundador, tem razão LGPD.
- ❌ Expor dados brutos no pesquisa. Sempre anonimização + agregação.
- ❌ Prescrever controlados sem ICP-Brasil ou Memed real.
- ❌ Auto-aprovar resumo pós-consulta sem médico. Quebra o princípio "tudo que a paciente vê é aprovado".
- ❌ Remover o bloqueio da Fase 2 para `contraindication`/`drug_interaction`. Relaxar isso mata o principal valor de segurança.
- ❌ Expor `tenantId` em URLs. Sempre derivado do JWT.
