import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Baby,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import {
  fetchOICycles,
  fetchIuiCycles,
  fetchIvfCycles,
  deleteOICycle,
  deleteIuiCycle,
  deleteIvfCycle,
  OI_INDICATION_LABELS,
  OI_PROTOCOL_LABELS,
  OI_OUTCOME_LABELS,
  IUI_INDICATION_LABELS,
  SPERM_SOURCE_LABELS,
  IVF_TYPE_LABELS,
  STIM_PROTOCOL_LABELS,
  OHSS_LABELS,
  type OvulationInductionCycle,
  type IuiCycle,
  type IvfCycle,
  type ARTAlert,
} from '../../../api/assisted-reproduction.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewOICycleModal from './NewOICycleModal';
import NewIuiCycleModal from './NewIuiCycleModal';
import NewIvfCycleModal from './NewIvfCycleModal';
import { DeleteButton } from '../../../components/forms/DeleteButton';

type SubTab = 'oi' | 'iui' | 'ivf';

const SUB_TABS: { key: SubTab; label: string; description: string }[] = [
  { key: 'oi', label: 'Indução de ovulação', description: 'Coito programado / adjuvante IIU' },
  { key: 'iui', label: 'IIU', description: 'Inseminação intrauterina' },
  { key: 'ivf', label: 'FIV / ICSI', description: 'Fertilização in vitro' },
];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

type ModalState =
  | { type: 'oi'; cycle?: OvulationInductionCycle }
  | { type: 'iui'; cycle?: IuiCycle }
  | { type: 'ivf'; cycle?: IvfCycle }
  | null;

export default function AssistedReproductionSection({ patientId }: { patientId: string }) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('oi');
  const [modal, setModal] = useState<ModalState>(null);

  const openNew = () => setModal({ type: activeSubTab });
  const closeModal = () => setModal(null);
  const editOI = (cycle: OvulationInductionCycle) => setModal({ type: 'oi', cycle });
  const editIui = (cycle: IuiCycle) => setModal({ type: 'iui', cycle });
  const editIvf = (cycle: IvfCycle) => setModal({ type: 'ivf', cycle });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Reprodução assistida</h2>
          <p className="text-xs text-gray-500 mt-0.5">Indução, IIU e FIV/ICSI</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          Novo ciclo
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b mb-5">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition',
              activeSubTab === t.key
                ? 'border-lilac text-lilac bg-lilac/5'
                : 'border-transparent text-gray-600 hover:text-navy hover:bg-gray-50',
            )}
          >
            <p>{t.label}</p>
            <p className="text-[10px] font-normal text-gray-400 mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>

      {activeSubTab === 'oi' && <OIList patientId={patientId} onEdit={editOI} />}
      {activeSubTab === 'iui' && <IuiList patientId={patientId} onEdit={editIui} />}
      {activeSubTab === 'ivf' && <IvfList patientId={patientId} onEdit={editIvf} />}

      {modal?.type === 'oi' && (
        <NewOICycleModal patientId={patientId} cycle={modal.cycle} onClose={closeModal} />
      )}
      {modal?.type === 'iui' && (
        <NewIuiCycleModal patientId={patientId} cycle={modal.cycle} onClose={closeModal} />
      )}
      {modal?.type === 'ivf' && (
        <NewIvfCycleModal patientId={patientId} cycle={modal.cycle} onClose={closeModal} />
      )}
    </div>
  );
}

// ── OI ──

function OIList({
  patientId,
  onEdit,
}: {
  patientId: string;
  onEdit: (cycle: OvulationInductionCycle) => void;
}) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['oi-cycles', patientId],
    queryFn: () => fetchOICycles(patientId),
    enabled: !!patientId,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOICycle(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['oi-cycles', patientId] });
    },
  });
  const items = data ?? [];

  if (isLoading) return <SkeletonList />;
  if (items.length === 0) return <Empty label="Nenhum ciclo de indução registrado" />;

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <OICard
          key={c.id}
          item={c}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          onEdit={() => onEdit(c)}
          onDelete={() => deleteMutation.mutate(c.id)}
          isDeleting={deletingId === c.id}
        />
      ))}
    </div>
  );
}

