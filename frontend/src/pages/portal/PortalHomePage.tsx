import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Heart, LogOut, Calendar, Loader2, AlertCircle, Activity, Droplets,
  Syringe, FileText, Stethoscope, Plus, FlaskConical, Baby, MessageSquareText,
} from 'lucide-react';
import {
  fetchDashboard, fetchPortalProfile, fetchPortalConsultations, fetchPortalVaccines,
  fetchPortalLabResults, fetchPortalUltrasounds, fetchPortalBp, fetchPortalGlucose,
  fetchPortalVaginalSwabs, fetchPortalPatientExams, fetchPortalPostpartum,
} from '../../api/portal.api';
import { fetchPortalConsultationSummaries, markSummaryAsRead } from '../../api/consultation-summaries.api';
import { usePatientAuthStore } from '../../store/patientAuth.store';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import PortalContentSection from './PortalContentSection';
import PortalBookingFlow from './PortalBookingFlow';
import AddPortalBpModal from './AddPortalBpModal';
import AddPortalGlucoseModal from './AddPortalGlucoseModal';
import AddPortalExamModal from './AddPortalExamModal';

function fmtDate(d: any): string {
  if (!d) return '—';
  try {
    return new Date(typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR');
  } catch { return '—'; }
}

function gaString(days: number): string {
  return `${Math.floor(days / 7)}s ${days % 7}d`;
}

export default function PortalHomePage() {
  const navigate = useNavigate();
  const { patient, logout } = usePatientAuthStore();
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [bpOpen, setBpOpen] = useState(false);
  const [glucoseOpen, setGlucoseOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: fetchDashboard,
    retry: false,
  });

  // Redirect to onboarding if profile not completed
  useEffect(() => {
    if (dashboard && !dashboard.patient?.profileCompletedAt) {
      navigate('/portal/onboarding', { replace: true });
    }
  }, [dashboard, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: fetchPortalProfile,
    retry: false,
    enabled: !!dashboard,
  });

  const { data: consultations } = useQuery({
    queryKey: ['portal-consultations'],
    queryFn: fetchPortalConsultations,
    enabled: !!dashboard,
  });

  const { data: bp } = useQuery({
    queryKey: ['portal-bp'],
    queryFn: fetchPortalBp,
    enabled: !!dashboard,
  });

  const { data: glucose } = useQuery({
    queryKey: ['portal-glucose'],
    queryFn: fetchPortalGlucose,
    enabled: !!dashboard,
  });

  const { data: vaccines } = useQuery({
    queryKey: ['portal-vaccines'],
    queryFn: fetchPortalVaccines,
    enabled: !!dashboard,
  });

  const { data: labResults } = useQuery({
    queryKey: ['portal-lab-results'],
    queryFn: fetchPortalLabResults,
    enabled: !!dashboard,
  });

  const { data: ultrasounds } = useQuery({
    queryKey: ['portal-ultrasounds'],
    queryFn: fetchPortalUltrasounds,
    enabled: !!dashboard,
  });

  const { data: swabs } = useQuery({
    queryKey: ['portal-swabs'],
    queryFn: fetchPortalVaginalSwabs,
    enabled: !!dashboard,
  });

  const { data: myExams } = useQuery({
    queryKey: ['portal-patient-exams'],
    queryFn: fetchPortalPatientExams,
    enabled: !!dashboard,
  });

  const { data: postpartum } = useQuery({
    queryKey: ['portal-postpartum'],
    queryFn: fetchPortalPostpartum,
    enabled: !!dashboard,
  });

  const { data: summaries } = useQuery({
    queryKey: ['portal-summaries'],
    queryFn: () => fetchPortalConsultationSummaries(),
    enabled: !!dashboard,
  });

  const qc = useQueryClient();

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lilac/10 to-white">
        <Loader2 className="w-8 h-8 text-lilac animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-lilac/10 to-white p-6">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <p className="text-navy font-medium text-center mb-2">Não foi possível carregar seus dados</p>
        <p className="text-xs text-gray-500 text-center">
          Pode ser que ainda não exista uma gestação cadastrada para você.<br />
          Entre em contato com sua equipe médica.
        </p>
        <button onClick={handleLogout} className="mt-6 px-4 py-2 bg-lilac text-white text-sm rounded-lg">Sair</button>
      </div>
    );
  }

  const preg = dashboard?.pregnancy ?? {};
  const ga = preg.gestationalAge ?? { weeks: 0, days: 0 };
  const totalDays = ga.weeks * 7 + ga.days;
  const progress = preg.progress ?? Math.min(100, Math.round((totalDays / 280) * 100));
  const trimester = preg.trimester ?? (ga.weeks < 14 ? 1 : ga.weeks < 28 ? 2 : 3);

  const consList = consultations?.data ?? [];
  const bpReadings = bp?.readings ?? [];
  const bpAltered = bp?.summary?.altered ?? 0;
  const glucoseReadings = glucose?.readings ?? [];
  const vaccinesAdmin = vaccines?.administered ?? [];
  const vaccinesPending = vaccines?.pending ?? [];
  const labs = labResults?.data ?? [];
  const usgList = Array.isArray(ultrasounds) ? ultrasounds : [];
  const swabList = Array.isArray(swabs) ? swabs : [];
  const myExamsList = Array.isArray(myExams) ? myExams : [];
  const ppList = Array.isArray(postpartum) ? postpartum : [];
  const summaryList = summaries?.data ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac/10 to-white pb-12">
      {/* Header */}
      <header className="bg-navy text-white px-5 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-lilac/20 -mr-20 -mt-20" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-lilac" fill="currentColor" />
              <h1 className="text-xl font-bold">eliahealth</h1>
            </div>
            <p className="text-sm text-lilac/80 mt-1">
              Olá, {patient?.fullName ? toTitleCase(patient.fullName.split(' ')[0]) : 'gestante'} 👋
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 text-white/70" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="-mt-8 px-4 max-w-md mx-auto space-y-3">
        {/* Cartão principal */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sua gestação</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-lilac/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase">Idade gestacional</p>
              <p className="text-2xl font-bold text-navy mt-1">
                {ga.weeks}<span className="text-base font-normal text-gray-500">s</span> {ga.days}<span className="text-base font-normal text-gray-500">d</span>
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-lilac/20 text-lilac text-[10px] font-semibold rounded-full">
                {trimester}º trimestre
              </span>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data do parto
              </p>
              <p className="text-lg font-bold text-navy mt-1">{fmtDate(preg.edd)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Provável (DPP)</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
              <span>1º</span><span>2º</span><span>3º</span><span>40s</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  trimester === 1 ? 'bg-emerald-400' : trimester === 2 ? 'bg-amber-400' : 'bg-orange-500',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {preg.isHighRisk && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-xs text-red-700 font-medium">Alto risco — siga as orientações médicas</span>
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100">
              <Mini label="Tipo" value={profile.bloodType ?? '—'} />
              <Mini label="Altura" value={profile.height ? `${profile.height}cm` : '—'} />
              <Mini label="IMC" value={profile.currentBmi ? `${profile.currentBmi}` : '—'} />
            </div>
          )}
        </div>

        {/* Atalhos de adicionar */}
        <div className={cn('grid gap-2', preg.isHighRisk ? 'grid-cols-3' : 'grid-cols-1')}>
          {preg.isHighRisk && (
            <>
              <ActionButton icon={Activity} label="PA" color="text-red-500" onClick={() => setBpOpen(true)} />
              <ActionButton icon={Droplets} label="Glicemia" color="text-blue-500" onClick={() => setGlucoseOpen(true)} />
            </>
          )}
          <ActionButton icon={FileText} label="Enviar exame" color="text-violet-500" onClick={() => setExamOpen(true)} />
          <ActionButton icon={Calendar} label="Agendamentos" color="text-emerald-500" onClick={() => setAppointmentsOpen(true)} />
        </div>

        {/* Minhas Consultas Explicadas */}
        {summaryList.length > 0 && (
          <Section title="Minhas consultas explicadas" icon={MessageSquareText} count={summaryList.length}>
            <div className="space-y-3">
              {summaryList.slice(0, 5).map((s: any) => {
                const isUnread = !s.readAt;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      'border rounded-xl p-3 cursor-pointer transition-colors',
                      isUnread ? 'border-lilac/30 bg-lilac/5' : 'border-gray-100 bg-white',
                    )}
                    onClick={() => {
                      if (isUnread) {
                        markSummaryAsRead(s.id).then(() => {
                          qc.invalidateQueries({ queryKey: ['portal-summaries'] });
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{fmtDate(s.consultationDate)}</span>
                      <div className="flex items-center gap-2">
                        {s.gestationalAgeDays != null && (
                          <span className="text-[10px] text-lilac bg-lilac/10 px-1.5 py-0.5 rounded-full">
                            {gaString(s.gestationalAgeDays)}
                          </span>
                        )}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-lilac" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-navy font-medium mb-1">Dr(a). {s.doctorName}</p>
                    <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-4">{s.summaryText}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Consultas Puerperais */}
        {ppList.length > 0 && (
          <Section title="Consultas pos-parto" icon={Baby} count={ppList.length}>
            <div className="space-y-3">
              {ppList.map((c: any, i: number) => {
                const days = c.days_postpartum ?? 0;
                const bp = c.bp_systolic ? `${c.bp_systolic}/${c.bp_diastolic}` : null;
                const bfLabels: Record<string, string> = { exclusive: 'Exclusivo', predominant: 'Predominante', complemented: 'Complementado', not_breastfeeding: 'Nao amamenta' };
                const moodLabels: Record<string, string> = { normal: 'Normal', mild: 'Leve', moderate: 'Moderado', severe: 'Grave' };
                const alerts = c.alerts ?? [];
                return (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-lilac/10 text-lilac text-[10px] font-semibold rounded-full">{days}d pos-parto</span>
                      <span className="text-xs text-gray-500">{fmtDate(c.date)}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap text-[10px]">
                      {bp && <span className={cn('px-1.5 py-0.5 rounded-full', (c.bp_systolic ?? 0) >= 140 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600')}>PA: {bp}</span>}
                      {c.breastfeeding_status && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">Aleit: {bfLabels[c.breastfeeding_status] ?? c.breastfeeding_status}</span>}
                      {c.mood_screening && <span className={cn('px-1.5 py-0.5 rounded-full', c.mood_screening === 'severe' || c.mood_screening === 'moderate' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600')}>Humor: {moodLabels[c.mood_screening] ?? c.mood_screening}</span>}
                      {c.weight_kg && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">{c.weight_kg}kg</span>}
                    </div>
                    {alerts.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {alerts.map((a: any, j: number) => (
                          <p key={j} className={cn('text-[10px] flex items-center gap-1', a.level === 'critical' ? 'text-red-600' : a.level === 'urgent' ? 'text-amber-600' : 'text-blue-600')}>
                            <AlertCircle className="w-3 h-3 shrink-0" /> {a.message}
                          </p>
                        ))}
                      </div>
                    )}
                    {c.subjective && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.subjective}</p>}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Consultas */}
        <Section title="Consultas" icon={Stethoscope} count={consList.length}>
          {consList.length === 0 ? (
            <Empty label="Nenhuma consulta ainda" />
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase border-b border-gray-100">
                    <th className="text-left px-3 py-2 sticky left-0 bg-white z-10">Data</th>
                    <th className="text-left px-2 py-2">IG</th>
                    <th className="text-left px-2 py-2">Peso</th>
                    <th className="text-left px-2 py-2">PA</th>
                    <th className="text-left px-2 py-2">BCF</th>
                    <th className="text-left px-2 py-2">AU</th>
                    <th className="text-left px-2 py-2 pr-3">MF</th>
                  </tr>
                </thead>
                <tbody>
                  {consList.slice().reverse().map((c: any, i: number) => {
                    const altered = (c.bp_systolic ?? 0) >= 140 || (c.bp_diastolic ?? 0) >= 90;
                    return (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2 text-navy font-medium sticky left-0 bg-white z-10 whitespace-nowrap">{fmtDate(c.date)}</td>
                        <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{gaString(c.gestational_age_days ?? 0)}</td>
                        <td className="px-2 py-2 text-gray-700 whitespace-nowrap">{c.weight_kg != null ? `${c.weight_kg}` : '—'}</td>
                        <td className={cn('px-2 py-2 whitespace-nowrap font-mono', altered ? 'text-red-600 font-semibold' : 'text-gray-700')}>
                          {c.bp_systolic ? `${c.bp_systolic}/${c.bp_diastolic}` : '—'}
                        </td>
                        <td className="px-2 py-2 text-gray-700 whitespace-nowrap">{c.fetal_heart_rate ?? '—'}</td>
                        <td className="px-2 py-2 text-gray-700 whitespace-nowrap">{c.fundal_height_cm != null ? `${c.fundal_height_cm}` : '—'}</td>
                        <td className="px-2 py-2 pr-3 text-gray-600 whitespace-nowrap">{c.fetal_movements ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 px-3 mt-2">Deslize a tabela para ver mais →</p>
            </div>
          )}
        </Section>

        {/* Pressão arterial — só alto risco */}
        {preg.isHighRisk && (
        <Section title="Pressão arterial" icon={Activity} count={bpReadings.length} action={<button onClick={() => setBpOpen(true)} className="text-xs text-lilac flex items-center gap-1"><Plus className="w-3 h-3" /> Nova</button>}>
          {bpReadings.length === 0 ? (
            <Empty label="Nenhuma medida ainda" />
          ) : (
            <>
              {bpAltered > 0 && (
                <p className="text-[10px] text-amber-600 mb-2">{bpAltered} medida{bpAltered > 1 ? 's' : ''} alterada{bpAltered > 1 ? 's' : ''}</p>
              )}
              <div className="space-y-1.5">
                {bpReadings.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{fmtDate(r.date)}</span>
                    <span className={cn('font-mono font-bold', r.is_altered ? 'text-red-600' : 'text-navy')}>
                      {r.systolic}/{r.diastolic}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        )}

        {/* Glicemia — só alto risco */}
        {preg.isHighRisk && (
        <Section title="Glicemia" icon={Droplets} count={glucoseReadings.length} action={<button onClick={() => setGlucoseOpen(true)} className="text-xs text-lilac flex items-center gap-1"><Plus className="w-3 h-3" /> Nova</button>}>
          {glucoseReadings.length === 0 ? (
            <Empty label="Nenhuma medida ainda" />
          ) : (
            <div className="space-y-1.5">
              {glucoseReadings.slice(-5).reverse().map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{fmtDate(r.reading_date)} · {labelMeal(r.measurement_type)}</span>
                  <span className={cn('font-mono font-bold', r.status !== 'normal' ? 'text-red-600' : 'text-navy')}>
                    {r.glucose_value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
        )}

        {/* Exames laboratoriais (médico) */}
        <Section title="Exames laboratoriais" icon={FileText} count={labs.length}>
          {labs.length === 0 ? (
            <Empty label="Nenhum exame ainda" />
          ) : (
            <div className="space-y-2">
              {labs.slice(0, 6).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-medium truncate">{e.exam_name}</p>
                    <p className="text-gray-500">{fmtDate(e.collection_date)}</p>
                  </div>
                  {e.value != null && (
                    <span className="text-gray-700 font-mono">{e.value}{e.unit ? ' ' + e.unit : ''}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Meus exames enviados */}
        {myExamsList.length > 0 && (
          <Section title="Exames enviados por você" icon={FileText} count={myExamsList.length}>
            <div className="space-y-2">
              {myExamsList.slice(0, 6).map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-medium truncate">{e.exam_name}</p>
                    <p className="text-gray-500">{fmtDate(e.exam_date)} · {e.review_status === 'pending_review' ? 'Aguardando revisão médica' : 'Confirmado'}</p>
                  </div>
                  {e.value != null && (
                    <span className="text-gray-700 font-mono">{e.value}{e.unit ? ' ' + e.unit : ''}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Ultrassonografias */}
        <Section title="Ultrassonografias" icon={Stethoscope} count={usgList.length}>
          {usgList.length === 0 ? (
            <Empty label="Nenhuma USG ainda" />
          ) : (
            <div className="space-y-2">
              {usgList.slice(0, 5).map((u: any, i: number) => (
                <div key={i} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                  <p className="text-navy font-medium">{u.exam_type ?? 'USG'}</p>
                  <p className="text-gray-500">{fmtDate(u.exam_date)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Vacinas */}
        <Section title="Vacinas" icon={Syringe} count={vaccinesAdmin.length + vaccinesPending.length}>
          {(vaccinesAdmin.length + vaccinesPending.length) === 0 ? (
            <Empty label="Nenhuma vacina registrada" />
          ) : (
            <div className="space-y-1.5">
              {[...vaccinesAdmin, ...vaccinesPending].slice(0, 8).map((v: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate flex-1">{v.vaccine_name}</span>
                  <span className={cn(
                    'px-2 py-0.5 text-[9px] font-medium rounded-full shrink-0',
                    v.status === 'administered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {v.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Coletas vaginais */}
        {swabList.length > 0 && (
          <Section title="Coletas vaginais" icon={FlaskConical} count={swabList.length}>
            <div className="space-y-2">
              {swabList.slice(0, 5).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="text-navy font-medium">{s.examType}</p>
                    <p className="text-gray-500">{fmtDate(s.collectionDate)}</p>
                  </div>
                  <span className="text-gray-600 text-[10px]">{s.statusLabel}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Conteudo educativo personalizado */}
        <PortalContentSection gaWeek={ga.weeks} />

        <p className="text-center text-[10px] text-gray-400 pt-4 pb-2">
          eliahealth · seus dados estão protegidos
        </p>
      </div>

      {appointmentsOpen && <PortalBookingFlow onClose={() => setAppointmentsOpen(false)} />}
      {bpOpen && <AddPortalBpModal onClose={() => setBpOpen(false)} />}
      {glucoseOpen && <AddPortalGlucoseModal onClose={() => setGlucoseOpen(false)} />}
      {examOpen && <AddPortalExamModal onClose={() => setExamOpen(false)} />}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-bold text-navy mt-0.5">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl shadow-sm p-3 flex flex-col items-center gap-1 active:bg-gray-50">
      <div className={cn('w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs text-navy font-medium">{label}</span>
    </button>
  );
}

function Section({ title, icon: Icon, count, children, action }: { title: string; icon: any; count?: number; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-lilac" />
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          {count != null && count > 0 && <span className="text-[10px] text-gray-400">({count})</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-xs text-gray-400 py-2">{label}</p>;
}

function labelMeal(type: string): string {
  const m: Record<string, string> = {
    fasting: 'Jejum',
    post_breakfast_1h: 'Pós café',
    post_breakfast_2h: 'Pós café 2h',
    pre_lunch: 'Antes almoço',
    post_lunch_1h: 'Pós almoço',
    post_lunch_2h: 'Pós almoço 2h',
    pre_dinner: 'Antes jantar',
    post_dinner_1h: 'Pós jantar',
    post_dinner_2h: 'Pós jantar 2h',
    bedtime: 'Antes dormir',
    random: 'Aleatória',
  };
  return m[type] ?? type;
}
