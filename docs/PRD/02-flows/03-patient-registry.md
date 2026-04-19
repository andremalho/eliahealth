# Cadastro de Paciente

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** crítica
> **Depende de:** autenticação (01), multi-tenant (20) para isolamento

---

## 1. Propósito

**Problema que resolve:** Cadastros genéricos de EHR pedem campos irrelevantes e esquecem campos críticos de saúde da mulher (menarca, tipo sanguíneo Rh, eletroforese de hemoglobina, fase de vida hormonal). Pior: não há gatilho clínico automático quando uma característica de risco é inserida — a enfermeira salva "Rh negativo" e o Rhogam nunca é agendado. Paralelamente, LGPD exige consentimento explícito com timestamp auditável, e muitos EHRs deixam isso como checkbox opcional em TOS.

**Valor entregue:**
- Cadastro mínimo (nome + CPF) com enriquecimento progressivo em seções.
- **Triggers clínicos automáticos** na criação/edição: Rh negativo → vacina Rhogam pendente em toda gestação ativa; eletroforese SS/SC/CC → flag "hemoglobinopatia" em gestações ativas.
- Consentimento LGPD como `lgpdConsentAt: timestamptz` — só habilita portal da paciente quando preenchido.
- Fase de vida hormonal (reprodutiva / gestante / climatério / menopausa) derivada automaticamente (via gestação ativa + idade + menopausa_assessments).
- Contatos de emergência (1:N, com `isMainContact`) e biológico pai (1:1 por gestação, dados genéticos + sanguíneos).

**Intenção do médico-fundador:** "O sistema deve *saber* quando um dado implica conduta. Se eu salvo Rh negativo, não deveria precisar lembrar da Rhogam — o sistema agenda". O cadastro serve também como **rastreador de perfil populacional**: `menarcheAge`, `menstrualCycle`, `dysmenorrhea`, `comorbiditiesSelected` (JSONB com opções padronizadas) alimentam o dashboard de pesquisa anonimizado.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico (PHYSICIAN) | Cria/edita paciente | Botão "Nova paciente" no dashboard ou lista |
| Secretária (RECEPTIONIST) | Cria paciente sem acesso clínico | Via modo recepção |
| Enfermeiro (NURSE) | Edita perfil (dados básicos + obstétricos) | Similar |
| Sistema (trigger) | Executa `checkRhNegative`, `checkHemoglobinopathy` | Pós-save (create/update) |

**Pré-condições:**
- Usuário autenticado com role que permita escrita em `patients`.
- Consentimento LGPD pode ser preenchido depois (paciente pode assinar no portal).

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| fullName | string | form | **sim** |
| cpf | string 11 dígitos (regex `^\d{11}$`) | form | **sim** (unique) |
| dateOfBirth | ISO date | form | não (recomendado) |
| phone | string | form | não |
| email | string (email válido, unique) | form | não (obrigatório para portal) |
| bloodTypeABO | enum `A\|B\|AB\|O` | form | não |
| bloodTypeRH | enum `positive\|negative` | form | não |
| bloodType (derivado) | string `A+`/`A-`/... | computado `computeBloodType()` | auto |
| hemoglobinElectrophoresis | enum `AA\|AS\|AC\|SS\|SC\|CC\|AD\|AE\|NOT_PERFORMED` | form | não |
| height | decimal (1 casa) | form | não |
| comorbiditiesSelected | jsonb (string[]) | form (chips) | não |
| comorbiditiesNotes / comorbidities (legacy) | text | form | não |
| allergiesSelected / allergiesNotes / allergies | jsonb / text / text | form | não |
| addictionsSelected / addictionsNotes / addictions | jsonb / text / text | form | não |
| surgeries | text | form | não |
| familyHistory | text | form | não |
| menarcheAge | int | form | não |
| menstrualCycle | string (20) | form | não |
| dysmenorrhea | bool | form | não |
| maritalStatus / profession / education | string | form | não |
| address / zipCode / city / state (2) | string | form | não |
| zipCodePartial | string(5) | derivado (5 primeiros dígitos do ZIP para pesquisa anonimizada) | auto |
| lgpdConsentAt | timestamptz | aceite explícito do termo | sim para portal |
| preferredLanguage | string (default `pt_BR`) | form | não |
| cpfHash | string | derivado para lookup anonimizado | auto |

**Contatos de emergência (tabela `emergency_contacts` 1:N):** `name`, `relationship` (spouse/parent/sibling/friend/other), `phone`, `phone2?`, `isMainContact`, `notes?`.

**Biológico pai (tabela `biological_fathers` 1:1 por `pregnancyId`):** `name?`, `age?`, `dateOfBirth?`, `bloodType/ABO/RH`, `rh` (enum `positive|negative`), `ethnicity?`, `occupation?`, `geneticConditions?`, `infectiousDiseases?`, `familyHistory?`, `observations?`. Vinculado a `pregnancies`, não à paciente diretamente — captura que pai biológico pode mudar entre gestações.

