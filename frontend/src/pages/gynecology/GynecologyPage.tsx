import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Stethoscope, Activity, Pill, Sparkles, Baby, Flower2, ClipboardCheck,
  Search, Plus, ChevronRight, ArrowLeft,
} from 'lucide-react';
import api from '../../api/client';
import { fetchPatients } from '../../api/patients.api';
import { cn } from '../../utils/cn';
import { toTitleCase } from '../../utils/formatters';
import GynecologySection from '../patients/sections/GynecologySection';
import MenstrualCycleSection from '../patients/sections/MenstrualCycleSection';
import ContraceptionSection from '../patients/sections/ContraceptionSection';
import PreventiveExamSection from '../patients/sections/PreventiveExamSection';
import MenopauseSection from '../patients/sections/MenopauseSection';
import InfertilitySection from '../patients/sections/InfertilitySection';
import AssistedReproductionSection from '../patients/sections/AssistedReproductionSection';

type ModuleKey = 'gynecology' | 'menstrual' | 'contraception' | 'infertility' | 'art' | 'menopause' | 'preventive';

const MODULES: { key: ModuleKey; label: string; icon: React.ElementType }[] = [
  { key: 'gynecology', label: 'Ginecologia', icon: Stethoscope },
  { key: 'menstrual', label: 'Ciclo / SUA', icon: Activity },
  { key: 'contraception', label: 'Contracepcao', icon: Pill },
  { key: 'infertility', label: 'Infertilidade', icon: Sparkles },
  { key: 'art', label: 'Reproducao Assistida', icon: Baby },
  { key: 'menopause', label: 'Menopausa', icon: Flower2 },
  { key: 'preventive', label: 'Rastreios', icon: ClipboardCheck },
];

const SECTION_COMPONENTS: Record<ModuleKey, React.ComponentType<{ patientId: string; autoOpenModal?: boolean }>> = {
  gynecology: GynecologySection,
  menstrual: MenstrualCycleSection,
  contraception: ContraceptionSection,
  preventive: PreventiveExamSection,
  menopause: MenopauseSection,
  infertility: InfertilitySection,
  art: AssistedReproductionSection,
};

async function searchPatientsApi(query: string) {
  if (!query || query.length < 2) return [];
  const { data } = await api.get('/patients', { params: { search: query, limit: 8 } });
  return (data?.data ?? data ?? []) as { id: string; fullName: string; cpf: string }[];
}

export default function GynecologyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeModule, setActiveModule] = useState<ModuleKey>('gynecology');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; fullName: string } | null>(null);
  const [search, setSearch] = useState('');
  const [listPage, setListPage] = useState(1);

  // Auto-select patient from query params
  const paramId = searchParams.get('patientId');
  const paramName = searchParams.get('patientName');
  const isNewConsultation = searchParams.get('newConsultation') === '1';
  useEffect(() => {
    if (paramId && paramName && !selectedPatient) {
      setSelectedPatient({ id: paramId, fullName: paramName });
    }
  }, [paramId, paramName]);

  // Patient list (when no patient selected)
  const { data: patientList, isLoading: loadingList } = useQuery({
    queryKey: ['patients-list', listPage, search],
    queryFn: async () => {
      if (search.length >= 2) {
        const results = await searchPatientsApi(search);
        return { data: results, total: results.length, totalPages: 1 };
      }
      return fetchPatients(listPage, 20);
    },
    enabled: !selectedPatient,
  });

  const ActiveSection = SECTION_COMPONENTS[activeModule];

  // Patient selected -> show modules
  if (selectedPatient) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-navy">Ginecologia</h1>
            <p className="text-sm text-gray-500 mt-0.5">{toTitleCase(selectedPatient.fullName)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b">
            {MODULES.map((m) => {
              const Icon = m.icon;
              const isActive = activeModule === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setActiveModule(m.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition border-b-2',
                    isActive ? 'border-lilac text-lilac bg-lilac/5' : 'border-transparent text-gray-600 hover:text-navy hover:bg-gray-50',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="p-6">
            <ActiveSection patientId={selectedPatient.id} autoOpenModal={isNewConsultation && activeModule === 'gynecology'} />
          </div>
        </div>
      </div>
    );
  }

  // No patient selected -> show patient list
  const patients = patientList?.data ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Ginecologia</h1>
          <p className="text-sm text-gray-500 mt-1">{patientList?.total ?? 0} pacientes</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setListPage(1); }}
              placeholder="Buscar paciente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            />
          </div>
        </div>

        <div className="divide-y">
          {loadingList ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></div>
              </div>
            ))
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Stethoscope className="w-12 h-12 mb-3" />
              <p className="font-medium">Nenhuma paciente encontrada</p>
            </div>
          ) : (
            patients.map((p) => {
              const initials = p.fullName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient({ id: p.id, fullName: p.fullName })}
                  className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
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

        {/* Pagination */}
        {(patientList?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={listPage <= 1} onClick={() => setListPage(listPage - 1)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40">Anterior</button>
            <span className="text-xs text-gray-500">Pagina {listPage} de {patientList?.totalPages}</span>
            <button disabled={listPage >= (patientList?.totalPages ?? 1)} onClick={() => setListPage(listPage + 1)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40">Proxima</button>
          </div>
        )}
      </div>
    </div>
  );
}
