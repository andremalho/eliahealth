import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Flower2,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchMenopauseAssessments,
  STRAW_LABELS,
  MENOPAUSE_TYPE_LABELS,
  HRT_SCHEME_LABELS,
  ESTROGEN_ROUTE_LABELS,
  OSTEOPOROSIS_LABELS,
  classifyMRS,
  type MenopauseAssessment,
  type MenopauseAlert,
} from '../../../api/menopause-assessments.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';
import NewMenopauseAssessmentModal from './NewMenopauseAssessmentModal';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function MenopauseSection({ patientId }: { patientId: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['menopause-assessments', patientId],
    queryFn: () => fetchMenopauseAssessments(patientId),
    enabled: !!patientId,
  });

  const items = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-navy">Avaliações de menopausa</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            STRAW+10, MRS, GSM, DEXA/FRAX, THM (NAMS/FEBRASGO)
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          Nova avaliação
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <Flower2 className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma avaliação registrada</p>
          <p className="text-sm mt-1">Clique em "Nova avaliação" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card
              key={it.id}
              item={it}
              expanded={expandedId === it.id}
              onToggle={() => setExpandedId(expandedId === it.id ? null : it.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewMenopauseAssessmentModal
          patientId={patientId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function Card({
  item: c,
  expanded,
  onToggle,
}: {
  item: MenopauseAssessment;
  expanded: boolean;
  onToggle: () => void;
}) {
  const alerts = c.alerts ?? [];
  const urgentCount = alerts.filter((a) => a.severity === 'urgent').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const mrs = c.mrsTotalScore !== null ? classifyMRS(c.mrsTotalScore) : null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-lilac/50 transition">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-lilac/10 text-lilac flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-800">{formatDate(c.assessmentDate)}</span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {STRAW_LABELS[c.strawStage]}
            </span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {MENOPAUSE_TYPE_LABELS[c.menopauseType]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {mrs && (
              <span className={cn('px-1.5 py-0.5 text-[10px] font-semibold rounded', mrs.color)}>
                MRS {c.mrsTotalScore} — {mrs.label}
              </span>
            )}
            {c.osteoporosisClassification && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded">
                {OSTEOPOROSIS_LABELS[c.osteoporosisClassification]}
              </span>
            )}
            {c.gsmDiagnosis && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-pink-50 text-pink-700 rounded">
                GSM
              </span>
            )}
            {c.hrtScheme && c.hrtScheme !== 'none' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded">
                THM
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {urgentCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-semibold rounded">
              <AlertCircle className="w-3 h-3" />
              {warningCount}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-gray-50/50 space-y-4">
          <DataGrid
            items={[
              c.ageAtMenopause
                ? { label: 'Idade na menopausa', value: `${c.ageAtMenopause} anos` }
                : null,
              c.hotFlashesPerDay !== null
                ? { label: 'Fogachos/dia', value: String(c.hotFlashesPerDay) }
                : null,
              c.dexaLumbarTScore !== null
                ? { label: 'DEXA lombar T', value: Number(c.dexaLumbarTScore).toFixed(1) }
                : null,
              c.dexaFemoralNeckTScore !== null
                ? { label: 'DEXA fêmur T', value: Number(c.dexaFemoralNeckTScore).toFixed(1) }
                : null,
              c.fraxScore10yrMajor !== null
                ? { label: 'FRAX major', value: `${c.fraxScore10yrMajor}%` }
                : null,
              c.vitaminDLevel !== null
                ? { label: 'Vit D', value: `${c.vitaminDLevel} ng/mL` }
                : null,
            ]}
          />

          {c.hrtScheme && c.hrtScheme !== 'none' && (
            <Block label="Terapia hormonal">
              {HRT_SCHEME_LABELS[c.hrtScheme]}
              {c.estrogenRoute && c.estrogenRoute !== 'none' && (
                <> · {ESTROGEN_ROUTE_LABELS[c.estrogenRoute]}</>
              )}
              {c.estrogenDrug && <> · {c.estrogenDrug}</>}
              {c.progestogenDrug && <> + {c.progestogenDrug}</>}
            </Block>
          )}
          {c.diagnosis && <Block label="Diagnóstico">{c.diagnosis}</Block>}
          {c.treatmentPlan && <Block label="Plano terapêutico">{c.treatmentPlan}</Block>}
          {c.notes && <Block label="Observações">{c.notes}</Block>}

          {alerts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Alertas do copiloto
              </p>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <AlertItem key={i} alert={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DataGrid({ items }: { items: ({ label: string; value: string } | null)[] }) {
  const filtered = items.filter((i): i is { label: string; value: string } => i !== null);
  if (filtered.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filtered.map((item) => (
        <div key={item.label} className="bg-white rounded p-2.5 border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase">{item.label}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function AlertItem({ alert }: { alert: MenopauseAlert }) {
  const styles = {
    urgent: { Icon: AlertTriangle, cls: 'bg-red-50 border-red-200 text-red-700' },
    warning: { Icon: AlertCircle, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    info: { Icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  };
  const s = styles[alert.severity];
  return (
    <div className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-sm', s.cls)}>
      <s.Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{alert.message}</span>
    </div>
  );
}
