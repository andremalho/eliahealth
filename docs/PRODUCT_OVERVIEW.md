# EliaHealth

## Prontuário Exclusivo da Mulher

---

### O que é o EliaHealth?

O EliaHealth é uma plataforma de saúde digital especializada em **ginecologia e obstetrícia**, construída para transformar a forma como médicos atendem e pacientes vivenciam o cuidado com a saúde feminina.

É o único sistema no Brasil que unifica **prontuário eletrônico especializado**, **inteligência artificial clínica**, **portal da paciente** e **telemedicina** em uma única plataforma — com conformidade LGPD nativa.

---

### Para quem?

**Médicos e clínicas** que precisam de um prontuário que entende obstetrícia e ginecologia — não um sistema genérico adaptado.

**Hospitais e maternidades** que precisam de interoperabilidade com sistemas existentes e módulos de internação com evolução.

**UBS e atenção primária** que precisam de pré-natal inteligente com alertas de risco e referenciamento.

**Pacientes** que querem acesso aos seus dados, agendamento online e comunicação direta com seu médico.

---

### Módulos Principais

#### Prontuário Obstétrico
Acompanhamento pré-natal completo com calculadora gestacional, flowsheet de consultas, monitoramento de PA e glicemia, alertas automáticos (pré-eclâmpsia, HELLP, DMG), curvas de crescimento fetal e protocolos por trimestre baseados em FEBRASGO e ACOG.

#### Prontuário Ginecológico
Sete submódulos especializados: consulta ginecológica, ciclo menstrual/SUA (PALM-COEIN), contracepção (WHO MEC), infertilidade, reprodução assistida (OI/IIU/FIV), menopausa (STRAW+10, MRS) e rastreios preventivos por fase de vida.

#### Laudos de Ultrassonografia
17 modelos de laudo estruturado baseados em ISUOG, ACR e ACOG — do obstétrico inicial à ecocardiografia fetal, pélvico transvaginal, endometriose, mamas (BI-RADS), tireoide (TI-RADS). Formulário dinâmico, assinatura digital, exportação PDF com imagens em layout A4, envio por WhatsApp e email.

#### IA Clínica (Copiloto Elia)
Inteligência artificial integrada ao prontuário que analisa riscos, detecta padrões, sugere condutas baseadas em guidelines internacionais, extrai dados de documentos (laboratório e USG) automaticamente e responde perguntas em linguagem natural sobre os dados clínicos.

#### Cálculo de Risco FMF
Rastreamento de trissomias (teste combinado) e pré-eclâmpsia (algoritmo multiparamétrico) integrado ao morfológico de primeiro trimestre, com factores maternos, bioquímicos e ultrassonográficos.

#### Telemedicina
Videoconsulta integrada ao prontuário via Daily.co — com sala privada, tokens separados para médico e paciente, painel de anotações durante a chamada, e registro automático no prontuário.

#### Portal da Paciente
Acesso seguro via OTP (código por email/WhatsApp), dashboard com dados da gestação, monitoramento de PA e glicemia, upload de exames com extração por IA, agendamento self-service com documentação (CPF, CEP, convênio), check-in QR code sem recepção, e conteúdo educativo personalizado por idade gestacional.

#### Agendamento Inteligente
Grade horária do médico com slots automáticos, agendamento recorrente pré-natal (protocolo ACOG), auto-agendamento pela paciente via portal, lembretes automáticos 48h e 24h antes (WhatsApp + email), check-in QR code na unidade, e esquema de cores por categoria (1ª consulta, retorno, particular, convênio, urgência, encaixe).

#### Modo Secretária
Dashboard operacional com abas Gestantes/Ginecologia, vínculo secretária-médico (N:N), agendamento com documentação e convênio, calendário de partos e procedimentos, sem acesso a dados clínicos.

#### Hospitalização
Admissão, evolução diária (médica, enfermagem, puerperal, cirúrgica), alta com resumo e instruções, alertas automáticos (PA, febre, hipoxemia, oligúria).

