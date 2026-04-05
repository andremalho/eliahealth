import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, X, AlertTriangle, Shield } from 'lucide-react';
import { fetchCopilotAlerts } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';

export default function CopilotPanel({ pregnancyId }: { pregnancyId: string }) {
  const [open, setOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ['copilot-alerts', pregnancyId],
    queryFn: () => fetchCopilotAlerts(pregnancyId),
    retry: false,
  });

  const alertList = Array.isArray(alerts) ? alerts : [];
  const count = alertList.length;

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
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {alertList.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhum alerta ativo</p>
                  <p className="text-xs text-gray-400 mt-1">A gestação está dentro dos parâmetros normais</p>
                </div>
              ) : (
                alertList.map((a: any) => (
                  <div key={a.id} className={cn(
                    'p-3 rounded-lg border text-sm',
                    a.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                    a.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    'bg-blue-50 border-blue-200 text-blue-700',
                  )}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{a.alertType ?? a.alert_type}</p>
                        <p className="text-xs mt-1 opacity-80">{a.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
