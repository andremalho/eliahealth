import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, Users, Plus } from 'lucide-react';
import { fetchPatients, searchPatients, type Patient } from '../../api/patients.api';
import { cn } from '../../utils/cn';
import { toTitleCase, formatCPF, formatDate } from '../../utils/formatters';
import NewPatientStandaloneModal from './NewPatientStandaloneModal';

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded', className)} />;
}

export default function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'list', search],
    queryFn: () =>
      search.trim().length >= 2
        ? searchPatients(search.trim())
        : fetchPatients(1, 50),
  });

  const patients = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Pacientes</h1>
          <p className="text-sm text-gray-500">
            {total > 0 ? `${total} ${total === 1 ? 'paciente' : 'pacientes'}` : 'Prontuário de saúde da mulher'}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-lilac text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-4 h-4" />
          Nova paciente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b">
          <h2 className="text-lg font-semibold text-navy">Lista de pacientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac"
            />
          </div>
        </div>

        <div className="divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            ))
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Users className="w-12 h-12 mb-3" />
              <p className="font-medium">
                {search ? 'Nenhuma paciente encontrada' : 'Nenhuma paciente cadastrada'}
              </p>
              {!search && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-lilac text-white text-sm rounded-lg hover:bg-primary-dark transition"
                >
                  Cadastrar primeira paciente
                </button>
              )}
            </div>
          ) : (
            patients.map((p) => (
              <PatientRow
                key={p.id}
                patient={p}
                onClick={() => navigate(`/patients/${p.id}`)}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-400">
        Para cadastrar uma <strong>gestante</strong>, utilize "Nova Gestante" no
        Dashboard — o fluxo já cria a paciente, a gestação e abre o prontuário de
        pré-natal.
      </div>

      {modalOpen && <NewPatientStandaloneModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function PatientRow({ patient: p, onClick }: { patient: Patient; onClick: () => void }) {
  const initials = p.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const age = calcAge(p.dateOfBirth);

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer transition group"
    >
      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{toTitleCase(p.fullName)}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span>CPF {formatCPF(p.cpf)}</span>
          {age !== null && <span>{age} anos</span>}
          {p.bloodType && (
            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium">
              {p.bloodType}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-400 hidden sm:block">
        Cadastrada {formatDate(p.createdAt)}
      </span>
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-lilac transition shrink-0" />
    </div>
  );
}
