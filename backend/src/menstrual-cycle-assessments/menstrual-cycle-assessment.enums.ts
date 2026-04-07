export enum MenstrualComplaint {
  HEAVY_MENSTRUAL_BLEEDING = 'heavy_menstrual_bleeding',     // menorragia
  IRREGULAR_BLEEDING = 'irregular_bleeding',                 // sangramento irregular
  INTERMENSTRUAL_BLEEDING = 'intermenstrual_bleeding',       // metrorragia
  POSTCOITAL_BLEEDING = 'postcoital_bleeding',               // sangramento pós-coital
  AMENORRHEA_PRIMARY = 'amenorrhea_primary',                 // amenorreia primária
  AMENORRHEA_SECONDARY = 'amenorrhea_secondary',             // amenorreia secundária
  DYSMENORRHEA = 'dysmenorrhea',                             // dismenorreia
  PREMENSTRUAL_SYNDROME = 'premenstrual_syndrome',           // TPM
  PMDD = 'pmdd',                                             // TDPM
}

// Classificação FIGO 2011 para localização de leiomiomas
export enum LeiomyomaFIGO {
  SUBMUCOSAL_0 = 'submucosal_0',
  SUBMUCOSAL_1 = 'submucosal_1',
  SUBMUCOSAL_2 = 'submucosal_2',
  INTRAMURAL_3 = 'intramural_3',
  SUBSEROSAL_4 = 'subserosal_4',
  SUBSEROSAL_5 = 'subserosal_5',
  SUBSEROSAL_6 = 'subserosal_6',
  INTRALIGAMENTOUS_7 = 'intraligamentous_7',
  HYBRID_2_5 = 'hybrid_2_5',
  CERVICAL_8 = 'cervical_8',
}

export interface MenstrualCycleAlert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'urgent';
}

export interface PcosRotterdamCriteria {
  oligoAnovulation: boolean;
  hyperandrogenism: boolean;
  polycysticOvaries: boolean;
  criteriaCount: 0 | 1 | 2 | 3;
}
