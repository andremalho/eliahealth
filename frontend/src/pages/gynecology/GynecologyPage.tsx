import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Stethoscope, Activity, Pill, Sparkles, Baby, Flower2, ClipboardCheck,
  Search,
} from 'lucide-react';
import api from '../../api/client';
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

const SECTION_COMPONENTS: Record<ModuleKey, React.ComponentType<{ patientId: string }>> = {
  gynecology: GynecologySection,
  menstrual: MenstrualCycleSection,
  contraception: ContraceptionSection,
  preventive: PreventiveExamSection,
  menopause: MenopauseSection,
  infertility: InfertilitySection,
  art: AssistedReproductionSection,
};

async function searchPatients(query: string) {
  if (!query || query.length < 2) return [];
  const { data } = await api.get('/patients', { params: { search: query, limit: 8 } });
  return (data?.data ?? data ?? []) as { id: string; fullName: string; cpf: string }[];
}

export default function GynecologyPage() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('gynecology');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; fullName: string } | null>(null);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: results } = useQuery({
    queryKey: ['patient-search', search],
    queryFn: () => searchPatients(search),
    enabled: search.length >= 2,
  });

  const selectPatient = (p: { id: string; fullName: string }) => {
    setSelectedPatient(p);
    setSearch('');
    setShowResults(false);
  };

  const ActiveSection = SECTION_COMPONENTS[activeModule];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with patient selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Ginecologia</h1>
          <p className="text-sm text-gray-500 mt-0.5">Prontuario ginecologico completo</p>
        </div>

        {/* Patient selector */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={selectedPatient ? toTitleCase(selectedPatient.fullName) : search}
            onChange={(e) => {
              if (selectedPatient) setSelectedPatient(null);
              setSearch(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => { if (!selectedPatient && search.length >= 2) setShowResults(true); }}
            placeholder="Buscar paciente..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
          />
          {selectedPatient && (
            <button
              onClick={() => { setSelectedPatient(null); setSearch(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Trocar
            </button>
          )}

          {showResults && results && results.length > 0 && !selectedPatient && (
            <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {p.fullName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{toTitleCase(p.fullName)}</p>
                    <p className="text-xs text-gray-400">{p.cpf}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!selectedPatient ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center py-20 text-gray-400">
          <Stethoscope className="w-12 h-12 mb-4" />
          <p className="text-lg font-medium text-gray-500">Selecione uma paciente</p>
          <p className="text-sm mt-1">Use a busca acima para encontrar a paciente</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Module tabs */}
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
                    isActive
                      ? 'border-lilac text-lilac bg-lilac/5'
                      : 'border-transparent text-gray-600 hover:text-navy hover:bg-gray-50',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            <ActiveSection patientId={selectedPatient.id} />
          </div>
        </div>
      )}
    </div>
  );
}
