export enum BloodTypeABO {
  A = 'A',
  B = 'B',
  AB = 'AB',
  O = 'O',
}

export enum BloodTypeRH {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

export enum HemoglobinElectrophoresis {
  AA = 'AA',
  AS = 'AS',
  AC = 'AC',
  SS = 'SS',
  SC = 'SC',
  CC = 'CC',
  AD = 'AD',
  AE = 'AE',
  NOT_PERFORMED = 'not_performed',
}

export const HEMOGLOBINOPATHY_RESULTS: ReadonlySet<string> = new Set([
  HemoglobinElectrophoresis.SS,
  HemoglobinElectrophoresis.SC,
  HemoglobinElectrophoresis.CC,
]);
