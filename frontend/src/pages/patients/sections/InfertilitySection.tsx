import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Sparkles,
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
  fetchInfertilityWorkups,
  deleteInfertilityWorkup,
  DEFINITION_LABELS,
  DIAGNOSIS_LABELS,
  TREATMENT_LABELS,
  type InfertilityWorkup,
  type InfertilityAlert,
} from '../../../api/infertility-workups.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewInfertilityWorkupModal from './NewInfertilityWorkupModal';
import { DeleteButton } from '../../../components/forms/DeleteButton';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function InfertilitySection({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InfertilityWorkup | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['infertility-workups', patientId],
    queryFn: () => fetchInfertilityWorkups(patientId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInfertilityWorkup(patientId, id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ['infertility-workups', patientId] });
    },
  });

  const items = data?.data ?? [];

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };
  const openEdit = (it: InfertilityWorkup) => {
    setEditingItem(it);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Investigação de infertilidade</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            ACOG CO 781 — fator ovulatório, tubário, uterino, masculino
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          Nova investigação
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
          <Sparkles className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma investigação registrada</p>
          <p className="text-sm mt-1">Clique em "Nova investigação" para começar</p>
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
        <NewInfertilityWorkupModal
          patientId={patientId}
          workup={editingItem ?? undefined}
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
  item: InfertilityWorkup;
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
              <span className="font-medium text-gray-800">{formatDate(c.workupDate)}</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {DEFINITION_LABELS[c.infertilityDefinition]}
              </span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {c.ageAtPresentation} anos · {c.durationMonths} meses
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {c.primaryDiagnosis && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded">
                  {DIAGNOSIS_LABELS[c.primaryDiagnosis]}
                </span>
              )}
              {c.treatmentPlan && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded">
                  {TREATMENT_LABELS[c.treatmentPlan]}
                </span>
              )}
              {c.fertilityPreservation && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded">
                  Preservação
                </span>
              )}
              {c.referralToART && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-pink-50 text-pink-700 rounded" title="Encaminhada para Técnicas de Reprodução Assistida">
                  → TRA
                </span>
              )}
            </div>
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
            aria-label="Editar investigação"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <DeleteButton
            onConfirm={onDelete}
            isPending={isDeleting}
            label="Excluir investigação"
            confirmLabel="Excluir esta investigação?"
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
          {c.ovarianReserve && <OvarianReserveDisplay data={c.ovarianReserve} />}
          {c.semenAnalysis && <SemenAnalysisDisplay data={c.semenAnalysis} />}
          {c.dnaFragmentation && <DnaFragmentationDisplay data={c.dnaFragmentation} />}
          {c.hsg && <HsgDisplay data={c.hsg} />}
          {c.diagnosticHysteroscopy && (
            <Block label="Histeroscopia diagnóstica">
              {asString(c.diagnosticHysteroscopy)}
            </Block>
          )}
          {c.laparoscopyDiagnostic && (
            <Block label="Laparoscopia diagnóstica">
              {asString(c.laparoscopyDiagnostic)}
            </Block>
          )}
          {c.mullerianAnomaly && (
            <Block label="Anomalia mülleriana">
              {c.mullerianAnomalyType ?? 'Presente (tipo não especificado)'}
            </Block>
          )}
          {c.fertilityPreservation && (
            <Block label="Preservação de fertilidade">
              {c.preservationMethod ?? '—'}
              {c.preservationDate && <> · {formatDate(c.preservationDate)}</>}
            </Block>
          )}
          {c.artClinicName && <Block label="Clínica de TRA">{c.artClinicName}</Block>}
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

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}

// ── Displays estruturados para JSONB ──

function asString(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  if (typeof v === 'object') {
    // Tenta extrair `findings` ou similar; senão JSON compacto
    const obj = v as Record<string, unknown>;
    if (typeof obj.findings === 'string') return obj.findings;
    return Object.entries(obj)
      .map(([k, val]) => `${k}: ${asString(val)}`)
      .join(' · ');
  }
  return String(v);
}

interface MetricItem {
  label: string;
  value: string;
  status?: 'normal' | 'low' | 'high' | 'borderline';
  title?: string;
}

function MetricGrid({
  label,
  items,
  attachment,
}: {
  label: string;
  items: MetricItem[];
  attachment?: { url: string; name: string | null; mimeType: string | null } | null;
}) {
  if (items.length === 0 && !attachment) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((item) => {
            const colorCls =
              item.status === 'low' || item.status === 'high'
                ? 'border-red-200 bg-red-50'
                : item.status === 'borderline'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-100 bg-white';
            return (
              <div
                key={item.label}
                className={cn('rounded p-2.5 border', colorCls)}
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase" title={item.title}>
                  {item.label}
                </p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
              </div>
            );
          })}
        </div>
      )}
      {attachment && (
        <a
          href={resolveUploadUrl(attachment.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-lilac/10 text-lilac rounded hover:bg-lilac/20 transition text-xs"
        >
          {isPdf(attachment.mimeType) ? (
            <FileText className="w-3 h-3" />
          ) : (
            <Paperclip className="w-3 h-3" />
          )}
          {attachment.name ?? 'arquivo'}
        </a>
      )}
    </div>
  );
}

