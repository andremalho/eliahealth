# Equipe e Multi-Tenancy

> **Status atual no EliaHealth:** implementado (convite + roles + tenant presets)
> **Prioridade na migração:** crítica (é espinha dorsal de toda autorização e isolamento)
> **Depende de:** autenticação (01); consumido por todos os outros fluxos

---

## 1. Propósito

**Problema que resolve:** Um mesmo software precisa rodar em 3 contextos operacionais muito diferentes (consultório privado, UBS/SUS, hospital-maternidade) sem clone de código. E dentro de cada tenant, existem 7 tipos de usuário com níveis de acesso distintos, além de subgrupos (equipe médica, secretárias vinculadas a médicos específicos, enfermagem por unidade, pesquisadores com dados anonimizados). Sem tenant isolation firme, vazar dados entre clínicas é risco LGPD catastrófico.

**Valor entregue:**
- **7 roles**: `PHYSICIAN`, `ADMIN`, `NURSE`, `PATIENT`, `RESEARCHER`, `RECEPTIONIST`, `SUPERADMIN`.
- **3 presets de tenant**: `consultorio`, `ubs`, `hospital` — cada um pré-configura 16 module flags (pré-natal, gineco, US, puerpério, infertilidade, reprodução assistida, menopausa, clínica geral, internação, evolução, portal, agendamento, pesquisa, teleconsulta, TISS, FHIR/RNDS).
- **Convite de equipe**: médico proprietário (owner) convida membros com role de equipe (`VIEWER`, `EDITOR`, `ADMIN`, `GUEST`) via `team_members (owner_id, member_id, role)`.
- **Compartilhamento de gestação**: `pregnancy_shares` permite compartilhar gestação específica com profissional externo por tempo limitado (VIEW ou EDIT, `expiresAt`).
- Isolamento por tenant em TODAS as queries (`tenantId` no JWT; serviços filtram).
- Admin do tenant configura módulos ativos e políticas de certificado digital via `GET/PATCH /tenants/my/config`.

**Intenção do médico-fundador:** "Eu, médico-dono, decido quem participa do meu time e que papel cada um tem. A enfermeira do meu consultório não tem nada a ver com a enfermeira da UBS vizinha." Ao mesmo tempo, permite que um hospital-universitário ative todos os módulos e uma clínica de alto padrão particular desative TISS para focar só em particular.

---

## 2. Atores e gatilho

| Ator | Papel | Gatilho de entrada |
|---|---|---|
| SUPERADMIN | Cria tenants (provisionamento) | Onboarding de nova clínica |
| ADMIN (tenant) | Configura módulos, provisiona roles, vincula secretárias | Settings → Tenant Config |
| PHYSICIAN (owner) | Convida membros da equipe, compartilha gestações | Teams page |
| PHYSICIAN (member) | Aceita convite, passa a operar sob tenant do owner | Email de convite (TBD) |
| NURSE | Role clínico-operacional; sem acesso a prescrições controladas | Login |
| RECEPTIONIST | Role operacional, dashboard próprio (fluxo 13) | Login |
| RESEARCHER | Acesso ao módulo de pesquisa com dados anonimizados | Login |
| PATIENT | Portal da paciente | OTP WhatsApp/Email |

**Pré-condições:**
- Tenant provisionado via superadmin.
- Owner criado com role PHYSICIAN dentro do tenant.

---

## 3. Dados de entrada

**Tenant (`tenants`):** `id`, `slug`, `name`, `isActive`, etc. (entidade `tenant.entity.ts`).

**Tenant Config (`tenant_configs`):**
- `tenantId` (unique), `name`, `type` (`consultorio|ubs|hospital`), `logoUrl`
- Module flags: `modPrenatal`, `modGynecology`, `modUltrasound`, `modPostpartum`, `modInfertility`, `modAssistedReproduction`, `modMenopause`, `modClinicalGeneral`, `modHospitalization`, `modEvolution`, `modPortal`, `modScheduling`, `modResearch`, `modTelemedicine`, `modTissBilling`, `modFhirRnds`
- Certificado: `certificateValidityDays` (default 365), `certificateRequired` (bool), `certificateProviders` (JSONB array, default `['icp_brasil','bird_id','certisign','valid']`)

**Team Member (`team_members`):** `ownerId`, `memberId`, `role` (VIEWER/EDITOR/ADMIN/GUEST), `specialty?`, `isActive`, `invitedAt`, `acceptedAt?`.

**Pregnancy Share (`pregnancy_shares`):** `pregnancyId`, `sharedBy`, `sharedWith`, `permission` (VIEW/EDIT), `expiresAt?`.

**Guest Share (`guest_shares`):** acesso temporário para profissionais externos (entity existente, consultar `teams/guest-share.entity.ts`).

---

## 4. Fluxo principal (happy path)

