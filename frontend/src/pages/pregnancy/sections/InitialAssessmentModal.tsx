import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { completeInitialAssessment, updatePatient } from '../../../api/pregnancies.api';
import api from '../../../api/client';
import { cn } from '../../../utils/cn';

interface Props {
  pregnancyId: string;
  patientId: string;
  initialWeightKg?: number | null;
  initialHeight?: number | null;
  patient?: any;
  pregnancy?: any;
  onClose: () => void;
}

function parseDefaults(patient: any, pregnancy: any, initialWeightKg?: number | null, initialHeight?: number | null) {
  const d: Partial<FormData> = {
    weightKg: initialWeightKg?.toString() ?? '',
    height: (initialHeight ?? patient?.height)?.toString() ?? '',
    gravida: (pregnancy?.gravida ?? 1).toString(),
    abortus: (pregnancy?.abortus ?? 0).toString(),
    para: (pregnancy?.para ?? 0).toString(),
    pv: (pregnancy?.vaginalDeliveries ?? 0).toString(),
    pc: (pregnancy?.cesareans ?? 0).toString(),
    pf: (pregnancy?.forcepsDeliveries ?? 0).toString(),
    familyHistory: patient?.familyHistory ?? '',
    surgeries: patient?.surgeries ?? '',
    medications: pregnancy?.currentMedications ?? '',
    gynecologicalNotes: pregnancy?.gynecologicalHistory ?? '',
    menarcheAge: patient?.menarcheAge?.toString() ?? '',
    menstrualCycle: patient?.menstrualCycle ?? '',
    dysmenorrhea: !!patient?.dysmenorrhea,
    hasAllergy: !!patient?.allergies,
    allergyText: patient?.allergies ?? '',
  };

  // Parse comorbidities (string list) back into checkboxes
  const coms: string[] = patient?.comorbiditiesSelected ?? [];
  for (const c of coms) {
    if (/Hipertens/i.test(c)) d.cmHas = true;
    else if (/Diabetes/i.test(c)) {
      d.cmDm = true;
      const m = c.match(/\((dm1|dm2|lada|mody)\)/i);
      if (m) d.cmDmSubtype = m[1].toLowerCase();
    }
    else if (/Dislipidemia/i.test(c)) d.cmDislipidemia = true;
    else if (/tireoid/i.test(c)) {
      d.cmThyroid = true;
      const m = c.match(/\((hipotireoidismo|hipertireoidismo|hashimoto|graves)\)/i);
      if (m) d.cmThyroidSubtype = m[1].toLowerCase();
    }
    else if (/Trombofil/i.test(c)) d.cmTrombo = true;
    else if (/Enxaqueca/i.test(c)) d.cmEnxaqueca = true;
    else if (/autoimune/i.test(c)) {
      d.cmAutoimmune = true;
      d.cmAutoimmuneText = c.replace(/^Doenças autoimunes:?\s*/i, '');
    }
    else if (/cardiovascul/i.test(c)) {
      d.cmCardio = true;
      d.cmCardioText = c.replace(/^Doenças cardiovasculares:?\s*/i, '');
    }
    else if (/respirat/i.test(c)) {
      d.cmRespiratory = true;
      d.cmRespiratoryText = c.replace(/^Doenças respiratórias:?\s*/i, '');
    }
    else if (/infecciosas crônicas/i.test(c)) {
      const list = c.replace(/^Doenças infecciosas crônicas:?\s*/i, '');
      if (/HIV/i.test(list)) d.cmInfHiv = true;
      if (/Hepatite B/i.test(list)) d.cmInfHepB = true;
      if (/Hepatite C/i.test(list)) d.cmInfHepC = true;
      if (/Tuberculose/i.test(list)) d.cmInfTb = true;
      if (/Sífilis/i.test(list)) d.cmInfSifilis = true;
    }
    else if (/psiqui/i.test(c)) {
      d.cmPsych = true;
      d.cmPsychText = c.replace(/^Doenças psiquiátricas:?\s*/i, '');
    }
    else if (/neurológ/i.test(c)) {
      d.cmNeuro = true;
      d.cmNeuroText = c.replace(/^Doenças neurológicas:?\s*/i, '');
    }
    else if (/renais/i.test(c)) {
      d.cmRenal = true;
      d.cmRenalText = c.replace(/^Doenças renais:?\s*/i, '');
    }
    else {
      d.cmOther = true;
      d.cmOtherText = (d.cmOtherText ? d.cmOtherText + '; ' : '') + c;
    }
  }

  // Addictions
  const adds: string[] = patient?.addictionsSelected ?? [];
  if (adds.some((a) => /Tabagismo/i.test(a))) d.habitSmoking = true;
  if (adds.some((a) => /Etilismo/i.test(a))) d.habitAlcohol = true;
  if (adds.some((a) => /drogas/i.test(a))) d.habitDrugs = true;

  // Patologias da gestacao atual
  const cur: string = pregnancy?.currentPathologies ?? '';
  if (/DMG/i.test(cur)) d.cgDmg = true;
  if (/Pré-eclâmpsia/i.test(cur)) d.cgPe = true;
  if (/Eclâmpsia(?!.*Pré)/i.test(cur)) d.cgEclampsia = true;
  if (/HELLP/i.test(cur)) d.cgHellp = true;
  if (/Colestase/i.test(cur)) d.cgColestase = true;
  if (/Hiperêmese/i.test(cur)) d.cgHiperemese = true;
  if (/ITU/i.test(cur)) d.cgItu = true;
  if (/RPMO/i.test(cur)) d.cgRpmo = true;
  if (/parto pré-termo/i.test(cur)) d.cgTpp = true;
  if (/Anemia/i.test(cur)) d.cgAnemia = true;

  return d;
}

