# Prescrição e assinatura digital (Memed + Bird ID)

> **Status atual no EliaHealth:** parcial (fluxo implementado, integração Memed stubbed, assinatura ICP-Brasil real pendente)
> **Prioridade na migração:** crítica (compliance CFM + tarefa diária do médico)
> **Depende de:** 04-prenatal ou 06-gynecology (consulta em curso), 02-autenticacao

---

## 1. Propósito

**Problema que resolve:** prescrever receita médica válida no Brasil exige **assinatura digital ICP-Brasil** (CFM Resolução 2.299/2021) para emissão eletrônica reconhecida, controle especial C1/C5 via receituário azul/amarelo, e integração com plataformas de dispensação (Memed, iClinic, Nexodata). Médicos ou imprimem e assinam à mão (contra a lei), ou usam Memed isolado (não conecta ao prontuário), ou dependem do consultório físico.

**Valor entregue:** prescrição eletrônica vinculada a consulta/gestação/paciente, integração Memed (token por médico, geração de receita na plataforma externa), assinatura digital via providers (Bird ID principalmente, também Certisign, Valid, SafeID, VIDaaS — suportados no módulo `auth/certificate-*`), envio direto da URL do PDF assinado ao portal da paciente + WhatsApp, histórico de prescrições com status (`draft` → `active` → `signed` → `sent`).

**Intenção do médico-fundador:**
- Prescrição é **artefato clínico**, não "documento externo" — entidade `prescriptions` vinculada à `pregnancy_id` com `prescribedBy` (médico), medicações em jsonb, datas.
- Assinatura digital tem que ser **real** (e-CPF ICP-Brasil), não SHA256 interno. O sistema já tem provider enum (`DigitalSignatureProvider`: BIRD_ID, CERTISIGN, VALID, SAFEID, VIDAAS) no schema — só falta wiring real.
- Memed é **parceiro**, não substituto — token gerado por médico (`generateMemedToken`) redireciona paciente para `https://memed.com.br/...`, mas o registro fica em Elia.
- Fluxo crítico: paciente precisa **receber** a receita antes de sair do consultório. Envio por WhatsApp é canal padrão.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho |
|---|---|---|
| Médico | Prescreve, revisa, assina | Durante ou após consulta |
| Paciente | Recebe PDF, usa na farmácia | Após envio |
| Memed | Gera receita na plataforma deles | `generateMemedToken` |
| Bird ID / ICP-Brasil | Assina digitalmente | Fluxo certificate-login + certificate-sign |
| Copiloto | Detecta interações medicamentosas, contraindicações | Fase 3 WebSocket |

**Pré-condições:**
- Médico com CRM cadastrado e certificado digital ICP-Brasil ativo (ou Bird ID login ativo).
- Paciente com telefone para WhatsApp ou email cadastrado.

---

## 3. Dados de entrada

| Campo | Tipo | Obrigatório |
|---|---|---|
| `pregnancyId` (ou `patientId` se ginecológica) | uuid | Sim |
| `prescribedBy` (médico) | uuid | Sim |
| `prescriptionDate` | date | Sim |
| `medications` | jsonb — array: `[{ name, activeIngredient, dose, route (oral/IM/IV/sublingual/vaginal/rectal/topical), frequency, duration, instructions, controlled (bool), controlledClass (C1/C2/C3/C4/C5/B1/B2/A1/A2/A3) }]` | Sim |
| `notes` | text | Não |
| `status` | enum (`draft` / `active` / `signed` / `sent` / `cancelled`) | Auto |
| `digitalSignatureId`, `digitalSignatureProvider` | string + enum | Após assinatura |
| `signedDocumentUrl` | string | Após assinatura |

---

## 4. Fluxo principal

1. **Abrir prescrição** — dentro da consulta, `AddPrescriptionModal`. Botão "+ Medicamento" adiciona item.
2. **Buscar medicamento** — idealmente base DATASUS/BULÁRIO (hoje livre). Escolher princípio ativo, apresentação comercial, dose.
3. **Validações** — copiloto (Fase 3) detecta:
   - Interações medicamentosas (ex: AAS + varfarina).
   - Categoria gestacional FDA/ANVISA (A/B/C/D/X) — contraindicação se D/X na gestação.
   - Amamentação (compatibilidade LactMed).
   - Dose máxima, duração, ajuste renal/hepático.
4. **Salvar rascunho** — `POST /prescriptions` com `status=draft` (na implementação atual já vira `active` direto).
5. **Gerar token Memed (opcional)** — `POST /prescriptions/memed-token` → token tmp 30min. Frontend embute iframe Memed para paciente imprimir/receber na plataforma.
6. **Assinar** — `POST /prescriptions/:id/sign` com `provider` + `signatureToken` (vindo de Bird ID etc.). Grava `digitalSignatureId`, `provider`, `signedAt`, `signedDocumentUrl` (PDF assinado pelo provider). Status → `signed`.
7. **Enviar paciente** — envio WhatsApp + Portal paciente (seção "Minhas Prescrições"). Status → `sent`.
8. **Histórico** — `GET /pregnancies/:id/prescriptions` lista por data desc. Prescrições ativas visíveis em sidebar da gestação.
9. **Cancelar / renovar** — status `cancelled` bloqueia uso. Renovação cria nova prescrição copiando medicações.

