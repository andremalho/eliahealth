# Check-in por QR Code

> **Status atual no EliaHealth:** implementado (versão simples — input de código; QR render pendente na agenda)
> **Prioridade na migração:** alta
> **Depende de:** agendamento (11) para emissão do token; portal paciente (opcional) para receber o QR

---

## 1. Propósito

**Problema que resolve:** Filas na recepção são fricção primária da experiência clínica: paciente chega 15min antes, aguarda secretária conferir cadastro, pedir convênio, marcar chegada — tudo papel/tela. Em UBS ou clínicas de alto volume essa fila é o gargalo.

**Valor entregue:** Paciente escaneia um QR (ou digita código de 8 chars) no próprio celular ao chegar, o sistema marca `status=arrived` + `checkedInAt=now()` sem nenhuma intervenção humana. Secretária vê a paciente "chegou" em tempo (quase) real no dashboard.

**Intenção do médico-fundador:** "A recepção não precisa ser um checkpoint burocrático — deveria ser um sorriso e um café. Se já cadastrei no portal e o documento é o mesmo, não tem sentido repassar tudo de novo." O QR é uma rampa para clínicas digitais.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Paciente | Faz o check-in | Chega à clínica, abre câmera no QR impresso/exibido ou link enviado |
| Sistema (agenda) | Emite `checkinToken` ao criar appointment (não documentado em lugar centralizado — ver Gaps) | Trigger na criação de appointment |
| Secretária | Observa fila em `reception/today` | Polling / invalidation |

**Pré-condições:**
- Appointment existe com `checkinToken` preenchido.
- Paciente conhece o código (recebido por WhatsApp/email junto com confirmação, ou QR impresso na sala de espera).

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| token | string (no UI 8 chars upper-case) | QR scan ou digitação | sim |

Rota pública: `POST /appointments/checkin/:token`.

---

## 4. Fluxo principal (happy path)

1. **Emissão do token** — na criação/confirmação do appointment, algum fluxo (atualmente não explícito no service mas presente como coluna `checkin_token`) gera string aleatória unique e persiste em `appointments.checkin_token`. O token é enviado à paciente via WhatsApp/email junto com o lembrete, e/ou exibido como QR no portal da paciente.
2. **Paciente chega à clínica** — abre câmera do celular, aponta para QR na entrada. QR codifica URL tipo `https://app.eliahealth.com/checkin?token=ABC12345` OU paciente acessa a tela `/checkin` diretamente.
3. **Tela de check-in** (`frontend/src/pages/checkin/CheckinPage.tsx`) — minimalista, sem autenticação:
   - Header com logo EliaHealth.
   - Input central de 8 caracteres monospace (auto-uppercase), `maxLength=8`.
   - Botão "Confirmar chegada" desabilitado até `length >= 4`.
4. **Submit** — `POST /appointments/checkin/<TOKEN>` (token normalizado `trim().toUpperCase()`).
5. **Backend processa** (`AppointmentsService.checkin`):
   - `findOneBy({ checkinToken: token })` — se não encontra, 404 "Token de check-in invalido".
   - Se `isCheckedIn=true` → 409 "Check-in ja realizado".
   - Senão: `isCheckedIn=true`, `checkedInAt=now()`, `status=AppointmentStatus.ARRIVED`, save.
6. **Resposta** — frontend mostra tela verde "Check-in confirmado! Sua chegada foi registrada. Aguarde ser chamada." Botão "Novo check-in" limpa estado.
7. **Reflexo no dashboard da recepção** — próximo refetch (60s, ou invalidation se houver WS) atualiza contador de "arrived" e destaca na linha da agenda.
8. **Médico inicia consulta** — quando chama paciente, muda `status` para `in_progress` manualmente ou via fluxo da consulta clínica.

