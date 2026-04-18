import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, AlertTriangle, XCircle, Calendar, FileSearch, TrendingDown,
  Check, MessageSquare, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  fetchLongitudinalAlerts,
  markAlertAsRead,
  respondToAlert,
  type LongitudinalAlert,
} from '../../api/longitudinal-alerts.api';
import { cn } from '../../utils/cn';

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  missed_followup: { icon: Calendar, label: 'Retorno perdido', color: 'text-amber-600' },
  pending_exam: { icon: FileSearch, label: 'Exame pendente', color: 'text-blue-600' },
  copilot_trend: { icon: TrendingDown, label: 'Tendência copiloto', color: 'text-violet-600' },
  pattern_detected: { icon: AlertTriangle, label: 'Padrão detectado', color: 'text-red-600' },
};

export default function LongitudinalAlertsSection() {
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['longitudinal-alerts', showAll],
    queryFn: () => fetchLongitudinalAlerts(!showAll),
  });

  const markReadMut = useMutation({
    mutationFn: markAlertAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['longitudinal-alerts'] }),
  });

  const alerts = data?.data ?? [];
  const unreadCount = alerts.filter((a) => !a.readByDoctor).length;

  if (isLoading || alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-lilac" />
          <h3 className="text-sm font-semibold text-navy">Alertas Inteligentes</h3>
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-lilac hover:underline"
        >
          {showAll ? 'Apenas não lidos' : 'Ver todos'}
        </button>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 10).map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onMarkRead={() => markReadMut.mutate(alert.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AlertCard({ alert, onMarkRead }: { alert: LongitudinalAlert; onMarkRead: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[alert.alertType] ?? { icon: AlertTriangle, label: alert.alertType, color: 'text-gray-600' };
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'border rounded-lg p-3 transition-all',
        !alert.readByDoctor ? 'border-lilac/30 bg-lilac/5' : 'border-gray-100',
      )}
    >
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={() => {
          setExpanded(!expanded);
          if (!alert.readByDoctor) onMarkRead();
        }}
      >
        <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-navy">{alert.title}</span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full',
              alert.severity === 'action_required' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700',
            )}>
              {config.label}
            </span>
            {!alert.readByDoctor && <span className="w-2 h-2 rounded-full bg-lilac shrink-0" />}
          </div>
          {!expanded && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{alert.description}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="mt-2 pl-6 space-y-2 text-xs">
          <p className="text-gray-700">{alert.description}</p>
          {alert.suggestedAction && (
            <p className="text-blue-700 bg-blue-50 rounded px-2 py-1">{alert.suggestedAction}</p>
          )}
          <p className="text-gray-400 text-[10px]">
            {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  );
}
