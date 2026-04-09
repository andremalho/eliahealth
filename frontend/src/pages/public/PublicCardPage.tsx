import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, Heart, Calendar, Activity, Syringe, Shield, Baby } from 'lucide-react';
import { fetchPublicCard } from '../../api/pregnancy.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface PublicCardData {
  patient: { name: string };
  pregnancy: {
    gestationalAge: { weeks: number; days: number };
    edd: string;
    trimester: number;
    isHighRisk: boolean;
  };
  profile: { bloodType: string | null };
  consultations: any[];
  vaccines: { vaccineName: string; status: string }[];
}

function fmtDate(d: any): string {
  if (!d) return '—';
  try {
    return new Date(typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR');
  } catch { return '—'; }
}

export default function PublicCardPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [data, setData] = useState<PublicCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Link inválido — token ausente.');
      setLoading(false);
      return;
    }
    fetchPublicCard(token)
      .then((d) => setData(d))
      .catch((err) => {
        const msg = err?.response?.data?.message;
        if (err?.response?.status === 404) setError('Link inválido ou revogado.');
        else if (err?.response?.status === 403) setError('Este link expirou.');
        else setError(msg ?? 'Não foi possível carregar o cartão.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-lilac/10 to-white">
        <Loader2 className="w-8 h-8 text-lilac animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-lilac/10 to-white p-6">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <p className="text-navy font-medium text-center">{error}</p>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Solicite um novo link à sua equipe de saúde.
        </p>
      </div>
    );
  }

  const { patient, pregnancy, profile, consultations, vaccines } = data;
  const ga = pregnancy.gestationalAge;
  const totalDays = ga.weeks * 7 + ga.days;
  const progress = Math.min(100, Math.round((totalDays / 280) * 100));
  const lastCons = consultations[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac/10 to-white pb-8">
      {/* Header */}
      <header className="bg-navy text-white px-6 pt-8 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-lilac/20 -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-lilac/10 -ml-16 -mb-16" />
        <div className="relative">
          <h1 className="text-2xl font-bold">eliahealth</h1>
          <p className="text-sm text-lilac/80 mt-0.5">Cartão da Gestante</p>
        </div>
      </header>

      <div className="-mt-8 px-4 max-w-md mx-auto">
        {/* Cartão principal */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-lilac/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-lilac" fill="currentColor" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Paciente</p>
              <p className="text-lg font-semibold text-navy">{toTitleCase(patient.name)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-lilac/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Idade gestacional</p>
              <p className="text-2xl font-bold text-navy mt-1">{ga.weeks}<span className="text-base font-normal text-gray-500">s</span> {ga.days}<span className="text-base font-normal text-gray-500">d</span></p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-lilac/20 text-lilac text-[10px] font-semibold rounded-full">
                {pregnancy.trimester}º trimestre
              </span>
            </div>

            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Data do parto
              </p>
              <p className="text-lg font-bold text-navy mt-1">{fmtDate(pregnancy.edd)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Provável (DPP)</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
              <span>1º Tri</span><span>2º Tri</span><span>3º Tri</span><span>40s</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  pregnancy.trimester === 1 ? 'bg-emerald-400' :
                  pregnancy.trimester === 2 ? 'bg-amber-400' : 'bg-orange-500',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {pregnancy.isHighRisk && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-xs text-red-700 font-medium">Gestação de alto risco — siga as orientações médicas com atenção</span>
            </div>
          )}
        </div>

        {/* Tipo sanguíneo */}
        {profile.bloodType && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">Tipo sanguíneo</span>
              </div>
              <span className="text-lg font-bold text-navy">{profile.bloodType}</span>
            </div>
          </div>
        )}

        {/* Última consulta */}
        {lastCons && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-navy">Última consulta</h3>
            </div>
            <p className="text-xs text-gray-500">{fmtDate(lastCons.date)}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {lastCons.weight_kg != null && (
                <Mini label="Peso" value={`${lastCons.weight_kg}kg`} />
              )}
              {lastCons.bp_systolic && lastCons.bp_diastolic && (
                <Mini label="Pressão" value={`${lastCons.bp_systolic}/${lastCons.bp_diastolic}`} unit="mmHg" />
              )}
              {lastCons.fetal_heart_rate && (
                <Mini label="Batimentos" value={`${lastCons.fetal_heart_rate}`} unit="bpm" />
              )}
              {lastCons.fundal_height_cm != null && (
                <Mini label="Altura uterina" value={`${lastCons.fundal_height_cm}cm`} />
              )}
            </div>
          </div>
        )}

        {/* Vacinas */}
        {vaccines.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Syringe className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-navy">Vacinas</h3>
            </div>
            <div className="space-y-2">
              {vaccines.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{v.vaccineName}</span>
                  <span className={cn(
                    'px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0',
                    v.status === 'Em dia' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de consultas resumido */}
        {consultations.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Baby className="w-4 h-4 text-lilac" />
              <h3 className="text-sm font-semibold text-navy">Histórico</h3>
            </div>
            <div className="space-y-2">
              {consultations.slice(0, 6).map((c, i) => {
                const days = c.gestational_age_days ?? 0;
                return (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-gray-100 pb-2 last:border-b-0">
                    <span className="text-gray-500">{fmtDate(c.date)}</span>
                    <span className="text-navy font-medium">{Math.floor(days / 7)}s {days % 7}d</span>
                    {c.weight_kg != null && <span className="text-gray-600">{c.weight_kg}kg</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 mt-6">
          Cartão gerado por EliaHealth — link com expiração automática.<br />
          Em emergências, procure atendimento médico imediato.
        </p>
      </div>
    </div>
  );
}

function Mini({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-bold text-navy mt-0.5">
        {value}{unit && <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
