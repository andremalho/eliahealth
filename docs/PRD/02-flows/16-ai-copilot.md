# Copiloto Clínico de IA — 5 Fases Integradas

> **Status atual no EliaHealth:** implementado (todas as 5 fases em produção)
> **Prioridade na migração:** crítica — é o diferencial competitivo do produto
> **Depende de:** Consultas (SOAP), Pregnancies, Lab Results, Prescriptions, Portal da Paciente, WhatsApp Business API, Anthropic Claude API (sonnet)

---

## Visão geral das 5 fases

O “Copiloto Elia” é uma camada de inteligência clínica baseada em Claude (Anthropic), orquestrada ao longo do ciclo da consulta. Não é um chatbot genérico — cada fase é um ponto específico do fluxo onde a IA agrega valor distinto:

| Fase | Momento | Função |
|---|---|---|
| **1 — Resumo pós‑consulta** | Depois de finalizar a consulta | Gera explicação em linguagem leiga e envia para paciente (WhatsApp + Portal). |
| **2 — Checklist pós‑consulta** | No ato de finalizar | Valida se guidelines (FEBRASGO, ACOG, NICE, WHO, FIGO) foram cumpridas; bloqueia finalização se houver ações obrigatórias pendentes. |
| **3 — Copiloto em tempo real** | Durante a consulta (WebSocket) | Insights incrementais enquanto o médico digita (gaps, interações, diferenciais). |
| **4a — Chatbot contextual WhatsApp** | Após a consulta, fora da tela | Responde dúvidas da paciente no WhatsApp com contexto daquela consulta; detecta urgências. |
| **4b — Inteligência longitudinal** | Cron diário (6h) | Detecta padrões ao longo do tempo por tenant (retornos perdidos, exames pendentes, ignorância sistemática de alertas). |
| **5 — Analytics de impacto** | Contínuo | Queries SQL agregam métricas que “vendem” o produto (gaps detectados, taxa de correção, pacientes alcançadas). |

Modelo usado: `claude-sonnet-4` (ou superior) via `ANTHROPIC_API_KEY`. Fallback offline não é aceitável — se a API cair, o sistema degrada para “modo manual” e marca a consulta com banner informativo; jamais inventa resposta.

---

## Fase 1 — Resumo pós‑consulta (ponte de comunicação)

### 1.1 Propósito
Paciente sai da consulta e esquece ~40% do que foi dito. O resumo leigo, aprovado pelo médico, fecha a lacuna. Também serve de prova documental do que foi discutido (LGPD + medicina defensiva).

### 1.2 Atores e gatilho
- **Gatilho automático:** finalização da consulta (após Fase 2 aprovada).
- **Atores:** médico (revisor/aprovador), paciente (destinatária), Claude (gerador), WhatsApp/portal (canais).

### 1.3 Entidades
- `consultation_summaries`:
  - `id`, `consultation_id`, `patient_id`, `tenant_id`,
  - `raw_input_hash` (evita regenerar se conteúdo não mudou),
  - `content_markdown`, `content_plain_text`,
  - `status` ∈ { `generating`, `draft`, `approved`, `sent`, `delivered`, `read` },
  - `approved_by`, `approved_at`, `sent_at`, `delivered_at`, `read_at`,
  - `channels_sent` (`['whatsapp','portal','email']`).

### 1.4 Máquina de estados
```
generating -> draft -> approved -> sent -> delivered -> read
                ^         |
                |         +-- rejected -> draft (regenerate)
                +-- error -> draft (with placeholder)
```

