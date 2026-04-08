import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  ClipboardCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  fetchLatestPreventive,
  fetchPreventiveSummary,
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  LIFE_PHASE_LABELS,
  type PreventiveExamItem,
  type PreventiveAlert,
} from '../../../api/preventive-exam-schedules.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewPreventiveScheduleModal from './NewPreventiveScheduleModal';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function PreventiveExamSection({ patientId }: { patientId: string }) {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: latest, isLoading } = useQuery({
    queryKey: ['preventive-exam-schedules', patientId, 'latest'],
    queryFn: () => fetchLatestPreventive(patientId),
    enabled: !!patientId,
  });

  const { data: summary } = useQuery({
    queryKey: ['preventive-exam-schedules', patientId, 'summary'],
    queryFn: () => fetchPreventiveSummary(patientId),
    enabled: !!patientId,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Rastreios preventivos</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cronograma de exames por fase da vida (FEBRASGO/ACOG/USPSTF)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          {latest ? 'Atualizar cronograma' : 'Gerar cronograma'}
        </button>
      </div>

      {/* Summary cards */}
      {summary && summary.hasSchedule && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SummaryCard
            icon={CheckCircle2}
            color="bg-emerald-50 text-emerald-600"
            value={summary.upToDate}
            label="em dia"
          />
          <SummaryCard
            icon={Clock}
            color="bg-amber-50 text-amber-600"
            value={summary.dueSoon}
            label="próximos do vencimento"
          />
          <SummaryCard
            icon={XCircle}
            color="bg-red-50 text-red-600"
            value={summary.overdue}
            label="em atraso"
          />
          <SummaryCard
            icon={AlertTriangle}
            color="bg-purple-50 text-purple-600"
            value={summary.alertsCount}
            label="alertas"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !latest ? (
        <div className="flex flex-col items-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <ClipboardCheck className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhum cronograma gerado</p>
          <p className="text-sm mt-1">
            Clique em "Gerar cronograma" para criar baseado na fase da vida
          </p>
        </div>
      ) : (
        <>
          {/* Header com info do cronograma */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Fase da vida</p>
              <p className="text-sm font-semibold text-navy">
                {LIFE_PHASE_LABELS[latest.lifePhase]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Próxima revisão</p>
              <p className="text-sm font-semibold text-navy">{formatDate(latest.nextReviewDate)}</p>
            </div>
          </div>

          {/* Lista de exames */}
          <div className="space-y-2">
            {(latest.examSchedule ?? []).map((exam, i) => (
              <ExamRow key={`${exam.examCode}-${i}`} exam={exam} />
            ))}
          </div>

          {/* Alertas */}
          {latest.clinicalAlerts && latest.clinicalAlerts.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Alertas do copiloto
              </p>
              <div className="space-y-2">
                {latest.clinicalAlerts.map((a, i) => (
                  <AlertItem key={i} alert={a} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <NewPreventiveScheduleModal
          patientId={patientId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: React.ElementType;
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mb-2', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold text-navy">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ExamRow({ exam }: { exam: PreventiveExamItem }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
      <div className="w-9 h-9 rounded bg-lilac/10 text-lilac flex items-center justify-center shrink-0">
        <Calendar className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm">{exam.examName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-500">{CATEGORY_LABELS[exam.category]}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{exam.frequency}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">Vence {formatDate(exam.dueDate)}</span>
        </div>
      </div>
      <span className={cn('px-2 py-1 text-xs font-semibold rounded shrink-0', STATUS_COLORS[exam.status])}>
        {STATUS_LABELS[exam.status]}
      </span>
    </div>
  );
}

function AlertItem({ alert }: { alert: PreventiveAlert }) {
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
