/**
 * Mapeamento CEP (5 primeiros dígitos) → faixa de renda estimada e zona.
 * Baseado em dados agregados do Censo IBGE 2022 por setor censitário.
 * Faixas: A (>15SM), B (5-15SM), C (3-5SM), D (1-3SM), E (<1SM)
 *
 * NOTA: Dados aproximados para fins de pesquisa anonimizada.
 * Não usar para decisões individuais — apenas análises populacionais.
 */

// ── Rio de Janeiro (20000-26600) ──
const RJ_CEP_MAP: Record<string, { incomeEstimate: string; zone: string; neighborhood: string }> = {
  // Zona Sul
  '22010': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22020': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22030': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22040': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22041': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22050': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22060': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Copacabana' },
  '22070': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Leme' },
  '22080': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Botafogo' },
  '22210': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Botafogo' },
  '22220': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Botafogo' },
  '22230': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Botafogo' },
  '22240': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Botafogo' },
  '22250': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Botafogo' },
  '22260': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Urca' },
  '22270': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Laranjeiras' },
  '22280': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Flamengo' },
  '22290': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Flamengo' },
  '22410': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Ipanema' },
  '22411': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Ipanema' },
  '22420': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Ipanema' },
  '22421': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Ipanema' },
  '22430': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Leblon' },
  '22431': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Leblon' },
  '22440': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Leblon' },
  '22450': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Gavea' },
  '22451': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Gavea' },
  '22460': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Gavea' },
  '22461': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Jardim Botanico' },
  '22470': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Jardim Botanico' },
  '22610': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Sao Conrado' },
  '22620': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Sao Conrado' },
  '22630': { incomeEstimate: 'B', zone: 'Zona Sul', neighborhood: 'Rocinha' },
  '22640': { incomeEstimate: 'B', zone: 'Zona Sul', neighborhood: 'Vidigal' },
  // Zona Norte
  '20000': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Centro' },
  '20010': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Centro' },
  '20020': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Centro' },
  '20030': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Centro' },
  '20040': { incomeEstimate: 'B', zone: 'Centro', neighborhood: 'Centro' },
  '20050': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Centro' },
  '20210': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Lapa' },
  '20220': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Lapa' },
  '20230': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Santa Teresa' },
  '20240': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Santa Teresa' },
  '20250': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Estacio' },
  '20260': { incomeEstimate: 'C', zone: 'Centro', neighborhood: 'Estacio' },
  '20500': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Tijuca' },
  '20510': { incomeEstimate: 'B', zone: 'Zona Norte', neighborhood: 'Tijuca' },
  '20511': { incomeEstimate: 'B', zone: 'Zona Norte', neighborhood: 'Tijuca' },
  '20520': { incomeEstimate: 'B', zone: 'Zona Norte', neighborhood: 'Tijuca' },
  '20521': { incomeEstimate: 'B', zone: 'Zona Norte', neighborhood: 'Tijuca' },
  '20530': { incomeEstimate: 'B', zone: 'Zona Norte', neighborhood: 'Maracana' },
  '20710': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Sao Cristovao' },
  '20720': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Benfica' },
  '20730': { incomeEstimate: 'D', zone: 'Zona Norte', neighborhood: 'Mangueira' },
  '20910': { incomeEstimate: 'D', zone: 'Zona Norte', neighborhood: 'Meier' },
  '20911': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Meier' },
  '21210': { incomeEstimate: 'D', zone: 'Zona Norte', neighborhood: 'Del Castilho' },
  '21310': { incomeEstimate: 'D', zone: 'Zona Norte', neighborhood: 'Penha' },
  '21510': { incomeEstimate: 'D', zone: 'Zona Norte', neighborhood: 'Madureira' },
  '21610': { incomeEstimate: 'D', zone: 'Zona Norte', neighborhood: 'Bangu' },
  '21710': { incomeEstimate: 'E', zone: 'Zona Norte', neighborhood: 'Campo Grande' },
  '21810': { incomeEstimate: 'E', zone: 'Zona Oeste', neighborhood: 'Santa Cruz' },
  // Zona Oeste / Barra
  '22790': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Barra da Tijuca' },
  '22793': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Barra da Tijuca' },
  '22795': { incomeEstimate: 'B', zone: 'Zona Oeste', neighborhood: 'Recreio' },
  '23500': { incomeEstimate: 'D', zone: 'Zona Oeste', neighborhood: 'Campo Grande' },
  '23510': { incomeEstimate: 'D', zone: 'Zona Oeste', neighborhood: 'Campo Grande' },
  // Niteroi
  '24020': { incomeEstimate: 'B', zone: 'Niteroi', neighborhood: 'Icarai' },
  '24210': { incomeEstimate: 'B', zone: 'Niteroi', neighborhood: 'Icarai' },
  '24220': { incomeEstimate: 'B', zone: 'Niteroi', neighborhood: 'Ingá' },
  '24230': { incomeEstimate: 'C', zone: 'Niteroi', neighborhood: 'Fonseca' },
};

