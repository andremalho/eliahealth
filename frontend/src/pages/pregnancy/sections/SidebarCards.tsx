import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Syringe, FlaskConical, UserCircle, FileText, Pill, FolderOpen, Stethoscope, Plus } from 'lucide-react';
import { fetchVaccines, fetchVaginalSwabs, fetchBiologicalFather, fetchFiles, fetchPrescriptions, fetchLabResults, fetchUltrasounds } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import AddVaccineModal from './AddVaccineModal';
import AddVaginalSwabModal from './AddVaginalSwabModal';
import AddUltrasoundModal from './AddUltrasoundModal';
import AddLabResultModal from './AddLabResultModal';
import AddPrescriptionModal from './AddPrescriptionModal';
import EditBiologicalFatherModal from './EditBiologicalFatherModal';
import AddFileModal from './AddFileModal';

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
  const { data } = useQuery({ queryKey: ['vaccines', pregnancyId], queryFn: () => fetchVaccines(pregnancyId) });
  const vaccines = data?.data ?? data ?? [];
  return (
    <>
      <SideCard title="Vacinas" icon={Syringe} count={vaccines.length} onAdd={() => setOpen(true)}>
        {vaccines.length === 0 ? <p className="text-xs text-gray-400">Nenhuma vacina registrada</p> : (
          <div className="space-y-2">
            {vaccines.slice(0, 6).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{v.vaccineName ?? v.vaccine_name}</span>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddVaccineModal pregnancyId={pregnancyId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function VaginalSwabsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['vaginal-swabs', pregnancyId], queryFn: () => fetchVaginalSwabs(pregnancyId) });
  const swabs = data?.data ?? data ?? [];
  return (
    <>
      <SideCard title="Coletas Vaginais" icon={FlaskConical} count={swabs.length} onAdd={() => setOpen(true)}>
        {swabs.length === 0 ? <p className="text-xs text-gray-400">Nenhuma coleta registrada</p> : (
          <div className="space-y-2">
            {swabs.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{s.examType ?? s.exam_type}</span>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddVaginalSwabModal pregnancyId={pregnancyId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function BiologicalFatherCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['bio-father', pregnancyId], queryFn: () => fetchBiologicalFather(pregnancyId), retry: false });
  return (
    <>
      <SideCard title="Pai Biológico" icon={UserCircle} onAdd={() => setOpen(true)}>
        {!data ? <p className="text-xs text-gray-400">Não informado</p> : (
          <div className="space-y-1 text-xs text-gray-700">
            {data.name && <p>Nome: {data.name}</p>}
            {data.age && <p>Idade: {data.age}</p>}
            {data.bloodType && <p>Tipo sanguíneo: {data.bloodType ?? data.blood_type}</p>}
          </div>
        )}
      </SideCard>
      {open && <EditBiologicalFatherModal pregnancyId={pregnancyId} initial={data} onClose={() => setOpen(false)} />}
    </>
  );
}

export function UltrasoundsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['ultrasounds', pregnancyId], queryFn: () => fetchUltrasounds(pregnancyId) });
  const items = data?.data ?? data ?? [];
  return (
    <>
      <SideCard title="Ultrassonografias" icon={Stethoscope} count={items.length} onAdd={() => setOpen(true)}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhuma USG registrada</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((u: any) => (
              <div key={u.id} className="text-xs">
                <p className="text-gray-700 font-medium">{u.examType ?? u.exam_type}</p>
                <p className="text-gray-400">{new Date((u.examDate ?? u.exam_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddUltrasoundModal pregnancyId={pregnancyId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function LabResultsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['lab-results', pregnancyId], queryFn: () => fetchLabResults(pregnancyId) });
  const items = data?.data ?? data ?? [];
  return (
    <>
      <SideCard title="Exames Laboratoriais" icon={FileText} count={items.length} onAdd={() => setOpen(true)}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhum exame registrado</p> : (
          <div className="space-y-2">
            {items.slice(0, 5).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1">{e.examName ?? e.exam_name}</span>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddLabResultModal pregnancyId={pregnancyId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function PrescriptionsCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['prescriptions', pregnancyId], queryFn: () => fetchPrescriptions(pregnancyId) });
  const items = data?.data ?? data ?? [];
  return (
    <>
      <SideCard title="Prescrições" icon={Pill} count={items.length} onAdd={() => setOpen(true)}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhuma prescrição</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((p: any) => (
              <div key={p.id} className="text-xs">
                <p className="text-gray-700">{new Date((p.prescriptionDate ?? p.prescription_date) + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddPrescriptionModal pregnancyId={pregnancyId} onClose={() => setOpen(false)} />}
    </>
  );
}

export function FilesCard({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ['files', pregnancyId], queryFn: () => fetchFiles(pregnancyId) });
  const items = data?.data ?? data ?? [];
  return (
    <>
      <SideCard title="Arquivos" icon={FolderOpen} count={items.length} onAdd={() => setOpen(true)}>
        {items.length === 0 ? <p className="text-xs text-gray-400">Nenhum arquivo</p> : (
          <div className="space-y-2">
            {items.slice(0, 4).map((f: any) => (
              <p key={f.id} className="text-xs text-gray-700 truncate">{f.fileName ?? f.file_name}</p>
            ))}
          </div>
        )}
      </SideCard>
      {open && <AddFileModal pregnancyId={pregnancyId} onClose={() => setOpen(false)} />}
    </>
  );
}
