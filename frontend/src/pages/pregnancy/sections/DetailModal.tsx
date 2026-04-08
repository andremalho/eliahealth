import { X, Pencil, Trash2 } from 'lucide-react';

export interface DetailField {
  label: string;
  value: any;
  multiline?: boolean;
  span?: 1 | 2 | 3;
}

interface Props {
  title: string;
  fields: DetailField[];
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

function formatValue(value: any): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '—';
  return String(value);
}

export default function DetailModal({ title, fields, onEdit, onDelete, onClose }: Props) {
  const visibleFields = fields.filter((f) => f.value != null && f.value !== '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-navy">{title}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-lilac" title="Editar">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {visibleFields.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem informações para exibir</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {visibleFields.map((f, i) => (
                <div key={i} className={f.span === 2 ? 'col-span-2' : f.span === 3 ? 'col-span-2' : ''}>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{f.label}</p>
                  <p className={`text-sm text-gray-800 ${f.multiline ? 'whitespace-pre-line' : ''}`}>
                    {formatValue(f.value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
