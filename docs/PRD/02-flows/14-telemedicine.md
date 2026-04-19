# Telemedicina (videoconsulta integrada ao prontuário)

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** alta
> **Depende de:** Consultas (prontuário), Agendamento, Portal da Paciente, Chat médico‑paciente

---

## 1. Propósito

**Problema que resolve:** videoconsultas ginecológicas/obstétricas em soluções genéricas (Google Meet, Zoom, WhatsApp) ficam desacopladas do prontuário — o médico alterna janelas, anota em papel e depois transcreve, perdendo tempo e contexto; a paciente fica insegura com links públicos e sem registro formal do atendimento.

**Valor entregue:**
- Sala de vídeo privada, efêmera e segura (tokens assinados, expiração automática).
- Painel lateral de anotações dentro da mesma tela da chamada — o que o médico digita entra direto no prontuário.
- Registro automático da consulta (data, duração, participantes, anotações) no histórico da paciente.
- Link único, enviado por email e WhatsApp, com permissões diferentes para médico e paciente (host vs. guest).

**Intenção do médico‑fundador:** “telemedicina não pode ser um anexo ao prontuário — tem que ser uma consulta como qualquer outra, com SOAP, sinais vitais, prescrição, laudo e cobrança TISS. O vídeo é só o canal.” (extraído de `TECHNICAL_SPEC.md` e do módulo `telemedicine/`).

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Médico (host) | Cria a sala, conduz a consulta, preenche anotações | Abre o agendamento do tipo `telemedicine` e clica **Iniciar videoconsulta** |
| Paciente (guest) | Entra na sala pelo link recebido | Clica no link enviado por WhatsApp/email ou entra pelo Portal da Paciente |
| Secretária | Agenda a videoconsulta e dispara convite | Cria agendamento marcado como `modality = telemedicine` |
| Daily.co | Provedor WebRTC (SFU) | Chamado pelo backend no `POST /telemedicine/rooms` |

**Pré‑condições:**
- Paciente cadastrada com email e/ou WhatsApp válidos.
- Agendamento confirmado na mesma data.
- `DAILY_API_KEY` configurada no tenant.
- Médico com role `PHYSICIAN` e consentimento LGPD da paciente para teleatendimento.

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| `appointment_id` | UUID | Agendamento | sim |
| `patient_id` | UUID | Agendamento | sim |
| `physician_id` | UUID | Sessão autenticada | sim |
| `scheduled_start` | timestamptz | Agendamento | sim |
| `estimated_duration_min` | int | Agendamento (default 30) | não |
| `consent_granted` | bool | LGPD opt‑in da paciente | sim |
| `send_link_channels` | enum[] (`email`, `whatsapp`) | Config da secretária | sim (≥1) |
| Anotações SOAP | texto estruturado | Digitado durante a chamada | não |

---

## 4. Fluxo principal (happy path)

1. **Agendamento** — secretária/paciente cria agendamento do tipo `telemedicine` (página `/calendar` ou `/portal/appointments`).
2. **Criação antecipada do convite** — 24h antes, o worker de lembretes (`AppointmentReminderService`, cron `0 8 * * *`) envia email + WhatsApp com o link da sala e orientações (câmera, microfone, navegador).
3. **Geração da sala (on‑demand)** — médico clica **Iniciar videoconsulta** → backend chama `POST /telemedicine/rooms` que chama Daily.co REST `rooms.create` gerando `room_name = tm-{appointmentId}-{random}` com `exp` = `scheduled_start + 2h`, `privacy = private`, `enable_chat = false`, `enable_recording = false` (LGPD).
4. **Emissão de tokens separados** — backend gera dois `meeting_tokens` via Daily:
   - **Médico:** `is_owner = true`, `enable_screenshare = true`, `enable_recording = optional`, `user_name = Dr(a). {nome}`.
   - **Paciente:** `is_owner = false`, `enable_screenshare = false`, `start_cloud_recording = false`, `user_name = {primeiro nome}`, `exp` = `scheduled_start + 2h`.