---

## 4. Fluxo principal (happy path)

1. **Entrada** — médico clica "Nova paciente" em dashboard ou lista → abre `NewPatientChooserModal` (escolha entre "gestante", "ginecologia", "rastreio").
2. **Formulário contextual** — `NewPatientStandaloneModal` coleta nome + CPF + dateOfBirth + phone + email (básico). Telas subsequentes: tipo sanguíneo, comorbidades, alergias, história menstrual.
3. **Validação client-side** — zod/class-validator: CPF 11 dígitos, email válido; campos JSONB arrays.
4. **Submit** — `POST /patients` com body conforme `CreatePatientDto`.
5. **Backend cria paciente** — `PatientsService.create`:
   - Chama `computeBloodType` (se ABO+RH preenchidos, deriva `bloodType`).
   - Persiste `Patient`.
   - Chama `checkHemoglobinopathy` — se resultado ∈ {SS, SC, CC}, adiciona `'Hemoglobinopatia identificada'` a `pregnancies.high_risk_flags` (JSONB) de todas gestações ativas + seta `is_high_risk=true`.
   - Chama `checkRhNegative` — se RH negativo, adiciona `'Rh negativo'` aos `high_risk_flags` e **cria vacina Rhogam pendente** em cada gestação ativa (dose única 28-34sem, 300mcg IM, fonte FEBRASGO 2023) se não existir.
   - Retorna paciente.
6. **Redirect / modal de próximos passos** — `PatientPage.tsx` abre com seções (identificação, perfil de saúde, obstétrica, contatos, compartilhamentos).
7. **Adição de contatos de emergência** — `POST /emergency-contacts` por contato; `isMainContact` único deve ser enforced (hoje app-level — ver Regras).
8. **Cadastro de biológico pai** — quando gestação é criada, `POST /biological-father` vinculado a `pregnancyId`.
9. **Consentimento LGPD** — quando a paciente aceita termo (via tela interna durante recepção OU no primeiro login do portal), `PATCH /patients/:id` com `lgpdConsentAt=now()`. Dashboards `portal-access-stats` contam pacientes com email + LGPD.
10. **Edição** — `PATCH /patients/:id` dispara mesmos triggers (checkRhNegative, checkHemoglobinopathy) em cada save. Idempotente (`@>` JSONB evita duplicar flags).
11. **Busca** — `GET /patients/search?q=` procura por `fullName ILIKE` OR `cpf ILIKE` (removendo `.` e `-` do query); ordena por nome. Paginada (50/página default).
12. **Listagem** — `GET /patients?page=1&limit=50` filtra por tenant, ordenado por `createdAt DESC`.