### 1.5 Fluxo detalhado
1. Evento `consultation.completed` dispara `POST /consultation-summaries/generate/:consultationId`.
2. Service coleta payload: SOAP, prescrições, exames solicitados, diagnósticos, recomendações + perfil da paciente (IG, comorbidades, alergias).
3. Prompt estruturado para Claude: “Você é uma assistente que traduz a consulta médica para a paciente. Tom acolhedor, 2ª pessoa, sem jargão, em até 350 palavras, 5 seções fixas: O que conversamos / Como está a sua gestação (ou saúde) / O que você precisa fazer / Quando voltar / Sinais de alerta.” Temperature ≤ 0.3.
4. Resposta vai para `draft`. Médico abre em `CopilotDashboardCards` ou no próprio prontuário, revisa, edita inline, clica **Aprovar**.
5. Ao aprovar, `PATCH /consultation-summaries/:id/approve` → status `approved`.
6. `POST /consultation-summaries/:id/send` dispara envio multicanal: WhatsApp (template) + portal (push) + email (opcional). Status vira `sent`.
7. Webhooks do WhatsApp confirmam entrega → `delivered`. Quando a paciente abre no portal (`PATCH /portal/consultation-summaries/:id/read`) → `read`.

### 1.6 Endpoints
- `POST /consultation-summaries/generate/:consultationId`
- `GET /consultation-summaries/consultation/:consultationId`
- `GET /consultation-summaries/patient/:patientId`
- `GET /consultation-summaries/:id`
- `PATCH /consultation-summaries/:id/approve`
- `POST /consultation-summaries/:id/send`
- `PATCH /consultation-summaries/:id/read` (webhook do portal)
- `GET /portal/consultation-summaries` — listagem para a paciente
- `PATCH /portal/consultation-summaries/:id/read`

### 1.7 Regras
| ID | Regra | Fonte |
|---|---|---|
| F1‑01 | Resumo **nunca** é enviado sem aprovação humana. | Segurança clínica |
| F1‑02 | Nenhum diagnóstico inédito pode aparecer que não esteja no SOAP. | Prompt guard + pós‑validação por regex/keywords |
| F1‑03 | Não usa dados de outra consulta; contexto é isolado. | Multi‑tenant + consultation scope |
| F1‑04 | Tom obrigatório: 2ª pessoa, linguagem B1 (CEFR). | Prompt + fallback reescrita |
| F1‑05 | Inclui seção “Sinais de alerta” com telefones do consultório e PS/SAMU. | Medicina defensiva |
| F1‑06 | Se gestante, adapta para IG atual. | Contexto `Pregnancy` |

### 1.8 Melhorias
- **Geração 2‑step com revisão automática** — primeiro gera, depois pede ao próprio Claude para “verificar se há informação não presente no SOAP” (self‑check) antes de apresentar ao médico.
- **Voz da paciente** — permitir que a paciente escute o resumo (TTS); reduz barreira para baixa literacia.
- **Resumo da família** — opcional, uma versão encurtada para compartilhar com acompanhante.
- **Highlight das mudanças** — quando médico edita, destacar o diff em auditoria.

---

## Fase 2 — Checklist pós‑consulta (copiloto de decisão)

### 2.1 Propósito
Guidelines são densos (FEBRASGO tem 1.400+ recomendações em GO). Médico humano esquece. O checklist é uma rede de segurança que confere cada item antes de fechar a consulta.

### 2.2 Entidades
- `copilot_checks`: `id`, `consultation_id`, `tenant_id`, `status` (`pending`/`in_review`/`reviewed`), `generated_at`, `reviewed_at`, `reviewed_by`.
- `copilot_check_items`: `id`, `check_id`, `category`, `severity`, `title`, `description`, `guideline_ref`, `resolution` (`accepted`/`already_done`/`postponed`/`ignored`), `resolution_note`, `resolved_at`, `resolved_by`.
- **10 categorias:** `exam`, `prescription`, `screening`, `vaccine`, `referral`, `monitoring`, `follow_up`, `anamnesis_gap`, `drug_interaction`, `contraindication`.
- **Severity:** `OK`, `ATTENTION`, `ACTION_REQUIRED`.

