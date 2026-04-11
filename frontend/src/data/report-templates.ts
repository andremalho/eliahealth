/**
 * EliaHealth — Modelos de Laudo de Ultrassonografia
 * Versão 2.0 — Revisado com gestação múltipla e obstétrico inicial corrigido
 *
 * Baseado em:
 *   ISUOG Practice Guidelines (2022-2024)
 *   ISUOG Guidelines on Twins (UOG 2025;65:253-276)
 *   ASE Fetal Echocardiography Guidelines 2023
 *   SRU/RSNA Endometriosis Consensus 2024
 *   ACR BI-RADS 5th Ed. / ACR TI-RADS 2017
 *   ACOG Practice Bulletins
 *   Manning PBF 1980
 */

// ══════════════════════════════════════════════════════════════
// TIPOS BASE
// ══════════════════════════════════════════════════════════════

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'boolean'
  | 'group'
  | 'table'
  | 'date'
  | 'calculated';

export interface ReportField {
  id: string;
  label: string;
  type: FieldType;
  unit?: string;
  options?: string[];
  required?: boolean;
  guideline?: string;
  placeholder?: string;
  fields?: ReportField[];
  min?: number;
  max?: number;
  perFeto?: boolean;
  apenasMultipla?: boolean;
  calculatedFrom?: string[];
  internal?: boolean;
}