interface FormData {
  // Antropometria
  weightKg: string;
  height: string;
  // Familiares
  familyHistory: string;
  // Obstetricos
  gravida: string;
  abortus: string;
  para: string;
  pv: string;
  pc: string;
  pf: string;
  // ── Antecedentes pessoais ──
  // Comorbidades
  cmHas: boolean;
  cmDm: boolean;
  cmDmSubtype: string;
  cmDislipidemia: boolean;
  cmThyroid: boolean;
  cmThyroidSubtype: string;
  cmTrombo: boolean;
  cmEnxaqueca: boolean;
  cmAutoimmune: boolean;
  cmAutoimmuneText: string;
  cmCardio: boolean;
  cmCardioText: string;
  cmRespiratory: boolean;
  cmRespiratoryText: string;
  cmInfHiv: boolean;
  cmInfHepB: boolean;
  cmInfHepC: boolean;
  cmInfTb: boolean;
  cmInfSifilis: boolean;
  cmInfOther: boolean;
  cmInfOtherText: string;
  cmPsych: boolean;
  cmPsychText: string;
  cmNeuro: boolean;
  cmNeuroText: string;
  cmRenal: boolean;
  cmRenalText: string;
  cmOther: boolean;
  cmOtherText: string;
  // Ginecologicos
  menarcheAge: string;
  menstrualCycle: string;
  dysmenorrhea: boolean;
  gynecologicalNotes: string;
  // Cirurgicos
  surgeries: string;
  // Patologias da gestacao atual
  cgDmg: boolean;
  cgPe: boolean;
  cgEclampsia: boolean;
  cgHellp: boolean;
  cgColestase: boolean;
  cgHiperemese: boolean;
  cgItu: boolean;
  cgRpmo: boolean;
  cgTpp: boolean;
  cgAnemia: boolean;
  cgOther: boolean;
  cgOtherText: string;
  // Habitos
  habitSmoking: boolean;
  habitAlcohol: boolean;
  habitDrugs: boolean;
  // Alergias
  hasAllergy: boolean;
  allergyText: string;
  // Medicacoes
  medications: string;
}

function calculateBmi(weight: number, heightCm: number): number {
  const m = heightCm / 100;
  return weight / (m * m);
}

