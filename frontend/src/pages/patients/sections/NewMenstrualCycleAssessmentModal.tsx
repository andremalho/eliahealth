import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Plus, Trash2, Paperclip, FileText } from 'lucide-react';
import {
  createMenstrualCycleAssessment,
  updateMenstrualCycleAssessment,
  COMPLAINT_LABELS,
  LEIOMYOMA_FIGO_LABELS,
  ENDOMETRIOSIS_STAGE_LABELS,
  type CreateMenstrualCycleAssessmentDto,
  type MenstrualCycleAssessment,
  type MenstrualComplaint,
  type LeiomyomaFIGO,
  type EndometriosisStage,
  type HysteroscopyEntry,
} from '../../../api/menstrual-cycle-assessments.api';
import {
  uploadFile,
  isImage,
  isPdf,
  resolveUploadUrl,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from '../../../api/uploads.api';
import { NumberField } from '../../../components/forms/NumberField';
import { InfoTooltip } from '../../../components/forms/InfoTooltip';
import { cn } from '../../../utils/cn';

interface FormData {
  assessmentDate: string;
  chiefComplaint: MenstrualComplaint;

  cycleIntervalDays: string;
  cycleDurationDays: string;
  lastMenstrualPeriod: string;
  estimatedBloodVolumeMl: string;
  pictorialBloodChart: string;
  numberOfPadsPerDay: string;

  // PALM
  palmPolyp: boolean;
  palmAdenomyosis: boolean;
  palmLeiomyoma: boolean;
  palmLeiomyomaLocation: LeiomyomaFIGO | '';
  palmMalignancyOrHyperplasia: boolean;
  palmMalignancyDetails: string;

  // COEIN
  coeinCoagulopathy: boolean;
  coeinCoagulopathyType: string;
  coeinOvulatoryDysfunction: boolean;
  coeinOvulatoryType: string;
  coeinEndometrial: boolean;
  coeinIatrogenic: boolean;
  coeinIatrogenicDetails: string;
  coeinNotYetClassified: boolean;

  // Diagnósticos
  pcosDiagnosis: boolean;
  endometriosisDiagnosis: boolean;
  endometriosisStage: EndometriosisStage | '';

  // Conduta
  diagnosis: string;
  treatmentPlan: string;
  surgicalReferral: boolean;
  surgicalDetails: string;
  returnDate: string;
  notes: string;
}

// FIGO 2018: ciclo normal 24-38d, duração ≤8d
function classifyCycle(intervalStr: string, durationStr: string, volumeMl: string, pbac: string) {
  const interval = parseInt(intervalStr, 10);
  const duration = parseInt(durationStr, 10);
  const vol = parseInt(volumeMl, 10);
  const pbacScore = parseInt(pbac, 10);
  if (!interval && !duration && !vol && !pbacScore) return null;

  const issues: string[] = [];
  let worst: 'green' | 'amber' | 'red' = 'green';

  if (interval) {
    if (interval < 24) {
      issues.push(`Frequente (${interval}d <24)`);
      worst = 'amber';
    } else if (interval > 38) {
      issues.push(`Infrequente (${interval}d >38)`);
      worst = 'amber';
    }
  }
  if (duration && duration > 8) {
    issues.push(`Prolongado (${duration}d >8)`);
    worst = 'amber';
  }
  if (vol && vol > 80) {
    issues.push(`Volume aumentado (${vol}mL >80)`);
    worst = 'red';
  }
  if (pbacScore && pbacScore > 100) {
    issues.push(`PBAC alto (${pbacScore} >100)`);
    worst = 'red';
  }

  if (issues.length === 0) {
    return { label: 'Padrão normal (FIGO)', color: 'green' as const, details: [] };
  }
  return { label: 'Padrão anormal', color: worst, details: issues };
}

export default function NewMenstrualCycleAssessmentModal({
  patientId,
  assessment,
  onClose,
}: {
  patientId: string;
  assessment?: MenstrualCycleAssessment;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!assessment;

  // Histeroscopias — managed como state separado pois é array dinâmico
  const [hysteroscopies, setHysteroscopies] = useState<HysteroscopyEntry[]>(() => {
    if (assessment?.hysteroscopies) return assessment.hysteroscopies;
    // Migra do formato legacy se existir
    if (assessment?.hysteroscopyPerformed && assessment.hysteroscopyDate) {
      return [
        {
          date: assessment.hysteroscopyDate ?? '',
          findings: assessment.hysteroscopyFindings ?? '',
          conduct: '',
        },
      ];
    }
    return [];
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: assessment
      ? {
          assessmentDate: assessment.assessmentDate,
          chiefComplaint: assessment.chiefComplaint,
          cycleIntervalDays: assessment.cycleIntervalDays?.toString() ?? '',
          cycleDurationDays: assessment.cycleDurationDays?.toString() ?? '',
          lastMenstrualPeriod: assessment.lastMenstrualPeriod ?? '',
          estimatedBloodVolumeMl: assessment.estimatedBloodVolumeMl?.toString() ?? '',
          pictorialBloodChart: assessment.pictorialBloodChart?.toString() ?? '',
          numberOfPadsPerDay: assessment.numberOfPadsPerDay?.toString() ?? '',
          palmPolyp: assessment.palmPolyp,
          palmAdenomyosis: assessment.palmAdenomyosis,
          palmLeiomyoma: assessment.palmLeiomyoma,
          palmLeiomyomaLocation: assessment.palmLeiomyomaLocation ?? '',
          palmMalignancyOrHyperplasia: assessment.palmMalignancyOrHyperplasia,
          palmMalignancyDetails: assessment.palmMalignancyDetails ?? '',
          coeinCoagulopathy: assessment.coeinCoagulopathy,
          coeinCoagulopathyType: assessment.coeinCoagulopathyType ?? '',
          coeinOvulatoryDysfunction: assessment.coeinOvulatoryDysfunction,
          coeinOvulatoryType: assessment.coeinOvulatoryType ?? '',
          coeinEndometrial: assessment.coeinEndometrial,
          coeinIatrogenic: assessment.coeinIatrogenic,
          coeinIatrogenicDetails: assessment.coeinIatrogenicDetails ?? '',
          coeinNotYetClassified: assessment.coeinNotYetClassified,
          pcosDiagnosis: assessment.pcosDiagnosis,
          endometriosisDiagnosis: assessment.endometriosisDiagnosis,
          endometriosisStage: assessment.endometriosisStage ?? '',
          diagnosis: assessment.diagnosis ?? '',
          treatmentPlan: assessment.treatmentPlan ?? '',
          surgicalReferral: assessment.surgicalReferral,
          surgicalDetails: assessment.surgicalDetails ?? '',
          returnDate: assessment.returnDate ?? '',
          notes: assessment.notes ?? '',
        }
      : {
          assessmentDate: new Date().toISOString().split('T')[0],
          chiefComplaint: 'heavy_menstrual_bleeding',
          palmPolyp: false,
          palmAdenomyosis: false,
          palmLeiomyoma: false,
          palmMalignancyOrHyperplasia: false,
          coeinCoagulopathy: false,
          coeinOvulatoryDysfunction: false,
          coeinEndometrial: false,
          coeinIatrogenic: false,
          coeinNotYetClassified: false,
          pcosDiagnosis: false,
          endometriosisDiagnosis: false,
          surgicalReferral: false,
        },
  });

  const addHysteroscopy = () => {
    setHysteroscopies((prev) => [
      ...prev,
      { date: new Date().toISOString().split('T')[0]!, findings: '', conduct: '' },
    ]);
  };

  const removeHysteroscopy = (idx: number) => {
    setHysteroscopies((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateHysteroscopy = (idx: number, patch: Partial<HysteroscopyEntry>) => {
    setHysteroscopies((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  };

  // Upload state isolado por índice de histeroscopia
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (idx: number, file: File) => {
    setUploadError(null);
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      setUploadError('Tipo de arquivo não permitido (use JPG, PNG, WebP ou PDF).');
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setUploadError(`Arquivo muito grande (máximo ${MAX_UPLOAD_SIZE_MB}MB).`);
      return;
    }
    setUploadingIdx(idx);
    try {
      const result = await uploadFile(file);
      updateHysteroscopy(idx, {
        attachmentUrl: result.url,
        attachmentName: result.fileName,
        attachmentMimeType: result.mimeType,
      });
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? 'Falha no upload do arquivo.');
    } finally {
      setUploadingIdx(null);
    }
  };

  const removeAttachment = (idx: number) => {
    updateHysteroscopy(idx, {
      attachmentUrl: null,
      attachmentName: null,
      attachmentMimeType: null,
    });
  };

  const cycleClass = classifyCycle(
    watch('cycleIntervalDays'),
    watch('cycleDurationDays'),
    watch('estimatedBloodVolumeMl'),
    watch('pictorialBloodChart'),
  );

  const palmLeiomyomaChecked = watch('palmLeiomyoma');
  const palmMalignancyChecked = watch('palmMalignancyOrHyperplasia');
  const coeinCoagulopathyChecked = watch('coeinCoagulopathy');
  const coeinOvulatoryChecked = watch('coeinOvulatoryDysfunction');
  const coeinIatrogenicChecked = watch('coeinIatrogenic');
  const endometriosisChecked = watch('endometriosisDiagnosis');
  const surgicalChecked = watch('surgicalReferral');

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateMenstrualCycleAssessmentDto = {
        assessmentDate: data.assessmentDate,
        chiefComplaint: data.chiefComplaint,
      };

      if (data.cycleIntervalDays) dto.cycleIntervalDays = Number(data.cycleIntervalDays);
      if (data.cycleDurationDays) dto.cycleDurationDays = Number(data.cycleDurationDays);
      if (data.lastMenstrualPeriod) dto.lastMenstrualPeriod = data.lastMenstrualPeriod;
      if (data.estimatedBloodVolumeMl) dto.estimatedBloodVolumeMl = Number(data.estimatedBloodVolumeMl);
      if (data.pictorialBloodChart) dto.pictorialBloodChart = Number(data.pictorialBloodChart);
      if (data.numberOfPadsPerDay) dto.numberOfPadsPerDay = Number(data.numberOfPadsPerDay);

      // PALM
      dto.palmPolyp = data.palmPolyp;
      dto.palmAdenomyosis = data.palmAdenomyosis;
      dto.palmLeiomyoma = data.palmLeiomyoma;
      if (data.palmLeiomyoma && data.palmLeiomyomaLocation) {
        dto.palmLeiomyomaLocation = data.palmLeiomyomaLocation;
      }
      dto.palmMalignancyOrHyperplasia = data.palmMalignancyOrHyperplasia;
      if (data.palmMalignancyDetails) dto.palmMalignancyDetails = data.palmMalignancyDetails;

      // COEIN
      dto.coeinCoagulopathy = data.coeinCoagulopathy;
      if (data.coeinCoagulopathyType) dto.coeinCoagulopathyType = data.coeinCoagulopathyType;
      dto.coeinOvulatoryDysfunction = data.coeinOvulatoryDysfunction;
      if (data.coeinOvulatoryType) dto.coeinOvulatoryType = data.coeinOvulatoryType;
      dto.coeinEndometrial = data.coeinEndometrial;
      dto.coeinIatrogenic = data.coeinIatrogenic;
      if (data.coeinIatrogenicDetails) dto.coeinIatrogenicDetails = data.coeinIatrogenicDetails;
      dto.coeinNotYetClassified = data.coeinNotYetClassified;

      // Diagnósticos
      dto.pcosDiagnosis = data.pcosDiagnosis;
      dto.endometriosisDiagnosis = data.endometriosisDiagnosis;
      if (data.endometriosisDiagnosis && data.endometriosisStage) {
        dto.endometriosisStage = data.endometriosisStage;
      }

      // Conduta
      if (data.diagnosis) dto.diagnosis = data.diagnosis;
      if (data.treatmentPlan) dto.treatmentPlan = data.treatmentPlan;
      dto.surgicalReferral = data.surgicalReferral;
      if (data.surgicalDetails) dto.surgicalDetails = data.surgicalDetails;

      // Histeroscopias — array dinâmico
      const validHysteroscopies = hysteroscopies.filter((h) => h.date || h.findings || h.conduct);
      if (validHysteroscopies.length > 0) {
        dto.hysteroscopies = validHysteroscopies;
        dto.hysteroscopyPerformed = true;
      } else {
        dto.hysteroscopyPerformed = false;
      }

      if (data.returnDate) dto.returnDate = data.returnDate;
      if (data.notes) dto.notes = data.notes;

      if (isEdit && assessment) {
        return updateMenstrualCycleAssessment(patientId, assessment.id, dto);
      }
      return createMenstrualCycleAssessment(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menstrual-cycle-assessments', patientId] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">
            {isEdit ? 'Editar avaliação de ciclo / SUA' : 'Nova avaliação de ciclo / SUA'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar avaliação. Verifique os dados e tente novamente.
            </div>
          )}

          {/* Identificação */}
          <Section title="Identificação">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data da avaliação *" error={errors.assessmentDate?.message}>
                <input
                  {...register('assessmentDate', { required: 'Obrigatório' })}
                  type="date"
                  className={inputCn(!!errors.assessmentDate)}
                />
              </Field>
              <Field label="Queixa principal *">
                <select {...register('chiefComplaint')} className={inputCn(false)}>
                  {Object.entries(COMPLAINT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Caracterização do ciclo */}
          <Section title="Caracterização do ciclo">
            <Field label="DUM">
              <input
                {...register('lastMenstrualPeriod')}
                type="date"
                className={inputCn(false)}
              />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Intervalo (dias)">
                <NumberField
                  {...register('cycleIntervalDays')}
                  min={10}
                  max={120}
                  placeholder="28"
                />
              </Field>
              <Field label="Duração (dias)">
                <NumberField
                  {...register('cycleDurationDays')}
                  min={1}
                  max={30}
                  placeholder="5"
                />
              </Field>
              <Field label="Absorventes/dia">
                <NumberField
                  {...register('numberOfPadsPerDay')}
                  min={0}
                  max={50}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Volume estimado (mL)">
                <NumberField
                  {...register('estimatedBloodVolumeMl')}
                  min={0}
                  max={1000}
                  placeholder="≤80 normal"
                />
              </Field>
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    PBAC score
                    <InfoTooltip title="PBAC — Pictorial Blood Assessment Chart">
                      Score visual em que a paciente registra, ao longo do ciclo, quantos
                      absorventes/tampões usou e o nível de saturação de cada um (parcial,
                      total, com coágulos). Cada item recebe pontos:
                      <br />
                      <br />
                      • Absorvente parcial: 1 pt<br />
                      • Absorvente moderado: 5 pts<br />
                      • Absorvente totalmente saturado: 20 pts<br />
                      • Coágulo pequeno: 1 pt · grande: 5 pts
                      <br />
                      <br />
                      <strong>Score &gt; 100</strong> = sangramento menstrual aumentado
                      (menorragia objetiva). Aplicar o gráfico durante 1-2 ciclos para
                      diagnóstico de SUA.
                    </InfoTooltip>
                  </span>
                }
              >
                <NumberField
                  {...register('pictorialBloodChart')}
                  min={0}
                  max={1000}
                  placeholder=">100 = aumentado"
                />
              </Field>
            </div>

            {cycleClass && (
              <div
                className={cn(
                  'flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm',
                  cycleClass.color === 'green' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  cycleClass.color === 'amber' && 'bg-amber-50 border-amber-200 text-amber-700',
                  cycleClass.color === 'red' && 'bg-red-50 border-red-200 text-red-700',
                )}
              >
                <div>
                  <p className="font-semibold">{cycleClass.label}</p>
                  {cycleClass.details.length > 0 && (
                    <p className="text-xs mt-0.5">{cycleClass.details.join(' · ')}</p>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* PALM — causas estruturais */}
          <Section title="PALM — Causas estruturais">
            <p className="text-xs text-gray-500 -mt-1">
              Pólipo · Adenomiose · Leiomioma · Malignidade/Hiperplasia
            </p>
            <div className="space-y-2">
              <Checkbox label="Pólipo endometrial" {...register('palmPolyp')} />
              <Checkbox label="Adenomiose" {...register('palmAdenomyosis')} />
              <Checkbox label="Leiomioma uterino" {...register('palmLeiomyoma')} />
              {palmLeiomyomaChecked && (
                <div className="ml-6">
                  <Field label="Localização (FIGO 2011)">
                    <select {...register('palmLeiomyomaLocation')} className={inputCn(false)}>
                      <option value="">— selecione —</option>
                      {Object.entries(LEIOMYOMA_FIGO_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
              <Checkbox
                label="Malignidade ou hiperplasia"
                {...register('palmMalignancyOrHyperplasia')}
              />
              {palmMalignancyChecked && (
                <div className="ml-6">
                  <Field label="Detalhes">
                    <textarea
                      {...register('palmMalignancyDetails')}
                      rows={2}
                      className={inputCn(false)}
                    />
                  </Field>
                </div>
              )}
            </div>
          </Section>

          {/* COEIN — causas não-estruturais */}
          <Section title="COEIN — Causas não-estruturais">
            <p className="text-xs text-gray-500 -mt-1">
              Coagulopatia · Ovulatória · Endometrial · Iatrogênica · Não classificada
            </p>
            <div className="space-y-2">
              <Checkbox label="Coagulopatia" {...register('coeinCoagulopathy')} />
              {coeinCoagulopathyChecked && (
                <div className="ml-6">
                  <Field label="Tipo">
                    <input
                      {...register('coeinCoagulopathyType')}
                      placeholder="Ex: doença de von Willebrand"
                      className={inputCn(false)}
                    />
                  </Field>
                </div>
              )}
              <Checkbox label="Disfunção ovulatória" {...register('coeinOvulatoryDysfunction')} />
              {coeinOvulatoryChecked && (
                <div className="ml-6">
                  <Field label="Tipo">
                    <input
                      {...register('coeinOvulatoryType')}
                      placeholder="Ex: SOP, hipotireoidismo"
                      className={inputCn(false)}
                    />
                  </Field>
                </div>
              )}
              <Checkbox label="Endometrial" {...register('coeinEndometrial')} />
              <Checkbox label="Iatrogênica" {...register('coeinIatrogenic')} />
              {coeinIatrogenicChecked && (
                <div className="ml-6">
                  <Field label="Detalhes">
                    <input
                      {...register('coeinIatrogenicDetails')}
                      placeholder="Ex: DIU-Cu, anticoagulante"
                      className={inputCn(false)}
                    />
                  </Field>
                </div>
              )}
              <Checkbox label="Não classificada" {...register('coeinNotYetClassified')} />
            </div>
          </Section>

          {/* Diagnósticos específicos */}
          <Section title="Diagnósticos específicos">
            <div className="space-y-2">
              <Checkbox label="SOP — Síndrome dos Ovários Policísticos" {...register('pcosDiagnosis')} />
              <Checkbox label="Endometriose" {...register('endometriosisDiagnosis')} />
              {endometriosisChecked && (
                <div className="ml-6">
                  <Field label="Estágio">
                    <select {...register('endometriosisStage')} className={inputCn(false)}>
                      <option value="">— selecione —</option>
                      {Object.entries(ENDOMETRIOSIS_STAGE_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
            </div>
          </Section>

          {/* Histeroscopias — múltiplas */}
          <Section title="Histeroscopias">
            {hysteroscopies.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma histeroscopia registrada.</p>
            ) : (
              <div className="space-y-3">
                {hysteroscopies.map((h, idx) => (
                  <div
                    key={idx}
                    className="border border-lilac/30 bg-lilac/5 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-lilac uppercase">
                        Histeroscopia #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHysteroscopy(idx)}
                        className="text-gray-400 hover:text-red-600"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Field label="Data">
                      <input
                        type="date"
                        value={h.date}
                        onChange={(e) => updateHysteroscopy(idx, { date: e.target.value })}
                        className={inputCn(false)}
                      />
                    </Field>
                    <Field label="Achados / diagnóstico">
                      <textarea
                        rows={2}
                        value={h.findings}
                        onChange={(e) => updateHysteroscopy(idx, { findings: e.target.value })}
                        placeholder="Ex: pólipo endometrial em parede posterior"
                        className={inputCn(false)}
                      />
                    </Field>
                    <Field label="Conduta">
                      <textarea
                        rows={2}
                        value={h.conduct}
                        onChange={(e) => updateHysteroscopy(idx, { conduct: e.target.value })}
                        placeholder="Ex: polipectomia histeroscópica"
                        className={inputCn(false)}
                      />
                    </Field>

                    {/* Anexo (foto ou PDF) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anexo (foto ou PDF)
                      </label>
                      {h.attachmentUrl ? (
                        <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                          {isImage(h.attachmentMimeType) ? (
                            <a
                              href={resolveUploadUrl(h.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <img
                                src={resolveUploadUrl(h.attachmentUrl)}
                                alt={h.attachmentName ?? ''}
                                className="w-12 h-12 object-cover rounded border border-gray-200"
                              />
                            </a>
                          ) : isPdf(h.attachmentMimeType) ? (
                            <a
                              href={resolveUploadUrl(h.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded border border-red-200 shrink-0"
                              title="Abrir PDF"
                            >
                              <FileText className="w-6 h-6" />
                            </a>
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-400 rounded shrink-0">
                              <Paperclip className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <a
                              href={resolveUploadUrl(h.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-lilac hover:underline truncate block"
                            >
                              {h.attachmentName ?? 'arquivo'}
                            </a>
                            <p className="text-xs text-gray-400">
                              {isImage(h.attachmentMimeType)
                                ? 'Imagem'
                                : isPdf(h.attachmentMimeType)
                                  ? 'PDF'
                                  : 'Arquivo'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="shrink-0 text-gray-400 hover:text-red-600 p-1"
                            title="Remover anexo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className={cn(
                            'flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-sm text-gray-600 rounded-lg cursor-pointer hover:border-lilac hover:text-lilac transition',
                            uploadingIdx === idx && 'opacity-60 cursor-wait',
                          )}
                        >
                          {uploadingIdx === idx ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Paperclip className="w-4 h-4" />
                              Anexar foto ou PDF
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            disabled={uploadingIdx === idx}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(idx, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        Formatos: JPG, PNG, WebP, PDF (máx {MAX_UPLOAD_SIZE_MB}MB)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {uploadError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {uploadError}
              </p>
            )}
            <button
              type="button"
              onClick={addHysteroscopy}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-sm text-gray-600 rounded-lg hover:border-lilac hover:text-lilac transition w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Adicionar histeroscopia
            </button>
          </Section>

          {/* Conduta */}
          <Section title="Diagnóstico e conduta">
            <Field label="Diagnóstico / impressão">
              <textarea {...register('diagnosis')} rows={2} className={inputCn(false)} />
            </Field>
            <Field label="Plano terapêutico">
              <textarea {...register('treatmentPlan')} rows={3} className={inputCn(false)} />
            </Field>
            <div className="space-y-2">
              <Checkbox label="Encaminhamento cirúrgico" {...register('surgicalReferral')} />
              {surgicalChecked && (
                <div className="ml-6">
                  <Field label="Detalhes da cirurgia">
                    <input {...register('surgicalDetails')} className={inputCn(false)} />
                  </Field>
                </div>
              )}
            </div>
            <Field label="Data de retorno">
              <input {...register('returnDate')} type="date" className={inputCn(false)} />
            </Field>
            <Field label="Observações">
              <textarea {...register('notes')} rows={3} className={inputCn(false)} />
            </Field>
          </Section>

          <div className="flex justify-end gap-3 pt-4 border-t -mx-6 px-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition disabled:opacity-60 flex items-center gap-2"
            >
              {(isSubmitting || mutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {isEdit ? 'Atualizar avaliação' : 'Salvar avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(({ label, ...rest }, ref) => (
  <label className="flex items-center gap-2 text-sm">
    <input type="checkbox" ref={ref} {...rest} />
    {label}
  </label>
));
Checkbox.displayName = 'Checkbox';

function inputCn(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac transition',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}