export interface ReportSection {
  id: string;
  title: string;
  fields: ReportField[];
  replicatePorFeto?: boolean;
  apenasMultipla?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: 'obstetrica' | 'ginecologica';
  subcategory?: string;
  guideline_refs: string[];
  sections: ReportSection[];
  version: string;
  reviewed_at: string;
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

const field = (id: string, label: string, type: FieldType, extra: Partial<ReportField> = {}): ReportField =>
  ({ id, label, type, ...extra });

const select = (id: string, label: string, options: string[], extra: Partial<ReportField> = {}): ReportField =>
  field(id, label, 'select', { options, ...extra });

const multiselect = (id: string, label: string, options: string[], extra: Partial<ReportField> = {}): ReportField =>
  field(id, label, 'multiselect', { options, ...extra });

const num = (id: string, label: string, unit?: string, extra: Partial<ReportField> = {}): ReportField =>
  field(id, label, 'number', { unit, ...extra });

const txt = (id: string, label: string, placeholder?: string): ReportField =>
  field(id, label, 'text', { placeholder });

const area = (id: string, label: string, placeholder?: string, required = false): ReportField =>
  field(id, label, 'textarea', { placeholder, required });

const bool = (id: string, label: string, required = false): ReportField =>
  field(id, label, 'boolean', { required });

const grp = (id: string, label: string, fields: ReportField[]): ReportField =>
  field(id, label, 'group', { fields });

// ══════════════════════════════════════════════════════════════
// SEÇÕES COMPARTILHADAS
// ══════════════════════════════════════════════════════════════

const secCabecalho: ReportSection = {
  id: 'cabecalho',
  title: 'Dados do Exame',
  fields: [
    field('data_exame', 'Data do Exame', 'date', { required: true }),
    area('indicacao', 'Indicacao Clinica', 'Motivo do exame / hipotese diagnostica', true),
    select('via', 'Via de Exame', [
      'Transabdominal', 'Transvaginal', 'Transabdominal + Transvaginal', 'Transperineal',
    ], { required: true }),
    txt('equipamento', 'Equipamento / Transdutor', 'Ex.: GE Voluson E10, sonda convex 3,5 MHz'),
    select('qualidade_imagem', 'Qualidade Tecnica da Imagem', [
      'Otima', 'Boa', 'Regular — limitada por habitus materno',
      'Regular — limitada por posicao fetal', 'Regular — limitada por gases intestinais',
      'Prejudicada — resultados com limitacao diagnostica',
    ]),
  ],
};

const secConclusao: ReportSection = {
  id: 'conclusao',
  title: 'Conclusao / Impressao Diagnostica',
  fields: [
    area('conclusao_principal', 'Impressao Diagnostica', 'Descricao conclusiva do exame', true),
    area('achados_adicionais', 'Achados Adicionais / Incidentais'),
    area('recomendacoes', 'Recomendacoes / Conduta Sugerida'),
    bool('correlacao_clinica', 'Correlacao Clinica Recomendada'),
  ],
};

const secGestacaoMultipla: ReportSection = {
  id: 'gestacao_multipla',
  title: 'Gestacao Multipla — Dados Gerais',
  apenasMultipla: true,
  fields: [
    select('tipo_gemelaridade', 'Tipo de Gemelaridade', [
      'Gemelar (2 fetos)', 'Trigemelar (3 fetos)', 'Quadrigemelar (4 fetos)',
    ], { required: true }),
    select('corionicidade', 'Corionicidade', [
      'Dicorionica-Diamniotica (DCDA)', 'Monocorionica-Diamniotica (MCDA)',
      'Monocorionica-Monoamniotica (MCMA)', 'Tricorionica-Triamniotica',
      'Bicorionica-Triamniotica', 'Monocorionica-Triamniotica',
      'Tetracorionica-Tetramniotica', 'Indeterminada — detalhar',
    ], { required: true, guideline: 'ISUOG Twins 2025' }),
    select('amnionicidade', 'Amnionicidade', [
      'Diamniotica', 'Monoamniotica', 'Triamniotica', 'Tetramniotica', 'Mista — detalhar',
    ], { required: true }),
    select('crescimento_discordante', 'Crescimento Discordante', [
      'Ausente — diferenca < 10%', 'Leve — diferenca 10-20%', 'Significativo — diferenca >= 20%',
    ]),
    select('ttts', 'TTTS', [
      'Ausente', 'Estagio I', 'Estagio II', 'Estagio III', 'Estagio IV', 'Estagio V', 'N/A — dicorionica',
    ]),
    area('comentarios_multipla', 'Comentarios — Gestacao Multipla'),
  ],
};

const secDadosGestacao = (extraFields: ReportField[] = []): ReportSection => ({
  id: 'dados_gestacao',
  title: 'Dados da Gestacao',
  fields: [
    num('num_fetos', 'Numero de Fetos', undefined, { required: true, min: 1, max: 4 }),
    select('localizacao_gestacao', 'Localizacao da Gestacao', [
      'Intrauterina topica', 'Suspeita de ectopica', 'Cesariana scar pregnancy',
      'Cervical', 'Abdominal', 'Indeterminada',
    ], { required: true }),
    ...extraFields,
  ],
});

// ══════════════════════════════════════════════════════════════
// HELPERS POR FETO
// ══════════════════════════════════════════════════════════════

const makeFetoBiometria = (p: string, label: string): ReportField =>
  grp(`feto_${p}_biometria`, `${label} — Biometria`, [
    select(`feto_${p}_bcf`, 'BCF', ['Presente — ritmo regular', 'Presente — arritmia', 'Ausente'], { required: true }),
    num(`feto_${p}_fcf`, 'FCF', 'bpm', { min: 80, max: 220 }),
    num(`feto_${p}_dbp`, 'DBP', 'mm', { required: true }),
    txt(`feto_${p}_dbp_p`, 'DBP — Percentil'),
    num(`feto_${p}_cc`, 'CC', 'mm', { required: true }),
    txt(`feto_${p}_cc_p`, 'CC — Percentil'),
    num(`feto_${p}_ca`, 'CA', 'mm', { required: true }),
    txt(`feto_${p}_ca_p`, 'CA — Percentil'),
    num(`feto_${p}_cf`, 'CF', 'mm', { required: true }),
    txt(`feto_${p}_cf_p`, 'CF — Percentil'),
    num(`feto_${p}_pe`, 'Peso Estimado (PE)', 'g', { required: true }),
    txt(`feto_${p}_pe_p`, 'PE — Percentil'),
    select(`feto_${p}_crescimento`, 'Classificacao do Crescimento', [
      'AIG (p10-p90)', 'PIG (< p10)', 'PIG severo (< p3)', 'GIG (> p90)', 'Macrossomico (> 4000g)',
    ], { required: true }),
  ]);

const makeFetoPosicao = (p: string, label: string): ReportField =>
  grp(`feto_${p}_posicao`, `${label} — Posicao`, [
    select(`feto_${p}_apresentacao`, 'Apresentacao', ['Cefalica', 'Pelvica', 'Cormica / Transversa', 'Obliqua'], { required: true }),
    select(`feto_${p}_dorso`, 'Dorso', ['Anterior', 'Posterior', 'Direito', 'Esquerdo', 'Variavel']),
    select(`feto_${p}_mov`, 'Movimentos Fetais', ['Presentes e normais', 'Reduzidos', 'Ausentes durante o exame']),
  ]);

const makeLiquidoAmniotico = (p: string, label: string): ReportField =>
  grp(`feto_${p}_la`, `${label} — Liquido Amniotico`, [
    num(`feto_${p}_ila`, 'ILA', 'cm'),
    num(`feto_${p}_mbv`, 'MBV', 'cm'),
    select(`feto_${p}_vol_la`, 'Volume de LA', [
      'Normal', 'Oligoamnio (ILA <= 5cm ou MBV < 2cm)', 'Oligoamnio severo (MBV < 1cm)',
      'Polidramnio (ILA > 24cm ou MBV > 8cm)', 'Polidramnio severo (MBV > 12cm)',
    ], { required: true }),
  ]);

const makeDopplerFeto = (p: string, label: string): ReportField =>
  grp(`feto_${p}_doppler`, `${label} — Doppler`, [
    grp(`feto_${p}_au`, 'Arteria Umbilical', [
      num(`feto_${p}_au_ip`, 'IP'),
      txt(`feto_${p}_au_ip_p`, 'IP — Percentil'),
      select(`feto_${p}_au_difd`, 'Diastole Final', [
        'Presente — positiva (normal)', 'Ausente (AEDF)', 'Reversa (REDF)',
      ], { required: true }),
    ]),
    grp(`feto_${p}_acm`, 'ACM', [
      num(`feto_${p}_acm_ip`, 'IP'),
      num(`feto_${p}_acm_vps`, 'VPS', 'cm/s'),
      num(`feto_${p}_acm_mom`, 'VPS — MoM'),
    ]),
    grp(`feto_${p}_rcp`, 'RCP', [
      num(`feto_${p}_rcp_val`, 'RCP (IP-ACM / IP-AU)'),
      select(`feto_${p}_rcp_int`, 'Interpretacao', ['Normal (> p5)', 'Reduzida (< p5) — redistribuicao cerebral']),
    ]),
    grp(`feto_${p}_dv`, 'Ducto Venoso', [
      num(`feto_${p}_dv_ipv`, 'IPV'),
      select(`feto_${p}_dv_a`, 'Onda "a"', ['Positiva (normal)', 'Ausente', 'Invertida', 'Nao avaliado'], { required: true }),
    ]),
  ]);

const makePlacenta = (p: string, label: string): ReportField =>
  grp(`feto_${p}_placenta`, `${label} — Placenta`, [
    select(`feto_${p}_plac_local`, 'Localizacao', [
      'Fundica', 'Anterior', 'Posterior', 'Lateral direita', 'Lateral esquerda',
      'Baixa insercao (< 20mm do OCI)', 'Previa marginal', 'Previa total',
    ], { required: true }),
    select(`feto_${p}_plac_gran`, 'Grau (Grannum)', ['Grau 0', 'Grau I', 'Grau II', 'Grau III']),
    select(`feto_${p}_cordao`, 'Cordao Umbilical', [
      '3 vasos (normal)', 'Arteria umbilical unica (2 vasos)',
      'Insercao marginal', 'Insercao velamentosa suspeita', 'Circular de cordao',
    ], { required: true }),
  ]);

// ══════════════════════════════════════════════════════════════
// TEMPLATES OBSTÉTRICOS
// ══════════════════════════════════════════════════════════════

export const obstetricoInicial: ReportTemplate = {
  id: 'obs_inicial',
  name: 'Obstetrico Inicial (Precoce)',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['ISUOG 2023 11-14 week scan', 'ISUOG Early Pregnancy 2011'],
  sections: [
    secCabecalho,
    {
      id: 'dados_gestacao_inicial',
      title: 'Dados da Gestacao',
      fields: [
        num('num_fetos_ini', 'Numero de Embrioes / Fetos Viaveis', undefined, { required: true, min: 0, max: 4 }),
        select('localizacao_ini', 'Localizacao da Implantacao', [
          'Intrauterina — topica', 'Intrauterina — baixa',
          'Suspeita de ectopica', 'Cesariana scar pregnancy', 'Indeterminada',
        ], { required: true }),
        field('dum', 'DUM', 'date'),
        txt('ig_dum', 'IG pela DUM'),
        txt('ig_usg_principal', 'IG pelo Ultrassom (CCN)'),
        field('dpp_estimada', 'DPP Estimada', 'date'),
      ],
    },
    secGestacaoMultipla,
    {
      id: 'avaliacao_feto_a',
      title: 'Feto A',
      fields: [
        grp('embriao_a', 'Feto A', [
          num('emb_a_ccn', 'CCN', 'mm', { required: true }),
          txt('emb_a_ig_ccn', 'IG pelo CCN'),
          select('emb_a_bcf', 'BCF', [
            'Presente — frequencia regular', 'Presente — bradicardia (< 100bpm)',
            'Ausente — IG < 6 semanas', 'Ausente — obito embrionario',
          ], { required: true }),
          num('emb_a_fcf', 'FCF', 'bpm', { min: 80, max: 220 }),
          num('tn_a_val', 'TN (se >= 11 semanas)', 'mm'),
          txt('tn_a_mom', 'TN — MoM / Percentil'),
        ]),
      ],
    },
    {
      id: 'utero_anexos_ini',
      title: 'Utero e Anexos',
      fields: [
        txt('utero_ini', 'Utero'),
        txt('ovario_d_ini', 'Ovario Direito'),
        txt('ovario_e_ini', 'Ovario Esquerdo'),
        select('corpo_luteo', 'Corpo Luteo', ['Identificado — aspecto normal', 'Cisto hemorragico', 'Nao identificado']),
      ],
    },
    secConclusao,
  ],
};

export const obstetrico: ReportTemplate = {
  id: 'obs_2_3_tri',
  name: 'Obstetrico (2o e 3o Trimestres)',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['ISUOG mid-trimester 2022', 'ISUOG third-trimester 2024'],
  sections: [
    secCabecalho,
    secDadosGestacao([
      txt('ig_obs', 'IG'),
      field('dpp_obs', 'DPP', 'date', { required: true }),
    ]),
    secGestacaoMultipla,
    {
      id: 'feto_a_sec',
      title: 'Feto A',
      fields: [makeFetoPosicao('a', 'Feto A'), makeFetoBiometria('a', 'Feto A'), makeLiquidoAmniotico('a', 'Feto A'), makePlacenta('a', 'Feto A')],
    },
    {
      id: 'feto_b_sec',
      title: 'Feto B',
      apenasMultipla: true,
      fields: [makeFetoPosicao('b', 'Feto B'), makeFetoBiometria('b', 'Feto B'), makeLiquidoAmniotico('b', 'Feto B'), makePlacenta('b', 'Feto B')],
    },
    {
      id: 'cervix_obs',
      title: 'Colo Uterino',
      fields: [
        num('cc_cervical', 'Comprimento Cervical (TVU)', 'mm'),
        select('orificio_int', 'Orificio Interno', ['Fechado', 'Aberto']),
      ],
    },
    secConclusao,
  ],
};

export const dopplerObstetrico: ReportTemplate = {
  id: 'doppler_obs',
  name: 'Dopplervelocimetria Obstetrica',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['ISUOG Doppler 2021', 'Lees RCIU 2020'],
  sections: [
    secCabecalho,
    { id: 'dados_doppler', title: 'Dados', fields: [
      num('num_fetos_dop', 'Numero de Fetos', undefined, { required: true, min: 1, max: 4 }),
      txt('ig_doppler', 'IG'),
    ]},
    secGestacaoMultipla,
    { id: 'arterias_uterinas', title: 'Arterias Uterinas', fields: [
      num('uta_ip_d', 'IP AUt D'), num('uta_ip_e', 'IP AUt E'), num('uta_ip_medio', 'IP Medio'),
      select('uta_notch', 'Notch', ['Ausente', 'Unilateral D', 'Unilateral E', 'Bilateral']),
    ]},
    { id: 'doppler_feto_a', title: 'Feto A — Doppler', fields: [
      num('feto_a_pe_dop', 'PE', 'g'), makeDopplerFeto('a', 'Feto A'),
    ]},
    { id: 'doppler_feto_b', title: 'Feto B — Doppler', apenasMultipla: true, fields: [
      num('feto_b_pe_dop', 'PE', 'g'), makeDopplerFeto('b', 'Feto B'),
    ]},
    secConclusao,
  ],
};

export const morfologicoPrimeiroTrimestre: ReportTemplate = {
  id: 'morfologico_1t',
  name: 'Morfologico 1o Trimestre (11-14 semanas)',
  version: '3.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: [
    'ISUOG 11-14 week scan 2023 (UOG 61:127-143)',
    'FMF Combined Test Protocol',
    'FMF Pre-eclampsia Screening Algorithm (Akolekar 2013)',
    'ISUOG cervical length assessment 2022',
  ],
  sections: [
    secCabecalho,
    secDadosGestacao([
      txt('ig_1t', 'IG pelo CCN'),
      field('dpp_1t', 'DPP', 'date'),
    ]),
    secGestacaoMultipla,
    // ── Dados maternos para calculo de risco ──
    { id: 'dados_maternos_1t', title: 'Dados Maternos (para calculo de risco)', fields: [
      num('idade_materna', 'Idade Materna', 'anos', { required: true, guideline: 'FMF — risco a priori baseado na idade' }),
      num('peso_materno', 'Peso', 'kg', { required: true, guideline: 'FMF — correcao de MoM por peso' }),
      num('altura_materna', 'Altura', 'cm'),
      select('etnia', 'Etnia', ['Caucasiana', 'Afrodescendente', 'Asiatica', 'Mista', 'Outra'], { guideline: 'FMF — ajuste de risco por etnia' }),
      select('concepcao', 'Tipo de Concepcao', ['Espontanea', 'FIV/ICSI', 'Inducao de ovulacao', 'Doacao de ovulos']),
      select('tabagismo', 'Tabagismo', ['Nao fumante', 'Fumante atual', 'Ex-fumante']),
      bool('dm_pregestacional', 'Diabetes Mellitus Pre-gestacional'),
      bool('has_cronico', 'Hipertensao Arterial Cronica'),
      bool('les', 'LES / Sindrome Antifosfolipide'),
      select('hx_pe', 'Historia Previa de Pre-eclampsia', [
        'Nenhuma', 'PE em gestacao anterior', 'PE precoce (< 34s) em gestacao anterior',
        'Eclampsia / HELLP previa',
      ], { guideline: 'FMF — principal fator de risco para PE' }),
      select('paridade', 'Paridade', ['Nulipara', 'Multipara sem PE previa', 'Multipara com PE previa']),
      bool('hx_familiar_pe', 'Historia Familiar de PE (mae/irma)'),
    ]},
    // ── Rastreamento de Aneuploidias (Feto A) ──
    { id: 'rastr_a', title: 'Feto A — Rastreamento de Aneuploidias', fields: [
      num('feto_a_ccn_morf', 'CCN', 'mm', { required: true, guideline: 'FMF — 45-84mm (11+0 a 13+6 semanas)' }),
      txt('feto_a_ig_ccn', 'IG pelo CCN'),
      num('feto_a_tn_morf', 'TN', 'mm', { required: true, guideline: 'ISUOG/FMF — calipers inner-to-inner, posicao neutra, 3 medidas' }),
      num('feto_a_tn_mom', 'TN — MoM', undefined, { guideline: 'FMF — MoM ajustado por CCN' }),
      select('feto_a_osso_nasal', 'Osso Nasal', [
        'Presente e normal', 'Hipoplasico (< 2.5mm)', 'Ausente',
      ], { required: true, guideline: 'FMF — ausente em ~60% T21, ~1% euploides' }),
      num('feto_a_dv_ip_morf', 'IP Ducto Venoso', undefined, { guideline: 'FMF — > p95 = risco aumentado' }),
      select('feto_a_dv_onda_a', 'Onda "a" Ducto Venoso', [
        'Positiva (normal)', 'Ausente', 'Invertida',
      ], { guideline: 'FMF — onda "a" invertida: LR 3.2 para T21' }),
      select('feto_a_tr_regurg', 'Regurgitacao Tricuspide', [
        'Ausente (normal)', 'Presente',
      ], { guideline: 'FMF — presente em ~55% T21, ~1% euploides' }),
      num('feto_a_fcf_1t', 'FCF', 'bpm', { min: 80, max: 220 }),
      num('feto_a_afn', 'Angulo Frontonasal', 'graus', { guideline: 'FMF — > p95: LR 3.8 para T21' }),
    ]},
    // ── Bioquimica serica ──
    { id: 'bioquimica_1t', title: 'Marcadores Bioquimicos Sericos', fields: [
      grp('papp_a_grp', 'PAPP-A', [
        num('papp_a_valor', 'PAPP-A', 'mUI/mL', { guideline: 'FMF — coleta ideal 9-11 semanas' }),
        num('papp_a_mom', 'PAPP-A — MoM', undefined, { guideline: '< 0.4 MoM: risco aumentado T21/T18/T13 + PE + RCIU' }),
      ]),
      grp('beta_hcg_grp', 'Beta-hCG Livre', [
        num('beta_hcg_valor', 'Beta-hCG Livre', 'mUI/mL'),
        num('beta_hcg_mom', 'Beta-hCG — MoM', undefined, { guideline: 'FMF — > 2.0 MoM: risco aumentado T21' }),
      ]),
      grp('plgf_grp', 'PlGF (opcional)', [
        num('plgf_valor', 'PlGF', 'pg/mL', { guideline: 'FMF — marcador adicional para PE precoce' }),
        num('plgf_mom', 'PlGF — MoM'),
      ]),
    ]},
    // ── Calculo de Risco de Trissomias ──
    { id: 'risco_trissomias', title: 'Calculo de Risco — Trissomias (Teste Combinado FMF)', fields: [
      grp('risco_t21_grp', 'Trissomia 21 (Sindrome de Down)', [
        txt('risco_a_priori_t21', 'Risco a Priori (pela idade)', 'Ex.: 1:250'),
        txt('risco_ajustado_t21', 'Risco Ajustado (teste combinado)', 'Ex.: 1:1500'),
        select('risco_t21_class', 'Classificacao', [
          'Baixo risco (> 1:1000)', 'Risco intermediario (1:101 a 1:1000)',
          'Alto risco (<= 1:100)',
        ], { required: true, guideline: 'FMF — alto risco: invasivo; intermediario: NIPT; baixo: rotina' }),
      ]),
      grp('risco_t18_grp', 'Trissomia 18 (Sindrome de Edwards)', [
        txt('risco_ajustado_t18', 'Risco Ajustado', 'Ex.: 1:5000'),
        select('risco_t18_class', 'Classificacao', [
          'Baixo risco (> 1:100)', 'Alto risco (<= 1:100)',
        ]),
      ]),
      grp('risco_t13_grp', 'Trissomia 13 (Sindrome de Patau)', [
        txt('risco_ajustado_t13', 'Risco Ajustado', 'Ex.: 1:8000'),
        select('risco_t13_class', 'Classificacao', [
          'Baixo risco (> 1:100)', 'Alto risco (<= 1:100)',
        ]),
      ]),
      select('conduta_trissomia', 'Conduta Recomendada', [
        'Rastreamento de rotina — baixo risco',
        'NIPT (cellfree DNA) recomendado — risco intermediario',
        'Procedimento invasivo (BVC/amniocentese) oferecido — alto risco',
        'Aconselhamento genetico recomendado',
      ]),
      area('obs_trissomia', 'Observacoes sobre rastreamento'),
    ]},
    // ── Rastreamento de Pre-eclampsia (FMF) ──
    { id: 'rastr_pe_1t', title: 'Rastreamento de Pre-eclampsia (Algoritmo FMF)', fields: [
      grp('pressao_arterial_1t', 'Pressao Arterial Materna', [
        num('pa_sistolica_1t', 'PA Sistolica', 'mmHg', { required: true }),
        num('pa_diastolica_1t', 'PA Diastolica', 'mmHg', { required: true }),
        num('map_1t', 'MAP (Pressao Arterial Media)', 'mmHg', { guideline: 'MAP = (PAS + 2*PAD) / 3' }),
        num('map_mom', 'MAP — MoM', undefined, { guideline: 'FMF — ajustado por IG, peso, etnia' }),
      ]),
      grp('doppler_uterinas_1t', 'Arterias Uterinas', [
        num('uta_pi_d_1t', 'IP AUt Direita', undefined, { required: true }),
        num('uta_pi_e_1t', 'IP AUt Esquerda', undefined, { required: true }),
        num('uta_pi_medio_1t', 'IP Medio', undefined, { required: true, guideline: 'FMF — media aritmetica bilateral' }),
        num('uta_pi_mom', 'IP Medio — MoM', undefined, { guideline: 'FMF — ajustado por IG' }),
      ]),
      grp('risco_pe_resultado', 'Resultado do Rastreamento', [
        txt('risco_pe_precoce', 'Risco PE Precoce (< 34 semanas)', 'Ex.: 1:50'),
        txt('risco_pe_preterme', 'Risco PE Pre-termo (< 37 semanas)', 'Ex.: 1:120'),
        txt('risco_pe_termo', 'Risco PE a Termo', 'Ex.: 1:80'),
        select('risco_pe_class', 'Classificacao', [
          'Baixo risco (> 1:100 para PE precoce)',
          'Alto risco (<= 1:100 para PE precoce)',
        ], { required: true, guideline: 'FMF — alto risco: AAS 150mg/noite a partir de 12-16 semanas' }),
        select('conduta_pe', 'Conduta', [
          'Seguimento de rotina — baixo risco',
          'AAS 150mg/noite (12-36 semanas) — alto risco',
          'AAS + monitoramento pressao arterial intensificado',
          'Avaliacao especializada',
        ]),
      ]),
    ]},
    // ── Arterias Uterinas (imagem) ──
    { id: 'uta_1t', title: 'Arterias Uterinas — Imagens e Observacoes', fields: [
      select('uta_notch_1t', 'Incisura Protodiastolica (Notch)', [
        'Ausente bilateralmente', 'Unilateral', 'Bilateral',
      ]),
      area('uta_obs_1t', 'Observacoes sobre Arterias Uterinas'),
    ]},
    secConclusao,
  ],
};