```
  Paciente → QR scan → /checkin?token=XXX
                           │
                           ▼
          POST /appointments/checkin/XXX
                           │
                           ▼
           ARRIVED + checkedInAt=now()
                           │
                           ▼
             Recepção vê na agenda (polling)
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Token inválido / truncado | 404 "Token de check-in invalido" |
| Check-in já feito | 409 "Check-in ja realizado" — frontend exibe mensagem amigável |
| Paciente chega no dia errado | Não enforced hoje — check-in funciona. GAP: deveria comparar `date` com `now()` e recusar fora da janela. |
| Appointment cancelado | Check-in ainda funciona (muda para ARRIVED, sobrescrevendo CANCELLED). GAP crítico. |
| Paciente sem acesso ao código (esqueceu/ não recebeu) | Procurar a recepção — instrução clara no rodapé da tela |
| Token colidido (dois appointments com mesmo token) | Impossível: coluna `unique` garante. |
| Scan de QR em aparelho offline | Frontend standalone — exige internet para hit no backend |
| Paciente errada usa código (confusão) | Hoje quem bater código da amiga faz check-in dela — GAP de identidade |
| Token vazado | Qualquer pessoa com token pode marcar como arrived — baixo risco (apenas status) mas risco de denial-of-service |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Endpoint público (sem auth) — necessário para paciente scanar sem login | `appointments.controller.ts:165-167` (Public) |
| RB-02 | Token unique globalmente via constraint | `appointment.entity.ts:107-108` |
| RB-03 | Check-in é idempotente com guarda: segunda tentativa = 409 | `appointments.service.ts:140-148` |
| RB-04 | Status muda de qualquer valor atual → `ARRIVED` (sem validação de transição) | `appointments.service.ts:146` |
| RB-05 | Token normalizado pelo frontend: `trim().toUpperCase()` | `CheckinPage.tsx:16` |
| RB-06 | UI aceita min 4 chars antes de habilitar botão; input limita a 8 | `CheckinPage.tsx:62-76` |
| RB-07 | Check-in não envia notificação ativa para a recepção — depende de polling 60s | convenção atual |
| RB-08 | Nenhuma validação de data/hora do appointment vs `now()` | GAP |
| RB-09 | Token não expira | GAP |

---

## 7. Saídas e efeitos

- **Cria/altera:** `appointments` (`isCheckedIn`, `checkedInAt`, `status=ARRIVED`).
- **Notificações disparadas:** nenhuma (hoje).
- **Integrações acionadas:** nenhuma.
- **Eventos emitidos:** nenhum formal — recepção só descobre via refetch.

---

## 8. Integrações externas

Nenhuma. Fluxo é puramente interno.

---

## 9. Critérios de aceitação

- [ ] Dado appointment com `checkinToken='ABC12345'` e `isCheckedIn=false` quando `POST /appointments/checkin/ABC12345` então 200, status=arrived, checkedInAt preenchido.
- [ ] Dado repeito da chamada em <30s então 409 "ja realizado".
- [ ] Dado token `"abc12345"` (lowercase) quando scan no frontend então normaliza para uppercase antes de enviar.
- [ ] Dado token `""` no URL então 404.
- [ ] Dado token com 4 chars a UI permite submeter (min atual), 8 é o ideal.
- [ ] Dado auth desabilitada a rota aceita request sem Authorization header.

---

## 10. Métricas de sucesso

- **Taxa de self-checkin (ARRIVED via endpoint vs via mudança manual de status):** meta 60% em 60d.
- **Tempo médio da chegada física ao `checkedInAt`:** via cruzamento com geofence (se houver) ou auto-report. Meta: <30s.
- **% appointments com `checkinToken != null`:** meta 100% (falha atual pode ser <100%).
- **Redução de fila na recepção:** meta -40% em consultórios com ≥30 consultas/dia.

---

## 11. Melhorias recomendadas na migração

- **Geração do token não está centralizada.** Coluna existe, mas não há service/subscriber que preenche na criação. Criar `AppointmentsService.create` para gerar `checkinToken = nanoid(8, alphabetUpper)` sempre.
- **Envio do QR à paciente ausente.** Hoje presumivelmente é manual. Adicionar ao lembrete 48h/24h (fluxo 11) um QR renderizado no email + deep link WhatsApp (`wa.me` texto com URL).
- **Token nunca expira → risco de abuso.** Expirar `checkinToken` 4h antes da consulta e 2h depois. Após janela, gerar novo token se necessário.
- **Check-in não valida janela de data.** Qualquer um pode fazer check-in em consulta de amanhã. Regra: aceitar só se `date IN [today-0, today+0]` (configurável por tenant).
- **Check-in não valida status.** Appointment cancelado/no_show não deveria virar arrived. Retornar 409 "Consulta <status>, check-in não permitido".
- **Sem notificação para recepção/médico.** Emitir WS evento `appointment.arrived` no namespace `/reception`; dashboard da secretária atualiza sem polling.
- **Sem validação de identidade.** Qualquer um com o código pode check-in. Incluir CPF/dia-nascimento adicional (2FA leve) ou, se paciente estiver logada no portal, reusar autenticação dela (endpoint autenticado `/portal/checkin/:token` que valida `patient.id === appointment.patient_id`).
- **Tela de sucesso não mostra dados contextuais.** Paciente não vê o nome do médico, a hora, a sala. Mostrar: "Dr(a) X · sala 2 · aguarde sua chamada".
- **Sem fila visível à paciente.** Exibir posição na fila/tempo estimado aumenta percepção de controle.
- **Sem bloqueio de re-scan de outra paciente no mesmo device.** Após 1 check-in, bloquear novos por 10min (anti-abuse leve).
- **QR render no portal e no email ausente.** Biblioteca `qrcode` no frontend + renderizar como data URL.
- **Telemetria pobre.** Sem log de tentativas falhas — não dá para monitorar tokens errados. Adicionar `checkin_attempts` com `token_tried`, `success`, `ip`, `user_agent`, `ts`.
- **Tela mobile ok, mas não tem "segure para colar código recebido via WhatsApp".** Facilitar com deep link `intent://` ou prefill via `?token=` na URL.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/appointments/appointments.controller.ts:165-168` (`@Post('checkin/:token')` com `@Public()`)
  - `backend/src/appointments/appointments.service.ts:140-148` (lógica do checkin)
  - `backend/src/appointments/appointment.entity.ts:101-111` (campos `is_checked_in`, `checked_in_at`, `checkin_token`, `documents_confirmed`)
  - `backend/src/appointments/appointment.enums.ts:4` (`AppointmentStatus.ARRIVED`)
- Frontend:
  - `frontend/src/pages/checkin/CheckinPage.tsx` (91 linhas — UI completa, minimalista)
  - `frontend/src/api/client.ts` (cliente axios usado mesmo em rota pública)
- Gaps observados no código atual:
  - Nenhum service centraliza a geração do `checkinToken` na criação do appointment (procurar em migrations ou subscribers).
  - QR code não é renderizado em lugar visível do frontend — só o input numérico existe.
- Migrations: `AddCheckinToken` (esperada), `AddIsCheckedIn`.
