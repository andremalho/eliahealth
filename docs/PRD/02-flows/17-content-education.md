# Conteúdo Educativo Personalizado

> **Status atual no EliaHealth:** implementado
> **Prioridade na migração:** média (alto valor percebido, baixo custo)
> **Depende de:** Portal da Paciente, Pregnancies (IG), Patients (fase de vida)

---

## 1. Propósito

**Problema que resolve:** paciente busca informação sobre gestação, ciclo, menopausa, fertilidade no Google — cai em blogs ruins, Instagram sensacionalista ou apps genéricos (Flo, Babycenter) que não têm contexto da sua situação real. O médico perde tempo repetindo orientações básicas em toda consulta.

**Valor entregue:**
- Conteúdo curado pelo corpo clínico, entregue no portal no momento certo (por IG, por fase de vida, por condição).
- Linguagem leiga, formato curto (cards de 300–800 palavras + vídeos/infográficos), revisado por médico.
- Reduz consultas por dúvidas já respondidas no portal; aumenta adesão a condutas (vacinas, exames, suplementação).

**Intenção do médico‑fundador:** “a paciente informada é a melhor parceira de conduta — eu quero que ela chegue na consulta já sabendo o básico, para gastarmos tempo com o que importa.”

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Médico/Admin | Cria/edita/publica cards de conteúdo | Painel `content-admin` |
| Paciente | Consome conteúdo | Abre a seção “Conteúdo” do portal ou clica notificação |
| Sistema | Seleciona cards pertinentes | Query automática ao carregar portal ou push semanal |

**Pré‑condições:**
- Paciente com perfil mínimo preenchido (fase de vida ou IG).
- Tenant com biblioteca de conteúdo ativada.

---

## 3. Dados de entrada

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| `life_stage` | enum (`pregnant`, `postpartum`, `reproductive`, `climacteric`, `menopausal`) | Perfil da paciente | sim |
| `gestational_age_weeks` | int | `Pregnancy.ig_weeks` | sim se `pregnant` |
| Conteúdo: título, corpo (markdown), anexos (imagem/vídeo), `tags[]`, `target_life_stage[]`, `target_ig_min`, `target_ig_max`, `priority`, `publish_at`, `status` (`draft`/`published`/`archived`) | vários | Admin | sim |

---

## 4. Fluxo principal (happy path)

### 4.1 Curadoria (admin/médico)
1. Admin abre `/settings/content`, cria card com editor markdown, anexa imagem e define segmentação (IG 20–28s, life_stage=pregnant).
2. Pré‑visualiza como a paciente veria.
3. Publica — `content` ganha `status=published` e `published_at`.

### 4.2 Entrega (paciente)
1. Paciente abre portal → módulo `content/` (`api/content.api.ts`) chama `GET /content/feed` com parâmetros do perfil.
2. Backend filtra por `life_stage` + janela de IG + prioridade + não‑lidos.
3. Frontend (`PortalContentSection.tsx`) renderiza feed em cards visuais.
4. Paciente clica → abre card completo → marca leitura (`PATCH /content/:id/read`).
5. Weekly push (cron `0 9 * * 1`): envia WhatsApp com 1 card destacado por paciente ativa.