#### Chat Médico-Paciente
Mensagens assíncronas entre médico e paciente, tracking de leitura, suporte a anexos, integrado ao portal.

#### Faturamento TISS
Guias (SADT, consulta, internação, honorários), procedimentos TUSS, workflow draft→enviada→aprovada/glosada→paga, dashboard financeiro.

#### Dashboard de Pesquisa
Indicadores populacionais e clínico-operacionais com dados 100% anonimizados (LGPD), gráficos interativos, 5 abas (visão geral, obstétrica, ginecológica, clínica, populacional), campo de perguntas em linguagem natural com IA, e exportação.

---

### Diferenciais Competitivos

| | EliaHealth | EHRs genéricos (HiDoctor, GestãoDS) | Apps B2C (Flo, Clue) | EHRs americanos (DigiChart) |
|---|---|---|---|---|
| Prontuário GO profundo | ✅ | Parcial | ❌ | ✅ |
| IA clínica integrada | ✅ | ❌ | ❌ | ❌ |
| Portal do paciente ativo | ✅ | ❌ | ❌ | Parcial |
| Telemedicina | ✅ | Parcial | ❌ | ❌ |
| Check-in QR code | ✅ | ❌ | ❌ | ❌ |
| LGPD nativo | ✅ | ✅ | ❌ | ❌ (HIPAA) |
| FHIR/RNDS brasileiro | ✅ | ❌ | ❌ | ❌ |
| Multi-tenancy | ✅ | ❌ | ❌ | ❌ |
| 17 templates de laudo USG | ✅ | ❌ | ❌ | ❌ |

---

### Multi-Tenancy: Um Produto, Três Configurações

| Consultório | UBS | Hospital |
|---|---|---|
| Pré-natal completo | Pré-natal + clínica geral | Todos os módulos |
| Ginecologia (7 módulos) | Portal + agendamento | Internação + evolução |
| Laudos USG | FHIR/RNDS | Faturamento TISS |
| Portal + agendamento | | Telemedicina + pesquisa |

A configuração é automática — basta selecionar o tipo de unidade e os módulos se ajustam.

---

### Segurança e Compliance

- **LGPD** nativa: consentimento explícito, anonimização de dados de pesquisa, auditoria completa
- **Autenticação** JWT com roles (médico, enfermeiro, secretária, paciente, admin)
- **Rate limiting** para proteção contra brute force
- **Assinatura digital** SHA256 em laudos
- **Dados encriptados** em trânsito (TLS)
- **Interoperabilidade** FHIR R4, HL7, CDA com perfis RNDS brasileiros

---

### Tecnologia

Construído com tecnologias modernas e de alto desempenho:

- **React 19** com TypeScript strict — frontend rápido e tipado
- **NestJS 11** — backend modular e escalável
- **PostgreSQL 16** — banco relacional robusto
- **Claude API** (Anthropic) — IA clínica de última geração
- **Daily.co** — videoconsulta enterprise-grade
- **PWA** — instalável no celular como app nativo

---

### Números do Produto

- **57 módulos** backend
- **70+ tabelas** no banco de dados
- **17 templates** de laudo de ultrassonografia
- **15 componentes** UI reutilizáveis
- **24 páginas** no frontend
- **7 roles** de utilizador
- **200+** endpoints de API
- **Swagger** documentação automática

---

### Próximos Passos

1. **Beta com 50 médicos** — validar product-market fit
2. **EliaMov** — módulo fitness/bem-estar por fase hormonal
3. **Integração com wearables** — Apple Watch, Oura Ring
4. **App nativo** — React Native para iOS e Android
5. **Comunidade de pacientes** — fórum moderado por especialistas
6. **Expansão LATAM** — versão em espanhol

---

### Contato

**EliaHealth** — Prontuário exclusivo da mulher

*Transformando a saúde feminina com tecnologia e inteligência artificial.*

---

*Abril 2026*
