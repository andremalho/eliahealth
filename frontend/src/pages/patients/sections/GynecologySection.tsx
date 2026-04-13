import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Stethoscope,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  Pencil,
  Paperclip,
  FileText,
} from 'lucide-react';
import { isPdf, resolveUploadUrl } from '../../../api/uploads.api';
import {
  fetchGynecologyConsultations,
  deleteGynecologyConsultation,
  CONSULTATION_TYPE_LABELS,
  SMOKING_LABELS,
  ALCOHOL_USE_LABELS,
  DYSMENORRHEA_LABELS,
  MENSTRUAL_VOLUME_LABELS,
  BIRADS_LABELS,
  type GynecologyConsultation,
  type GynecologyAlert,
} from '../../../api/gynecology-consultations.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewGynecologyConsultationModal from './NewGynecologyConsultationModal';
import InitialGynecologyConsultationModal from './InitialGynecologyConsultationModal';
import { DeleteButton } from '../../../components/forms/DeleteButton';
import { fetchPatient } from '../../../api/patients.api';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function GynecologySection({ patientId, autoOpenModal }: { patientId: string; autoOpenModal?: boolean }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [initialModalOpen, setInitialModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GynecologyConsultation | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['gynecology-consultations', patientId],
    queryFn: () => fetchGynecologyConsultations(patientId),
    enabled: !!patientId,
  });

  const { data: patient } = useQuery({
    queryKey: ['patient-detail', patientId],
    queryFn: () => fetchPatient(patientId),
    enabled: !!patientId,
  });

  const consultations = data?.data ?? [];
  const hasConsultations = consultations.length > 0;

  // Auto-open: if new patient (no consultations), open initial modal; otherwise open regular
  useEffect(() => {
    if (autoOpenModal) {
      if (!isLoading && !hasConsultations) {
        setInitialModalOpen(true);
      } else if (!isLoading && hasConsultations) {
        setModalOpen(true);
      }
    }
  }, [autoOpenModal, isLoading, hasConsultations]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGynecologyConsultation(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['gynecology-consultations', patientId] });
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };
  const openEdit = (c: GynecologyConsultation) => {
    setEditingItem(c);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Consultas Ginecológicas</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Anamnese, exame físico e rastreios (FEBRASGO)
          </p>
        </div>
        <button
          onClick={() => hasConsultations ? setModalOpen(true) : setInitialModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          {hasConsultations ? 'Nova consulta' : 'Primeira consulta'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <Stethoscope className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma consulta ginecologica</p>
          <button
            onClick={() => setInitialModalOpen(true)}
            className="mt-3 px-4 py-2 bg-lilac text-white text-sm rounded-lg hover:bg-primary-dark transition"
          >
            Iniciar primeira consulta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
              onEdit={() => openEdit(c)}
              onDelete={() => deleteMutation.mutate(c.id)}
              isDeleting={deletingId === c.id}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewGynecologyConsultationModal
          patientId={patientId}
          consultation={editingItem ?? undefined}
          onClose={closeModal}
        />
      )}
      {initialModalOpen && patient && (
        <InitialGynecologyConsultationModal
          patientId={patientId}
          patient={patient}
          onClose={() => setInitialModalOpen(false)}
        />
      )}
    </div>
  );
}