```
[Consulta aberta]
   ↓
[AddPrescriptionModal → medicações]
   ↓
[Copiloto valida interações/contraindicações]
   ↓
[Salvar → status active]
   ↓
[Assinar via Bird ID/ICP-Brasil → status signed + signedDocumentUrl]
   ↓
[WhatsApp + Portal → status sent]
   ↓
[Timeline da gestação / paciente]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Medicamento categoria X gestação (ex: isotretinoína, talidomida) | Copiloto bloqueia com alerta `urgent` — requer confirmação com justificativa |
| Medicamento controlado C1 (benzodiazepínico, opióide) | Exige receita amarela/azul; Memed suporta em alguns estados. Marcar `controlled=true`. No Brasil, controle físico ainda necessário em muitas redes |
| Provider de assinatura offline | Fallback para cola física do PDF impresso + assinatura manuscrita — registrar `status=signed` com flag `manualSignature=true` (gap) |
| Paciente sem WhatsApp | Enviar por email ou imprimir na recepção |
| Paciente ambulatorial vs internada | Hospitalização deve ter módulo próprio (prescrição diária, alta) — hoje usa o mesmo |
| Alergia medicamentosa registrada | Copiloto checa `patient.allergies` jsonb e bloqueia — **implementação parcial** |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | Assinatura ICP-Brasil e-CPF obrigatória para receita eletrônica válida | CFM 2.299/2021 |
| RB-02 | Receita controlada C1/C5 requer receituário específico (azul B1, amarelo A1/A2/A3) | ANVISA Portaria 344/98 |
| RB-03 | Receita controlada válida por 30 dias para antimicrobianos; 30d para A1/A2; 60d para B1/B2; 5d para antimicrobianos em alguns casos | ANVISA RDC 20/2011 |
| RB-04 | Gestante — evitar categoria D (ex: tetraciclina, IECA, estatinas, varfarina, valproato) | FDA/ANVISA |
| RB-05 | Gestante — proibida categoria X (isotretinoína, talidomida, misoprostol fora de uso obstétrico indicado) | |
| RB-06 | AAS 100mg 12-36s em gestantes com risco PE (ver 04-prenatal RB-17) | USPSTF 2021 |
| RB-07 | Progesterona vaginal 200mg/d em colo curto <25mm até 36s | FIGO 2021 |
| RB-08 | Sulfato de Mg em PE grave: 4-6g ataque EV em 20min + 1-2g/h manutenção; controle reflexos/diurese/FR | |
| RB-09 | Corticoide TPP 24-34s: betametasona 12mg IM 2 doses (24h) | |
| RB-10 | Ferro: gestante — sulfato ferroso 40-60mg Fe elementar/d profilático 20s+ | FEBRASGO |
| RB-11 | Ácido fólico 0.4-5mg/d pré-concepcional + 1º tri | |
| RB-12 | Metronidazol 1º trimestre — evitar se possível, usar clindamicina | |
| RB-13 | IECA/BRA contraindicado em qualquer IG da gestação (malformação) | |
| RB-14 | Lactação — compatibilidade LactMed; evitar metronidazol dose única (parar AM 12-24h), amiodarona, quimioterápicos | |
| RB-15 | Prescrição assinada é imutável (não pode editar, só cancelar + nova) | boa prática |
| RB-16 | Token Memed expira em 30min | `prescriptions.service.ts:67-72` |
| RB-17 | Providers permitidos configuráveis por tenant (JSONB) | `auth` module |

---

## 7. Saídas e efeitos

- **Cria/altera:** `prescriptions` + registros em `patient_medications` (uso contínuo).
- **Notificações:** WhatsApp (PDF url) + Portal paciente ("Nova prescrição disponível") + email se configurado.
- **Integrações:** Memed (token + iframe), Bird ID / Certisign / Valid / SafeID / VIDaaS (assinatura), Meta WhatsApp, SMTP.
- **Eventos:** timeline da gestação recebe `type=prescription`; copiloto pós-consulta checa se todas as prescrições obrigatórias (AAS, ferro, folato, anti-hipertensivo) foram feitas.

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa |
|---|---|---|---|
| Memed | Ao prescrever para plataforma externa | `token tmp` | Sim — prescrição fica local com PDF interno |
| Bird ID (ICP-Brasil) | Assinatura | Token certificado + documento | Sim — mas receita fica sem validade legal eletrônica; imprimir+assinar manual |
| Certisign / Valid / SafeID / VIDaaS | Assinatura alternativa | Similar | Sim |
| WhatsApp Business | Envio | Template + PDF URL | Fallback email |
| SMTP | Envio | PDF anexo | — |
| LactMed (NCBI) | Checagem lactação | API externa | **Não integrado** (gap) |
| DATASUS BULÁRIO | Autocomplete medicamento | API | **Não integrado** (gap) |

---

## 9. Critérios de aceitação

- [ ] Dada prescrição com medicação categoria X em gestante, copiloto bloqueia com alerta urgent e requer justificativa.
- [ ] Prescrição assinada via Bird ID, `signedDocumentUrl` preenchido e acessível via portal.
- [ ] Prescrição assinada tentativa de editar → bloqueio (boa prática — implementar).
- [ ] Token Memed expira em 30min.
- [ ] AAS 100mg prescrito em gestante 14s com histórico PE prévia — registra e sugere término em 36s.
- [ ] Paciente acessa portal e vê PDF da prescrição dentro de 1 min do envio.

---

## 10. Métricas de sucesso

- **Taxa de assinatura digital real:** % de prescrições com `digitalSignatureProvider` preenchido. **Meta:** >95%.
- **Tempo prescrição → envio paciente:** **Meta:** <5 min médio.
- **Taxa de entrega WhatsApp:** **Meta:** >90%.
- **Taxa de alertas de interação acionados:** quantos foram aceitos/modificados pelo médico.
- **% de prescrições com medicação controlada corretamente classificada:** **Meta:** >99%.

---

## 11. Melhorias recomendadas na migração

- **Integração real Memed** — hoje `generateMemedToken` retorna token fake `memed_tmp_${prescribedBy}_${Date.now()}`. Trocar por chamada real à API Memed Partners (endpoint `/partners/v1/tokens` com API key do tenant), receber `redirectUrl`, embutir iframe.
- **Autocomplete DATASUS BULÁRIO** — hoje medicamento é texto livre. Integrar com base ANVISA Bulário Eletrônico (https://consultas.anvisa.gov.br/#/bulario/) — nome comercial → princípio ativo → apresentações → categoria gestacional.
- **Checagem de interações via base de dados** — Drugs.com API ou Medscape. Hoje copiloto checa via Claude (caro, lento, sem garantia).
- **LactMed integrado** — se paciente amamentando, mostrar ícone de compatibilidade ao escolher medicamento.
- **Receituário controlado estruturado** — schema atual suporta `controlled` mas sem distinção entre receita amarela (A1-A3 entorpecentes), azul (B1-B2 psicotrópicos), branca em 2 vias (C1-C5). Adicionar seleção automática baseada na classe.
- **Template de prescrição rápida** — "Pacote pré-natal 1º tri" (ác. fólico 5mg, polivitamínico), "Cesárea pós-op" (dipirona + cefalexina 7d + enoxaparina 7d). Hoje médico monta do zero toda vez.
- **Renovação com 1 clique** — prescrição anterior → botão "Renovar por +30d" cria nova com data atualizada.
- **Assinatura em lote** — médico termina 8 consultas do dia, assina todas as rx com 1 autenticação Bird ID.
- **Prescrição por voz** — "prescrever metformina 850mg 12/12h por 30 dias" → Claude preenche estrutura + médico revisa e assina.
- **Painel de uso contínuo por paciente** — "Paciente usa: AAS 100mg (desde 2024-10), Levotiroxina 50mcg (desde 2023-06)". Hoje lista todas rx históricas; sintetizar uso atual.
- **Controle de dose máxima diária** — se médico prescreve paracetamol 750mg 8/8h (2250/dia) + outra formulação, alertar ultrapassagem de 3g/d.
- **Fragmentar `AddPrescriptionModal`** — hoje é monolítico. Wizard: busca medicamento → dose/via/frequência → instruções → confirmar interações → assinar.
- **PDF receita brasileira padrão** — layout com campos obrigatórios CFM (nome paciente, CPF, medicamento, posologia, carimbo + CRM, data, assinatura). Gerado localmente como fluxo de laudo USG.
- **Imprimir receita física** — para clínicas que ainda preferem papel, botão "Imprimir" com PDF A5/A4.

---

## 12. Referências no código atual

- **Backend:**
  - `backend/src/prescriptions/prescriptions.service.ts` (CRUD, `sign`, `generateMemedToken`)
  - `backend/src/prescriptions/prescription.entity.ts` (status, provider enum, `signedDocumentUrl`, `digitalSignatureId`)
  - `backend/src/auth/` (`certificate-login`, `token-login`, `register-certificate` — fluxo Bird ID e providers ICP-Brasil)
  - `backend/src/auth/strategies/` (strategies JWT + certificate)
- **Frontend:**
  - `frontend/src/pages/pregnancy/sections/AddPrescriptionModal.tsx`
  - Portal paciente — seção "Minhas Prescrições"
- **Migrations:** `*Prescription*`
