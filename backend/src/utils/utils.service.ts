import { Injectable, BadRequestException } from '@nestjs/common';

const CLINICAL_OPTIONS = {
  comorbidities: [
    'Hipertensao Arterial (HAS)',
    'Diabetes Mellitus tipo 1',
    'Diabetes Mellitus tipo 2',
    'Hipotireoidismo',
    'Hipertireoidismo',
    'Lupus Eritematoso Sistemico (LES)',
    'Sindrome do Anticorpo Antifosfolipide (SAAF)',
    'Trombofilia hereditaria',
    'Cardiopatia',
    'Nefropatia',
    'Epilepsia',
    'Asma',
    'Depressao',
    'Ansiedade',
    'HIV/AIDS',
    'Hepatite B cronica',
    'Hepatite C cronica',
    'Obesidade',
    'Sindrome dos Ovarios Policisticos (SOP)',
    'Endometriose',
    'Outros',
  ],
  allergies: [
    'Penicilina',
    'Amoxicilina',
    'Dipirona',
    'AAS/Aspirina',
    'Anti-inflamatorios (AINEs)',
    'Sulfas',
    'Contraste iodado',
    'Latex',
    'Frutos do mar',
    'Amendoim',
    'Leite/Lactose',
    'Gluten',
    'Outros',
  ],
  addictions: [
    'Tabagismo ativo',
    'Tabagismo passivo',
    'Ex-tabagista',
    'Etilismo',
    'Uso de drogas ilicitas',
    'Outros',
  ],
  fetalMovementOptions: [
    'Presentes e ativos',
    'Presentes e hipoativos',
    'Ausentes',
    'Nao avaliado',
  ],
  fetalPresentations: [
    { value: 'nr', label: 'Nao realizado (NR)' },
    { value: 'cephalic', label: 'Cefalica' },
    { value: 'pelvic', label: 'Pelvica' },
    { value: 'transverse', label: 'Transversa' },
    { value: 'oblique', label: 'Obliqua' },
    { value: 'not_evaluated', label: 'Nao avaliado' },
  ],
  edemaOptions: [
    { value: 'absent', label: 'Ausente' },
    { value: '1plus', label: '+/4+ MMII' },
    { value: '2plus', label: '++/4+ MMII' },
    { value: '3plus', label: '+++/4+ MMII' },
    { value: '4plus', label: '++++/4+ (anasarca)' },
  ],
  cervicalPosition: ['posterior', 'medianized', 'anterior'],
  cervicalConsistency: ['firm', 'medium', 'soft'],
  fetalStation: ['high', 'intermediate', 'engaged'],
  membranes: ['intact', 'ruptured', 'not_evaluated'],
  umbilicalDoppler: ['normal', 'altered', 'not_performed'],
  biophysicalProfileOptions: [2, 4, 6, 8, 10],
  fhrStatus: [
    { value: 'present_normal', label: 'Presente e normal' },
    { value: 'tachycardia', label: 'Taquicardia (>160bpm)' },
    { value: 'bradycardia', label: 'Bradicardia (<110bpm)' },
    { value: 'arrhythmia', label: 'Arritmia' },
    { value: 'absent', label: 'Ausente' },
  ],
  bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  bloodTypeABO: ['A', 'B', 'AB', 'O'],
  bloodTypeRH: ['positive', 'negative'],
  hemoglobinElectrophoresis: [
    'AA', 'AS', 'AC', 'SS', 'SC', 'CC', 'AD', 'AE', 'not_performed',
  ],
  maternalSymptoms: [
    'Cefaleia',
    'Tontura',
    'Nauseas',
    'Vomitos',
    'Epigastralgia',
    'Edema',
    'Sangramento',
    'Colicas',
    'Movimentos fetais diminuidos',
    'Corrimento',
    'Disuria',
    'Dispneia',
    'Outros',
  ],
  consultationComplaints: [
    'Sem queixas',
    'Cefaleia',
    'Tontura',
    'Nauseas e vomitos',
    'Azia/Refluxo',
    'Constipacao',
    'Edema de membros inferiores',
    'Dor lombar',
    'Cansaco/Fadiga',
    'Insonia',
    'Sangramento vaginal',
    'Corrimento vaginal',
    'Colicas',
    'Contracoes',
    'Movimentos fetais diminuidos',
    'Dispneia',
    'Outros',
  ],
  bpMeasurementLocations: [
    { value: 'home', label: 'Domicilio' },
    { value: 'consultation', label: 'Consultorio' },
    { value: 'pharmacy', label: 'Farmacia' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'other', label: 'Outro' },
  ],
  bpMeasurementMethods: [
    { value: 'manual', label: 'Esfigmomanometro manual' },
    { value: 'digital_wrist', label: 'Digital de pulso' },
    { value: 'digital_arm', label: 'Digital de braco' },
    { value: 'automatic_device', label: 'Aparelho automatico' },
  ],
  glucoseMoments: [
    { value: 'fasting', label: 'Jejum' },
    { value: 'post_breakfast_1h', label: 'Apos o cafe (1h)' },
    { value: 'post_breakfast_2h', label: 'Apos o cafe (2h)' },
    { value: 'pre_lunch', label: 'Antes do almoco' },
    { value: 'post_lunch_1h', label: 'Apos o almoco (1h)' },
    { value: 'post_lunch_2h', label: 'Apos o almoco (2h)' },
    { value: 'pre_dinner', label: 'Antes do jantar' },
    { value: 'post_dinner_1h', label: 'Apos o jantar (1h)' },
    { value: 'post_dinner_2h', label: 'Apos o jantar (2h)' },
    { value: 'bedtime', label: 'Antes de dormir' },
  ],
  ultrasoundTypes: [
    { value: 'obstetric_initial_tv', label: 'Obstetrico Transvaginal' },
    { value: 'morphological_1st', label: 'Morfologico 1o Trimestre' },
    { value: 'morphological_2nd', label: 'Morfologico 2o Trimestre' },
    { value: 'echodoppler', label: 'Ecodoppler Fetal' },
    { value: 'obstetric_doppler', label: 'Obstetrico com Doppler Colorido' },
    { value: 'biophysical_profile', label: 'Perfil Biofisico Fetal' },
    { value: 'other', label: 'Outro' },
  ],
};

@Injectable()
export class UtilsService {
  getClinicalOptions() {
    return CLINICAL_OPTIONS;
  }

  async lookupCep(cep: string) {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 digitos');
    }

    const response = await fetch(
      `https://viacep.com.br/ws/${cleaned}/json/`,
    );
    const data = await response.json();

    if (data.erro) {
      throw new BadRequestException('CEP nao encontrado');
    }

    return {
      address: data.logradouro || null,
      city: data.localidade || null,
      state: data.uf || null,
      zipCode: cleaned,
    };
  }
}