1. **Superadmin provisiona tenant** — `POST /tenants` com nome/slug → cria `Tenant` + `TenantConfig` default (consultorio).
2. **Admin define tipo** — `POST /tenants/my/type` body `{ type: 'hospital' }` → `TenantService.setTenantType` aplica preset (Hospital: TUDO; UBS: pré-natal+gineco+clínica+portal+agenda+FHIR; Consultório: pré-natal+gineco+US+puerpério+infertilidade+repro+menopausa+portal+agenda).
3. **Admin ajusta módulos** — `PATCH /tenants/my/config` com subset das flags. Ex.: desativar `modResearch` em consultório, ativar `modTelemedicine` em UBS avançada.
4. **Admin configura certificado** — no mesmo PATCH: `certificateValidityDays=180`, `certificateRequired=true`, `certificateProviders=['icp_brasil','bird_id']`.
5. **Owner convida membro** — Teams page → form (email, role, specialty?) → `POST /teams/members` → `TeamsService.invite`:
   - Cria `team_members` com `ownerId=<currentUser>`, `memberId=<userCreatedOrFound>`, `isActive=true`, `invitedAt=now()`.
   - (GAP) O `memberId` hoje espera usuário já existente; fluxo de email com link pendente.
6. **Member aceita** — (esperado) clica link em email, faz login/registro, `acceptedAt` preenche.
7. **Listagem da equipe** — `GET /teams/members?ownerId=me` → `findTeam` retorna membros ativos com relação `member`.
8. **Atualizar role** — `PATCH /teams/members/:id` → role/specialty/isActive.
9. **Remover membro** — `DELETE /teams/members/:id` → hard delete (GAP — melhor soft via isActive=false).
10. **Compartilhar gestação com profissional externo** — `POST /teams/pregnancy-shares/:pregnancyId` com `{ sharedWith, permission, expiresAt? }` → cria `pregnancy_shares`. Profissional acessa com escopo limitado até `expiresAt`.
11. **Listar shares de uma gestação** — `GET /teams/pregnancy-shares/:pregnancyId` → histórico com `sharedWithUser`.
12. **Revogar share** — `DELETE /teams/pregnancy-shares/:pregnancyId/:shareId`.
13. **Login de member** — quando `member` loga, JWT carrega `tenantId` (copiado do owner / próprio). Guards (`TenantGuard`, `RolesGuard`) aplicam filtro em toda query.
14. **Tenant module gate** — frontend consulta `GET /tenants/my/modules` → esconde itens de menu desativados (ex.: sem `modFhirRnds`, ocultar integração RNDS).

```
  SUPERADMIN ─► POST /tenants ─► Tenant + TenantConfig (preset consultorio)
                                          │
  ADMIN ─► POST /tenants/my/type ────► aplica preset por enum
  ADMIN ─► PATCH /tenants/my/config ─► toggle 16 module flags + cert config
       │
       ▼
  PHYSICIAN (owner) ─► POST /teams/members ─► team_members (role, specialty)
                    └─► POST /teams/pregnancy-shares/:id ─► pregnancy_shares
```

---

## 5. Fluxos alternativos / exceções

| Cenário | O que acontece |
|---|---|
| Admin desativa módulo ativo | Frontend esconde; backend endpoints continuam respondendo (GAP, deveria 403). |
| Tenant `default` (sem UUID) | Alguns endpoints usam `tenantId ?? 'default'` como fallback — comportamento legado para dev. |
| Membro convidado não existe como User | `invite()` falha de FK — não há criação automática de conta (GAP). |
| Membro com role `VIEWER` tenta editar prontuário | RolesGuard (do AUTH) recusa 403 em endpoints de write. |
| Removido `team_members` mas pregnancy_shares ainda ativas | Continuam válidas até `expiresAt`. Intencional. |
| Share sem `expiresAt` | Permanente até revogação manual. |
| Superadmin acessa dados cross-tenant | Permitido por design (suporte). |
| Patient role tenta acessar qualquer endpoint que não seja portal | 403. |
| Receptionist tenta ver pregnancy de outro médico | Filtro por `getDoctorIdsForSecretary` (ver fluxo 13). |
| Mesmo email tenta ser member de 2 owners | Permitido — `team_members` tem (owner_id, member_id) unique? Precisa verificar índice. Há casos reais: enfermeira trabalha em 2 consultórios. |
| `certificate_providers` vazio | Sistema rejeita todo certificado? Deveria validar array não-vazio. |

---