function ConsultationCard({
  consultation: c,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isDeleting,
}: {
  consultation: GynecologyConsultation;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const alerts = c.alerts ?? [];
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

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
              <span className="font-medium text-gray-800">{formatDate(c.consultationDate)}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {CONSULTATION_TYPE_LABELS[c.consultationType]}
              </span>
            </div>
            {c.chiefComplaint && (
              <p className="text-sm text-gray-500 mt-1 truncate">{c.chiefComplaint}</p>
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
            aria-label="Editar consulta"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <DeleteButton
            onConfirm={onDelete}
            isPending={isDeleting}
            label="Excluir consulta"
            confirmLabel="Excluir esta consulta?"
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
          {/* Vitais */}
          <DataGrid
            items={[
              c.bloodPressureSystolic && c.bloodPressureDiastolic
                ? { label: 'PA', title: 'Pressão Arterial', value: `${c.bloodPressureSystolic}/${c.bloodPressureDiastolic} mmHg` }
                : null,
              c.heartRate ? { label: 'FC', title: 'Frequência Cardíaca', value: `${c.heartRate} bpm` } : null,
              c.weight ? { label: 'Peso', value: `${c.weight} kg` } : null,
              c.height ? { label: 'Altura', value: `${c.height} cm` } : null,
              c.bmi ? { label: 'IMC', title: 'Índice de Massa Corporal', value: Number(c.bmi).toFixed(1) } : null,
              c.lastMenstrualPeriod
                ? { label: 'DUM', title: 'Data da Última Menstruação', value: formatDate(c.lastMenstrualPeriod) }
                : null,
            ]}
          />

          {/* Ciclo menstrual */}
          {(c.cycleInterval || c.cycleDuration || c.cycleVolume || c.dysmenorrhea) && (
            <DataGrid
              items={[
                c.cycleInterval ? { label: 'Intervalo', value: `${c.cycleInterval} dias` } : null,
                c.cycleDuration ? { label: 'Duração', value: `${c.cycleDuration} dias` } : null,
                c.cycleVolume ? { label: 'Volume', value: MENSTRUAL_VOLUME_LABELS[c.cycleVolume] } : null,
                c.dysmenorrhea ? { label: 'Dismenorreia', value: DYSMENORRHEA_LABELS[c.dysmenorrhea] } : null,
              ]}
            />
          )}

          {/* Contracepção e hábitos */}
          {c.contraceptiveMethod && (
            <Block label="Contracepção">{c.contraceptiveMethod}</Block>
          )}
          {(c.smokingStatus || c.alcoholUsePattern || c.drugUse) && (
            <div className="flex flex-wrap gap-2">
              {c.smokingStatus && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {SMOKING_LABELS[c.smokingStatus]}
                </span>
              )}
              {c.alcoholUsePattern && c.alcoholUsePattern !== 'none' && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  Etilismo: {ALCOHOL_USE_LABELS[c.alcoholUsePattern]}
                </span>
              )}
              {c.drugUse && (
                <span className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded">
                  Uso de drogas{c.drugUseDetails ? `: ${c.drugUseDetails}` : ''}
                </span>
              )}
            </div>
          )}

          {/* Exame mamário */}
          {c.breastExamPerformed && (c.breastExamFindings || c.biradsClassification) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Exame mamário</p>
              {c.breastExamFindings && (
                <p className="text-sm text-gray-700">{c.breastExamFindings}</p>
              )}
              {c.biradsClassification && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 rounded">
                  {BIRADS_LABELS[c.biradsClassification]}
                </span>
              )}
            </div>
          )}

          {/* Exame pélvico */}
          {c.pelvicExamPerformed && (c.cervixAppearance || c.papSmearCollected) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Exame pélvico</p>
              {c.cervixAppearance && (
                <p className="text-sm text-gray-700">{c.cervixAppearance}</p>
              )}
              {c.papSmearCollected && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded">
                  Citopatológico coletado
                </span>
              )}
            </div>
          )}

          {/* Anexos de rastreios */}
          {(c.papSmearAttachmentUrl || c.mammographyAttachmentUrl) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Laudos anexados
              </p>
              <div className="flex flex-wrap gap-2">
                {c.papSmearAttachmentUrl && (
                  <AttachmentLink
                    label={`Citopatológico${c.lastPapSmear ? ` · ${formatDate(c.lastPapSmear)}` : ''}`}
                    url={c.papSmearAttachmentUrl}
                    name={c.papSmearAttachmentName}
                    mimeType={c.papSmearAttachmentMimeType}
                  />
                )}
                {c.mammographyAttachmentUrl && (
                  <AttachmentLink
                    label={`Mamografia${c.lastMammography ? ` · ${formatDate(c.lastMammography)}` : ''}`}
                    url={c.mammographyAttachmentUrl}
                    name={c.mammographyAttachmentName}
                    mimeType={c.mammographyAttachmentMimeType}
                  />
                )}
              </div>
            </div>
          )}

          {c.currentIllnessHistory && (
            <Block label="História da doença atual">{c.currentIllnessHistory}</Block>
          )}
          {c.diagnosis && (
            <Block label="Diagnóstico">{c.diagnosis}</Block>
          )}
          {c.referrals && <Block label="Encaminhamentos">{c.referrals}</Block>}
          {c.returnDate && <Block label="Retorno">{formatDate(c.returnDate)}</Block>}
          {c.notes && <Block label="Observações">{c.notes}</Block>}

          {/* Alertas do copiloto */}
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
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function AlertItem({ alert }: { alert: GynecologyAlert }) {
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

function AttachmentLink({
  label,
  url,
  name,
  mimeType,
}: {
  label: string;
  url: string;
  name: string | null;
  mimeType: string | null;
}) {
  return (
    <a
      href={resolveUploadUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-lilac/10 text-lilac rounded hover:bg-lilac/20 transition text-xs"
      title={name ?? undefined}
    >
      {isPdf(mimeType) ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
      <span>{label}</span>
    </a>
  );
}