### 2.3 Fluxo
1. Médico clica **Finalizar consulta** → `POST /copilot/post-consultation-check/:consultationId`.
2. Service carrega contexto (consulta, paciente, gestação, exames, vacinas, histórico) e envia a Claude um prompt com as regras por fase (pré‑natal por IG, ginecologia, menopausa, fertilidade).
3. Claude devolve lista de itens estruturados (JSON). Service persiste em `copilot_check_items`.
4. Frontend abre `CopilotCheckModal` agrupando por categoria com severidade.
5. Médico resolve item a item: aceitar (aplica a ação — cria prescrição/solicita exame/agenda retorno), já feito (marca e pede evidência opcional), adiar (escolhe data), ignorar (**justificativa obrigatória** com min 20 chars).
6. Só libera `PATCH /copilot/check/:checkId/reviewed` quando **todos os `ACTION_REQUIRED` estão resolvidos**. Consulta vira `finalized` → dispara Fase 1.

### 2.4 Endpoints
- `POST /copilot/post-consultation-check/:consultationId`
- `GET /copilot/check/:consultationId`
- `PATCH /copilot/check-item/:itemId/resolve` (body: `resolution`, `note?`, `postponeTo?`)
- `PATCH /copilot/check/:checkId/reviewed`
- `GET /copilot/stats` — agregado para dashboard

### 2.5 Regras
| ID | Regra | Fonte |
|---|---|---|
| F2‑01 | Consulta só finaliza quando 100% dos `ACTION_REQUIRED` estão resolvidos. | Decisão de produto |
| F2‑02 | Ignorar exige justificativa ≥20 chars; fica em auditoria. | LGPD/CFM |
| F2‑03 | Itens citam guideline (FEBRASGO/ACOG/NICE/WHO/FIGO + versão/ano). | Compliance |
| F2‑04 | Aceitar aciona side‑effects (cria prescrição/exame/agenda) pelo módulo correto. | Integração |
| F2‑05 | Não usar mais que 15 itens por checklist; se exceder, re‑ranqueia por severity. | UX |
| F2‑06 | Checklist é idempotente por `consultation_id` — rodar de novo atualiza, não duplica. | Robustez |

### 2.6 Melhorias
- **Soft‑block opcional** — bloquear finalização aumenta ansiedade; oferecer modo soft com contador visual (“2 ações obrigatórias pendentes”) e permitir finalizar com justificativa global.
- **Aprender com o médico** — se médico ignora sistematicamente certa categoria com justificativa parecida, reduzir severidade daquele item para aquele perfil (com opt‑in e audit trail).
- **Preview em tempo real** — mostrar o checklist já aparecendo (parcialmente) durante a consulta na Fase 3, não só no final.
- **Explicabilidade** — cada item abre tooltip com citação literal do guideline.

---

## Fase 3 — Copiloto em tempo real (WebSocket)

### 3.1 Propósito
Insights no fim da consulta são tardios. Durante o preenchimento, IA cruza o que o médico escreve com o histórico da paciente e sinaliza gaps/diferenciais/interações.

### 3.2 Gateway e eventos
Namespace `/copilot` (Socket.IO). Autenticação por JWT no handshake.

| Evento (client→server) | Payload | Uso |
|---|---|---|
| `consultation:field_updated` | `{ consultationId, field, value }` | Trigger semântico |
| `consultation:request_analysis` | `{ consultationId, scope }` | Forçar análise |
| `copilot:insight_action` | `{ insightId, action:'accepted'\|'dismissed' }` | Tracking |

| Evento (server→client) | Payload | Uso |
|---|---|---|
| `copilot:connected` | `{ sessionId, patientContext }` | Handshake ok |
| `copilot:insights` | `{ insights: Insight[] }` | Entrega até 3 insights |

### 3.3 Triggers semânticos
- `chief_complaint` salvo → avalia gaps de anamnese.
- `vitals` salvos → compara com baseline da paciente e thresholds.
- `diagnosis` salvo → gera diferenciais e alertas de contraindicação.
- `prescription` salva → checa interações medicamentosas + alergias + gestação.