## 6. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RB-01 | 7 roles de usuário | `auth.enums.ts:1-9` |
| RB-02 | Role default em registro: PHYSICIAN | `user.entity.ts:24` |
| RB-03 | SUPERADMIN pode criar/listar/editar/excluir tenants | `tenant.controller.ts:15-31` |
| RB-04 | ADMIN (tenant) pode PATCH sua própria config | `tenant.controller.ts:51-55` |
| RB-05 | PHYSICIAN + ADMIN podem GET sua config e módulos | `tenant.controller.ts:39-49` |
| RB-06 | 3 tipos de tenant: `consultorio`, `ubs`, `hospital` | `tenant-config.entity.ts:3-7` |
| RB-07 | 16 module flags disponíveis | `tenant-config.entity.ts:27-42` |
| RB-08 | Preset Consultorio: pré-natal, gineco, US, puerpério, infertilidade, repro, menopausa, portal, agenda | `tenant-config.entity.ts:60-64` |
| RB-09 | Preset UBS: pré-natal, gineco, clínica geral, portal, agenda, FHIR/RNDS | `tenant-config.entity.ts:65-68` |
| RB-10 | Preset Hospital: todos anteriores + hospitalização, evolução, pesquisa, TISS, FHIR/RNDS, teleconsulta | `tenant-config.entity.ts:69-74` |
| RB-11 | Certificate validity default: 365 dias | `tenant-config.entity.ts:45` |
| RB-12 | Certificate providers default: `['icp_brasil','bird_id','certisign','valid']` | `tenant-config.entity.ts:51` |
| RB-13 | Team roles: VIEWER, EDITOR, ADMIN, GUEST | `teams.enums.ts:1` |
| RB-14 | Team member: `ownerId` + `memberId` relação direcionada | `team-member.entity.ts:13-25` |
| RB-15 | Pregnancy share permissions: VIEW, EDIT | `teams.enums.ts:2` |
| RB-16 | Pregnancy share `expiresAt` opcional (null = permanente) | `teams.service.ts:47-56` |
| RB-17 | Isolamento de tenant: TODOS os services aceitam `tenantId` e filtram | convenção — exemplos: patients, appointments, consultation-summaries |
| RB-18 | `TenantGuard` aplicado globalmente | `tenant/tenant.guard.ts` |
| RB-19 | Auditoria global via interceptor | `audit/` |
| RB-20 | Criptografia de campos sensíveis: AES-256-GCM (módulo `security`) | prompt-memorando-projeto.md:216 |

---

## 7. Saídas e efeitos

- **Cria/altera:** `tenants`, `tenant_configs`, `team_members`, `pregnancy_shares`, `guest_shares`, `users` (quando novo member é provisionado).
- **Notificações disparadas:** convite por email (esperado, fluxo pendente no código).
- **Integrações acionadas:** SMTP para convites.
- **Eventos emitidos:** nenhum hoje; ideal emitir `tenant.module_changed`, `team.member_added`, `pregnancy.shared` para auditoria e consumidores.

---

## 8. Integrações externas

| Serviço | Quando | Payload | Falha graciosa? |
|---|---|---|---|
| SMTP | Convite (a implementar) | email do convite | — |
| FHIR/RNDS | Quando `modFhirRnds=true` | Certificado `.pfx` via env | Flag desliga tudo |
| Memed | Prescrições (fora desse fluxo, mas módulo também ativado por tenant) | — | — |
| Daily.co | `modTelemedicine=true` | API key | — |

---

## 9. Critérios de aceitação

- [ ] Dado superadmin quando `POST /tenants` com slug `acme` então tenant criado + config default.
- [ ] Dado admin quando `POST /tenants/my/type {type:'hospital'}` então `modHospitalization=true`, `modEvolution=true`, `modTissBilling=true`.
- [ ] Dado admin quando `PATCH /tenants/my/config {modResearch:false}` então reseach module flag muda e menu lateral remove link.
- [ ] Dado médico A do tenant X quando busca `/patients` então não vê pacientes do tenant Y.
- [ ] Dado owner M quando `POST /teams/members {memberId, role:'EDITOR'}` então `team_members` criado com `isActive=true`.
- [ ] Dado `pregnancy_shares` com `expiresAt=ontem` então sharedWith não tem mais acesso (backend checa).
- [ ] Dado config `certificateRequired=true` e login sem cert então backend recusa (a implementar, hoje é opt-in por fluxo).
- [ ] Dado preset `ubs` então `modTelemedicine=false` por default (não listado).

---

## 10. Métricas de sucesso

- **Cross-tenant leakage:** 0 incidentes. Audit periódico.
- **Tempo médio para admin configurar novo tenant:** meta <10min.
- **% tenants usando preset sem modificação:** alto = bom (ajuste preset). Meta 60%.
- **Convites aceitos / enviados (uma vez implementado email):** meta >80% em 7d.
- **Pregnancy shares ativos que expiraram sem revogação manual:** indicador de higiene; meta >90% cleanup automático.

---

## 11. Melhorias recomendadas na migração

