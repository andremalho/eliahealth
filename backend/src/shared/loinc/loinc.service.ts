import { Injectable } from '@nestjs/common';

interface LoincEntry {
  name: string;
  loinc: string;
  tuss: string;
}

const TABLE: LoincEntry[] = [
  { name: 'Hemograma', loinc: '58410-2', tuss: '40304361' },
  { name: 'Glicemia jejum', loinc: '1558-6', tuss: '40302451' },
  { name: 'Glicemia pos prandial', loinc: '1521-4', tuss: '40302460' },
  { name: 'TOTG 75g', loinc: '20437-9', tuss: '40302478' },
  { name: 'TSH', loinc: '3016-3', tuss: '40302893' },
  { name: 'T4 livre', loinc: '3026-2', tuss: '40302906' },
  { name: 'HBsAg', loinc: '5196-1', tuss: '40303113' },
  { name: 'Anti-HBs', loinc: '16935-9', tuss: '40303121' },
  { name: 'Anti-HIV', loinc: '7917-8', tuss: '40303369' },
  { name: 'VDRL', loinc: '20507-9', tuss: '40303393' },
  { name: 'Toxoplasmose IgG', loinc: '6422-0', tuss: '40303741' },
  { name: 'Toxoplasmose IgM', loinc: '6425-3', tuss: '40303750' },
  { name: 'Rubeola IgG', loinc: '8013-5', tuss: '40303580' },
  { name: 'CMV IgG', loinc: '7852-7', tuss: '40303067' },
  { name: 'Streptococcus B', loinc: '21198-6', tuss: '40303598' },
  { name: 'Urina rotina', loinc: '24357-6', tuss: '40304175' },
  { name: 'Urocultura', loinc: '630-4', tuss: '40304183' },
  { name: 'Coombs indireto', loinc: '890-4', tuss: '40302630' },
  { name: 'Ferritina', loinc: '2276-4', tuss: '40302770' },
  { name: 'Plaquetas', loinc: '777-3', tuss: '40304361' },
  { name: 'TGO', loinc: '1920-8', tuss: '40302800' },
  { name: 'TGP', loinc: '1742-6', tuss: '40302819' },
  { name: 'DHL', loinc: '2532-0', tuss: '40302754' },
  { name: 'Acido urico', loinc: '3084-1', tuss: '40302370' },
  { name: 'Creatinina', loinc: '2160-0', tuss: '40302702' },
  { name: 'Proteinuria 24h', loinc: '2888-6', tuss: '40304230' },
  { name: 'Coagulograma', loinc: '34714-6', tuss: '40302649' },
  { name: 'Citologia oncotica', loinc: '10524-7', tuss: '40304281' },
  { name: 'Cultura vaginal', loinc: '11268-0', tuss: '40303555' },
  { name: 'Clamidia', loinc: '14510-2', tuss: '40303032' },
];

// Build search index
const byName = new Map<string, LoincEntry>();
const byLoinc = new Map<string, LoincEntry>();
for (const e of TABLE) {
  byName.set(e.name.toLowerCase(), e);
  byLoinc.set(e.loinc, e);
}

@Injectable()
export class LoincService {
  getAll(): LoincEntry[] {
    return TABLE;
  }

  findByName(name: string): LoincEntry | null {
    const lower = name.toLowerCase();
    // Exact match
    if (byName.has(lower)) return byName.get(lower)!;
    // Partial match
    for (const [key, entry] of byName) {
      if (lower.includes(key) || key.includes(lower)) return entry;
    }
    return null;
  }

  findByLoinc(code: string): LoincEntry | null {
    return byLoinc.get(code) ?? null;
  }

  enrichLabResult(labResult: Record<string, unknown>): Record<string, unknown> {
    const match = this.findByName(labResult.examName as string);
    if (match) {
      return { ...labResult, loincCode: match.loinc, tussCode: match.tuss };
    }
    return labResult;
  }
}
