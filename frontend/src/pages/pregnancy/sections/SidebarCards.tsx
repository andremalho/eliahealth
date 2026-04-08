import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Syringe, FlaskConical, UserCircle, FileText, Pill, FolderOpen, Stethoscope, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  fetchVaccines, fetchVaginalSwabs, fetchBiologicalFather, fetchFiles, fetchPrescriptions, fetchLabResults, fetchUltrasounds,
  deleteVaccine, deleteVaginalSwab, deleteBiologicalFather, deleteFile, deletePrescription, deleteLabResult, deleteUltrasound,
} from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import AddVaccineModal from './AddVaccineModal';
import AddVaginalSwabModal from './AddVaginalSwabModal';
import AddUltrasoundModal from './AddUltrasoundModal';
import AddLabResultModal from './AddLabResultModal';
import AddPrescriptionModal from './AddPrescriptionModal';
import EditBiologicalFatherModal from './EditBiologicalFatherModal';
import AddFileModal from './AddFileModal';

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
  const { data } = useQuery({ queryKey: ['vaccines', pregnancyId], queryFn: () => fetchVaccines(pregnancyId) });
  const vaccines = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteVaccine, ['vaccines', pregnancyId]);
  return (
    <>
      <SideCard title="Vacinas" icon={Syringe} count={vaccines.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {vaccines.length === 0 ? <p className="text-xs text-gray-400">Nenhuma vacina registrada</p> : (
          <div className="space-y-2">
            {vaccines.slice(0, 6).map((v: any) => (
              <div key={v.id} className="group flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{v.vaccineName ?? v.vaccine_name}</span>
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
    </>
  );
}

export function VaginalSwabsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['vaginal-swabs', pregnancyId], queryFn: () => fetchVaginalSwabs(pregnancyId) });
  const swabs = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteVaginalSwab, ['vaginal-swabs', pregnancyId]);
  return (
    <>
      <SideCard title="Coletas Vaginais" icon={FlaskConical} count={swabs.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {swabs.length === 0 ? <p className="text-xs text-gray-400">Nenhuma coleta registrada</p> : (
          <div className="space-y-2">
            {swabs.slice(0, 5).map((s: any) => (
              <div key={s.id} className="group flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{s.examType ?? s.exam_type}</span>
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
  const { data } = useQuery({ queryKey: ['ultrasounds', pregnancyId], queryFn: () => fetchUltrasounds(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteUltrasound, ['ultrasounds', pregnancyId]);
  return (
    <>
      <SideCard title="Ultrassonografias" icon={Stethoscope} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhuma USG registrada</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((u: any) => (
              <div key={u.id} className="group flex items-start justify-between text-xs">
                <div className="flex-1">
                  <p className="text-gray-700 font-medium">{u.examType ?? u.exam_type}</p>
                  <p className="text-gray-400">{new Date((u.examDate ?? u.exam_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
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
    </>
  );
}

export function LabResultsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['lab-results', pregnancyId], queryFn: () => fetchLabResults(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteLabResult, ['lab-results', pregnancyId]);
  return (
    <>
      <SideCard title="Exames Laboratoriais" icon={FileText} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhum exame registrado</p> : (
          <div className="space-y-2">
            {items.slice(0, 5).map((e: any) => (
              <div key={e.id} className="group flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{e.examName ?? e.exam_name}</span>
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
    </>
  );
}

export function PrescriptionsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['prescriptions', pregnancyId], queryFn: () => fetchPrescriptions(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deletePrescription, ['prescriptions', pregnancyId]);
  return (
    <>
      <SideCard title="Prescrições" icon={Pill} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhuma prescrição</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((p: any) => (
              <div key={p.id} className="group flex items-start justify-between text-xs">
                <div className="flex-1">
                  <p className="text-gray-700">{new Date((p.prescriptionDate ?? p.prescription_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <StatusBadge status={p.status} />
                </div>
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
    </>
  );
}

export function FilesCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const { data } = useQuery({ queryKey: ['files', pregnancyId], queryFn: () => fetchFiles(pregnancyId) });
  const items = data?.data ?? data ?? [];
  const del = useDeleteItem(deleteFile, ['files', pregnancyId]);
  return (
    <>
      <SideCard title="Arquivos" icon={FolderOpen} count={items.length} onAdd={() => { setEditing(null); setOpen(true); }}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhum arquivo</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((f: any) => (
              <div key={f.id} className="group flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{f.fileName ?? f.file_name}</span>
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
    </>
  );
}
