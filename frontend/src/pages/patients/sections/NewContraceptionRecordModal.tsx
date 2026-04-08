import { forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import {
  createContraceptionRecord,
  updateContraceptionRecord,
  computeWHOMEC,
  METHOD_OPTIONS,
  METHOD_LABELS,
  DESIRE_LABELS,
  WHOMEC_LABELS,
  WHOMEC_DESCRIPTIONS,
  WHOMEC_BADGE_COLORS,
  SMOKING_LABELS,
  isIud,
  isImplant,
  type CreateContraceptionRecordDto,
  type ContraceptionRecord,
  type ContraceptiveMethod,
  type ReproductiveDesire,
  type SmokingStatus,
} from '../../../api/contraception-records.api';
import { InfoTooltip } from '../../../components/forms/InfoTooltip';
import { cn } from '../../../utils/cn';

interface FormData {
  consultationDate: string;

  currentMethodKey: ContraceptiveMethod | '';
  currentMethodStartDate: string;
  currentMethodDetails: string;

  desireForPregnancy: ReproductiveDesire;
  breastfeeding: boolean;

  // Fatores de risco
  smokingStatus: SmokingStatus | '';
  smokingAge35Plus: boolean;
  historyOfVTE: boolean;
  thrombophilia: boolean;
  thrombophiliaDetails: string;
  migraineWithAura: boolean;
  uncontrolledHypertension: boolean;
  diabetesWith15yearsPlus: boolean;
  breastCancerHistory: boolean;
  liverDisease: boolean;
  cardiovascularDisease: boolean;
  stroke: boolean;

  // DIU
  iudInsertionDate: string;
  iudExpirationDate: string;
  iudPositionUltrasound: string;
  iudNextCheckDate: string;

  // Implante
  implantInsertionDate: string;
  implantExpirationDate: string;
  implantLocation: string;

  // PAE
  emergencyContraceptionUsed: boolean;
  emergencyContraceptionDate: string;
  emergencyContraceptionMethod: string;

  // Conduta
  methodPrescribedKey: ContraceptiveMethod | '';
  methodPrescribedDetails: string;
  counselingProvided: boolean;
  returnDate: string;
  notes: string;
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

export default function NewContraceptionRecordModal({
  patientId,
  record,
  onClose,
}: {
  patientId: string;
  record?: ContraceptionRecord;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!record;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: record
      ? {
          consultationDate: record.consultationDate,
          currentMethodKey: record.currentMethod,
          currentMethodStartDate: record.currentMethodStartDate ?? '',
          currentMethodDetails: record.currentMethodDetails ?? '',
          desireForPregnancy: record.desireForPregnancy,
          breastfeeding: record.breastfeeding,
          smokingStatus: record.smokingStatus ?? '',
          smokingAge35Plus: record.smokingAge35Plus,
          historyOfVTE: record.historyOfVTE,
          thrombophilia: record.thrombophilia,
          thrombophiliaDetails: record.thrombophiliaDetails ?? '',
          migraineWithAura: record.migraineWithAura,
          uncontrolledHypertension: record.uncontrolledHypertension,
          diabetesWith15yearsPlus: record.diabetesWith15yearsPlus,
          breastCancerHistory: record.breastCancerHistory,
          liverDisease: record.liverDisease,
          cardiovascularDisease: record.cardiovascularDisease,
          stroke: record.stroke,
          iudInsertionDate: record.iudInsertionDate ?? '',
          iudExpirationDate: record.iudExpirationDate ?? '',
          iudPositionUltrasound: record.iudPositionUltrasound ?? '',
          iudNextCheckDate: record.iudNextCheckDate ?? '',
          implantInsertionDate: record.implantInsertionDate ?? '',
          implantExpirationDate: record.implantExpirationDate ?? '',
          implantLocation: record.implantLocation ?? '',
          emergencyContraceptionUsed: record.emergencyContraceptionUsed,
          emergencyContraceptionDate: record.emergencyContraceptionDate ?? '',
          emergencyContraceptionMethod: record.emergencyContraceptionMethod ?? '',
          methodPrescribedKey: record.methodPrescribed ?? '',
          methodPrescribedDetails: record.methodPrescribedDetails ?? '',
          counselingProvided: record.counselingProvided,
          returnDate: record.returnDate ?? '',
          notes: record.notes ?? '',
        }
      : {
          consultationDate: new Date().toISOString().split('T')[0],
          currentMethodKey: 'none',
          desireForPregnancy: 'undecided',
          breastfeeding: false,
          smokingAge35Plus: false,
          historyOfVTE: false,
          thrombophilia: false,
          migraineWithAura: false,
          uncontrolledHypertension: false,
          diabetesWith15yearsPlus: false,
          breastCancerHistory: false,
          liverDisease: false,
          cardiovascularDisease: false,
          stroke: false,
          emergencyContraceptionUsed: false,
          counselingProvided: false,
          methodPrescribedKey: '',
        },
  });

  const currentMethodKey = watch('currentMethodKey') as ContraceptiveMethod | '';
  const methodPrescribedKey = watch('methodPrescribedKey') as ContraceptiveMethod | '';
  const thrombophiliaChecked = watch('thrombophilia');
  const emergencyChecked = watch('emergencyContraceptionUsed');

  // ── Watches para cálculo OMS MEC ao vivo ──
  const watchedRisks = {
    smokingAge35Plus: !!watch('smokingAge35Plus'),
    historyOfVTE: !!watch('historyOfVTE'),
    thrombophilia: !!watch('thrombophilia'),
    migraineWithAura: !!watch('migraineWithAura'),
    uncontrolledHypertension: !!watch('uncontrolledHypertension'),
    diabetesWith15yearsPlus: !!watch('diabetesWith15yearsPlus'),
    breastCancerHistory: !!watch('breastCancerHistory'),
    liverDisease: !!watch('liverDisease'),
    cardiovascularDisease: !!watch('cardiovascularDisease'),
    stroke: !!watch('stroke'),
    breastfeeding: !!watch('breastfeeding'),
  };

  // Cálculo MEC sempre contra o método sendo prescrito
  const mecResult = computeWHOMEC(methodPrescribedKey, watchedRisks);

  // DIU/implante: mostrar campos se o método atual OU prescrito for DIU/implante
  const showIudFields = isIud(currentMethodKey || 'none') || isIud(methodPrescribedKey || 'none');
  const showImplantFields =
    isImplant(currentMethodKey || 'none') || isImplant(methodPrescribedKey || 'none');

  // Agrupar opções
  const grouped = METHOD_OPTIONS.reduce<Record<string, typeof METHOD_OPTIONS>>((acc, opt) => {
    (acc[opt.group] ??= []).push(opt);
    return acc;
  }, {});

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateContraceptionRecordDto = {
        consultationDate: data.consultationDate,
        desireForPregnancy: data.desireForPregnancy,
      };

      if (data.currentMethodKey) dto.currentMethod = data.currentMethodKey;
      if (data.currentMethodStartDate) dto.currentMethodStartDate = data.currentMethodStartDate;
      if (data.currentMethodDetails) dto.currentMethodDetails = data.currentMethodDetails;

      dto.breastfeeding = data.breastfeeding;
      // Categoria sempre vem do cálculo automático (sem override)
      if (mecResult) {
        dto.whomecCategory = mecResult.category;
      }
      if (data.smokingStatus) dto.smokingStatus = data.smokingStatus;
      dto.smokingAge35Plus = data.smokingAge35Plus;
      dto.historyOfVTE = data.historyOfVTE;
      dto.thrombophilia = data.thrombophilia;
      if (data.thrombophiliaDetails) dto.thrombophiliaDetails = data.thrombophiliaDetails;
      dto.migraineWithAura = data.migraineWithAura;
      dto.uncontrolledHypertension = data.uncontrolledHypertension;
      dto.diabetesWith15yearsPlus = data.diabetesWith15yearsPlus;
      dto.breastCancerHistory = data.breastCancerHistory;
      dto.liverDisease = data.liverDisease;
      dto.cardiovascularDisease = data.cardiovascularDisease;
      dto.stroke = data.stroke;

      if (data.iudInsertionDate) dto.iudInsertionDate = data.iudInsertionDate;
      if (data.iudExpirationDate) dto.iudExpirationDate = data.iudExpirationDate;
      if (data.iudPositionUltrasound) dto.iudPositionUltrasound = data.iudPositionUltrasound;
      if (data.iudNextCheckDate) dto.iudNextCheckDate = data.iudNextCheckDate;

      if (data.implantInsertionDate) dto.implantInsertionDate = data.implantInsertionDate;
      if (data.implantExpirationDate) dto.implantExpirationDate = data.implantExpirationDate;
      if (data.implantLocation) dto.implantLocation = data.implantLocation;

      dto.emergencyContraceptionUsed = data.emergencyContraceptionUsed;
      if (data.emergencyContraceptionDate)
        dto.emergencyContraceptionDate = data.emergencyContraceptionDate;
      if (data.emergencyContraceptionMethod)
        dto.emergencyContraceptionMethod = data.emergencyContraceptionMethod;

      if (data.methodPrescribedKey) dto.methodPrescribed = data.methodPrescribedKey;
      if (data.methodPrescribedDetails) dto.methodPrescribedDetails = data.methodPrescribedDetails;
      dto.counselingProvided = data.counselingProvided;
      if (data.returnDate) dto.returnDate = data.returnDate;
      if (data.notes) dto.notes = data.notes;

      if (isEdit && record) {
        return updateContraceptionRecord(patientId, record.id, dto);
      }
      return createContraceptionRecord(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contraception-records', patientId] });
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
            {isEdit ? 'Editar consulta de contracepção' : 'Nova consulta de contracepção'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar consulta. Verifique os dados e tente novamente.
            </div>
          )}

          {/* Identificação */}
          <Section title="Identificação">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data *" error={errors.consultationDate?.message}>
                <input
                  {...register('consultationDate', { required: 'Obrigatório' })}
                  type="date"
                  className={inputCn(!!errors.consultationDate)}
                />
              </Field>
              <Field label="Desejo reprodutivo *">
                <select {...register('desireForPregnancy')} className={inputCn(false)}>
                  {Object.entries(DESIRE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Checkbox label="Amamentando" {...register('breastfeeding')} />
          </Section>

          {/* 1. Método a prescrever + fatores de risco + cálculo MEC ao vivo */}
          <Section
            title={
              <span className="inline-flex items-center gap-1.5">
                Método e elegibilidade OMS MEC
                <InfoTooltip title="OMS MEC — Medical Eligibility Criteria 2015">
                  Critério da OMS para indicar contracepção com base em condições
                  clínicas da paciente. Cada combinação método × condição recebe uma
                  categoria:
                  <br />
                  <br />
                  <strong>Cat 1</strong> — Sem restrição. Uso livre.<br />
                  <strong>Cat 2</strong> — Vantagens superam riscos. Uso geralmente seguro.<br />
                  <strong>Cat 3</strong> — Riscos superam vantagens. Não recomendado.<br />
                  <strong>Cat 4</strong> — Risco inaceitável. Contraindicação absoluta.
                  <br />
                  <br />
                  Selecione o método candidato e marque os fatores de risco da
                  paciente — a categoria é calculada automaticamente. Se a categoria
                  for 1 ou 2, este será o método prescrito.
                </InfoTooltip>
              </span>
            }
          >
            <Field label="Método a prescrever *">
              <select {...register('methodPrescribedKey')} className={inputCn(false)}>
                <option value="">— selecione um método —</option>
                {Object.entries(grouped).map(([groupName, opts]) => (
                  <optgroup key={groupName} label={groupName}>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Fatores de risco da paciente
              </p>
              <Field label="Tabagismo">
                <select {...register('smokingStatus')} className={inputCn(false)}>
                  <option value="">—</option>
                  {Object.entries(SMOKING_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Checkbox label="Tabagista ≥35 anos" {...register('smokingAge35Plus')} />
                <Checkbox label="História de TEV" {...register('historyOfVTE')} />
                <Checkbox label="Trombofilia" {...register('thrombophilia')} />
                <Checkbox label="Enxaqueca com aura" {...register('migraineWithAura')} />
                <Checkbox label="HAS não controlada" {...register('uncontrolledHypertension')} />
                <Checkbox label="Diabetes ≥15 anos" {...register('diabetesWith15yearsPlus')} />
                <Checkbox label="Câncer de mama prévio" {...register('breastCancerHistory')} />
                <Checkbox label="Doença hepática" {...register('liverDisease')} />
                <Checkbox label="Doença cardiovascular" {...register('cardiovascularDisease')} />
                <Checkbox label="AVC prévio" {...register('stroke')} />
              </div>
              {thrombophiliaChecked && (
                <div className="mt-2">
                  <Field label="Detalhes da trombofilia">
                    <input {...register('thrombophiliaDetails')} className={inputCn(false)} />
                  </Field>
                </div>
              )}
            </div>

            {/* Card de elegibilidade ao vivo */}
            {!methodPrescribedKey || methodPrescribedKey === 'none' ? (
              <p className="text-sm text-gray-400 italic">
                Selecione um método para calcular a elegibilidade.
              </p>
            ) : mecResult ? (
              <div
                className={cn(
                  'border rounded-lg p-3 space-y-2',
                  WHOMEC_BADGE_COLORS[mecResult.category],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase font-semibold opacity-75">
                      {METHOD_LABELS[methodPrescribedKey]}
                    </p>
                    <p className="text-base font-bold mt-0.5">
                      {WHOMEC_LABELS[mecResult.category]}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/60 rounded font-semibold whitespace-nowrap">
                    Calculado
                  </span>
                </div>
                <p className="text-xs">{WHOMEC_DESCRIPTIONS[mecResult.category]}</p>
                {mecResult.reasons.length > 0 && (
                  <div className="pt-2 border-t border-current/20">
                    <p className="text-xs font-semibold mb-1">Razões:</p>
                    <ul className="text-xs space-y-0.5">
                      {mecResult.reasons.map((r, i) => (
                        <li key={i}>
                          • {r.reason}{' '}
                          <span className="opacity-60">({r.cat.toUpperCase()})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </Section>

          {/* 2. Método atual (histórico) */}
          <Section title="Método atual (histórico)">
            <Field label="Método em uso hoje">
              <select {...register('currentMethodKey')} className={inputCn(false)}>
                {Object.entries(grouped).map(([groupName, opts]) => (
                  <optgroup key={groupName} label={groupName}>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Início do uso">
                <input
                  {...register('currentMethodStartDate')}
                  type="date"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Marca / detalhes">
                <input
                  {...register('currentMethodDetails')}
                  placeholder="Ex: Mirena, Yasmin..."
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          {/* DIU — campos condicionais */}
          {showIudFields && (
            <Section title="DIU — dados específicos">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data de inserção">
                  <input {...register('iudInsertionDate')} type="date" className={inputCn(false)} />
                </Field>
                <Field label="Vencimento">
                  <input {...register('iudExpirationDate')} type="date" className={inputCn(false)} />
                </Field>
              </div>
              <Field label="Posição (USG)">
                <input
                  {...register('iudPositionUltrasound')}
                  placeholder="Ex: normal, fundo uterino"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Próximo check-up">
                <input {...register('iudNextCheckDate')} type="date" className={inputCn(false)} />
              </Field>
            </Section>
          )}

          {/* Implante — campos condicionais */}
          {showImplantFields && (
            <Section title="Implante — dados específicos">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data de inserção">
                  <input
                    {...register('implantInsertionDate')}
                    type="date"
                    className={inputCn(false)}
                  />
                </Field>
                <Field label="Vencimento">
                  <input
                    {...register('implantExpirationDate')}
                    type="date"
                    className={inputCn(false)}
                  />
                </Field>
              </div>
              <Field label="Localização">
                <input
                  {...register('implantLocation')}
                  placeholder="Ex: face interna braço não-dominante"
                  className={inputCn(false)}
                />
              </Field>
            </Section>
          )}

          {/* Contracepção de emergência */}
          <Section title="Contracepção de emergência">
            <Checkbox label="Usou PAE" {...register('emergencyContraceptionUsed')} />
            {emergencyChecked && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data">
                  <input
                    {...register('emergencyContraceptionDate')}
                    type="date"
                    className={inputCn(false)}
                  />
                </Field>
                <Field label="Método">
                  <input
                    {...register('emergencyContraceptionMethod')}
                    placeholder="Ex: Levonorgestrel 1.5mg"
                    className={inputCn(false)}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* Conduta — método já foi escolhido na seção de elegibilidade */}
          <Section title="Conduta">
            {methodPrescribedKey && methodPrescribedKey !== 'none' && mecResult && (
              <div
                className={cn(
                  'border rounded-lg px-3 py-2.5 text-sm',
                  WHOMEC_BADGE_COLORS[mecResult.category],
                )}
              >
                <p className="text-xs uppercase font-semibold opacity-75">Método prescrito</p>
                <p className="font-bold mt-0.5">
                  {METHOD_LABELS[methodPrescribedKey]}{' '}
                  <span className="font-normal opacity-75">
                    · {WHOMEC_LABELS[mecResult.category]}
                  </span>
                </p>
              </div>
            )}
            <Field label="Detalhes da prescrição">
              <input
                {...register('methodPrescribedDetails')}
                placeholder="Marca, dose, observações"
                className={inputCn(false)}
              />
            </Field>
            <Checkbox label="Aconselhamento contraceptivo realizado" {...register('counselingProvided')} />
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
              {isEdit ? 'Atualizar consulta' : 'Salvar consulta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">{title}</h3>
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

function inputCn(hasError: boolean) {
  return cn(
    'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac transition',
    hasError ? 'border-red-400' : 'border-gray-300',
  );
}
