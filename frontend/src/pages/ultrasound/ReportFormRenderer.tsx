import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { ReportTemplate, ReportSection, ReportField } from '../../data/report-templates';
import { cn } from '../../utils/cn';

interface Props {
  template: ReportTemplate;
  values: Record<string, unknown>;
  onChange: (id: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function ReportFormRenderer({ template, values, onChange, readOnly }: Props) {
  const numFetos = Number(values['num_fetos'] ?? values['num_fetos_ini'] ?? values['num_fetos_obs'] ??
    values['num_fetos_dop'] ?? values['num_fetos_eco'] ?? values['num_fetos_neuro'] ?? values['num_fetos_pbf'] ?? 1);

  return (
    <div className="space-y-4">
      {template.sections.map((section) => {
        if (section.apenasMultipla && numFetos < 2) return null;
        return <SectionRenderer key={section.id} section={section} values={values} onChange={onChange} readOnly={readOnly} />;
      })}
    </div>
  );
}

function SectionRenderer({ section, values, onChange, readOnly }: {
  section: ReportSection; values: Record<string, unknown>; onChange: (id: string, value: unknown) => void; readOnly?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition">
        <h3 className="text-sm font-semibold text-navy">{section.title}</h3>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="p-5 space-y-3">
          {section.fields.map((f) => <FieldRenderer key={f.id} field={f} values={values} onChange={onChange} readOnly={readOnly} />)}
        </div>
      )}
    </div>
  );
}

function FieldRenderer({ field, values, onChange, readOnly, depth = 0 }: {
  field: ReportField; values: Record<string, unknown>; onChange: (id: string, value: unknown) => void; readOnly?: boolean; depth?: number;
}) {
  const val = values[field.id] as string ?? '';

  if (field.type === 'group') {
    return (
      <div className={cn('space-y-3', depth > 0 ? 'pl-4 border-l-2 border-lilac/20' : 'bg-gray-50/50 rounded-lg p-4')}>
        <p className="text-xs font-semibold text-gray-500 uppercase">{field.label}</p>
        {field.fields?.map((f) => <FieldRenderer key={f.id} field={f} values={values} onChange={onChange} readOnly={readOnly} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1">
        {field.label}
        {field.required && <span className="text-red-400">*</span>}
        {field.unit && <span className="text-gray-400">({field.unit})</span>}
        {field.guideline && (
          <span className="group relative">
            <Info className="w-3 h-3 text-gray-300 cursor-help" />
            <span className="absolute z-50 bottom-full left-0 mb-1 hidden group-hover:block bg-navy text-white text-[10px] px-2 py-1 rounded shadow-lg max-w-xs">
              {field.guideline}
            </span>
          </span>
        )}
      </label>

      {field.type === 'text' && (
        <input type="text" value={val} onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder} disabled={readOnly} className={iCn} />
      )}

      {field.type === 'number' && (
        <input type="number" value={val} onChange={(e) => onChange(field.id, e.target.value)}
          min={field.min} max={field.max} placeholder={field.placeholder} disabled={readOnly} className={iCn} />
      )}

      {field.type === 'date' && (
        <input type="date" value={val} onChange={(e) => onChange(field.id, e.target.value)}
          disabled={readOnly} className={iCn} />
      )}

      {field.type === 'textarea' && (
        <textarea value={val} onChange={(e) => onChange(field.id, e.target.value)}
          placeholder={field.placeholder} rows={3} disabled={readOnly} className={cn(iCn, 'resize-none')} />
      )}

      {field.type === 'select' && (
        <select value={val} onChange={(e) => onChange(field.id, e.target.value)}
          disabled={readOnly} className={iCn}>
          <option value="">—</option>
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {field.type === 'multiselect' && (
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((o) => {
            const selected = Array.isArray(values[field.id]) && (values[field.id] as string[]).includes(o);
            return (
              <button key={o} type="button" disabled={readOnly}
                onClick={() => {
                  const current = (Array.isArray(values[field.id]) ? values[field.id] : []) as string[];
                  onChange(field.id, selected ? current.filter((v) => v !== o) : [...current, o]);
                }}
                className={cn('px-2 py-1 text-[10px] rounded-full border transition',
                  selected ? 'bg-lilac text-white border-lilac' : 'bg-white text-gray-600 border-gray-200 hover:border-lilac')}>
                {o}
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'boolean' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!values[field.id]} disabled={readOnly}
            onChange={(e) => onChange(field.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-lilac" />
          <span className="text-xs text-gray-700">{field.label}</span>
        </label>
      )}
    </div>
  );
}

const iCn = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac disabled:bg-gray-50 disabled:text-gray-500';
