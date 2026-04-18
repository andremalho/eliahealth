import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Plus, AlertCircle, ChevronDown, ChevronUp, LogOut, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { fetchActiveHospitalizations, fetchEvolutions, addEvolution, dischargePatient } from '../../api/hospitalization.api';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';

function fmtDateTime(d: any): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function HospitalizationPage() {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [evoModal, setEvoModal] = useState<string | null>(null); // hospitalization id
  const [dischargeModal, setDischargeModal] = useState<string | null>(null);
  const [evoForm, setEvoForm] = useState<Record<string, string>>({});
  const [dischargeForm, setDischargeForm] = useState({ summary: '', diagnosis: '', instructions: '' });

  const { data: active } = useQuery({ queryKey: ['hospitalizations-active'], queryFn: fetchActiveHospitalizations });
  const items = Array.isArray(active) ? active : [];

  const { data: evolutions } = useQuery({
    queryKey: ['evolutions', expandedId],
    queryFn: () => fetchEvolutions(expandedId!),
    enabled: !!expandedId,
  });

  const addEvoMut = useMutation({
    mutationFn: () => addEvolution(evoModal!, evoForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evolutions'] }); toast.success('Evolução registrada'); setEvoModal(null); setEvoForm({}); },
  });

  const dischargeMut = useMutation({
    mutationFn: () => dischargePatient(dischargeModal!, { dischargeSummary: dischargeForm.summary, dischargeDiagnosis: dischargeForm.diagnosis, dischargeInstructions: dischargeForm.instructions }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hospitalizations-active'] }); toast.success('Alta registrada'); setDischargeModal(null); },
  });

  const evoList = Array.isArray(evolutions) ? evolutions : [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Internações</h1>
          <p className="text-sm text-gray-500">{items.length} paciente{items.length !== 1 ? 's' : ''} internada{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card><EmptyState icon={<BedDouble className="w-12 h-12" />} title="Nenhuma internação ativa" /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((h: any) => {
            const isExp = expandedId === h.id;
            const alerts = h.alerts ?? [];
            return (
              <Card key={h.id} padding="none">
                <button onClick={() => setExpandedId(isExp ? null : h.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
                  <div className="flex items-center gap-3">
                    <BedDouble className="w-5 h-5 text-lilac shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-navy">{h.patient?.fullName ?? '—'}</p>
                      <p className="text-xs text-gray-500">{h.admissionDiagnosis ?? h.admission_diagnosis} · {h.bed ?? h.ward ?? ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{h.admissionType ?? h.admission_type}</Badge>
                    {alerts.length > 0 && <Badge variant="danger">{alerts.length}</Badge>}
                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExp && (
                  <div className="border-t px-5 py-4 space-y-4">
                    <div className="flex gap-2">
                      <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEvoModal(h.id)}>Nova evolução</Button>
                      <Button size="sm" variant="outline" icon={<LogOut className="w-3.5 h-3.5" />} onClick={() => setDischargeModal(h.id)}>Alta</Button>
                    </div>

                    {evoList.length === 0 ? (
                      <p className="text-xs text-gray-400">Nenhuma evolução registrada</p>
                    ) : (
                      <div className="space-y-2">
                        {evoList.map((e: any) => (
                          <div key={e.id} className="border border-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-500">{fmtDateTime(e.evolutionDate ?? e.evolution_date)}</span>
                              <Badge size="xs">{e.type}</Badge>
                              <span className="text-xs text-gray-400">{e.author?.name ?? ''}</span>
                            </div>
                            {(e.bpSystolic || e.bp_systolic) && <p className="text-xs">PA: {e.bpSystolic ?? e.bp_systolic}/{e.bpDiastolic ?? e.bp_diastolic} · FC: {e.heartRate ?? e.heart_rate ?? '—'} · T: {e.temperature ?? '—'}°C · SpO2: {e.spo2 ?? '—'}%</p>}
                            {e.subjective && <p className="text-xs text-gray-700 mt-1">{e.subjective}</p>}
                            {e.plan && <p className="text-xs text-gray-600 mt-1"><strong>Conduta:</strong> {e.plan}</p>}
                            {e.alerts?.map((a: any, i: number) => (
                              <div key={i} className={cn('flex items-center gap-1 mt-1 text-[10px]', a.level === 'critical' ? 'text-red-600' : 'text-amber-600')}>
                                <AlertCircle className="w-3 h-3" /> {a.message}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Evolution modal */}
      <Modal open={!!evoModal} onClose={() => setEvoModal(null)} title="Nova Evolução" size="lg"
        footer={<><Button variant="ghost" onClick={() => setEvoModal(null)}>Cancelar</Button><Button loading={addEvoMut.isPending} onClick={() => addEvoMut.mutate()}>Salvar</Button></>}>
        <div className="space-y-3">
          <Select label="Tipo" options={[{value:'medical',label:'Médica'},{value:'nursing',label:'Enfermagem'},{value:'postpartum',label:'Puerperal'},{value:'surgical',label:'Cirurgica'}]}
            value={evoForm.type ?? 'medical'} onChange={(e) => setEvoForm({ ...evoForm, type: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="PA Sist." type="number" value={evoForm.bpSystolic ?? ''} onChange={(e) => setEvoForm({ ...evoForm, bpSystolic: e.target.value })} />
            <Input label="PA Diast." type="number" value={evoForm.bpDiastolic ?? ''} onChange={(e) => setEvoForm({ ...evoForm, bpDiastolic: e.target.value })} />
            <Input label="FC" type="number" value={evoForm.heartRate ?? ''} onChange={(e) => setEvoForm({ ...evoForm, heartRate: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Temp (°C)" type="number" value={evoForm.temperature ?? ''} onChange={(e) => setEvoForm({ ...evoForm, temperature: e.target.value })} />
            <Input label="SpO2 (%)" type="number" value={evoForm.spo2 ?? ''} onChange={(e) => setEvoForm({ ...evoForm, spo2: e.target.value })} />
            <Input label="Diurese (mL/h)" type="number" value={evoForm.diuresisMl ?? ''} onChange={(e) => setEvoForm({ ...evoForm, diuresisMl: e.target.value })} />
          </div>
          <Textarea label="Subjetivo" rows={2} value={evoForm.subjective ?? ''} onChange={(e) => setEvoForm({ ...evoForm, subjective: e.target.value })} />
          <Textarea label="Objetivo" rows={2} value={evoForm.objective ?? ''} onChange={(e) => setEvoForm({ ...evoForm, objective: e.target.value })} />
          <Textarea label="Plano / Conduta" rows={2} value={evoForm.plan ?? ''} onChange={(e) => setEvoForm({ ...evoForm, plan: e.target.value })} />
        </div>
      </Modal>

      {/* Discharge modal */}
      <Modal open={!!dischargeModal} onClose={() => setDischargeModal(null)} title="Alta Hospitalar" size="md"
        footer={<><Button variant="ghost" onClick={() => setDischargeModal(null)}>Cancelar</Button><Button variant="success" loading={dischargeMut.isPending} onClick={() => dischargeMut.mutate()}>Registrar alta</Button></>}>
        <div className="space-y-3">
          <Textarea label="Resumo da alta" rows={4} required value={dischargeForm.summary} onChange={(e) => setDischargeForm({ ...dischargeForm, summary: e.target.value })} />
          <Input label="Diagnóstico de alta" value={dischargeForm.diagnosis} onChange={(e) => setDischargeForm({ ...dischargeForm, diagnosis: e.target.value })} />
          <Textarea label="Instruções pós-alta" rows={3} value={dischargeForm.instructions} onChange={(e) => setDischargeForm({ ...dischargeForm, instructions: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