export const morfologicoSegundoTrimestre: ReportTemplate = {
  id: 'morfologico_2t',
  name: 'Morfologico 2o Trimestre (18-24 semanas)',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['ISUOG mid-trimester 2022', 'ISUOG cardiac screening 2023'],
  sections: [
    secCabecalho,
    secDadosGestacao([txt('ig_2t', 'IG'), field('dpp_2t', 'DPP', 'date')]),
    secGestacaoMultipla,
    { id: 'morf2t_a', title: 'Feto A', fields: [
      makeFetoBiometria('a', 'Feto A'), makeLiquidoAmniotico('a', 'Feto A'), makePlacenta('a', 'Feto A'),
    ]},
    { id: 'cervix_2t_sec', title: 'Colo Uterino', fields: [
      num('cc_cervical_2t', 'Comprimento Cervical', 'mm'),
    ]},
    secConclusao,
  ],
};

export const avaliacaoCervical: ReportTemplate = {
  id: 'avaliacao_cervical',
  name: 'Avaliacao do Colo Uterino (Cervicometria)',
  version: '1.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: [
    'ISUOG Practice Guidelines: cervical assessment. UOG 2022',
    'FIGO Good Practice: cervical length screening. IJGO 2019',
    'Berghella V. Obstet Gynecol 2017 — cerclage meta-analysis',
  ],
  sections: [
    secCabecalho,
    secDadosGestacao([
      txt('ig_cervix', 'IG'),
      field('dpp_cervix', 'DPP', 'date'),
    ]),
    { id: 'indicacao_cervix', title: 'Indicacao e Historia', fields: [
      multiselect('ind_cervix', 'Indicacao', [
        'Rastreamento de rotina (19-24 semanas)', 'Historia de parto pretermino',
        'Conizacao / LEEP previa', 'Cerclagem previa', 'Incompetencia istmo-cervical',
        'Gestacao multipla', 'Encurtamento em exame anterior',
        'Contracao / ameaca de parto pretermino', 'Seguimento apos progesterona',
      ]),
      select('hx_parto_pretermino', 'Historia de Parto Pretermino Espontaneo', [
        'Nenhum', '1 parto < 37 semanas', '1 parto < 34 semanas',
        '2+ partos pretermos', 'Perda de 2o trimestre (16-24 semanas)',
      ], { guideline: 'ISUOG — principal fator de risco para colo curto' }),
      select('cirurgia_cervical', 'Cirurgia Cervical Previa', [
        'Nenhuma', 'Conizacao a frio', 'LEEP/CAF', 'Traquelectomia', 'Cerclagem previa',
      ]),
      select('uso_progesterona', 'Uso de Progesterona', [
        'Nao', 'Progesterona vaginal (200mg/noite)',
        'Progesterona vaginal (100mg)', 'Caproato de 17-OHP IM semanal',
      ]),
      bool('cerclagem_insitu', 'Cerclagem in situ'),
    ]},
    { id: 'medida_cervical', title: 'Medida Cervical (TVU)', fields: [
      select('tecnica_cervix', 'Tecnica', [
        'TVU — bexiga vazia, sem pressao, 3+ medidas, menor valor',
        'Transabdominal (complementar)',
        'TVU nao possivel — via transabdominal apenas',
      ], { required: true, guideline: 'ISUOG — TVU padrao; bexiga vazia; imagem sagital; 3 min observacao' }),
      num('cc_medida_1', 'Medida 1', 'mm', { required: true }),
      num('cc_medida_2', 'Medida 2', 'mm'),
      num('cc_medida_3', 'Medida 3', 'mm'),
      num('cc_menor', 'Menor Medida (utilizada)', 'mm', { required: true, guideline: 'ISUOG — usar a menor das 3 medidas' }),
      select('cc_classificacao', 'Classificacao do Comprimento', [
        'Normal (>= 25mm)', 'Encurtado (15-24mm) — zona de alerta',
        'Curto (< 15mm) — alto risco', 'Muito curto (< 10mm) — risco critico',
        'Dilatado / sem canal — incompetencia cervical',
      ], { required: true, guideline: 'ISUOG/FIGO — < 25mm: risco aumentado de parto pretermino' }),
    ]},
    { id: 'morfologia_cervical', title: 'Morfologia do Colo', fields: [
      select('orificio_int_cervix', 'Orificio Cervical Interno (OCI)', [
        'Fechado', 'Aberto (dilatacao <= 5mm)', 'Aberto (dilatacao > 5mm)', 'Indeterminado',
      ], { required: true }),
      select('funneling', 'Funneling / Afunilamento', [
        'Ausente', 'Presente — em forma de Y', 'Presente — em forma de V',
        'Presente — em forma de U (grave)', 'Herniacao de membranas',
      ], { required: true, guideline: 'ISUOG — funneling: sinal de incompetencia; medir comprimento funcional' }),
      num('funneling_comp', 'Comprimento do Funnel', 'mm'),
      num('cc_funcional', 'Comprimento Cervical Funcional', 'mm', {
        guideline: 'ISUOG — do OCI ao inicio do funnel (se presente)',
      }),
      select('sludge', 'Sludge no Canal Cervical', [
        'Ausente', 'Presente — debris ecogenicos no canal',
      ], { guideline: 'Sludge: associado a risco aumentado de PPT e corioamnionite' }),
      select('dynamic_changes', 'Alteracoes Dinamicas (3 min observacao)', [
        'Ausentes — colo estavel', 'Encurtamento transitorio com pressao fudica',
        'Funneling intermitente', 'Encurtamento progressivo durante o exame',
      ], { guideline: 'ISUOG — observar 3 min; pressao fudica opcional' }),
    ]},
    { id: 'risco_conduta_cervix', title: 'Avaliacao de Risco e Conduta', fields: [
      select('risco_ppt', 'Risco de Parto Pretermino', [
        'Baixo — CC >= 25mm, sem fatores de risco',
        'Intermediario — CC 15-24mm ou fatores de risco isolados',
        'Alto — CC < 15mm, ou CC < 25mm + historia de PPT',
        'Muito alto — CC < 10mm ou funneling com historia',
      ], { required: true }),
      select('conduta_cervix', 'Conduta Recomendada', [
        'Seguimento de rotina — rastreamento na morfo 2T',
        'Repeticao em 2 semanas — monitoramento seriado',
        'Iniciar progesterona vaginal (200mg/noite)',
        'Progesterona + monitoramento seriado a cada 2 semanas',
        'Avaliacao para cerclagem (< 24 semanas + historia)',
        'Pessario cervical — avaliar indicacao',
        'Internacao + corticoide (se viabilidade fetal)',
        'Encaminhar para centro de referencia',
      ], { guideline: 'FIGO 2019 — progesterona se < 25mm singleton; cerclagem se < 25mm + hx PPT' }),
      num('retorno_semanas', 'Retorno para reavaliacao em', 'semanas'),
      area('obs_cervix', 'Observacoes e plano individualizado'),
    ]},
    secConclusao,
  ],
};

