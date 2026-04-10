import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope, Baby, Plus, FileText, Pencil, Shield, Send, Download,
  ChevronDown, ChevronUp, Search, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { templatesByCategory, reportTemplates, type ReportTemplate } from '../../data/report-templates';
import {
  fetchReportsByPatient, createReport, signReport, deleteReport,
  STATUS_LABELS, STATUS_COLORS, type UltrasoundReportItem,
} from '../../api/ultrasound-reports.api';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import ReportFormRenderer from './ReportFormRenderer';
import { DeleteButton } from '../../components/forms/DeleteButton';

type Tab = 'obstetrica' | 'ginecologica';

async function searchPatients(q: string) {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/patients', { params: { search: q, limit: 6 } });
  return (data?.data ?? data ?? []) as { id: string; fullName: string; cpf: string }[];
}

export default function UltrasoundPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('obstetrica');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; fullName: string } | null>(null);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [viewingReport, setViewingReport] = useState<UltrasoundReportItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-us', search],
    queryFn: () => searchPatients(search),
    enabled: search.length >= 2 && !selectedPatient,
  });

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ['us-reports', selectedPatient?.id],
    queryFn: () => fetchReportsByPatient(selectedPatient!.id),
    enabled: !!selectedPatient?.id,
  });

  const createMut = useMutation({
    mutationFn: () => createReport({
      patientId: selectedPatient!.id,
      templateId: selectedTemplate!.id,
      category: selectedTemplate!.category,
      reportDate: (formValues.data_exame as string) ?? new Date().toISOString().split('T')[0],
      data: formValues,
      conclusion: formValues.conclusao_principal as string,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['us-reports'] });
      toast.success('Laudo salvo como rascunho');
      setSelectedTemplate(null);
      setFormValues({});
    },
    onError: () => toast.error('Erro ao salvar laudo'),
  });

  const signMut = useMutation({
    mutationFn: (id: string) => signReport(id, user?.name ?? '', (user as any)?.crm ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['us-reports'] });
      toast.success('Laudo assinado digitalmente');
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['us-reports'] });
      toast.success('Laudo excluido');
    },
  });

  const handleFieldChange = (id: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [id]: value }));
  };

  const templates = templatesByCategory[tab];
  const patientReports = (reports ?? []).filter((r: UltrasoundReportItem) => r.category === tab);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Ultrassonografia</h1>
          <p className="text-sm text-gray-500 mt-0.5">Laudos estruturados com assinatura digital</p>
        </div>
      </div>

      {/* Patient selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {selectedPatient ? (
            <div className="flex items-center justify-between pl-10 pr-3 py-2.5 bg-lilac/5 border border-lilac/20 rounded-lg">
              <span className="text-sm font-medium text-navy">{toTitleCase(selectedPatient.fullName)}</span>
              <button onClick={() => { setSelectedPatient(null); setSearch(''); setViewingReport(null); setSelectedTemplate(null); }}
                className="text-xs text-gray-400 hover:text-gray-600">Trocar</button>
            </div>
          ) : (
            <>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
                placeholder="Buscar paciente por nome ou CPF..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac" />
              {showResults && patientResults && patientResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedPatient(p); setShowResults(false); setSearch(''); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 text-sm">
                      <span className="font-medium text-gray-800">{toTitleCase(p.fullName)}</span>
                      <span className="text-gray-400 ml-2 text-xs">{p.cpf}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!selectedPatient ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center py-20 text-gray-400">
          <Stethoscope className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium text-gray-500">Selecione uma paciente</p>
        </div>
      ) : selectedTemplate ? (
        /* FORM MODE */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-navy">{selectedTemplate.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{selectedTemplate.guideline_refs[0]}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedTemplate(null); setFormValues({}); }}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={() => createMut.mutate()} disabled={createMut.isPending}
                className="px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2">
                {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar rascunho
              </button>
            </div>
          </div>
          <div className="p-5">
            <ReportFormRenderer template={selectedTemplate} values={formValues} onChange={handleFieldChange} />
          </div>
        </div>
      ) : (
        /* LIST MODE */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {[
              { key: 'obstetrica' as Tab, label: 'Obstetricia', icon: Baby },
              { key: 'ginecologica' as Tab, label: 'Ginecologia', icon: Stethoscope },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={cn('flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition',
                    tab === t.key ? 'border-lilac text-lilac bg-lilac/5' : 'border-transparent text-gray-500 hover:text-navy')}>
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {/* New report buttons */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Novo laudo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => { setSelectedTemplate(t); setFormValues({ data_exame: new Date().toISOString().split('T')[0] }); }}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-xs text-gray-700 hover:border-lilac hover:bg-lilac/5 transition text-left">
                    <Plus className="w-3.5 h-3.5 text-lilac shrink-0" />
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Existing reports */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Laudos realizados</p>
              {loadingReports ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : patientReports.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">Nenhum laudo {tab === 'obstetrica' ? 'obstetrico' : 'ginecologico'}</div>
              ) : (
                <div className="space-y-2">
                  {patientReports.map((r: UltrasoundReportItem) => {
                    const tpl = reportTemplates[r.templateId];
                    const isExpanded = expandedId === r.id;
                    return (
                      <div key={r.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-lilac shrink-0" />
                            <div className="text-left">
                              <p className="text-sm font-medium text-navy">{tpl?.name ?? r.templateId}</p>
                              <p className="text-xs text-gray-400">{new Date(r.reportDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full', STATUS_COLORS[r.status])}>
                              {STATUS_LABELS[r.status]}
                            </span>
                            {r.signedAt && <Shield className="w-3.5 h-3.5 text-emerald-600" />}
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t px-4 py-3 space-y-3">
                            {r.conclusion && (
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Conclusao</p>
                                <p className="text-xs text-gray-700">{r.conclusion}</p>
                              </div>
                            )}
                            {r.signedAt && (
                              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                                <Shield className="w-3.5 h-3.5" />
                                Assinado por {r.signedByName} (CRM {r.signedByCrm}) em {new Date(r.signedAt).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                              {r.status === 'draft' && (
                                <>
                                  <button onClick={() => { setSelectedTemplate(reportTemplates[r.templateId]); setFormValues(r.data as Record<string, unknown>); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                  </button>
                                  <button onClick={() => signMut.mutate(r.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg">
                                    <Shield className="w-3.5 h-3.5" /> Assinar
                                  </button>
                                  <DeleteButton onConfirm={() => deleteMut.mutate(r.id)} label="Excluir laudo" />
                                </>
                              )}
                              {(r.status === 'signed' || r.status === 'exported') && (
                                <>
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg">
                                    <Download className="w-3.5 h-3.5" /> Exportar PDF
                                  </button>
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg">
                                    <Send className="w-3.5 h-3.5" /> Enviar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
