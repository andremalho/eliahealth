# Dashboard de Pesquisa e Analytics

> **Status atual no EliaHealth:** implementado (anonimização + stats + query natural em PT via Claude; abas ginecológica/clínica são placeholders)
> **Prioridade na migração:** alta (diferencial competitivo; único EHR GO brasileiro com query natural sobre coorte anonimizada)
> **Depende de:** consentimento LGPD (`lgpdConsentAt`), módulo `research/` com `ResearchRecord`, Claude API, `Recharts`, RBAC (`PHYSICIAN | ADMIN | RESEARCHER`)

---

## 1. Propósito

**Problema que resolve:**
- Clínicas/hospitais acumulam centenas/milhares de prontuários e não conseguem extrair indicadores (% de PE, perfil de cesárea, distribuição regional) sem contratar um analista.
- Pesquisa clínica formal exige dados anonimizados e LGPD-compliant — hoje isto é feito manualmente com planilhas.
- Médicos querem perguntar "qual a taxa de DMG em pacientes > 35 anos?" e não sabem SQL.

**Valor entregue:**
- Painel com 5 abas (visão geral / obstétrica / ginecológica / clínica / populacional) abastecido por dados 100% anonimizados.
- Campo de **query natural em português** → Claude gera SQL seguro (whitelist SELECT) → executa → desenha o gráfico sugerido.
- Exportação CSV para análise externa (R, Python, Stata).
- Conformidade LGPD desde a origem: nenhum dado identificável chega na tabela de pesquisa.

**Intenção do médico-fundador:** transformar o prontuário em observatório clínico vivo — cada consulta alimenta automaticamente um repositório de pesquisa, e qualquer médico da clínica pode fazer perguntas em linguagem natural. É o "Google Analytics" da prática obstétrica.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Paciente | Consente explicitamente para pesquisa (LGPD) | Aceite no portal/cadastro |
| Sistema | Anonimiza e salva `ResearchRecord` | `POST /research/consent/:patientId` + desfecho de gestação |
| Médico / pesquisador | Navega painel e faz queries naturais | Abre `/analytics` |
| Admin | Exporta CSV agregado para análises externas | Botão "Exportar" |
| Claude API | Converte pergunta em SQL + sugere gráfico | Chamada síncrona de `research-query.service.ts` |

**Pré-condições:**
- Paciente tem `consentForResearch=true` (hoje setado junto ao consentimento LGPD geral).
- Gestação tem pelo menos alguns dados clínicos (desfecho preferencial mas não obrigatório).
- `ANTHROPIC_API_KEY` configurada para query natural (se ausente, stats estáticos ainda funcionam).

---

## 3. Dados de entrada

Campos extraídos e anonimizados ao registrar consentimento, consolidados em `research_records`:

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| `researchId` | string `RES-<hex16>` | Gerado (`randomBytes(8)`) | Sim |
| `maternalAge` | int | Calculado a partir de `Patient.dateOfBirth` | Sim |
| `ageGroup` | enum `15-19..40+` | Derivado de `maternalAge` | Sim |
| `zipCodePartial` | 5 dígitos do CEP | `Patient.zipCode[0..5]` | Se houver CEP |
| `region`, `state` | string | Mapa CEP→UF (`CEP_REGION_MAP`) | Se houver CEP |
| `incomeEstimate`, `neighborhood`, `zone` | string | `lookupCepIncome(cepPartial)` (IBGE/estimativa) | Se houver CEP |
| `bloodType` | string | `Patient.bloodType` | Se informado |
| `gravida/para/abortus/plurality/chorionicity` | int/string | `Pregnancy` | Sim (para obstétrico) |
| `gaAtDelivery`, `deliveryType` | int (dias), string | `PregnancyOutcome` | Se desfecho |
| `highRiskFlags[]` | jsonb | `Pregnancy.highRiskFlags` | — |
| `gestationalDiabetes` | bool | `GlucoseMonitoringConfig.isActive` | — |
| `hypertension` | bool | `BpMonitoringConfig.isActive` | — |
| `preeclampsia`, `hellpSyndrome`, `fgr` | bool | Derivados de `highRiskFlags` | — |
| `pretermBirth` | bool | `gaAtDelivery < 259` dias (< 37s) | — |
| `neonatalData` | jsonb array | `PregnancyOutcome.neonatalData` (peso, Apgar, sexo, NICU) | — |
| `dataHash` | SHA-256 | Hash de campos chave para detecção de adulteração | Sim |
| `consentForResearch`, `dataVersion` | bool, string | `true`, `'1.0'` | Sim |

