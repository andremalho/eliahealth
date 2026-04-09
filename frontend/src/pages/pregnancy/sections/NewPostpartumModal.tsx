import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Lock, Baby } from 'lucide-react';
import { createPostpartumConsultation, updatePostpartumConsultation } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';

interface Props {
  pregnancyId: string;
  isFirst: boolean;
  initial?: any;
  onClose: () => void;
}

const LOCHIA_TYPE = [
  { value: 'rubra', label: 'Rubra (vermelha)' },
  { value: 'serosa', label: 'Serosa (rosada)' },
  { value: 'alba', label: 'Alba (branca)' },
  { value: 'absent', label: 'Ausente' },
];

const LOCHIA_AMOUNT = [
  { value: 'scant', label: 'Escassa' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'heavy', label: 'Abundante' },
];

const INVOLUTION = [
  { value: 'normal', label: 'Normal' },
  { value: 'subinvolution', label: 'Subinvolucao' },
  { value: 'not_palpable', label: 'Nao palpavel' },
];

const WOUND_STATUS = [
  { value: 'good', label: 'Boa cicatrizacao' },
  { value: 'dehiscence', label: 'Deiscencia' },
  { value: 'infection', label: 'Infeccao' },
  { value: 'hematoma', label: 'Hematoma' },
  { value: 'not_applicable', label: 'N/A' },
];

const BREASTFEEDING = [
  { value: 'exclusive', label: 'Exclusivo' },
  { value: 'predominant', label: 'Predominante' },
  { value: 'complemented', label: 'Complementado' },
  { value: 'not_breastfeeding', label: 'Nao amamenta' },
];

const BREAST_CONDITION = [
  { value: 'normal', label: 'Normal' },
  { value: 'engorgement', label: 'Ingurgitamento' },
  { value: 'fissure', label: 'Fissura' },
  { value: 'mastitis', label: 'Mastite' },
  { value: 'abscess', label: 'Abscesso' },
];

const MOOD = [
  { value: 'normal', label: 'Normal' },
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'severe', label: 'Grave' },
];

const STUMP = [
  { value: 'attached', label: 'Aderido' },
  { value: 'fallen', label: 'Caiu' },
  { value: 'infected', label: 'Infectado' },
];