export const ecocardiografiaFetal: ReportTemplate = {
  id: 'eco_fetal',
  name: 'Ecocardiografia Fetal',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['ISUOG cardiac 2023', 'ASE fetal echo 2023'],
  sections: [
    secCabecalho,
    { id: 'dados_eco', title: 'Dados', fields: [
      num('num_fetos_eco', 'Numero de Fetos', undefined, { required: true, min: 1, max: 4 }),
      txt('ig_eco', 'IG'),
    ]},
    secGestacaoMultipla,
    { id: 'eco_a', title: 'Feto A — Ecocardiografia', fields: [
      num('feto_a_fcf_eco', 'FCF', 'bpm', { required: true }),
      select('feto_a_ritmo_eco', 'Ritmo', ['Regular e sinusal', 'Extrassistolia', 'TSV', 'Bradicardia', 'Bloqueio AV'], { required: true }),
      select('feto_a_situs_eco', 'Situs', ['Solitus', 'Inversus', 'Ambiguus'], { required: true }),
      num('feto_a_eixo_eco', 'Eixo Cardiaco', 'graus', { required: true }),
      select('feto_a_4c_eco', '4 Camaras', ['Normal', 'Desequilibrio', 'DSAV suspeito', 'Nao avaliavel'], { required: true }),
      select('feto_a_vstd_eco', 'VSTD', ['Normal', 'Alterado'], { required: true }),
      select('feto_a_vste_eco', 'VSTE', ['Normal', 'Alterado'], { required: true }),
      select('feto_a_3vt_eco', '3VT', ['Normal', 'Alterado'], { required: true }),
    ]},
    secConclusao,
  ],
};

