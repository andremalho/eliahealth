import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit3, FileText, Share2, StickyNote, MessageSquare,
  Bell, Plus, List, Table as TableIcon, AlertCircle, Pencil, Trash2,
} from 'lucide-react';
import { fetchPregnancyDetail, fetchConsultations, fetchPatient } from '../../api/consultations.api';
import { deleteConsultation, downloadPregnancyCard } from '../../api/pregnancy.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import BpSection from './sections/BpSection';
import GlucoseSection from './sections/GlucoseSection';
import CopilotPanel from './sections/CopilotPanel';
import NewConsultationModal from './sections/NewConsultationModal';
import InitialAssessmentModal from './sections/InitialAssessmentModal';
import ShareModal from './sections/ShareModal';
import TimelineSection from './sections/TimelineSection';
import {
  VaccinesCard, VaginalSwabsCard, BiologicalFatherCard,
  UltrasoundsCard, LabResultsCard, PrescriptionsCard, FilesCard,
} from './sections/SidebarCards';

function gaString(days: number) { return `${Math.floor(days / 7)}s ${days % 7}d`; }
function getTrimester(w: number) { return w < 14 ? 1 : w < 28 ? 2 : 3; }
function mapEdema(v: string | null): string {
  if (!v) return '—';
  const m: Record<string, string> = { absent: 'Ausente', none: 'Ausente', '1plus': '1+', '2plus': '2+', '3plus': '3+', '4plus': '4+', '1+': '1+', '2+': '2+', '3+': '3+', '4+': '4+' };
  return m[v] ?? v;
}
function mapFetalMovement(v: string | null): string {
  if (!v) return '—';
  const m: Record<string, string> = {
    'Presentes e ativos': 'Presente', 'Presentes e hipoativos': 'Hipoativo',
    'Ausentes': 'Ausente', 'Não avaliado': 'Não avaliado',
    present: 'Presente', absent: 'Ausente', not_evaluated: 'Não avaliado', decreased: 'Hipoativo',
  };
  return m[v] ?? v;
}
function mapPresentation(v: string | null): string {
  if (!v) return '—';
  const m: Record<string, string> = {
    nr: 'NR', not_performed: 'NR', cephalic: 'Cefálica', pelvic: 'Pélvica',
    transverse: 'Transverso', oblique: 'Oblíquo', not_evaluated: 'Não avaliado',
  };
  return m[v] ?? v;
}
function mapCervicalState(c: any): string {
  const state = c?.cervicalState ?? c?.cervical_state;
  if (!state) return '—';
  const m: Record<string, string> = {
    nr: 'NR', impervious: 'Impérvio', shortened: 'Encurtado',
    softened: 'Amolecido', dilated: 'Dilatado', other: 'Outros',
  };
  if (state === 'dilated') {
    const cm = c?.cervicalDilation ?? c?.cervical_dilation;
    return cm != null ? `Dilatado ${cm}cm` : 'Dilatado';
  }
  if (state === 'other') {
    return c?.vaginalExam ?? c?.vaginal_exam ?? 'Outros';
  }
  return m[state] ?? state;
}
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}
function bmiCategory(bmi: number): { label: string; cls: string } {
  if (bmi < 18.5) return { label: 'Baixo peso', cls: 'bg-amber-100 text-amber-700' };
  if (bmi < 25) return { label: 'Normal', cls: 'bg-emerald-100 text-emerald-700' };
  if (bmi < 30) return { label: 'Sobrepeso', cls: 'bg-amber-100 text-amber-700' };
  if (bmi < 40) return { label: 'Obesidade', cls: 'bg-red-100 text-red-700' };
  return { label: 'Obesidade grave', cls: 'bg-red-200 text-red-800' };
}