export default function NewPostpartumModal({ pregnancyId, isFirst, initial, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;
  const [tab, setTab] = useState<'maternal' | 'newborn'>('maternal');

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<Record<string, any>>({
    defaultValues: {
      date: initial?.date ?? new Date().toISOString().split('T')[0],
      weightKg: initial?.weightKg ?? initial?.weight_kg ?? '',
      bpSystolic: initial?.bpSystolic ?? initial?.bp_systolic ?? '',
      bpDiastolic: initial?.bpDiastolic ?? initial?.bp_diastolic ?? '',
      temperature: initial?.temperature ?? '',
      heartRate: initial?.heartRate ?? initial?.heart_rate ?? '',
      uterineInvolution: initial?.uterineInvolution ?? initial?.uterine_involution ?? '',
      fundalHeightCm: initial?.fundalHeightCm ?? initial?.fundal_height_cm ?? '',
      lochiaType: initial?.lochiaType ?? initial?.lochia_type ?? '',
      lochiaAmount: initial?.lochiaAmount ?? initial?.lochia_amount ?? '',
      lochiaOdor: initial?.lochiaOdor ?? initial?.lochia_odor ?? false,
      woundStatus: initial?.woundStatus ?? initial?.wound_status ?? '',
      woundNotes: initial?.woundNotes ?? initial?.wound_notes ?? '',
      breastfeedingStatus: initial?.breastfeedingStatus ?? initial?.breastfeeding_status ?? '',
      breastCondition: initial?.breastCondition ?? initial?.breast_condition ?? '',
      breastfeedingNotes: initial?.breastfeedingNotes ?? initial?.breastfeeding_notes ?? '',
      moodScreening: initial?.moodScreening ?? initial?.mood_screening ?? '',
      epdsScore: initial?.epdsScore ?? initial?.epds_score ?? '',
      moodNotes: initial?.moodNotes ?? initial?.mood_notes ?? '',
      contraceptionDiscussed: initial?.contraceptionDiscussed ?? initial?.contraception_discussed ?? false,
      contraceptionMethod: initial?.contraceptionMethod ?? initial?.contraception_method ?? '',
      subjective: initial?.subjective ?? '',
      plan: initial?.plan ?? '',
      confidentialNotes: initial?.confidentialNotes ?? initial?.confidential_notes ?? '',
      // Newborn
      nbCurrentWeight: initial?.newbornData?.currentWeight ?? initial?.newborn_data?.currentWeight ?? '',
      nbFeedingWell: initial?.newbornData?.feedingWell ?? initial?.newborn_data?.feedingWell ?? true,
      nbJaundice: initial?.newbornData?.jaundice ?? initial?.newborn_data?.jaundice ?? false,
      nbUmbilicalStump: initial?.newbornData?.umbilicalStump ?? initial?.newborn_data?.umbilicalStump ?? '',
      nbVaccinesUpToDate: initial?.newbornData?.vaccinesUpToDate ?? initial?.newborn_data?.vaccinesUpToDate ?? true,
      nbHeelPrickDone: initial?.newbornData?.heelPrickDone ?? initial?.newborn_data?.heelPrickDone ?? false,
      nbHearingScreenDone: initial?.newbornData?.hearingScreenDone ?? initial?.newborn_data?.hearingScreenDone ?? false,
      nbRedReflexDone: initial?.newbornData?.redReflexDone ?? initial?.newborn_data?.redReflexDone ?? false,
      nbNotes: initial?.newbornData?.notes ?? initial?.newborn_data?.notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const payload: Record<string, unknown> = { date: data.date };

      // Vitals
      if (data.weightKg) payload.weightKg = Number(data.weightKg);
      if (data.bpSystolic) payload.bpSystolic = Number(data.bpSystolic);
      if (data.bpDiastolic) payload.bpDiastolic = Number(data.bpDiastolic);
      if (data.temperature) payload.temperature = Number(data.temperature);
      if (data.heartRate) payload.heartRate = Number(data.heartRate);

      // Uterus & Lochia
      if (data.uterineInvolution) payload.uterineInvolution = data.uterineInvolution;
      if (data.fundalHeightCm) payload.fundalHeightCm = Number(data.fundalHeightCm);
      if (data.lochiaType) payload.lochiaType = data.lochiaType;
      if (data.lochiaAmount) payload.lochiaAmount = data.lochiaAmount;
      payload.lochiaOdor = !!data.lochiaOdor;

      // Wound
      if (data.woundStatus) payload.woundStatus = data.woundStatus;
      if (data.woundNotes) payload.woundNotes = data.woundNotes;

      // Breastfeeding
      if (data.breastfeedingStatus) payload.breastfeedingStatus = data.breastfeedingStatus;
      if (data.breastCondition) payload.breastCondition = data.breastCondition;
      if (data.breastfeedingNotes) payload.breastfeedingNotes = data.breastfeedingNotes;

      // Mood
      if (data.moodScreening) payload.moodScreening = data.moodScreening;
      if (data.epdsScore) payload.epdsScore = Number(data.epdsScore);
      if (data.moodNotes) payload.moodNotes = data.moodNotes;

      // Contraception
      payload.contraceptionDiscussed = !!data.contraceptionDiscussed;
      if (data.contraceptionMethod) payload.contraceptionMethod = data.contraceptionMethod;

      // SOAP
      if (data.subjective) payload.subjective = data.subjective;
      if (data.plan) payload.plan = data.plan;
      if (data.confidentialNotes) payload.confidentialNotes = data.confidentialNotes;

      // Newborn data (only if first consultation or editing one with newborn data)
      if (isFirst || initial?.newbornData || initial?.newborn_data) {
        const nb: Record<string, unknown> = {};
        if (data.nbCurrentWeight) nb.currentWeight = Number(data.nbCurrentWeight);
        nb.feedingWell = !!data.nbFeedingWell;
        nb.jaundice = !!data.nbJaundice;
        if (data.nbUmbilicalStump) nb.umbilicalStump = data.nbUmbilicalStump;
        nb.vaccinesUpToDate = !!data.nbVaccinesUpToDate;
        nb.heelPrickDone = !!data.nbHeelPrickDone;
        nb.hearingScreenDone = !!data.nbHearingScreenDone;
        nb.redReflexDone = !!data.nbRedReflexDone;
        if (data.nbNotes) nb.notes = data.nbNotes;
        payload.newbornData = nb;
      }

      if (isEdit) return updatePostpartumConsultation(initial.id, payload);
      return createPostpartumConsultation(pregnancyId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postpartum', pregnancyId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">
            {isEdit ? 'Editar Consulta Puerperal' : 'Nova Consulta Puerperal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        {(isFirst || initial?.newbornData || initial?.newborn_data) && (
          <div className="flex border-b px-6">
            <button
              onClick={() => setTab('maternal')}
              className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px', tab === 'maternal' ? 'border-lilac text-lilac' : 'border-transparent text-gray-500')}
            >
              Mae
            </button>
            <button
              onClick={() => setTab('newborn')}
              className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5', tab === 'newborn' ? 'border-lilac text-lilac' : 'border-transparent text-gray-500')}
            >
              <Baby className="w-4 h-4" /> Recem-nascido
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {mutation.error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">Erro ao salvar consulta.</div>}

          {tab === 'maternal' ? (
            <>
              {/* Sinais Vitais */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sinais Vitais</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
                  <input {...register('date')} type="date" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
                  <input {...register('weightKg')} type="number" step="0.1" min="20" max="300" placeholder="Ex: 68.5" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">FC (bpm)</label>
                  <input {...register('heartRate')} type="number" min="40" max="200" placeholder="bpm" className={iCn} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">PA Sistolica</label>
                  <input {...register('bpSystolic')} type="number" min="50" max="250" placeholder="mmHg" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">PA Diastolica</label>
                  <input {...register('bpDiastolic')} type="number" min="30" max="150" placeholder="mmHg" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Temperatura (°C)</label>
                  <input {...register('temperature')} type="number" step="0.1" min="34" max="42" placeholder="36.5" className={iCn} /></div>
              </div>

              {/* Útero e Lóquios */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Utero e Loquios</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Involucao uterina</label>
                  <select {...register('uterineInvolution')} className={iCn}><option value="">—</option>
                    {INVOLUTION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">AU (cm)</label>
                  <input {...register('fundalHeightCm')} type="number" step="0.5" min="0" max="30" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo de loquios</label>
                  <select {...register('lochiaType')} className={iCn}><option value="">—</option>
                    {LOCHIA_TYPE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                  <select {...register('lochiaAmount')} className={iCn}><option value="">—</option>
                    {LOCHIA_AMOUNT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input {...register('lochiaOdor')} type="checkbox" className="w-4 h-4 rounded border-gray-300 text-red-500" />
                    <span className="text-xs text-gray-700">Odor fetido</span>
                  </label>
                </div>
              </div>

              {/* Ferida */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Ferida Operatoria</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Status da ferida</label>
                  <select {...register('woundStatus')} className={iCn}><option value="">—</option>
                    {WOUND_STATUS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Observacoes da ferida</label>
                  <input {...register('woundNotes')} type="text" className={iCn} /></div>
              </div>

              {/* Mamas */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Mamas e Amamentacao</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Aleitamento</label>
                  <select {...register('breastfeedingStatus')} className={iCn}><option value="">—</option>
                    {BREASTFEEDING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Condicao mamaria</label>
                  <select {...register('breastCondition')} className={iCn}><option value="">—</option>
                    {BREAST_CONDITION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Observacoes</label>
                  <input {...register('breastfeedingNotes')} type="text" className={iCn} /></div>
              </div>

              {/* Saúde Mental */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Saude Mental</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Screening de humor</label>
                  <select {...register('moodScreening')} className={iCn}><option value="">—</option>
                    {MOOD.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">EPDS (0-30)</label>
                  <input {...register('epdsScore')} type="number" min="0" max="30" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Observacoes</label>
                  <input {...register('moodNotes')} type="text" className={iCn} /></div>
              </div>

              {/* Contracepção — apenas na 1ª consulta */}
              {(isFirst || initial?.contraceptionDiscussed || initial?.contraception_discussed) && (
                <>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Contracepcao</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input {...register('contraceptionDiscussed')} type="checkbox" className="w-4 h-4 rounded border-gray-300 text-lilac" />
                        <span className="text-xs text-gray-700">Contracepcao discutida</span>
                      </label>
                    </div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Metodo escolhido</label>
                      <input {...register('contraceptionMethod')} type="text" placeholder="Ex: DIU, pilula..." className={iCn} /></div>
                  </div>
                </>
              )}

              {/* SOAP */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Avaliacao</h3>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Queixas</label>
                <textarea {...register('subjective')} rows={2} placeholder="Queixas da puerpera..." className={cn(iCn, 'resize-none')} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Conduta</label>
                <textarea {...register('plan')} rows={2} placeholder="Conduta e orientacoes..." className={cn(iCn, 'resize-none')} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Notas confidenciais</label>
                <textarea {...register('confidentialNotes')} rows={2} placeholder="Apenas visivel para equipe medica..." className={cn(iCn, 'resize-none bg-gray-50')} /></div>
            </>
          ) : (
            <>
              {/* Dados do RN */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dados do Recem-Nascido</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Peso atual (g)</label>
                  <input {...register('nbCurrentWeight')} type="number" min="500" max="10000" placeholder="Ex: 3200" className={iCn} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Coto umbilical</label>
                  <select {...register('nbUmbilicalStump')} className={iCn}><option value="">—</option>
                    {STUMP.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select></div>
              </div>

              <div className="space-y-2 pt-2">
                {([
                  ['nbFeedingWell', 'Amamentando bem'],
                  ['nbJaundice', 'Ictericia'],
                  ['nbVaccinesUpToDate', 'Vacinas em dia'],
                  ['nbHeelPrickDone', 'Teste do pezinho realizado'],
                  ['nbHearingScreenDone', 'Teste da orelhinha realizado'],
                  ['nbRedReflexDone', 'Teste do olhinho realizado'],
                ] as [string, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input {...register(key)} type="checkbox" className="w-4 h-4 rounded border-gray-300 text-lilac" />
                    <span className="text-xs text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2"><label className="block text-xs font-medium text-gray-600 mb-1">Observacoes sobre o RN</label>
                <textarea {...register('nbNotes')} rows={3} placeholder="Observacoes sobre o recem-nascido..." className={cn(iCn, 'resize-none')} /></div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2">
              {(isSubmitting || mutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac';
