import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClinicalConsultation, updateClinicalConsultation } from '../../api/clinical-consultations.api';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';

interface Props { patientId: string; initial?: any; onClose: () => void }

export default function NewClinicalConsultationModal({ patientId, initial, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!initial?.id;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      date: initial?.date ?? new Date().toISOString().split('T')[0],
      specialty: initial?.specialty ?? '',
      bpSystolic: initial?.bpSystolic ?? initial?.bp_systolic ?? '',
      bpDiastolic: initial?.bpDiastolic ?? initial?.bp_diastolic ?? '',
      heartRate: initial?.heartRate ?? initial?.heart_rate ?? '',
      temperature: initial?.temperature ?? '',
      respiratoryRate: initial?.respiratoryRate ?? initial?.respiratory_rate ?? '',
      spo2: initial?.spo2 ?? '',
      weightKg: initial?.weightKg ?? initial?.weight_kg ?? '',
      heightCm: initial?.heightCm ?? initial?.height_cm ?? '',
      subjective: initial?.subjective ?? '',
      objective: initial?.objective ?? '',
      assessment: initial?.assessment ?? '',
      plan: initial?.plan ?? '',
      diagnosis: initial?.diagnosis ?? '',
      confidentialNotes: initial?.confidentialNotes ?? initial?.confidential_notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: Record<string, unknown> = { date: data.date };
      if (data.specialty) payload.specialty = data.specialty;
      if (data.bpSystolic) payload.bpSystolic = Number(data.bpSystolic);
      if (data.bpDiastolic) payload.bpDiastolic = Number(data.bpDiastolic);
      if (data.heartRate) payload.heartRate = Number(data.heartRate);
      if (data.temperature) payload.temperature = Number(data.temperature);
      if (data.respiratoryRate) payload.respiratoryRate = Number(data.respiratoryRate);
      if (data.spo2) payload.spo2 = Number(data.spo2);
      if (data.weightKg) payload.weightKg = Number(data.weightKg);
      if (data.heightCm) payload.heightCm = Number(data.heightCm);
      if (data.subjective) payload.subjective = data.subjective;
      if (data.objective) payload.objective = data.objective;
      if (data.assessment) payload.assessment = data.assessment;
      if (data.plan) payload.plan = data.plan;
      if (data.diagnosis) payload.diagnosis = data.diagnosis;
      if (data.confidentialNotes) payload.confidentialNotes = data.confidentialNotes;
      if (isEdit) return updateClinicalConsultation(initial.id, payload);
      return createClinicalConsultation(patientId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical-consultations', patientId] });
      toast.success(isEdit ? 'Consulta atualizada' : 'Consulta registrada');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Editar Consulta Clínica' : 'Nova Consulta Clínica'} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button loading={isSubmitting || mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>Salvar</Button></>}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Data" type="date" required {...register('date')} />
          <Input label="Especialidade" placeholder="Ex: Clínica geral" {...register('specialty')} />
          <Input label="Peso (kg)" type="number" placeholder="72.5" {...register('weightKg')} />
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase pt-2">Sinais Vitais</p>
        <div className="grid grid-cols-3 gap-3">
          <Input label="PA Sistolica" type="number" placeholder="mmHg" {...register('bpSystolic')} />
          <Input label="PA Diastolica" type="number" placeholder="mmHg" {...register('bpDiastolic')} />
          <Input label="FC (bpm)" type="number" placeholder="bpm" {...register('heartRate')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Temperatura (°C)" type="number" placeholder="36.5" {...register('temperature')} />
          <Input label="FR (irpm)" type="number" placeholder="16" {...register('respiratoryRate')} />
          <Input label="SpO2 (%)" type="number" placeholder="98" {...register('spo2')} />
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase pt-2">SOAP</p>
        <Textarea label="S — Subjetivo (queixas)" rows={3} placeholder="Queixas da paciente..." {...register('subjective')} />
        <Textarea label="O — Objetivo (exame fisico)" rows={3} placeholder="Achados do exame fisico..." {...register('objective')} />
        <Textarea label="A — Avaliação (diagnóstico)" rows={2} placeholder="Hipotese diagnostica / CID-10..." {...register('assessment')} />
        <Input label="Diagnóstico" placeholder="Ex: J06.9 — IVAS" {...register('diagnosis')} />
        <Textarea label="P — Plano (conduta)" rows={3} placeholder="Prescrição, exames, retorno..." {...register('plan')} />
        <Textarea label="Notas confidenciais" rows={2} placeholder="Apenas visivel para equipe médica..." {...register('confidentialNotes')} />
      </form>
    </Modal>
  );
}