### 3.4 Fluxo
1. Frontend conecta ao abrir a consulta: `copilot:connected` retorna `patientContext` (já carregado em memória: gestação, alergias, comorbidades, últimos exames, prescrições ativas).
2. Cada trigger dispara análise **incremental** — só o campo mudado + contexto cacheado; prompt curto (<1.5k tokens de input).
3. Claude devolve até **3 insights por trigger** (pri priorizados por severidade).
4. Backend de‑duplica contra insights já entregues na sessão (hash do título + categoria).
5. Painel lateral (`CopilotSidePanel.tsx`) renderiza cards não‑intrusivos; médico pode **Aceitar** (aplica ação), **Dispensar** (tracking para Fase 4b) ou ignorar (sem ação).
6. `copilot_insights` guarda tudo com `doctor_action`.

### 3.5 Regras
| ID | Regra | Fonte |
|---|---|---|
| F3‑01 | Máx 3 insights por trigger, máx 12 na sessão. | UX (carga cognitiva) |
| F3‑02 | Não repete insight já entregue na mesma sessão (hash). | De‑dup |
| F3‑03 | Contexto da paciente pre‑carregado no handshake, não re‑buscado a cada trigger. | Performance |
| F3‑04 | Latência alvo <2.5s por trigger (p95). | Experiência |
| F3‑05 | Insights `severity=high` ganham destaque visual e tocam som discreto opt‑in. | UX |
| F3‑06 | Se WS cair, frontend tenta reconectar com backoff; consulta continua funcional sem copiloto. | Resiliência |

### 3.6 Melhorias
- **Modo mudo por tipo** — médico opta em desativar categoria (“chega de diferenciais”) temporariamente.
- **Summary live** — painel lateral com uma frase “de olho em: PA limítrofe + tosse seca há 6 dias” atualizada em tempo real.
- **Voice input** — ditado por voz com Claude gerando SOAP estruturado; Fase 3 observa o ditado.
- **Prefetch de guidelines** — quando detecta queixa, pré‑busca snippet de guideline para evitar hallucination.

---

## Fase 4a — Chatbot contextual WhatsApp

### 4a.1 Propósito
Depois da consulta, paciente tem dúvida. Ligar é fricção. Chatbot contextual conhece especificamente aquela consulta (não é um chatbot de FAQ) e ajuda em dúvidas educativas, reforça instruções do médico, e sabe reconhecer quando a situação é urgente.

### 4a.2 Entidades
- `chat_sessions`: `id`, `patient_id`, `consultation_id`, `tenant_id`, `status` (`active`/`closed`/`escalated`), `message_count`, `last_activity_at`, `escalated_at`, `escalation_reason`.
- `chat_messages`: `id`, `session_id`, `role` (`patient`/`assistant`/`system`), `content`, `created_at`, `meta` (tokens, model_version, urgency_score).

### 4a.3 Webhook WhatsApp
- `GET /webhook/whatsapp` — verificação Meta (echo `hub.challenge` se `hub.verify_token == WHATSAPP_VERIFY_TOKEN`).
- `POST /webhook/whatsapp` — recebe mensagens. **Validação HMAC‑SHA256** do header `X‑Hub‑Signature‑256` usando `WHATSAPP_APP_SECRET`. Rejeita se inválido.

### 4a.4 Fluxo
1. Paciente recebeu resumo (Fase 1) e responde no WhatsApp.
2. Webhook valida HMAC → identifica paciente pelo telefone → encontra `consultation` mais recente → cria/abre `chat_session`.
3. Se `message_count` ≥ 20, responde com mensagem “Para sua segurança, encerramos o chat automatizado. Um profissional entrará em contato.” e marca `closed_by_rate_limit`.
4. Classificação de urgência por **keywords** em pt‑BR: `sangramento`, `sangrando`, `muito sangue`, `dor forte/intensa/muito forte`, `perda de líquido`, `bolsa rompeu/estourou`, `desmaiei`, `convulsão`, `não sinto o bebê mexer`, `visão embaçada + dor de cabeça`, `pressão alta`, `febre alta`, `vômito persistente`. Se bater → `escalated`.
5. Se urgência:
   - Responde mensagem padrão: “Pelo que você descreve, você precisa de atendimento médico AGORA. Vá ao pronto‑socorro mais próximo. Se estiver sozinha ou não conseguir se locomover, ligue 192 (SAMU).”
   - Notifica médico (push + in‑app + email).
   - Atualiza dashboard com barra vermelha no topo.
