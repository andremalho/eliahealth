# Glossário — EliaHealth

> Vocabulário do domínio (clínico + técnico-brasileiro + produto). Ordenado alfabeticamente pela sigla/termo. Definições curtas (1–3 linhas) com foco prático para quem vai reimplementar o sistema.

---

## A

- **AAS** — Ácido acetilsalicílico em baixa dose (100–150 mg/dia). Profilaxia de pré-eclâmpsia em pacientes de alto risco, iniciada entre 12–16 sem até 36 sem (ASPRE/FIGO).
- **ABAC** — Attribute-Based Access Control. Complementa RBAC usando atributos do usuário/recurso (ex.: médico só edita consultas dele).
- **ACOG** — American College of Obstetricians and Gynecologists. Principal sociedade americana de GO; guidelines citadas em "Practice Bulletins".
- **ACR** — American College of Radiology. Mantém BI-RADS e TI-RADS.
- **AFC (CFA)** — Antral Follicle Count / Contagem de Folículos Antrais. Marcador de reserva ovariana; < 5 é baixo.
- **AMH** — Hormônio Anti-Mülleriano. Marcador de reserva ovariana: < 0.5 ng/mL muito baixo; < 1.1 baixo.
- **anti-RhD (Rhogam)** — Imunoglobulina anti-D. Profilaxia em gestante Rh- com Coombs indireto negativo. Dose 300 mcg IM entre 28–34 sem; repetir pós-parto se RN Rh+.
- **AnyRole** — No RBAC do EliaHealth, qualquer das 7 roles do sistema.
- **Apgar** — Score de vitalidade do recém-nascido (0–10) avaliado no 1º e 5º minutos. Aparência, Pulso, Gesticulação, Atividade, Respiração.
- **ASC-US/ASC-H/LSIL/HSIL** — Classificação de Bethesda para citologia oncótica cervical. Todos demandam encaminhamento para colposcopia.
- **AU (altura uterina)** — Medida do fundo uterino à sínfise púbica em cm; aproxima IG em semanas a partir da 20ª.

## B

- **β-hCG livre** — Fração livre da gonadotrofina coriônica humana; marcador bioquímico no rastreio combinado T21 (expresso em MoM).
- **BCF** — Batimentos Cardíacos Fetais (bpm). Normal 110–160. Ausente = emergência; taquicardia/bradicardia = investigar.
- **BI-RADS 0–6** — Breast Imaging Reporting and Data System (ACR 5ª ed.). 0=incompleto, 1=negativo, 2=benigno, 3=provavelmente benigno (controle 6 meses), 4A/4B/4C=suspeita crescente, 5=altamente suspeito, 6=malignidade conhecida.
- **Bird ID** — Provedor brasileiro de certificação digital ICP-Brasil; usado para assinatura de prescrições.
- **Bishop (escore)** — Escore cervical para avaliar maturidade ao parto (dilatação, apagamento, consistência, posição, altura).

## C

- **Cariótipo** — Estudo cromossômico; indicado em amenorreia primária e abortamentos recorrentes.
- **CDA R2** — Clinical Document Architecture release 2, padrão HL7 para documentos clínicos estruturados.
- **Certisign** — Autoridade Certificadora ICP-Brasil.
- **CEP** — Código de Endereçamento Postal brasileiro. No EliaHealth guardamos só 5 dígitos em pesquisa.
- **CFA** — ver AFC.
- **CFM** — Conselho Federal de Medicina. Regula retenção de prontuário (20 anos).
- **CID-10** — Classificação Internacional de Doenças (OMS), décima edição. Usado em diagnósticos.
- **CNES** — Cadastro Nacional de Estabelecimentos de Saúde. Módulo de integração no backend.
- **COEIN** — parte não estrutural do PALM-COEIN: Coagulopatia, Ovulatória, Endometrial, Iatrogênica, Não classificada (FIGO 2011).
- **Coombs indireto** — Pesquisa de anticorpos maternos anti-RhD. Base para indicar profilaxia anti-D.
- **Copiloto (Elia)** — IA clínica do EliaHealth (Claude Sonnet 4). Checklist pós-consulta + insights em tempo real + chatbot.
- **CSP** — Content Security Policy. Header HTTP de segurança.
- **CTG** — Cardiotocografia fetal.

