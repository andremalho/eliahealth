import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Shield, Users, Activity, Heart, Baby, Thermometer, Scale,
  Cigarette, Pill, AlertTriangle, TrendingUp, Eye,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';
import { fetchResearchStats, fetchResearchOverview, INCOME_LABELS, AGE_GROUP_LABELS } from '../../api/research.api';
import { Stat } from '../../components/ui/Stat';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import AiQueryPanel from './AiQueryPanel';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5', '#7c3aed', '#5b21b6'];
const WARM = ['#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

type Tab = 'visao_geral' | 'obstetrica' | 'ginecologica' | 'clinica' | 'populacional';

function pct(n: number | undefined): string { return `${((n ?? 0) * 100).toFixed(1)}%`; }

export default function AnalyticsDashboardPage() {
  const [tab, setTab] = useState<Tab>('visao_geral');
  const { data: stats, isLoading: ls } = useQuery({ queryKey: ['research-stats'], queryFn: fetchResearchStats });
  const { data: overview, isLoading: lo } = useQuery({ queryKey: ['research-overview'], queryFn: fetchResearchOverview });
  const isLoading = ls || lo;
  const s = stats ?? {};
  const o = overview ?? {};
  const total = o.totalRecords ?? 0;
  const cond = s.conditionPrevalence ?? {};
  const byAge = s.byAgeGroup ?? [];
  const byRegion = s.byRegion ?? [];
  const byDelivery = s.byDeliveryType ?? [];
  const byIncome = s.byIncome ?? [];
  const byZone = s.byZone ?? [];

  const tabs = [
    { key: 'visao_geral', label: 'Visao Geral', icon: <Eye className="w-4 h-4" /> },
    { key: 'obstetrica', label: 'Obstetrica', icon: <Baby className="w-4 h-4" /> },
    { key: 'ginecologica', label: 'Ginecologica', icon: <Heart className="w-4 h-4" /> },
    { key: 'clinica', label: 'Clinica', icon: <Activity className="w-4 h-4" /> },
    { key: 'populacional', label: 'Populacional', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Painel de Indicadores</h1>
          <p className="text-sm text-gray-500">Dados anonimizados — {total} registros</p>
        </div>
        <Badge variant="success" dot><Shield className="w-3 h-3" /> LGPD</Badge>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg mb-6 text-xs text-emerald-700">
        <Shield className="w-4 h-4 shrink-0" />
        Dados 100% anonimizados. Apenas pacientes que consentiram com pesquisa.
      </div>

      <div className="mb-6"><AiQueryPanel /></div>

      <Card padding="none">
        <Tabs tabs={tabs} active={tab} onChange={(k) => setTab(k as Tab)} />
        {isLoading ? (
          <div className="p-8 grid grid-cols-4 gap-4">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : (
          <div className="p-6">
            {tab === 'visao_geral' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Stat icon={<Users className="w-5 h-5" />} label="Total" value={total} color="bg-lilac/10 text-lilac" />
                  <Stat icon={<Baby className="w-5 h-5" />} label="Cesarea" value={pct(o.cesareanRate)} color="bg-amber-50 text-amber-600" />
                  <Stat icon={<AlertTriangle className="w-5 h-5" />} label="Pre-eclampsia" value={pct(cond.preeclampsia)} color="bg-red-50 text-red-600" />
                  <Stat icon={<Thermometer className="w-5 h-5" />} label="DMG" value={pct(cond.gestationalDiabetes ?? cond.gestational_diabetes)} color="bg-blue-50 text-blue-600" />
                  <Stat icon={<TrendingUp className="w-5 h-5" />} label="Alto risco" value={`${o.highRiskCount ?? 0}`} color="bg-red-50 text-red-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Condicoes Prevalentes">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[
                        { name: 'PE', value: (cond.preeclampsia ?? 0) * 100 },
                        { name: 'DMG', value: (cond.gestationalDiabetes ?? cond.gestational_diabetes ?? 0) * 100 },
                        { name: 'HAS', value: (cond.hypertension ?? 0) * 100 },
                        { name: 'Prematuridade', value: (cond.pretermBirth ?? cond.preterm_birth ?? 0) * 100 },
                        { name: 'HELLP', value: (cond.hellpSyndrome ?? cond.hellp_syndrome ?? 0) * 100 },
                        { name: 'RCF', value: (cond.fgr ?? 0) * 100 },
                      ]} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>{[0,1,2,3,4,5].map(i => <Cell key={i} fill={WARM[i]} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Tipo de Parto">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={byDelivery.map((d: any) => ({ name: d.deliveryType === 'cesarean' ? 'Cesarea' : d.deliveryType === 'vaginal' ? 'Vaginal' : d.deliveryType ?? d.delivery_type, value: d.count }))}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {byDelivery.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            )}
            {tab === 'obstetrica' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Stat icon={<Baby className="w-5 h-5" />} label="Cesarea" value={pct(o.cesareanRate)} color="bg-amber-50 text-amber-600" />
                  <Stat icon={<AlertTriangle className="w-5 h-5" />} label="PE" value={pct(cond.preeclampsia)} color="bg-red-50 text-red-600" />
                  <Stat icon={<Activity className="w-5 h-5" />} label="DMG" value={pct(cond.gestationalDiabetes ?? cond.gestational_diabetes)} color="bg-blue-50 text-blue-600" />
                  <Stat icon={<Heart className="w-5 h-5" />} label="Prematuridade" value={pct(cond.pretermBirth ?? cond.preterm_birth)} color="bg-violet-50 text-violet-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Alto Risco vs Baixo Risco">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={[{ name: 'Alto Risco', value: o.highRiskCount ?? 0 }, { name: 'Baixo Risco', value: total - (o.highRiskCount ?? 0) }]}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                          <Cell fill="#ef4444" /><Cell fill="#22c55e" />
                        </Pie><Legend /><Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="IG Media ao Parto">
                    <div className="flex flex-col items-center justify-center h-[250px]">
                      <p className="text-5xl font-bold text-navy">{o.avgGestationalAge ? (o.avgGestationalAge / 7).toFixed(1) : '—'}</p>
                      <p className="text-sm text-gray-500 mt-2">semanas</p>
                    </div>
                  </ChartCard>
                </div>
              </div>
            )}
            {tab === 'ginecologica' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat icon={<Heart className="w-5 h-5" />} label="Consultas gine" value="—" color="bg-pink-50 text-pink-600" />
                <Stat icon={<Eye className="w-5 h-5" />} label="Citopatologicos" value="—" color="bg-violet-50 text-violet-600" />
                <Stat icon={<Activity className="w-5 h-5" />} label="Mamografias" value="—" color="bg-blue-50 text-blue-600" />
                <Stat icon={<AlertTriangle className="w-5 h-5" />} label="BI-RADS 4+" value="—" color="bg-red-50 text-red-600" />
              </div>
            )}
            {tab === 'clinica' && (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat icon={<Activity className="w-5 h-5" />} label="HAS" value={pct(cond.hypertension)} color="bg-red-50 text-red-600" />
                <Stat icon={<Thermometer className="w-5 h-5" />} label="Diabetes" value={pct(cond.gestationalDiabetes ?? cond.gestational_diabetes)} color="bg-blue-50 text-blue-600" />
                <Stat icon={<Scale className="w-5 h-5" />} label="Obesidade" value="—" color="bg-amber-50 text-amber-600" />
                <Stat icon={<Cigarette className="w-5 h-5" />} label="Tabagismo" value="—" color="bg-gray-100 text-gray-600" />
                <Stat icon={<Pill className="w-5 h-5" />} label="AAS profilaxia" value="—" color="bg-emerald-50 text-emerald-600" />
              </div>
            )}
            {tab === 'populacional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Faixa Etaria">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={byAge.map((g: any) => ({ name: AGE_GROUP_LABELS[g.ageGroup ?? g.age_group] ?? g.ageGroup ?? g.age_group, count: g.count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                        <Tooltip /><Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="Zona">
                    {byZone.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={byZone.map((z: any) => ({ name: z.zone, value: z.count }))} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label>
                            {byZone.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie><Legend /><Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-gray-400 text-center py-20">Sem dados</p>}
                  </ChartCard>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="Renda (IBGE)">
                    {byIncome.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={byIncome.map((r: any) => ({ name: INCOME_LABELS[r.incomeEstimate ?? r.income_estimate] ?? '?', count: r.count }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 11 }} />
                          <Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <p className="text-sm text-gray-400 text-center py-20">Sem dados</p>}
                  </ChartCard>
                  <ChartCard title="Regiao">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={byRegion.map((r: any) => ({ name: r.region ?? r.state, count: r.count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                        <Tooltip /><Bar dataKey="count" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h4 className="text-sm font-semibold text-navy mb-4">{title}</h4>
      {children}
    </div>
  );
}