**Campos explicitamente ausentes (LGPD):** nome, CPF, RG, endereço completo, telefone, email, prontuário ID, nome do médico. `pregnancyId` existe internamente mas é **removido no output** (`findRecords` faz `{pregnancyId, pregnancy, ...rest}` destructure).

---

## 4. Fluxo principal (happy path)

### 4.1 Anonimização

1. **Paciente consente** — aceite LGPD opt-in para pesquisa (checkbox + `lgpdConsentAt`).
2. `POST /research/consent/:patientId` — para cada gestação da paciente que ainda não tem `ResearchRecord`, chama `anonymizeAndSave(pregnancyId)`.
3. Service busca `Pregnancy + Patient + PregnancyOutcome + GlucoseMonitoringConfig + BpMonitoringConfig` em paralelo via `Promise.allSettled`.
4. Deriva `maternalAge`, `ageGroup`, `zipCodePartial`, região/estado, renda estimada, flags clínicas.
5. Gera `researchId` (`RES-<hex16>`), calcula `dataHash` (SHA-256 de campos chave) e salva.

### 4.2 Painel (GET)

1. Frontend `/analytics` monta queries em paralelo (React Query):
   - `GET /research/stats` — `ResearchService.getStats()` itera todos os registros em memória (JS) agregando por região/faixa/condição.
   - `GET /research/dashboard/overview` — `DashboardStatsService.getOverview()` roda UMA query SQL com `COUNT(*) FILTER (WHERE ...)` para todas as condições + média de IG ao parto.
2. Usuário alterna entre abas visão_geral / obstetrica / ginecologica / clinica / populacional.
3. Recharts desenha `BarChart`, `PieChart` por tab.
4. Badge "LGPD" verde no topo; nota de anonimização sempre visível.

### 4.3 Query natural (IA)

1. Usuário digita pergunta em PT no `AiQueryPanel`: _"Qual a taxa de cesárea em mulheres acima de 35 anos na região Sudeste?"_
2. `POST /research/query` (endpoint no `research.controller` via `ResearchQueryService.askQuestion`).
3. Cria linha em `research_queries` (`status=processing`).
4. Chama Claude (`claude-sonnet-4-20250514`) com `QUERY_SYSTEM_PROMPT` que descreve schema de `research_records` e exige JSON `{sql, chartType, explanation}`.
5. **Segurança:** valida que o SQL começa com `SELECT` e não contém `INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE`. Se falhar, `status=error, result={error}`.
6. Executa via `DataSource.query(sql)` — confia que o SELECT é read-only, mas idealmente rodar em role de DB com permissões mínimas.
7. Salva `sqlGenerated`, `chartType`, `result={data, explanation, rowCount}`, `executionTimeMs`, `status=completed`.
8. Frontend recebe e renderiza gráfico + texto explicativo.

### 4.4 Exportação

`GET /research/export` — monta CSV com 18 colunas (research_id, maternal_age, age_group, region, state, bloodType, gravida, para, abortus, plurality, gaAtDelivery, deliveryType, gestational_diabetes, hypertension, preeclampsia, hellp_syndrome, fgr, preterm_birth). Download como `research_export.csv`. PDF ainda não implementado.

