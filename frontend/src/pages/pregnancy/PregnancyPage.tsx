import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Edit3, FileText, Share2, StickyNote, MessageSquare,
  Bell, Plus, List, Table,
} from 'lucide-react';
import { fetchPregnancyDetail, fetchConsultations, fetchPatient } from '../../api/consultations.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { useState } from 'react';

function gaString(days: number) {
  return `${Math.floor(days / 7)}s ${days % 7}d`;
}

function getTrimester(weeks: number) {
  if (weeks < 14) return 1;
  if (weeks < 28) return 2;
  return 3;
}

function progressPercent(days: number) {
  return Math.min(100, Math.round((days / 280) * 100));
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function PregnancyPage() {
  const { pregnancyId } = useParams<{ pregnancyId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');

  const { data: pregnancy, isLoading: loadingPreg } = useQuery({
    queryKey: ['pregnancy', pregnancyId],
    queryFn: () => fetchPregnancyDetail(pregnancyId!),
    enabled: !!pregnancyId,
  });

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', pregnancy?.patientId],
    queryFn: () => fetchPatient(pregnancy!.patientId),
    enabled: !!pregnancy?.patientId,
  });

  const { data: consultationsData, isLoading: loadingConsultations } = useQuery({
    queryKey: ['consultations', pregnancyId],
    queryFn: () => fetchConsultations(pregnancyId!),
    enabled: !!pregnancyId,
  });

  const consultations = consultationsData?.data ?? consultationsData ?? [];
  const isLoading = loadingPreg || loadingPatient;

  const patientName = patient ? toTitleCase(patient.fullName) : '';
  const gaWeeks = pregnancy?.gestationalAge?.weeks ?? Math.floor((pregnancy?.bpReadingsCount ?? 0));
  const gaDays = pregnancy?.gestationalAge?.days ?? 0;
  const gaTotalDays = gaWeeks * 7 + gaDays;
  const trimester = getTrimester(gaWeeks);
  const progress = progressPercent(gaTotalDays);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/dashboard')} className="hover:text-lilac flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Início
        </button>
        <span>/</span>
        <span className="text-gray-400">Gestações</span>
        <span>/</span>
        <span className="text-navy font-medium">{isLoading ? '...' : patientName}</span>
      </div>

      {/* Patient Header */}
      {isLoading ? (
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-navy">{patientName}</h1>
              <button className="text-gray-400 hover:text-lilac"><Edit3 className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {patient?.email && <span>{patient.email}</span>}
              {patient?.email && patient?.phone && <span className="mx-2">·</span>}
              {patient?.phone && <span>{patient.phone}</span>}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" /> 0 contatos de emergência
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: FileText, label: 'Exportar PDF' },
              { icon: Share2, label: 'Compartilhar' },
              { icon: StickyNote, label: 'Post-it' },
              { icon: MessageSquare, label: 'Anotações' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border rounded-lg hover:bg-gray-50 transition">
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* IG Card */}
        <Card title="Idade Gestacional">
          <p className="text-3xl font-bold text-navy">{gaWeeks}s {gaDays}d</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-lilac/10 text-lilac text-xs font-medium rounded-full">
            {pregnancy?.gaMethod === 'ultrasound' ? 'USG' : pregnancy?.gaMethod === 'ivf' ? 'FIV' : 'DUM'}
          </span>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>1º Tri</span><span>2º Tri</span><span>3º Tri</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', trimester === 1 ? 'bg-blue-400' : trimester === 2 ? 'bg-amber-400' : 'bg-orange-500')}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </Card>

        {/* DPP Card */}
        <Card title="Data Provável do Parto">
          <p className="text-3xl font-bold text-navy">
            {pregnancy?.edd ? new Date(pregnancy.edd + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            DUM: {pregnancy?.lmpDate ? new Date(pregnancy.lmpDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
          </p>
        </Card>

        {/* Status Card */}
        <Card title="Gestação e Parto">
          <p className="text-lg font-semibold text-navy">
            {pregnancy?.status === 'active' ? 'Em andamento' : pregnancy?.status ?? '—'}
          </p>
          {pregnancy?.isHighRisk && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
              Alto Risco
            </span>
          )}
          {pregnancy?.highRiskFlags?.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{pregnancy.highRiskFlags.join(', ')}</p>
          )}
        </Card>
      </div>

      {/* Summary Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card title="Antecedentes Obstétricos">
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'G', value: pregnancy?.gravida },
              { label: 'P', value: pregnancy?.para },
              { label: 'A', value: pregnancy?.abortus },
              { label: 'C', value: pregnancy?.cesareans },
            ].map(({ label, value }) => (
              <span key={label} className="px-2.5 py-1 bg-gray-100 text-navy text-sm font-semibold rounded-lg">
                {label}{value ?? 0}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Patologias, Medicações e Hábitos">
          <p className="text-sm text-gray-500">Nenhum registrado</p>
        </Card>

        <Card title="Histórico Clínico">
          <p className="text-sm text-gray-500">
            {patient?.comorbidities || patient?.allergies
              ? [patient?.comorbidities, patient?.allergies].filter(Boolean).join(' · ')
              : 'Nenhum registrado'}
          </p>
        </Card>
      </div>

      {/* Consultations Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-navy">Consultas</h2>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('table')} className={cn('p-1.5', viewMode === 'table' ? 'bg-lilac text-white' : 'text-gray-400')}>
                <Table className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn('p-1.5', viewMode === 'list' ? 'bg-lilac text-white' : 'text-gray-400')}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-lilac text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition">
              <Plus className="w-3.5 h-3.5" /> Nova Consulta
            </button>
          </div>
        </div>

        {loadingConsultations ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : consultations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mb-2" />
            <p className="text-sm">Nenhuma consulta registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">IG</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Peso</th>
                  <th className="px-4 py-3 font-medium">PA</th>
                  <th className="px-4 py-3 font-medium">BCF</th>
                  <th className="px-4 py-3 font-medium">MF</th>
                  <th className="px-4 py-3 font-medium">Edema</th>
                  <th className="px-4 py-3 font-medium">TV</th>
                  <th className="px-4 py-3 font-medium">AF</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {consultations.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">
                        {gaString(c.gestationalAgeDays ?? c.gestational_age_days ?? 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date((c.date ?? '') + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.weightKg ?? c.weight_kg ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(c.bpSystolic ?? c.bp_systolic) ? `${c.bpSystolic ?? c.bp_systolic}/${c.bpDiastolic ?? c.bp_diastolic}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.fetalHeartRate ?? c.fetal_heart_rate ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{c.fetalMovements ?? c.fetal_movements ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{c.edemaGrade ?? c.edema_grade ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{c.fetalPresentation ?? c.fetal_presentation ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{c.fundalHeightCm ?? c.fundal_height_cm ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <button className="text-gray-400 hover:text-lilac"><Edit3 className="w-3.5 h-3.5" /></button>
      </div>
      {children}
    </div>
  );
}
