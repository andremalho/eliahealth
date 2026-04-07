import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Lock } from 'lucide-react';
import api from '../../../api/client';
import { cn } from '../../../utils/cn';

interface Props { pregnancyId: string; onClose: () => void }

const MF_OPTIONS = ['Presentes e ativos', 'Presentes e hipoativos', 'Ausentes', 'Não avaliado'];
const EDEMA_OPTIONS = [
  { value: 'absent', label: 'Ausente' }, { value: '1plus', label: '+/4+' },
  { value: '2plus', label: '++/4+' }, { value: '3plus', label: '+++/4+' }, { value: '4plus', label: '++++/4+' },
];
const PRESENTATION_OPTIONS = [
  { value: 'cephalic', label: 'Cefálica' },
  { value: 'pelvic', label: 'Pélvica' },
  { value: 'transverse', label: 'Transversa' },
];
const CERVICAL_STATE_OPTIONS = [
  { value: 'nr', label: 'NR' },
  { value: 'impervious', label: 'Impérvio' },
  { value: 'shortened', label: 'Encurtado' },
  { value: 'softened', label: 'Amolecido' },
  { value: 'dilated', label: 'Dilatado' },
  { value: 'other', label: 'Outros' },
];

export default function NewConsultationModal({ pregnancyId, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<Record<string, string>>({
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const cervicalState = watch('cervicalState');

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const payload: Record<string, unknown> = { date: data.date };
      if (data.weightKg) payload.weightKg = Number(data.weightKg);
      if (data.bpSystolic) payload.bpSystolic = Number(data.bpSystolic);
      if (data.bpDiastolic) payload.bpDiastolic = Number(data.bpDiastolic);
      if (data.fetalHeartRate) payload.fetalHeartRate = Number(data.fetalHeartRate);
      if (data.fetalMovements) payload.fetalMovements = data.fetalMovements;
      if (data.edemaGrade) payload.edemaGrade = data.edemaGrade;
      if (data.fetalPresentation) payload.fetalPresentation = data.fetalPresentation;
      if (data.fundalHeightCm) payload.fundalHeightCm = Number(data.fundalHeightCm);
      if (data.cervicalState) {
        payload.cervicalState = data.cervicalState;
        if (data.cervicalState === 'dilated' && data.cervicalDilation) {
          payload.cervicalDilation = Number(data.cervicalDilation);
        }
        if (data.cervicalState === 'other' && data.vaginalExam) {
          payload.vaginalExam = data.vaginalExam;
        }
      }
      if (data.subjective) payload.subjective = data.subjective;
      if (data.plan) payload.plan = data.plan;
      if (data.confidentialNotes) payload.confidentialNotes = data.confidentialNotes;
      return (await api.post(`/pregnancies/${pregnancyId}/consultations`, payload)).data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations', pregnancyId] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Nova Consulta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {mutation.error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">Erro ao salvar consulta.</div>}

          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Data *</label>
              <input {...register('date')} type="date" className={iCn} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
              <input {...register('weightKg')} type="number" step="0.1" min="20" max="300" placeholder="Ex: 72.5" className={iCn} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">AU (cm)</label>
              <input {...register('fundalHeightCm')} type="number" step="0.5" min="5" max="50" placeholder="Ex: 28" className={iCn} /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">PA Sistólica</label>
              <input {...register('bpSystolic')} type="number" min="50" max="250" placeholder="mmHg" className={iCn} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">PA Diastólica</label>
              <input {...register('bpDiastolic')} type="number" min="30" max="150" placeholder="mmHg" className={iCn} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">BCF (bpm)</label>
              <input {...register('fetalHeartRate')} type="number" min="60" max="220" placeholder="bpm" className={iCn} /></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Movimentos Fetais</label>
              <select {...register('fetalMovements')} className={iCn}><option value="">—</option>
                {MF_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Edema</label>
              <select {...register('edemaGrade')} className={iCn}><option value="">—</option>
                {EDEMA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Apresentação Fetal</label>
              <select {...register('fetalPresentation')} className={iCn}><option value="">—</option>
                {PRESENTATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Toque Vaginal</label>
              <select {...register('cervicalState')} className={iCn}><option value="">—</option>
                {CERVICAL_STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></div>
            {cervicalState === 'dilated' && (
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Dilatação (cm)</label>
                <input {...register('cervicalDilation')} type="number" step="0.5" min="0" max="10" placeholder="Ex: 3" className={iCn} /></div>
            )}
            {cervicalState === 'other' && (
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <input {...register('vaginalExam')} type="text" placeholder="Descreva o achado..." className={iCn} /></div>
            )}
          </div>

          <div><label className="block text-xs font-medium text-gray-600 mb-1">Queixas</label>
            <textarea {...register('subjective')} rows={2} placeholder="Queixas da paciente..." className={cn(iCn, 'resize-none')} /></div>

          <div><label className="block text-xs font-medium text-gray-600 mb-1">Conduta</label>
            <textarea {...register('plan')} rows={2} placeholder="Conduta e orientações..." className={cn(iCn, 'resize-none')} /></div>

          <div><label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Observações confidenciais</label>
            <textarea {...register('confidentialNotes')} rows={2} placeholder="Apenas visível para equipe médica..." className={cn(iCn, 'resize-none bg-gray-50')} /></div>

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
