import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Users, MessageSquare, Brain, FileText, Shield,
  AlertTriangle, Loader2,
} from 'lucide-react';
import { fetchAnalytics } from '../../api/analytics.api';
import { cn } from '../../utils/cn';

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}
function defaultTo() {
  return new Date().toISOString().split('T')[0];
}

export default function AnalyticsImpactPage() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', from, to],
    queryFn: () => fetchAnalytics(from, to),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-lilac animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-navy">Analytics de Impacto</h1>
          <p className="text-sm text-gray-500">Metricas que provam o valor do EliaHealth</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5" />
          <span className="text-xs text-gray-400">até</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5" />
        </div>
      </div>

      {/* Clinical Impact — hero section */}
      <div className="bg-gradient-to-r from-navy to-lilac rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" />
          <h2 className="font-semibold">Impacto Clínico</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ImpactStat
            value={data.clinicalImpact.gapsDetectedByCopilot}
            label="Gaps detectados pelo copiloto"
          />
          <ImpactStat
            value={data.clinicalImpact.gapsAcceptedByDoctor}
            label="Gaps corrigidos pelo médico"
          />
          <ImpactStat
            value={`${data.clinicalImpact.gapsCorrectionRate}%`}
            label="Taxa de correção"
            highlight
          />
          <ImpactStat
            value={data.clinicalImpact.patientsReachedBySummary}
            label="Pacientes alcancadas"
          />
          <ImpactStat
            value={data.clinicalImpact.patientsWhoReadSummary}
            label="Que leram o resumo"
          />
          <ImpactStat
            value={data.clinicalImpact.patientsWhoInteractedWithChat}
            label="Que usaram o chatbot"
          />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Summary Metrics */}
        <MetricCard icon={FileText} title="Ponte de Comunicação">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric value={data.summaryMetrics.totalGenerated} label="Gerados" />
            <Metric value={data.summaryMetrics.totalSent} label="Enviados" />
            <Metric value={`${data.summaryMetrics.readRate}%`} label="Lidos" />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Tempo medio de aprovação: {data.summaryMetrics.avgApprovalTimeMin}min |
            {data.summaryMetrics.editRate}% editados pelo médico
          </div>
        </MetricCard>

        {/* Copilot Metrics */}
        <MetricCard icon={Brain} title="Copiloto de Decisão">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric value={data.copilotMetrics.totalItems} label="Itens gerados" />
            <Metric value={`${data.copilotMetrics.acceptanceRate}%`} label="Aceitos" />
            <Metric value={data.copilotMetrics.realtimeInsights.total} label="Insights RT" />
          </div>
          {data.copilotMetrics.topCategories.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase mb-1">Top categorias</p>
              {data.copilotMetrics.topCategories.slice(0, 3).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-gray-700">{c.category}</span>
                  <span className="text-gray-500">{c.count}x ({c.acceptRate}% aceitos)</span>
                </div>
              ))}
            </div>
          )}
        </MetricCard>

        {/* Chat Metrics */}
        <MetricCard icon={MessageSquare} title="Chatbot">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric value={data.chatMetrics.totalSessions} label="Sessões" />
            <Metric value={data.chatMetrics.totalMessages} label="Mensagens" />
            <Metric value={`${data.chatMetrics.avgResponseTimeSec}s`} label="Tempo resp." />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Taxa de escalação: {data.chatMetrics.escalationRate}%
          </div>
        </MetricCard>

        {/* Longitudinal */}
        <MetricCard icon={AlertTriangle} title="Inteligencia Longitudinal">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric value={data.longitudinalMetrics.totalAlerts} label="Alertas" />
            <Metric value={`${data.longitudinalMetrics.readRate}%`} label="Lidos" />
            <Metric value={`${data.longitudinalMetrics.actionRate}%`} label="Com ação" />
          </div>
        </MetricCard>
      </div>
    </div>
  );
}

function ImpactStat({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <div>
      <p className={cn('text-2xl font-bold', highlight ? 'text-emerald-300' : 'text-white')}>
        {value}
      </p>
      <p className="text-xs text-white/70 mt-0.5">{label}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-lilac" />
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-navy">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
