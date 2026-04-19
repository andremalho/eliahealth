# PRD — EliaHealth

> **Product Requirements Document** completo do EliaHealth (prontuário eletrônico ginecológico/obstétrico brasileiro).
> Extraído da main atual (`b31f3e0`) por varredura de código + docs existentes.
> **Objetivo:** servir de handoff para reimplementação do produto-sucessor, carregando todos os fluxos, regras clínicas, integrações e intenção original com UX redesenhada.

---

## Como usar este PRD

1. **Para entender o produto rapidamente:** leia `01-vision-and-personas.md`.
2. **Para reimplementar um fluxo específico:** vá direto em `02-flows/NN-xxx.md`. Cada arquivo é autocontido — propósito, atores, passos, regras, integrações, critérios de aceitação e melhorias recomendadas.
3. **Para auditar regras clínicas:** `03-business-rules.md` tem 130+ regras codificadas com threshold, ação e fonte (guideline + linha do código).
4. **Para garantir requisitos não-funcionais:** `04-cross-cutting-requirements.md` cobre LGPD, RBAC, multi-tenant, segurança, i18n, interoperabilidade, PWA.
5. **Para priorizar o roadmap de migração:** `05-ux-improvements.md` consolida gaps, bugs latentes, integrações falsas e oportunidades de UX superior.
6. **Para traduzir jargão:** `06-glossary.md` tem todos os termos clínicos, de USG, FMF, TRA e brasileiros (TISS/TUSS/ICP/RNDS).

### Anatomia de cada arquivo de fluxo

Todo arquivo em `02-flows/` segue o template em `_TEMPLATE_FLOW.md`:

1. Propósito · 2. Atores e gatilho · 3. Dados de entrada · 4. Fluxo principal · 5. Exceções · 6. Regras de negócio · 7. Saídas e efeitos · 8. Integrações externas · 9. Critérios de aceitação · 10. Métricas · 11. Melhorias recomendadas · 12. Referências no código atual

**Campos críticos para migração:** §6 (regras), §8 (integrações), §9 (aceitação), §11 (melhorias).

---

## Índice

### Espinha dorsal
- [`01-vision-and-personas.md`](./01-vision-and-personas.md) — proposta de valor, 7 personas, jobs-to-be-done
- [`03-business-rules.md`](./03-business-rules.md) — catálogo de regras clínicas (FEBRASGO/ACOG/WHO-MEC/NICE/FIGO/FMF/ISUOG/BI-RADS/TI-RADS/STRAW+10)
- [`04-cross-cutting-requirements.md`](./04-cross-cutting-requirements.md) — LGPD, RBAC, multi-tenant, segurança, performance, acessibilidade, i18n, PWA
- [`05-ux-improvements.md`](./05-ux-improvements.md) — gaps, bugs latentes, integrações falsas, oportunidades de UX
- [`06-glossary.md`](./06-glossary.md) — glossário clínico + produto

### Fluxos funcionais

**Core & identidade**
- [`02-flows/01-auth-and-onboarding.md`](./02-flows/01-auth-and-onboarding.md) — login (senha + ICP-Brasil), registro, onboarding guiado
- [`02-flows/02-clinical-dashboard.md`](./02-flows/02-clinical-dashboard.md) — tela-mãe do médico (7 queries paralelas, refresh 60s)
- [`02-flows/03-patient-registry.md`](./02-flows/03-patient-registry.md) — cadastro + fase-de-vida + LGPD

**Clínicos — Obstetrícia**
- [`02-flows/04-prenatal.md`](./02-flows/04-prenatal.md) — gestação, SOAP, alertas pré-eclâmpsia/HELLP/DMG, curvas fetais
- [`02-flows/05-postpartum.md`](./02-flows/05-postpartum.md) — puerpério + EPDS + lóquios + involução
- [`02-flows/08-hospitalization.md`](./02-flows/08-hospitalization.md) — admissão, evolução diária, alta