## D

- **Daily.co** — Provedor de videoconsulta integrado via SDK.
- **DEXA** — Densitometria óssea por absorciometria de raios-X. Fornece T-score para classificação de osteopenia/osteoporose.
- **DFI** — DNA Fragmentation Index (sêmen). > 30% sugere indicação de ICSI.
- **dTpa** — Vacina difteria/tétano/pertussis acelular. Recomendada 20–36 sem (protege RN de coqueluche).
- **DHL / LDH** — Desidrogenase láctica. Elevada (> 600 U/L) em hemólise; marcador HELLP.
- **DMG** — Diabetes Mellitus Gestacional. Diagnóstico por TOTG 75g: jejum ≥ 92, 1h ≥ 180, 2h ≥ 153 mg/dL.
- **Doppler cerebral médio (ACM)** — Usado em RCF e isoimunização; PSV elevada prediz anemia fetal.
- **Doppler umbilical** — Avalia resistência placentária; onda A reversa = grave.
- **DPP (EDD)** — Data Provável do Parto (Estimated Delivery Date). Calculada a partir da DUM (regra de Naegele) ou USG 1T.
- **DPNI** — Diagnóstico Pré-Natal Não Invasivo (NIPT). Teste de DNA fetal livre em sangue materno; indicado em intermediário/alto risco T21.
- **DPO** — Data Protection Officer (LGPD).
- **Ducto venoso (DV)** — Parâmetro USG 1T; onda A revertida → LR 3.2 para T21.
- **DUM** — Data da Última Menstruação. Base para cálculo de IG quando ciclos regulares.

## E

- **E2 (estradiol)** — Principal estrogênio; dosado em investigação hormonal/TRA.
- **Eclâmpsia** — Convulsão em contexto de pré-eclâmpsia; emergência.
- **Ecodoppler / Ecocardiografia fetal** — USG avaliando função cardíaca e grandes vasos do feto.
- **EDD** — ver DPP.
- **Endometriose** — Foco de tecido endometrial fora do útero; template de laudo USG dedicado.
- **EPDS** — Edinburgh Postnatal Depression Scale. Score ≥ 10 = acompanhamento; ≥ 13 = risco elevado.
- **Esquizócitos** — Hemácias fragmentadas; marcador de microangiopatia / HELLP.

## F

- **FEBRASGO** — Federação Brasileira das Associações de Ginecologia e Obstetrícia. Guideline nacional prioritário.
- **FHIR** — Fast Healthcare Interoperability Resources (HL7). EliaHealth usa R4 com perfis RNDS.
- **FIGO** — Fédération Internationale de Gynécologie et d'Obstétrique. Classificação PALM-COEIN é FIGO 2011/2018.
- **FIV** — Fertilização In Vitro (IVF). Tipo de TRA.
- **Flowsheet** — Tabela longitudinal de dados clínicos (consultas de pré-natal lado a lado).
- **FMF** — Fetal Medicine Foundation. Origem dos algoritmos de rastreio combinado T21 e PE multiparamétrico.
- **Framingham** — Score de risco cardiovascular.
- **FRAX** — Fracture Risk Assessment Tool (IOF/OMS). Probabilidade de fratura maior em 10 anos.
- **FSH** — Hormônio Folículo Estimulante. > 10 mUI/mL basal sugere reserva ovariana reduzida.

## G

- **GAD-2** — Rastreio de ansiedade (2 perguntas). Score ≥ 3 positivo.
- **GBS** — Group B Streptococcus (Streptococcus agalactiae). Rastreio 35–37 sem; positivo → profilaxia intraparto.
- **Glosa** — Rejeição total ou parcial de uma guia pelo convênio; valor não pago + razão.
- **GSM** — Síndrome Geniturinária da Menopausa. Atrofia vulvovaginal, dispareunia, sintomas urinários.

