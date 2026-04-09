import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Baby, Plus, Pencil, Trash2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPostpartumConsultations, deletePostpartumConsultation } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import NewPostpartumModal from './NewPostpartumModal';

interface Props {
  pregnancyId: string;
}

function fmtDate(d: any): string {
  if (!d) return '—';
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return '—'; }
}

const lochiaLabel: Record<string, string> = {
  rubra: 'Rubra', serosa: 'Serosa', alba: 'Alba', absent: 'Ausente',
};
const involutionLabel: Record<string, string> = {
  normal: 'Normal', subinvolution: 'Subinvolucao', not_palpable: 'Nao palpavel',
};
const bfLabel: Record<string, string> = {
  exclusive: 'Exclusivo', predominant: 'Predominante', complemented: 'Complementado', not_breastfeeding: 'Nao amamenta',
};
const moodLabel: Record<string, string> = {
  normal: 'Normal', mild: 'Leve', moderate: 'Moderado', severe: 'Grave',
};
const woundLabel: Record<string, string> = {
  good: 'Boa', dehiscence: 'Deiscencia', infection: 'Infeccao', hematoma: 'Hematoma', not_applicable: 'N/A',
};

export default function PostpartumSection({ pregnancyId }: Props) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['postpartum', pregnancyId],
    queryFn: () => fetchPostpartumConsultations(pregnancyId),
  });

  const consultations = data?.data ?? [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePostpartumConsultation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postpartum', pregnancyId] });
      toast.success('Consulta puerperal excluida');
    },
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-lilac" />
          <h3 className="font-semibold text-navy">Consultas Puerperais</h3>
          {consultations.length > 0 && (
            <span className="text-xs text-gray-400">({consultations.length})</span>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-lilac text-white text-xs rounded-lg hover:bg-primary-dark"
        >
          <Plus className="w-3.5 h-3.5" /> Nova
        </button>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400">
          <FileText className="w-8 h-8 mb-2" />
          <p className="text-sm">Nenhuma consulta puerperal</p>
          <p className="text-xs mt-1">Registre a primeira consulta pos-parto</p>
        </div>
      ) : (
        <div className="divide-y">
          {consultations.map((c: any) => {
            const days = c.daysPostpartum ?? c.days_postpartum ?? 0;
            const alerts = c.alerts ?? [];
            const bp = (c.bpSystolic ?? c.bp_systolic) ? `${c.bpSystolic ?? c.bp_systolic}/${c.bpDiastolic ?? c.bp_diastolic}` : null;
            const lochia = c.lochiaType ?? c.lochia_type;
            const involution = c.uterineInvolution ?? c.uterine_involution;
            const bf = c.breastfeedingStatus ?? c.breastfeeding_status;
            const mood = c.moodScreening ?? c.mood_screening;
            const epds = c.epdsScore ?? c.epds_score;
            const wound = c.woundStatus ?? c.wound_status;
            const hasNb = !!(c.newbornData ?? c.newborn_data);

            return (
              <div key={c.id} className="p-4 hover:bg-gray-50 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">
                      {days}d pos-parto
                    </span>
                    <span className="text-sm text-gray-700">{fmtDate(c.date)}</span>
                    {hasNb && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">
                        <Baby className="w-3 h-3 inline" /> RN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => { setEditing(c); setModalOpen(true); }}
                      className="p-1 text-gray-400 hover:text-lilac"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Excluir esta consulta puerperal?')) deleteMut.mutate(c.id); }}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Clinical summary chips */}
                <div className="flex gap-2 mt-2 flex-wrap text-xs">
                  {bp && <Chip label="PA" value={bp} danger={(c.bpSystolic ?? c.bp_systolic) >= 140} />}
                  {involution && <Chip label="Involucao" value={involutionLabel[involution] ?? involution} />}
                  {lochia && <Chip label="Loquios" value={lochiaLabel[lochia] ?? lochia} />}
                  {wound && wound !== 'not_applicable' && <Chip label="Ferida" value={woundLabel[wound] ?? wound} danger={wound === 'infection'} />}
                  {bf && <Chip label="Aleitamento" value={bfLabel[bf] ?? bf} />}
                  {mood && <Chip label="Humor" value={moodLabel[mood] ?? mood} danger={mood === 'severe' || mood === 'moderate'} />}
                  {epds != null && <Chip label="EPDS" value={String(epds)} danger={epds >= 13} />}
                </div>

                {(c.subjective || c.plan) && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.subjective ?? c.plan}</p>
                )}

                {/* Alerts */}
                {alerts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {alerts.map((a: any, i: number) => (
                      <div key={i} className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-[11px]',
                        a.level === 'critical' ? 'bg-red-50 text-red-700' :
                        a.level === 'urgent' ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700',
                      )}>
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {a.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <NewPostpartumModal
          pregnancyId={pregnancyId}
          isFirst={consultations.length === 0}
          initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function Chip({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-[10px] font-medium',
      danger ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600',
    )}>
      {label}: {value}
    </span>
  );
}
