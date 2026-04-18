import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createGynecologyConsultation,
  CONSULTATION_TYPE_LABELS,
  SMOKING_LABELS,
  ALCOHOL_USE_LABELS,
  DYSMENORRHEA_LABELS,
  MENSTRUAL_VOLUME_LABELS,
  PHYSICAL_ACTIVITY_LABELS,
  CONTRACEPTIVE_METHOD_OPTIONS,
  BREAST_FINDING_OPTIONS,
  BIRADS_LABELS,
  type CreateGynecologyConsultationDto,
  type GynecologyConsultationType,
  type SmokingStatus,
  type AlcoholUsePattern,
  type DysmenorrheaGrade,
  type MenstrualVolume,
  type BiRads,
  type PhysicalActivityLevel,
} from '../../../api/gynecology-consultations.api';
import { updatePatient } from '../../../api/patients.api';
import type { Patient } from '../../../api/patients.api';
import { AttachmentField, type AttachmentValue } from '../../../components/forms/AttachmentField';
import CollapsibleSection from '../../../components/forms/CollapsibleSection';
import { cn } from '../../../utils/cn';

/* ─── Form data ─── */

interface FormData {
  consultationDate: string;
  // 1. Biometria
  weight: string;
  height: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  waistCircumference: string;
  // 2. Motivo + HDA
  chiefComplaint: string;
  currentIllnessHistory: string;
  // 3. Menstrual
  menarcheAge: string;
  lastMenstrualPeriod: string;
  cycleInterval: string;
  cycleDuration: string;
  cycleVolume: MenstrualVolume | '';
  dysmenorrhea: DysmenorrheaGrade | '';
  hasClots: boolean;
  hasIntermenstrualBleeding: boolean;
  hasPostcoitalBleeding: boolean;
  hasPMS: boolean;
  // 4. Sexual/reprodutiva
  sexuallyActive: string;
  numberOfSexualPartners: string;
  condomUse: string;
  historyOfSTI: boolean;
  historyOfSTIDetails: string;
  dyspareunia: boolean;
  libido: string;
  reproductiveDesire: string;
  // 5. Contraceptiva
  contraceptiveMethodKey: string;
  contraceptiveBrand: string;
  previousMethods: string;
  contraceptiveSatisfaction: string;
  // 6. Obstetricos
  gravida: string;
  para: string;
  abortus: string;
  cesarean: string;
  ectopicPregnancy: boolean;
  previousObstetricPathologies: string;
  // 7. Ginecologicos
  historyOfPCOS: boolean;
  historyOfEndometriosis: boolean;
  historyOfMyoma: boolean;
  historyOfOvarianCyst: boolean;
  historyOfHPV: boolean;
  historyOfCervicalDysplasia: boolean;
  previousGynecologicSurgeries: string;
  menopauseStatus: string;
  hormoneTherapy: string;
  // 8. Antecedentes pessoais
  cmHas: boolean;
  cmDm: boolean;
  cmDmSubtype: string;
  cmThyroid: boolean;
  cmThyroidSubtype: string;
  cmTrombo: boolean;
  cmEnxaqueca: boolean;
  cmAutoimmune: boolean;
  cmAutoimmuneText: string;
  cmPsych: boolean;
  cmPsychText: string;
  cmRenal: boolean;
  cmRenalText: string;
  cmHepatic: boolean;
  cmEpilepsy: boolean;
  cmObesity: boolean;
  cmCancer: boolean;
  cmCancerText: string;
  cmInfHiv: boolean;
  cmInfHepB: boolean;
  cmInfHepC: boolean;
  cmInfTb: boolean;
  cmInfSifilis: boolean;
  // 9. Cirurgicos
  surgeries: string;
  // 10. Medicações/alergias
  medications: string;
  hasAllergy: boolean;
  allergyText: string;
  vaccinations: string;
  // 11. Família
  fhBreastCancer: boolean;
  fhOvarianCancer: boolean;
  fhEndometrialCancer: boolean;
  fhColorectalCancer: boolean;
  fhThrombosis: boolean;
  fhOsteoporosis: boolean;
  fhDiabetes: boolean;
  fhHypertension: boolean;
  fhCardiovascular: boolean;
  fhDetails: string;
  // 12. Habitos
  smokingStatus: SmokingStatus | '';
  alcoholUsePattern: AlcoholUsePattern | '';
  drugUse: boolean;
  drugUseDetails: string;
  physicalActivity: PhysicalActivityLevel | '';
  diet: string;
  sleep: string;
  // 13. Sintomas por sistemas
  sxCorrimento: boolean;
  sxPrurido: boolean;
  sxOdor: boolean;
  sxDisuria: boolean;
  sxIncontinencia: boolean;
  sxDorPelvica: boolean;
  sxDorMamaria: boolean;
  sxFogachos: boolean;
  sxRessecamento: boolean;
  sxHumor: boolean;
  sxQuedaCabelo: boolean;
  sxHirsutismo: boolean;
  sxAcne: boolean;
  sxGanhoPeso: boolean;
  sxSonoAlterado: boolean;
  sxOutros: string;
  // 14. Exame fisico
  breastExamPerformed: boolean;
  breastFindings: string[];
  breastFindingDescDor: string;
  breastFindingDescNodulo: string;
  breastFindingDescRetracao: string;
  breastFindingDescAlteracaoPele: string;
  breastFindingDescDescargaPapilar: string;
  breastFindingDescLinfonodos: string;
  breastFindingDescOutros: string;
  biradsClassification: BiRads | '';
  pelvicExamPerformed: boolean;
  vulvarFindings: string;
  cervixAppearance: string;
  papSmearCollected: boolean;
  bimanualExamNormal: string;
  uterineSize: string;
  adnexalFindings: string;
  abdomenNotes: string;
  // 15. Exames previos
  lastPapSmear: string;
  lastPapSmearResult: string;
  lastMammography: string;
  lastMammographyResult: string;
  lastUltrasound: string;
  lastHormonalExams: string;
  lastSerology: string;
  // 16. Diagnóstico + conduta
  diagnosis: string;
  icd10: string;
  requestedExams: string;
  prescriptions: string;
  referrals: string;
  returnDate: string;
  notes: string;
}

