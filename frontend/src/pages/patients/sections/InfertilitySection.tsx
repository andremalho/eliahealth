import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchInfertilityWorkups,
  DEFINITION_LABELS,
  DIAGNOSIS_LABELS,
  TREATMENT_LABELS,
  type InfertilityWorkup,
  type InfertilityAlert,
} from '../../../api/infertility-workups.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewInfertilityWorkupModal from './NewInfertilityWorkupModal';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function InfertilitySection({ patientId }: { patientId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['infertility-workups', patientId],
    queryFn: () => fetchInfertilityWorkups(patientId),
    enabled: !!patientId,
  });

  const items = data?.data ?? [];

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
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewInfertilityWorkupModal
          patientId={patientId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function Card({
  item: c,
  expanded,
  onToggle,
}: {
  item: InfertilityWorkup;
  expanded: boolean;
  onToggle: () => void;
}) {
  const alerts = c.alerts ?? [];
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition text-left"
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
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-pink-50 text-pink-700 rounded">
                → TRA
              </span>
            )}
          </div>
        </div>
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
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-4">
          {c.ovarianReserve && (
            <Block label="Reserva ovariana">
              <pre className="text-xs whitespace-pre-wrap font-sans">
                {JSON.stringify(c.ovarianReserve, null, 2)}
              </pre>
            </Block>
          )}
          {c.semenAnalysis && (
            <Block label="Espermograma">
              <pre className="text-xs whitespace-pre-wrap font-sans">
                {JSON.stringify(c.semenAnalysis, null, 2)}
              </pre>
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