## H

- **HELLP** — Hemolysis, Elevated Liver enzymes, Low Platelets. Forma grave de pré-eclâmpsia.
- **Helmet.js** — Middleware de headers de segurança HTTP.
- **HL7 v2** — Padrão legado de mensageria em saúde; ainda usado em hospitais.
- **HMAC-SHA256** — Hash autenticado; validação do webhook WhatsApp.
- **HOMA-IR** — Homeostatic Model Assessment for Insulin Resistance. > 2.7 = resistência insulínica.
- **HPV** — Human Papillomavirus. Rastreio por PCR alto risco ou citologia; vacina até 45 anos.
- **HSG** — Histerossalpingografia. Avalia permeabilidade tubária.
- **HSN** — Histerossonografia. USG com contraste salino para cavidade/tubas.

## I

- **ICP-Brasil** — Infraestrutura de Chaves Públicas brasileira; base legal para assinatura digital (Lei 14.063/2020).
- **ICSI** — Injeção Intracitoplasmática de Espermatozoides. Indicada em fator masculino grave.
- **IG** — Idade Gestacional (semanas+dias). Calculada a partir da DUM ou USG 1T.
- **IIU** — Inseminação Intrauterina (IUI). Técnica de TRA de baixa complexidade.
- **IMC (BMI)** — Índice de Massa Corporal. <18.5 baixo peso, 25–30 sobrepeso, ≥30 obesidade.
- **Involução uterina** — Retorno do útero ao tamanho pré-gestacional no puerpério; subinvolução = risco.
- **ISUOG** — International Society of Ultrasound in Obstetrics and Gynecology.

## J

- **JWT** — JSON Web Token. Access 8h + refresh 7d rotativo no EliaHealth.

## K

- **Kruger (morfologia estrita)** — Critério morfológico de espermograma. < 4% = teratozoospermia.
- **Kupperman** — Escala alternativa à MRS para sintomas climatéricos.

## L

- **LGPD** — Lei Geral de Proteção de Dados (Lei 13.709/2018).
- **LH** — Hormônio Luteinizante. Pico deflagra ovulação.
- **LMP** — Last Menstrual Period; ver DUM.
- **LOINC** — Logical Observation Identifiers Names and Codes. Terminologia universal de exames laboratoriais.
- **Lóquios** — Fluxo vaginal puerperal. Rubra (1ª semana) → serosa → alba. Odor fétido = endometrite.
- **LR (Likelihood Ratio)** — Razão de verossimilhança; multiplica o risco a priori no rastreio FMF.

## M

- **MAP** — Mean Arterial Pressure (PA média). Marcador no algoritmo PE da FMF.
- **Memed** — Plataforma brasileira de prescrição eletrônica.
- **MEC (WHO-MEC)** — Medical Eligibility Criteria for Contraceptive Use (WHO 2015). Categorias 1–4.
- **MMSE** — Mini-Mental State Examination. < 24 = investigar declínio cognitivo.
- **MoCA** — Montreal Cognitive Assessment. < 26 = CCL.
- **MoM** — Multiple of Median. Normalização de marcadores bioquímicos por IG.
- **Morfológico 1T / 2T** — USG estrutural de 11–13+6 sem / 20–24 sem.
- **MRS** — Menopause Rating Scale. 11 itens (0–4); ≥ 9 moderado; ≥ 17 severo.

## N

- **NAMS** — The Menopause Society (ex-North American Menopause Society).
- **NetworkFirst** — Estratégia de cache do Service Worker: tenta rede primeiro, cai para cache.
- **NICE** — National Institute for Health and Care Excellence (Reino Unido).
- **NIPT** — ver DPNI.
- **NICU (UTIN)** — Unidade de Terapia Intensiva Neonatal.

