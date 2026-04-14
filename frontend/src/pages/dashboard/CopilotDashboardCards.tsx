import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, XCircle, FileText, Brain, MessageSquare,
  Bell, Clock, Check, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchCopilotDashboard } from '../../api/copilot-dashboard.api';
import { cn } from '../../utils/cn';

export default function CopilotDashboardCards() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['copilot-dashboard'],
    queryFn: fetchCopilotDashboard,
    refetchInterval: 60000,
  });

  if (isLoading || !data) return null;

  const d = data;
  const hasUrgent = d.urgentActions?.totalCount > 0;

  return (
    <div className="space-y-4">
      {/* Urgent Actions Bar */}
      {hasUrgent && (
        <div id="urgent-actions-bar" className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">Acoes urgentes ({d.urgentActions.totalCount})</h3>
          </div>
          <div className="space-y-2">
            {d.urgentActions.items.slice(0, 3).map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white/60 rounded-lg p-2">
                <div>
                  <p className="text-red-800 font-medium">{a.title}</p>
                  <p className="text-red-600 line-clamp-1">{a.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row: Summaries + Copilot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Summaries */}
        <div id="pending-summaries-card" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-lilac" />
            <h3 className="text-sm font-semibold text-navy">Resumos pendentes</h3>
            {d.pendingSummaries.count > 0 && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                {d.pendingSummaries.count}
              </span>
            )}
          </div>
          {d.pendingSummaries.items.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Nenhum resumo pendente</p>
          ) : (
            <div className="space-y-2">
              {d.pendingSummaries.items.slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-navy font-medium truncate">{s.patientName}</span>
                  <span className="text-gray-400 shrink-0">{new Date(s.consultationDate).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copilot Overview */}
        <div id="copilot-overview-card" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-lilac" />
            <h3 className="text-sm font-semibold text-navy">Copiloto — 7 dias</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div>
              <p className="text-lg font-bold text-navy">{d.copilotOverview.insightsGenerated}</p>
              <p className="text-[10px] text-gray-500">Insights</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{d.copilotOverview.insightsAccepted}</p>
              <p className="text-[10px] text-gray-500">Aceitos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{d.copilotOverview.acceptanceRate}%</p>
              <p className="text-[10px] text-gray-500">Aceitacao</p>
            </div>
          </div>
          {/* Acceptance rate bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-lilac rounded-full"
              style={{ width: `${d.copilotOverview.acceptanceRate}%` }}
            />
          </div>
          {d.copilotOverview.unreviewedChecklists > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              {d.copilotOverview.unreviewedChecklists} checklist(s) nao revisado(s)
            </p>
          )}
        </div>
      </div>

      {/* Row: Patient Attention + Chatbot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Attention */}
        <div id="patient-attention-card" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-navy">Pacientes</h3>
          </div>
          <div className="space-y-2 text-xs">
            {d.patientAttention.escalatedChats.count > 0 && (
              <div className="flex items-center justify-between text-red-700">
                <span>{d.patientAttention.escalatedChats.count} chat(s) escalado(s)</span>
                <XCircle className="w-3 h-3" />
              </div>
            )}
            {d.patientAttention.escalatedChats.count === 0 && (
              <p className="text-gray-400 py-1">Nenhuma atencao especial necessaria</p>
            )}
          </div>
        </div>

        {/* Chatbot Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-lilac" />
            <h3 className="text-sm font-semibold text-navy">Chatbot — 7 dias</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-navy">{d.chatbotStats.messagesLast7Days}</p>
              <p className="text-[10px] text-gray-500">Mensagens</p>
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{d.chatbotStats.avgResponseTimeSec}s</p>
              <p className="text-[10px] text-gray-500">Tempo resp.</p>
            </div>
            <div>
              <p className={cn('text-lg font-bold', d.chatbotStats.escalationsLast7Days > 0 ? 'text-red-600' : 'text-navy')}>
                {d.chatbotStats.escalationsLast7Days}
              </p>
              <p className="text-[10px] text-gray-500">Escalacoes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