```
[Paciente consente]
       │
       ▼
[POST /research/consent/:patientId]
       │
       ▼ (para cada gestação sem RR)
[anonymizeAndSave]
       │
       ▼
[research_records]  ◄───────────────┐
       │                             │
       ├─► GET /research/stats       │
       ├─► GET /dashboard/overview   │
       └─► POST /research/query ──► [Claude] → SQL → executa ──┘
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Paciente sem CEP | `zipCodePartial=null`, `region/state/income=null` — stats regionais ignoram o registro. |
| Paciente sem desfecho | `gaAtDelivery/deliveryType/neonatalData=null`; registro entra em stats clínicas parciais. |
| CEP de cidade pequena sem mapping IBGE | `lookupCepIncome` retorna `null` para renda/bairro. |
| SQL gerado pela IA contém comando destrutivo | Rejeitado por regex whitelist; `status=error`, mensagem "Query insegura bloqueada". |
| Claude offline / sem API key | Query retorna `status=error` com mensagem do SDK; painel estático continua funcionando. |
| Registro duplicado | `anonymizeAndSave` checa `findOneBy({pregnancyId})` e retorna existente (idempotente). |
| Revogação de consentimento (LGPD) | Hoje **não há endpoint** para apagar registros de pesquisa após revogação — ver Melhorias. |
| Pregnancy deletada | `research_records.pregnancy_id` tem `onDelete: CASCADE` → registro some (ruim para histórico científico). |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Somente pacientes com `consentForResearch=true` entram em pesquisa. | `research.service.ts#anonymizeAndSave` |
| RB-02 | Nunca persistir campos diretamente identificáveis (nome, CPF, CEP completo, endereço, contatos). | `research-record.entity.ts` |
| RB-03 | `zipCodePartial` limitado a 5 dígitos (primeiros). | `research.service.ts#anonymizeAndSave` |
| RB-04 | `pregnancyId` existe para conciliação interna mas é **stripado** no retorno do `findRecords`. | `research.service.ts#findRecords` |
| RB-05 | `dataHash` SHA-256 é gerado na gravação; integridade deve ser checada em auditorias. | `research.service.ts#anonymizeAndSave` |
| RB-06 | `pretermBirth` derivado puramente de `gaAtDelivery < 259` dias (< 37s) — não de flag manual. | `research.service.ts` |
| RB-07 | Acesso restrito a roles `PHYSICIAN | ADMIN | RESEARCHER`. | `research.controller.ts#@Roles` |
| RB-08 | Query natural aceita **apenas** SQL começando com `SELECT`; comandos DDL/DML rejeitados por regex. | `research-query.service.ts#askQuestion` |
| RB-09 | Model Claude usado: `claude-sonnet-4-20250514`, `max_tokens=1000`, temperatura default. | `research-query.service.ts` |
| RB-10 | CSV export inclui conjunto fixo de 18 colunas — sem PII derivada. | `research.service.ts#exportCsv` |
| RB-11 | Registro é idempotente por `pregnancyId` (re-chamar não duplica). | `research.service.ts#anonymizeAndSave` |

---

## 7. Saídas e efeitos

- **Cria/altera:** `research_records` (1 por gestação consentida); `research_queries` (histórico de perguntas por usuário).
- **Notificações:** nenhuma.
- **Integrações:** Claude API (`@anthropic-ai/sdk`) para query natural; `DataSource.query` do TypeORM para executar o SQL gerado.
- **Eventos:** nenhum.
- **Efeito colateral crítico:** uma vez anonimizado, se um dia LGPD exigir rastreabilidade reversa, ela só é possível via `pregnancyId` (interno) — se a `Pregnancy` sumir, o vínculo some.

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| Anthropic Claude (Sonnet 4) | A cada pergunta de query natural | `system prompt + question` | Sim — query persiste com `status=error`. |
| PostgreSQL (via TypeORM DataSource) | Executa SQL aprovado da IA | SQL SELECT parametrizado (atenção: SQL injection via nomes!) | Sim — captura exception e salva erro. |
| pdfkit (export) | **Futuro** | JSON com agregações | N/A |

---

## 9. Critérios de aceitação

- [ ] Dado paciente com gestação + desfecho e `consentForResearch=true`, quando `/research/consent/:patientId` é chamado, então existe 1 `research_record` sem campos identificáveis.
- [ ] Dado 2 chamadas seguidas de `/research/consent/:patientId`, então o count em `research_records` não aumenta (idempotente).
- [ ] Dado `GET /research/records`, então o JSON retornado **não contém** `pregnancyId`, nem nome, CPF, CEP completo.
- [ ] Dado pergunta "taxa de cesárea na região Sul", o backend chama Claude, recebe `{sql, chartType}`, executa e retorna `{data, explanation, chartType}`.
- [ ] Dado uma pergunta cujo SQL contenha `DELETE`, `UPDATE`, `DROP`, `ALTER`, `INSERT`, `TRUNCATE` ou `CREATE`, então retorno tem `status=error` e "Query insegura bloqueada".
- [ ] Dado `GET /research/export`, então retorna CSV com header fixo e sem colunas com PII.
- [ ] Dado usuário não autorizado (paciente, recepção), então endpoints retornam 403.

---

## 10. Métricas de sucesso