## O

- **OI** — Indução da Ovulação. Tipo de TRA de baixa complexidade.
- **Oligúria** — Diurese < 30 mL/h (internação). Alerta renal.
- **Oligozoospermia** — Concentração espermática < 16 M/mL (OMS 2021).
- **OMS (WHO)** — Organização Mundial da Saúde. Valores de referência de sêmen 2021.
- **OTP** — One-Time Password. Portal da paciente: 6 dígitos, 10 min, 5 tentativas.

## P

- **PA** — Pressão Arterial. ≥ 140/90 = HAS; ≥ 160/110 = grave.
- **PAAF** — Punção aspirativa por agulha fina (tireoide, mama).
- **PALM-COEIN** — Classificação FIGO de SUA: Pólipos/Adenomiose/Leiomioma/Malignidade × Coagulopatia/Ovulatória/Endometrial/Iatrogênica/Não classificada.
- **Papanicolau** — Citologia oncótica cervical. 25–64 anos; anual→trienal conforme protocolo.
- **PAPP-A** — Pregnancy-Associated Plasma Protein-A. Marcador bioquímico 1T; baixo associado a T21, RCF, PE.
- **PBAC** — Pictorial Blood Assessment Chart. > 100 = menorragia objetiva.
- **PBF** — Perfil Biofísico Fetal. 0–10 (cinco parâmetros). ≤ 4 crítico; 6 limítrofe.
- **PCOS / SOP** — Síndrome do Ovário Policístico. Rotterdam ≥ 2 de 3 critérios.
- **PE** — Pré-eclâmpsia. HAS + proteinúria após 20 sem, ou HAS + disfunção de órgão.
- **PHQ-2** — Rastreio de depressão (2 perguntas). Score ≥ 3 positivo.
- **PlGF** — Placental Growth Factor. Marcador no algoritmo PE da FMF.
- **POI** — Insuficiência Ovariana Prematura (< 40 anos). THM até idade fisiológica da menopausa.
- **PROM / rPROM** — Ruptura prematura de membranas / ruptura pretermo.
- **Puerpério** — 6 semanas pós-parto; dividido em imediato (24h), mediato (10d) e tardio.
- **PWA** — Progressive Web App. Instalável, offline-first.

## Q

- **QR check-in** — Código QR gerado para a paciente fazer check-in sem passar na recepção.

## R

- **RBAC** — Role-Based Access Control. 7 roles no EliaHealth.
- **RCF (FGR)** — Restrição de Crescimento Fetal. PFE < p10.
- **Recharts** — Biblioteca de gráficos React usada no EliaHealth.
- **Regurgitação tricúspide (TR)** — Marcador USG 1T; presente = LR 4.5 para T21.
- **RLS** — Row Level Security (Postgres).
- **RNDS** — Rede Nacional de Dados em Saúde (Ministério da Saúde). Envio FHIR com perfis brasileiros.
- **Rotterdam (critérios)** — Diagnóstico SOP: oligo/anovulação, hiperandrogenismo, morfologia ovariana policística. 2 de 3 = diagnóstico.

## S

- **Saco gestacional anembrionado** — Gestação inicial sem embrião (anembryonic/blighted ovum).
- **SADT** — Serviço Auxiliar de Diagnóstico e Terapia. Tipo de guia TISS.
- **SafeID** — Provedor ICP-Brasil.
- **SCORE** — European cardiovascular risk score.
- **SIPNI** — Sistema de Informação do Programa Nacional de Imunizações.
- **SNOMED-CT** — Terminologia clínica internacional.
- **SOAP** — Subjetivo, Objetivo, Avaliação, Plano. Estrutura de consulta.
- **SOP** — ver PCOS.
- **SpO₂** — Saturação de O₂ arterial. < 92% = hipoxemia.
- **STRAW+10** — Stages of Reproductive Aging Workshop +10 (2012). Classifica fases do climatério (-5 a +2).
- **SUA** — Sangramento Uterino Anormal. Classificação FIGO PALM-COEIN.
- **SUS** — Sistema Único de Saúde.