```
   POST /patients
       │
       ▼
   computeBloodType() → persist Patient
       │
       ├──► checkHemoglobinopathy() → UPDATE pregnancies (high_risk_flags, is_high_risk)
       └──► checkRhNegative()       → UPDATE pregnancies + INSERT vaccines (Rhogam pending)
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| CPF duplicado | `QueryFailedError` code `23505` → 409 "CPF ou email ja cadastrado" |
| Email duplicado | Mesmo 409 |
| CPF formato inválido | 400 via `@Matches(/^\d{11}$/)` — frontend já bloqueia |
| Paciente sem gestação ativa com Rh negativo | Trigger não cria Rhogam (idempotente, zero gestações afetadas) |
| Eletroforese NOT_PERFORMED | Trigger não aciona flag — tratado como "não testado" |
| Trigger falha em gestação individual | Log de erro mas não rola back o create da paciente (GAP, ver Melhorias) |
| Edição muda Rh de positive → negative | Trigger adiciona flag + cria Rhogam se não existe. Reverso (neg → pos) NÃO remove flag/vacina — requer revisão manual |
| Busca com CPF parcial com máscara | `normalized = query.replace(/[.\-]/g, '')` — busca ignora pontuação |
| Contato de emergência sem phone | 400 (phone é `@IsNotEmpty`) |
| Mais de 1 contato com `isMainContact=true` | Hoje não enforced em DB — pode haver inconsistência |
| Paciente sem email tenta usar portal | Bloqueado: portal exige email + LGPD |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | CPF: 11 dígitos, unique globalmente | `patient.entity.ts:21-22` + `create-patient.dto.ts:26` |
| RB-02 | Email: unique globalmente (nullable) | `patient.entity.ts:30-31` |
| RB-03 | Rh negativo → flag `'Rh negativo'` + `is_high_risk=true` em gestações ativas | `patients.service.ts:121-140` |
| RB-04 | Rh negativo → criar Rhogam pendente (dose única 28-34sem, 300mcg IM, FEBRASGO 2023) | `patients.service.ts:142-160` |
| RB-05 | Hemoglobinopatias disparadoras: SS, SC, CC | `patient.enums.ts:25-29` `HEMOGLOBINOPATHY_RESULTS` |
| RB-06 | Hemoglobinopatia → flag `'Hemoglobinopatia identificada — acompanhamento especializado necessario'` | `patients.service.ts:173-188` |
| RB-07 | `bloodType` é derivado de `bloodTypeABO + bloodTypeRH` (ex: `A+`, `O-`) | `patients.service.ts:114-119` |
| RB-08 | Consentimento LGPD: campo `lgpdConsentAt timestamptz` obrigatório para portal | `patient.entity.ts:117-122` |
| RB-09 | Paginação default: 50 por página | `patients.service.ts:42` |
| RB-10 | Busca por CPF: normaliza removendo `.` e `-` | `patients.service.ts:63` |
| RB-11 | Ordenação na busca: `fullName ASC`; na lista: `createdAt DESC` | `patients.service.ts:48,74` |
| RB-12 | `preferredLanguage` default `pt_BR` | `patient.entity.ts:115` |
| RB-13 | `zipCodePartial` (5 dígitos) é mantido para dataset anonimizado | `patient.entity.ts:131` |
| RB-14 | `cpfHash` mantido para lookups sem expor CPF | `patient.entity.ts:134` |
| RB-15 | Delete CASCADE: emergency_contacts e biological_fathers seguem patient/pregnancy | entidades `@JoinColumn onDelete:'CASCADE'` |
| RB-16 | Biologico pai vinculado a **pregnancy**, não a patient | `biological-father.entity.ts:14` |
| RB-17 | Triggers são idempotentes via `NOT (high_risk_flags @> $1::jsonb)` | `patients.service.ts:130-137,178-185` |
| RB-18 | Fase de vida (reprodutiva/gestante/climatério/menopausa) **não é coluna própria** — derivada de: gestação ativa? → gestante; `menopause_assessments` presente? → climatério/menopausa; caso contrário reprodutiva | modelo de dados (inferido) |
| RB-19 | Tipos de relacionamento em contato: spouse, parent, sibling, friend, other | `emergency-contact.entity.ts:7` |
| RB-20 | Role `patient` tem JWT de 30d | fluxo 01, RB-05 |

---

## 7. Saídas e efeitos

- **Cria/altera:**
  - `patients` (uma linha).
  - `pregnancies.high_risk_flags` (JSONB append) + `is_high_risk=true` em gestações ativas (via trigger).
  - `vaccines` (linha Rhogam `status='pending'`) por gestação ativa Rh neg.
  - `emergency_contacts`, `biological_fathers` em endpoints separados.
- **Notificações disparadas:** nenhuma síncrona; alerts longitudinais podem surgir depois (ex.: Rhogam pendente vira "exame/vacina pendente" no dashboard).
- **Integrações acionadas:** nenhuma no cadastro; FHIR/RNDS conversion fica em módulo separado opt-in por tenant.
- **Eventos emitidos:** nenhum hoje. Ver Melhorias (sugestão `patient.created`, `patient.rh_negative_detected`).

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| FHIR/RNDS (opcional) | Quando `modFhirRnds=true` no tenant e paciente recebe atendimento SUS | Patient resource FHIR R4 com perfil RNDS | Sim (flag) |
| Busca CEP (ViaCEP ou similar) | Preenchimento automático no form | CEP → address/city/state | Frontend fallback manual |

Nada no create base chama API externa síncrona.

---

## 9. Critérios de aceitação

- [ ] Dado CPF `12345678901` novo quando `POST /patients` então paciente criado com id UUID.
- [ ] Dado CPF duplicado então 409.
- [ ] Dado paciente com gestação ativa quando atualizo `bloodTypeRH=negative` então `high_risk_flags` contém "Rh negativo" E vacina Rhogam `status='pending'` é criada.
- [ ] Dado já existe Rhogam `pending` quando re-salvo Rh negativo então não duplica.
- [ ] Dado eletroforese `SC` quando salvo então flag hemoglobinopatia aparece em gestações ativas.
- [ ] Dado busca por `123.456.789-01` então paciente com cpf `12345678901` retorna.
- [ ] Dado paciente sem `lgpdConsentAt` e email nulo quando consulto `getPortalAccessStats` então não conta em `withAccess`.
- [ ] Dado paciente criada sem `bloodTypeABO` mas com `bloodTypeRH` então `bloodType` não é derivado (mantém null).
- [ ] Dado contato de emergência com `relationship='other'` e phone preenchido então cria com sucesso.

---

## 10. Métricas de sucesso

- **% de pacientes com perfil completo:** `profile_completed_at IS NOT NULL`. Meta: 70% em 30d.
- **% de pacientes com LGPD:** meta 95% em 30d após onboarding do consultório.
- **Triggers de Rhogam criados / Rh negativas gestantes:** deve ser 1:1.
- **Duplicatas detectadas via CPF:** meta <1% (indicador de limpeza).
- **Tempo médio de criação de paciente:** meta <90s (campos mínimos) na recepção.

---

## 11. Melhorias recomendadas na migração

- **Fase de vida como coluna explícita.** Hoje é derivada por joins — custosa e inconsistente. Criar `patients.life_phase enum` atualizada por service (quando gestação é criada/encerrada; quando menopause_assessment diagnostica).
- **Formulário monolítico.** O `NewPatientStandaloneModal` pede muitos campos — baixar para "criar com nome+CPF+phone", e usar **progressive profiling**: pedir tipo sanguíneo só quando abre gestação; pedir menarca só em primeira consulta gineco.
- **Merge de duplicatas ausente.** Quando CPF já existe, hoje é só 409. Oferecer detecção por similaridade de `fullName`+`dateOfBirth` e fluxo de merge assistido (preview de campos a fundir, rollback por 30 dias).
- **Triggers clínicos são SQL raw dentro do service.** Risco: alguém adiciona campo high-risk novo e esquece. Extrair para `PatientClinicalRulesService` com regras declarativas `{ when: ..., then: ... }` versionadas.
- **Reversão de Rh não testada.** Se RH vira positivo (erro de digitação corrigido), flag e Rhogam ficam órfãos. Service deveria remover flag se condição deixou de ser verdadeira.
- **`isMainContact` não enforced.** Criar índice parcial único: `CREATE UNIQUE INDEX ON emergency_contacts(patient_id) WHERE is_main_contact=true`.
- **Eventos ausentes.** Emitir `patient.created`, `patient.high_risk_flag_added`, `patient.lgpd_consent_given` via EventEmitter/queue para desacoplar copiloto Fase 4b.
- **`comorbidities` vs `comorbiditiesSelected` vs `comorbiditiesNotes`.** 3 campos para a mesma coisa (legacy + nova) — migrar tudo para `comorbiditiesSelected` (JSONB) + `comorbiditiesNotes`, drop do text legacy.
- **Sem auditoria de quem editou.** Ter `updated_by` em patient e log de diffs para LGPD (titular pode pedir histórico).
- **Biológico pai 1:1 por gestação.** Correto clinicamente, mas UX não lembra o médico de re-preencher quando há gestação nova com mesmo pai. Oferecer "copiar do último".
- **CPF hash usa provavelmente SHA256 simples.** Deveria ser HMAC com key do tenant para impedir reverse via rainbow table.
- **Busca O(n) com ILIKE + dois OR.** Para tenant com >10k pacientes vai doer. Usar índice trigram (`pg_trgm`) em `fullName` e índice btree em `cpf`.
- **Sem importação em lote (CSV).** Clínicas migrando de outro EHR precisam. Endpoint `POST /patients/bulk-import` com upload de CSV + dry-run.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/patients/patient.entity.ts` (139 linhas — schema completo)
  - `backend/src/patients/patient.enums.ts` (blood types, hemoglobinopathy set)
  - `backend/src/patients/patients.service.ts` (194 linhas — create/update + triggers)
  - `backend/src/patients/patients.controller.ts`
  - `backend/src/patients/dto/create-patient.dto.ts` (154 linhas — todos os campos com class-validator)
  - `backend/src/patients/dto/update-patient.dto.ts`
  - `backend/src/emergency-contacts/emergency-contact.entity.ts` (enum Relationship + 1:N)
  - `backend/src/emergency-contacts/emergency-contacts.service.ts`
  - `backend/src/biological-father/biological-father.entity.ts` (1:1 com Pregnancy, dados genéticos)
  - `backend/src/biological-father/biological-father.service.ts`
  - `backend/src/pregnancies/pregnancy.entity.ts` (consumer dos flags)
  - `backend/src/vaccines/` (consumer do INSERT Rhogam)
- Frontend:
  - `frontend/src/pages/patients/PatientPage.tsx` (tela do paciente com seções)
  - `frontend/src/pages/patients/PatientsListPage.tsx` (busca + lista + paginação)
  - `frontend/src/pages/patients/NewPatientStandaloneModal.tsx`
  - `frontend/src/pages/patients/sections/` (seções do perfil)
  - `frontend/src/pages/dashboard/NewPatientChooserModal.tsx`, `NewPatientBaseModal.tsx`, `NewPatientModal.tsx`
- Migrations relevantes: `AddHighRiskFlagsToPregnancies`, `AddEmergencyContacts`, `AddBiologicalFather`, `AddLgpdConsentAt`.
