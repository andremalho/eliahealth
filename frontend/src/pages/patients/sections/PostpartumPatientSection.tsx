import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Baby, AlertCircle, AlertTriangle, Pencil, Trash2,
  ChevronDown, ChevronUp, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchPostpartumByPatient, deletePostpartumConsultation,
  createPostpartumConsultation, updatePostpartumConsultation,
} from '../../../api/pregnancy.api';
import { cn } from '../../../utils/cn';
import { formatDate } from '../../../utils/formatters';

const LOCHIA: Record<string, string> = { rubra: 'Rubra', serosa: 'Serosa', alba: 'Alba', absent: 'Ausente' };
const INVOLUTION: Record<string, string> = { normal: 'Normal', subinvolution: 'Subinvolucao', not_palpable: 'Nao palpavel' };
const BF: Record<string, string> = { exclusive: 'Exclusivo', predominant: 'Predominante', complemented: 'Complementado', not_breastfeeding: 'Nao amamenta' };
const BREAST: Record<string, string> = { normal: 'Normal', engorgement: 'Ingurgitamento', fissure: 'Fissura', mastitis: 'Mastite', abscess: 'Abscesso' };
const MOOD: Record<string, string> = { normal: 'Normal', mild: 'Leve', moderate: 'Moderado', severe: 'Grave' };
const WOUND: Record<string, string> = { good: 'Boa', dehiscence: 'Deiscencia', infection: 'Infeccao', hematoma: 'Hematoma', not_applicable: 'N/A' };
const DELIVERY: Record<string, string> = { vaginal: 'Vaginal', cesarean: 'Cesarea', forceps: 'Forceps', vacuum: 'Vacuo' };

function fmtDate(d: any): string {
  if (!d) return '—';
  try { return new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return '—'; }
}

function val(obj: any, ...keys: string[]): any {
  for (const k of keys) {
    const camel = k;
    const snake = k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    if (obj[camel] != null) return obj[camel];
    if (obj[snake] != null) return obj[snake];
  }
  return null;
}

