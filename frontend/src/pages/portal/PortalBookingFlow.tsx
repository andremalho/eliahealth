import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, ChevronLeft, ChevronRight, Clock, Upload, Shield, Check, Loader2, AlertCircle, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchAvailableSlots, bookAppointment } from '../../api/portal-appointments.api';
import { fetchDoctors } from '../../api/appointments.api';
import portalApi from '../../api/portalClient';
import { cn } from '../../utils/cn';

interface Props { alertId?: string; alertType?: string; gaMin?: number; gaMax?: number; onClose: () => void }

type Step = 'doctor' | 'info' | 'insurance' | 'documents' | 'slot' | 'confirm';

function fmtDate(d: string) {
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return d; }
}

export default function PortalBookingFlow({ alertId, alertType, gaMin, gaMax, onClose }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('doctor');
  const [doctor, setDoctor] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [insuranceType, setInsuranceType] = useState<'particular' | 'convenio'>('particular');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePlan, setInsurancePlan] = useState('');
  const [insuranceMemberId, setInsuranceMemberId] = useState('');
  const [insuranceCardUrl, setInsuranceCardUrl] = useState('');
  const [examRequestUrl, setExamRequestUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const examFileRef = useRef<HTMLInputElement>(null);

  const { data: doctors } = useQuery({ queryKey: ['portal-doctors'], queryFn: fetchDoctors, enabled: step === 'doctor' });
  const { data: slots } = useQuery({
    queryKey: ['portal-slots', doctor?.id, date],
    queryFn: () => fetchAvailableSlots(doctor!.id, date),
    enabled: step === 'slot' && !!doctor?.id,
  });

  const handleUpload = async (file: File, type: 'card' | 'exam') => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await portalApi.post('/uploads/file', form, { headers: { 'Content-Type': undefined as any } });
      if (type === 'card') setInsuranceCardUrl(data.url);
      else setExamRequestUrl(data.url);
      toast.success(type === 'card' ? 'Cartao enviado' : 'Pedido enviado');
    } catch { toast.error('Erro ao enviar arquivo'); }
    finally { setUploading(false); }
  };

  const bookMut = useMutation({
    mutationFn: () => bookAppointment({
      doctorId: doctor!.id,
      date,
      startTime: selectedSlot!.startTime,
      endTime: selectedSlot!.endTime,
      patientCpf: cpf,
      patientCep: cep,
      insuranceType,
      insuranceProvider: insuranceType === 'convenio' ? insuranceProvider : undefined,
      insurancePlan: insuranceType === 'convenio' ? insurancePlan : undefined,
      insuranceMemberId: insuranceType === 'convenio' ? insuranceMemberId : undefined,
      insuranceCardUrl: insuranceCardUrl || undefined,
      examRequestUrl: examRequestUrl || undefined,
      alertId,
    } as any),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['portal-appointments'] });
      qc.invalidateQueries({ queryKey: ['portal-alerts'] });
      toast.success('Consulta agendada! Seu codigo de check-in: ' + (data.checkinToken ?? data.checkin_token));
      onClose();
    },
    onError: () => toast.error('Horario não disponivel'),
  });

  const availableSlots = (slots ?? []).filter((s: any) => s.available);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">
            {step === 'doctor' ? 'Escolher Médico' : step === 'info' ? 'Seus Dados' : step === 'insurance' ? 'Convenio' : step === 'documents' ? 'Documentos' : step === 'slot' ? 'Horario' : 'Confirmar'}
          </h2>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Alert banner */}
        {alertType && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">Solicitação: {alertType}{gaMin && gaMax ? ` (${gaMin}-${gaMax} semanas)` : ''}</p>
          </div>
        )}

        <div className="p-6">
          {/* STEP: Doctor */}
          {step === 'doctor' && (
            <div className="space-y-2">
              {(doctors ?? []).map((d: any) => (
                <button key={d.id} onClick={() => { setDoctor({ id: d.id, name: d.name }); setStep('info'); }}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-lilac/5 text-left">
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                    {d.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">{d.name}</p>
                    {d.specialty && <p className="text-xs text-gray-400">{d.specialty}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP: Info (CPF + CEP) */}
          {step === 'info' && (
            <div className="space-y-4">
              <button onClick={() => setStep('doctor')} className="text-xs text-gray-400 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Voltar</button>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">CPF *</label>
                <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" inputMode="numeric"
                  className="w-full px-3 py-3 border rounded-lg text-base" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">CEP *</label>
                <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" inputMode="numeric"
                  className="w-full px-3 py-3 border rounded-lg text-base" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de atendimento</label>
                <div className="flex gap-2">
                  {(['particular', 'convenio'] as const).map((t) => (
                    <button key={t} onClick={() => setInsuranceType(t)}
                      className={cn('flex-1 py-3 rounded-lg text-sm font-medium border',
                        insuranceType === t ? 'bg-lilac text-white border-lilac' : 'bg-white text-gray-600 border-gray-200')}>
                      {t === 'particular' ? 'Particular' : 'Convenio'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(insuranceType === 'convenio' ? 'insurance' : 'documents')}
                disabled={!cpf || !cep}
                className="w-full py-3 bg-lilac text-white font-medium rounded-lg disabled:opacity-60">
                Continuar
              </button>
            </div>
          )}

          {/* STEP: Insurance */}
          {step === 'insurance' && (
            <div className="space-y-4">
              <button onClick={() => setStep('info')} className="text-xs text-gray-400 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Voltar</button>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Operadora *</label>
                <input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="Ex: Unimed, Amil..."
                  className="w-full px-3 py-3 border rounded-lg text-base" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Plano</label>
                <input value={insurancePlan} onChange={(e) => setInsurancePlan(e.target.value)} placeholder="Ex: Enfermaria, Apartamento..."
                  className="w-full px-3 py-3 border rounded-lg text-base" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Número da carteirinha *</label>
                <input value={insuranceMemberId} onChange={(e) => setInsuranceMemberId(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg text-base" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Foto do cartao do convenio</label>
                <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-lilac">
                  {insuranceCardUrl ? (
                    <><Check className="w-4 h-4 text-emerald-600" /><span className="text-xs text-emerald-600">Enviado</span></>
                  ) : uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-lilac" />
                  ) : (
                    <><Upload className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Toque para enviar</span></>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'card'); }} />
                </label>
              </div>
              <button onClick={() => setStep('documents')} disabled={!insuranceProvider || !insuranceMemberId}
                className="w-full py-3 bg-lilac text-white font-medium rounded-lg disabled:opacity-60">
                Continuar
              </button>
            </div>
          )}

          {/* STEP: Documents (exam request) */}
          {step === 'documents' && (
            <div className="space-y-4">
              <button onClick={() => setStep(insuranceType === 'convenio' ? 'insurance' : 'info')}
                className="text-xs text-gray-400 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Voltar</button>
              <p className="text-sm text-gray-600">Tem pedido de exame? Envie a foto ou PDF (opcional).</p>
              <label className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-lilac">
                {examRequestUrl ? (
                  <><Check className="w-5 h-5 text-emerald-600" /><span className="text-sm text-emerald-600">Pedido enviado</span></>
                ) : uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-lilac" />
                ) : (
                  <><Upload className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500">Enviar pedido de exame</span></>
                )}
                <input ref={examFileRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0], 'exam'); }} />
              </label>
              <button onClick={() => setStep('slot')}
                className="w-full py-3 bg-lilac text-white font-medium rounded-lg">
                {examRequestUrl ? 'Continuar' : 'Pular — não tenho pedido'}
              </button>
            </div>
          )}

          {/* STEP: Slot */}
          {step === 'slot' && (
            <div className="space-y-4">
              <button onClick={() => setStep('documents')} className="text-xs text-gray-400 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Voltar</button>
              <p className="text-sm text-gray-600">Dr(a) {doctor?.name}</p>
              <div className="flex items-center justify-between">
                <button onClick={() => setDate(addDays(date, -1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <p className="text-sm font-semibold text-navy">{fmtDate(date)}</p>
                <button onClick={() => setDate(addDays(date, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum horario disponivel</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((s: any) => (
                    <button key={s.startTime} onClick={() => { setSelectedSlot(s); setStep('confirm'); }}
                      className="px-3 py-3 border rounded-lg text-sm font-medium text-navy hover:border-lilac hover:bg-lilac/5 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-lilac" /> {s.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <button onClick={() => setStep('slot')} className="text-xs text-gray-400 flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Voltar</button>
              <div className="bg-lilac/5 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-navy">Resumo do agendamento</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Médico:</strong> {doctor?.name}</p>
                  <p><strong>Data:</strong> {fmtDate(date)}</p>
                  <p><strong>Horario:</strong> {selectedSlot?.startTime} - {selectedSlot?.endTime}</p>
                  <p><strong>Tipo:</strong> {insuranceType === 'particular' ? 'Particular' : `Convenio — ${insuranceProvider}`}</p>
                  {insuranceMemberId && <p><strong>Carteirinha:</strong> {insuranceMemberId}</p>}
                  {examRequestUrl && <p className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Pedido de exame enviado</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-600" />
                <p className="text-[10px] text-emerald-700">Ao confirmar, sera gerado seu codigo de check-in. No dia da consulta, use o codigo para confirmar sua chegada sem precisar passar na recepção.</p>
              </div>
              <button onClick={() => bookMut.mutate()} disabled={bookMut.isPending}
                className="w-full py-3.5 bg-lilac text-white font-medium rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                {bookMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar agendamento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