function extractAttachmentFromJsonb(
  data: Record<string, unknown>,
): { url: string; name: string | null; mimeType: string | null } | null {
  if (typeof data.attachmentUrl !== 'string') return null;
  return {
    url: data.attachmentUrl,
    name: typeof data.attachmentName === 'string' ? data.attachmentName : null,
    mimeType: typeof data.attachmentMimeType === 'string' ? data.attachmentMimeType : null,
  };
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function OvarianReserveDisplay({ data }: { data: Record<string, unknown> }) {
  const amh = num((data.amh as Record<string, unknown>)?.value_ng_ml);
  const fsh = num((data.fsh as Record<string, unknown>)?.value);
  const afc = num((data.antralFollicleCount as Record<string, unknown>)?.value);
  const attachment = extractAttachmentFromJsonb(data);

  const items: MetricItem[] = [];
  if (amh !== null) {
    items.push({
      label: 'AMH',
      value: `${amh} ng/mL`,
      status: amh < 0.5 ? 'low' : amh < 1.1 ? 'borderline' : 'normal',
      title: 'Hormônio Anti-Mülleriano',
    });
  }
  if (fsh !== null) {
    items.push({
      label: 'FSH basal',
      value: `${fsh} mUI/mL`,
      status: fsh > 10 ? 'high' : 'normal',
      title: 'Hormônio Folículo-Estimulante',
    });
  }
  if (afc !== null) {
    items.push({
      label: 'CFA',
      value: `${afc} folículos`,
      status: afc < 5 ? 'low' : 'normal',
      title: 'Contagem de Folículos Antrais',
    });
  }
  if (items.length === 0 && !attachment) return null;
  return <MetricGrid label="Reserva ovariana" items={items} attachment={attachment} />;
}

function SemenAnalysisDisplay({ data }: { data: Record<string, unknown> }) {
  const conc = num(data.concentration_M_ml);
  const motProg = num(data.progressiveMotility_pct);
  const morf = num(data.morphology_pct_kruger);
  const motTotal = num(data.totalMotility_pct);
  const vol = num(data.volume_ml);

  const items: MetricItem[] = [];
  if (vol !== null) items.push({ label: 'Volume', value: `${vol} mL` });
  if (conc !== null) {
    items.push({
      label: 'Concentração',
      value: `${conc} M/mL`,
      status: conc < 16 ? 'low' : 'normal',
    });
  }
  if (motProg !== null) {
    items.push({
      label: 'Mot. progressiva',
      value: `${motProg}%`,
      status: motProg < 30 ? 'low' : 'normal',
    });
  }
  if (motTotal !== null) {
    items.push({
      label: 'Mot. total',
      value: `${motTotal}%`,
      status: motTotal < 42 ? 'low' : 'normal',
    });
  }
  if (morf !== null) {
    items.push({
      label: 'Morfologia (Kruger)',
      value: `${morf}%`,
      status: morf < 4 ? 'low' : 'normal',
    });
  }
  const attachment = extractAttachmentFromJsonb(data);
  if (items.length === 0 && !attachment) return null;
  return <MetricGrid label="Espermograma (OMS 2021)" items={items} attachment={attachment} />;
}

function DnaFragmentationDisplay({ data }: { data: Record<string, unknown> }) {
  const dfi = num(data.dfi_pct);
  const attachment = extractAttachmentFromJsonb(data);
  if (dfi === null && !attachment) return null;
  return (
    <MetricGrid
      label="Fragmentação de DNA espermático"
      items={
        dfi !== null
          ? [
              {
                label: 'DFI',
                value: `${dfi}%`,
                status: dfi > 30 ? 'high' : dfi > 15 ? 'borderline' : 'normal',
                title: 'DNA Fragmentation Index',
              },
            ]
          : []
      }
      attachment={attachment}
    />
  );
}

function HsgDisplay({ data }: { data: Record<string, unknown> }) {
  // HSG pode vir como { findings: '...' } ou { leftTube, rightTube, uterineCavity, findings, date }
  const findings = typeof data.findings === 'string' ? data.findings : null;
  const left = typeof data.leftTube === 'string' ? data.leftTube : null;
  const right = typeof data.rightTube === 'string' ? data.rightTube : null;
  const cavity = typeof data.uterineCavity === 'string' ? data.uterineCavity : null;
  const date = typeof data.date === 'string' ? data.date : null;
  const attachment = extractAttachmentFromJsonb(data);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
        HSG (Histerossalpingografia)
        {date && (
          <span className="text-gray-400 normal-case ml-2 font-normal">{date}</span>
        )}
      </p>
      <div className="text-sm text-gray-700 space-y-0.5">
        {left && (
          <p>
            <span className="text-gray-400">Trompa esquerda:</span> {left}
          </p>
        )}
        {right && (
          <p>
            <span className="text-gray-400">Trompa direita:</span> {right}
          </p>
        )}
        {cavity && (
          <p>
            <span className="text-gray-400">Cavidade uterina:</span> {cavity}
          </p>
        )}
        {findings && <p className="whitespace-pré-wrap">{findings}</p>}
      </div>
      {attachment && (
        <a
          href={resolveUploadUrl(attachment.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-lilac/10 text-lilac rounded hover:bg-lilac/20 transition text-xs"
        >
          {isPdf(attachment.mimeType) ? (
            <FileText className="w-3 h-3" />
          ) : (
            <Paperclip className="w-3 h-3" />
          )}
          {attachment.name ?? 'arquivo'}
        </a>
      )}
    </div>
  );
}

function AlertItem({ alert }: { alert: InfertilityAlert }) {
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