function bmiCategory(bmi: number): { label: string; cls: string } {
  if (bmi < 18.5) return { label: 'Baixo peso', cls: 'bg-amber-100 text-amber-700' };
  if (bmi < 25) return { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' };
  if (bmi < 30) return { label: 'Sobrepeso', cls: 'bg-amber-100 text-amber-700' };
  if (bmi < 40) return { label: 'Obesidade', cls: 'bg-red-100 text-red-700' };
  return { label: 'Obesidade grave', cls: 'bg-red-200 text-red-800' };
}

export default function InitialAssessmentModal({
  pregnancyId, patientId, initialWeightKg, initialHeight, patient, pregnancy, onClose,
}: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: parseDefaults(patient, pregnancy, initialWeightKg, initialHeight) as Partial<FormData>,
  });

  const [openAp, setOpenAp] = useState(true);

  const weightW = watch('weightKg');
  const heightW = watch('height');
  const paraW = watch('para');
  const cmDmW = watch('cmDm');
  const cmThyroidW = watch('cmThyroid');
  const cmAutoimmuneW = watch('cmAutoimmune');
  const cmCardioW = watch('cmCardio');
  const cmRespW = watch('cmRespiratory');
  const cmInfOtherW = watch('cmInfOther');
  const cmPsychW = watch('cmPsych');
  const cmNeuroW = watch('cmNeuro');
  const cmRenalW = watch('cmRenal');
  const cmOtherW = watch('cmOther');
  const cgOtherW = watch('cgOther');
  const hasAllergyW = watch('hasAllergy');

  const weightNum = parseFloat(weightW || '0');
  const heightNum = parseFloat(heightW || '0');
  const bmi = weightNum > 0 && heightNum > 0 ? calculateBmi(weightNum, heightNum) : 0;
  const bmiCat = bmi > 0 ? bmiCategory(bmi) : null;

  const showDeliveryDetails = parseInt(paraW || '0', 10) >= 1;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // ── Comorbidades estruturadas ──
      const comorbidities: string[] = [];
      if (data.cmHas) comorbidities.push('Hipertensão Arterial');
      if (data.cmDm) {
        const sub = data.cmDmSubtype ? ` (${data.cmDmSubtype.toUpperCase()})` : '';
        comorbidities.push(`Diabetes mellitus${sub}`);
      }
      if (data.cmDislipidemia) comorbidities.push('Dislipidemia');
      if (data.cmThyroid) {
        const sub = data.cmThyroidSubtype ? ` (${data.cmThyroidSubtype})` : '';
        comorbidities.push(`Doenças tireoidianas${sub}`);
      }
      if (data.cmTrombo) comorbidities.push('Trombofilias');
      if (data.cmEnxaqueca) comorbidities.push('Enxaqueca');
      if (data.cmAutoimmune) {
        const t = data.cmAutoimmuneText ? `: ${data.cmAutoimmuneText}` : '';
        comorbidities.push(`Doenças autoimunes${t}`);
      }
      if (data.cmCardio) {
        const t = data.cmCardioText ? `: ${data.cmCardioText}` : '';
        comorbidities.push(`Doenças cardiovasculares${t}`);
      }
      if (data.cmRespiratory) {
        const t = data.cmRespiratoryText ? `: ${data.cmRespiratoryText}` : '';
        comorbidities.push(`Doenças respiratórias${t}`);
      }
      const infectious: string[] = [];
      if (data.cmInfHiv) infectious.push('HIV');
      if (data.cmInfHepB) infectious.push('Hepatite B');
      if (data.cmInfHepC) infectious.push('Hepatite C');
      if (data.cmInfTb) infectious.push('Tuberculose');
      if (data.cmInfSifilis) infectious.push('Sífilis');
      if (data.cmInfOther && data.cmInfOtherText) infectious.push(data.cmInfOtherText);
      if (infectious.length > 0) {
        comorbidities.push(`Doenças infecciosas crônicas: ${infectious.join(', ')}`);
      }
      if (data.cmPsych) {
        const t = data.cmPsychText ? `: ${data.cmPsychText}` : '';
        comorbidities.push(`Doenças psiquiátricas${t}`);
      }
      if (data.cmNeuro) {
        const t = data.cmNeuroText ? `: ${data.cmNeuroText}` : '';
        comorbidities.push(`Doenças neurológicas${t}`);
      }
      if (data.cmRenal) {
        const t = data.cmRenalText ? `: ${data.cmRenalText}` : '';
        comorbidities.push(`Doenças renais${t}`);
      }
      if (data.cmOther && data.cmOtherText) comorbidities.push(data.cmOtherText);

      const addictions: string[] = [];
      if (data.habitSmoking) addictions.push('Tabagismo');
      if (data.habitAlcohol) addictions.push('Etilismo');
      if (data.habitDrugs) addictions.push('Uso de drogas');

      // ── Patient payload ──
      const patientPayload: Record<string, unknown> = {};
      if (data.height) patientPayload.height = parseFloat(data.height);
      if (comorbidities.length > 0) patientPayload.comorbiditiesSelected = comorbidities;
      if (addictions.length > 0) patientPayload.addictionsSelected = addictions;
      if (data.hasAllergy && data.allergyText) patientPayload.allergies = data.allergyText;
      if (data.surgeries) patientPayload.surgeries = data.surgeries;
      if (data.familyHistory) patientPayload.familyHistory = data.familyHistory;
      if (data.menarcheAge) patientPayload.menarcheAge = parseInt(data.menarcheAge, 10);
      if (data.menstrualCycle) patientPayload.menstrualCycle = data.menstrualCycle;
      if (data.dysmenorrhea !== undefined) patientPayload.dysmenorrhea = !!data.dysmenorrhea;

      if (Object.keys(patientPayload).length > 0) {
        await updatePatient(patientId, patientPayload);
      }

      // Cria consulta inicial com o peso (peso e dado de consulta, nao da paciente)
      if (data.weightKg) {
        try {
          await api.post(`/pregnancies/${pregnancyId}/consultations`, {
            date: new Date().toISOString().split('T')[0],
            weightKg: parseFloat(data.weightKg),
            subjective: 'Avaliação inicial',
          });
        } catch (err) {
          // Nao bloqueia o fluxo se ja existir consulta hoje
          console.warn('Falha ao criar consulta inicial', err);
        }
      }

      // ── Pregnancy payload ──
      const pregnancyPayload: Record<string, unknown> = {
        gravida: parseInt(data.gravida || '1', 10),
        abortus: parseInt(data.abortus || '0', 10),
        para: parseInt(data.para || '0', 10),
      };

      if (showDeliveryDetails) {
        if (data.pv) pregnancyPayload.vaginalDeliveries = parseInt(data.pv, 10);
        if (data.pc) pregnancyPayload.cesareans = parseInt(data.pc, 10);
        if (data.pf) pregnancyPayload.forcepsDeliveries = parseInt(data.pf, 10);
      }

      // Patologias da gestacao atual = checkboxes estruturadas + sumario de comorbidades para auto-deteccao de risco
      const currentPathList: string[] = [];
      if (data.cgDmg) currentPathList.push('DMG');
      if (data.cgPe) currentPathList.push('Pré-eclâmpsia');
      if (data.cgEclampsia) currentPathList.push('Eclâmpsia');
      if (data.cgHellp) currentPathList.push('Síndrome HELLP');
      if (data.cgColestase) currentPathList.push('Colestase gestacional');
      if (data.cgHiperemese) currentPathList.push('Hiperêmese gravídica');
      if (data.cgItu) currentPathList.push('ITU recorrente');
      if (data.cgRpmo) currentPathList.push('RPMO');
      if (data.cgTpp) currentPathList.push('Trabalho de parto pré-termo');
      if (data.cgAnemia) currentPathList.push('Anemia');
      if (data.cgOther && data.cgOtherText) currentPathList.push(data.cgOtherText);

      const pathologyParts: string[] = [...currentPathList];
      const criticalForRisk = comorbidities.filter((c) =>
        /Hipertens|Diabetes|Trombofil|cardiovascul|renal|HIV|autoimune/i.test(c),
      );
      if (criticalForRisk.length > 0) pathologyParts.push(...criticalForRisk);
      if (pathologyParts.length > 0) {
        pregnancyPayload.currentPathologies = pathologyParts.join('; ');
      }

      if (data.cmDm && data.cmDmSubtype) {
        pregnancyPayload.diabetesSubtype = data.cmDmSubtype;
      }
      if (data.medications) pregnancyPayload.currentMedications = data.medications;
      if (data.gynecologicalNotes) pregnancyPayload.gynecologicalHistory = data.gynecologicalNotes;

      const habits: string[] = [];
      if (data.habitSmoking) habits.push('Tabagismo');
      if (data.habitAlcohol) habits.push('Etilismo');
      if (data.habitDrugs) habits.push('Uso de drogas');
      if (habits.length > 0) pregnancyPayload.habits = habits.join('; ');

      return completeInitialAssessment(pregnancyId, pregnancyPayload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pregnancy', pregnancyId] });
      qc.invalidateQueries({ queryKey: ['patient'] });
      qc.invalidateQueries({ queryKey: ['consultations', pregnancyId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">Avaliação Inicial</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao salvar avaliação. Verifique os dados.
            </div>
          )}

          {/* Antropometria */}
          <Section title="Antropometria">
            <div className="grid grid-cols-3 gap-3 items-end">
              <Field label="Peso inicial (kg) *">
                <input {...register('weightKg', { required: true })} type="number" step="0.1" min="20" max="300" placeholder="Ex: 65.5" className={iCn} />
              </Field>
              <Field label="Altura (cm) *">
                <input {...register('height', { required: true })} type="number" step="0.1" min="100" max="220" placeholder="Ex: 165" className={iCn} />
              </Field>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">IMC</label>
                {bmi > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-navy">{bmi.toFixed(1)}</span>
                    {bmiCat && <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', bmiCat.cls)}>{bmiCat.label}</span>}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>
            </div>
          </Section>

          {/* Antecedentes Familiares */}
          <Section title="Antecedentes Familiares">
            <textarea {...register('familyHistory')} rows={2} placeholder="Ex: HAS materna, DM2 paterna, câncer de mama em irmã..." className={cn(iCn, 'resize-none')} />
          </Section>

          {/* Antecedentes Obstetricos */}
          <Section title="Antecedentes Obstétricos">
            <div className="grid grid-cols-3 gap-3">
              <Field label="G (gestações) *">
                <input {...register('gravida')} type="number" min="0" max="20" className={iCn} />
              </Field>
              <Field label="A (abortos)">
                <input {...register('abortus')} type="number" min="0" max="20" className={iCn} />
              </Field>
              <Field label="P (partos)">
                <input {...register('para')} type="number" min="0" max="20" className={iCn} />
              </Field>
            </div>
            {showDeliveryDetails && (
              <div className="grid grid-cols-3 gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                <Field label="PV (vaginais)"><input {...register('pv')} type="number" min="0" className={iCn} /></Field>
                <Field label="PC (cesáreas)"><input {...register('pc')} type="number" min="0" className={iCn} /></Field>
                <Field label="PF (fórcipes)"><input {...register('pf')} type="number" min="0" className={iCn} /></Field>
              </div>
            )}
          </Section>

          {/* Antecedentes Pessoais (guarda-chuva) */}
          <div>
            <button type="button" onClick={() => setOpenAp(!openAp)} className="w-full flex items-center justify-between text-sm font-semibold text-navy mb-3 pb-1 border-b">
              <span>Antecedentes Pessoais</span>
              {openAp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {openAp && (
              <div className="space-y-5">
                {/* Comorbidades */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comorbidades</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <CheckboxLine register={register('cmHas')} label="Hipertensão Arterial" />
                    <div>
                      <CheckboxLine register={register('cmDm')} label="Diabetes mellitus" />
                      {cmDmW && (
                        <div className="ml-6 mt-1 flex gap-3 flex-wrap">
                          {[{ v: 'dm1', l: 'DM1' }, { v: 'dm2', l: 'DM2' }, { v: 'lada', l: 'LADA' }, { v: 'mody', l: 'MODY' }].map((o) => (
                            <label key={o.v} className="flex items-center gap-1 text-xs text-gray-700">
                              <input {...register('cmDmSubtype')} type="radio" value={o.v} className="text-lilac focus:ring-lilac" />
                              {o.l}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <CheckboxLine register={register('cmDislipidemia')} label="Dislipidemia" />
                    <div>
                      <CheckboxLine register={register('cmThyroid')} label="Doenças tireoidianas" />
                      {cmThyroidW && (
                        <div className="ml-6 mt-1 flex gap-3 flex-wrap">
                          {[
                            { v: 'hipotireoidismo', l: 'Hipo' },
                            { v: 'hipertireoidismo', l: 'Hiper' },
                            { v: 'hashimoto', l: 'Hashimoto' },
                            { v: 'graves', l: 'Graves' },
                          ].map((o) => (
                            <label key={o.v} className="flex items-center gap-1 text-xs text-gray-700">
                              <input {...register('cmThyroidSubtype')} type="radio" value={o.v} className="text-lilac focus:ring-lilac" />
                              {o.l}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <CheckboxLine register={register('cmTrombo')} label="Trombofilias" />
                    <CheckboxLine register={register('cmEnxaqueca')} label="Enxaqueca" />
                    <CondCheckbox label="Doenças autoimunes" hint="LES, SAF, AR..." watched={cmAutoimmuneW} register={register('cmAutoimmune')} textRegister={register('cmAutoimmuneText')} />
                    <CondCheckbox label="Doenças cardiovasculares" watched={cmCardioW} register={register('cmCardio')} textRegister={register('cmCardioText')} />
                    <CondCheckbox label="Doenças respiratórias" hint="asma, DPOC..." watched={cmRespW} register={register('cmRespiratory')} textRegister={register('cmRespiratoryText')} />
                    <CondCheckbox label="Doenças psiquiátricas" hint="ansiedade, depressão..." watched={cmPsychW} register={register('cmPsych')} textRegister={register('cmPsychText')} />
                    <CondCheckbox label="Doenças neurológicas" watched={cmNeuroW} register={register('cmNeuro')} textRegister={register('cmNeuroText')} />
                    <CondCheckbox label="Doenças renais" watched={cmRenalW} register={register('cmRenal')} textRegister={register('cmRenalText')} />
                    <CondCheckbox label="Outras" watched={cmOtherW} register={register('cmOther')} textRegister={register('cmOtherText')} />
                  </div>
                  {/* Doenças infecciosas crônicas — checklist própria */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Doenças infecciosas crônicas</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <CheckboxLine register={register('cmInfHiv')} label="HIV" />
                      <CheckboxLine register={register('cmInfHepB')} label="Hepatite B" />
                      <CheckboxLine register={register('cmInfHepC')} label="Hepatite C" />
                      <CheckboxLine register={register('cmInfTb')} label="Tuberculose" />
                      <CheckboxLine register={register('cmInfSifilis')} label="Sífilis" />
                      <CheckboxLine register={register('cmInfOther')} label="Outras" />
                    </div>
                    {cmInfOtherW && (
                      <div className="mt-2">
                        <input {...register('cmInfOtherText')} type="text" placeholder="Descreva..." className={iCn} />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Comorbidades críticas (HAS, Diabetes, Trombofilias, cardiopatias, renais, autoimunes, HIV) classificam automaticamente a gestação como alto risco.</span>
                  </div>
                </div>

                {/* Ginecologicos */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ginecológicos</h4>
                  <p className="text-[10px] text-gray-400 mb-2">Será integrado com prontuário ginecológico futuramente</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Menarca (idade)">
                      <input {...register('menarcheAge')} type="number" min="6" max="20" placeholder="Ex: 12" className={iCn} />
                    </Field>
                    <Field label="Ciclo">
                      <select {...register('menstrualCycle')} className={iCn}>
                        <option value="">—</option>
                        <option value="regular">Regular</option>
                        <option value="irregular">Irregular</option>
                      </select>
                    </Field>
                    <div className="flex items-end pb-2">
                      <CheckboxLine register={register('dysmenorrhea')} label="Dismenorreia" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <textarea {...register('gynecologicalNotes')} rows={2} placeholder="Outras informações ginecológicas (ISTs prévias, HPV, miomas, cirurgias gineco)..." className={cn(iCn, 'resize-none')} />
                  </div>
                </div>

                {/* Cirurgicos */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cirúrgicos</h4>
                  <textarea {...register('surgeries')} rows={2} placeholder="Cirurgias prévias e datas..." className={cn(iCn, 'resize-none')} />
                </div>
              </div>
            )}
          </div>

          {/* Patologias da gestacao atual */}
          <Section title="Patologias da gestação atual">
            <p className="text-[10px] text-gray-400 mb-2">Diagnósticos surgidos nesta gestação. Comorbidades pré-existentes ficam acima.</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <CheckboxLine register={register('cgDmg')} label="DMG (Diabetes Mellitus Gestacional)" />
              <CheckboxLine register={register('cgPe')} label="Pré-eclâmpsia" />
              <CheckboxLine register={register('cgEclampsia')} label="Eclâmpsia" />
              <CheckboxLine register={register('cgHellp')} label="Síndrome HELLP" />
              <CheckboxLine register={register('cgColestase')} label="Colestase gestacional" />
              <CheckboxLine register={register('cgHiperemese')} label="Hiperêmese gravídica" />
              <CheckboxLine register={register('cgItu')} label="ITU recorrente" />
              <CheckboxLine register={register('cgRpmo')} label="RPMO" />
              <CheckboxLine register={register('cgTpp')} label="Trabalho de parto pré-termo" />
              <CheckboxLine register={register('cgAnemia')} label="Anemia" />
              <CondCheckbox label="Outros" watched={cgOtherW} register={register('cgOther')} textRegister={register('cgOtherText')} />
            </div>
          </Section>

          {/* Habitos */}
          <Section title="Hábitos">
            <div className="space-y-2">
              <CheckboxLine register={register('habitSmoking')} label="Tabagismo" />
              <CheckboxLine register={register('habitAlcohol')} label="Etilismo" />
              <CheckboxLine register={register('habitDrugs')} label="Uso de drogas" />
            </div>
          </Section>

          {/* Alergias */}
          <Section title="Alergias">
            <CheckboxLine register={register('hasAllergy')} label="Possui alergia conhecida" />
            {hasAllergyW && (
              <div className="mt-2">
                <input {...register('allergyText')} type="text" placeholder="Descreva as alergias..." className={iCn} />
              </div>
            )}
          </Section>

          {/* Medicacoes */}
          <Section title="Medicações em uso">
            <textarea {...register('medications')} rows={2} placeholder="Lista de medicamentos atuais..." className={cn(iCn, 'resize-none')} />
          </Section>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Preencher depois</button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-5 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2"
            >
              {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-navy mb-3 pb-1 border-b">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function CheckboxLine({ register, label }: { register: any; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input {...register} type="checkbox" className="w-4 h-4 text-lilac rounded focus:ring-lilac" />
      {label}
    </label>
  );
}

function CondCheckbox({ label, hint, watched, register, textRegister }: { label: string; hint?: string; watched: boolean; register: any; textRegister: any }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input {...register} type="checkbox" className="w-4 h-4 text-lilac rounded focus:ring-lilac" />
        {label}
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </label>
      {watched && (
        <div className="ml-6 mt-1">
          <input {...textRegister} type="text" placeholder="Descreva..." className={iCn} />
        </div>
      )}
    </div>
  );
}

const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac';