function OICard({
  item: c,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: OvulationInductionCycle;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const alerts = c.alerts ?? [];
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <div className="flex items-center gap-2 p-4 hover:bg-gray-50 transition">
        <button
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <div className="w-10 h-10 rounded-lg bg-lilac/10 text-lilac flex items-center justify-center shrink-0 font-bold">
            #{c.cycleNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{formatDate(c.cycleStartDate)}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {OI_PROTOCOL_LABELS[c.protocol]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{OI_INDICATION_LABELS[c.indication]}</p>
          </div>
        </button>
        <AlertBadges alerts={alerts} />
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-lilac hover:bg-lilac/5 rounded transition"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <DeleteButton
          onConfirm={onDelete}
          isPending={isDeleting}
          label="Excluir ciclo"
          confirmLabel="Excluir este ciclo?"
        />
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-3">
          <DataGrid
            items={[
              { label: 'Dose inicial', value: `${c.startingDose} ${c.startingDoseUnit}` },
              c.folliclesAtTrigger !== null
                ? { label: 'Folículos no trigger', value: String(c.folliclesAtTrigger) }
                : null,
              c.endometrialThicknessAtTrigger !== null
                ? { label: 'Endométrio', value: `${c.endometrialThicknessAtTrigger} mm` }
                : null,
              c.estradiolAtTrigger !== null
                ? { label: 'E2 trigger', value: `${c.estradiolAtTrigger} pg/mL` }
                : null,
              c.outcomeType ? { label: 'Desfecho', value: OI_OUTCOME_LABELS[c.outcomeType] } : null,
              c.ohssGrade ? { label: 'OHSS', value: OHSS_LABELS[c.ohssGrade] } : null,
              c.betaHcgValue !== null ? { label: 'β-hCG', value: String(c.betaHcgValue) } : null,
            ]}
          />
          {c.notes && <Block label="Observações">{c.notes}</Block>}
          <AlertList alerts={alerts} />
        </div>
      )}
    </div>
  );
}

// ── IIU ──

function IuiList({
  patientId,
  onEdit,
}: {
  patientId: string;
  onEdit: (cycle: IuiCycle) => void;
}) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['iui-cycles', patientId],
    queryFn: () => fetchIuiCycles(patientId),
    enabled: !!patientId,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIuiCycle(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['iui-cycles', patientId] });
    },
  });
  const items = data ?? [];

  if (isLoading) return <SkeletonList />;
  if (items.length === 0) return <Empty label="Nenhum ciclo de IIU registrado" />;

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <IuiCard
          key={c.id}
          item={c}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          onEdit={() => onEdit(c)}
          onDelete={() => deleteMutation.mutate(c.id)}
          isDeleting={deletingId === c.id}
        />
      ))}
    </div>
  );
}

function IuiCard({
  item: c,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: IuiCycle;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const alerts = c.alerts ?? [];
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <div className="flex items-center gap-2 p-4 hover:bg-gray-50 transition">
        <button
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <div className="w-10 h-10 rounded-lg bg-lilac/10 text-lilac flex items-center justify-center shrink-0 font-bold">
            #{c.cycleNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{formatDate(c.iuiDate)}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {SPERM_SOURCE_LABELS[c.spermSource]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{IUI_INDICATION_LABELS[c.indication]}</p>
          </div>
        </button>
        <AlertBadges alerts={alerts} />
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-lilac hover:bg-lilac/5 rounded transition"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <DeleteButton
          onConfirm={onDelete}
          isPending={isDeleting}
          label="Excluir ciclo"
          confirmLabel="Excluir este ciclo?"
        />
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-3">
          <DataGrid
            items={[
              c.postWashTotalMotile !== null
                ? { label: 'TMSC pós-lavagem', value: `${c.postWashTotalMotile} M` }
                : null,
              c.postWashConcentration !== null
                ? { label: 'Concentração', value: `${c.postWashConcentration} M/mL` }
                : null,
              c.postWashProgressiveMotility !== null
                ? { label: 'Mot progressiva', value: `${c.postWashProgressiveMotility}%` }
                : null,
              c.betaHcgValue !== null ? { label: 'β-hCG', value: String(c.betaHcgValue) } : null,
            ]}
          />
          {c.notes && <Block label="Observações">{c.notes}</Block>}
          <AlertList alerts={alerts} />
        </div>
      )}
    </div>
  );
}

// ── FIV ──

function IvfList({
  patientId,
  onEdit,
}: {
  patientId: string;
  onEdit: (cycle: IvfCycle) => void;
}) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['ivf-cycles', patientId],
    queryFn: () => fetchIvfCycles(patientId),
    enabled: !!patientId,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIvfCycle(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['ivf-cycles', patientId] });
    },
  });
  const items = data ?? [];

  if (isLoading) return <SkeletonList />;
  if (items.length === 0) return <Empty label="Nenhum ciclo de FIV registrado" />;

  return (
    <div className="space-y-3">
      {items.map((c) => (
        <IvfCard
          key={c.id}
          item={c}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          onEdit={() => onEdit(c)}
          onDelete={() => deleteMutation.mutate(c.id)}
          isDeleting={deletingId === c.id}
        />
      ))}
    </div>
  );
}

