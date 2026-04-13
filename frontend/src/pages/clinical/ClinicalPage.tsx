import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Pencil, AlertCircle, ChevronDown, ChevronUp, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/client';
import { fetchPatients } from '../../api/patients.api';
import { fetchClinicalConsultations, deleteClinicalConsultation } from '../../api/clinical-consultations.api';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { DeleteButton } from '../../components/forms/DeleteButton';
import NewClinicalConsultationModal from './NewClinicalConsultationModal';

async function searchPatients(q: string) {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/patients', { params: { search: q, limit: 8 } });
  return (data?.data ?? data ?? []) as { id: string; fullName: string; cpf: string }[];
}

function fmtDate(d: any): string {
  if (!d) return '—';
  try { return new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR'); } catch { return '—'; }
}

export default function ClinicalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; fullName: string } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [listSearch, setListSearch] = useState('');

  // Auto-select patient and open consultation modal from query params
  const paramId = searchParams.get('patientId');
  const paramName = searchParams.get('patientName');
  const isNewConsultation = searchParams.get('newConsultation') === '1';
  useEffect(() => {
    if (paramId && paramName && !selectedPatient) {
      setSelectedPatient({ id: paramId, fullName: paramName });
      if (isNewConsultation) {
        setEditing(null);
        setModalOpen(true);
      }
    }
  }, [paramId, paramName]);

  const { data: results } = useQuery({
    queryKey: ['patient-search-clinical', search],
    queryFn: () => searchPatients(search),
    enabled: search.length >= 2 && !selectedPatient,
  });

  const { data: patientList, isLoading: loadingList } = useQuery({
    queryKey: ['patients-list-clinical', listPage, listSearch],
    queryFn: async () => {
      if (listSearch.length >= 2) {
        const r = await searchPatients(listSearch);
        return { data: r, total: r.length, totalPages: 1 };
      }
      return fetchPatients(listPage, 20);
    },
    enabled: !selectedPatient,
  });

  const { data: consultations } = useQuery({
    queryKey: ['clinical-consultations', selectedPatient?.id],
    queryFn: () => fetchClinicalConsultations(selectedPatient!.id),
    enabled: !!selectedPatient?.id,
  });

  const deleteMut = useMutation({
    mutationFn: deleteClinicalConsultation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical-consultations', selectedPatient?.id] });
      toast.success('Consulta excluida');
    },
  });

  const items = consultations?.data ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-navy">Consulta Clinica Medica</h1>
            <p className="text-sm text-gray-500 mt-0.5">SOAP + sinais vitais + CID-10</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
        {selectedPatient && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Nova consulta
          </Button>
        )}
      </div>

      <Card className="mb-6" padding="md">
        <div className="relative max-w-md">
          {selectedPatient ? (
            <div className="flex items-center justify-between px-3 py-2.5 bg-lilac/5 border border-lilac/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar name={selectedPatient.fullName} size="sm" />
                <span className="text-sm font-medium text-navy">{toTitleCase(selectedPatient.fullName)}</span>
              </div>
              <button onClick={() => { setSelectedPatient(null); setSearch(''); }}
                className="text-xs text-gray-400 hover:text-gray-600">Trocar</button>
            </div>
          ) : (
            <>
              <SearchInput value={search}
                onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
                placeholder="Buscar paciente por nome ou CPF..." />
              {showResults && results && results.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedPatient(p); setShowResults(false); setSearch(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                      <Avatar name={p.fullName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{toTitleCase(p.fullName)}</p>
                        <p className="text-xs text-gray-400">{p.cpf}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {!selectedPatient ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={listSearch} onChange={(e) => { setListSearch(e.target.value); setListPage(1); }}
                placeholder="Buscar paciente..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac" />
            </div>
          </div>
          <div className="divide-y">
            {loadingList ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-5"><div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" /><div className="flex-1"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></div></div>
              ))
            ) : (patientList?.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <ClipboardList className="w-12 h-12 mb-3" />
                <p className="font-medium">Nenhuma paciente encontrada</p>
              </div>
            ) : (
              (patientList?.data ?? []).map((p: any) => {
                const initials = p.fullName.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('');
                return (
                  <div key={p.id} onClick={() => { setSelectedPatient({ id: p.id, fullName: p.fullName }); setSearch(''); }}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition group">
                    <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{toTitleCase(p.fullName)}</p>
                      <p className="text-xs text-gray-400">{p.cpf}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-lilac transition shrink-0" />
                  </div>
                );
              })
            )}
          </div>
          {(patientList?.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <button disabled={listPage <= 1} onClick={() => setListPage(listPage - 1)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40">Anterior</button>
              <span className="text-xs text-gray-500">Pagina {listPage} de {patientList?.totalPages}</span>
              <button disabled={listPage >= (patientList?.totalPages ?? 1)} onClick={() => setListPage(listPage + 1)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40">Proxima</button>
            </div>
          )}
        </div>
      ) : items.length === 0 ? (
        <Card><EmptyState icon={<ClipboardList className="w-12 h-12" />} title="Nenhuma consulta clinica"
          action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>Nova consulta</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((c: any) => {
            const isExp = expandedId === c.id;
            const alerts = c.alerts ?? [];
            return (
              <Card key={c.id} padding="none">
                <button onClick={() => setExpandedId(isExp ? null : c.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-navy">{fmtDate(c.date)}</span>
                    {c.specialty && <Badge variant="outline">{c.specialty}</Badge>}
                    {c.diagnosis && <span className="text-xs text-gray-500 truncate max-w-[200px]">{c.diagnosis}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {alerts.length > 0 && <Badge variant="danger">{alerts.length}</Badge>}
                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {isExp && (
                  <div className="border-t px-5 py-4 space-y-3">
                    {alerts.map((a: any, i: number) => (
                      <div key={i} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
                        a.level === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {a.message}
                      </div>
                    ))}
                    {(c.bpSystolic || c.bp_systolic) && <p className="text-xs"><strong>PA:</strong> {c.bpSystolic ?? c.bp_systolic}/{c.bpDiastolic ?? c.bp_diastolic}</p>}
                    {c.subjective && <div><p className="text-[10px] text-gray-500 uppercase">Subjetivo</p><p className="text-xs text-gray-700">{c.subjective}</p></div>}
                    {c.objective && <div><p className="text-[10px] text-gray-500 uppercase">Objetivo</p><p className="text-xs text-gray-700">{c.objective}</p></div>}
                    {c.assessment && <div><p className="text-[10px] text-gray-500 uppercase">Avaliacao</p><p className="text-xs text-gray-700">{c.assessment}</p></div>}
                    {c.plan && <div><p className="text-[10px] text-gray-500 uppercase">Plano</p><p className="text-xs text-gray-700">{c.plan}</p></div>}
                    <div className="flex justify-end gap-1 pt-2 border-t">
                      <button onClick={() => { setEditing(c); setModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-lilac rounded"><Pencil className="w-4 h-4" /></button>
                      <DeleteButton onConfirm={() => deleteMut.mutate(c.id)} label="Excluir consulta" />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {modalOpen && selectedPatient && (
        <NewClinicalConsultationModal patientId={selectedPatient.id} initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }} />
      )}
    </div>
  );
}
