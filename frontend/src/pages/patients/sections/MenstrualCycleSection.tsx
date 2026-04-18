import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import {
  fetchMenstrualCycleAssessments,
  deleteMenstrualCycleAssessment,
  COMPLAINT_LABELS,
  LEIOMYOMA_FIGO_LABELS,
  ENDOMETRIOSIS_STAGE_LABELS,
  type MenstrualCycleAssessment,
  type MenstrualCycleAlert,
} from '../../../api/menstrual-cycle-assessments.api';
import { isImage, isPdf, resolveUploadUrl } from '../../../api/uploads.api';
import { FileText, Paperclip } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewMenstrualCycleAssessmentModal from './NewMenstrualCycleAssessmentModal';
import { DeleteButton } from '../../../components/forms/DeleteButton';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function MenstrualCycleSection({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenstrualCycleAssessment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['menstrual-cycle-assessments', patientId],
    queryFn: () => fetchMenstrualCycleAssessments(patientId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenstrualCycleAssessment(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['menstrual-cycle-assessments', patientId] });
    },
  });

  const items = data?.data ?? [];

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const openEdit = (item: MenstrualCycleAssessment) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Avaliações de Ciclo / SUA</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sangramento Uterino Anormal — classificação PALM-COEIN (FIGO)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          Nova avaliação
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <Activity className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma avaliação registrada</p>
          <p className="text-sm mt-1">Clique em "Nova avaliação" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card
              key={it.id}
              item={it}
              expanded={expandedId === it.id}
              onToggle={() => setExpandedId(expandedId === it.id ? null : it.id)}
              onEdit={() => openEdit(it)}
              onDelete={() => deleteMutation.mutate(it.id)}
              isDeleting={deletingId === it.id}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewMenstrualCycleAssessmentModal
          patientId={patientId}
          assessment={editingItem ?? undefined}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function Card({
  item: c,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: MenstrualCycleAssessment;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const alerts = c.alerts ?? [];
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  // PALM tags
  const palmTags: string[] = [];
  if (c.palmPolyp) palmTags.push('Pólipo');
  if (c.palmAdenomyosis) palmTags.push('Adenomiose');
  if (c.palmLeiomyoma) palmTags.push('Leiomioma');
  if (c.palmMalignancyOrHyperplasia) palmTags.push('Malignidade/Hiperplasia');

  // COEIN tags
  const coeinTags: string[] = [];
  if (c.coeinCoagulopathy) coeinTags.push('Coagulopatia');
  if (c.coeinOvulatoryDysfunction) coeinTags.push('Disfunção ovulatória');
  if (c.coeinEndometrial) coeinTags.push('Endometrial');
  if (c.coeinIatrogenic) coeinTags.push('Iatrogênica');
  if (c.coeinNotYetClassified) coeinTags.push('Não classificada');

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <div className="flex items-center gap-2 p-4 hover:bg-gray-50 transition">
        <button
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left min-w-0"
        >
          <div className="w-10 h-10 rounded-lg bg-lilac/10 text-lilac flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">{formatDate(c.assessmentDate)}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded truncate max-w-xs">
                {COMPLAINT_LABELS[c.chiefComplaint]}
              </span>
            </div>
            {(palmTags.length > 0 || coeinTags.length > 0) && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {palmTags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded"
                  >
                    PALM: {t}
                  </span>
                ))}
                {coeinTags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded"
                  >
                    COEIN: {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
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
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-lilac hover:bg-lilac/5 rounded transition"
            aria-label="Editar avaliação"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <DeleteButton
            onConfirm={onDelete}
            isPending={isDeleting}
            label="Excluir avaliação"
            confirmLabel="Excluir esta avaliação?"
          />
          <button
            onClick={onToggle}
            className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded transition"
            aria-expanded={expanded}
            aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-4">
          <DataGrid
            items={[
              c.cycleIntervalDays
                ? { label: 'Intervalo', value: `${c.cycleIntervalDays} dias` }
                : null,
              c.cycleDurationDays
                ? { label: 'Duração', value: `${c.cycleDurationDays} dias` }
                : null,
              c.lastMenstrualPeriod
                ? { label: 'DUM', title: 'Data da Última Menstruação', value: formatDate(c.lastMenstrualPeriod) }
                : null,
              c.estimatedBloodVolumeMl
                ? { label: 'Volume', value: `${c.estimatedBloodVolumeMl} mL` }
                : null,
              c.pictorialBloodChart
                ? { label: 'PBAC', title: 'Pictorial Blood Assessment Chart', value: String(c.pictorialBloodChart) }
                : null,
              c.numberOfPadsPerDay
                ? { label: 'Absorventes/dia', value: String(c.numberOfPadsPerDay) }
                : null,
            ]}
          />

          {c.palmLeiomyoma && c.palmLeiomyomaLocation && (
            <Block label="Localização do mioma">
              {LEIOMYOMA_FIGO_LABELS[c.palmLeiomyomaLocation]}
            </Block>
          )}
          {c.endometriosisDiagnosis && c.endometriosisStage && (
            <Block label="Endometriose">
              {ENDOMETRIOSIS_STAGE_LABELS[c.endometriosisStage]}
            </Block>
          )}
          {c.pcosDiagnosis && (
            <Block label="Diagnóstico adicional">SOP (Síndrome dos Ovários Policísticos)</Block>
          )}
          {c.hysteroscopies && c.hysteroscopies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Histeroscopias ({c.hysteroscopies.length})
              </p>
              <div className="space-y-2">
                {c.hysteroscopies.map((h, i) => (
                  <div key={i} className="bg-white rounded p-2.5 border border-gray-100 text-xs">
                    <p className="font-semibold text-lilac">
                      #{i + 1} · {h.date && formatDate(h.date)}
                    </p>
                    {h.findings && (
                      <p className="text-gray-700 mt-1">
                        <span className="text-gray-400">Achados: </span>
                        {h.findings}
                      </p>
                    )}
                    {h.conduct && (
                      <p className="text-gray-700 mt-1">
                        <span className="text-gray-400">Conduta: </span>
                        {h.conduct}
                      </p>
                    )}
                    {h.attachmentUrl && (
                      <a
                        href={resolveUploadUrl(h.attachmentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-lilac/10 text-lilac rounded hover:bg-lilac/20 transition"
                      >
                        {isImage(h.attachmentMimeType) ? (
                          <Paperclip className="w-3 h-3" />
                        ) : isPdf(h.attachmentMimeType) ? (
                          <FileText className="w-3 h-3" />
                        ) : (
                          <Paperclip className="w-3 h-3" />
                        )}
                        {h.attachmentName ?? 'arquivo'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {c.diagnosis && <Block label="Diagnóstico">{c.diagnosis}</Block>}
          {c.treatmentPlan && <Block label="Plano terapêutico">{c.treatmentPlan}</Block>}
          {c.notes && <Block label="Observações">{c.notes}</Block>}

          {alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Alertas do copiloto
              </p>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <AlertItem key={i} alert={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataGrid({ items }: { items: ({ label: string; title?: string; value: string } | null)[] }) {
  const filtered = items.filter((i): i is { label: string; title?: string; value: string } => i !== null);
  if (filtered.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filtered.map((item) => (
        <div key={item.label} className="bg-white rounded p-2.5 border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase" title={item.title}>{item.label}</p>
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
      <p className="text-sm text-gray-700 whitespace-pré-wrap">{children}</p>
    </div>
  );
}

function AlertItem({ alert }: { alert: MenstrualCycleAlert }) {
  const styles = {
    urgent: { Icon: AlertTriangle, cls: 'bg-red-50 border-red-200 text-red-700' },
    warning: { Icon: AlertCircle, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    info: { Icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  };
  const s = styles[alert.severity];
  return (
    <div className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-sm', s.cls)}>
      <s.Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{alert.message}</span>
    </div>
  );
}
