# [Nome do fluxo]

> **Status atual no EliaHealth:** [implementado / parcial / planejado]
> **Prioridade na migração:** [crítica / alta / média / baixa]
> **Depende de:** [outros fluxos que precisam existir antes]

---

## 1. Propósito

**Problema que resolve:** [qual dor do usuário elimina]

**Valor entregue:** [o que a pessoa ganha ao usar]

**Intenção do médico-fundador:** [a razão original — extraída do código/docs]

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| … | … | … |

**Pré-condições:**
- …

---

## 3. Dados de entrada

Campos conceituais que alimentam o fluxo (sem schema de banco):

| Campo | Tipo | Origem | Obrigatório? |
|---|---|---|---|
| … | … | … | … |

---

## 4. Fluxo principal (happy path)

1. **[Passo]** — [descrição + ator responsável + tela/contexto]
2. **[Passo]** — …
3. …

```
[Diagrama ASCII simples do fluxo quando ajudar]
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| … | … |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | … | [guideline / decisão de produto / linha do código] |
| RB-02 | … | … |

---

## 7. Saídas e efeitos

- **Cria/altera:** [entidades ou estados]
- **Notificações disparadas:** [WhatsApp/email/push/in-app]
- **Integrações acionadas:** [Claude/Daily/Memed/RNDS/etc.]
- **Eventos emitidos:** [WS/cron]

---

## 8. Integrações externas

| Serviço | Quando é chamado | Payload essencial | Falha graciosa? |
|---|---|---|---|
| … | … | … | … |

---

## 9. Critérios de aceitação

- [ ] Dado … quando … então …
- [ ] …

---

## 10. Métricas de sucesso

- **[KPI]:** como medir + meta de partida

---

## 11. Melhorias recomendadas na migração

- **[Oportunidade]** — [diagnóstico do problema atual + recomendação]

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend: `backend/src/[módulo]/...`
- Frontend: `frontend/src/pages/[página]/...`
- Migrations relevantes: `...`