**Clínicos — Ginecologia**
- [`02-flows/06-gynecology.md`](./02-flows/06-gynecology.md) — raiz + 7 sub-fluxos (SUA/contracepção/infertilidade/TRA/menopausa/rastreio/consulta)

**Clínicos — Procedimentos**
- [`02-flows/07-ultrasound-report.md`](./02-flows/07-ultrasound-report.md) — 17 templates USG (ISUOG/ACR/BI-RADS/TI-RADS)
- [`02-flows/09-prescription-and-memed.md`](./02-flows/09-prescription-and-memed.md) — prescrever + assinar + enviar
- [`02-flows/10-labs-and-exams.md`](./02-flows/10-labs-and-exams.md) — solicitação, extração IA, alertas

**Agenda & recepção**
- [`02-flows/11-scheduling.md`](./02-flows/11-scheduling.md) — grade, auto-schedule pré-natal, lembretes 48/24h
- [`02-flows/12-check-in-qr.md`](./02-flows/12-check-in-qr.md) — paciente escaneia QR, dispensa recepção
- [`02-flows/13-reception-mode.md`](./02-flows/13-reception-mode.md) — secretária sem dados clínicos

**Telemedicina & paciente**
- [`02-flows/14-telemedicine.md`](./02-flows/14-telemedicine.md) — Daily.co + tokens separados + anotações
- [`02-flows/15-patient-portal.md`](./02-flows/15-patient-portal.md) — OTP, dashboard, 12 seções
- [`02-flows/17-content-education.md`](./02-flows/17-content-education.md) — conteúdo por IG

**IA**
- [`02-flows/16-ai-copilot.md`](./02-flows/16-ai-copilot.md) ★ — 5 fases (resumo / checklist / realtime WS / chatbot WhatsApp / longitudinal)

**Gestão & compliance**
- [`02-flows/18-billing-tiss.md`](./02-flows/18-billing-tiss.md) — guias SADT/consulta/internação, TUSS, glosas
- [`02-flows/19-research-analytics.md`](./02-flows/19-research-analytics.md) — 5 abas + query natural em PT
- [`02-flows/20-team-and-multi-tenant.md`](./02-flows/20-team-and-multi-tenant.md) — 7 roles × 3 presets × 16 flags

---

## Legenda

Cabeçalho de cada fluxo indica:

- **Status atual no EliaHealth:** `implementado` / `parcial` / `planejado`
- **Prioridade na migração:** `crítica` / `alta` / `média` / `baixa`
- **Depende de:** outros fluxos pré-requisito

**IDs de regras** em `03-business-rules.md` seguem `BR-<DOMÍNIO>-<NN>`:
`PN` (pré-natal) · `PP` (pós-parto) · `HELLP` · `GLI` (glicemia) · `PA` · `USG` · `FMF` · `SWAB` · `VAC` · `HOSP` · `GIN` · `SUA` · `FERT` · `MEN` · `PREV`.

---

## Estatísticas

- **23 documentos** (20 fluxos + 3 transversais + glossário + README + visão)
- **~6.6k linhas** de especificação executável
- **130+ regras de negócio** catalogadas
- **200+ endpoints** referenciados com propósito
- **17 templates USG** documentados
- **5 fases de IA** detalhadas ponta-a-ponta
- **7 roles × 3 presets × 16 flags** mapeados

---

## Referência histórica

Documentos originais do EliaHealth (mantidos como apêndice):

- [`../PRODUCT_OVERVIEW.md`](../PRODUCT_OVERVIEW.md) — posicionamento de marketing
- [`../prompt-memorando-projeto.md`](../prompt-memorando-projeto.md) — briefing técnico profundo
- [`../TECHNICAL_SPEC.md`](../TECHNICAL_SPEC.md) — arquitetura técnica

Este PRD é a **fonte-da-verdade funcional**. Os docs originais ficam como arqueologia.

---

*Gerado em 2026-04-18 via varredura da main `b31f3e0` (pré-Lunar-Bloom). Owner: Luan (@locdesenvolvimento).*
