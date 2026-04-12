import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Search, Plus, Stethoscope } from 'lucide-react';
import api from '../../api/client';
import { toTitleCase } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';

async function searchPatients(q: string) {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/patients', { params: { search: q, limit: 8 } });
  return (data?.data ?? data ?? []) as { id: string; fullName: string; cpf: string }[];
}

export default function ClinicalPage() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; fullName: string } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const { data: results } = useQuery({
    queryKey: ['patient-search-clinical', search],
    queryFn: () => searchPatients(search),
    enabled: search.length >= 2 && !selectedPatient,
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Consulta Clinica Geral</h1>
          <p className="text-sm text-gray-500 mt-0.5">SOAP + sinais vitais + CID-10</p>
        </div>
      </div>

      {/* Patient selector */}
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
                onFocus={() => { if (search.length >= 2) setShowResults(true); }}
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
        <Card>
          <EmptyState
            icon={<Stethoscope className="w-12 h-12" />}
            title="Selecione uma paciente"
            description="Use a busca acima para encontrar a paciente e registrar uma consulta clinica"
          />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<ClipboardList className="w-12 h-12" />}
            title="Consultas clinicas"
            description="Modulo de consulta clinica geral com SOAP, sinais vitais, CID-10 e prescricao"
            action={
              <Button icon={<Plus className="w-4 h-4" />}>Nova consulta</Button>
            }
          />
        </Card>
      )}
    </div>
  );
}
