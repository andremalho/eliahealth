import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Stethoscope,
  Activity,
  Pill,
  Sparkles,
  Baby,
  Flower2,
  ClipboardCheck,
  Phone,
  Mail,
  Cake,
} from 'lucide-react';
import { fetchPatient } from '../../api/patients.api';
import { cn } from '../../utils/cn';
import { toTitleCase, formatCPF, formatPhone } from '../../utils/formatters';
import GynecologySection from './sections/GynecologySection';
import MenstrualCycleSection from './sections/MenstrualCycleSection';
import ContraceptionSection from './sections/ContraceptionSection';

type ModuleKey =
  | 'gynecology'
  | 'menstrual'
  | 'contraception'
  | 'infertility'
  | 'art'
  | 'menopause'
  | 'preventive';

interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  available: boolean;
}

const MODULES: ModuleDef[] = [
  { key: 'gynecology', label: 'Ginecologia', icon: Stethoscope, available: true },
  { key: 'menstrual', label: 'Ciclo / SUA', icon: Activity, available: true },
  { key: 'contraception', label: 'Contracepção', icon: Pill, available: true },
  { key: 'infertility', label: 'Infertilidade', icon: Sparkles, available: false },
  { key: 'art', label: 'Reprodução Assistida', icon: Baby, available: false },
  { key: 'menopause', label: 'Menopausa', icon: Flower2, available: false },
  { key: 'preventive', label: 'Rastreios', icon: ClipboardCheck, available: false },
];

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

export default function PatientPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<ModuleKey>('gynecology');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetchPatient(patientId!),
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 text-center text-gray-500">
        Paciente não encontrada.
      </div>
    );
  }

  const age = calcAge(patient.dateOfBirth);
  const initials = patient.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para pacientes
      </button>

      {/* Header da paciente */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-navy text-white flex items-center justify-center text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-navy">
              {toTitleCase(patient.fullName)}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
              <span>CPF {formatCPF(patient.cpf)}</span>
              {age !== null && (
                <span className="flex items-center gap-1.5">
                  <Cake className="w-4 h-4 text-gray-400" />
                  {age} anos
                </span>
              )}
              {patient.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {formatPhone(patient.phone)}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {patient.email}
                </span>
              )}
              {patient.bloodType && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium">
                  {patient.bloodType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.key;
            return (
              <button
                key={m.key}
                onClick={() => m.available && setActiveModule(m.key)}
                disabled={!m.available}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition border-b-2',
                  isActive
                    ? 'border-lilac text-lilac bg-lilac/5'
                    : m.available
                      ? 'border-transparent text-gray-600 hover:text-navy hover:bg-gray-50'
                      : 'border-transparent text-gray-300 cursor-not-allowed',
                )}
              >
                <Icon className="w-4 h-4" />
                {m.label}
                {!m.available && (
                  <span className="ml-1 text-[10px] uppercase font-bold text-gray-300">
                    em breve
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeModule === 'gynecology' && (
            <GynecologySection patientId={patient.id} />
          )}
          {activeModule === 'menstrual' && (
            <MenstrualCycleSection patientId={patient.id} />
          )}
          {activeModule === 'contraception' && (
            <ContraceptionSection patientId={patient.id} />
          )}
          {activeModule !== 'gynecology' &&
            activeModule !== 'menstrual' &&
            activeModule !== 'contraception' && (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="font-medium">Módulo em desenvolvimento</p>
              <p className="text-sm mt-1">
                Backend pronto, interface será adicionada em breve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