export const neurossonografiaFetal: ReportTemplate = {
  id: 'neuro_fetal',
  name: 'Neurossonografia Fetal',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['ISUOG neurosonography 2007', 'SMFM ventriculomegaly 2020'],
  sections: [
    secCabecalho,
    { id: 'dados_neuro', title: 'Dados', fields: [
      num('num_fetos_neuro', 'Numero de Fetos', undefined, { required: true, min: 1, max: 4 }),
      txt('ig_neuro', 'IG'),
    ]},
    secGestacaoMultipla,
    { id: 'neuro_a', title: 'Feto A — Neurosonografia', fields: [
      num('feto_a_atrio_d', 'Atrio VL D', 'mm', { required: true }),
      num('feto_a_atrio_e', 'Atrio VL E', 'mm', { required: true }),
      select('feto_a_csp_neuro', 'Cavum Septo Pelucido', ['Presente', 'Ausente — AgCC?', 'Amplo'], { required: true }),
      num('feto_a_cer_dt_neuro', 'Diam. Transverso Cerebelar', 'mm', { required: true }),
      num('feto_a_cm_neuro', 'Cisterna Magna', 'mm', { required: true }),
      select('feto_a_vermis_neuro', 'Vermis Cerebelar', ['Normal', 'Hipoplasico', 'Ausente — Dandy-Walker'], { required: true }),
      select('feto_a_cc_neuro_c', 'Corpo Caloso', ['Completo', 'Agenesia total', 'Agenesia parcial', 'Nao avaliavel'], { required: true }),
    ]},
    secConclusao,
  ],
};