5. **Entrada do médico** — frontend (`VideoCallPage.tsx`) monta `<DailyIframe>` em layout split: vídeo à esquerda (70%), **painel lateral de anotações** à direita (30%) com abas SOAP, sinais vitais, prescrição rápida.
6. **Entrada da paciente** — ao clicar no link do WhatsApp, cai em `/portal/telemedicine/:token`. Verifica OTP (ou sessão do portal) → recebe seu `meeting_token` e entra como guest.
7. **Atendimento** — o que o médico digita no painel lateral é persistido (debounce 2s) como uma consulta SOAP regular (`POST /consultations`), vinculada ao `appointment_id`. Copiloto em tempo real (Fase 3) funciona normalmente nesta tela.
8. **Encerramento** — médico clica **Finalizar consulta** → backend:
   - Finaliza a sala no Daily (`DELETE /rooms/{name}`),
   - Registra `telemedicine_session` com `started_at`, `ended_at`, `duration_s`, `participants_joined`,
   - Aciona o checklist pós‑consulta (Fase 2) e, após aprovação, o resumo pós‑consulta (Fase 1).
9. **Pós‑consulta** — consulta aparece na timeline da paciente como qualquer consulta presencial, com badge **Tele**. Resumo leigo chega no WhatsApp/Portal.

