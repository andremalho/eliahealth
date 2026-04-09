import { useQuery } from '@tanstack/react-query';
import { Activity, Stethoscope, FileText, Syringe, Pill, Bot, Clock, Baby } from 'lucide-react';
import { fetchTimeline, type TimelineEvent } from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';

interface Props { pregnancyId: string }

const TYPE_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  consultation: { icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Consulta' },
  ultrasound: { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Ultrassom' },
  lab_result: { icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', label: 'Exame' },
  vaccine: { icon: Syringe, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', label: 'Vacina' },
  prescription: { icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Prescrição' },
  alert: { icon: Bot, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Alerta' },
  postpartum: { icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200', label: 'Puerpério' },
};

function fmtDate(d: string): string {
  try {
    return new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR');
  } catch { return d; }
}

function gaString(days?: number): string | null {
  if (days == null) return null;
  return `${Math.floor(days / 7)}s ${days % 7}d`;
}

function eventSummary(ev: TimelineEvent): string {
  const d = ev.details ?? {};
  switch (ev.type) {
    case 'consultation': {
      const parts: string[] = [];
      if (d.weightKg != null) parts.push(`${d.weightKg}kg`);
      if (d.bpSystolic && d.bpDiastolic) parts.push(`PA ${d.bpSystolic}/${d.bpDiastolic}`);
      if (d.fetalHeartRate) parts.push(`BCF ${d.fetalHeartRate}`);
      if (d.fundalHeightCm != null) parts.push(`AU ${d.fundalHeightCm}cm`);
      return parts.join(' · ') || (d.subjective ? String(d.subjective).slice(0, 80) : 'Consulta registrada');
    }
    case 'ultrasound':
      return d.examType ?? 'Exame realizado';
    case 'lab_result': {
      if (d.value != null) {
        const ref = d.referenceMin != null && d.referenceMax != null ? ` (ref: ${d.referenceMin}–${d.referenceMax})` : '';
        return `${d.value}${d.unit ? ' ' + d.unit : ''}${ref}`;
      }
      return d.examCategory ?? 'Resultado registrado';
    }
    case 'vaccine': {
      const dose = d.doseNumber ? `${d.doseNumber}ª dose · ` : '';
      return `${dose}${d.status ?? ''}`;
    }
    case 'prescription': {
      const meds = Array.isArray(d.medications) ? d.medications : [];
      if (meds.length === 0) return d.notes ?? 'Sem medicações';
      return meds.map((m: any) => m.name ?? '').filter(Boolean).join(', ');
    }
    case 'alert':
      return d.message ?? '';
    default:
      return '';
  }
}

export default function TimelineSection({ pregnancyId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['timeline', pregnancyId],
    queryFn: () => fetchTimeline(pregnancyId),
  });

  const events = data ?? [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-lilac" />
          <h3 className="font-semibold text-navy">Linha do tempo</h3>
        </div>
        <span className="text-xs text-gray-400">{events.length} eventos</span>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="h-32 animate-pulse bg-gray-100 rounded" />
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum evento registrado</p>
        ) : (
          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-4">
              {events.slice(0, 30).map((ev) => {
                const meta = TYPE_META[ev.type] ?? TYPE_META.consultation;
                const Icon = meta.icon;
                const ga = gaString(ev.gestationalAgeDays);
                return (
                  <div key={`${ev.type}-${ev.id}`} className="relative pl-10">
                    <div className={cn(
                      'absolute left-0 top-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center',
                      meta.bg,
                    )}>
                      <Icon className={cn('w-4 h-4', meta.color)} />
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{meta.label}</span>
                          {ga && <span className="px-1.5 py-0.5 bg-lilac/10 text-lilac text-[10px] font-semibold rounded">{ga}</span>}
                        </div>
                        <p className="text-sm font-medium text-navy mt-0.5">{ev.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{eventSummary(ev)}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-1">{fmtDate(ev.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {events.length > 30 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Mostrando os 30 eventos mais recentes (de {events.length})
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