export const perfilBiofisicoFetal: ReportTemplate = {
  id: 'pbf',
  name: 'Perfil Biofisico Fetal (PBF)',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'obstetrica',
  guideline_refs: ['Manning 1980', 'ACOG PB 145'],
  sections: [
    secCabecalho,
    { id: 'dados_pbf', title: 'Dados', fields: [
      num('num_fetos_pbf', 'Numero de Fetos', undefined, { required: true, min: 1, max: 4 }),
      txt('ig_pbf', 'IG'),
      num('duracao_pbf', 'Duracao da Observacao', 'minutos'),
    ]},
    secGestacaoMultipla,
    { id: 'pbf_a', title: 'Feto A — PBF', fields: [
      select('feto_a_mrf_pts', 'Mov. Respiratorios', ['2 — Normal', '0 — Alterado'], { required: true }),
      select('feto_a_mfg_pts', 'Mov. Fetais Globais', ['2 — Normal', '0 — Alterado'], { required: true }),
      select('feto_a_tf_pts', 'Tonus Fetal', ['2 — Normal', '0 — Alterado'], { required: true }),
      num('feto_a_mbv_pbf', 'MBV', 'cm', { required: true }),
      select('feto_a_la_pts', 'Liquido Amniotico', ['2 — Normal (MBV >= 2cm)', '0 — Alterado (MBV < 2cm)'], { required: true }),
      select('feto_a_ctg_pts', 'CTG', ['2 — Reativo', '0 — Nao reativo', 'N/A — nao realizado']),
      num('feto_a_pontuacao', 'Pontuacao Total', undefined, { required: true, min: 0, max: 10 }),
      select('feto_a_interp_pbf', 'Interpretacao', [
        '10/10 ou 8/10 (LA normal) — risco baixo',
        '8/10 (LA reduzido) — comprometimento cronico',
        '6/10 — equivocado; repetir em 24h',
        '4/10 — asfixia possivel',
        '2/10 — asfixia quase certa',
        '0/10 — asfixia certa',
      ], { required: true }),
    ]},
    secConclusao,
  ],
};

// ══════════════════════════════════════════════════════════════
// TEMPLATES GINECOLÓGICOS
// ══════════════════════════════════════════════════════════════