export default function PostpartumPatientSection({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['postpartum-patient', patientId],
    queryFn: () => fetchPostpartumByPatient(patientId),
    enabled: !!patientId,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePostpartumConsultation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postpartum-patient', patientId] });
      toast.success('Consulta puerperal excluida');
    },
  });

  const consultations = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-lilac" />
          <h3 className="text-lg font-semibold text-navy">Consultas Puerperais</h3>
          {consultations.length > 0 && (
            <span className="text-xs text-gray-400">({consultations.length})</span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Consultas puerperais sao criadas na pagina da gestacao
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mb-3" />
          <p className="font-medium">Nenhuma consulta puerperal</p>
          <p className="text-sm mt-1">
            Acesse a gestacao da paciente para registrar consultas pos-parto.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c: any) => {
            const days = val(c, 'daysPostpartum') ?? 0;
            const isExpanded = expandedId === c.id;
            const alerts = c.alerts ?? [];
            const urgentCount = alerts.filter((a: any) => a.level === 'critical' || a.level === 'urgent').length;
            const warnCount = alerts.filter((a: any) => a.level === 'attention').length;
            const deliveryType = val(c, 'deliveryType') ?? c.delivery_type;
            const deliveryDate = c.delivery_date;
            const bp = val(c, 'bpSystolic');
            const bpD = val(c, 'bpDiastolic');
            const involution = val(c, 'uterineInvolution');
            const lochia = val(c, 'lochiaType');
            const lochiaAmt = val(c, 'lochiaAmount');
            const lochiaOdor = val(c, 'lochiaOdor');
            const wound = val(c, 'woundStatus');
            const bf = val(c, 'breastfeedingStatus');
            const breast = val(c, 'breastCondition');
            const mood = val(c, 'moodScreening');
            const epds = val(c, 'epdsScore');
            const weight = val(c, 'weightKg');
            const temp = val(c, 'temperature');
            const hr = val(c, 'heartRate');
            const contraDisc = val(c, 'contraceptionDiscussed');
            const contraMethod = val(c, 'contraceptionMethod');
            const nb = c.newborn_data ?? c.newbornData;
            const subj = c.subjective;
            const plan = c.plan;

            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-lilac/10 text-lilac text-xs font-semibold rounded-full">
                      {days}d pos-parto
                    </span>
                    <span className="text-sm text-gray-700">{fmtDate(c.date)}</span>
                    {deliveryType && (
                      <span className="text-xs text-gray-400">{DELIVERY[deliveryType] ?? deliveryType}</span>
                    )}
                    {nb && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded">RN</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {urgentCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> {urgentCount}
                      </span>
                    )}
                    {warnCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> {warnCount}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 space-y-4">
                    {/* Alerts */}
                    {alerts.length > 0 && (
                      <div className="space-y-1">
                        {alerts.map((a: any, i: number) => (
                          <div key={i} className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                            a.level === 'critical' ? 'bg-red-50 text-red-700' :
                            a.level === 'urgent' ? 'bg-amber-50 text-amber-700' :
                            'bg-blue-50 text-blue-700',
                          )}>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {a.message}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sinais Vitais */}
                    <Section title="Sinais Vitais">
                      <Grid>
                        {bp && <Field label="PA" value={`${bp}/${bpD}`} danger={bp >= 140} />}
                        {weight && <Field label="Peso" value={`${weight} kg`} />}
                        {temp && <Field label="Temperatura" value={`${temp}°C`} danger={Number(temp) >= 38} />}
                        {hr && <Field label="FC" value={`${hr} bpm`} />}
                      </Grid>
                    </Section>

                    {/* Útero e Lóquios */}
                    {(involution || lochia) && (
                      <Section title="Utero e Loquios">
                        <Grid>
                          {involution && <Field label="Involucao" value={INVOLUTION[involution] ?? involution} />}
                          {val(c, 'fundalHeightCm') && <Field label="AU" value={`${val(c, 'fundalHeightCm')} cm`} />}
                          {lochia && <Field label="Loquios" value={LOCHIA[lochia] ?? lochia} />}
                          {lochiaAmt && <Field label="Quantidade" value={lochiaAmt === 'scant' ? 'Escassa' : lochiaAmt === 'moderate' ? 'Moderada' : 'Abundante'} danger={lochiaAmt === 'heavy'} />}
                          {lochiaOdor && <Field label="Odor fetido" value="Sim" danger />}
                        </Grid>
                      </Section>
                    )}

                    {/* Ferida */}
                    {wound && wound !== 'not_applicable' && (
                      <Section title="Ferida Operatoria">
                        <Grid>
                          <Field label="Status" value={WOUND[wound] ?? wound} danger={wound === 'infection'} />
                          {val(c, 'woundNotes') && <Field label="Obs" value={val(c, 'woundNotes')} span={2} />}
                        </Grid>
                      </Section>
                    )}

                    {/* Mamas */}
                    {(bf || breast) && (
                      <Section title="Mamas e Amamentacao">
                        <Grid>
                          {bf && <Field label="Aleitamento" value={BF[bf] ?? bf} />}
                          {breast && <Field label="Condicao" value={BREAST[breast] ?? breast} danger={breast === 'mastitis' || breast === 'abscess'} />}
                          {val(c, 'breastfeedingNotes') && <Field label="Obs" value={val(c, 'breastfeedingNotes')} span={2} />}
                        </Grid>
                      </Section>
                    )}

                    {/* Saúde Mental */}
                    {(mood || epds != null) && (
                      <Section title="Saude Mental">
                        <Grid>
                          {mood && <Field label="Humor" value={MOOD[mood] ?? mood} danger={mood === 'severe' || mood === 'moderate'} />}
                          {epds != null && <Field label="EPDS" value={String(epds)} danger={epds >= 13} />}
                          {val(c, 'moodNotes') && <Field label="Obs" value={val(c, 'moodNotes')} span={2} />}
                        </Grid>
                      </Section>
                    )}

                    {/* Contracepção */}
                    {contraDisc && (
                      <Section title="Contracepcao">
                        <Grid>
                          <Field label="Discutida" value="Sim" />
                          {contraMethod && <Field label="Metodo" value={contraMethod} />}
                        </Grid>
                      </Section>
                    )}

                    {/* Dados do RN */}
                    {nb && (
                      <Section title="Recem-Nascido">
                        <Grid>
                          {nb.currentWeight && <Field label="Peso" value={`${nb.currentWeight}g`} />}
                          {nb.feedingWell != null && <Field label="Amamentando bem" value={nb.feedingWell ? 'Sim' : 'Nao'} />}
                          {nb.jaundice != null && <Field label="Ictericia" value={nb.jaundice ? 'Sim' : 'Nao'} danger={nb.jaundice} />}
                          {nb.umbilicalStump && <Field label="Coto" value={nb.umbilicalStump === 'attached' ? 'Aderido' : nb.umbilicalStump === 'fallen' ? 'Caiu' : 'Infectado'} danger={nb.umbilicalStump === 'infected'} />}
                          {nb.heelPrickDone != null && <Field label="Pezinho" value={nb.heelPrickDone ? 'Feito' : 'Pendente'} />}
                          {nb.hearingScreenDone != null && <Field label="Orelhinha" value={nb.hearingScreenDone ? 'Feito' : 'Pendente'} />}
                          {nb.redReflexDone != null && <Field label="Olhinho" value={nb.redReflexDone ? 'Feito' : 'Pendente'} />}
                          {nb.vaccinesUpToDate != null && <Field label="Vacinas" value={nb.vaccinesUpToDate ? 'Em dia' : 'Pendentes'} />}
                          {nb.notes && <Field label="Obs" value={nb.notes} span={2} />}
                        </Grid>
                      </Section>
                    )}

                    {/* SOAP */}
                    {(subj || plan) && (
                      <Section title="Avaliacao">
                        {subj && <div className="mb-2"><p className="text-[10px] text-gray-500 uppercase mb-0.5">Queixas</p><p className="text-xs text-gray-700">{subj}</p></div>}
                        {plan && <div><p className="text-[10px] text-gray-500 uppercase mb-0.5">Conduta</p><p className="text-xs text-gray-700">{plan}</p></div>}
                      </Section>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <button
                        onClick={() => { if (window.confirm('Excluir esta consulta puerperal?')) deleteMut.mutate(c.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{title}</h4>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">{children}</div>;
}

function Field({ label, value, danger, span }: { label: string; value: string; danger?: boolean; span?: number }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={cn('text-xs font-medium', danger ? 'text-red-600' : 'text-gray-800')}>{value}</p>
    </div>
  );
}
