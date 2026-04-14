export function getPrenatalRules(): string {
  return `
## REGRAS ESPECIFICAS PRE-NATAL
Verifique obrigatoriamente:

### Por idade gestacional:
- < 14 sem: tipagem sanguinea, Coombs indireto, sorologias (HIV, sifilis, hepatite B, toxoplasmose, rubeola), hemograma, glicemia jejum, urina tipo 1, urocultura, ultrassom 1o trimestre com TN
- 14-20 sem: considerar morfologico 2o trimestre, pesquisa de colo curto se fatores de risco
- 20-24 sem: ultrassom morfologico, ecocardiograma fetal se indicado
- 24-28 sem: TOTG 75g (rastreio DMG), Coombs indireto se Rh negativo, hemograma
- 28 sem: anti-D profilatico se Rh negativo e Coombs indireto negativo
- 28-36 sem: repetir sorologias (HIV, sifilis, hepatite B), hemograma, cultura de estreptococo grupo B (35-37 sem)
- > 36 sem: avaliacao de bem-estar fetal, orientacoes sobre trabalho de parto

### Sempre verificar:
- Acido folico prescrito (ate 12 sem no minimo)
- Suplementacao de ferro (a partir de 20 sem)
- Vacinas: dTpa (20-36 sem), Influenza (qualquer IG), COVID-19
- PA em todas as consultas (pre-eclampsia)
- Peso e IMC (ganho de peso adequado)
- Movimentacao fetal questionada (a partir de 28 sem)
- Proxima consulta agendada com intervalo adequado

### Sinais de alerta que exigem ACTION_REQUIRED:
- PA >= 140/90 sem conduta registrada
- Glicemia jejum >= 92 mg/dL sem TOTG solicitado
- Rh negativo sem Coombs ou anti-D
- Perda de liquido ou sangramento sem encaminhamento
- Reducao de movimentacao fetal sem CTG ou perfil biofisico
`;
}

export function getGynecologyRules(): string {
  return `
## REGRAS ESPECIFICAS GINECOLOGIA
Verifique obrigatoriamente:

### Rastreios por idade:
- 25-64 anos: Papanicolau conforme protocolo (anual ate 2 negativos, depois trienal)
- >= 40 anos: mamografia anual ou bienal conforme risco
- Qualquer idade com vida sexual: rastreio de ISTs se fatores de risco
- >= 50 anos ou pos-menopausa: densitometria ossea basal

### Por queixa:
- Sangramento uterino anormal: ultrassom TV solicitado? Hemograma?
- Corrimento: exame a fresco ou cultura? Tratamento do parceiro se IST?
- Dor pelvica: ultrassom? Descartar gravidez ectopica se atraso menstrual?
- Nodulo mamario: ultrassom mamario? Encaminhamento para biopsia?

### Contracepcao:
- Criterios de elegibilidade WHO/MEC verificados?
- Contraindicacoes checadas (tabagismo + idade, hipertensao, enxaqueca com aura)?
- Orientacao sobre uso correto registrada?

### Sempre verificar:
- Data do ultimo Papanicolau
- Data da ultima mamografia (se >= 40 anos)
- Status vacinal HPV (ate 45 anos)
- Rastreio de violencia domestica (FEBRASGO recomenda)
`;
}

export function getMenopauseRules(): string {
  return `
## REGRAS ESPECIFICAS MENOPAUSA/CLIMATERIO
Verifique obrigatoriamente:

- Avaliacao de sintomas vasomotores (escala MRS ou Kupperman)
- Densitometria ossea (se nao realizada nos ultimos 2 anos)
- Perfil lipidico e glicemia
- TSH (sintomas podem mimetizar hipotireoidismo)
- Rastreio cardiovascular (SCORE ou Framingham)
- Se TRH prescrita: contraindicacoes checadas? Mamografia recente? Perfil trombotico?
- Se TRH nao prescrita: alternativas nao hormonais discutidas?
- Rastreio de osteoporose e risco de fratura (FRAX)
- Orientacao sobre atividade fisica e alimentacao
- Avaliacao de saude mental (depressao, ansiedade, insonia)
`;
}

export function getFertilityRules(): string {
  return `
## REGRAS ESPECIFICAS FERTILIDADE
Verifique obrigatoriamente:

- Tempo de tentativa registrado (investigar se > 12 meses, ou > 6 meses se >= 35 anos)
- Avaliacao hormonal basica: FSH, LH, estradiol, prolactina, TSH, AMH
- Espermograma do parceiro solicitado (causa masculina em ~40% dos casos)
- Histerossalpingografia ou histerossonografia se indicada
- Ultrassom com contagem de foliculos antrais
- Sorologias do casal atualizadas
- Acido folico prescrito (iniciar antes da concepcao)
- Avaliacao de peso/IMC (impacto na fertilidade)
- Orientacao sobre janela fertil e frequencia de relacoes
`;
}