export const pelvicoTransvaginal: ReportTemplate = {
  id: 'pelvico_tv',
  name: 'Pelvico Transvaginal',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ISUOG uterus/ovaries 2011', 'IOTA 2013'],
  sections: [
    secCabecalho,
    { id: 'utero_gine', title: 'Utero', fields: [
      select('utero_posicao', 'Posicao', ['AVF', 'RVF', 'Antevertido', 'Retrovertido', 'Axial']),
      txt('utero_dimensoes', 'Dimensoes (L x AP x T)', 'Ex.: 7,0 x 3,5 x 4,2 cm'),
      select('utero_miometrio', 'Miometrio', ['Homogeneo', 'Heterogeneo', 'Adenomiose focal', 'Adenomiose difusa']),
      area('miomas_desc', 'Miomas', 'Ausentes / Presentes'),
    ]},
    { id: 'endometrio_gine', title: 'Endometrio', fields: [
      num('em_espessura', 'Espessura (eco duplo)', 'mm', { required: true }),
      select('em_aspecto', 'Aspecto', [
        'Normal para a fase', 'Trilaminar', 'Homogeneo hiperecogenico',
        'Hiperecogenico focal — polipo?', 'Irregularmente espessado',
      ], { required: true }),
    ]},
    { id: 'ovario_d_gine', title: 'Ovario Direito', fields: [
      bool('od_vis', 'Visualizado'),
      txt('od_dimensoes', 'Dimensoes'),
      num('od_volume', 'Volume', 'cm3'),
      select('od_aspecto', 'Aspecto', [
        'Normal', 'Folículo dominante', 'Corpo luteo', 'Cisto simples',
        'Endometrioma suspeito', 'Teratoma suspeito', 'Massa complexa — IOTA',
      ]),
    ]},
    { id: 'ovario_e_gine', title: 'Ovario Esquerdo', fields: [
      bool('oe_vis', 'Visualizado'),
      txt('oe_dimensoes', 'Dimensoes'),
      num('oe_volume', 'Volume', 'cm3'),
      select('oe_aspecto', 'Aspecto', [
        'Normal', 'Cisto simples', 'Endometrioma suspeito', 'Teratoma suspeito', 'Massa complexa',
      ]),
    ]},
    { id: 'pelve_gine', title: 'Pelve', fields: [
      select('liquido_fds', 'Liquido Fundo de Saco', ['Ausente', 'Pequena quantidade', 'Moderada', 'Grande']),
    ]},
    secConclusao,
  ],
};

export const pelvicoEndometriose: ReportTemplate = {
  id: 'pelvico_endometriose',
  name: 'Pelvico TV — Endometriose',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['IDEA/ISUOG 2016', 'SRU 2024'],
  sections: [
    secCabecalho,
    { id: 'preparo', title: 'Preparo e Tecnica', fields: [
      select('preparo_intestinal', 'Preparo Intestinal', ['Realizado', 'Nao realizado', 'Parcial']),
      select('sliding_sign', 'Sliding Sign', [
        'Positivo bilateral', 'Negativo bilateral — obliteracao', 'Negativo unilateral', 'Indeterminado',
      ], { required: true }),
    ]},
    { id: 'compartimento_post', title: 'Compartimento Posterior', fields: [
      select('fds_posterior', 'Fundo de Saco', ['Patente', 'Parcialmente obliterado', 'Totalmente obliterado'], { required: true }),
      select('lus', 'Ligamentos Uterossacros', ['Nao espessados', 'Espessados D', 'Espessados E', 'Bilateral', 'Nodulo D', 'Nodulo E'], { required: true }),
      select('retossigmoide', 'Retossigmoide', ['Nao comprometido', 'Nodulo intestinal', 'Espessamento de parede'], { required: true }),
    ]},
    { id: 'compartimento_ant', title: 'Compartimento Anterior', fields: [
      select('bexiga_endo', 'Bexiga', ['Normal', 'Implante parede posterior', 'Invasao mucosa']),
    ]},
    secConclusao,
  ],
};

export const mamas: ReportTemplate = {
  id: 'mamas',
  name: 'Mamas (incluindo Axilas)',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ACR BI-RADS 5th Ed. 2013', 'NCCN 2024'],
  sections: [
    secCabecalho,
    { id: 'mama_d', title: 'Mama Direita', fields: [
      select('md_geral', 'Aspecto Geral', ['Normal', 'Lesao focal', 'Espessamento focal', 'Cistos difusos']),
      txt('md_lesao_dim', 'Lesao — Dimensoes'),
      select('md_birads', 'BI-RADS Lesao', [
        'BI-RADS 1', 'BI-RADS 2', 'BI-RADS 3', 'BI-RADS 4A', 'BI-RADS 4B', 'BI-RADS 4C', 'BI-RADS 5', 'BI-RADS 6',
      ]),
    ]},
    { id: 'mama_e', title: 'Mama Esquerda', fields: [
      select('me_geral', 'Aspecto Geral', ['Normal', 'Lesao focal', 'Espessamento focal', 'Cistos difusos']),
      txt('me_lesao_dim', 'Lesao — Dimensoes'),
      select('me_birads', 'BI-RADS Lesao', [
        'BI-RADS 1', 'BI-RADS 2', 'BI-RADS 3', 'BI-RADS 4A', 'BI-RADS 4B', 'BI-RADS 4C', 'BI-RADS 5', 'BI-RADS 6',
      ]),
    ]},
    { id: 'axilas', title: 'Axilas', fields: [
      select('axila_d', 'Axila D', ['Sem linfonodomegalia', 'Linfonodo reativo', 'Linfonodo suspeito']),
      select('axila_e', 'Axila E', ['Sem linfonodomegalia', 'Linfonodo reativo', 'Linfonodo suspeito']),
    ]},
    { id: 'birads_final', title: 'BI-RADS Final', fields: [
      select('birads_final', 'Categoria Final', [
        'BI-RADS 0 — Incompleto', 'BI-RADS 1 — Negativo', 'BI-RADS 2 — Benigno',
        'BI-RADS 3 — Provavelmente benigno', 'BI-RADS 4A — Baixa suspeita',
        'BI-RADS 4B — Suspeita intermediaria', 'BI-RADS 4C — Moderadamente suspeito',
        'BI-RADS 5 — Altamente suspeito', 'BI-RADS 6 — Malignidade conhecida',
      ], { required: true }),
    ]},
    secConclusao,
  ],
};

export const tireoide: ReportTemplate = {
  id: 'tireoide',
  name: 'Tireoide',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ACR TI-RADS 2017', 'ATA 2015'],
  sections: [
    secCabecalho,
    { id: 'glandula', title: 'Glandula Tireoide', fields: [
      txt('ld_dim', 'Lobo D — Dimensoes'),
      num('ld_vol', 'Volume Lobo D', 'mL'),
      txt('le_dim', 'Lobo E — Dimensoes'),
      num('le_vol', 'Volume Lobo E', 'mL'),
      num('istmo_esp', 'Istmo — Espessura', 'mm'),
      num('vol_total', 'Volume Total', 'mL'),
      select('ecotextura', 'Ecotextura', ['Homogenea', 'Heterogenea — Hashimoto?', 'Heterogenea — Graves?', 'Nodular']),
    ]},
    { id: 'nodulos', title: 'Nodulos', fields: [
      select('num_nodulos', 'Numero', ['Nenhum', '1', '2', '3', '4+']),
      grp('nodulo_1', 'Nodulo 1', [
        select('n1_local', 'Localizacao', ['Lobo D superior', 'Lobo D medio', 'Lobo D inferior', 'Lobo E superior', 'Lobo E medio', 'Lobo E inferior', 'Istmo']),
        txt('n1_dim', 'Dimensoes'),
        num('n1_pts', 'Pontuacao TI-RADS', undefined, { min: 0, max: 11 }),
        select('n1_tirads', 'Categoria', ['TR1', 'TR2', 'TR3', 'TR4', 'TR5'], { required: true }),
      ]),
    ]},
    secConclusao,
  ],
};

