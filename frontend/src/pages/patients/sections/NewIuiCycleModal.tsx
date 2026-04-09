import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import {
  createIuiCycle,
  updateIuiCycle,
  IUI_INDICATION_LABELS,
  SPERM_PREP_LABELS,
  SPERM_SOURCE_LABELS,
  type CreateIuiCycleDto,
  type IuiCycle,
  type IUIIndication,
  type SpermPrep,
  type SpermSource,
  type TechnicalDifficulty,
} from '../../../api/assisted-reproduction.api';
import { cn } from '../../../utils/cn';

interface FormData {
  cycleNumber: string;
  iuiDate: string;
  indication: IUIIndication;
  spermPreparationMethod: SpermPrep;
  spermSource: SpermSource;
  postWashConcentration: string;
  postWashTotalMotile: string;
  postWashProgressiveMotility: string;
  technicalDifficulty: TechnicalDifficulty | '';
  luteralSupport: boolean;
  betaHcgValue: string;
  clinicalPregnancy: boolean;
  notes: string;
}

export default function NewIuiCycleModal({
  patientId,
  cycle,
  onClose,
}: {
  patientId: string;
  cycle?: IuiCycle;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!cycle;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: cycle
      ? {
          cycleNumber: cycle.cycleNumber.toString(),
          iuiDate: cycle.iuiDate,
          indication: cycle.indication,
          spermPreparationMethod: cycle.spermPreparationMethod,
          spermSource: cycle.spermSource,
          postWashConcentration: cycle.postWashConcentration?.toString() ?? '',
          postWashTotalMotile: cycle.postWashTotalMotile?.toString() ?? '',
          postWashProgressiveMotility: cycle.postWashProgressiveMotility?.toString() ?? '',
          technicalDifficulty: cycle.technicalDifficulty ?? '',
          luteralSupport: cycle.luteralSupport,
          betaHcgValue: cycle.betaHcgValue?.toString() ?? '',
          clinicalPregnancy: !!cycle.clinicalPregnancy,
          notes: cycle.notes ?? '',
        }
      : {
          cycleNumber: '1',
          iuiDate: new Date().toISOString().split('T')[0],
          indication: 'unexplained',
          spermPreparationMethod: 'density_gradient',
          spermSource: 'partner',
          luteralSupport: false,
          clinicalPregnancy: false,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto: CreateIuiCycleDto = {
        cycleNumber: Number(data.cycleNumber),
        iuiDate: data.iuiDate,
        indication: data.indication,
        spermPreparationMethod: data.spermPreparationMethod,
        spermSource: data.spermSource,
      };
      if (data.postWashConcentration) dto.postWashConcentration = Number(data.postWashConcentration);
      if (data.postWashTotalMotile) dto.postWashTotalMotile = Number(data.postWashTotalMotile);
      if (data.postWashProgressiveMotility)
        dto.postWashProgressiveMotility = Number(data.postWashProgressiveMotility);
      if (data.technicalDifficulty) dto.technicalDifficulty = data.technicalDifficulty;
      dto.luteralSupport = data.luteralSupport;
      if (data.betaHcgValue) dto.betaHcgValue = Number(data.betaHcgValue);
      dto.clinicalPregnancy = data.clinicalPregnancy;
      if (data.notes) dto.notes = data.notes;
      if (isEdit && cycle) {
        return updateIuiCycle(patientId, cycle.id, dto);
      }
      return createIuiCycle(patientId, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iui-cycles', patientId] });
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
            {isEdit ? 'Editar ciclo de IIU' : 'Novo ciclo de IIU'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-6">
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Erro ao registrar ciclo. Verifique os dados.
            </div>
          )}

          <Section title="Identificação">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Ciclo nº *" error={errors.cycleNumber?.message}>
                <input
                  {...register('cycleNumber', { required: 'Obrigatório' })}
                  type="number"
                  min={1}
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Data da IIU *">
                <input
                  {...register('iuiDate', { required: 'Obrigatório' })}
                  type="date"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Indicação *">
                <select {...register('indication')} className={inputCn(false)}>
                  {Object.entries(IUI_INDICATION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Preparo do sêmen">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Método de preparo *">
                <select {...register('spermPreparationMethod')} className={inputCn(false)}>
                  {Object.entries(SPERM_PREP_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Origem *">
                <select {...register('spermSource')} className={inputCn(false)}>
                  {Object.entries(SPERM_SOURCE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Concentração (M/mL)">
                <input
                  {...register('postWashConcentration')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="TMSC (M)">
                <input
                  {...register('postWashTotalMotile')}
                  type="number"
                  step="0.1"
                  placeholder="≥5 ideal"
                  className={inputCn(false)}
                />
              </Field>
              <Field label="Mot prog (%)">
                <input
                  {...register('postWashProgressiveMotility')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Procedimento e desfecho">
            <Field label="Dificuldade técnica">
              <select {...register('technicalDifficulty')} className={inputCn(false)}>
                <option value="">—</option>
                <option value="easy">Fácil</option>
                <option value="moderate">Moderada</option>
                <option value="difficult">Difícil</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('luteralSupport')} />
              Suporte de fase lútea
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Field label="β-hCG">
                <input
                  {...register('betaHcgValue')}
                  type="number"
                  step="0.1"
                  className={inputCn(false)}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm mt-7">
                <input type="checkbox" {...register('clinicalPregnancy')} />
                Gestação clínica
              </label>
            </div>
            <Field label="Observações">
              <textarea {...register('notes')} rows={2} className={inputCn(false)} />
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
              {isEdit ? 'Atualizar ciclo' : 'Salvar ciclo'}
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
  label: string;
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