- **Volume anonimizado:** número de `research_records` / número de gestações com consentimento → meta ≥ 95%.
- **Adoção de query natural:** médicos únicos que usaram query/mês.
- **Latência:** tempo médio Claude (hoje salvo em `executionTimeMs`) — meta < 5s.
- **Taxa de erro de query:** `status=error / total` — meta < 10% (indicador de qualidade do prompt).
- **Exports/mês:** indicador de uso para pesquisa formal.
- **Cobertura do schema pelo prompt:** sempre que uma coluna for adicionada em `research_records`, atualizar `QUERY_SYSTEM_PROMPT` — senão a IA não a conhece.

---

## 11. Melhorias recomendadas na migração

- **Agregações em SQL, não em JS** — `getStats()` hoje carrega todas as linhas em memória e itera. Migrar para `COUNT(*) FILTER (...)` como já feito em `getOverview()`. Escala de ≥ 10k registros quebra a versão JS.
- **Endpoint de revogação LGPD** — paciente revoga consentimento → apagar (ou pseudonimizar fora de cohort) o `research_record` correspondente. Hoje não existe.
- **DB role separado para query natural** — criar role Postgres read-only apontada apenas para `research_records`; `DataSource.query` da IA roda nessa role. Mitiga risco de SQL injection/privilege escalation.
- **Rate limit** na query natural (custo Claude + custo SQL). Sugestão: 20 queries/hora/usuário.
- **Cache de stats** — `GET /research/stats` poderia ser materializado em `dashboard_widgets` (entidade já existe, parcialmente usada).
- **Abas ginecológica e clínica** — hoje `—` placeholders no `AnalyticsDashboardPage.tsx`. Implementar queries equivalentes para `GynecologyConsultation`, `MenstrualCycleAssessment`, `MenopauseAssessment` (anonimizar também).
- **k-anonimato** — atualmente um registro com `zipCodePartial + bloodType + age + rare condition` pode reidentificar. Implementar k ≥ 5 (suprimir bucket que não satisfaça).
- **Export PDF** — completar (hoje só CSV).
- **Histórico de queries compartilhado** — hoje `research_queries` é por usuário. Oferecer "queries favoritas" da clínica para reuso.
- **Versionamento do schema** — `dataVersion='1.0'` existe mas ninguém incrementa. Bumpar sempre que mudar o que é anonimizado; migrar registros antigos.
- **Integração RNDS/DataSUS** — enviar estatísticas agregadas (nunca individuais) como observatório voluntário.
- **Logs de queries sensíveis** — guardar hash de perguntas para auditoria sem guardar texto completo (privacy-preserving).
- **Fallback sem Claude** — biblioteca de queries pré-definidas para clínicas que não querem enviar dados a terceiros (ainda que anonimizado, prompt via embaixo).

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/research/research.service.ts` — anonimização, stats em memória, export CSV.
  - `backend/src/research/research-record.entity.ts` — schema da tabela anonimizada.
  - `backend/src/research/research-query.service.ts` — integração com Claude, whitelist de SQL.
  - `backend/src/research/research-query.entity.ts` — histórico de perguntas.
  - `backend/src/research/research.enums.ts` — `AgeGroup`, `CEP_REGION_MAP`.
  - `backend/src/research/cep-income.ts` — lookup bairro/zona/renda IBGE.
  - `backend/src/research/dashboard-stats.service.ts` — `getOverview()` em SQL raw + métricas granulares por enum.
  - `backend/src/research/dashboard.service.ts` / `dashboard.controller.ts` — widgets configuráveis (parcial).
  - `backend/src/analytics/analytics.service.ts` — métricas de impacto do copiloto (separado, mas apresentado na mesma área).
- Frontend:
  - `frontend/src/pages/analytics/AnalyticsDashboardPage.tsx` — 5 abas, Recharts.
  - `frontend/src/pages/analytics/AiQueryPanel.tsx` — input de pergunta natural.
  - `frontend/src/pages/analytics/AnalyticsImpactPage.tsx` — métricas de impacto clínico (Fase 5).
  - `frontend/src/api/research.api.ts` — clients + labels (`INCOME_LABELS`, `AGE_GROUP_LABELS`).
- Migrations:
  - `1711900012000-CreateResearchAndUpdatePatientUser.ts` — cria `research_records` + flags de consentimento em `patients`.
  - `1711900012001-CreateDashboardAndQueryTables.ts` — `research_queries`, `research_dashboards`, `dashboard_widgets`, enum `dashboard_metric_enum`.
