# Portal da Paciente

> **Status atual no EliaHealth:** implementado (12 seções ativas)
> **Prioridade na migração:** crítica
> **Depende de:** Autenticação por OTP, Consultas, Pregnancies, BP/Glucose Monitoring, Ultrassom, Agendamento, Chat, Content

---

## 1. Propósito

**Problema que resolve:** a paciente sai do consultório com dúvidas, sem acesso a exames, sem lembrete de vacina, sem saber quando é a próxima consulta, e depende de ligações para a secretária. Apps genéricos (Flo, Clue) não falam com o médico real; portais de EHRs brasileiros quase sempre são uma caixa PDF.

**Valor entregue:** um espaço único onde a paciente vê o que importa da sua saúde — consultas explicadas em linguagem leiga, PA/glicemia, vacinas, exames, USG, agendamento self‑service, compartilhamento QR, check‑in sem recepção, chat com médico e conteúdo educativo personalizado pela IG.

**Intenção do médico‑fundador:** “paciente bem informada dá menos retrabalho e tem melhor desfecho — o portal é a extensão do prontuário na vida dela, sem intermediários.”

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| Paciente | Usuária final do portal | Acessa `app.eliahealth.com/portal` e insere CPF/telefone/email |
| Médico | Publica conteúdo (consultas, resumos, chat) | Finaliza consulta / aprova resumo / responde chat |
| Secretária | Cria agendamentos, valida documentação | Dashboard da recepção |
| Sistema (cron) | Envia lembretes, expira OTPs, gera check‑in QR | `0 8 * * *` e `*/5 * * * *` |

**Pré‑condições:**
- Paciente cadastrada no tenant com pelo menos um canal de contato válido (email ou WhatsApp).
- Consentimento LGPD de acesso ao portal.

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| Identificador (CPF ou email ou telefone) | string | Tela de login | sim |
| OTP (6 dígitos) | string numérico | Email/WhatsApp | sim |
| Dados de onboarding inicial | objeto | Primeiro acesso | sim no primeiro login |
| CPF, CEP, convênio, carteirinha | string | Onboarding / agendamento | sim para agendar |
| Uploads de exames | PDF/imagem | Seção “Meus exames” | não |
| Aferições (PA, glicemia) | numérico | Seção monitoramento | não |

---

## 4. Fluxo principal (happy path)

### 4.1 Login por OTP

1. Paciente acessa `/portal/login` → digita CPF/email/telefone.
2. Backend (`patient-verification.service.ts`) gera **OTP de 6 dígitos**, grava em `patient_verification` com `token_expires_at = now + 10min` e `attempts = 0`.
3. Envio multicanal: WhatsApp (template `otp_verification`) **e** email SMTP. `PORTAL_MASTER_OTP = 123456` só em dev.
4. Paciente insere código → backend valida: se expirado ou `attempts >= 5` → bloqueia por 15min; se ok → emite JWT de 24h com `role=PATIENT` e `patient_id`.
5. Rate limit global: **5 OTPs/min por identificador** e **5/min por IP**.

### 4.2 Onboarding inicial (primeiro login)

1. Completar perfil: nome social, data de nascimento, CEP, convênio, alergias, tipo sanguíneo, contato de emergência, consentimentos LGPD (uso do portal, chat com médico, teleconsulta, pesquisa anonimizada).
2. Escolha de canais preferidos (WhatsApp vs email) e horários de notificação.
3. Se grávida: confirma gestação ativa e DUM — caso backend já tenha `Pregnancy` ativa, apenas confirma.

### 4.3 Uso contínuo (12 seções)

1. **Dashboard** — IG atual, próxima consulta, alertas críticos (PA alta, vacina atrasada), últimas aferições, resumo da última consulta.
2. **Consultas explicadas** — resumos pós‑consulta gerados pela Fase 1 do copiloto; marca leitura automática.
3. **Monitoramento de PA** — paciente registra; gráfico; alertas de pré‑eclâmpsia disparam notificação ao médico.
4. **Glicemia** — jejum/pós‑prandial; gráfico com limites DMG.
5. **Vacinas** — esquema vacinal com status (em dia/atrasada); integração dTpa, influenza, COVID.
6. **Exames** — upload com extração por IA (Claude Vision) → resultados estruturados entram em `lab_results`.
7. **USG** — laudos liberados pelo médico em PDF + resumo leigo.
8. **Agendamento self‑service** — escolhe tipo, médico e slot; formulário coleta CPF, CEP, convênio, carteirinha, validade; cria `appointment` com status `pending_confirmation`.
9. **Compartilhamento por QR code** — gera `public_share` com token temporário para familiar/outro médico; escopo granular (só USG, só consultas, etc.); expiração configurável (24h/7d/30d).
10. **Check‑in QR** — ao chegar na clínica, paciente abre QR exclusivo; secretária bipa → status = `arrived`, sem fila na recepção.
11. **Chat com médico** — mensagens assíncronas com tracking de leitura, anexos, notificação push.
12. **Conteúdo educativo** — cards personalizados por IG (ver fluxo `17-content-education.md`).

