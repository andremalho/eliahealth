import { X, Baby, Heart, Stethoscope, FileText } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSelect: (area: 'gynecology' | 'obstetrics' | 'clinical' | 'ultrasound') => void;
}

const areas = [
  { key: 'obstetrics' as const, icon: Baby, label: 'Obstetricia', desc: 'Acompanhamento gestacional' },
  { key: 'gynecology' as const, icon: Heart, label: 'Ginecologia', desc: 'Consulta ginecologica' },
  { key: 'clinical' as const, icon: Stethoscope, label: 'Clinica Medica', desc: 'Consulta clinica geral' },
  { key: 'ultrasound' as const, icon: FileText, label: 'Ultrassonografia', desc: 'Laudo de ultrassom' },
];

export default function NewPatientChooserModal({ onClose, onSelect }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-navy">Nova Paciente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">Selecione a area de atendimento:</p>
          <div className="grid grid-cols-2 gap-3">
            {areas.map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-xl hover:border-lilac hover:bg-lilac/5 transition text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-lilac/10 text-lilac flex items-center justify-center group-hover:bg-lilac group-hover:text-white transition">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