function IvfCard({
  item: c,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: IvfCycle;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const alerts = c.alerts ?? [];
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <div className="flex items-center gap-2 p-4 hover:bg-gray-50 transition">
        <button
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <div className="w-10 h-10 rounded-lg bg-lilac/10 text-lilac flex items-center justify-center shrink-0 font-bold">
            #{c.cycleNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{IVF_TYPE_LABELS[c.cycleType]}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {STIM_PROTOCOL_LABELS[c.stimulationProtocol]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {c.totalOocytesRetrieved !== null && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded">
                  {c.totalOocytesRetrieved} oócitos
                </span>
              )}
              {c.fertilized2PN !== null && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded">
                  {c.fertilized2PN} 2PN
                </span>
              )}
              {c.fertilizationRate !== null && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded">
                  Fert {Number(c.fertilizationRate).toFixed(0)}%
                </span>
              )}
              {c.blastocysts !== null && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-pink-50 text-pink-700 rounded">
                  {c.blastocysts} blastos
                </span>
              )}
              {c.clinicalPregnancy === true && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">
                  Gestação clínica
                </span>
              )}
              {c.liveBirth === true && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-200 text-emerald-800 rounded">
                  Nascido vivo
                </span>
              )}
            </div>
          </div>
        </button>
        <AlertBadges alerts={alerts} />
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-lilac hover:bg-lilac/5 rounded transition"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <DeleteButton
          onConfirm={onDelete}
          isPending={isDeleting}
          label="Excluir ciclo"
          confirmLabel="Excluir este ciclo?"
        />
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-3">
          <DataGrid
            items={[
              c.totalFSHDose !== null ? { label: 'FSH total', value: `${c.totalFSHDose} UI` } : null,
              c.stimulationDays !== null
                ? { label: 'Dias estim.', value: String(c.stimulationDays) }
                : null,
              c.peakEstradiol !== null ? { label: 'E2 pico', value: `${c.peakEstradiol}` } : null,
              c.miiOocytes !== null ? { label: 'MII', value: String(c.miiOocytes) } : null,
              c.embryosTransferred !== null
                ? { label: 'Transferidos', value: String(c.embryosTransferred) }
                : null,
              c.endometrialThicknessAtTransfer !== null
                ? { label: 'Endométrio TX', value: `${c.endometrialThicknessAtTransfer} mm` }
                : null,
              c.cryopreservedEmbryos !== null
                ? { label: 'Crio', value: String(c.cryopreservedEmbryos) }
                : null,
              c.ohssGrade ? { label: 'OHSS', value: OHSS_LABELS[c.ohssGrade] } : null,
            ]}
          />
          {c.notes && <Block label="Observações">{c.notes}</Block>}
          <AlertList alerts={alerts} />
        </div>
      )}
    </div>
  );
}

// ── Helpers compartilhados ──

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
      <Baby className="w-10 h-10 mb-3" />
      <p className="font-medium">{label}</p>
      <p className="text-sm mt-1">Clique em "Novo ciclo" para começar</p>
    </div>
  );
}

function AlertBadges({ alerts }: { alerts: ARTAlert[] }) {
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  return (
    <div className="flex items-center gap-2 shrink-0">
      {urgentCount > 0 && (
        <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded">
          <AlertTriangle className="w-3 h-3" />
          {urgentCount}
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded">
          <AlertCircle className="w-3 h-3" />
          {warningCount}
        </span>
      )}
    </div>
  );
}

function AlertList({ alerts }: { alerts: ARTAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Alertas do copiloto</p>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const styles = {
            urgent: { Icon: AlertTriangle, cls: 'bg-red-50 border-red-200 text-red-700' },
            warning: { Icon: AlertCircle, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            info: { Icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
          };
          const s = styles[a.severity];
          return (
            <div
              key={i}
              className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-sm', s.cls)}
            >
              <s.Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{a.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataGrid({ items }: { items: ({ label: string; value: string } | null)[] }) {
  const filtered = items.filter((i): i is { label: string; value: string } => i !== null);
  if (filtered.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {filtered.map((item) => (
        <div key={item.label} className="bg-white rounded p-2.5 border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase">{item.label}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

