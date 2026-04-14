import { useState } from 'react';
import {
  Brain, ChevronRight, ChevronLeft, Loader2, Check, X,
  AlertTriangle, XCircle, Stethoscope, Pill, Syringe, FileSearch,
  Activity, BookOpen, TrendingUp, HelpCircle,
} from 'lucide-react';
import { useCopilotSocket, CopilotInsightData } from '../../../hooks/useCopilotSocket';
import { cn } from '../../../utils/cn';

interface Props {
  consultationId: string;
  patientId: string;
}

const TYPE_ICONS: Record<string, any> = {
  anamnesis_gap: HelpCircle,
  differential: Stethoscope,
  drug_interaction: Pill,
  contraindication: XCircle,
  contextual_alert: AlertTriangle,
  exam_suggestion: FileSearch,
  guideline_reminder: BookOpen,
  trend_alert: TrendingUp,
};

const TYPE_LABELS: Record<string, string> = {
  anamnesis_gap: 'Anamnese',
  differential: 'Diferencial',
  drug_interaction: 'Interacao',
  contraindication: 'Contraindicacao',
  contextual_alert: 'Alerta',
  exam_suggestion: 'Exame',
  guideline_reminder: 'Guideline',
  trend_alert: 'Tendencia',
};

export default function CopilotSidePanel({ consultationId, patientId }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { connected, insights, loading, requestFullAnalysis, recordAction } =
    useCopilotSocket({ consultationId, patientId });

  const actionRequired = insights.filter((i) => i.severity === 'action_required');
  const attention = insights.filter((i) => i.severity === 'attention');
  const totalBadge = insights.length;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-0 top-1/3 bg-navy text-white p-2 rounded-l-lg shadow-lg flex flex-col items-center gap-1 z-40"
      >
        <Brain className="w-4 h-4 text-lilac" />
        {totalBadge > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {totalBadge}
          </span>
        )}
        <ChevronLeft className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-lilac" />
          <span className="text-xs font-semibold text-navy">Copiloto Clinico</span>
          {connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Conectado" />}
          {loading && <Loader2 className="w-3 h-3 text-lilac animate-spin" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={requestFullAnalysis}
            className="text-[10px] text-lilac hover:text-navy px-1.5 py-0.5 rounded"
            title="Analisar tudo"
          >
            <Activity className="w-3 h-3" />
          </button>
          <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-navy">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {insights.length === 0 && !loading && (
          <div className="text-center py-8 text-xs text-gray-400">
            <Brain className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Preencha a consulta para receber insights
          </div>
        )}

        {actionRequired.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onAction={recordAction} />
        ))}
        {attention.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onAction={recordAction} />
        ))}
      </div>

      {/* Footer badges */}
      {totalBadge > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t border-gray-100 text-[10px]">
          {actionRequired.length > 0 && (
            <span className="text-red-600 font-medium">{actionRequired.length} acao</span>
          )}
          {attention.length > 0 && (
            <span className="text-amber-600 font-medium">{attention.length} atencao</span>
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  onAction,
}: {
  insight: CopilotInsightData;
  onAction: (id: string, action: 'accepted' | 'dismissed', note?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TYPE_ICONS[insight.type] ?? AlertTriangle;
  const isAction = insight.severity === 'action_required';

  return (
    <div
      className={cn(
        'rounded-lg border p-2 text-xs transition-all',
        isAction
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50',
      )}
    >
      <div
        className="flex items-start gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', isAction ? 'text-red-600' : 'text-amber-600')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn('font-medium', isAction ? 'text-red-800' : 'text-amber-800')}>
              {insight.title}
            </span>
          </div>
          {!expanded && (
            <p className="text-gray-600 line-clamp-1 mt-0.5">{insight.description}</p>
          )}
        </div>
        <span className="text-[9px] text-gray-400 shrink-0">
          {TYPE_LABELS[insight.type] ?? insight.type}
        </span>
      </div>

      {expanded && (
        <div className="mt-2 pl-5 space-y-1.5">
          <p className="text-gray-700">{insight.description}</p>
          {insight.suggestedAction && (
            <p className="text-blue-700 bg-blue-50 rounded px-1.5 py-1">
              {insight.suggestedAction}
            </p>
          )}
          {insight.guidelineReference && (
            <p className="text-gray-500 italic text-[10px]">{insight.guidelineReference}</p>
          )}
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onAction(insight.id, 'accepted'); }}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
            >
              <Check className="w-3 h-3" /> Aceitar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAction(insight.id, 'dismissed'); }}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              <X className="w-3 h-3" /> Dispensar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