export const abdomeTotal: ReportTemplate = {
  id: 'abdome_total',
  name: 'Abdome Total',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ACR/SRU guidelines'],
  sections: [
    secCabecalho,
    { id: 'figado', title: 'Figado', fields: [
      num('figado_lsc', 'Lobo D (LSC)', 'cm'),
      select('figado_asp', 'Aspecto', ['Normal', 'Esteatose leve', 'Esteatose mod/grave', 'Heterogeneo — cirrose?', 'Lesao focal']),
    ]},
    { id: 'vb', title: 'Vesicula e Vias Biliares', fields: [
      select('vesicula', 'Vesicula', ['Normal', 'Colecistolitiase', 'Barro biliar', 'Paredes espessadas', 'Ausente (pos-colecistectomia)']),
      num('coledoco', 'Coledoco — Diametro', 'mm'),
    ]},
    { id: 'rins', title: 'Rins', fields: [
      txt('rim_d', 'Rim Direito'),
      txt('rim_e', 'Rim Esquerdo'),
    ]},
    { id: 'baco', title: 'Baco', fields: [
      num('baco_dim', 'Maior Dimensao', 'cm'),
      select('baco_asp', 'Aspecto', ['Normal', 'Esplenomegalia leve', 'Esplenomegalia moderada']),
    ]},
    secConclusao,
  ],
};

export const rinsViasUrinarias: ReportTemplate = {
  id: 'rins_vu',
  name: 'Rins e Vias Urinarias',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ACR flank pain criteria'],
  sections: [
    secCabecalho,
    { id: 'rim_d', title: 'Rim Direito', fields: [
      num('rd_comp', 'Comprimento', 'cm'),
      num('rd_parenc', 'Parenquima', 'mm'),
      select('rd_pelve', 'Pelve Renal', ['Normal', 'Pieloectasia', 'Hidronefrose leve', 'Hidronefrose moderada', 'Hidronefrose grave']),
      select('rd_calc', 'Calculos', ['Ausentes', 'Nefrolitiase']),
    ]},
    { id: 'rim_e', title: 'Rim Esquerdo', fields: [
      num('re_comp', 'Comprimento', 'cm'),
      num('re_parenc', 'Parenquima', 'mm'),
      select('re_pelve', 'Pelve Renal', ['Normal', 'Pieloectasia', 'Hidronefrose leve', 'Hidronefrose moderada', 'Hidronefrose grave']),
      select('re_calc', 'Calculos', ['Ausentes', 'Nefrolitiase']),
    ]},
    { id: 'bexiga_ru', title: 'Bexiga', fields: [
      select('bexiga_ru_asp', 'Aspecto', ['Normal', 'Paredes espessadas', 'Trabeculada', 'Litiase']),
      num('residuo_ru', 'Residuo Pos-miccional', 'mL'),
    ]},
    secConclusao,
  ],
};

export const abdomeInferior: ReportTemplate = {
  id: 'abdome_inferior',
  name: 'Abdome Inferior',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ACR/SRU guidelines'],
  sections: [
    secCabecalho,
    { id: 'bexiga_ai', title: 'Bexiga', fields: [
      select('bexiga_ai', 'Aspecto', ['Normal', 'Paredes espessadas', 'Litiase', 'Lesao mural']),
    ]},
    { id: 'orgaos_pelve', title: 'Orgaos Pelvicos', fields: [
      txt('utero_ai', 'Utero'),
      txt('ovario_d_ai', 'Ovario D'),
      txt('ovario_e_ai', 'Ovario E'),
    ]},
    secConclusao,
  ],
};

export const dopplerGinecologico: ReportTemplate = {
  id: 'doppler_gine',
  name: 'Dopplervelocimetria Ginecologica',
  version: '2.0',
  reviewed_at: '2025-04',
  category: 'ginecologica',
  guideline_refs: ['ISUOG Doppler gynecology', 'IOTA'],
  sections: [
    secCabecalho,
    { id: 'doppler_utero_gine', title: 'Doppler Uterino', fields: [
      num('uta_ip_d_gine', 'IP AUt D'), num('uta_ip_e_gine', 'IP AUt E'),
      num('uta_ip_med_gine', 'IP Medio'),
    ]},
    { id: 'doppler_ovarico', title: 'Doppler Ovarico', fields: [
      num('ip_ov_d', 'IP Estroma Ovario D'), num('ip_ov_e', 'IP Estroma Ovario E'),
    ]},
    secConclusao,
  ],
};

// ══════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════

export const reportTemplates: Record<string, ReportTemplate> = {
  [obstetricoInicial.id]: obstetricoInicial,
  [obstetrico.id]: obstetrico,
  [dopplerObstetrico.id]: dopplerObstetrico,
  [morfologicoPrimeiroTrimestre.id]: morfologicoPrimeiroTrimestre,
  [morfologicoSegundoTrimestre.id]: morfologicoSegundoTrimestre,
  [avaliacaoCervical.id]: avaliacaoCervical,
  [ecocardiografiaFetal.id]: ecocardiografiaFetal,
  [neurossonografiaFetal.id]: neurossonografiaFetal,
  [perfilBiofisicoFetal.id]: perfilBiofisicoFetal,
  [pelvicoTransvaginal.id]: pelvicoTransvaginal,
  [pelvicoEndometriose.id]: pelvicoEndometriose,
  [abdomeInferior.id]: abdomeInferior,
  [abdomeTotal.id]: abdomeTotal,
  [rinsViasUrinarias.id]: rinsViasUrinarias,
  [mamas.id]: mamas,
  [tireoide.id]: tireoide,
  [dopplerGinecologico.id]: dopplerGinecologico,
};

export const templatesByCategory = {
  obstetrica: [
    obstetricoInicial, obstetrico, dopplerObstetrico, morfologicoPrimeiroTrimestre,
    morfologicoSegundoTrimestre, avaliacaoCervical, ecocardiografiaFetal, neurossonografiaFetal, perfilBiofisicoFetal,
  ],
  ginecologica: [
    pelvicoTransvaginal, pelvicoEndometriose, abdomeInferior, abdomeTotal,
    rinsViasUrinarias, mamas, tireoide, dopplerGinecologico,
  ],
};

export const ALL_TEMPLATE_IDS = Object.keys(reportTemplates);
export default reportTemplates;
