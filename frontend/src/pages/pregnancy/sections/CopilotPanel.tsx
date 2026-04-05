import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, X, AlertTriangle, Shield, RefreshCw, Loader2 } from 'lucide-react';
import { fetchCopilotAlerts, analyzeCopilot } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';

const ALERT_TYPE_LABELS: Record<string, string> = {
  suggestion: 'Sugestão', exam_overdue: 'Exame em atraso', pattern_detected: 'Padrão detectado',
  red_flag: 'Alerta crítico', warning: 'Atenção', info: 'Informação',
};

export default function CopilotPanel({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ['copilot-alerts', pregnancyId],
    queryFn: () => fetchCopilotAlerts(pregnancyId),
    retry: false,
  });

  const analysis = useMutation({
    mutationFn: () => analyzeCopilot(pregnancyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['copilot-alerts', pregnancyId] }),
  });

  // Auto-analyze when panel opens
  useEffect(() => {
    if (open && !analysis.data && !analysis.isPending) {
      analysis.mutate();
    }
  }, [open]);

  const alertList = Array.isArray(alerts) ? alerts : [];
  const count = alertList.length;
  const result = analysis.data;

  const riskBadge = (level: string) => {
    const m: Record<string, { label: string; cls: string }> = {
      low: { label: 'Baixo', cls: 'bg-emerald-100 text-emerald-700' },
      moderate: { label: 'Moderado', cls: 'bg-amber-100 text-amber-700' },
      high: { label: 'Alto', cls: 'bg-red-100 text-red-700' },
    };
    const r = m[level] ?? m.low;
    return <span className={cn('px-2.5 py-1 text-xs font-semibold rounded-full', r!.cls)}>{r!.label}</span>;
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-navy text-white rounded-full shadow-lg hover:bg-navy-light transition"
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-medium">Copiloto</span>
        {count > 0 && (
          <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {/* Slide-over panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-lilac" />
                <h2 className="font-semibold text-navy">Copiloto IA</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => analysis.mutate()}
                  disabled={analysis.isPending}
                  className="text-gray-400 hover:text-lilac disabled:opacity-40"
                  title="Atualizar análise"
                >
                  <RefreshCw className={cn('w-4 h-4', analysis.isPending && 'animate-spin')} />
                </button>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Loading state */}
              {analysis.isPending && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-lilac mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-gray-500">Analisando gestação...</p>
                  <p className="text-xs text-gray-400 mt-1">O copiloto está avaliando os dados clínicos</p>
                </div>
              )}

              {/* Error state */}
              {analysis.isError && !analysis.isPending && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Não foi possível analisar</p>
                  <button
                    onClick={() => analysis.mutate()}
                    className="mt-3 px-4 py-2 bg-lilac text-white text-xs rounded-lg hover:bg-primary-dark"
                  >
                    Analisar novamente
                  </button>
                </div>
              )}

              {/* Analysis result */}
              {result && !analysis.isPending && (
                <>
                  {/* Risk level */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Nível de risco</span>
                    {riskBadge(result.riskLevel ?? result.risk_level ?? 'low')}
                  </div>

                  {/* Suggestions */}
                  {result.suggestions && (
                    <div className="p-3 bg-lilac/5 border border-lilac/20 rounded-lg">
                      <p className="text-xs font-medium text-lilac mb-1">Sugestões clínicas</p>
                      <p className="text-xs text-gray-600 whitespace-pre-line">{result.suggestions}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[10px] text-gray-400">
                    Última análise: {new Date().toLocaleString('pt-BR')}
                  </p>
                </>
              )}

              {/* Alerts from GET endpoint */}
              {alertList.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Alertas ativos ({alertList.length})</p>
                  <div className="space-y-2">
                    {alertList.map((a: any, i: number) => (
                      <div key={a.id ?? i} className={cn(
                        'p-3 rounded-lg border text-sm',
                        a.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                        a.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-blue-50 border-blue-200 text-blue-700',
                      )}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-xs">{ALERT_TYPE_LABELS[a.alertType ?? a.alert_type] ?? (a.alertType ?? a.alert_type)}</p>
                            <p className="text-xs mt-0.5 opacity-80">{a.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state — only when no alerts AND no analysis result AND not loading */}
              {alertList.length === 0 && !result && !analysis.isPending && !analysis.isError && (
                <div className="text-center py-12">
                  <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhum alerta ativo</p>
                  <p className="text-xs text-gray-400 mt-1">A gestação está dentro dos parâmetros normais</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
