import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Loader2 } from 'lucide-react';
import api from '../../../api/client';
import { updateConsultation } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';

interface Props { pregnancyId: string; initial?: any; onClose: () => void }

const MF_OPTIONS = [
  { value: 'Presentes e ativos', label: 'Presentes e ativos' },
  { value: 'Presentes e hipoativos', label: 'Presentes e hipoativos' },
  { value: 'Ausentes', label: 'Ausentes' },
  { value: 'Não avaliado', label: 'Nao avaliado' },
];
const EDEMA_OPTIONS = [
  { value: 'absent', label: 'Ausente' }, { value: '1plus', label: '+/4+' },
  { value: '2plus', label: '++/4+' }, { value: '3plus', label: '+++/4+' }, { value: '4plus', label: '++++/4+' },
];
const PRESENTATION_OPTIONS = [
  { value: 'cephalic', label: 'Cefalica' },
  { value: 'pelvic', label: 'Pelvica' },
  { value: 'transverse', label: 'Transversa' },
];
const CERVICAL_OPTIONS = [
  { value: 'nr', label: 'NR' },
  { value: 'impervious', label: 'Impervio' },
  { value: 'shortened', label: 'Encurtado' },
  { value: 'softened', label: 'Amolecido' },
  { value: 'dilated', label: 'Dilatado' },
  { value: 'other', label: 'Outros' },
];

export default function NewConsultationModal({ pregnancyId, initial, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<Record<string, string>>({
    defaultValues: {
      date: initial?.date ?? new Date().toISOString().split('T')[0],
      weightKg: initial?.weightKg?.toString() ?? initial?.weight_kg?.toString() ?? '',
      bpSystolic: initial?.bpSystolic?.toString() ?? initial?.bp_systolic?.toString() ?? '',
      bpDiastolic: initial?.bpDiastolic?.toString() ?? initial?.bp_diastolic?.toString() ?? '',
      fetalHeartRate: initial?.fetalHeartRate?.toString() ?? initial?.fetal_heart_rate?.toString() ?? '',
      fetalMovements: initial?.fetalMovements ?? initial?.fetal_movements ?? '',
      edemaGrade: initial?.edemaGrade ?? initial?.edema_grade ?? '',
      fetalPresentation: initial?.fetalPresentation ?? initial?.fetal_presentation ?? '',
      fundalHeightCm: initial?.fundalHeightCm?.toString() ?? initial?.fundal_height_cm?.toString() ?? '',
      cervicalState: initial?.cervicalState ?? initial?.cervical_state ?? '',
      cervicalDilation: initial?.cervicalDilation?.toString() ?? initial?.cervical_dilation?.toString() ?? '',
      vaginalExam: initial?.vaginalExam ?? initial?.vaginal_exam ?? '',
      subjective: initial?.subjective ?? '',
      plan: initial?.plan ?? '',
      confidentialNotes: initial?.confidentialNotes ?? initial?.confidential_notes ?? '',
    },
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
        if (data.cervicalState === 'dilated' && data.cervicalDilation) payload.cervicalDilation = Number(data.cervicalDilation);
        if (data.cervicalState === 'other' && data.vaginalExam) payload.vaginalExam = data.vaginalExam;
      }
      if (data.subjective) payload.subjective = data.subjective;
      if (data.plan) payload.plan = data.plan;
      if (data.confidentialNotes) payload.confidentialNotes = data.confidentialNotes;
      if (isEdit) return updateConsultation(initial.id, payload);
      return (await api.post(`/pregnancies/${pregnancyId}/consultations`, payload)).data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations', pregnancyId] }); onClose(); },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar Consulta' : 'Nova Consulta'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button loading={isSubmitting || mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>
            Salvar
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {mutation.error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">Erro ao salvar consulta.</div>}

        <div className="grid grid-cols-3 gap-3">
          <Input label="Data" type="date" required {...register('date')} />
          <Input label="Peso (kg)" type="number" placeholder="72.5" {...register('weightKg')} />
          <Input label="AU (cm)" type="number" placeholder="28" {...register('fundalHeightCm')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input label="PA Sistolica" type="number" placeholder="mmHg" {...register('bpSystolic')} />
          <Input label="PA Diastolica" type="number" placeholder="mmHg" {...register('bpDiastolic')} />
          <Input label="BCF (bpm)" type="number" placeholder="bpm" {...register('fetalHeartRate')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select label="Movimentos Fetais" options={MF_OPTIONS} placeholder="—" {...register('fetalMovements')} />
          <Select label="Edema" options={EDEMA_OPTIONS} placeholder="—" {...register('edemaGrade')} />
          <Select label="Apresentacao Fetal" options={PRESENTATION_OPTIONS} placeholder="—" {...register('fetalPresentation')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select label="Toque Vaginal" options={CERVICAL_OPTIONS} placeholder="—" {...register('cervicalState')} />
          {cervicalState === 'dilated' && (
            <Input label="Dilatacao (cm)" type="number" placeholder="3" {...register('cervicalDilation')} />
          )}
          {cervicalState === 'other' && (
            <div className="col-span-2">
              <Input label="Descricao" placeholder="Descreva o achado..." {...register('vaginalExam')} />
            </div>
          )}
        </div>

        <Textarea label="Queixas" rows={2} placeholder="Queixas da paciente..." {...register('subjective')} />
        <Textarea label="Conduta" rows={2} placeholder="Conduta e orientacoes..." {...register('plan')} />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Observacoes confidenciais
          </label>
          <textarea {...register('confidentialNotes')} rows={2} placeholder="Apenas visivel para equipe medica..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac bg-gray-50" />
        </div>
      </form>
    </Modal>
  );
}