- **Convite por email ausente.** Implementar `InvitationsService` com link assinado (JWT curto), página `/invite/:token` que cria conta/linka user, email estilo "Dr. X te convidou para a equipe".
- **Member precisa existir antes do convite.** Permitir convite por email mesmo sem conta (cria user `isActive=false` com placeholder, ativa no accept).
- **Hard delete de team member.** Soft delete (`isActive=false`) para auditoria.
- **Sem endpoint `PATCH /team-members/:id/accept`.** Adicionar para fluxo explícito de aceite com `acceptedAt`.
- **TenantGuard não bloqueia requests quando módulo está off.** Ex.: `modResearch=false` mas `/research/dashboard` ainda responde. Criar `@RequireModule('research')` decorator + guard.
- **Presets binários.** Tenant pode querer `ubs + teleconsulta` sem ser hospital. Permitir preset + diff.
- **Falta "tenant.timezone".** Cron 08:00 (fluxo 11) roda em UTC-3 ou UTC-4 aleatório. Adicionar `tenant.timezone`.
- **Falta "tenant.working_hours".** Recepção tenta agendar fora do expediente.
- **Role matrix não documentada.** Criar `/docs/ROLES.md` com matriz endpoint × role.
- **`specialty` apenas em team_members.** Deveria estar em `users` também (fonte da verdade).
- **Pregnancy share sem relacionar a tenant.** Se médico externo compartilhado está em outro tenant, audit fica complicada. Adicionar `origin_tenant_id` no share.
- **Guest share e pregnancy share duplicam conceito.** Consolidar em um `access_grants` polimórfico.
- **Secretária vincula via módulo appointments, não módulo teams.** Deveria ser no mesmo modelo. Mover `SecretaryAssignment` para teams/.
- **Sem limite de membros por plano.** Plano comercial "pro" pode exigir ≤5 membros; hoje nada enforced.
- **Config do tenant é objeto plano.** 16 flags + cert dentro de `tenant_configs` vira monolítica. Separar em `modules`, `security`, `branding` como relações 1:1.
- **Interpolação de tenantId por string em outras queries.** Pelo menos copilot-dashboard já tem esse padrão — auditar.
- **RESEARCHER role sem isolamento claro.** Módulo pesquisa usa dados anonimizados — mas quem garante que não cruza CPFs? Auditar `research` service.
- **SUPERADMIN role sem 2FA forçado.** Operacional + risco. Adicionar TOTP obrigatório quando role=SUPERADMIN.
- **Mudança de role em tempo real.** Se admin rebaixa ADMIN→VIEWER, JWT atual mantém permissões até expirar (8h). Considerar revogar tokens na mudança de role.

---

## 12. Referências no código atual (para quem for reimplementar)

- Backend (tenant):
  - `backend/src/tenant/tenant.entity.ts`
  - `backend/src/tenant/tenant-config.entity.ts` (78 linhas — 16 module flags, 3 presets, cert config)
  - `backend/src/tenant/tenant.service.ts` (getConfig, updateConfig, setTenantType, getActiveModules, findBySlug)
  - `backend/src/tenant/tenant.controller.ts` (endpoints `/tenants`, `/tenants/my/*`)
  - `backend/src/tenant/tenant.guard.ts` (isolamento global)
  - `backend/src/tenant/tenant.module.ts`
- Backend (teams):
  - `backend/src/teams/team-member.entity.ts`
  - `backend/src/teams/pregnancy-share.entity.ts`
  - `backend/src/teams/guest-share.entity.ts`
  - `backend/src/teams/teams.service.ts` (invite, findTeam, update, share, revoke)
  - `backend/src/teams/teams.controller.ts`
  - `backend/src/teams/teams.enums.ts` (TeamRole, SharePermission)
  - `backend/src/teams/dto/invite-member.dto.ts`, `update-member.dto.ts`, `share-pregnancy.dto.ts`
- Backend (auth):
  - `backend/src/auth/auth.enums.ts` (UserRole)
  - `backend/src/auth/guards/roles.guard.ts`, `jwt-auth.guard.ts`
  - `backend/src/auth/decorators/roles.decorator.ts`
- Backend (audit/security):
  - `backend/src/audit/audit.module.ts` (interceptor global)
  - `backend/src/security/` (AES-256-GCM)
- Frontend:
  - `frontend/src/pages/teams/TeamsPage.tsx`
  - `frontend/src/pages/settings/SettingsPage.tsx` (tenant config)
  - `frontend/src/store/auth.store.ts` (role + tenantId persistidos)
  - `frontend/src/api/teams.api.ts` (inferir)
  - `frontend/src/api/tenant.api.ts` (inferir)
- Migrations: `AddTenants`, `AddTenantConfig`, `AddModuleFlags`, `AddCertificateProviders`, `AddTeamMembers`, `AddPregnancyShares`, `AddGuestShares`.