6. Se normal: Claude responde com contexto (consulta, IG, prescrições, alergias). Prompt impede dar diagnóstico novo, prescrever ou alterar conduta — somente educar/reforçar/orientar.
7. Todas as mensagens são persistidas; médico pode ler tudo no painel `patient-chat/`.

### 4a.5 Endpoints
- `POST /webhook/whatsapp` (Meta)
- `GET /webhook/whatsapp` (verify)
- `GET /patient-chat/sessions` (admin/médico)
- `GET /patient-chat/sessions/:id/messages`
- `POST /patient-chat/sessions/:id/close`

### 4a.6 Regras
| ID | Regra | Fonte |
|---|---|---|
| F4a‑01 | Rate limit **20 mensagens/sessão**; sessão reinicia após 24h sem atividade. | Produto |
| F4a‑02 | HMAC‑SHA256 obrigatório em `POST /webhook/whatsapp`. | Meta Business Security |
| F4a‑03 | Urgência por keywords dispara escalação imediata (notifica médico + orienta PS/SAMU). | Segurança |
| F4a‑04 | Chatbot NÃO dá diagnóstico, NÃO prescreve, NÃO altera conduta. | Regulatório CFM |
| F4a‑05 | Disclaimer no 1º acesso e sempre que sessão reabre. | UX |
| F4a‑06 | Contexto limitado à consulta mais recente do médico vinculado; não mistura contextos. | Privacidade |
| F4a‑07 | Logs armazenados por 5 anos (LGPD + CFM). | Compliance |

### 4a.7 Melhorias
- **Indicador “médico notificado” imediato** — hoje a resposta IA vem primeiro; trocar ordem: em urgência, primeiro confirmar “avisei seu médico agora” e só depois orientar PS; reduz sensação de estar sozinha.
- **Classificação híbrida** — keywords + Claude em paralelo (dois classificadores); qualquer positivo escala.
- **Respostas rápidas pré‑aprovadas** — médico cadastra templates (“sangramento após ato, o que fazer?”) que o bot usa antes de chamar Claude, reduz custo e latência.
- **Encaminhamento para tele‑urgência** — botão automático para criar sala Daily rápida quando escala.
- **Memória de longo prazo por paciente** — citar fatos da consulta anterior com consentimento (“na última consulta você mencionou X”).

---

## Fase 4b — Inteligência longitudinal

### 4b.1 Propósito
Copiloto vê 1 consulta por vez. Mas padrões aparecem no agregado: paciente não voltou, exame nunca foi feito, médico ignora categoria específica.

### 4b.2 Entidades
- `longitudinal_alerts`: `id`, `tenant_id`, `type`, `severity`, `patient_id?`, `physician_id?`, `payload_json`, `status` (`unread`/`read`/`responded`/`dismissed`), `response_action`, `created_at`.
- Tipos: `missed_followup`, `pending_exam`, `copilot_trend`, `pattern_detected`.

### 4b.3 Cron
- **`0 6 * * *` diariamente (6h da manhã, timezone do tenant)**.
- Executa por tenant, em transação. **Sem IA** — queries SQL puras com regras determinísticas.

### 4b.4 Detecções
1. **`missed_followup`** — `follow_up_due_at < now() - 7 days` e sem nova consulta desde então.
2. **`pending_exam`** — `lab_order.requested_at < now() - 30 days` e `lab_results` sem link.
3. **`copilot_trend`** — janela 30d: `sum(items where category=X AND resolution='ignored') / total_items(category=X) > 0.5` e total ≥ 10 → alerta ao médico “você ignorou >50% dos alertas da categoria X”.
4. **`pattern_detected`** — paciente com ≥3 PAs consecutivas ≥140/90 sem diagnóstico de HAS; ou ≥3 glicemias jejum ≥95 sem DMG registrada; ou queixa recorrente de cefaleia em ≥3 consultas.

