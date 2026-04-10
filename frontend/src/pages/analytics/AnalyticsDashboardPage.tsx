import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Shield, Users, Activity, Heart, Baby,
  Loader2, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchResearchStats, fetchResearchOverview, INCOME_LABELS, INCOME_COLORS, AGE_GROUP_LABELS } from '../../api/research.api';
import { cn } from '../../utils/cn';
import AiQueryPanel from './AiQueryPanel';

type Tab = 'populacional' | 'clinico';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5', '#7c3aed', '#5b21b6'];
const CONDITION_COLORS = { cesarea: '#f59e0b', preeclampsia: '#ef4444', dmg: '#3b82f6', prematuridade: '#8b5cf6', hellp: '#dc2626', rcf: '#f97316' };

export default function AnalyticsDashboardPage() {
  const [tab, setTab] = useState<Tab>('populacional');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['research-stats'],
    queryFn: fetchResearchStats,
  });

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['research-overview'],
    queryFn: fetchResearchOverview,
  });

  const isLoading = loadingStats || loadingOverview;

  // Parse stats
  const byAgeGroup = stats?.byAgeGroup ?? [];
  const byRegion = stats?.byRegion ?? [];
  const byDeliveryType = stats?.byDeliveryType ?? [];
  const conditionPrevalence = stats?.conditionPrevalence ?? {};
  const byIncome = stats?.byIncome ?? [];
  const byZone = stats?.byZone ?? [];
  const totalRecords = overview?.totalRecords ?? 0;
  const cesareanRate = overview?.cesareanRate ?? 0;
  const avgGa = overview?.avgGestationalAge ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-lilac" />
          <h1 className="text-2xl font-semibold text-navy">Dashboard de Pesquisa</h1>
        </div>
        <span className="text-xs text-gray-400">{totalRecords} registos anonimizados</span>
      </div>

      {/* LGPD Banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700">
          Dados 100% anonimizados — apenas pacientes que consentiram com pesquisa (LGPD). Sem nomes, CPFs ou dados identificaveis.
        </p>
      </div>

      {/* AI Query */}
      <div className="mb-6">
        <AiQueryPanel />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b">
          {[
            { key: 'populacional' as Tab, label: 'Populacional', icon: Users },
            { key: 'clinico' as Tab, label: 'Clinico-Operacional', icon: Activity },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition',
                  tab === t.key ? 'border-lilac text-lilac bg-lilac/5' : 'border-transparent text-gray-500 hover:text-navy hover:bg-gray-50')}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>
        ) : (
          <div className="p-6">
            {tab === 'populacional' && (
              <div className="space-y-8">
                {/* Row 1: Age + Zone */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Distribuicao por Faixa Etaria">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={byAgeGroup.map((g: any) => ({ name: AGE_GROUP_LABELS[g.ageGroup] ?? g.ageGroup ?? g.age_group, count: g.count }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Pacientes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Pacientes por Zona">
                    {byZone.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={byZone.map((z: any) => ({ name: z.zone, value: z.count }))} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                            {byZone.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Legend verticalAlign="bottom" height={36} />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty label="Sem dados de zona" />
                    )}
                  </ChartCard>
                </div>

                {/* Row 2: Income + Region */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Distribuicao por Renda Estimada">
                    {byIncome.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={byIncome.map((r: any) => ({ name: INCOME_LABELS[r.incomeEstimate ?? r.income_estimate] ?? r.incomeEstimate ?? r.income_estimate, count: r.count }))}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Pacientes" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty label="Sem dados de renda" />
                    )}
                  </ChartCard>

                  <ChartCard title="Distribuicao por Regiao/Estado">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={byRegion.map((r: any) => ({ name: r.region ?? r.state, count: r.count }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Pacientes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                {/* Row 3: Delivery type */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Tipo de Parto">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={byDeliveryType.map((d: any) => ({ name: d.deliveryType === 'cesarean' ? 'Cesarea' : d.deliveryType === 'vaginal' ? 'Vaginal' : d.deliveryType ?? d.delivery_type, value: d.count }))} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                          {byDeliveryType.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? '#6366f1' : '#c4b5fd'} />)}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            )}

            {tab === 'clinico' && (
              <div className="space-y-8">
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Taxa de Cesarea" value={`${(cesareanRate * 100).toFixed(1)}%`} icon={Baby} color="text-amber-600 bg-amber-50" />
                  <KpiCard label="Pre-eclampsia" value={`${((conditionPrevalence.preeclampsia ?? 0) * 100).toFixed(1)}%`} icon={AlertTriangle} color="text-red-600 bg-red-50" />
                  <KpiCard label="DMG" value={`${((conditionPrevalence.gestationalDiabetes ?? conditionPrevalence.gestational_diabetes ?? 0) * 100).toFixed(1)}%`} icon={Activity} color="text-blue-600 bg-blue-50" />
                  <KpiCard label="Prematuridade" value={`${((conditionPrevalence.pretermBirth ?? conditionPrevalence.preterm_birth ?? 0) * 100).toFixed(1)}%`} icon={Heart} color="text-violet-600 bg-violet-50" />
                </div>

                {/* Conditions bar chart */}
                <ChartCard title="Prevalencia de Condicoes">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Pre-eclampsia', rate: (conditionPrevalence.preeclampsia ?? 0) * 100 },
                      { name: 'DMG', rate: (conditionPrevalence.gestationalDiabetes ?? conditionPrevalence.gestational_diabetes ?? 0) * 100 },
                      { name: 'Hipertensao', rate: (conditionPrevalence.hypertension ?? 0) * 100 },
                      { name: 'Prematuridade', rate: (conditionPrevalence.pretermBirth ?? conditionPrevalence.preterm_birth ?? 0) * 100 },
                      { name: 'HELLP', rate: (conditionPrevalence.hellpSyndrome ?? conditionPrevalence.hellp_syndrome ?? 0) * 100 },
                      { name: 'RCF', rate: (conditionPrevalence.fgr ?? 0) * 100 },
                    ]} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                      <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} name="Prevalencia" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Risk distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Alto Risco vs Baixo Risco">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={[
                          { name: 'Alto Risco', value: overview?.highRiskCount ?? 0 },
                          { name: 'Baixo Risco', value: (overview?.totalRecords ?? 0) - (overview?.highRiskCount ?? 0) },
                        ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                          <Cell fill="#ef4444" />
                          <Cell fill="#22c55e" />
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="IG Media ao Parto">
                    <div className="flex flex-col items-center justify-center h-[250px]">
                      <p className="text-5xl font-bold text-navy">{avgGa > 0 ? (avgGa / 7).toFixed(1) : '—'}</p>
                      <p className="text-sm text-gray-500 mt-2">semanas</p>
                      <p className="text-xs text-gray-400 mt-1">{totalRecords} partos registados</p>
                    </div>
                  </ChartCard>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h4 className="text-sm font-semibold text-navy mb-4">{title}</h4>
      {children}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-3', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">{label}</div>;
}