```
admin cria card (life_stage + IG) -> published
paciente abre portal -> GET /content/feed filtrado -> cards
paciente lê -> read marcado
cron semanal -> WhatsApp com card top da semana
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Sem conteúdos publicados para a IG | Feed mostra “conteúdos gerais” fallback (tags `general`). |
| Paciente já leu todos | Feed mostra “Você está em dia” + conteúdo opcional. |
| Card arquivado durante leitura | Mantém acesso para pacientes que já viram; não aparece para novas. |
| Paciente sem IG definida | Feed cai no modo `life_stage` only. |
| WhatsApp opt‑out | Push semanal é suprimido; só in‑app. |
| Conteúdo com vídeo grande em rede fraca | Frontend oferece versão “só texto”. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB‑01 | Conteúdo só é publicado por usuário com role `PHYSICIAN` ou `ADMIN`. | Governança clínica |
| RB‑02 | Segmentação por IG usa **janela fechada** `[target_ig_min, target_ig_max]` em semanas. | `content.entity.ts` |
| RB‑03 | Ordenação do feed: `priority DESC`, `published_at DESC`, `read=false` primeiro. | Produto |
| RB‑04 | Cards não podem conter prescrição, posologia específica ou diagnóstico individualizado. | CFM + LGPD |
| RB‑05 | Push semanal só para pacientes com consentimento `marketing_content=true` (opt‑in explícito). | LGPD |
| RB‑06 | Conteúdo educativo nunca substitui chat/consulta; disclaimer persistente no rodapé do card. | Regulatório |
| RB‑07 | Se conteúdo for editado após publicação, cria nova versão; pacientes que já leram veem badge “Atualizado”. | Auditoria |
| RB‑08 | Máx 20 cards no feed da paciente; além disso paginação. | UX |

---

## 7. Saídas e efeitos

- **Cria/altera:** `content`, `content_reads` (patient_id × content_id × read_at).
- **Notificações disparadas:** push semanal (WhatsApp + email), notificação in‑app quando novo conteúdo publicado matcheando perfil.
- **Integrações acionadas:** WhatsApp Business (push), SMTP.
- **Eventos emitidos:** `content.published`, `content.read`.

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload | Falha graciosa? |
|---|---|---|---|
| WhatsApp Business | Push semanal | Template `weekly_content` com `{title}`+`{short_url}` | Sim — SMTP fallback |
| SMTP | Push por email | HTML com card | Sim — in‑app only |
| CDN (opcional) | Imagens/vídeos | URL assinado | Sim — fallback host próprio |

---

## 9. Critérios de aceitação

- [ ] Dado paciente gestante 24s, quando abre o portal, então vê cards publicados com IG entre 20 e 28s.
- [ ] Dado card lido, não volta a aparecer como “novo”.
- [ ] Dado opt‑out WhatsApp, então nenhum push é enviado.
- [ ] Dado card editado pós‑publicação, então pacientes veem badge “Atualizado”.
- [ ] Dado autor sem role adequada, então sistema bloqueia publicação.
- [ ] Dado conteúdo `archived`, não aparece em novos feeds.

---

## 10. Métricas de sucesso

- **Leitura média por paciente/mês:** ≥4 cards.
- **CTR do push semanal:** ≥25%.
- **Taxa de opt‑in para push:** ≥60%.
- **Redução de perguntas repetitivas no chat médico‑paciente** sobre tópicos cobertos por conteúdo: meta 30% em 90d.
- **Tempo médio no módulo:** ≥2min/semana.

---

## 11. Melhorias recomendadas na migração

- **Feed dinâmico com IA de recomendação** — hoje ordenação é heurística; usar perfil + comportamento (o que leu, o que pulou) para ranquear melhor. Evitar filtro colaborativo puro (LGPD).
- **Geração assistida por IA** — admin escreve tópico, Claude gera rascunho (sem publicar sozinho); acelera produção de conteúdo e mantém curadoria humana.
- **Vídeos curtos verticais** — formato vencedor em B2C (EliaMov). Suporte nativo em 9:16.
- **Quiz/interativo** — cards com perguntas (“você reconhece os sinais de pré‑eclâmpsia?”) aumentam retenção; respostas entram no perfil da paciente para o copiloto.
- **Conteúdo puxado pelo médico** — durante a consulta, médico anexa 2 cards à consulta que viram “leitura de casa” da paciente (entregue com o resumo Fase 1).
- **Tradução automática** — pt/en/es com revisão humana (o projeto já tem `i18n`).
- **Biblioteca compartilhada entre tenants** — pool “EliaHealth oficial” curado pela equipe clínica, que tenants podem assinar; reduz carga de produção do consultório pequeno.
- **Acessibilidade** — TTS, modo alto contraste, fonte grande; legendas em todos os vídeos.
- **Trilhas por jornada** — séries ordenadas (“preparando para o parto em 8 aulas”) com progresso visível.
- **Integração com EliaMov** — sincronizar conteúdo por fase hormonal via módulo `eliahealth-integration` já existente do EliaMov.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend:
  - `backend/src/content/content.entity.ts` — campos, life_stage, target_ig, priority, status.
  - `backend/src/content/content.controller.ts` — `GET /content/feed`, `GET /content/:id`, `POST /content`, `PATCH /content/:id`, `PATCH /content/:id/read`.
  - `backend/src/content/content.service.ts` — filtro por life_stage + IG + status.
  - `backend/src/content/content.module.ts`.
  - Cron push semanal: provavelmente em `notifications/` ou `content/` (seguir padrão `0 9 * * 1`).
- Frontend:
  - `frontend/src/pages/portal/PortalContentSection.tsx` — feed da paciente.
  - `frontend/src/api/content.api.ts` — cliente HTTP.
  - Tela admin: `frontend/src/pages/settings/ContentAdmin.tsx` (verificar).
- Variáveis: `WHATSAPP_*`, `SMTP_*`, `PUBLIC_APP_URL`.
