# Visão e personas

## 1. Proposta de valor

**EliaHealth é o primeiro prontuário eletrônico brasileiro projetado por e para especialistas em saúde da mulher** — ginecologia, obstetrícia, fertilidade e menopausa — com inteligência artificial clínica nativa e portal da paciente ativo.

A dor original que o produto resolve:

> EHRs genéricos (HiDoctor, GestãoDS) tratam a mulher como "mais um paciente". Não entendem PALM-COEIN, não geram laudo de USG morfológico, não monitoram curva de crescimento fetal, não calculam risco FMF, não orientam AAS para pré-eclâmpsia, não têm portal que devolva os dados à paciente. O médico termina o dia copiando informações entre 4 ferramentas.

**O que o EliaHealth entrega em vez disso:**

| Frente | Promessa |
|---|---|
| **Profundidade clínica** | 22 módulos clínicos especializados, 130+ regras codificadas a partir de FEBRASGO/ACOG/WHO/NICE/FIGO/ISUOG/FMF |
| **IA que acelera sem substituir** | Copiloto em 5 fases (resumo, checklist, tempo-real WS, chatbot WhatsApp contextual, longitudinal) |
| **Paciente ativo** | Portal com OTP, dashboard gestação, PA/glicemia, upload exames com extração IA, agendamento self-service, chat médico |
| **Laudos estruturados** | 17 templates USG (ISUOG/ACR/BI-RADS/TI-RADS), assinatura SHA256, PDF A4, envio WhatsApp/email |
| **Agenda brasileira** | Categorias/cores, auto-schedule pré-natal ACOG, lembretes 48/24h WhatsApp+email, check-in QR |
| **Multi-tenant real** | 3 presets (consultório, UBS, hospital) × 16 módulos flagáveis × 7 roles |
| **Compliance nativa** | LGPD, FHIR R4 + RNDS, ICP-Brasil (Bird ID/Certisign/Valid/SafeID/VIDaaS), TISS/TUSS |

---

## 2. Arquétipo da decisão de produto

O fundador do EliaHealth é **médico ginecologista-obstetra**. As decisões de produto refletem a cabeça de quem atende, não de quem vende software:

- **O médico pode pular a IA sempre que quiser** — nenhum fluxo exige Claude para avançar. A IA é aceleração, não ditadura.
- **O checklist pós-consulta (Fase 2) bloqueia finalização** — porque a ideia não é "lembrar", é impedir que o paciente saia sem anti-RhD, sem AAS prescrito, sem exame solicitado. É um gate de segurança, não uma sugestão educada.
- **Tudo que a paciente vê é aprovado pelo médico** — resumos pós-consulta precisam de aprovação antes de irem para o WhatsApp.
- **O portal da paciente não tem social login** — decisão explícita: OTP por email/WhatsApp elimina fricção de contas esquecidas; nenhuma rede social cruza dado de gestação.
- **Urgência escala por padrão** — chatbot detecta keywords (sangramento, dor intensa, perda de líquido) e, em vez de tentar tranquilizar a paciente, notifica o médico, instrui ida ao PS e dá o número do SAMU.

---

## 3. Personas (ordem de impacto no produto)

### 3.1 Médico especialista (persona primária)

| | |
|---|---|
| **Role** | `PHYSICIAN` |
| **Volume esperado** | 20-60 consultas/semana |
| **Contextos** | Consultório privado / ambulatório UBS / maternidade |
| **Jobs-to-be-done** | Documentar consulta sem atrasar a próxima; não esquecer conduta baseada em guideline; devolver à paciente uma explicação clara; reencontrar dados longitudinalmente |
| **Frustrações com EHRs atuais** | Campos irrelevantes para GO; sem cálculo de IG automático; sem protocolo por trimestre; laudo USG em Word fora do sistema; nenhum retorno para a paciente |
| **Métricas que o médico quer ver** | "Quantas gestações com HAS esse mês?" "Quais pacientes não voltaram depois de exame alterado?" "Minha taxa de cesárea vs média da clínica?" |
| **Telas principais** | Dashboard → Detalhe de paciente / gestação → Consulta → USG → Portal da paciente |

### 3.2 Paciente (persona co-primária)

| | |
|---|---|
| **Role** | `PATIENT` |
| **Faixa etária dominante** | 18-45 (gestante/ginecologia), 45-65 (menopausa) |
| **Vínculo** | Tem médico-titular; recebe link do portal após 1ª consulta |
| **Jobs-to-be-done** | Entender o que o médico disse; não perder próxima consulta; reportar sintomas entre consultas; compartilhar dados com PS/emergência |
| **Frustrações** | Sai da consulta sem lembrar da conduta; não sabe se deve ir ao PS; precisa ligar pro consultório pra tirar dúvida pequena; recebe exame mas não sabe ler |
| **Canal preferido** | WhatsApp > email > portal web > aplicativo (PWA instalável) |
| **Telas principais** | Portal dashboard → Consultas explicadas → Upload exame → Chat → Agendar |