/* ─── Helpers ─── */

function computeBmi(w: string, h: string) {
  const wn = parseFloat(w); const hn = parseFloat(h);
  if (!wn || !hn || hn <= 0) return null;
  const m = hn / 100; const bmi = wn / (m * m);
  if (!isFinite(bmi) || bmi <= 0) return null;
  let label = 'Normal'; let color = 'bg-emerald-100 text-emerald-700';
  if (bmi < 18.5) { label = 'Baixo peso'; color = 'bg-blue-100 text-blue-700'; }
  else if (bmi >= 40) { label = 'Obesidade III'; color = 'bg-red-100 text-red-700'; }
  else if (bmi >= 35) { label = 'Obesidade II'; color = 'bg-red-100 text-red-700'; }
  else if (bmi >= 30) { label = 'Obesidade I'; color = 'bg-red-100 text-red-700'; }
  else if (bmi >= 25) { label = 'Sobrepeso'; color = 'bg-amber-100 text-amber-700'; }
  return { value: Number(bmi.toFixed(1)), label, color };
}

/* ─── Component ─── */

interface Props {
  patientId: string;
  patient: Patient;
  onClose: () => void;
}

export default function InitialGynecologyConsultationModal({ patientId, patient, onClose }: Props) {
  const qc = useQueryClient();

  const [papAttachment, setPapAttachment] = useState<AttachmentValue>({ url: null, name: null, mimeType: null });
  const [mammoAttachment, setMammoAttachment] = useState<AttachmentValue>({ url: null, name: null, mimeType: null });

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      consultationDate: new Date().toISOString().split('T')[0],
      height: patient.height?.toString() ?? '',
      menarcheAge: patient.menarcheAge?.toString() ?? '',
      surgeries: patient.surgeries ?? '',
      allergyText: patient.allergies ?? '',
      hasAllergy: !!patient.allergies,
      weight: '', bloodPressureSystolic: '120', bloodPressureDiastolic: '80',
      heartRate: '', temperature: '', waistCircumference: '',
      chiefComplaint: '', currentIllnessHistory: '',
      lastMenstrualPeriod: '', cycleInterval: '', cycleDuration: '',
      cycleVolume: '', dysmenorrhea: '',
      sexuallyActive: '', numberOfSexualPartners: '', condomUse: '',
      contraceptiveMethodKey: '', contraceptiveBrand: '',
      gravida: '0', para: '0', abortus: '0', cesarean: '0',
      smokingStatus: '', alcoholUsePattern: '', physicalActivity: '',
      biradsClassification: '',
      bimanualExamNormal: '',
    },
  });

  const weightW = watch('weight');
  const heightW = watch('height');
  const bmi = computeBmi(weightW, heightW);

  const breastFindings = watch('breastFindings') ?? [];
  const hasAllergyW = watch('hasAllergy');
  const drugUseW = watch('drugUse');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // 1. Persist patient-level data
      const patientPayload: Record<string, unknown> = {};
      if (data.height) patientPayload.height = Number(data.height);
      if (data.menarcheAge) patientPayload.menarcheAge = Number(data.menarcheAge);
      if (data.surgeries) patientPayload.surgeries = data.surgeries;

      // Comorbidities
      const comorbidities: string[] = [];
      if (data.cmHas) comorbidities.push('Hipertensão Arterial');
      if (data.cmDm) comorbidities.push(`Diabetes mellitus${data.cmDmSubtype ? ` (${data.cmDmSubtype})` : ''}`);
      if (data.cmThyroid) comorbidities.push(`Doenças tireoidianas${data.cmThyroidSubtype ? ` (${data.cmThyroidSubtype})` : ''}`);
      if (data.cmTrombo) comorbidities.push('Trombofilias');
      if (data.cmEnxaqueca) comorbidities.push('Enxaqueca');
      if (data.cmAutoimmune) comorbidities.push(`Doenças autoimunes: ${data.cmAutoimmuneText || ''}`);
      if (data.cmPsych) comorbidities.push(`Doenças psiquiatricas: ${data.cmPsychText || ''}`);
      if (data.cmRenal) comorbidities.push(`Doenças renais: ${data.cmRenalText || ''}`);
      if (data.cmHepatic) comorbidities.push('Doenças hepaticas');
      if (data.cmEpilepsy) comorbidities.push('Epilepsia');
      if (data.cmObesity) comorbidities.push('Obesidade');
      if (data.cmCancer) comorbidities.push(`Cancer previo: ${data.cmCancerText || ''}`);
      const infParts: string[] = [];
      if (data.cmInfHiv) infParts.push('HIV');
      if (data.cmInfHepB) infParts.push('Hepatite B');
      if (data.cmInfHepC) infParts.push('Hepatite C');
      if (data.cmInfTb) infParts.push('Tuberculose');
      if (data.cmInfSifilis) infParts.push('Sifilis');
      if (infParts.length) comorbidities.push(`Doenças infecciosas cronicas: ${infParts.join(', ')}`);
      if (comorbidities.length) patientPayload.comorbiditiesSelected = comorbidities;

      if (data.hasAllergy && data.allergyText) patientPayload.allergies = data.allergyText;
      if (data.medications) patientPayload.profileNotes = data.medications;

      const addictions: string[] = [];
      if (data.smokingStatus === 'current') addictions.push('Tabagismo');
      if (data.alcoholUsePattern && data.alcoholUsePattern !== 'none') addictions.push('Etilismo');
      if (data.drugUse) addictions.push('Uso de drogas');
      if (addictions.length) patientPayload.addictionsSelected = addictions;

      patientPayload.familyHistory = data.fhDetails || undefined;

      if (Object.keys(patientPayload).length > 0) {
        await updatePatient(patientId, patientPayload);
      }

      // 2. Create consultation
      const dto: CreateGynecologyConsultationDto = {
        consultationDate: data.consultationDate,
        consultationType: 'initial',
        chiefComplaint: data.chiefComplaint || undefined,
        currentIllnessHistory: data.currentIllnessHistory || undefined,
        // Menstrual
        lastMenstrualPeriod: data.lastMenstrualPeriod || undefined,
        cycleInterval: data.cycleInterval ? Number(data.cycleInterval) : undefined,
        cycleDuration: data.cycleDuration ? Number(data.cycleDuration) : undefined,
        cycleVolume: data.cycleVolume || undefined,
        dysmenorrhea: data.dysmenorrhea || undefined,
        // Sexual
        sexuallyActive: data.sexuallyActive === 'sim' ? true : data.sexuallyActive === 'não' ? false : undefined,
        numberOfSexualPartners: data.numberOfSexualPartners ? Number(data.numberOfSexualPartners) : undefined,
        historyOfSTI: data.historyOfSTI || undefined,
        historyOfSTIDetails: data.historyOfSTIDetails || undefined,
        // Contraception
        contraceptiveMethod: data.contraceptiveMethodKey
          ? CONTRACEPTIVE_METHOD_OPTIONS.find((o) => o.value === data.contraceptiveMethodKey)?.label +
            (data.contraceptiveBrand ? ` — ${data.contraceptiveBrand}` : '')
          : undefined,
        // Habits
        smokingStatus: data.smokingStatus || undefined,
        alcoholUsePattern: data.alcoholUsePattern || undefined,
        alcoholUse: data.alcoholUsePattern && data.alcoholUsePattern !== 'none' ? true : undefined,
        drugUse: data.drugUse || undefined,
        drugUseDetails: data.drugUseDetails || undefined,
        physicalActivity: data.physicalActivity || undefined,
        // Gyn history
        historyOfPCOS: data.historyOfPCOS || undefined,
        historyOfEndometriosis: data.historyOfEndometriosis || undefined,
        historyOfMyoma: data.historyOfMyoma || undefined,
        historyOfOvarianCyst: data.historyOfOvarianCyst || undefined,
        historyOfHPV: data.historyOfHPV || undefined,
        historyOfCervicalDysplasia: data.historyOfCervicalDysplasia || undefined,
        previousGynecologicSurgeries: data.previousGynecologicSurgeries || undefined,
        // Obstetric
        gravida: data.gravida ? Number(data.gravida) : undefined,
        para: data.para ? Number(data.para) : undefined,
        abortus: data.abortus ? Number(data.abortus) : undefined,
        cesarean: data.cesarean ? Number(data.cesarean) : undefined,
        // Family
        familyHistoryBreastCancer: data.fhBreastCancer || undefined,
        familyHistoryOvarianCancer: data.fhOvarianCancer || undefined,
        familyHistoryEndometrialCancer: data.fhEndometrialCancer || undefined,
        familyHistoryColorectalCancer: data.fhColorectalCancer || undefined,
        familyHistoryDiabetes: data.fhDiabetes || undefined,
        familyHistoryCardiovascularDisease: data.fhCardiovascular || undefined,
        familyHistoryThrombosis: data.fhThrombosis || undefined,
        familyHistoryOsteoporosis: data.fhOsteoporosis || undefined,
        familyHistoryHypertension: data.fhHypertension || undefined,
        familyHistoryDetails: data.fhDetails || undefined,
        // Vitals
        weight: data.weight ? Number(data.weight) : undefined,
        height: data.height ? Number(data.height) : undefined,
        bmi: bmi?.value,
        waistCircumference: data.waistCircumference ? Number(data.waistCircumference) : undefined,
        bloodPressureSystolic: data.bloodPressureSystolic ? Number(data.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: data.bloodPressureDiastolic ? Number(data.bloodPressureDiastolic) : undefined,
        heartRate: data.heartRate ? Number(data.heartRate) : undefined,
        temperature: data.temperature ? Number(data.temperature) : undefined,
        // Breast
        breastExamPerformed: data.breastExamPerformed || undefined,
        breastExamFindings: breastFindings.length > 0
          ? breastFindings.map((f) => {
              const opt = BREAST_FINDING_OPTIONS.find((o) => o.value === f);
              const key = `breastFindingDesc${f.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof FormData;
              const desc = data[key];
              return desc ? `${opt?.label}: ${desc}` : opt?.label ?? f;
            }).join('; ')
          : undefined,
        biradsClassification: data.biradsClassification || undefined,
        // Pelvic
        pelvicExamPerformed: data.pelvicExamPerformed || undefined,
        vulvarFindings: data.vulvarFindings || undefined,
        cervixAppearance: data.cervixAppearance || undefined,
        papSmearCollected: data.papSmearCollected || undefined,
        bimanualExamNormal: data.bimanualExamNormal === 'sim' ? true : data.bimanualExamNormal === 'não' ? false : undefined,
        uterineSize: data.uterineSize || undefined,
        adnexalFindings: data.adnexalFindings || undefined,
        // Screening
        lastPapSmear: data.lastPapSmear || undefined,
        lastPapSmearResult: data.lastPapSmearResult || undefined,
        papSmearAttachmentUrl: papAttachment.url,
        papSmearAttachmentName: papAttachment.name,
        papSmearAttachmentMimeType: papAttachment.mimeType,
        lastMammography: data.lastMammography || undefined,
        lastMammographyResult: data.lastMammographyResult || undefined,
        mammographyAttachmentUrl: mammoAttachment.url,
        mammographyAttachmentName: mammoAttachment.name,
        mammographyAttachmentMimeType: mammoAttachment.mimeType,
        // Management
        diagnosis: data.diagnosis || undefined,
        icd10Codes: data.icd10 ? data.icd10.split(',').map((s) => s.trim()) : undefined,
        referrals: data.referrals || undefined,
        returnDate: data.returnDate || undefined,
        notes: data.notes || undefined,
        // jsonb for extra fields
        initialAssessmentData: {
          menstrual: { hasClots: data.hasClots, hasIntermenstrualBleeding: data.hasIntermenstrualBleeding, hasPostcoitalBleeding: data.hasPostcoitalBleeding, hasPMS: data.hasPMS },
          sexual: { condomUse: data.condomUse, dyspareunia: data.dyspareunia, libido: data.libido, reproductiveDesire: data.reproductiveDesire },
          contraception: { previousMethods: data.previousMethods, satisfaction: data.contraceptiveSatisfaction },
          obstetric: { ectopicPregnancy: data.ectopicPregnancy, previousPathologies: data.previousObstetricPathologies },
          gynecologic: { menopauseStatus: data.menopauseStatus, hormoneTherapy: data.hormoneTherapy },
          medications: { current: data.medications, vaccinations: data.vaccinations },
          symptoms: {
            corrimento: data.sxCorrimento, prurido: data.sxPrurido, odor: data.sxOdor,
            disuria: data.sxDisuria, incontinencia: data.sxIncontinencia, dorPelvica: data.sxDorPelvica,
            dorMamaria: data.sxDorMamaria, fogachos: data.sxFogachos, ressecamento: data.sxRessecamento,
            humor: data.sxHumor, quedaCabelo: data.sxQuedaCabelo, hirsutismo: data.sxHirsutismo,
            acne: data.sxAcne, ganhoPeso: data.sxGanhoPeso, sonoAlterado: data.sxSonoAlterado,
            outros: data.sxOutros,
          },
          abdomen: data.abdomenNotes,
          diet: data.diet, sleep: data.sleep,
          previousExams: { lastUltrasound: data.lastUltrasound, lastHormonalExams: data.lastHormonalExams, lastSerology: data.lastSerology },
          requestedExams: data.requestedExams, prescriptions: data.prescriptions,
        },
      };

      return createGynecologyConsultation(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gynecology-consultations', patientId] });
      qc.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Primeira consulta ginecologica registrada');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar consulta'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-navy">Primeira consulta ginecologica</h2>
            <p className="text-xs text-gray-400 mt-0.5">Avaliação inicial completa</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="px-6 py-4">
          <Field label="Data da consulta">
            <input {...register('consultationDate')} type="date" className={iCn} />
          </Field>

          {/* 1. Biometria */}
          <CollapsibleSection title="Biometria e sinais vitais" defaultOpen>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Peso (kg)"><input {...register('weight')} type="number" step="0.1" className={iCn} /></Field>
              <Field label="Altura (cm)"><input {...register('height')} type="number" step="0.1" className={iCn} /></Field>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">IMC</label>
                {bmi ? (
                  <div className="flex items-center gap-2 h-[42px]">
                    <span className="text-lg font-bold text-navy">{bmi.value}</span>
                    <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', bmi.color)}>{bmi.label}</span>
                  </div>
                ) : <span className="text-sm text-gray-300 leading-[42px]">—</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="PA Sistolica (mmHg)"><input {...register('bloodPressureSystolic')} type="number" className={iCn} /></Field>
              <Field label="PA Diastolica (mmHg)"><input {...register('bloodPressureDiastolic')} type="number" className={iCn} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="FC (bpm)"><input {...register('heartRate')} type="number" className={iCn} /></Field>
              <Field label="Temperatura (C)"><input {...register('temperature')} type="number" step="0.1" className={iCn} /></Field>
              <Field label="Circ. abdominal (cm)"><input {...register('waistCircumference')} type="number" step="0.1" className={iCn} /></Field>
            </div>
          </CollapsibleSection>

          {/* 2. Motivo + HDA */}
          <CollapsibleSection title="Motivo da consulta e HDA" defaultOpen>
            <Field label="Queixa principal"><input {...register('chiefComplaint')} placeholder="Em palavras da paciente" className={iCn} /></Field>
            <Field label="História da doença atual"><textarea {...register('currentIllnessHistory')} rows={3} placeholder="Inicio, duração, evolução, fatores de melhora/piora..." className={iCn} /></Field>
          </CollapsibleSection>

          {/* 3. História menstrual */}
          <CollapsibleSection title="História menstrual">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Menarca (idade)"><input {...register('menarcheAge')} type="number" min={6} max={20} className={iCn} /></Field>
              <Field label="DUM"><input {...register('lastMenstrualPeriod')} type="date" className={iCn} /></Field>
              <Field label="Intervalo (dias)"><input {...register('cycleInterval')} type="number" min={10} max={120} className={iCn} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Duração (dias)"><input {...register('cycleDuration')} type="number" min={1} max={30} className={iCn} /></Field>
              <Field label="Volume">
                <select {...register('cycleVolume')} className={iCn}>
                  <option value="">—</option>
                  {Object.entries(MENSTRUAL_VOLUME_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Dismenorreia">
                <select {...register('dysmenorrhea')} className={iCn}>
                  <option value="">—</option>
                  {Object.entries(DYSMENORRHEA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Chk register={register('hasClots')} label="Coagulos" />
              <Chk register={register('hasIntermenstrualBleeding')} label="Escape intermenstrual" />
              <Chk register={register('hasPostcoitalBleeding')} label="Sangramento pós-coital" />
              <Chk register={register('hasPMS')} label="Sindrome pré-menstrual" />
            </div>
          </CollapsibleSection>

          {/* 4. Sexual e reprodutiva */}
          <CollapsibleSection title="História sexual e reprodutiva">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Vida sexual">
                <select {...register('sexuallyActive')} className={iCn}>
                  <option value="">—</option><option value="sim">Ativa</option><option value="não">Inativa</option>
                </select>
              </Field>
              <Field label="N. parceiros"><input {...register('numberOfSexualPartners')} type="number" min={0} className={iCn} /></Field>
              <Field label="Uso de preservativo">
                <select {...register('condomUse')} className={iCn}>
                  <option value="">—</option><option value="sempre">Sempre</option><option value="as_vezes">As vezes</option><option value="nunca">Nunca</option>
                </select>
              </Field>
            </div>
            <Chk register={register('historyOfSTI')} label="História de ISTs" />
            {watch('historyOfSTI') && <Field label="Detalhes ISTs"><input {...register('historyOfSTIDetails')} className={iCn} /></Field>}
            <div className="grid grid-cols-3 gap-3">
              <Chk register={register('dyspareunia')} label="Dispareunia" />
              <Field label="Libido">
                <select {...register('libido')} className={iCn}>
                  <option value="">—</option><option value="normal">Normal</option><option value="diminuida">Diminuida</option><option value="aumentada">Aumentada</option>
                </select>
              </Field>
              <Field label="Desejo reprodutivo">
                <select {...register('reproductiveDesire')} className={iCn}>
                  <option value="">—</option><option value="sim">Quer engravidar</option><option value="não">Evitar gravidez</option><option value="tentando">Em tentativa</option><option value="indefinido">Indefinido</option>
                </select>
              </Field>
            </div>
          </CollapsibleSection>

          {/* 5. Contraceptiva */}
          <CollapsibleSection title="História contraceptiva">
            <Field label="Metodo atual">
              <select {...register('contraceptiveMethodKey')} className={iCn}>
                <option value="">—</option>
                {CONTRACEPTIVE_METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            {watch('contraceptiveMethodKey') && watch('contraceptiveMethodKey') !== 'none' && (
              <Field label="Marca / detalhes"><input {...register('contraceptiveBrand')} placeholder="Ex: Mirena, Yasmin..." className={iCn} /></Field>
            )}
            <Field label="Metodos previos"><textarea {...register('previousMethods')} rows={2} placeholder="Metodos usados anteriormente e motivos de descontinuação" className={iCn} /></Field>
            <Field label="Satisfação com metodo atual">
              <select {...register('contraceptiveSatisfaction')} className={iCn}>
                <option value="">—</option><option value="satisfeita">Satisfeita</option><option value="insatisfeita">Insatisfeita</option><option value="deseja_trocar">Deseja trocar</option>
              </select>
            </Field>
          </CollapsibleSection>

          {/* 6. Obstetricos */}
          <CollapsibleSection title="Antecedentes obstetricos">
            <div className="grid grid-cols-4 gap-3">
              <Field label="G"><input {...register('gravida')} type="number" min={0} className={iCn} /></Field>
              <Field label="P"><input {...register('para')} type="number" min={0} className={iCn} /></Field>
              <Field label="A"><input {...register('abortus')} type="number" min={0} className={iCn} /></Field>
              <Field label="C"><input {...register('cesarean')} type="number" min={0} className={iCn} /></Field>
            </div>
            <Chk register={register('ectopicPregnancy')} label="Gestação ectopica" />
            <Field label="Complicações/patologias de gestações anteriores"><textarea {...register('previousObstetricPathologies')} rows={2} placeholder="DMG, pré-eclampsia, prematuridade, hemorragia..." className={iCn} /></Field>
          </CollapsibleSection>

          {/* 7. Ginecologicos */}
          <CollapsibleSection title="Antecedentes ginecologicos">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Chk register={register('historyOfPCOS')} label="SOP" />
              <Chk register={register('historyOfEndometriosis')} label="Endometriose" />
              <Chk register={register('historyOfMyoma')} label="Miomas" />
              <Chk register={register('historyOfOvarianCyst')} label="Cistos ovarianos" />
              <Chk register={register('historyOfHPV')} label="HPV" />
              <Chk register={register('historyOfCervicalDysplasia')} label="Displasia cervical" />
            </div>
            <Field label="Cirurgias ginecologicas"><textarea {...register('previousGynecologicSurgeries')} rows={2} className={iCn} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status menopausa">
                <select {...register('menopauseStatus')} className={iCn}>
                  <option value="">—</option><option value="pre">Pré-menopausa</option><option value="peri">Perimenopausa</option><option value="pos">Pós-menopausa</option><option value="na">N/A</option>
                </select>
              </Field>
              <Field label="Terapia hormonal"><input {...register('hormoneTherapy')} placeholder="Se usa ou usou, descrever" className={iCn} /></Field>
            </div>
          </CollapsibleSection>

          {/* 8. Antecedentes pessoais */}
          <CollapsibleSection title="Antecedentes pessoais patologicos">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Chk register={register('cmHas')} label="Hipertensão" />
              <div>
                <Chk register={register('cmDm')} label="Diabetes mellitus" />
                {watch('cmDm') && <input {...register('cmDmSubtype')} placeholder="DM1, DM2, LADA, MODY" className={cn(iCn, 'ml-6 mt-1 w-[calc(100%-1.5rem)]')} />}
              </div>
              <div>
                <Chk register={register('cmThyroid')} label="Doenças tireoidianas" />
                {watch('cmThyroid') && <input {...register('cmThyroidSubtype')} placeholder="Hipo, hiper, Hashimoto, Graves" className={cn(iCn, 'ml-6 mt-1 w-[calc(100%-1.5rem)]')} />}
              </div>
              <Chk register={register('cmTrombo')} label="Trombofilias" />
              <Chk register={register('cmEnxaqueca')} label="Enxaqueca" />
              <div>
                <Chk register={register('cmAutoimmune')} label="Doenças autoimunes" />
                {watch('cmAutoimmune') && <input {...register('cmAutoimmuneText')} placeholder="LES, AR, Sjogren..." className={cn(iCn, 'ml-6 mt-1 w-[calc(100%-1.5rem)]')} />}
              </div>
              <div>
                <Chk register={register('cmPsych')} label="Doenças psiquiatricas" />
                {watch('cmPsych') && <input {...register('cmPsychText')} placeholder="Ansiedade, depressão..." className={cn(iCn, 'ml-6 mt-1 w-[calc(100%-1.5rem)]')} />}
              </div>
              <div>
                <Chk register={register('cmRenal')} label="Doenças renais" />
                {watch('cmRenal') && <input {...register('cmRenalText')} className={cn(iCn, 'ml-6 mt-1 w-[calc(100%-1.5rem)]')} />}
              </div>
              <Chk register={register('cmHepatic')} label="Doenças hepaticas" />
              <Chk register={register('cmEpilepsy')} label="Epilepsia" />
              <Chk register={register('cmObesity')} label="Obesidade" />
              <div>
                <Chk register={register('cmCancer')} label="Cancer previo" />
                {watch('cmCancer') && <input {...register('cmCancerText')} placeholder="Tipo e tratamento" className={cn(iCn, 'ml-6 mt-1 w-[calc(100%-1.5rem)]')} />}
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">Doenças infecciosas cronicas</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Chk register={register('cmInfHiv')} label="HIV" />
              <Chk register={register('cmInfHepB')} label="Hepatite B" />
              <Chk register={register('cmInfHepC')} label="Hepatite C" />
              <Chk register={register('cmInfTb')} label="Tuberculose" />
              <Chk register={register('cmInfSifilis')} label="Sifilis" />
            </div>
          </CollapsibleSection>

          {/* 9. Cirurgicos */}
          <CollapsibleSection title="Antecedentes cirurgicos">
            <Field label="Cirurgias previas"><textarea {...register('surgeries')} rows={2} placeholder="Cirurgias, datas, complicações..." className={iCn} /></Field>
          </CollapsibleSection>

          {/* 10. Medicações/alergias */}
          <CollapsibleSection title="Medicações, alergias e imunizações">
            <Field label="Medicamentos em uso"><textarea {...register('medications')} rows={2} placeholder="Incluir hormonios, fitoterápicos, suplementos..." className={iCn} /></Field>
            <Chk register={register('hasAllergy')} label="Possui alergia conhecida" />
            {hasAllergyW && <Field label="Descrever alergias"><input {...register('allergyText')} className={iCn} /></Field>}
            <Field label="Situação vacinal relevante"><textarea {...register('vaccinations')} rows={2} placeholder="HPV, Hepatite B, Rubeola, Influenza..." className={iCn} /></Field>
          </CollapsibleSection>

          {/* 11. Família */}
          <CollapsibleSection title="História familiar">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Chk register={register('fhBreastCancer')} label="Cancer de mama" />
              <Chk register={register('fhOvarianCancer')} label="Cancer de ovario" />
              <Chk register={register('fhEndometrialCancer')} label="Cancer de endometrio" />
              <Chk register={register('fhColorectalCancer')} label="Cancer colorretal" />
              <Chk register={register('fhThrombosis')} label="Trombose / trombofilias" />
              <Chk register={register('fhOsteoporosis')} label="Osteoporose" />
              <Chk register={register('fhDiabetes')} label="Diabetes" />
              <Chk register={register('fhHypertension')} label="Hipertensão" />
              <Chk register={register('fhCardiovascular')} label="Doença cardiovascular" />
            </div>
            <Field label="Detalhes / outros"><textarea {...register('fhDetails')} rows={2} placeholder="Parentesco e detalhes relevantes" className={iCn} /></Field>
          </CollapsibleSection>

          {/* 12. Habitos */}
          <CollapsibleSection title="Habitos e contexto social">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tabagismo">
                <select {...register('smokingStatus')} className={iCn}>
                  <option value="">—</option>
                  {Object.entries(SMOKING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Etilismo">
                <select {...register('alcoholUsePattern')} className={iCn}>
                  <option value="">—</option>
                  {Object.entries(ALCOHOL_USE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <Chk register={register('drugUse')} label="Uso de drogas" />
            {drugUseW && <Field label="Detalhes"><input {...register('drugUseDetails')} className={iCn} /></Field>}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Atividade fisica">
                <select {...register('physicalActivity')} className={iCn}>
                  <option value="">—</option>
                  {Object.entries(PHYSICAL_ACTIVITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Alimentação"><input {...register('diet')} placeholder="Descrição breve" className={iCn} /></Field>
              <Field label="Sono"><input {...register('sleep')} placeholder="Qualidade/horas" className={iCn} /></Field>
            </div>
          </CollapsibleSection>

          {/* 13. Sintomas por sistemas */}
          <CollapsibleSection title="Sintomas associados">
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              <Chk register={register('sxCorrimento')} label="Corrimento" />
              <Chk register={register('sxPrurido')} label="Prurido vulvar" />
              <Chk register={register('sxOdor')} label="Odor vaginal" />
              <Chk register={register('sxDisuria')} label="Disuria" />
              <Chk register={register('sxIncontinencia')} label="Incontinencia" />
              <Chk register={register('sxDorPelvica')} label="Dor pelvica" />
              <Chk register={register('sxDorMamaria')} label="Dor mamaria" />
              <Chk register={register('sxFogachos')} label="Fogachos" />
              <Chk register={register('sxRessecamento')} label="Ressecamento vaginal" />
              <Chk register={register('sxHumor')} label="Alteração de humor" />
              <Chk register={register('sxQuedaCabelo')} label="Queda de cabelo" />
              <Chk register={register('sxHirsutismo')} label="Hirsutismo" />
              <Chk register={register('sxAcne')} label="Acne" />
              <Chk register={register('sxGanhoPeso')} label="Ganho de peso" />
              <Chk register={register('sxSonoAlterado')} label="Disturbio do sono" />
            </div>
            <Field label="Outros sintomas"><input {...register('sxOutros')} className={iCn} /></Field>
          </CollapsibleSection>

          {/* 14. Exame fisico */}
          <CollapsibleSection title="Exame fisico">
            <Field label="Abdome"><textarea {...register('abdomenNotes')} rows={2} placeholder="Inspeção, dor, massas, cicatrizes..." className={iCn} /></Field>

            <p className="text-xs font-semibold text-gray-500 uppercase mt-2 mb-1">Exame mamario</p>
            <Chk register={register('breastExamPerformed')} label="Exame realizado" />
            {watch('breastExamPerformed') && (
              <>
                <div className="space-y-2">
                  {BREAST_FINDING_OPTIONS.map((opt) => {
                    const isChecked = breastFindings.includes(opt.value);
                    const descKey = `breastFindingDesc${opt.value.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')}` as keyof FormData;
                    return (
                      <div key={opt.value} className={cn('border rounded-lg', isChecked ? 'border-lilac/40 bg-lilac/5' : 'border-gray-200')}>
                        <label className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                          <input type="checkbox" value={opt.value} {...register('breastFindings')} />{opt.label}
                        </label>
                        {isChecked && opt.value !== 'ndn' && (
                          <div className="px-3 pb-2"><input {...register(descKey)} placeholder={`Descrever ${opt.label.toLowerCase()}`} className={iCn} /></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Field label="BI-RADS">
                  <select {...register('biradsClassification')} className={iCn}>
                    <option value="">—</option>
                    {Object.entries(BIRADS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </Field>
              </>
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-1">Exame pelvico/ginecologico</p>
            <Chk register={register('pelvicExamPerformed')} label="Exame realizado" />
            {watch('pelvicExamPerformed') && (
              <>
                <Field label="Vulva"><input {...register('vulvarFindings')} placeholder="Normal / alterações" className={iCn} /></Field>
                <Field label="Colo uterino"><textarea {...register('cervixAppearance')} rows={2} className={iCn} /></Field>
                <Chk register={register('papSmearCollected')} label="Citologico coletado" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Toque bimanual">
                    <select {...register('bimanualExamNormal')} className={iCn}>
                      <option value="">—</option><option value="sim">Normal</option><option value="não">Alterado</option>
                    </select>
                  </Field>
                  <Field label="Tamanho uterino"><input {...register('uterineSize')} className={iCn} /></Field>
                </div>
                <Field label="Achados anexiais"><input {...register('adnexalFindings')} className={iCn} /></Field>
              </>
            )}
          </CollapsibleSection>

          {/* 15. Exames previos */}
          <CollapsibleSection title="Exames previos">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Último preventivo"><input {...register('lastPapSmear')} type="date" className={iCn} /></Field>
              <Field label="Resultado"><input {...register('lastPapSmearResult')} className={iCn} /></Field>
            </div>
            <AttachmentField label="Anexar laudo preventivo" value={papAttachment} onChange={setPapAttachment} patientId={patientId} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Última mamografia"><input {...register('lastMammography')} type="date" className={iCn} /></Field>
              <Field label="Resultado"><input {...register('lastMammographyResult')} className={iCn} /></Field>
            </div>
            <AttachmentField label="Anexar laudo mamografia" value={mammoAttachment} onChange={setMammoAttachment} patientId={patientId} />
            <Field label="Último US transvaginal"><input {...register('lastUltrasound')} placeholder="Data e resultado" className={iCn} /></Field>
            <Field label="Exames hormonais relevantes"><input {...register('lastHormonalExams')} className={iCn} /></Field>
            <Field label="Sorologias / ISTs"><input {...register('lastSerology')} className={iCn} /></Field>
          </CollapsibleSection>

          {/* 16. Diagnóstico + conduta */}
          <CollapsibleSection title="Hipoteses diagnosticas e conduta" defaultOpen>
            <Field label="Diagnóstico / impressão"><textarea {...register('diagnosis')} rows={2} className={iCn} /></Field>
            <Field label="CID-10 (separados por virgula)"><input {...register('icd10')} placeholder="Ex: N92.0, E28.2" className={iCn} /></Field>
            <Field label="Exames solicitados"><textarea {...register('requestedExams')} rows={2} className={iCn} /></Field>
            <Field label="Prescrições"><textarea {...register('prescriptions')} rows={2} className={iCn} /></Field>
            <Field label="Encaminhamentos"><textarea {...register('referrals')} rows={2} className={iCn} /></Field>
            <Field label="Data de retorno"><input {...register('returnDate')} type="date" className={iCn} /></Field>
            <Field label="Observações"><textarea {...register('notes')} rows={2} className={iCn} /></Field>
          </CollapsibleSection>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 pb-2 border-t mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2"
            >
              {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar primeira consulta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Shared UI ─── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Chk({ register, label }: { register: any; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
      <input type="checkbox" {...register} />
      {label}
    </label>
  );
}

const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac';