export default function PregnancyPage() {
  const { pregnancyId } = useParams<{ pregnancyId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [consultationModal, setConsultationModal] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<any>(null);
  const [initialAssessmentModal, setInitialAssessmentModal] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const qc = useQueryClient();
  const deleteCons = useMutation({
    mutationFn: (id: string) => deleteConsultation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultations', pregnancyId] }),
  });

  const { data: pregnancy, isLoading: lp } = useQuery({
    queryKey: ['pregnancy', pregnancyId], queryFn: () => fetchPregnancyDetail(pregnancyId!), enabled: !!pregnancyId,
  });
  const { data: patient, isLoading: lPat } = useQuery({
    queryKey: ['patient', pregnancy?.patientId], queryFn: () => fetchPatient(pregnancy!.patientId), enabled: !!pregnancy?.patientId,
  });
  const { data: consultationsData } = useQuery({
    queryKey: ['consultations', pregnancyId], queryFn: () => fetchConsultations(pregnancyId!), enabled: !!pregnancyId,
  });

  const consultations = consultationsData?.data ?? consultationsData ?? [];
  const isLoading = lp || lPat;
  const initialAssessmentDone = !!(pregnancy as any)?.firstConsultationCompletedAt;

  // Auto-abre o modal de avaliacao inicial uma vez ao entrar, se ainda nao foi preenchido
  useEffect(() => {
    if (pregnancy && patient && !initialAssessmentDone) {
      const key = `assessment_prompted_${pregnancyId}`;
      if (!sessionStorage.getItem(key)) {
        setInitialAssessmentModal(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, [pregnancy, patient, initialAssessmentDone, pregnancyId]);
  const patientName = patient ? toTitleCase(patient.fullName) : '';

  let gaWeeks = pregnancy?.gestationalAge?.weeks ?? 0;
  let gaDays = pregnancy?.gestationalAge?.days ?? 0;
  if (!pregnancy?.gestationalAge && pregnancy?.lmpDate) {
    const diff = Math.floor((Date.now() - new Date(pregnancy.lmpDate).getTime()) / 86_400_000);
    gaWeeks = Math.floor(diff / 7); gaDays = diff % 7;
  }
  const gaTotalDays = gaWeeks * 7 + gaDays;
  const trimester = getTrimester(gaWeeks);
  const progress = Math.min(100, Math.round((gaTotalDays / 280) * 100));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/dashboard')} className="hover:text-lilac flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Início
        </button>
        <span>/</span><span className="text-gray-400">Gestações</span>
        <span>/</span><span className="text-navy font-medium">{isLoading ? '...' : patientName}</span>
      </div>

      {/* Patient Header */}
      {isLoading ? (
        <div className="space-y-3 mb-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /></div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-navy">{patientName}</h1>
              {pregnancy?.isHighRisk && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">Alto Risco</span>}
              <button className="text-gray-400 hover:text-lilac"><Edit3 className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {patient?.email}{patient?.email && patient?.phone && ' · '}{patient?.phone}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> 0 contatos de emergência</p>
            {!patient?.email && !patient?.phone && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-700">E-mail ou telefone necessários para compartilhar cartão</span>
              </div>
            )}
            {!initialAssessmentDone && (
              <button
                onClick={() => setInitialAssessmentModal(true)}
                className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-700 font-medium">Avaliação inicial pendente — clique para preencher</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                if (!pregnancyId) return;
                setPdfDownloading(true);
                try {
                  await downloadPregnancyCard(pregnancyId, `cartao_${(patient?.fullName ?? 'gestante').replace(/\s+/g, '_').toLowerCase()}.pdf`);
                } finally {
                  setPdfDownloading(false);
                }
              }}
              disabled={pdfDownloading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              {pdfDownloading ? 'Gerando...' : 'PDF'}
            </button>
            <button
              onClick={() => setShareModalOpen(true)}
              disabled={!patient?.email && !patient?.phone}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              title={!patient?.email && !patient?.phone ? 'Necessário e-mail ou telefone' : ''}
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar
            </button>
            {[{ icon: StickyNote, label: 'Post-it' }, { icon: MessageSquare, label: 'Nota' }].map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border rounded-lg hover:bg-gray-50 transition"><Icon className="w-3.5 h-3.5" />{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card title="Idade Gestacional">
          <p className="text-3xl font-bold text-navy">{gaWeeks}s {gaDays}d</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-lilac/10 text-lilac text-xs font-medium rounded-full">
            {pregnancy?.gaMethod === 'ultrasound' ? 'USG' : pregnancy?.gaMethod === 'ivf' ? 'FIV' : 'DUM'}
          </span>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>1º Tri</span><span>2º Tri</span><span>3º Tri</span></div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', trimester === 1 ? 'bg-blue-400' : trimester === 2 ? 'bg-amber-400' : 'bg-orange-500')} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </Card>
        <Card title="Data Provável do Parto">
          <p className="text-3xl font-bold text-navy">{pregnancy?.edd ? new Date(pregnancy.edd + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</p>
          <p className="text-sm text-gray-500 mt-1">DUM: {pregnancy?.lmpDate ? new Date(pregnancy.lmpDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</p>
        </Card>
        <Card title="Gestação e Parto">
          <p className="text-lg font-semibold text-navy">{pregnancy?.status === 'active' ? 'Em andamento' : pregnancy?.status ?? '—'}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {[['G', 'gravida'], ['P', 'para'], ['A', 'abortus'], ['C', 'cesareans']].map(([l, k]) => (
              <span key={l} className="px-2 py-0.5 bg-gray-100 text-navy text-xs font-semibold rounded">{l}{pregnancy?.[k] ?? 0}</span>
            ))}
          </div>
        </Card>
      </div>

      {/* Second row: IMC + Obstétricos + Comorbidades */}
      {(() => {
        const lastWeightKg = consultations
          .map((c: any) => Number(c.weightKg ?? c.weight_kg))
          .filter((w: number) => !Number.isNaN(w) && w > 0)
          .pop();
        const heightCm = (patient as any)?.height ? Number((patient as any).height) : null;
        const bmi = lastWeightKg && heightCm ? lastWeightKg / Math.pow(heightCm / 100, 2) : null;
        const bmiCat = bmi ? bmiCategory(bmi) : null;
        const comorbidities: string[] = (patient as any)?.comorbiditiesSelected ?? [];
        const addictionsList: string[] = (patient as any)?.addictionsSelected ?? [];
        const allergiesText = (patient as any)?.allergies as string | null;
        const familyHistText = (patient as any)?.familyHistory as string | null;
        const menarche = (patient as any)?.menarcheAge as number | null;
        const cycle = (patient as any)?.menstrualCycle as string | null;
        const dysmen = (patient as any)?.dysmenorrhea as boolean | null;
        const gynecoNotes = (pregnancy as any)?.gynecologicalHistory as string | null;
        const surgeries = (patient as any)?.surgeries as string | null;
        const medications = (pregnancy as any)?.currentMedications as string | null;
        const currentPath = (pregnancy as any)?.currentPathologies as string | null;

        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card title="Antropometria / IMC" onEdit={() => setInitialAssessmentModal(true)}>
                {bmi ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-navy">{bmi.toFixed(1)}</p>
                      <span className="text-xs text-gray-500">kg/m²</span>
                      {bmiCat && (
                        <span className={cn('ml-auto px-2 py-0.5 text-xs font-semibold rounded-full', bmiCat.cls)}>
                          {bmiCat.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {lastWeightKg}kg · {heightCm}cm
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    {!heightCm ? 'Altura não informada' : 'Sem peso registrado'}
                  </p>
                )}
              </Card>

              <Card title="Antecedentes Obstétricos" onEdit={() => setInitialAssessmentModal(true)}>
                <div className="flex gap-2 flex-wrap">
                  {[['G', 'gravida'], ['A', 'abortus'], ['P', 'para']].map(([l, k]) => (
                    <span key={l} className="px-2.5 py-1 bg-gray-100 text-navy text-sm font-semibold rounded-lg">
                      {l}{(pregnancy as any)?.[k] ?? 0}
                    </span>
                  ))}
                </div>
                {((pregnancy as any)?.para ?? 0) >= 1 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {[['PV', 'vaginalDeliveries'], ['PC', 'cesareans'], ['PF', 'forcepsDeliveries']].map(([l, k]) => (
                      <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                        {l} {(pregnancy as any)?.[k] ?? 0}
                      </span>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Comorbidades" onEdit={() => setInitialAssessmentModal(true)}>
                {comorbidities.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma registrada</p>
                ) : (
                  <div className="flex gap-1.5 flex-wrap">
                    {comorbidities.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded-full">{c}</span>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Third row: Hábitos/Alergias + Familiares + Ginecológicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card title="Hábitos e Alergias" onEdit={() => setInitialAssessmentModal(true)}>
                {addictionsList.length === 0 && !allergiesText ? (
                  <p className="text-sm text-gray-400">Sem registros</p>
                ) : (
                  <div className="space-y-2">
                    {addictionsList.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {addictionsList.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                    {allergiesText && (
                      <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Alergias:</span> {allergiesText}</p>
                    )}
                  </div>
                )}
              </Card>

              <Card title="Antecedentes Familiares" onEdit={() => setInitialAssessmentModal(true)}>
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {familyHistText || <span className="text-gray-400">Sem registros</span>}
                </p>
              </Card>

              <Card title="Ginecológicos / Cirúrgicos" onEdit={() => setInitialAssessmentModal(true)}>
                <div className="text-xs text-gray-600 space-y-1">
                  {menarche && <p>Menarca: <span className="font-medium">{menarche} anos</span></p>}
                  {cycle && <p>Ciclo: <span className="font-medium capitalize">{cycle}</span></p>}
                  {dysmen != null && <p>Dismenorreia: <span className="font-medium">{dysmen ? 'Sim' : 'Não'}</span></p>}
                  {gynecoNotes && <p className="text-gray-500 mt-1">{gynecoNotes}</p>}
                  {surgeries && <p className="text-gray-500"><span className="font-medium text-gray-700">Cirurgias:</span> {surgeries}</p>}
                  {!menarche && !cycle && dysmen == null && !gynecoNotes && !surgeries && (
                    <p className="text-gray-400">Sem registros</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Quarta linha condicional: medicações e patologias da gestação atual */}
            {(medications || currentPath) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {currentPath && (
                  <Card title="Patologias da gestação atual" onEdit={() => setInitialAssessmentModal(true)}>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{currentPath}</p>
                  </Card>
                )}
                {medications && (
                  <Card title="Medicações em uso" onEdit={() => setInitialAssessmentModal(true)}>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{medications}</p>
                  </Card>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* PA Alert Banner — scan ALL consultations for elevated BP */}
      {(() => {
        const altered = consultations.find((c: any) => {
          const s = Number(c.bpSystolic ?? c.bp_systolic ?? 0);
          const d = Number(c.bpDiastolic ?? c.bp_diastolic ?? 0);
          return s >= 140 || d >= 90;
        });
        if (altered) {
          const s = altered.bpSystolic ?? altered.bp_systolic;
          const d = altered.bpDiastolic ?? altered.bp_diastolic;
          const dt = altered.date ? new Date(altered.date + 'T12:00:00').toLocaleDateString('pt-BR') : '';
          return (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-sm text-red-700 font-medium">
                ⚠️ Atenção: pressão arterial elevada registrada — {s}×{d} mmHg{dt ? ` em ${dt}` : ''} — Avaliar conduta
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {pregnancyId && pregnancy?.isHighRisk && <BpSection pregnancyId={pregnancyId} />}
          {pregnancyId && pregnancy?.isHighRisk && <GlucoseSection pregnancyId={pregnancyId} />}

          {/* Consultations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-navy">Consultas</h3>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('table')} className={cn('p-1.5', viewMode === 'table' ? 'bg-lilac text-white' : 'text-gray-400')}><TableIcon className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={cn('p-1.5', viewMode === 'list' ? 'bg-lilac text-white' : 'text-gray-400')}><List className="w-4 h-4" /></button>
                </div>
                <button onClick={() => { setEditingConsultation(null); setConsultationModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-lilac text-white text-xs rounded-lg hover:bg-primary-dark"><Plus className="w-3.5 h-3.5" /> Nova</button>
              </div>
            </div>
            {consultations.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400"><FileText className="w-8 h-8 mb-2" /><p className="text-sm">Nenhuma consulta</p></div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                    <th className="px-3 py-2">IG</th><th className="px-3 py-2">Data</th><th className="px-3 py-2">Peso</th>
                    <th className="px-3 py-2">PA</th><th className="px-3 py-2">BCF</th><th className="px-3 py-2">MF</th>
                    <th className="px-3 py-2">Edema</th><th className="px-3 py-2">TV</th><th className="px-3 py-2">Apr.</th><th className="px-3 py-2">AU</th>
                    <th className="px-3 py-2"></th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {consultations.map((c: any) => (
                      <tr key={c.id} className="group hover:bg-gray-50">
                        <td className="px-3 py-2"><span className="px-2 py-0.5 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">{gaString(c.gestationalAgeDays ?? c.gestational_age_days ?? 0)}</span></td>
                        <td className="px-3 py-2">{new Date((c.date ?? '') + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2">{c.weightKg ?? c.weight_kg ?? '—'}</td>
                        <td className="px-3 py-2">{(c.bpSystolic ?? c.bp_systolic) ? `${c.bpSystolic ?? c.bp_systolic}/${c.bpDiastolic ?? c.bp_diastolic}` : '—'}</td>
                        <td className="px-3 py-2">{c.fetalHeartRate ?? c.fetal_heart_rate ?? '—'}</td>
                        <td className="px-3 py-2">{mapFetalMovement(c.fetalMovements ?? c.fetal_movements)}</td>
                        <td className="px-3 py-2">{mapEdema(c.edemaGrade ?? c.edema_grade)}</td>
                        <td className="px-3 py-2">{mapCervicalState(c)}</td>
                        <td className="px-3 py-2">{mapPresentation(c.fetalPresentation ?? c.fetal_presentation)}</td>
                        <td className="px-3 py-2">{c.fundalHeightCm ?? c.fundal_height_cm ?? '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => { setEditingConsultation(c); setConsultationModal(true); }} className="p-0.5 text-gray-400 hover:text-lilac" title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Excluir esta consulta?')) deleteCons.mutate(c.id); }}
                              className="p-0.5 text-gray-400 hover:text-red-500"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="divide-y">
                {consultations.map((c: any) => (
                  <div key={c.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">{gaString(c.gestationalAgeDays ?? c.gestational_age_days ?? 0)}</span>
                      <span className="text-gray-700">{new Date((c.date ?? '') + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                    {(c.subjective || c.assessment) && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.subjective ?? c.assessment}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      {(c.weightKg ?? c.weight_kg) && <span>Peso: {c.weightKg ?? c.weight_kg}kg</span>}
                      {(c.bpSystolic ?? c.bp_systolic) && <span>PA: {c.bpSystolic ?? c.bp_systolic}/{c.bpDiastolic ?? c.bp_diastolic}</span>}
                      {(c.fetalHeartRate ?? c.fetal_heart_rate) && <span>BCF: {c.fetalHeartRate ?? c.fetal_heart_rate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pregnancyId && <TimelineSection pregnancyId={pregnancyId} />}
        </div>

        {/* Sidebar */}
        {pregnancyId && (
          <div className="space-y-4">
            <Card title="Perfil da Gestante">
              <div className="space-y-1 text-xs text-gray-700">
                <p>Tipo sanguíneo: {patient?.bloodType ?? '—'}</p>
                <p>Altura: {patient?.height ? `${patient.height} cm` : '—'}</p>
              </div>
            </Card>
            <BiologicalFatherCard pregnancyId={pregnancyId} />
            <VaccinesCard pregnancyId={pregnancyId} />
            <LabResultsCard pregnancyId={pregnancyId} />
            <UltrasoundsCard pregnancyId={pregnancyId} />
            <VaginalSwabsCard pregnancyId={pregnancyId} />
            <PrescriptionsCard pregnancyId={pregnancyId} />
            <FilesCard pregnancyId={pregnancyId} />
          </div>
        )}
      </div>

      {pregnancyId && <CopilotPanel pregnancyId={pregnancyId} />}
      {consultationModal && pregnancyId && (
        <NewConsultationModal
          pregnancyId={pregnancyId}
          initial={editingConsultation}
          onClose={() => { setConsultationModal(false); setEditingConsultation(null); }}
        />
      )}
      {shareModalOpen && pregnancyId && (
        <ShareModal
          pregnancyId={pregnancyId}
          patientName={patientName}
          onClose={() => setShareModalOpen(false)}
        />
      )}
      {initialAssessmentModal && pregnancyId && pregnancy?.patientId && (
        <InitialAssessmentModal
          pregnancyId={pregnancyId}
          patientId={pregnancy.patientId}
          initialHeight={(patient as any)?.height}
          patient={patient}
          pregnancy={pregnancy}
          onClose={() => setInitialAssessmentModal(false)}
        />
      )}
    </div>
  );
}

function Card({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="text-gray-400 hover:text-lilac" title="Editar">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