### 4b.5 Endpoints
- `GET /copilot/longitudinal-alerts` (filtros tenant/médico/tipo)
- `PATCH /copilot/longitudinal-alerts/:id/read`
- `PATCH /copilot/longitudinal-alerts/:id/respond` (body: `action`)

### 4b.6 Regras
| ID | Regra | Fonte |
|---|---|---|
| F4b‑01 | Sem Claude — regras determinísticas evitam falsos positivos caros. | Decisão de engenharia |
| F4b‑02 | Cron processa 1 tenant por vez com lock para evitar duplicação. | `clinical-copilot/cron/longitudinal.cron.ts` |
| F4b‑03 | Alertas duplicados do mesmo tipo + mesma entidade são deduplicados em janela de 7d. | Anti‑ruído |
| F4b‑04 | Médico que ignora `copilot_trend` 3 vezes sobe para `severity=high`. | Escalation |

### 4b.7 Melhorias
- **Tendências por coorte** — comparar o médico com pares (anonimizado) para contextualizar “você ignora X% acima da mediana”.
- **Abrir ticket automático para a secretária** — se `missed_followup`, criar tarefa de reagendamento direto no painel da recepção.
- **Reconciliação automática de exames** — quando lab externo envia resultado por FHIR/email, tentar linkar automaticamente reduzindo `pending_exam` falsos.

---

## Fase 5 — Analytics de impacto (recorte de IA)

> Analytics completos estão em `19-research-analytics.md`. Aqui só a parte que toca IA.

### 5.1 Propósito
Números que vendem o produto: quantos gaps foram detectados, quantos o médico aceitou corrigir, quantas pacientes leram o resumo, qual o tempo médio de resposta do chatbot, quantas urgências foram identificadas a tempo.

### 5.2 Queries (SQL otimizadas, 8 no total; IA‑specific):
1. **Gaps detectados × corrigidos** — `copilot_check_items` por categoria, ratio `resolved / total`.
2. **Taxa de aceitação dos insights tempo real** — `copilot_insights` ratio `accepted / (accepted + dismissed)`.
3. **Taxa de leitura de resumos** — `consultation_summaries` `read / sent`.
4. **Tempo médio de resposta chatbot** — p50/p95 por `chat_messages`.
5. **Escalações do chatbot** — `chat_sessions.status = 'escalated'` por período + desfecho.
6. **Retornos perdidos recuperados** — `longitudinal_alerts.type='missed_followup'` com `status='responded'`.
7. **Ignorâncias sistemáticas** — médicos com `copilot_trend` ativos.
8. **Impacto clínico consolidado** — frase pronta: “O copiloto detectou **X** gaps, o médico corrigiu **Y** (**Z%**), **W** pacientes leram o resumo, **V** urgências foram identificadas no WhatsApp.”

### 5.3 Endpoints
- `GET /analytics?from=&to=&physicianId=`
- `GET /copilot-dashboard` — agrega Fase 1, 2, 3, 4a, 4b em tempo real.

### 5.4 Regras
| ID | Regra | Fonte |
|---|---|---|
| F5‑01 | Todas as queries consideram `tenant_id`. | Isolamento |
| F5‑02 | Dados agregados por médico são compartilhados só com ele ou admin do tenant. | LGPD |
| F5‑03 | Seção “Impacto Clínico” é pre‑formatada para apresentação (gerável em PDF). | Comercial |

### 5.5 Melhorias
- **Correlação com desfecho** — cruzar gap corrigido × desfecho gestacional (parto sem complicação, Apgar, idade gestacional no parto); é o argumento de venda definitivo.
- **Benchmarks** — comparar tenant com mediana de rede (anonimizado).
- **Alerta de queda de adesão** — se taxa de leitura cai >20% em 14d, médico é avisado (pode ser problema de número de WhatsApp não verificado).

---

## Fluxo end‑to‑end integrado (um atendimento real)