### 3.3 Secretária / Recepcionista

| | |
|---|---|
| **Role** | `RECEPTIONIST` |
| **Vínculo** | Atrelada a 1 ou N médicos via `secretary_assignment` (N:N) |
| **Jobs-to-be-done** | Organizar agenda; cadastrar paciente nova; receber documento de convênio; cobrar particular; operar check-in |
| **Constraint fundamental** | **Não vê dados clínicos** — nunca lê prontuário, nunca lê laudo. Vê agenda, contatos, convênios, pagamentos. |
| **Telas principais** | Reception dashboard (abas Gestantes/Ginecologia) → Novo agendamento → Cadastro básico → Calendário partos |

### 3.4 Administrador de unidade

| | |
|---|---|
| **Role** | `ADMIN` |
| **Jobs-to-be-done** | Configurar tenant (consultório/UBS/hospital); convidar equipe; gerenciar roles; ativar módulos (16 flags); ver métricas agregadas; exportar dados LGPD |
| **Telas principais** | Settings (tenant config + module flags) → Teams → Analytics (visão agregada) |

### 3.5 Enfermeiro / Equipe multidisciplinar

| | |
|---|---|
| **Role** | `NURSE` |
| **Contexto dominante** | UBS (pré-natal baixo risco), Hospital (evolução enfermagem, puerpério) |
| **Jobs-to-be-done** | Registrar sinais vitais, aplicar vacinas, evoluir paciente internada, triar para médico |
| **Escopo limitado** | Não prescreve controlados, não assina laudo USG, não finaliza consulta médica — mas evolução enfermagem tem campo próprio. |

### 3.6 Pesquisador

| | |
|---|---|
| **Role** | `RESEARCHER` |
| **Acesso** | **Apenas** `research_records` 100% anonimizados |
| **Jobs-to-be-done** | Queries populacionais; dashboards de incidência; query natural em PT → SQL → gráfico |
| **Constraint** | Não vê CPF, não vê nome, não vê unidade de saúde identificável |

### 3.7 SuperAdmin (operacional da plataforma)

| | |
|---|---|
| **Role** | `SUPERADMIN` |
| **Escopo** | Cross-tenant. Gerencia tenants, presets, providers ICP-Brasil permitidos, feature flags globais. |
| **Quem usa** | Time do produto — não é papel do cliente. |

---

## 4. Arquitetura de decisão da UX

O fluxo-mãe do médico foi desenhado para **três tempos**:

```
ANTES DA CONSULTA           DURANTE A CONSULTA              DEPOIS DA CONSULTA
──────────────────          ──────────────────              ──────────────────
Dashboard unificado         Copiloto tempo real (WS)        Checklist bloqueante (Fase 2)
(ações urgentes primeiro)   insights incrementais           Resumo gerado e revisado (Fase 1)
                            no painel lateral               Enviado WhatsApp + portal
                                                            Paciente lê
                                                            Dúvida via chatbot contextual (4a)
                                                            Cron longitudinal (4b) fecha ciclo
```

Esta sequência é **o DNA do produto**. Preservá-la na migração é mais importante que preservar qualquer tela específica.

---

## 5. Posicionamento competitivo

| | EliaHealth | EHRs genéricos BR (HiDoctor, GestãoDS) | Apps B2C (Flo, Clue) | EHRs US (DigiChart) |
|---|---|---|---|---|
| Prontuário GO profundo | ✅ | parcial | ❌ | ✅ |
| IA clínica integrada | ✅ | ❌ | ❌ | ❌ |
| Portal paciente ativo | ✅ | ❌ | ❌ | parcial |
| Telemedicina integrada | ✅ | parcial | ❌ | ❌ |
| Check-in QR | ✅ | ❌ | ❌ | ❌ |
| LGPD nativo | ✅ | ✅ | ❌ | ❌ HIPAA |
| FHIR/RNDS brasileiro | ✅ | ❌ | ❌ | ❌ |
| Multi-tenancy | ✅ | ❌ | ❌ | ❌ |
| 17 templates USG | ✅ | ❌ | ❌ | ❌ |

**Concorrente indireto que mais preocupa:** o médico abandonar o EHR em favor de Notion/Google Docs + WhatsApp manual + impressora. A UX do EliaHealth precisa ser mais fluida que isso — sempre.

---

## 6. O que o produto NÃO é

- ❌ Marketplace de médicos (Doctoralia). Não tem busca pública.
- ❌ Pronto-socorro virtual (Consulta Particular). Sempre pressupõe vínculo médico-paciente.
- ❌ App de ciclo genérico (Flo, Clue) — isso é o elia·mov (produto irmão B2C).
- ❌ Tele-aborto / tele-emergência.
- ❌ Plataforma de laudos radiológicos gerais — é focada em USG ginecológica/obstétrica + mama + tireoide.
- ❌ Gestor financeiro de clínica (precisa-se ainda de sistema contábil externo). TISS fica; contabilidade não.