## T

- **T21/T18/T13** — Trissomia do 21 (Down), 18 (Edwards), 13 (Patau).
- **Taquissistolia** — Mais de 5 contrações em 10 min.
- **Tenant** — Unidade de negócio isolada (clínica, UBS, hospital). No EliaHealth toda query filtra por `tenantId`.
- **TI-RADS 1–5** — Thyroid Imaging Reporting and Data System (ACR 2017). Pontuação 0–11 mapeia para TR1–TR5 e conduta.
- **TISS** — Troca de Informação em Saúde Suplementar (ANS). Padrão de faturamento brasileiro.
- **TUSS** — Terminologia Unificada da Saúde Suplementar. Códigos de procedimentos usados em TISS.
- **TN (translucência nucal)** — Medida USG 11–13+6 sem. Delta NT alimenta rastreio T21.
- **TOTG 75g (OGTT)** — Teste Oral de Tolerância à Glicose. Rastreio universal de DMG em 24–28 sem.
- **TRA** — Técnicas de Reprodução Assistida (OI, IIU, FIV, ICSI).
- **TGO/AST, TGP/ALT** — Transaminases hepáticas. > 70 atenção; > 150 HELLP.
- **Threshold** — Limite numérico que dispara regra clínica.
- **THM / TRH** — Terapia Hormonal da Menopausa / Terapia de Reposição Hormonal.
- **Trigger** — Evento que inicia um fluxo; no copiloto WebSocket, campo preenchido → nova análise.
- **Trimestre** — 1º (0–13+6), 2º (14–27+6), 3º (28+ sem).

## U

- **UBS** — Unidade Básica de Saúde. Preset de tenant.
- **UtA-PI** — Uterine Artery Pulsatility Index. Marcador no algoritmo PE da FMF.

## V

- **Valid** — Autoridade Certificadora ICP-Brasil.
- **VIDaaS** — Videoconferência como alternativa para emissão de certificado ICP-Brasil (e-CPF/e-CNPJ).
- **VSR / RSVpreF** — Vacina contra vírus sincicial respiratório (32–36 sem, quando disponível).

## W

- **WCAG** — Web Content Accessibility Guidelines. EliaHealth visa AA.
- **WebAuthn** — Autenticação por chave pública (passkey).
- **WHO** — ver OMS.
- **WHO-MEC** — ver MEC.

## Z

- **Zygosity / Corionicidade** — Em gestação múltipla: dicoriônica/diamniótica (melhor prognóstico) vs. monocoriônica/monoamniótica.

---

## Produto (específico EliaHealth)

- **Checklist clínico** — Pós-consulta do copiloto Fase 2; categorias exam/prescription/screening/vaccine/referral/monitoring/follow_up/anamnesis_gap/drug_interaction/contraindication.
- **Copiloto Elia** — ver Copiloto.
- **Chatbot contextual** — Fase 4a; WhatsApp com contexto da consulta + detecção de urgência.
- **Alerta longitudinal** — Fase 4b; cron diário (6h) detecta retornos perdidos, exames pendentes, tendências.
- **Lunar Bloom** — Sistema visual compartilhado entre eliahealth e eliamov (Ink/Cream/Terracotta/Sage/Brass/Oxide).
- **Master OTP** — OTP de desenvolvimento `123456` via env `PORTAL_MASTER_OTP`; nunca em prod.
- **Módulo flags** — 16 booleanos em `tenant_configs` que ativam/desativam módulos por unidade.
- **Preset** — Configuração default de flags por tipo de unidade (consultório/UBS/hospital).
- **Resumo pós-consulta** — Fase 1; IA gera linguagem leiga, médico aprova, envia por WhatsApp + Portal.
- **Role** — Papel do usuário (7 no EliaHealth).
- **Tenant** — ver acima.