```
 08:55  Paciente faz check-in QR no portal -> status "arrived"
 09:00  Médico abre consulta -> WS /copilot conecta -> Fase 3 ativa
            pré-carrega: gestação 28s, sem comorbidades, penicilina alérgica,
            PA última 130/85, glicemia 89, dTpa pendente.
 09:03  Médico digita queixa "cefaleia há 2 dias + visão embaçada"
         -> Fase 3 dispara insight: "Sinais de alarme pré-eclâmpsia;
            considerar aferir PA, solicitar proteinúria."
 09:05  Médico afere PA 148/95 -> Fase 3: "PAS>=140 em gestante 3T = ação urgente;
            considerar HELLP panel, dopplerfluxometria, encaminhamento."
 09:12  Médico diagnostica "hipertensão gestacional", prescreve metildopa.
         -> Fase 3 valida sem interação com alergia.
 09:20  Médico clica Finalizar.
         -> Fase 2 gera checklist:
              [ACTION_REQUIRED] solicitar proteinúria 24h (ACOG 2022)
              [ACTION_REQUIRED] agendar retorno em 7d com MAPA
              [ACTION_REQUIRED] vacina dTpa (FEBRASGO, IG 28s)
              [ATTENTION]      considerar AAS 100mg profilático
              [OK]             Hb > 11 na última consulta
         Médico resolve os 3 ACTION_REQUIRED (2 aceitar, 1 já feito com nota).
 09:25  Consulta finaliza -> Fase 1 dispara geração do resumo.
         Claude gera draft em linguagem leiga; médico lê, edita parágrafo,
         aprova -> envia por WhatsApp + portal.
 09:27  Paciente recebe WhatsApp com resumo.
 12:40  Paciente responde: "a dor de cabeça piorou e estou vendo estrelinhas"
         -> Fase 4a: HMAC válido -> detecta urgência (keywords "vendo estrelinhas"
            + contexto HAS gestacional) -> escala -> notifica médico e responde
            "Vá ao PS agora; se não conseguir, ligue 192."
 12:41  Médico vê barra vermelha no dashboard (Fase 5).
 Madrugada (06:00 dia seguinte)
         -> Fase 4b cron roda: detecta que nenhuma proteinúria foi feita
            (>24h do pedido) e cria longitudinal alert "pending_exam"
            se passar de 48h.
 Mensalmente
         -> Fase 5 Analytics: "O copiloto detectou 1 gap crítico (proteinúria),
            o médico corrigiu 3 de 3 itens ACTION_REQUIRED, o resumo foi lido,
            e 1 urgência foi identificada no WhatsApp com escalação a tempo."
```

---

## Referências de código (todas as fases)

- Backend:
  - `backend/src/copilot/` — entidades + controller + enums + alertas longitudinais.
  - `backend/src/clinical-copilot/` — gateway WebSocket Fase 3, cron Fase 4b (`cron/longitudinal.cron.ts` com `@Cron('0 6 * * *')`).
  - `backend/src/consultation-summary/` — Fase 1 (state machine + envio WhatsApp/portal).
  - `backend/src/copilot-dashboard/` — dashboard unificado Fase 5.
  - `backend/src/patient-chat/` + `backend/src/chat/` — Fase 4a (webhook Meta, HMAC, sessões, escalação).
  - `backend/src/ai-fill/` — extração de documentos (suporta Fase 2 ao avaliar se exame já foi feito).
  - `backend/src/analytics/` — queries SQL da Fase 5.
  - `backend/src/mail/` + `backend/src/notifications/` — canais de saída.
- Frontend:
  - `frontend/src/pages/dashboard/CopilotDashboardCards.tsx` — dashboard Fase 5 (resumos pendentes, alertas longitudinais, stats chatbot).
  - `frontend/src/pages/pregnancy/sections/CopilotCheckModal.tsx` — Fase 2 (modal com 10 categorias).
  - `frontend/src/pages/pregnancy/sections/CopilotSidePanel.tsx` — Fase 3 (painel lateral durante consulta, Socket.IO).
  - `frontend/src/pages/analytics/` — Fase 5 (impacto clínico).
  - `frontend/src/pages/chat/` — Fase 4a (visualização por médico).
- Variáveis: `ANTHROPIC_API_KEY`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_API_URL`, `PUBLIC_APP_URL`.
