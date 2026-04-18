import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Syringe, FlaskConical, UserCircle, FileText, Pill, FolderOpen, Stethoscope, Plus, Pencil, Trash2, Upload, Check, X, ExternalLink, Activity, ClipboardCheck } from 'lucide-react';
import {
  fetchVaccines, fetchVaginalSwabs, fetchBiologicalFather, fetchFiles, fetchPrescriptions, fetchLabResults, fetchUltrasounds,
  deleteVaccine, deleteVaginalSwab, deleteBiologicalFather, deleteFile, deletePrescription, deleteLabResult, deleteUltrasound,
  fetchPendingPatientExams, reviewPatientExam,
} from '../../../api/pregnancy.api';
import { fetchGynecologyConsultations, CONSULTATION_TYPE_LABELS } from '../../../api/gynecology-consultations.api';
import { fetchCurrentContraception, METHOD_LABELS } from '../../../api/contraception-records.api';
import { fetchPreventiveSummary } from '../../../api/preventive-exam-schedules.api';
import { cn } from '../../../utils/cn';
import AddVaccineModal from './AddVaccineModal';
import AddVaginalSwabModal from './AddVaginalSwabModal';
import AddUltrasoundModal from './AddUltrasoundModal';
import AddLabResultModal from './AddLabResultModal';
import AddPrescriptionModal from './AddPrescriptionModal';
import EditBiologicalFatherModal from './EditBiologicalFatherModal';
import AddFileModal from './AddFileModal';
import DetailModal, { type DetailField } from './DetailModal';

function fmtDate(d: any): string | null {
  if (!d) return null;
  try { return new Date(String(d) + 'T12:00:00').toLocaleDateString('pt-BR'); }
  catch { return String(d); }
}

function ItemActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
      <button onClick={onEdit} className="p-0.5 text-gray-400 hover:text-lilac" title="Editar">
        <Pencil className="w-3 h-3" />
      </button>
      <button onClick={onDelete} className="p-0.5 text-gray-400 hover:text-red-500" title="Excluir">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function useDeleteItem(fn: (id: string) => Promise<unknown>, queryKey: any[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

function confirmDelete(label: string) {
  return window.confirm(`Excluir ${label}? Esta ação não pode ser desfeita.`);
}

function SideCard({ title, icon: Icon, children, count, onAdd }: { title: string; icon: React.ElementType; children: React.ReactNode; count?: number; onAdd?: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-lilac" />
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {count != null && <span className="text-xs text-gray-400">{count}</span>}
          {onAdd && (
            <button onClick={onAdd} className="p-1 text-gray-400 hover:text-lilac" title="Adicionar">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    administered: { label: 'Em dia', color: 'bg-emerald-50 text-emerald-700' },
    scheduled: { label: 'Pendente', color: 'bg-amber-50 text-amber-700' },
    pending: { label: 'Pendente', color: 'bg-amber-50 text-amber-700' },
    overdue: { label: 'Atrasada', color: 'bg-red-50 text-red-700' },
    normal: { label: 'Normal', color: 'bg-emerald-50 text-emerald-700' },
    attention: { label: 'Alterado', color: 'bg-amber-50 text-amber-700' },
    critical: { label: 'Crítico', color: 'bg-red-50 text-red-700' },
  };
  const m = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full', m.color)}>{m.label}</span>;
}

export function VaccinesCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['vaccines', pregnancyId], queryFn: () => fetchVaccines(pregnancyId) });
  const vaccines = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteVaccine, ['vaccines', pregnancyId]);
  const fields = (v: any): DetailField[] => [
    { label: 'Vacina', value: v.vaccineName ?? v.vaccine_name, span: 2 },
    { label: 'Dose', value: v.doseNumber ?? v.dose_number },
    { label: 'Status', value: v.status },
    { label: 'Data de aplicação', value: fmtDate(v.administeredDate ?? v.administered_date) },
    { label: 'Data agendada', value: fmtDate(v.scheduledDate ?? v.scheduled_date) },
    { label: 'Lote', value: v.batchNumber ?? v.batch_number },
    { label: 'Local', value: v.location },
    { label: 'Observações', value: v.notes, span: 2, multiline: true },
  ];
  return (
    <>
      <SideCard title="Vacinas" icon={Syringe} count={vaccines.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {vaccines.length === 0 ? <p className="text-xs text-gray-400">Nenhuma vacina registrada</p> : (
          <div className="space-y-2">
            {vaccines.slice(0, 6).map((v: any) => (
              <div key={v.id} className="group flex items-center justify-between">
                <button onClick={() => setViewing(v)} className="text-xs text-gray-700 truncate flex-1 text-left hover:text-lilac">
                  {v.vaccineName ?? v.vaccine_name}
                </button>
                <StatusBadge status={v.status} />
                <ItemActions
                  onEdit={() => { setEditing(v); setOpen(true); }}
                  onDelete={() => { if (confirmDelete(`a vacina ${v.vaccineName ?? v.vaccine_name}`)) del.mutate(v.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddVaccineModal pregnancyId={pregnancyId} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
      {viewing && (
        <DetailModal
          title="Vacina"
          fields={fields(viewing)}
          onEdit={() => { setEditing(viewing); setViewing(null); setOpen(true); }}
          onDelete={() => { if (confirmDelete(`a vacina ${viewing.vaccineName ?? viewing.vaccine_name}`)) { del.mutate(viewing.id); setViewing(null); } }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

export function VaginalSwabsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['vaginal-swabs', pregnancyId], queryFn: () => fetchVaginalSwabs(pregnancyId) });
  const swabs = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteVaginalSwab, ['vaginal-swabs', pregnancyId]);
  const fields = (s: any): DetailField[] => [
    { label: 'Exame', value: s.examType ?? s.exam_type, span: 2 },
    { label: 'Data da coleta', value: fmtDate(s.collectionDate ?? s.collection_date) },
    { label: 'Resultado', value: s.resultDropdown ?? s.result_dropdown },
    { label: 'Detalhes', value: s.result, span: 2 },
    { label: 'Laboratório', value: s.labName ?? s.lab_name },
    { label: 'Status', value: s.status },
    { label: 'Observações', value: s.notes, span: 2, multiline: true },
  ];
  return (
    <>
      <SideCard title="Coletas Vaginais" icon={FlaskConical} count={swabs.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {swabs.length === 0 ? <p className="text-xs text-gray-400">Nenhuma coleta registrada</p> : (
          <div className="space-y-2">
            {swabs.slice(0, 5).map((s: any) => (
              <div key={s.id} className="group flex items-center justify-between">
                <button onClick={() => setViewing(s)} className="text-xs text-gray-700 truncate flex-1 text-left hover:text-lilac">
                  {s.examType ?? s.exam_type}
                </button>
                <StatusBadge status={s.status} />
                <ItemActions
                  onEdit={() => { setEditing(s); setOpen(true); }}
                  onDelete={() => { if (confirmDelete('esta coleta')) del.mutate(s.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddVaginalSwabModal pregnancyId={pregnancyId} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
      {viewing && (
        <DetailModal
          title="Coleta Vaginal"
          fields={fields(viewing)}
          onEdit={() => { setEditing(viewing); setViewing(null); setOpen(true); }}
          onDelete={() => { if (confirmDelete('esta coleta')) { del.mutate(viewing.id); setViewing(null); } }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

export function BiologicalFatherCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['bio-father', pregnancyId], queryFn: () => fetchBiologicalFather(pregnancyId), retry: false });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: () => deleteBiologicalFather(pregnancyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bio-father', pregnancyId] }),
  });
  return (
    <>
      <SideCard title="Pai Biológico" icon={UserCircle} onAdd={() => setOpen(true)}>
        {!data ? <p className="text-xs text-gray-400">Não informado</p> : (
          <div className="group">
            <div className="flex items-start justify-between">
              <div className="space-y-1 text-xs text-gray-700 flex-1">
                {data.name && <p>Nome: {data.name}</p>}
                {data.age && <p>Idade: {data.age}</p>}
                {data.bloodType && <p>Tipo sanguíneo: {data.bloodType ?? data.blood_type}</p>}
              </div>
              <ItemActions
                onEdit={() => setOpen(true)}
                onDelete={() => { if (confirmDelete('os dados do pai biológico')) del.mutate(); }}
              />
            </div>
          </div>
        )}
      </SideCard>
      {open && <EditBiologicalFatherModal pregnancyId={pregnancyId} initial={data} onClose={() => setOpen(false)} />}
    </>
  );
}

export function UltrasoundsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['ultrasounds', pregnancyId], queryFn: () => fetchUltrasounds(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteUltrasound, ['ultrasounds', pregnancyId]);
  const fields = (u: any): DetailField[] => [
    { label: 'Tipo de exame', value: u.examType ?? u.exam_type },
    { label: 'Data', value: fmtDate(u.examDate ?? u.exam_date) },
    { label: 'Operador', value: u.operatorName ?? u.operator_name },
    { label: 'Equipamento', value: u.equipmentModel ?? u.equipment_model },
    { label: 'Laudo', value: u.finalReport ?? u.final_report, span: 2, multiline: true },
  ];
  return (
    <>
      <SideCard title="Ultrassonografias" icon={Stethoscope} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhuma USG registrada</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((u: any) => (
              <div key={u.id} className="group flex items-start justify-between text-xs">
                <button onClick={() => setViewing(u)} className="flex-1 text-left hover:text-lilac">
                  <p className="text-gray-700 font-medium">{u.examType ?? u.exam_type}</p>
                  <p className="text-gray-400">{new Date((u.examDate ?? u.exam_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </button>
                <ItemActions
                  onEdit={() => { setEditing(u); setOpen(true); }}
                  onDelete={() => { if (confirmDelete('esta USG')) del.mutate(u.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddUltrasoundModal pregnancyId={pregnancyId} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
      {viewing && (
        <DetailModal
          title="Ultrassonografia"
          fields={fields(viewing)}
          onEdit={() => { setEditing(viewing); setViewing(null); setOpen(true); }}
          onDelete={() => { if (confirmDelete('esta USG')) { del.mutate(viewing.id); setViewing(null); } }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

export function LabResultsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['lab-results', pregnancyId], queryFn: () => fetchLabResults(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteLabResult, ['lab-results', pregnancyId]);
  const fields = (e: any): DetailField[] => {
    const refMin = e.referenceMin ?? e.reference_min;
    const refMax = e.referenceMax ?? e.reference_max;
    const refRange = refMin != null || refMax != null ? `${refMin ?? '?'} – ${refMax ?? '?'}` : null;
    return [
      { label: 'Exame', value: e.examName ?? e.exam_name, span: 2 },
      { label: 'Categoria', value: e.examCategory ?? e.exam_category },
      { label: 'Status', value: e.status },
      { label: 'Solicitado em', value: fmtDate(e.requestedAt ?? e.requested_at) },
      { label: 'Resultado em', value: fmtDate(e.resultDate ?? e.result_date) },
      { label: 'Valor', value: e.value != null ? `${e.value} ${e.unit ?? ''}`.trim() : null },
      { label: 'Referência', value: refRange },
      { label: 'Resultado em texto', value: e.resultText ?? e.result_text, span: 2 },
      { label: 'Laboratório', value: e.labName ?? e.lab_name, span: 2 },
      { label: 'Interpretação IA', value: e.aiInterpretation ?? e.ai_interpretation, span: 2, multiline: true },
      { label: 'Observações', value: e.notes, span: 2, multiline: true },
    ];
  };
  return (
    <>
      <SideCard title="Exames Laboratoriais" icon={FileText} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhum exame registrado</p> : (
          <div className="space-y-2">
            {items.slice(0, 5).map((e: any) => (
              <div key={e.id} className="group flex items-center justify-between">
                <button onClick={() => setViewing(e)} className="text-xs text-gray-700 truncate flex-1 text-left hover:text-lilac">
                  {e.examName ?? e.exam_name}
                </button>
                <StatusBadge status={e.status} />
                <ItemActions
                  onEdit={() => { setEditing(e); setOpen(true); }}
                  onDelete={() => { if (confirmDelete(`o exame ${e.examName ?? e.exam_name}`)) del.mutate(e.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddLabResultModal pregnancyId={pregnancyId} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
      {viewing && (
        <DetailModal
          title="Exame Laboratorial"
          fields={fields(viewing)}
          onEdit={() => { setEditing(viewing); setViewing(null); setOpen(true); }}
          onDelete={() => { if (confirmDelete(`o exame ${viewing.examName ?? viewing.exam_name}`)) { del.mutate(viewing.id); setViewing(null); } }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

export function PrescriptionsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['prescriptions', pregnancyId], queryFn: () => fetchPrescriptions(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deletePrescription, ['prescriptions', pregnancyId]);
  const fields = (p: any): DetailField[] => {
    const meds = (p.medications ?? []) as any[];
    const medsText = meds
      .map((m: any) => `• ${m.name ?? ''}${m.dose ? ' ' + m.dose : ''}${m.route ? ' (' + m.route + ')' : ''}${m.frequency ? ' — ' + m.frequency : ''}${m.duration ? ' por ' + m.duration : ''}`)
      .join('\n');
    return [
      { label: 'Data', value: fmtDate(p.prescriptionDate ?? p.prescription_date) },
      { label: 'Status', value: p.status },
      { label: 'Medicamentos', value: medsText, span: 2, multiline: true },
      { label: 'Observações', value: p.notes, span: 2, multiline: true },
    ];
  };
  return (
    <>
      <SideCard title="Prescrições" icon={Pill} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhuma prescrição</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((p: any) => (
              <div key={p.id} className="group flex items-start justify-between text-xs">
                <button onClick={() => setViewing(p)} className="flex-1 text-left hover:text-lilac">
                  <p className="text-gray-700">{new Date((p.prescriptionDate ?? p.prescription_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <StatusBadge status={p.status} />
                </button>
                <ItemActions
                  onEdit={() => { setEditing(p); setOpen(true); }}
                  onDelete={() => { if (confirmDelete('esta prescrição')) del.mutate(p.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddPrescriptionModal pregnancyId={pregnancyId} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
      {viewing && (
        <DetailModal
          title="Prescrição"
          fields={fields(viewing)}
          onEdit={() => { setEditing(viewing); setViewing(null); setOpen(true); }}
          onDelete={() => { if (confirmDelete('esta prescrição')) { del.mutate(viewing.id); setViewing(null); } }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

export function FilesCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['files', pregnancyId], queryFn: () => fetchFiles(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteFile, ['files', pregnancyId]);
  const fields = (f: any): DetailField[] => [
    { label: 'Nome', value: f.fileName ?? f.file_name, span: 2 },
    { label: 'Tipo', value: f.fileType ?? f.file_type },
    { label: 'Tamanho', value: f.fileSize ?? f.file_size },
    { label: 'URL', value: f.fileUrl ?? f.file_url, span: 2 },
    { label: 'Visível para paciente', value: f.isVisibleToPatient ?? f.is_visible_to_patient },
    { label: 'Descrição', value: f.description, span: 2, multiline: true },
  ];
  return (
    <>
      <SideCard title="Arquivos" icon={FolderOpen} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhum arquivo</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((f: any) => (
              <div key={f.id} className="group flex items-center justify-between">
                <button onClick={() => setViewing(f)} className="text-xs text-gray-700 truncate flex-1 text-left hover:text-lilac">
                  {f.fileName ?? f.file_name}
                </button>
                <ItemActions
                  onEdit={() => { setEditing(f); setOpen(true); }}
                  onDelete={() => { if (confirmDelete(`o arquivo ${f.fileName ?? f.file_name}`)) del.mutate(f.id); }}
                />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddFileModal pregnancyId={pregnancyId} initial={editing} onClose={() => { setOpen(false); setEditing(null); }} />}
      {viewing && (
        <DetailModal
          title="Arquivo"
          fields={fields(viewing)}
          onEdit={() => { setEditing(viewing); setViewing(null); setOpen(true); }}
          onDelete={() => { if (confirmDelete(`o arquivo ${viewing.fileName ?? viewing.file_name}`)) { del.mutate(viewing.id); setViewing(null); } }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}

export function PatientExamsReviewCard({ pregnancyId }: { pregnancyId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['patient-exams-review', pregnancyId],
    queryFn: () => fetchPendingPatientExams(pregnancyId),
  });
  const items = Array.isArray(data) ? data : [];
  const pending = items.filter((e: any) => e.review_status === 'pending_review');

  const review = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'confirmed' | 'rejected'; notes?: string }) =>
      reviewPatientExam(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-exams-review', pregnancyId] });
      qc.invalidateQueries({ queryKey: ['lab-results', pregnancyId] });
    },
  });

  if (items.length === 0) return null;

  return (
    <SideCard
      title="Exames da Paciente"
      icon={Upload}
      count={pending.length > 0 ? pending.length : items.length}
    >
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">Nenhum exame enviado</p>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 8).map((e: any) => (
            <div key={e.id} className="border-b border-gray-100 pb-2 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 font-medium truncate">{e.exam_name}</p>
                  <p className="text-[10px] text-gray-400">
                    {e.exam_date ? new Date(e.exam_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    {e.value != null && <> · {e.value}{e.unit ? ` ${e.unit}` : ''}</>}
                  </p>
                  {e.lab_name && <p className="text-[10px] text-gray-400">{e.lab_name}</p>}
                </div>
                {e.review_status === 'pending_review' ? (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => review.mutate({ id: e.id, status: 'confirmed' })}
                      className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      title="Confirmar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const notes = window.prompt('Motivo da rejeição (opcional):');
                        review.mutate({ id: e.id, status: 'rejected', notes: notes ?? undefined });
                      }}
                      className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100"
                      title="Rejeitar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className={cn(
                    'px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ml-2',
                    e.review_status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                  )}>
                    {e.review_status === 'confirmed' ? 'Confirmado' : 'Rejeitado'}
                  </span>
                )}
              </div>
            </div>
          ))}
          {pending.length > 0 && (
            <p className="text-[10px] text-amber-600 font-medium">
              {pending.length} exame{pending.length > 1 ? 's' : ''} aguardando revisão
            </p>
          )}
        </div>
      )}
    </SideCard>
  );
}

// ── Card integrado: Perfil Ginecológico ──

export function GynecologyProfileCard({ patientId }: { patientId: string }) {
  const navigate = useNavigate();

  const { data: gynData } = useQuery({
    queryKey: ['gynecology-consultations', patientId, 1, 3],
    queryFn: () => fetchGynecologyConsultations(patientId, 1, 3),
    enabled: !!patientId,
  });

  const { data: current } = useQuery({
    queryKey: ['contraception-records', patientId, 'current'],
    queryFn: () => fetchCurrentContraception(patientId),
    enabled: !!patientId,
  });

  const { data: preventive } = useQuery({
    queryKey: ['preventive-exam-schedules', patientId, 'summary'],
    queryFn: () => fetchPreventiveSummary(patientId),
    enabled: !!patientId,
  });

  const consultations = gynData?.data ?? [];
  const totalGyn = gynData?.total ?? 0;

  return (
    <SideCard title="Perfil Ginecológico" icon={Stethoscope}>
      <div className="space-y-3">
        {/* Contracepção atual */}
        {current && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Contracepção atual</p>
            <p className="text-sm font-medium text-navy mt-0.5">{METHOD_LABELS[current.currentMethod]}</p>
            {current.currentMethodDetails && (
              <p className="text-xs text-gray-500">{current.currentMethodDetails}</p>
            )}
          </div>
        )}

        {/* Rastreios preventivos */}
        {preventive?.hasSchedule && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">Rastreios preventivos</p>
            <div className="flex gap-2 mt-1">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full">
                {preventive.upToDate} em dia
              </span>
              {preventive.dueSoon > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded-full">
                  {preventive.dueSoon} vencendo
                </span>
              )}
              {preventive.overdue > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded-full">
                  {preventive.overdue} atrasados
                </span>
              )}
            </div>
          </div>
        )}

        {/* Últimas consultas ginecológicas */}
        {consultations.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase">
              Últimas consultas ({totalGyn} total)
            </p>
            <div className="space-y-1.5 mt-1">
              {consultations.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{fmtDate(c.consultationDate)}</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                    {CONSULTATION_TYPE_LABELS[c.consultationType]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link para perfil completo */}
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="flex items-center gap-1.5 w-full justify-center py-2 text-xs text-lilac hover:text-primary-dark hover:bg-lilac/5 rounded-lg transition font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver perfil ginecológico completo
        </button>
      </div>
    </SideCard>
  );
}