// ── São Paulo (01000-09999) ──
const SP_CEP_MAP: Record<string, { incomeEstimate: string; zone: string; neighborhood: string }> = {
  '01000': { incomeEstimate: 'B', zone: 'Centro', neighborhood: 'Se' },
  '01010': { incomeEstimate: 'B', zone: 'Centro', neighborhood: 'Se' },
  '01310': { incomeEstimate: 'A', zone: 'Centro', neighborhood: 'Paulista' },
  '01311': { incomeEstimate: 'A', zone: 'Centro', neighborhood: 'Paulista' },
  '01400': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Jardins' },
  '01401': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Jardins' },
  '01410': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Jardins' },
  '01420': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Jardins' },
  '01430': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Jardins' },
  '04500': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Moema' },
  '04510': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Moema' },
  '04520': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Vila Nova Conceicao' },
  '04530': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Itaim Bibi' },
  '04540': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Itaim Bibi' },
  '04550': { incomeEstimate: 'A', zone: 'Zona Sul', neighborhood: 'Itaim Bibi' },
  '05400': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Pinheiros' },
  '05410': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Pinheiros' },
  '05420': { incomeEstimate: 'A', zone: 'Zona Oeste', neighborhood: 'Vila Madalena' },
  '05000': { incomeEstimate: 'B', zone: 'Zona Oeste', neighborhood: 'Perdizes' },
  '05010': { incomeEstimate: 'B', zone: 'Zona Oeste', neighborhood: 'Perdizes' },
  '02000': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Santana' },
  '02010': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Santana' },
  '02020': { incomeEstimate: 'C', zone: 'Zona Norte', neighborhood: 'Santana' },
  '03000': { incomeEstimate: 'D', zone: 'Zona Leste', neighborhood: 'Bras' },
  '03100': { incomeEstimate: 'D', zone: 'Zona Leste', neighborhood: 'Mooca' },
  '03300': { incomeEstimate: 'D', zone: 'Zona Leste', neighborhood: 'Tatuape' },
  '03400': { incomeEstimate: 'C', zone: 'Zona Leste', neighborhood: 'Tatuape' },
  '08000': { incomeEstimate: 'D', zone: 'Zona Leste', neighborhood: 'Sao Miguel' },
  '08100': { incomeEstimate: 'E', zone: 'Zona Leste', neighborhood: 'Itaim Paulista' },
  '04800': { incomeEstimate: 'D', zone: 'Zona Sul', neighborhood: 'Santo Amaro' },
  '04900': { incomeEstimate: 'E', zone: 'Zona Sul', neighborhood: 'Interlagos' },
};

// Merge all maps
const FULL_MAP: Record<string, { incomeEstimate: string; zone: string; neighborhood: string }> = {
  ...RJ_CEP_MAP,
  ...SP_CEP_MAP,
};

/**
 * Lookup CEP parcial (5 dígitos) → dados socioeconômicos estimados.
 * Retorna null se CEP não encontrado no mapa.
 */
export function lookupCepIncome(zipCodePartial: string | null): {
  incomeEstimate: string;
  zone: string;
  neighborhood: string;
} | null {
  if (!zipCodePartial) return null;
  const clean = zipCodePartial.replace(/\D/g, '').substring(0, 5);
  if (clean.length < 5) return null;

  // Tenta match exato
  if (FULL_MAP[clean]) return FULL_MAP[clean];

  // Tenta match com 4 dígitos + fallback para faixa genérica por estado
  const prefix3 = clean.substring(0, 3);
  const stateIncome = getStateIncomeEstimate(prefix3);
  if (stateIncome) return stateIncome;

  return null;
}

function getStateIncomeEstimate(prefix3: string): { incomeEstimate: string; zone: string; neighborhood: string } | null {
  const num = parseInt(prefix3);
  // Faixas genéricas por estado quando CEP específico não encontrado
  if (num >= 10 && num <= 99) return { incomeEstimate: 'C', zone: 'SP Capital', neighborhood: 'SP' };
  if (num >= 200 && num <= 266) return { incomeEstimate: 'C', zone: 'RJ Capital', neighborhood: 'RJ' };
  if (num >= 300 && num <= 399) return { incomeEstimate: 'C', zone: 'MG', neighborhood: 'MG' };
  if (num >= 400 && num <= 489) return { incomeEstimate: 'D', zone: 'BA', neighborhood: 'BA' };
  if (num >= 500 && num <= 569) return { incomeEstimate: 'D', zone: 'PE', neighborhood: 'PE' };
  if (num >= 600 && num <= 639) return { incomeEstimate: 'D', zone: 'CE', neighborhood: 'CE' };
  if (num >= 640 && num <= 659) return { incomeEstimate: 'D', zone: 'PI', neighborhood: 'PI' };
  if (num >= 660 && num <= 688) return { incomeEstimate: 'D', zone: 'MA', neighborhood: 'MA' };
  if (num >= 690 && num <= 692) return { incomeEstimate: 'D', zone: 'PA', neighborhood: 'PA' };
  if (num >= 700 && num <= 727) return { incomeEstimate: 'B', zone: 'DF', neighborhood: 'DF' };
  if (num >= 740 && num <= 769) return { incomeEstimate: 'C', zone: 'GO', neighborhood: 'GO' };
  if (num >= 800 && num <= 879) return { incomeEstimate: 'C', zone: 'PR', neighborhood: 'PR' };
  if (num >= 880 && num <= 899) return { incomeEstimate: 'C', zone: 'SC', neighborhood: 'SC' };
  if (num >= 900 && num <= 999) return { incomeEstimate: 'C', zone: 'RS', neighborhood: 'RS' };
  return null;
}

export const INCOME_LABELS: Record<string, string> = {
  A: 'Classe A (>15 SM)',
  B: 'Classe B (5-15 SM)',
  C: 'Classe C (3-5 SM)',
  D: 'Classe D (1-3 SM)',
  E: 'Classe E (<1 SM)',
};