```
agendamento tele -> reminder 24h (link) -> médico inicia ->
Daily room + 2 tokens -> vídeo + painel SOAP lateral ->
autosave em consultations -> finalizar ->
checklist (Fase 2) -> resumo (Fase 1) -> WhatsApp + Portal
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Paciente entra antes do médico | Fica em **sala de espera** (`waiting_room = true` no Daily); vê tela com logo da clínica e mensagem “O(a) médico(a) entrará em instantes”. |
| Token expirado | Frontend detecta `meeting-expired` → pede re‑autenticação OTP e regenera token se ainda dentro da janela de 2h. |
| Queda de conexão da paciente | Daily reconecta automaticamente por 60s; médico vê banner “paciente reconectando”. Após 60s, sessão é preservada e paciente pode re‑entrar pelo mesmo link. |
| Médico precisa escalonar para presencial | Botão **Converter em consulta presencial** marca a sessão como `escalated`, agenda retorno e notifica a paciente. |
| Paciente sem câmera/áudio | Cliente oferece fallback só‑áudio; médico é notificado. |
| Gravação solicitada | Exige consentimento duplo explícito (médico + paciente clicam no modal); gravação fica criptografada em bucket privado e apenas o tenant tem acesso (LGPD art. 11). |
| Ausência da paciente após 15min | Consulta é marcada `no_show`; se agendamento foi por convênio, gera cobrança TISS de no‑show conforme regra do tenant. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB‑01 | Sala Daily é criada on‑demand e expira em `scheduled_start + 2h`. | `telemedicine.service.ts` + Daily REST |
| RB‑02 | Tokens médico/paciente são emitidos separadamente; paciente nunca recebe `is_owner=true`. | LGPD, boas práticas WebRTC |
| RB‑03 | Gravação é **off por padrão** e só liga com duplo consentimento. | LGPD art. 7º/11 |
| RB‑04 | Link é enviado por email **e** WhatsApp (pelo menos um canal); lembretes disparam 24h e 1h antes. | `AppointmentReminderService` (`0 8 * * *`) |
| RB‑05 | Consulta criada pelo fluxo de telemedicina é um `consultation` regular com flag `modality = 'telemedicine'` — participa de Fase 1, 2, 3, 5 igual qualquer consulta. | `consultations/` + `copilot/` |
| RB‑06 | Paciente só recebe `meeting_token` após autenticação (OTP do portal ou JWT ativo). | `patient-verification/` |
| RB‑07 | Nenhum dado clínico trafega no canal de vídeo — anotações vão direto para `consultations` via REST autenticado. | `clinical-consultation.controller.ts` |
| RB‑08 | Sessões ficam em `telemedicine_session` com duração auditada (início, fim, participantes). | `telemedicine.entity.ts` |
| RB‑09 | No‑show após 15min encerra a sala e registra status. | Parametrizável por tenant |
| RB‑10 | Em caso de detecção de urgência durante a consulta, médico dispara protocolo manual (botão **PS / SAMU**) — chamada segue, mas paciente é orientada. | Fluxo clínico |

---

## 7. Saídas e efeitos

- **Cria/altera:** `telemedicine_session`, `consultations` (modality=`telemedicine`), anotações SOAP, possíveis `prescriptions`/`lab_orders`.
- **Notificações disparadas:** email + WhatsApp (convite, lembrete 24h, lembrete 1h), push no portal quando médico inicia.
- **Integrações acionadas:** Daily.co (rooms + meeting tokens), SMTP, WhatsApp Business API.
- **Eventos emitidos:** `telemedicine.session.started`, `telemedicine.session.ended`, `consultation.completed` → dispara Fases 1 e 2 do copiloto.

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| Daily.co `POST /rooms` | Médico clica **Iniciar** | `{ name, properties: { exp, privacy:'private', enable_recording:'off' } }` | Sim — retry 3x com backoff; se falhar, fallback para link manual de emergência. |
| Daily.co `POST /meeting-tokens` | Após criar sala | `{ room_name, is_owner, user_name, exp }` | Sim — sessão só inicia quando ambos tokens estiverem prontos. |
| Meta WhatsApp Business | Envio de convite/lembrete | Template aprovado `tele_invite` com `{short_link}` | Sim — se falhar, SMTP assume. |
| SMTP (Nodemailer) | Envio por email | HTML com botão + link | Sim — se falhar, log + retry cron. |

---

## 9. Critérios de aceitação

- [ ] Dado um agendamento `telemedicine` confirmado, quando o médico clica **Iniciar**, então a sala é criada em <3s e os tokens são emitidos.
- [ ] Dado que a paciente abre o link, quando autentica por OTP, então entra como guest sem permissões de host.
- [ ] Dado que o médico digita no painel lateral, as anotações são persistidas em <2s (debounce) no `consultation` correto.
- [ ] Dado que a consulta termina, então o `telemedicine_session` registra `ended_at` e dispara o pipeline de checklist + resumo.
- [ ] Dado que gravação foi ativada, então o consentimento duplo aparece no log de auditoria.
- [ ] Dado que a paciente não comparece em 15min, então status vira `no_show`.

---

## 10. Métricas de sucesso

- **Tempo até entrada (both joined):** mediana <90s após médico iniciar. Meta: 95p <180s.
- **Taxa de falha de conexão:** <2% das sessões.
- **% de consultas tele que finalizam com resumo aprovado:** ≥90%.
- **Tempo médio de sala:** 15–25min (sanity check).
- **No‑show rate:** <10%.
- **NPS pós‑tele:** ≥70.

---

## 11. Melhorias recomendadas na migração

- **Sala de espera com triagem ativa** — hoje paciente fica em waiting room estática; melhorar com mini‑formulário (sintomas principais, PA aferida em casa, glicemia) que entra direto no SOAP antes do médico chegar.
- **Teste automatizado de câmera/mic** — adicionar um pré‑check em `/portal/telemedicine/test` na hora do lembrete, reduzindo problemas no início da consulta.
- **Gravação opcional com transcrição por IA** — com consentimento duplo, gravar só áudio, transcrever via Whisper/Claude e oferecer rascunho do SOAP (ainda editável). Reduz carga cognitiva do médico.
- **Indicador de qualidade de rede** — mostrar RTT/jitter em tempo real no painel; abaixo de threshold, sugerir fallback só‑áudio automaticamente.
- **Handoff para chat em caso de queda** — se a chamada cair e não reconectar, abrir automaticamente o chat médico‑paciente com contexto “continuação de teleconsulta”.
- **Dual‑device** — paciente começa no celular e pode transferir para desktop via QR code (útil para mostrar documentos, exames).
- **Integração com PA/glicose em tempo real** — se a paciente usa dispositivo compatível, importar leitura atual ao vivo para o SOAP.
- **Waiting room musical + conteúdo educativo** — enquanto aguarda, tocar vídeo curto personalizado por IG (reaproveita módulo `content/`).

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/telemedicine/telemedicine.controller.ts` — endpoints `POST /telemedicine/rooms`, `POST /telemedicine/tokens`, `POST /telemedicine/sessions/:id/end`.
  - `backend/src/telemedicine/telemedicine.service.ts` — integração Daily.co (create room, meeting token, delete room).
  - `backend/src/telemedicine/telemedicine.entity.ts` — `TelemedicineSession` (room_name, tokens, started_at, ended_at, duration_s, participants_joined).
  - `backend/src/appointments/appointment-reminder.service.ts` — cron `0 8 * * *` envia lembretes 24h/1h.
  - `backend/src/mail/` + `backend/src/notifications/` — canais de envio.
- Frontend:
  - `frontend/src/pages/telemedicine/VideoCallPage.tsx` — tela principal com `DailyIframe` + painel lateral.
  - `frontend/src/pages/portal/PortalTelemedicineEntry.tsx` — entrada da paciente via link.
  - `frontend/src/api/telemedicine.api.ts`.
- Variáveis: `DAILY_API_KEY`, `PUBLIC_APP_URL`, `WHATSAPP_*`, `SMTP_*`.