```
login OTP -> onboarding -> dashboard
        |-- consultas explicadas (Fase 1)
        |-- PA + glicemia (monitoring)
        |-- vacinas + exames + USG
        |-- agendar | compartilhar QR | check-in QR
        |-- chat com médico
        |-- conteúdo por IG
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Paciente não recebe OTP | Botão **Reenviar** libera após 60s; rate limit global 5/min impede spam. |
| 5 tentativas erradas | Bloqueio por 15min; opção “Falar com secretária”. |
| Identificador não existe | Resposta genérica (“Se esse contato estiver cadastrado, você receberá o código”) para evitar enumeração. |
| Paciente esquece de fazer check‑in | Secretária pode marcar manualmente `arrived`. |
| Upload de exame com imagem ruim | IA devolve `confidence < 0.6` → paciente é notificada para refazer foto. |
| QR code compartilhado com escopo expirado | Destinatário vê tela “link expirou” sem dados. |
| Agendamento sem convênio válido | Forma de pagamento obrigatória antes de confirmar. |
| Paciente relata urgência no chat | Chat detecta keywords (ver Fase 4a) e dispara escalação. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB‑01 | OTP é numérico de **6 dígitos**, expira em **10min**, **máximo 5 tentativas**, bloqueio de 15min após exceder. | `patient-verification.service.ts` (`token_expires_at`) + boas práticas NIST 800‑63B |
| RB‑02 | Rate limit **5 OTPs/minuto** por identificador e por IP. | Guard global + `@Throttle` |
| RB‑03 | JWT da paciente dura **24h**, scope `PATIENT`, não pode acessar dados de outra paciente (tenant + patient_id checados em todas as queries). | `portal.controller.ts` guards |
| RB‑04 | Sem social login (Google/Facebook/Apple removidos explicitamente). | Decisão de produto, `TECHNICAL_SPEC.md` |
| RB‑05 | OTP dev universal `123456` só se `NODE_ENV !== production` e `PORTAL_MASTER_OTP` setada. | `portal-otp.entity.ts` |
| RB‑06 | Compartilhamento por QR sempre com escopo granular e expiração obrigatória (default 7d, max 30d). | `public-share.entity.ts` |
| RB‑07 | Agendamento self‑service exige CPF + CEP + convênio + carteirinha + validade quando modalidade = convênio; se particular, forma de pagamento. | `portal.service.ts` |
| RB‑08 | Upload de exame passa por extração IA (Claude Vision) e só vira `lab_result` oficial após validação do médico. | `ai-fill/` |
| RB‑09 | Aferições de PA com PAS≥140 ou PAD≥90 em gestante disparam alerta copiloto e notificação ao médico. | `bp-monitoring/` + guidelines FEBRASGO |
| RB‑10 | Consentimentos LGPD são granulares (chat, teleconsulta, pesquisa) e revogáveis a qualquer momento. | Módulo `lgpd/` |
| RB‑11 | Chat não é canal de urgência — disclaimer obrigatório na primeira abertura. | UX / segurança |
| RB‑12 | Check‑in QR só é válido no dia do agendamento, dentro de janela de 2h. | `checkin/` |

---

## 7. Saídas e efeitos

- **Cria/altera:** `patient_verification`, `portal_otp`, `portal_session` (JWT), `appointments`, `public_share`, `guest_access`, `lab_results` (após validação), `bp_readings`, `glucose_readings`, `chat_messages`, `consent_log`.
- **Notificações disparadas:** OTP WhatsApp/email; push de novo resumo/laudo/mensagem; alertas críticos ao médico.
- **Integrações acionadas:** WhatsApp Business (OTP e notificações), SMTP, Claude (extração de exames), Daily.co (link de tele).
- **Eventos emitidos:** `portal.login.success`, `portal.consultation.read`, `portal.appointment.requested`, `portal.bp.alert`, `portal.share.created`.

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| WhatsApp Business | OTP + notificações | Template `otp_verification` com `{code}` | Fallback SMTP |
| SMTP | OTP + resumos | HTML com código | Log + retry |
| Claude API | Extração de exames (PDF/imagem) | `{messages:[{role:'user', content:[{type:'image',source},...]}]}` com prompt estruturado | Salva raw e marca `needs_review` |
| Daily.co | Entrada em teleconsulta | Ver fluxo 14 | Sim |

---

## 9. Critérios de aceitação

- [ ] Dado CPF válido, quando solicita OTP, então recebe código em até 15s por WhatsApp e email.
- [ ] Dado OTP correto dentro de 10min, então ganha sessão de 24h.
- [ ] Dado 5 tentativas erradas, então acessos são bloqueados por 15min.
- [ ] Dado primeiro login, então é direcionada ao onboarding e não consegue pular consentimentos LGPD.
- [ ] Dado upload de exame, então em <60s vê resultado estruturado com badge `precisa validação do médico`.
- [ ] Dado agendamento self‑service, então confirma somente após documentação completa.
- [ ] Dado QR de compartilhamento expirado, então visitante vê mensagem de expiração sem vazar dado.
- [ ] Dado PAS≥140 registrada, então médico recebe alerta em <2min.

---

## 10. Métricas de sucesso

- **Taxa de ativação:** ≥75% das pacientes cadastradas fazem login em 7 dias.
- **Retenção 30d:** ≥60% retornam ao portal.
- **Taxa de leitura de resumos:** ≥80%.
- **Agendamentos via self‑service:** ≥30% dos retornos.
- **Adoção do check‑in QR:** ≥50% das pacientes in‑person.
- **Tempo médio de onboarding:** <4min.
- **OTP entrega ≥99% em 30s.**

---

## 11. Melhorias recomendadas na migração

- **Passkeys + fallback OTP** — OTP por WhatsApp/email é ponto de fricção; passkeys (WebAuthn) dão UX superior e seguem sem social login.
- **Consolidar onboarding em 3 telas, não 7** — hoje muitos campos repetem cadastros da recepção; permitir pular e completar sob demanda quando o dado for necessário.
- **Painel de “tarefas da semana”** — em vez de dispersar alertas (vacinas, PA, exame pendente), agrupar em uma lista acionável estilo to‑do com deep‑links.
- **Extrator de exame com verificação humana proativa** — mostrar lado‑a‑lado PDF + campos extraídos e pedir confirmação à paciente antes de mandar ao médico, reduzindo “ruído” no prontuário.
- **Compartilhamento por QR com identidade** — hoje qualquer um com o link vê; exigir que destinatário digite CPF ou data de nascimento para abrir.
- **Check‑in geofence** — detectar entrada na clínica por GPS e sugerir check‑in, em vez de pedir para abrir QR.
- **Onboarding progressivo com celebração por fase da gestação** — marcos de trimestre com microinterações (diferencial B2C que o EliaMov já faz bem).
- **Acessibilidade** — hoje o portal assume letramento digital médio‑alto; adicionar modo “voz” (TTS do resumo), contraste alto, fonte grande por padrão.
- **Histórico de consentimentos visível** — exportar PDF com todos os consentimentos ativos/revogados (LGPD art. 18).
- **Modo cuidador** — acompanhante autorizado (marido, mãe) com sessão secundária e escopo restrito.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/portal/portal.controller.ts` — endpoints `POST /portal/auth/request-otp`, `POST /portal/auth/verify-otp`, GETs das 12 seções.
  - `backend/src/portal/portal.service.ts` / `portal-data.service.ts` — agregação de dados da paciente.
  - `backend/src/portal/portal-otp.entity.ts` + `guest-access.entity.ts` + `public-share.entity.ts`.
  - `backend/src/patient-verification/patient-verification.service.ts` — geração/validação de OTP (10min, 5 tentativas).
  - `backend/src/checkin/` (se aplicável, senão dentro de `appointments/`).
  - `backend/src/ai-fill/` — extração de exames por Claude Vision.
  - Migrations relevantes: criação de `portal_otp`, `patient_verification`, `public_share`, `guest_access`.
- Frontend:
  - `frontend/src/pages/portal/PortalLoginPage.tsx`, `PortalOnboardingPage.tsx`, `PortalDashboard.tsx`.
  - `frontend/src/pages/portal/sections/*` — 12 seções (consultas, PA, glicemia, vacinas, exames, USG, agendamento, compartilhamento, check‑in, chat, conteúdo).
  - `frontend/src/api/portal.api.ts`.
- Variáveis: `JWT_SECRET`, `WHATSAPP_*`, `SMTP_*`, `PORTAL_MASTER_OTP`, `PUBLIC_APP_URL`.
